// File Tag
const tag = 'whiskse:whiskRoutes';

// Requirements
const express = require('express');
const debug = require('debug')(tag);
const {
  wakeUpStore,
  treatboxOrderForm,
  treatboxConfirmation,
  orderPlaced
} = require('../controllers/whiskController.js')();

// Constants
const googleApiKey = process.env.GOOGLE_API_KEY;

// Routes
function routes() {
  const whiskRoutes = express.Router();

  whiskRoutes.route('/')
    .get(wakeUpStore, (req, res) => res.render('index', { googleApiKey, page: 'index' }));

  whiskRoutes.route('/treatboxorder')
    .get(treatboxOrderForm)
    .post(treatboxOrderForm);

  whiskRoutes.route('/treatboxconfirm')
    .get((req, res) => res.redirect('/treatboxorder'))
    .post(treatboxConfirmation);

  whiskRoutes.route('/orderplaced')
    .post(orderPlaced);

  whiskRoutes.route('/menu')
    .get((req, res) => res.render('menu', { googleApiKey, page: 'menu' }));

  whiskRoutes.route('/custom')
    .get((req, res) => res.render('custom', { googleApiKey, page: 'custom' }));

  whiskRoutes.route('/philosophy')
    .get((req, res) => res.render('philosophy', { googleApiKey, page: 'philosophy' }));

  whiskRoutes.route('/faq')
    .get((req, res) => res.render('faq', { googleApiKey, page: 'faq' }));

  whiskRoutes.route('/sitemap')
    .get((req, res) => res.render('sitemap'));

  whiskRoutes.route('/test')
    .get((req, res) => res.render('test/test', { googleApiKey, page: 'faq' }));

  // Redirects
  whiskRoutes.route('/store')
    .get((req, res) => res.redirect('https://store.whisk.se'));

  whiskRoutes.route('/management')
    .get((req, res) => res.redirect('https://whisk-management.herokuapp.com'));

  // Legacy Redirects
  whiskRoutes.route('/jul')
    .get((req, res) => res.redirect('https://store.whisk.se/assets/docs/christmas-hamper-ingredients.pdf'));

  whiskRoutes.route(['/treatbox', '/treatboxes.php'])
    .get((req, res) => res.redirect('/treatboxorder'));

  return whiskRoutes;
}

module.exports = routes;
