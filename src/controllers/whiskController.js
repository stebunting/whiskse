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
  function generateDataLayer(statement, event) {
    const { products } = statement;
    const dataLayer = {
      ecommerce: {
        items: []
      }
    };
    products.forEach((product) => {
      dataLayer.ecommerce.items.push({
        item_name: product.name,
        item_id: product.id,
        price: product.price / 100,
        quantity: product.quantity
      });
    });
    switch (event) {
      case 'checkout':
        dataLayer.event = 'begin_checkout';
        break;

      default:
        break;
    }
    return JSON.stringify(dataLayer);
  }

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
    for (let i = 0; i < orders.length; i += 1) {
      const [key, q] = orders[i];
      const [, id] = key.split('-');
      const quantity = parseInt(q, 10);
      if (quantity > 0) {
        basket.push({ id, quantity });
      }
    }
    basket = JSON.stringify(basket);

    // Get Delivery Information
    let zone2Deliveries;
    let zone3Deliveries;
    if (req.body['delivery-type'] === 'delivery') {
      zone2Deliveries = req.body.zone === '2' ? 1 : 0;
      zone3Deliveries = req.body.zone === '3' ? 1 : 0;
    } else if (req.body['delivery-type'] === 'split-delivery') {
      zone2Deliveries = Object.entries(req.body).filter((x) => x[0].startsWith('zone-') && x[1] === '2').length;
      zone3Deliveries = Object.entries(req.body).filter((x) => x[0].startsWith('zone-') && x[1] === '3').length;
    }
    const delivery = JSON.stringify({
      zone2: zone2Deliveries,
      zone3: zone3Deliveries
    });

    const axiosConfig = {
      method: 'post',
      url: `${managementBaseUrl}/treatbox/lookupprice`,
      data: {
        basket,
        delivery,
        codes: req.body['rebate-codes']
      }
    };
    let priceInformation;
    try {
      const response = await axios(axiosConfig);
      priceInformation = response.data;
    } catch (error) {
      debug(error);
    }

    const googleDataLayer = generateDataLayer(priceInformation, 'checkout');

    const payload = {};
    Object.entries(req.body).forEach((item) => {
      const [key, value] = item;
      payload[key] = value;
    });

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
      parseDateCode,
      payload,
      googleDataLayer
    });
  }

  async function orderPlaced(req, res) {
    return res.render('orderplaced', {
      googleApiKey,
      page: 'orderplaced',
      body: req.body
    });
  }

  return { treatboxOrderForm, treatboxConfirmation, orderPlaced };
}

module.exports = whiskController;
