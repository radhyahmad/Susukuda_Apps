const createError = require('http-errors');
const moment = require('moment-timezone');
const path = require('path');
const { performance } = require('perf_hooks');
const dataNeeded = ['channel'];
const bodyChecker = (arr, target) => target.every(v => arr.includes(v));

const store = require('data-store')({
  path: path.resolve(__dirname, '../data/', 'properties.json')
});

// const retrieveIoT2TangleData = require('../modules/retrieveIoT2TangleData');

module.exports = async function (req, res, next) {
  try {
    var timerStart = performance.now();
    console.log('Body Channel: ', req.body.channel);
    // console.log('Params Channel: ', req.params.channel);
    if (Object.keys(req.body).length > 0) {
      if (bodyChecker(Object.keys(req.body), dataNeeded)) {
        var channelProperties = {
          date: moment(new Date()).tz('Asia/Jakarta').format('DD/MM/YYYY'),
          channel: req.body.channel
        }
        store.union('channel', channelProperties);
        store.load();
        res.status(200).json({
          status: 'Success'
        });
      } else {
        next(createError(400))
      }
    } else {
      next(createError(400))
    }
  } catch (err) {
    console.error(err);
    next(createError(500));
  }
}
