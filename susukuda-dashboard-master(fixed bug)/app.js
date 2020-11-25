// app.js

// ==================== BASIC SERVER SETUP ====================== //
// ============================================================== //

// Packages needed
const bodyParser = require('body-parser');
const cors = require('cors');
const cron = require('node-cron');
const express = require('express');
const helmet = require('helmet');
const createError = require('http-errors');
const moment = require('moment-timezone');
const path = require('path');
const { spawn } = require('child_process');
const serveStatic = require('serve-static');

const store = require('data-store')({
  path: path.resolve(__dirname, './data/properties.json')
});

var app = express();
require('dotenv').config();

const retrieveIoT2TangleData = require(path.resolve(__dirname, './modules/retrieveIoT2TangleData'));

// console.log(process.env.npm_package_version);
// Includes routing
const api = require(path.resolve(__dirname, './api/index'));


// All middleware configurations goes here
/* Use serve static to serve html page */
app.use('/dashboard', serveStatic(path.resolve(__dirname, './public'), { 'index': ['index.html', 'index.htm'] }))
/**
 * Configuration of the body-parser to get data from POST requests
 */
app.use(bodyParser.raw());
app.use(bodyParser.text());
app.use(bodyParser.json({ limit: '1mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));
app.use(helmet());
app.use(cors());

// ================== ROUTES FOR API REQUESTS =================== //
// ============================================================== //

app.get('/', function (req,res) {
	// res.redirect('https://www.arkandina.tech');
  // res.sendFile(path.resolve(__dirname, './public/index.html'));
  res.status(200).send('hello iota');
})

app.get('/ping', function (req,res) {
	res.status(200).send('pong');
})

// Register services
// app.use('/v' + process.env.npm_package_version.toString().split('.')[0], api);
app.use('/v1', api);

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
})

// Error handler
app.use(function (err, req, res, next) {
	var customMessage = {
		500: 'Please Try Again Later'
	}
	// set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV === 'development' ? err : {};
  // sent error message
	if (customMessage[err.status]) {
		res.status(err.status || 500).json({
			message: customMessage[err.status]
		});
	} else {
		res.status(err.status || 500).json({
			message: err.message
		});
	}
})

module.exports = app;

cron.schedule('0 */1 * * *', () => {
  if (store.get('channel')) {
    var allChannels = store.get('channel');
    var todayChannels = []
    console.log('All Channel: ', store.get('channel'));
    for (var i = 0; i < allChannels.length; i++) {
      if (allChannels[i].date === moment(new Date()).tz('Asia/Jakarta').format('DD/MM/YYYY')) {
        todayChannels.push(allChannels[i].channel);
      }
    }
    var countChannelToday = -1;
    var nextChannel = async function () {
      try {
        if (countChannelToday < (todayChannels.length - 1)) {
          countChannelToday++
          console.log('Retrieving Data...');
          // await retrieveIoT2TangleData(allChannels[countChannelToday].channel);
          const child = spawn('node', ['index.js', allChannels[countChannelToday].channel], {
            detached: true,
            stdio: 'ignore'
          });
          child.unref();
          nextChannel();
        }
      } catch (err) {
        console.error(err);
      }
    }
    nextChannel();
  }
});

cron.schedule('30 */1 * * *', () => {
  if (store.get('channel')) {
    var allChannels = store.get('channel');
    var todayChannels = []
    console.log('All Channel: ', store.get('channel'));
    for (var i = 0; i < allChannels.length; i++) {
      if (allChannels[i].date === moment(new Date()).tz('Asia/Jakarta').format('DD/MM/YYYY')) {
        todayChannels.push(allChannels[i].channel);
      }
    }
    var countChannelToday = -1;
    var nextChannel = async function () {
      try {
        if (countChannelToday < (todayChannels.length - 1)) {
          countChannelToday++
          console.log('Retrieving Data...');
          await retrieveIoT2TangleData(allChannels[countChannelToday].channel);
        }
      } catch (err) {
        console.error(err);
      }
    }
    nextChannel();
  }
});
