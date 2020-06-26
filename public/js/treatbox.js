/* global google, validateInput, printMessage */
// Requirements
import {
  initialise,
  isLocal,
  inZoneOne,
  inZoneTwo
} from './boundaries.js';

initialise();

// Constants
const managementBaseUrl = 'http://127.0.0.1:5000';
const animationTime = 400;

// User Choices
let deliverable = false;
let zone3delivery = false;

// Show Purchaser/Delivery Details if hidden
function showPurchaserDetails() {
  if (!$('#purchaser-details').is(':visible')) {
    $('#purchaser-details, #delivery-details').show(animationTime);
  }
}

// Disable or enable delivery buttons depending on items purchased
function setDelivery() {
  deliverable = false;
  $('select[id^=quantity-]').each(function callback() {
    if ($(this).attr('data-deliverable') === 'true' && parseInt($(this).val(), 10) > 0) {
      deliverable = true;
    }
  });
  if (deliverable) {
    const deliveryWasDisabled = $('#delivery').prop('disabled');
    $('#delivery').prop('disabled', false);
    // $('#split-delivery').prop('disabled', false);
    if (deliveryWasDisabled) {
      $('#delivery').trigger('click');
    }
  } else {
    $('#delivery').prop('disabled', true);
    // $('#split-delivery').prop('disabled', true);
    $('#collection').trigger('click');
  }
}

// Get address zone
function getZone(location) {
  if (isLocal(location)) {
    return 0;
  }
  if (inZoneOne(location)) {
    return 1;
  }
  if (inZoneTwo(location)) {
    return 2;
  }
  return 3;
}

function getNamePostfix(id) {
  let namePostfix = '';
  if (id != null) {
    namePostfix = `-${id}`;
  }
  return namePostfix;
}

function getDetailsFromId(htmlId) {
  const [field, id] = htmlId.split('-');
  return { field, id };
}

function priceFormat(num, includeSymbol = true) {
  let str = (num / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  str = str.replace(',', '');
  str += includeSymbol ? ' SEK' : '';
  return str;
}

// Update Price
function updatePrice() {
  let basket = [];
  $('select[id^=quantity-]').each(function callback() {
    const quantity = parseInt($(this).val(), 10);
    if (quantity > 0) {
      const item = {
        id: getDetailsFromId($(this).attr('id')).id,
        quantity
      };
      basket.push(item);
    }
  });
  basket = JSON.stringify(basket);

  let zone2Deliveries = 0;
  if (!$('#collection').is(':checked')) {
    $('input[id^=zone]').each(function callback() {
      if ($(this).val() === '2') {
        zone2Deliveries += 1;
      }
    });
  }
  const delivery = JSON.stringify({ zone2: zone2Deliveries });

  $.ajax({
    method: 'post',
    url: `${managementBaseUrl}/treatbox/lookupprice`,
    data: {
      basket,
      delivery
    }
  }).then((data) => {
    if (data.status === 'OK') {
      $('#food-cost').text(priceFormat(data.bottomLine.foodCost));
      $('#food-moms').text(priceFormat(data.bottomLine.foodMoms));
      $('#delivery-cost').text(priceFormat(data.bottomLine.deliveryCost));
      $('#delivery-moms').text(priceFormat(data.bottomLine.deliveryMoms));
      $('#total-cost').text(priceFormat(data.bottomLine.total));
      $('.zone2-surcharge-amount').text(priceFormat(data.delivery.zone2Price))
    }
  });
}

// Validate address and generate message
function validateGoogleAddress(recipientId) {
  const namePostfix = getNamePostfix(recipientId);

  const selector = $(`#address${namePostfix}`);
  const addressToValidate = $(`#address${namePostfix}`).val();
  const googleAddress = $(`#google-formatted-address${namePostfix}`).val();
  const zone = parseInt($(`#zone${namePostfix}`).val(), 10);

  let valid = true;
  let message;

  if (addressToValidate === '') {
    valid = null;
    message = '';
  } else if (googleAddress !== addressToValidate || Number.isNaN(zone)) {
    message = 'Invalid Address, please select from dropdown menu';
    valid = false;
  } else if (zone === 0) {
    message = 'Local';
  } else if (zone === 1) {
    message = 'Zone 1';
  } else if (zone === 2) {
    message = 'Zone 2 // <span class="zone2-surcharge-amount"></span> Surcharge';
  } else if (zone3delivery) {
    message = 'Zone 3 // <span class="zone2-surcharge-amount"></span> Surcharge';
  } else {
    message = 'Outside Delivery Area';
    valid = false;
  }

  printMessage(selector, valid);

  $(`#message-address${namePostfix}`).html(message);
}

// Set up Google Autocomplete
function setUpAddressDropdown(recipientId) {
  const namePostfix = getNamePostfix(recipientId);

  // Set up autocomplete
  const input = document.getElementById(`address${namePostfix}`);
  const options = {
    types: ['address'],
    componentRestrictions: { country: ['se'] },
    bounds: new google.maps.LatLngBounds(
      new google.maps.LatLng(59.276402, 17.829733),
      new google.maps.LatLng(59.410845, 18.257856)
    )
  };
  const autocomplete = new google.maps.places.Autocomplete(input, options);

  // On item selected
  google.maps.event.addListener(autocomplete, 'place_changed', () => {
    const googleLocation = autocomplete.getPlace();

    // Set and Validate Delivery Address
    $(`#address${namePostfix}`).val(googleLocation.formatted_address);
    $(`#google-formatted-address${namePostfix}`).val(googleLocation.formatted_address);
    $(`#zone${namePostfix}`).val(getZone(googleLocation.geometry.location));
    updatePrice();
    validateGoogleAddress(recipientId);
  });

  // Enter key should select Autocomplete item when list is open
  $(`#address${namePostfix}`).keydown((e) => !(e.which === 13 && $('.pac-container:visible').length));
}

// On DOM Loaded...
$(() => {
  // Select Items
  $('select[id^=quantity-]').change(() => {
    setDelivery();
    showPurchaserDetails();
    updatePrice();
  });

  // Validate User Details as they are entered
  $('#name, #email, #telephone').focusout(function callback() {
    validateInput($(this));
  });

  // Delivery Type
  $('#delivery').click(() => {
    $('#user-delivery').show(animationTime);
    $('#address, #notes-address').prop('disabled', false);
    updatePrice();
  });

  $('#collection').click(() => {
    $('#user-delivery').hide(animationTime);
    updatePrice();
  });

  // Address
  setUpAddressDropdown();
  $('#address').focusout(() => validateGoogleAddress());

  // Hide Loading Spinner and Show Page
  $('#loading-div').hide(animationTime);
  $('#date-selector, #product-selector, #submit-fieldset').show(animationTime);
});
