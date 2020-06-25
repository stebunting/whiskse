// Page Tag
const tag = 'whiskse:whiskController';

// Requirements
const debug = require('debug')(tag);

// Constants
const googleApiKey = process.env.GOOGLE_API_KEY;

function whiskController() {
  function treatboxOrderForm(req, res) {
    const confirmationUrl = new URL(`${req.protocol}://${req.get('host')}/treatboxconfirm`);
    const formSubmitUrl = new URL('https://whisk-management.herokuapp.com/treatbox/confirmation');

    return res.render('treatbox', {
      googleApiKey,
      page: 'treatbox',
      confirmationUrl,
      formSubmitUrl
    });
  }

  function treatboxConfirmation(req, res) {
    const amendUrl = new URL(`${req.protocol}://${req.get('host')}/treatbox`);
    const orderPlacedUrl = new URL(`${req.protocol}://${req.get('host')}/orderplaced`);
    const formSubmitUrl = new URL('https://whisk-management.herokuapp.com/treatbox/invoicepayment');

    return res.render('treatboxconfirm', {
      googleApiKey,
      page: 'treatboxconfirm',
      amendUrl,
      orderPlacedUrl,
      formSubmitUrl,
      body: req.body,
      params: req.params
    });
  }

  return { treatboxOrderForm, treatboxConfirmation };
}

module.exports = whiskController;
