/* global google, validateInput, printMessage, post, deliveryType */
// Requirements
import {
  initialise,
  isLocal,
  inZoneOne,
  inZoneTwo
} from './boundaries.js';

initialise();

// Constants
// const managementBaseUrl = 'http://localhost:5000';
const managementBaseUrl = 'https://whisk-management.herokuapp.com';
const animationTime = 400;

// User Choices
let deliverable = false;
let zone3delivery = false;
let basket = [];
let items = [];
let recipients = [];

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
    $('#split-delivery').prop('disabled', false);
    if (deliveryWasDisabled) {
      $('#delivery').trigger('click');
    }
  } else {
    $('#delivery').prop('disabled', true);
    $('#split-delivery').prop('disabled', true);
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

function priceFormat(num, userOptions = {}) {
  const options = {
    includeSymbol: userOptions.includeSymbol || true,
    includeOre: userOptions.includeOre || false
  };
  let str = (num / 100).toLocaleString(undefined, {
    minimumFractionDigits: options.includeOre ? 2 : 0,
    maximumFractionDigits: options.includeOre ? 2 : 0
  });
  str = str.replace(',', '');
  str += options.includeSymbol ? ' SEK' : '';
  return str;
}

function updateItems() {
  const oldItems = items.filter((x) => x.recipient !== null);
  items = [];
  $('select[id^=quantity-]').each(function callback() {
    const quantity = parseInt($(this).val(), 10);
    for (let i = 0; i < quantity; i += 1) {
      const { id } = getDetailsFromId($(this).attr('id'));

      const recipientIndex = oldItems.findIndex((x) => x.id === id);
      let recipient = null;
      if (recipientIndex > -1) {
        recipient = oldItems[recipientIndex].recipient;
        oldItems.splice(recipientIndex, 1);
      }

      items.push({
        id,
        name: $(`#${id}`).val(),
        recipient
      });
    }
  });
}

// Update Price
function updatePrice() {
  basket = [];
  $('select[id^=quantity-]').each(function callback() {
    const quantity = parseInt($(this).val(), 10);
    if (quantity > 0) {
      const { id } = getDetailsFromId($(this).attr('id'));
      const item = {
        id,
        name: $(`#${id}`).val(),
        quantity
      };
      basket.push(item);
    }
  });

  let zone2Deliveries = 0;
  let zone3Deliveries = 0;
  if (!$('#collection').is(':checked')) {
    $('input[id^=zone]').each(function callback() {
      const postfix = getDetailsFromId($(this).attr('id'));
      let inputIdSelector = $('#address');
      if (postfix.id != null) {
        inputIdSelector = $(`#address-${postfix.id}`);
      }
      if (inputIdSelector.is(':visible')) {
        if ($(this).val() === '2') {
          zone2Deliveries += 1;
        } else if (zone3delivery && $(this).val() === '3') {
          zone3Deliveries += 1;
        }
      }
    });
  }
  const delivery = JSON.stringify({
    zone2: zone2Deliveries,
    zone3: zone3Deliveries
  });

  $.ajax({
    method: 'post',
    url: `${managementBaseUrl}/treatbox/lookupprice`,
    data: {
      basket: JSON.stringify(basket),
      delivery
    }
  }).then((data) => {
    if (data.status === 'OK') {
      $('#food-cost').text(priceFormat(data.bottomLine.foodCost));
      $('#food-moms').text(priceFormat(data.bottomLine.foodMoms, { includeOre: true }));
      $('#delivery-cost').text(priceFormat(data.bottomLine.deliveryCost));
      $('#delivery-moms').text(priceFormat(data.bottomLine.deliveryMoms, { includeOre: true }));
      $('#total-cost').text(priceFormat(data.bottomLine.total));
      if (data.delivery.zone2) {
        $('.zone2-surcharge-amount').text(priceFormat(data.delivery.zone2.price));
      }
      if (data.delivery.zone3) {
        $('.zone3-surcharge-amount').text(priceFormat(data.delivery.zone3.price));
      }
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

  // if (addressToValidate === '') {
  //   valid = null;
  //   message = ''; } else
  if (addressToValidate === '' || googleAddress !== addressToValidate || Number.isNaN(zone)) {
    message = 'Invalid Address, please select from dropdown menu';
    valid = false;
  } else if (zone === 0) {
    message = 'Local';
  } else if (zone === 1) {
    message = 'Zone 1';
  } else if (zone === 2) {
    message = 'Zone 2 // <span class="zone2-surcharge-amount"></span> Surcharge';
  } else if (zone3delivery) {
    message = 'Zone 3 // <span class="zone3-surcharge-amount"></span> Surcharge';
  } else {
    message = 'Outside Delivery Area';
    valid = false;
  }

  printMessage(selector, valid);
  $(`#message-address${namePostfix}`).html(message);

  return valid;
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

function updateTextAreas() {
  recipients.forEach((recipient) => {
    const recipientsItems = items
      .filter((x) => x.recipient === recipient)
      .map((x) => x.name)
      .sort();
    const counts = {};
    recipientsItems.forEach((item) => {
      counts[item] = (counts[item] || 0) + 1;
    });
    const listItems = Object.entries(counts).map((x) => `${x[1]} x ${x[0]}`);
    $(`#items-to-deliver-${recipient}`).val(listItems.join(', '));
  });
}

function setAddRemoveRecipientStatus() {
  const unassignedItems = items.filter((x) => x.recipient === null).length;
  let assigned = recipients.length;
  for (let i = 0; i < recipients.length; i += 1) {
    if (items.filter((x) => x.recipient === recipients[i]).length > 0) {
      assigned -= 1;
    }
  }
  if (unassignedItems - assigned > 0) {
    $('.add-recipient').prop('disabled', false);
  } else {
    $('.add-recipient').prop('disabled', true);
  }
}

function updateButtonRow() {
  recipients.forEach((recipient) => {
    let buttons = '';
    items.forEach((item, index) => {
      const selector = `${recipient}-item-${item.id}-${index}`;
      let buttonType = 'btn-info';
      let cross = '';
      let disabled = '';
      if (item.recipient !== null) {
        cross = '&times; ';
        buttonType = 'btn-secondary';
        if (item.recipient !== recipient) {
          disabled = ' disabled="true"';
        }
      }
      buttons += `<button type="button" class="btn ${buttonType} item-button btn-sm" id="${selector}" name="${selector}"${disabled}>${cross}${item.name}</button>`;
    });
    $(`#button-row-${recipient}`).html(buttons);
    items.forEach((item, index) => {
      const selector = `${recipient}-item-${item.id}-${index}`;
      $(`#${selector}`).click(() => {
        if (item.recipient !== null) {
          items[index].recipient = null;
        } else {
          items[index].recipient = recipient;
        }
        updateButtonRow();
        updateTextAreas();
        setAddRemoveRecipientStatus();
        validateInput($(`#items-to-deliver-${recipient}`));
      });
    });
  });
  $('#items').val(JSON.stringify(items));
}

function removeRecipient(id) {
  items.map((x) => {
    const y = x;
    if (y.recipient === id) {
      y.recipient = null;
    }
    return y;
  });

  $(`#recipient-${id}`).remove();
  const index = recipients.findIndex((x) => x === id);
  recipients.splice(index, 1);
  $('#recipients').val(JSON.stringify(recipients));

  updatePrice();
  updateButtonRow();
  setAddRemoveRecipientStatus();
}

function addNewRecipient() {
  let id = 0;
  if (recipients.length > 0) {
    id = recipients[recipients.length - 1] + 1;
  }
  recipients.push(id);
  $('#recipients').val(JSON.stringify(recipients));

  const html = `
      <fieldset class="form-group" id="recipient-${id}">
      <legend class="recipient-legend-name-${id}">Recipient</legend>

      <div class="form-group row">
        <label for="buttons" class="col-md-4 col-form-label">Select items to deliver</label>
        <div class="col-md-8 button-row" id="button-row-${id}"></div>
      </div>
    
      <div class="form-group row">
        <label for="items-to-deliver" class="col-md-4 col-form-label"><span class="recipient-legend-name-${id}">Recipient</span> will receive</label>
        <div class="col-md-6">
          <textarea class="form-control" form-validation-type="notes" height="5" id="items-to-deliver-${id}" name="items-to-deliver-${id}" readonly="true">Select items from above</textarea>
        </div>
      </div>

      <div class="form-group row">
        <label for="name-${id}" class="col-md-4 col-form-label">Name</label>
        <div class="col-md-6">
          <input type="text" class="form-control" form-validation-type="name" id="name-${id}" name="name-${id}" placeholder="Name">
        </div>
      </div>
      
      <div class="form-group row">
        <label for="telephone-${id}" class="col-md-4 col-form-label">Telephone Number</label>
        <div class="col-md-6">
          <input type="telephone" class="form-control" form-validation-type="phone" id="telephone-${id}" name="telephone-${id}" placeholder="Telephone Number">
        </div>
      </div>

      <div class="form-group row">
        <label for="address-${id}" class="col-md-4 col-form-label">Address</label>
        <div class="col-md-6">
          <input type="text" class="form-control" id="address-${id}" name="address-${id}" autocomplete="off" placeholder="Address">
          <input type="hidden" id="zone-${id}" name="zone-${id}">
          <input type="hidden" id="google-formatted-address-${id}" name="google-formatted-address-${id}">
          <div id="message-address-${id}"></div>
        </div>
      </div>
      
      <div class="form-group row">
        <label for="notes-address-${id}" class="col-md-4 col-form-label">Delivery Notes<br />(please include doorcode and floor)</label>
        <div class="col-md-6">
          <input type="text" class="form-control" id="notes-address-${id}" name="notes-address-${id}" placeholder="Delivery Notes">
        </div>
      </div>
      
      <div class="form-group row">
        <label for="message-${id}" class="col-md-4 col-form-label">Optional Message</label>
        <div class="col-md-6">
          <input type="text" class="form-control" id="message-${id}" name="message-${id}" placeholder="Message">
        </div>
      </div>

      <div class="form-group row">
        <div class="col-md-6 offset-md-4">
          <button type="button" class="btn btn-success item-button add-recipient" id="add-recipient-${id}" name="add-recipient">Add New Recipient</button>
          <button type="button" class="btn btn-danger item-button removerecipient" id="removerecipient-${id}" name="removerecipient">Remove</button>
        </div>
      </div>
    </fieldset>`;

  $(html).insertBefore('#submit-fieldset').hide().show(animationTime);
  updateButtonRow();
  setAddRemoveRecipientStatus();

  $(`#add-recipient-${id}`).click(() => {
    addNewRecipient();
  });
  $(`#removerecipient-${id}`).click(() => {
    removeRecipient(id);
  });

  // Validate Name
  $(`#name-${id}`).focusout(function callback() {
    validateInput($(this));
    $(`.recipient-legend-name-${id}`).text($(this).val());
  });

  // Validate Telephone Number
  $(`#telephone-${id}`).focusout(function callback() {
    validateInput($(this));
  });

  // Address
  setUpAddressDropdown(id);
  $(`#address-${id}`).focusout(() => validateGoogleAddress(id));
}

function getIdFromSelector(selector) {
  let [, id] = selector.attr('id').split('-');
  if (id != null) {
    id = parseInt(id, 10);
  }
  return id;
}

function validateAllInputs() {
  let valid = true;
  $('input[id^=name], input[id^=email], input[id^=telephone], textarea[id^=items-to-deliver]').each(function callback() {
    if ($(this).is(':visible')) {
      valid = validateInput($(this)) && valid;
    }
  });
  $('input[id^=address]').each(function callback() {
    if ($(this).is(':visible')) {
      const id = getDetailsFromId($(this).attr('id')).id;
      valid = validateGoogleAddress(id) && valid;
    }
  });
  console.log(valid);
  return valid;
}

function touchAllAddresses() {
  $('input[id^=address]').focusout();
}

// On DOM Loaded...
$(() => {
  // Select Items
  $('select[id^=quantity-]').change(() => {
    updateItems();
    updateButtonRow();
    setDelivery();
    showPurchaserDetails();
    updatePrice();
  });

  // Validate User Details as they are entered
  $('input[id^=name]').focusout(function callback() {
    const id = getIdFromSelector($(this));
    if (id != null) {
      let name = $(this).val();
      const index = recipients.findIndex((x) => x === id);
      if (name === '') {
        name = `Recipient ${index + 1}`;
      }
      $(`.recipient-legend-name-${id}`).text(name);
    }
    validateInput($(this));
  });
  $('input[id^=email], input[id^=telephone]').focusout(function callback() {
    validateInput($(this));
  });

  // Delivery Type
  $('#delivery').click(() => {
    const recipientsHidden = $('fieldset[id^=recipient').hide(animationTime);
    const deliveryShown = $('#user-delivery').show(animationTime);
    $('#address, #notes-address').prop('disabled', false);
    $.when(deliveryShown, recipientsHidden).done(() => {
      updatePrice();
    });
  });

  $('#collection').click(() => {
    const deliveryHidden = $('#user-delivery').hide(animationTime);
    const recipientsHidden = $('fieldset[id^=recipient').hide(animationTime);
    $.when(deliveryHidden, recipientsHidden).done(() => {
      updatePrice();
    });
  });

  $('#split-delivery').click(() => {
    const deliveryHidden = $('#user-delivery').hide(animationTime);
    const recipientsShown = $('fieldset[id^=recipient').show(animationTime);
    $.when(deliveryHidden, recipientsShown).done(() => {
      updatePrice();
    });
    if (recipients.length === 0) {
      addNewRecipient();
    }
  });

  // Address
  $('input[id^=address]').each(function callback() {
    const id = getIdFromSelector($(this));
    setUpAddressDropdown(id);
    $(this).focusout(() => validateGoogleAddress(id));
  });

  // Set up Add Recipient Button
  $('.add-recipient').click(() => {
    addNewRecipient();
  });
  $('.removerecipient').each(function callback() {
    const id = getIdFromSelector($(this));
    $(this).click(() => {
      removeRecipient(id);
    });
  });

  // Validate All when Submit Pressed
  $('.form-validate').click(() => validateAllInputs());

  // Apply Rebate Code
  $('#rebate-apply').click(() => {
    const code = $('#rebate-code').val();

    $.ajax({
      method: 'get',
      url: `${managementBaseUrl}/treatbox/lookuprebate`,
      data: {
        code
      }
    }).done((data) => {
      if (data.valid) {
        switch (data.code.type) {
          case 'zone3delivery':
            zone3delivery = true;
            touchAllAddresses();
            updatePrice();
            break;

          default:
            break;
        }
        $('#message-rebate-code').text('Code Applied!');
      } else {
        $('#message-rebate-code').text('Invalid Code');
      }
    }).catch(() => {
      $('#message-rebate-code').text('There was an error looking up your code');
    });
  });

  // Hide Loading Spinner and Show Page
  $('#loading-div').hide(animationTime);
  $('#date-selector, #product-selector, #submit-fieldset').show(animationTime);

  // Check if form is posted
  if (post) {
    if (deliveryType === 'split-delivery') {
      items = JSON.parse($('#items').val());
      recipients = JSON.parse($('#recipients').val());
      updateButtonRow();
      updateTextAreas();
      setAddRemoveRecipientStatus();
      validateAllInputs();
    }
    $('select[id^=quantity-]:first').trigger('change');
    $(`input[name=delivery-type][value=${deliveryType}`).click();
    if ($('#rebate-code').val() !== '') {
      $('#rebate-apply').trigger('click');
    }
  }
});
