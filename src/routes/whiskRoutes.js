// File Tag
const tag = 'whiskse:whiskRoutes';

// Requirements
const express = require('express');
const debug = require('debug')(tag);
const { treatboxOrderForm, treatboxConfirmation } = require('../controllers/whiskController.js')();

// Constants
const googleApiKey = process.env.GOOGLE_API_KEY;

// Routes
function routes() {
  const whiskRoutes = express.Router();

  whiskRoutes.route('/')
    .get((req, res) => res.render('index', { googleApiKey, page: 'index' }));

  // Legacy Redirects
  whiskRoutes.route(['/treatbox', '/treatboxes.php'])
    .get((req, res) => res.redirect('/treatboxorder'))

  whiskRoutes.route('/treatboxorder')
    .get(treatboxOrderForm)
    .post(treatboxOrderForm);

  whiskRoutes.route('/treatboxconfirm')
    .get((req, res) => res.redirect('/treatboxorder'))
    .post(treatboxConfirmation);

  whiskRoutes.route('/orderplaced')
    .get((req, res) => res.render('orderplaced', {
      googleApiKey,
      page: 'menu',
      query: req.query
    }));

  whiskRoutes.route('/menu')
    .get((req, res) => res.render('menu', { googleApiKey, page: 'menu' }));

  whiskRoutes.route('/custom')
    .get((req, res) => res.render('custom', { googleApiKey, page: 'custom' }));

  whiskRoutes.route('/philosophy')
    .get((req, res) => res.render('philosophy', { googleApiKey, page: 'philosophy' }));

  whiskRoutes.route('/faq')
    .get((req, res) => res.render('faq', { googleApiKey, page: 'faq' }));

  whiskRoutes.route('/store')
    .get((req, res) => res.redirect('https://store.whisk.se'));

  whiskRoutes.route('/management')
    .get((req, res) => res.redirect('https://whisk-management.herokuapp.com'));

  return whiskRoutes;
}

module.exports = routes;
