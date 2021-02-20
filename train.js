'use strict';

/*
 ./.venv/bin/make_image_classifier \
  --image_dir model \
  --tfhub_module https://tfhub.dev/google/imagenet/inception_v3/feature_vector/4 \
  --saved_model_dir new-model \
  --labels_output_file class-labels.txt \
  --image_size=100
*/
const {
    IMAGE_FOLDER = '/home/dario/Pictures/water-meter/',
    TMP_FOLDER = '/home/dario/tmp/predictions',
    IMAGES_TO_SPLIT = '5',
    FROM_DATE = '2000-01-01T00:00:00.000Z',
    TO_DATE = '2999-01-01T00:00:00.000Z'
  } = process.env
  , pino = require('pino')()
  , {promisify} = require('util')
  , fs = require('fs')
  , readdir = promisify(fs.readdir)
  , rmdir = promisify(fs.rmdir)
  , mkdir = promisify(fs.mkdir)
  , cv = require('opencv4nodejs')
  , image = require('./src/images')(cv)
  , fromDate = new Date(FROM_DATE)
  , toDate = new Date(TO_DATE)
  , timeStampMatcher = /.+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z).+/g
  , imagesToSplit = Number(IMAGES_TO_SPLIT)
  , split = async(anImage, timestamp) => {
    const cropped = image(anImage);
    let index = 0;

    for (const aRegion of cropped) {

      //cv.imwrite(`${TMP_FOLDER}/${index}-${timestamp}.png`, aRegion.cvtColor(cv.COLOR_GRAY2BGR));
      cv.imwrite(`${TMP_FOLDER}/${index}/${timestamp}-${index}.png`, aRegion);
      index += 1;
    }

    if (index !== imagesToSplit) {

      throw new Error(`There are not ${imagesToSplit} tiles into ${anImage}`);
    }

    return index;
  };

(async() => {
  await rmdir(`${TMP_FOLDER}`, {
    'recursive': true
  });
  await mkdir(`${TMP_FOLDER}`);
  for (let index = imagesToSplit - 1; index >= 0; index -= 1) {

    await mkdir(`${TMP_FOLDER}/${index}`);
  }

  const filenames = await readdir(IMAGE_FOLDER)
    , files = filenames.map(elm => `${IMAGE_FOLDER}${elm}`);

  try {
    for (const aFile of files) {
      const timestamp = aFile.split(timeStampMatcher).find(elm => Boolean(elm))
        , thatTime = new Date(timestamp);

      if (thatTime >= fromDate) {

        if (toDate <= thatTime) {

          pino.info(`Batch round ends: date is ${thatTime}`);
          break;
        }

        await split(aFile, timestamp);
        pino.info({thatTime});
      } else {

        pino.info({thatTime, 'referenceDate': fromDate});
      }
    }
  } catch (err) {

    throw err;
  }
})();
