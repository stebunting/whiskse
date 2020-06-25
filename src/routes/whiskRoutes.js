// File Tag
const tag = 'whiskse:whiskRoutes';

// Requirements
const express = require('express');
const debug = require('debug')(tag);

// Constants
const googleApiKey = process.env.GOOGLE_API_KEY;

function routes() {
  const whiskRoutes = express.Router();

  whiskRoutes.route('/')
    .get((req, res) => res.render('index', { googleApiKey, page: 'index' }));

  whiskRoutes.route('/menu')
    .get((req, res) => res.render('menu', { googleApiKey, page: 'menu' }));

  whiskRoutes.route('/custom')
    .get((req, res) => res.render('custom', { googleApiKey, page: 'custom' }));

  whiskRoutes.route('/philosophy')
    .get((req, res) => res.render('philosophy', { googleApiKey, page: 'philosophy' }));

  return whiskRoutes;
}

module.exports = routes;
