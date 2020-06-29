// Page Tag
const tag = 'whiskse:whiskController';

// Requirements
const axios = require('axios');
const debug = require('debug')(tag);
const { priceFormat, dateFormat, parseDateCode } = require('../functions/helper');

// Constants
const baseManagementUrl = 'https://whisk-management.herokuapp.com';
const googleApiKey = process.env.GOOGLE_API_KEY;

function whiskController() {
  async function treatboxOrderForm(req, res) {
    const confirmationUrl = new URL(`${req.protocol}://${req.get('host')}/treatboxconfirm`);
    const formSubmitUrl = new URL(`${baseManagementUrl}/treatbox/confirmation`);
    let apiResponse = {};
    try {
      const response = await axios.get(`${baseManagementUrl}/treatbox/orderdetails`);
      apiResponse = response.data;
    } catch (error) {
      debug(error);
    }

    return res.render('treatbox', {
      googleApiKey,
      page: 'treatbox',
      confirmationUrl,
      formSubmitUrl,
      body: req.body,
      apiResponse,
      priceFormat,
      dateFormat
    });
  }

  function treatboxConfirmation(req, res) {
    const amendUrl = new URL(`${req.protocol}://${req.get('host')}/treatbox`);
    const orderPlacedUrl = new URL(`${req.protocol}://${req.get('host')}/orderplaced`);
    const formSubmitUrl = new URL(`${baseManagementUrl}/treatbox/invoicepayment`);

    return res.render('treatboxconfirm', {
      googleApiKey,
      page: 'treatboxconfirm',
      amendUrl,
      orderPlacedUrl,
      formSubmitUrl,
      body: req.body,
      params: req.params,
      dateFormat,
      parseDateCode
    });
  }

  return { treatboxOrderForm, treatboxConfirmation };
}

module.exports = whiskController;
