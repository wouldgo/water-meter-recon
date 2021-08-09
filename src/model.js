'use strict';
const {appendFile} = require('fs/promises')
  , {InfluxDB, Point} = require('@influxdata/influxdb-client');

module.exports = ({log, influxDb, modelFolder}) => {
  const {token, org, bucket, url} = influxDb
    , client = new InfluxDB({url, token})
    , writeApi = client.getWriteApi(org, bucket);

  writeApi.useDefaultTags({
    'host': 'cold-water-meter-recognizer',
    'infra': 'cold-water-meter'
  });

  return {
    'close': async function doClose() {
      log.debug('Closing influx');
      await writeApi.close();
    },
    'writeWaterMeterCounterData': async function doWrite(singleDataPoint) {
      const {timestamp, counter} = singleDataPoint
        , point = new Point('cold-water-meter');

      point.timestamp(timestamp);
      point.intField('counter', counter);
      writeApi.writePoint(point);

      await appendFile(`${modelFolder}/counter-dump.csv`, `${timestamp.toISOString()},${counter}\r\n`);
    }
  };
};
