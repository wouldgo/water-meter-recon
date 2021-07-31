'use strict';

const {
      LOG_FILE = '/home/dario/tmp/predictions.csv',
      ROOT_FOLDER = '/home/dario/Pictures/water-meter',
      MODEL_FOLDER = `${__dirname}/model`,
      LABELS = [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9
      ].join('|'),
      FROM_DATE = '2000-01-01T00:00:00.000Z',
      TO_DATE = '2999-01-01T00:00:00.000Z',
      ACCURACY_FACTOR = '1.4'
    } = process.env
  , {EOL} = require('os')
  , {unlink, readdir, appendFile} = require('fs/promises')
  , cv = require('opencv4nodejs')
  , tf = require('@tensorflow/tfjs-node')
  , pino = require('pino')()
  , image = require('./src/images')(cv)
  , fromDate = new Date(FROM_DATE)
  , toDate = new Date(TO_DATE)
  , labels = LABELS.split('|')
  , accuracyFactor = Number(ACCURACY_FACTOR)
  , timeStampMatcher = /.+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z).+/g
  , predictFactory = model => async anImage => {
      const cropped = image(anImage)
        , predictions = [];

      for (const aRegion of cropped) {
        const newMat = new cv.Mat(
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

          throw new Error(`There are ${thisPrections.length} on ${anImage}: ${JSON.stringify(thisPrections)}`);
        }

        predictions.push(predictedValue);
      }

      const valueToReturn = [...predictions.slice(0, 5), '.', ...predictions.slice(5)].join('');

      return Number(valueToReturn);
    };

(async() => {
  const model = await tf.node.loadSavedModel(MODEL_FOLDER)
    , files = (await readdir(ROOT_FOLDER)).map(elm => `${ROOT_FOLDER}/${elm}`)
    , predict = predictFactory(model);

  try {

    await unlink(LOG_FILE);
  } catch (err) {

    pino.info({
      'message': `No file to deleted: ${LOG_FILE}`
    });
  }

  try {
    for (const aFile of files) {
      const timestamp = aFile.split(timeStampMatcher)
          .find(elm => Boolean(elm))
        , thatTime = new Date(timestamp);

      if (thatTime >= fromDate) {

        if (toDate <= thatTime) {

          pino.info(`Batch round ends: date is ${thatTime}`);
          break;
        }

        try {
          const aPrediction = await predict(aFile);

          await appendFile(LOG_FILE, `${timestamp},${aPrediction}${EOL}`);

          pino.info({
            thatTime,
            'prediction': aPrediction
          });
        } catch (err) {
          const {'message': errorMessage} = err;

          pino.warn({
            thatTime,
            'message': errorMessage
          });
        }
      } else {

        pino.info({thatTime, 'referenceDate': fromDate});
      }
    }
  } catch ({message}) {

    pino.error({message});
  }
})();
