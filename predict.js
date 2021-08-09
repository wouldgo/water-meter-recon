'use strict';
// eslint-disable-next-line import/no-unassigned-import
require('make-promises-safe');

const {readdir, mkdir, rename} = require('fs/promises')
  , {parse} = require('path')
  , cv = require('opencv4nodejs')
  , tf = require('@tensorflow/tfjs-node')
  , pino = require('pino')
  , tools = require('./_conf')
  , {
      fromDate,
      howManyFiles,
      prediction,
      influxDb
    } = tools
  , {
      sourceImagesFolder,
      modelFolder,
      disposeFolder,
      labels,
      accuracyFactor
    } = prediction
  , log = pino({
      'level': tools.log.level
    })
  , image = require('./src/images')(cv)
  , modelModule = require('./src/model')
  , {close, writeWaterMeterCounterData} = modelModule({log, influxDb, modelFolder})
  , timeStampMatcher = /.+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z).+/g
  , predictFactory = model => async anImage => {
      const cropped = image(anImage)
        , predictions = [];

      for (let index = 0; index < cropped.length; index += 1) {
        const aRegion = cropped[index]
          , newMat = new cv.Mat(
            aRegion.rows,
            aRegion.cols,
            aRegion.type
          );

        aRegion.copyTo(newMat);
        const resized = newMat.resize(100, 100)
          , data = Array.from(resized.getData()).map(elm => elm / 255)
          , newArr = Float32Array.from(data)
          , tensor = tf.tensor(newArr, [100, 100, 3], 'float32').expandDims(0)
          , output = model.predict(tensor)
          , value = await output.data()
          , thisPrections = labels
            .map((label, labelIndex) => ({label, 'accuracy': value[labelIndex]}))
            .filter(({accuracy}) => accuracy > (1 / labels.length))
            .sort((first, second) => second.accuracy - first.accuracy)
          , [{'label': predictedValue, accuracy}, ...rest] = thisPrections
          , restAccuracySummed = rest
            .reduce((prev, elm) => elm.accuracy + prev, 0);

        if (accuracyFactor * restAccuracySummed > accuracy) {

          throw new Error(`There are ${thisPrections.length} on ${anImage} - sector ${index}: ${JSON.stringify(thisPrections)}`);
        }

        predictions.push(predictedValue);
      }

      const valueToReturn = [...predictions.slice(0, 5), '.', ...predictions.slice(5)].join('');

      return Number(valueToReturn);
    }
  , disposeFile = async aFile => {
      const {base} = parse(aFile);

      await rename(aFile, `${disposeFolder}/${base}`);
    };

(async function entryPoint() {
  await mkdir(disposeFolder, {
    'recursive': true
  });

  const model = await tf.node.loadSavedModel(modelFolder)
    , files = (await readdir(sourceImagesFolder)).map(elm => `${sourceImagesFolder}/${elm}`)
    , predict = predictFactory(model);

  let howManyFilesByFar = 1;

  for (const aFile of files) {
    const timestamp = aFile.split(timeStampMatcher)
          .find(elm => Boolean(elm))
      , thatTime = new Date(timestamp);

    if (fromDate <= thatTime) {
      if (howManyFilesByFar <= howManyFiles) {

        try {
          const aPrediction = await predict(aFile);

          log.info({
            howManyFilesByFar,
            thatTime,
            'prediction': aPrediction
          });

          await writeWaterMeterCounterData({
            'timestamp': thatTime,
            'counter': aPrediction
          });
          await disposeFile(aFile);
          log.debug(`${howManyFilesByFar} - ${aFile} disposed`);
        } catch (err) {

          log.warn({err, thatTime, aFile});
        }

        howManyFilesByFar += 1;
      } else {

        log.info({howManyFilesByFar, howManyFiles}, 'batch number reached');
        break;
      }
    } else {

      log.debug(`${thatTime} skipped`);
    }
  }

  await close();
}());
