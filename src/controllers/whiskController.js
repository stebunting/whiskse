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
  // Function to parse post data and call backend for statement
  async function getStatement(postData) {
    // Get Products Ordered
    const basket = [];
    const orders = Object.entries(postData).filter((x) => x[0].startsWith('quantity-'));
    for (let i = 0; i < orders.length; i += 1) {
      const [, id] = orders[i][0].split('-');
      const quantity = parseInt(orders[i][1], 10);
      if (quantity > 0) {
        basket.push({ id, quantity });
      }
    }

    // Get Delivery Information
    const delivery = [0, 0, 0, 0];
    if (postData['delivery-type'] === 'delivery') {
      const zone = parseInt(postData.zone, 10);
      delivery[zone] += 1;
    } else if (postData['delivery-type'] === 'split-delivery') {
      Object.entries(postData).forEach((entry) => {
        if (entry[0].startsWith('zone-')) {
          const zone = parseInt(entry[1], 10);
          delivery[zone] += 1;
        }
      });
    }

    const axiosConfig = {
      method: 'post',
      url: `${managementBaseUrl}/treatbox/lookupprice`,
      data: {
        basket,
        delivery,
        codes: postData['rebate-codes']
      }
    };
    try {
      const response = await axios(axiosConfig);
      return response.data;
    } catch (error) {
      return error;
    }
  }

  // Function to generate a dataLayer object for GTM tracking
  function generateDataLayer(statement, event, id) {
    const { products } = statement;
    const dataLayer = {
      event,
      ecommerce: {
        currencyCode: 'SEK',
        [event]: {
          products: []
        }
      }
    };
    products.forEach((product) => {
      dataLayer.ecommerce[event].products.push({
        name: product.name,
        id: product.id,
        price: product.price / 100,
        quantity: product.quantity
      });
    });
    if (event === 'purchase') {
      dataLayer.ecommerce.purchase.actionField = {
        id,
        revenue: statement.bottomLine.total / 100,
        tax: statement.bottomLine.totalMoms / 100,
        shipping: statement.bottomLine.deliveryCost / 100
      };
    } else if (event === 'checkout') {
      dataLayer.ecommerce.checkout.actionField = {
        step: 1
      };
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

    // Get orderable products by date
    const orderable = {};
    Object.keys(apiResponse.timeframe).forEach((date) => {
      const timeframe = apiResponse.timeframe[date];
      const products = {};
      apiResponse.products.forEach((product) => {
        const type = product.deadline;
        // eslint-disable-next-line no-underscore-dangle
        products[product._id] = timeframe.deadline[type].notPassed;
      });
      orderable[date] = { products };
    });

    // Render Page
    return res.render('treatbox', {
      googleApiKey,
      page: 'treatbox',
      confirmationUrl,
      formSubmitUrl,
      body: req.body,
      apiResponse,
      priceFormat,
      dateFormat,
      orderable: JSON.stringify(orderable)
    });
  }

  async function treatboxConfirmation(req, res) {
    // Get URLs
    const amendUrl = new URL(`${req.protocol}://${req.get('host')}/treatboxorder`);
    const orderPlacedUrl = new URL(`${req.protocol}://${req.get('host')}/orderplaced`);
    const formSubmitUrl = new URL(`${managementBaseUrl}/treatbox/payment`);

    // Get Statement
    const statement = await getStatement(req.body);

    // Get Data Layer for GTM Tracking
    const googleDataLayer = generateDataLayer(statement, 'checkout');

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
      statement,
      priceFormat,
      dateFormat,
      parseDateCode,
      payload,
      googleDataLayer
    });
  }

  async function orderPlaced(req, res) {
    // Get Data Layer for GTM Tracking
    const statement = await getStatement(req.body);
    const googleDataLayer = generateDataLayer(statement, 'purchase', req.body['transaction-id']);

    return res.render('orderplaced', {
      googleApiKey,
      page: 'orderplaced',
      body: req.body,
      googleDataLayer
    });
  }

  return { treatboxOrderForm, treatboxConfirmation, orderPlaced };
}

module.exports = whiskController;
