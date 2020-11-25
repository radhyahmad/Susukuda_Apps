const axios = require('axios');
const base64url = require('base64url');
const createError = require('http-errors');
const path = require('path');
const { performance } = require('perf_hooks');

const store = require('data-store')({
  path: path.resolve(__dirname, '../data/', 'raw.json')
});

module.exports = async function (req, res, next) {
  try {
    var timerStart = performance.now();
    // console.log('Body Channel: ', req.body.channel);
    console.log('Params Channel: ', req.params.channel);
    // var result = await retrieveIoT2TangleData(req.body.channel);
    // var result = await retrieveIoT2TangleData(req.params.channel);
    var result = store.get(req.params.channel);
    console.log('Result: ', result);
    if (result) {
      res.status(200).json({
        status: 'Success',
        data: result
      });
    } else {
      next(createError(404));
    }
  } catch (err) {
    console.error(err);
    next(createError(500));
  }
}
