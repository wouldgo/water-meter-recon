'use strict';

const {
    LOG_LEVEL = 'info',

    FROM_DATE = '2000-01-01T00:00:00.000Z',
    HOW_MANY_FILES = '100',

    TRAINING_SOURCE_IMAGES_FOLDER = '/home/dario/Pictures/water-meter',
    TRAINING_TO_MODEL_FOLDER = '/home/dario/Pictures/training-data',
    TRAINING_DISPOSE_FOLDER = '/home/dario/Pictures/training-data-disposed',
    TRAINING_IMAGES_TO_SPLIT = '5',

    PREDICTION_SOURCE_IMAGES_FOLDER = '/home/dario/Pictures/water-meter',
    PREDICTION_MODEL_FOLDER = `${__dirname}/model`,
    PREDICTION_DISPOSE_FOLDER = '/home/dario/Pictures/water-meter-disposed',
    PREDICTION_LABELS = [
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
    PREDICTION_ACCURACY_FACTOR = '1.4',

    INFLUXDB_TOKEN,
    INFLUXDB_ORG,
    INFLUXDB_BUCKET,
    INFLUXDB_URL
  } = process.env;


module.exports = {
  'log': {
    'level': LOG_LEVEL
  },
  'influxDb': {
    'token': INFLUXDB_TOKEN,
    'org': INFLUXDB_ORG,
    'bucket': INFLUXDB_BUCKET,
    'url': INFLUXDB_URL
  },
  'fromDate': new Date(FROM_DATE),
  'howManyFiles': Number(HOW_MANY_FILES),
  'training': {
    'sourceImagesFolder': TRAINING_SOURCE_IMAGES_FOLDER,
    'toModelFolder': TRAINING_TO_MODEL_FOLDER,
    'disposeFolder': TRAINING_DISPOSE_FOLDER,
    'imagesToSplit': Number(TRAINING_IMAGES_TO_SPLIT)
  },
  'prediction': {
    'sourceImagesFolder': PREDICTION_SOURCE_IMAGES_FOLDER,
    'modelFolder': PREDICTION_MODEL_FOLDER,
    'disposeFolder': PREDICTION_DISPOSE_FOLDER,
    'labels': PREDICTION_LABELS.split('|'),
    'accuracyFactor': Number(PREDICTION_ACCURACY_FACTOR)
  }
};
