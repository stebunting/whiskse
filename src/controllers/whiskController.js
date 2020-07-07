// Page Tag
const tag = 'whiskse:whiskController';

// Requirements
const axios = require('axios');
const debug = require('debug')(tag);
const { priceFormat, dateFormat, parseDateCode } = require('../functions/helper');

// Constants
const managementBaseUrl = process.env.MANAGEMENT_BASE_URL;
const googleApiKey = process.env.GOOGLE_API_KEY;

function whiskController() {
  async function treatboxOrderForm(req, res) {
    // Get URLs
    const confirmationUrl = new URL(`${req.protocol}://${req.get('host')}/treatboxconfirm`);
    const formSubmitUrl = new URL(`${managementBaseUrl}/treatbox/confirmation`);
    let apiResponse = {};
    try {
      const response = await axios.get(`${managementBaseUrl}/treatbox/orderdetails`);
      apiResponse = response.data;
    } catch (error) {
      debug(error);
    }

    // Render Page
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

  async function treatboxConfirmation(req, res) {
    // Get URLs
    const amendUrl = new URL(`${req.protocol}://${req.get('host')}/treatboxorder`);
    const orderPlacedUrl = new URL(`${req.protocol}://${req.get('host')}/orderplaced`);
    const formSubmitUrl = new URL(`${managementBaseUrl}/treatbox/payment`);

    // Get Price Information
    let basket = [];
    const orders = Object.entries(req.body).filter((x) => x[0].startsWith('quantity-'));
    for (const [key, q] of orders) {
      const [, id] = key.split('-');
      const quantity = parseInt(q, 10);
      if (quantity > 0) {
        basket.push({ id, quantity });
      }
    }
    basket = JSON.stringify(basket);
    const zone2Deliveries = Object.entries(req.body).filter((x) => x[0].startsWith('zone') && x[1] === '2').length;
    const delivery = JSON.stringify({ zone2: zone2Deliveries });

    const axiosConfig = {
      method: 'post',
      url: `${managementBaseUrl}/treatbox/lookupprice`,
      data: {
        basket,
        delivery
      }
    };
    let priceInformation;
    try {
      const response = await axios(axiosConfig);
      priceInformation = response.data;
    } catch (error) {
      debug(error);
    }

    // Render Page
    return res.render('treatboxconfirm', {
      googleApiKey,
      page: 'treatboxconfirm',
      amendUrl,
      orderPlacedUrl,
      formSubmitUrl,
      body: req.body,
      query: req.query,
      priceInformation,
      priceFormat,
      dateFormat,
      parseDateCode
    });
  }

  return { treatboxOrderForm, treatboxConfirmation };
}

module.exports = whiskController;
