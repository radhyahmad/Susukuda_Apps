const createError = require('http-errors');
const moment = require('moment-timezone');
const path = require('path');
const { performance } = require('perf_hooks');

const data = require('data-store')({
  path: path.resolve(__dirname, '../data/', 'raw.json')
});

const prop = require('data-store')({
  path: path.resolve(__dirname, '../data/', 'properties.json')
});

module.exports = function (req, res, next) {
  try {
    var timerStart = performance.now();
    var result = {
      byTimestamp: [],
      byProp: {}
    }
    if (prop.get('channel')) {
      var allChannels = prop.get('channel');
      var todayChannels = [];
      var dataTimestamp = [];
      var dataProp = [];
      var uniqueDataProp = [];
      var todayData = [];
      console.log('All Channel: ', allChannels);
      for (var i = 0; i < allChannels.length; i++) {
        if (allChannels[i].date === moment(new Date()).tz('Asia/Jakarta').format('DD/MM/YYYY')) {
          todayChannels.push(allChannels[i].channel);
        }
      }
      for (var i = 0; i < todayChannels.length; i++) {
        if (data.get(todayChannels[i])) {
          todayData.push(data.get(todayChannels[i]));
        }
      }
      for (var i = 0; i < todayData.length; i++) {
        for (var j = 0; j < todayData[i].length; j++) {
          // console.log('Data ' + i + ':', todayData[i][j]);
          dataTimestamp.push(todayData[i][j].timestamp);
          result.byTimestamp.push({
            timestamp: todayData[i][j].timestamp
          })
          for (var k = 0; k < todayData[i][j].iot2tangle[0].data.length; k++) {
            result.byTimestamp[j][Object.keys(todayData[i][j].iot2tangle[0].data[k])[0]] = todayData[i][j].iot2tangle[0].data[k][Object.keys(todayData[i][j].iot2tangle[0].data[k])[0]];
            dataProp.push(Object.keys(todayData[i][j].iot2tangle[0].data[k])[0]);
          }
        }
      }
      uniqueDataProp = [...new Set(dataProp)];
      for (var i = 0; i < uniqueDataProp.length; i++) {
        result.byProp[uniqueDataProp[i]] = {
          x: [],
          y: []
        };
      }
      for (var i = 0; i < result.byTimestamp.length; i++) {
        for (var j = 0; j < uniqueDataProp.length; j++) {
          result.byProp[uniqueDataProp[j]]['x'].push(result.byTimestamp[i]['timestamp'])
          result.byProp[uniqueDataProp[j]]['y'].push(result.byTimestamp[i][uniqueDataProp[j]]);
        }
      }
      console.log('Timestamp: ', dataTimestamp);
      // console.log('Data Prop: ', uniqueDataProp);
      console.log('Result: ', result);
      res.status(200).json({
        status: 'Success',
        data: result
      });
    } else {
      res.status(200).json({
        status: 'Success',
        data: result
      });
    }
  } catch (err) {
    console.error(err);
    next(createError(500));
  }
}
