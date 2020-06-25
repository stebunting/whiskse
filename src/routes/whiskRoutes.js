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
    .get((req, res) => res.render('index', { googleApiKey }));

  whiskRoutes.route('/menu')
    .get((req, res) => res.render('menu', { googleApiKey }));

  return whiskRoutes;
}

module.exports = routes;
