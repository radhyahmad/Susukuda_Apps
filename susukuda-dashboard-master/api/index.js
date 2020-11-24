const { Router } = require('express');
const getData = require('./getData');
const getDashboardData = require('./getDashboardData');
const postChannel = require('./postChannel');

const routes = Router();

routes.get('/dashboard', getDashboardData);
routes.get('/data/:channel', getData);
routes.post('/channel', postChannel);
// routes.post('/data', retrieveData);

module.exports = routes;
