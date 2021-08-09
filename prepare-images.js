'use strict';
// eslint-disable-next-line import/no-unassigned-import
require('make-promises-safe');

const {readdir, mkdir, rename} = require('fs/promises')
  , {parse} = require('path')
  , cv = require('opencv4nodejs')
  , pino = require('pino')
  , tools = require('./_conf')
  , {
      fromDate,
      howManyFiles,
      training
    } = tools
  , {
      sourceImagesFolder,
      toModelFolder,
      imagesToSplit,
      disposeFolder
    } = training
  , log = pino({
      'level': tools.log.level
    })
  , image = require('./src/images')(cv)
  , timeStampMatcher = /.+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z).+/g
  , split = async(anImage, timestamp) => {
      const cropped = image(anImage);
      let index = 0;

      for (const aRegion of cropped) {

        //cv.imwrite(`${tmpFolder}/${index}-${timestamp}.png`, aRegion.cvtColor(cv.COLOR_GRAY2BGR));
        cv.imwrite(`${toModelFolder}/${index}/${timestamp}-${index}.png`, aRegion);
        index += 1;
      }

      if (index !== imagesToSplit) {

        throw new Error(`There are not ${imagesToSplit} tiles into ${anImage}`);
      }

      return index;
    }
  , disposeFile = async aFile => {
      const {base} = parse(aFile);

      await rename(aFile, `${disposeFolder}/${base}`);
    };

(async function entryPoint() {
  await mkdir(disposeFolder, {
    'recursive': true
  });
  await mkdir(toModelFolder, {
    'recursive': true
  });

  for (let index = imagesToSplit - 1; index >= 0; index -= 1) {

    await mkdir(`${toModelFolder}/${index}`, {
      'recursive': true
    });
  }

  const filenames = await readdir(sourceImagesFolder)
    , files = filenames.map(elm => `${sourceImagesFolder}/${elm}`);

  let howManyFilesByFar = 1;

  for (const aFile of files) {
    const timestamp = aFile.split(timeStampMatcher)
          .find(elm => Boolean(elm))
      , thatTime = new Date(timestamp);

    if (fromDate <= thatTime) {
      if (howManyFilesByFar <= howManyFiles) {

        try {

          await split(aFile, timestamp);
          log.info({howManyFilesByFar, thatTime});

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
}());
