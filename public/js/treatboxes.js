/* global validateInput, validateItems, google, postData, dateFormat, printMessage */

// Properties
import products from './products.js';
import recipients from './recipients.js';
import {
  initialise,
  isLocal,
  inZoneOne,
  inZoneTwo
} from './boundaries.js';

// Get Details
const managementUrl = 'https://whisk-management.herokuapp.com/';
const dataLoading = fetch(`${managementUrl}treatbox/orderdetails`);

// Settings
let zone3delivery = false;

initialise();

const animationTime = 400;
const dateFormatString = 'dddd dS mmmm';

let timeframe;

const deliveryType = {
  DELIVERY: 'delivery',
  COLLECTION: 'collection',
  SPLIT: 'split-delivery'
};

const user = {
  name: '',
  email: '',
  telephone: ''
};

const delivery = {
  date: '',
  type: deliveryType.COLLECTION,
  address: '',
  zone: 3,
  googleFormattedAddress: '',
  notes: ''
};

function addSlashes(str) {
  return str.replace('"', '\"');
}

function getIdFromHtmlId(htmlId) {
  let id = htmlId.split('-');
  id = parseInt(id[id.length - 1], 10);
  if (Number.isNaN(id)) {
    return null;
  }
  return id;
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

function validateGoogleAddress(selector, recipient) {
  let valid = true;
  let message;
  const surcharge = products.cost.zone2Surcharge();

  if (selector.val() === '') {
    valid = null;
    message = '';
  } else if (recipient.googleFormattedAddress !== selector.val()) {
    message = 'Invalid Address, please select from dropdown menu';
    valid = false;
  } else if (recipient.zone === 3) {
    if (zone3delivery) {
      message = `Zone 3 // ${surcharge}kr Surcharge`;
    } else {
      message = 'Outside Delivery Area';
      valid = false;
    }
  } else if (recipient.zone === 0) {
    message = 'Local';
  } else if (recipient.zone === 1) {
    message = 'Zone 1';
  } else {
    message = `Zone ${recipient.zone} // ${surcharge}kr Surcharge`;
  }

  printMessage(selector, valid);
  return message;
}

function validateAllAddresses() {
  $('#message-address').text(validateGoogleAddress($('#address'), delivery));
  recipients.list.forEach((recipient) => {
    $(`#message-address-${recipient.id}`).text(validateGoogleAddress($(`#address-${recipient.id}`), recipient));
  })
}

function setDates(id = -1) {
  for (let i = 0; i < Reflect.ownKeys(timeframe).length; i += 1) {
    const week = Reflect.ownKeys(timeframe)[i];
    if (timeframe[week].orderable) {
      $('#date').append(`<option value="${week}">${dateFormat(new Date(timeframe[week].delivery), dateFormatString)}</option>`);
    }
  }
  if (id === -1) {
    delivery.date = $('#date option:first').val();
  } else {
    delivery.date = id;
  }
}

function updateNumRecipients() {
  $('#recipients').val(recipients.numRecipients());
}

function updatePrice() {
  $('#food-cost').text(products.cost.foodCost());
  $('#food-moms').text(products.cost.foodMoms());
  $('#delivery-cost').text(products.cost.deliveryCost());
  $('#delivery-moms').text(products.cost.deliveryMoms());
  $('#total-cost').text(products.cost.totalCost());
}

function calculateDelivery() {
  let deliveryCost = 0;
  switch (delivery.type) {
    case deliveryType.DELIVERY:
      if (delivery.zone === 2) {
        products.cost.setDeliveryCost(products.cost.ZONE_2_DELIVERY_COST);
          $('#numZone2Deliveries').val(1);
      } else {
        products.cost.setDeliveryCost(0);
          $('#numZone2Deliveries').val(0);
      }
      break;

    case deliveryType.SPLIT:
      let numZone2Deliveries = 0;
      recipients.list.forEach((recipient) => {
        if (recipient.zone === 2) {
          deliveryCost += products.cost.ZONE_2_DELIVERY_COST;
          numZone2Deliveries += 1;
        }
      });
      products.cost.setDeliveryCost(deliveryCost);
      $('#numZone2Deliveries').val(numZone2Deliveries);
      break;

    case deliveryType.COLLECTION:
    default:
      products.cost.setDeliveryCost(0);
      break;
  }
  updatePrice();
}

// Function to set up Google Maps Autocomplete Dropdown on address fields
// Requires an html id
function setUpAddressDropdown(recipientParam = delivery) {
  const recipient = recipientParam;

  let namePostfix = '';
  if (recipient.id !== undefined) {
    namePostfix = `-${recipient.id}`;
  }

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

    // Set Delivery Address
    recipient.address = googleLocation.formatted_address;
    $(`#address${namePostfix}`).val(recipient.address);

    // Set Google Place Id
    recipient.googleFormattedAddress = googleLocation.formatted_address;
    $(`#google-formatted-address${namePostfix}`).val(recipient.googleFormattedAddress);

    // Set Zone
    recipient.zone = getZone(googleLocation.geometry.location);
    $(`#zone${namePostfix}`).val(recipient.zone);

    // Validate Address
    $(`#message-address${namePostfix}`).text(validateGoogleAddress($(`#address${namePostfix}`), recipient));

    // Update delivery cost
    calculateDelivery();
  });
  $(`#address${namePostfix}`).keydown((e) => {
    if (e.which === 13 && $('.pac-container:visible').length) {
      return false;
    }
    return true;
  });
}

function hideRecipients() {
  $('#split-delivery-buttons').hide(animationTime);
  recipients.list.forEach((recipient) => {
    $(`#recipient-${recipient.id}`).hide(animationTime);
  });
}

function showRecipients() {
  $('#split-delivery-buttons').show(animationTime);
  recipients.list.forEach((recipient) => {
    $(`#recipient-${recipient.id}`).show(animationTime);
  });
}

// Send variables to Page
function applyProperties() {
  $('#date').val(delivery.date).trigger('change');
  $('#num-comboboxes').val(products.comboBoxes);
  $('#num-treatboxes').val(products.treatBoxes);
  $('#num-vegetableboxes').val(products.vegetableBoxes);
  $('#name').val(user.name);
  $('#email').val(user.email);
  $('#telephone').val(user.telephone);
  switch (delivery.type) {
    case deliveryType.DELIVERY:
      $('#delivery').trigger('click');
      break;

    case deliveryType.SPLIT:
      $('#split-delivery').trigger('click');
      break;

    case deliveryType.COLLECTION:
    default:
      $('#collection').trigger('click');
      break;
  }
  $('#address').val(delivery.address);
  $('#google-formatted-address').val(delivery.googleFormattedAddress);
  $('#zone').val(delivery.zone);
  $('#notes-address').val(delivery.notes);
  $('#combo-box-price').text(products.types.COMBO_BOX.price());
  $('#treat-box-price').text(products.types.TREAT_BOX.price());
  $('#vegetable-box-price').text(products.types.VEGETABLE_BOX.price());

  updatePrice();
}

// Function to disable or enable delivery buttons depending on items purchased
function setDelivery() {
  if (products.comboBoxes === 0 && products.treatBoxes === 0) {
    $('#delivery').prop('disabled', true);
    $('#split-delivery').prop('disabled', true);
    $('#collection').prop('checked', true).trigger('click');
  } else {
    $('#delivery').prop('disabled', false);
    $('#split-delivery').prop('disabled', false);
  }
}

// Function to update textareas for all recipients
function updateTextareas() {
  recipients.list.forEach((recipient) => {
    const { id } = recipient;
    let comboBoxes = 0;
    let treatBoxes = 0;
    let vegetableBoxes = 0;
    const textArray = [];
    let textStr;
    products.selected.forEach((product) => {
      if (product.recipientId === id) {
        switch (product.productType) {
          case products.types.COMBO_BOX.name:
            comboBoxes += 1;
            break;
          case products.types.TREAT_BOX.name:
            treatBoxes += 1;
            break;
          case products.types.VEGETABLE_BOX.name:
            vegetableBoxes += 1;
            break;
          default:
            // Do Nothing
        }
      }
    });
    if (comboBoxes > 0) {
      textArray.push(`${comboBoxes} x ${products.types.COMBO_BOX.name}`);
    }
    if (treatBoxes > 0) {
      textArray.push(`${treatBoxes} x ${products.types.TREAT_BOX.name}`);
    }
    if (vegetableBoxes > 0) {
      textArray.push(`${vegetableBoxes} x ${products.types.VEGETABLE_BOX.name}`);
    }
    if (textArray.length === 0) {
      textStr = 'Select items from above';
    } else {
      textStr = textArray.join(', ');
    }
    $(`#items-to-deliver-${id}`).text(textStr);
  });
}

function updateRecipientsItems(recipientId) {
  const recipient = recipients.getRecipient(recipientId);
  $(`#recipient-num-comboboxes-${recipientId}`).val(recipient.numComboBoxes);
  $(`#recipient-num-treatboxes-${recipientId}`).val(recipient.numTreatBoxes);
  $(`#recipient-num-vegetableboxes-${recipientId}`).val(recipient.numVegetableBoxes);
}

function addItemToRecipient(recipientId, item) {
  recipients.addItem(recipientId, item);
  updateRecipientsItems(recipientId);
  products.addRecipient(item.id, recipientId);
  updateTextareas();
}

function removeItemFromRecipient(recipientId, item) {
  recipients.removeItem(recipientId, item);
  updateRecipientsItems(recipientId);
  products.removeRecipient(item.id);
  updateTextareas();
}

function setAddRecipientStatus() {
  if (products.allClaimed() || products.totalDeliverableItems() <= recipients.numRecipients()) {
    $('.add-recipient').prop('disabled', true);
  } else {
    $('.add-recipient').prop('disabled', false);
  }
}

// Functions to Update View
function updateButtonRow() {
  recipients.list.forEach((recipient) => {
    const recipientId = recipient.id;
    let buttons = '';
    products.selected.forEach((product) => {
      const selector = `${recipientId}-item-${product.id}`;

      let buttonType;
      let cross = '';
      let disabled = '';
      if (product.recipientId === null) {
        buttonType = 'btn-info';
      } else if (product.recipientId === recipientId) {
        cross = '&times; ';
        buttonType = 'btn-secondary';
      } else {
        buttonType = 'btn-secondary';
        disabled = ' disabled="true"';
      }
      if (product.recipientId === recipientId) {
        cross = '&times; ';
      }
      buttons += `<button type="button" class="btn ${buttonType} item-button btn-sm" id="${selector}" name="${selector}"${disabled}>${cross}${product.productType}</button>`;
    });

    $(`#button-row-${recipientId}`).html(buttons);

    products.selected.forEach((product) => {
      if (product.recipientId === null) {
        $(`#${recipientId}-item-${product.id}`).click(() => {
          addItemToRecipient(recipientId, product);
          updateButtonRow();
          setAddRecipientStatus();
        });
      } else {
        $(`#${recipientId}-item-${product.id}`).click(() => {
          removeItemFromRecipient(recipientId, product);
          updateButtonRow();
          setAddRecipientStatus();
        });
      }
    });
  });
}

function removeRecipient(recipientId) {
  const recipient = recipients.getRecipient(recipientId);
  recipient.itemsToDeliver.forEach((itemId) => {
    const item = products.getProduct(itemId);
    removeItemFromRecipient(recipientId, item);
  });
  recipients.remove(recipientId);
  $(`#recipient-${recipientId}`).remove();
  calculateDelivery();
  updateButtonRow();
  setAddRecipientStatus();
  updateNumRecipients();
}

function addNewRecipient(details = {}) {
  let newRecipient;
  if (recipients.numRecipients() === 0 && Object.keys(details).length === 0) {
    newRecipient = recipients.add(
      user.name,
      user.telephone,
      delivery.address,
      delivery.googleFormattedAddress,
      delivery.zone,
      delivery.notes
    );
  } else if (details !== {}) {
    newRecipient = recipients.add(
      details.name,
      details.telephone,
      details.address,
      details.googleFormattedAddress,
      details.zone,
      details.notes,
      details.message
    );
  } else {
    newRecipient = recipients.add();
  }

  const legendHeader = newRecipient.name === '' ? `Recipient ${newRecipient.id + 1}` : newRecipient.name;
  const html = `
      <fieldset class="form-group" id="recipient-${newRecipient.id}">
      <legend class="recipient-legend-name-${newRecipient.id}">${legendHeader}</legend>

      <div class="form-group row">
        <label for="buttons" class="col-md-4 col-form-label">Select items to deliver</label>
        <div class="col-md-8 button-row" id="button-row-${newRecipient.id}"></div>
      </div>
    
      <div class="form-group row">
        <label for="items-to-deliver" class="col-md-4 col-form-label"><span class="recipient-legend-name-${newRecipient.id}">${legendHeader}</span> will receive</label>
        <div class="col-md-6">
          <textarea class="form-control" form-validation-type="notes" height="5" id="items-to-deliver-${newRecipient.id}" name="items-to-deliver-${newRecipient.id}" readonly="true">Select items from above</textarea>
          <input type="hidden" name="recipient-num-comboboxes-${newRecipient.id}" id="recipient-num-comboboxes-${newRecipient.id}" value="0" />
          <input type="hidden" name="recipient-num-treatboxes-${newRecipient.id}" id="recipient-num-treatboxes-${newRecipient.id}" value="0" />
          <input type="hidden" name="recipient-num-vegetableboxes-${newRecipient.id}" id="recipient-num-vegetableboxes-${newRecipient.id}" value="0" />
        </div>
      </div>

      <div class="form-group row">
        <label for="name-${newRecipient.id}" class="col-md-4 col-form-label">Name</label>
        <div class="col-md-6">
          <input type="text" class="form-control" form-validation-type="name" id="name-${newRecipient.id}" name="name-${newRecipient.id}" placeholder="Name" value="${newRecipient.name}">
        </div>
      </div>
      
      <div class="form-group row">
        <label for="telephone-${newRecipient.id}" class="col-md-4 col-form-label">Telephone Number</label>
        <div class="col-md-6">
          <input type="telephone" class="form-control" form-validation-type="phone" id="telephone-${newRecipient.id}" name="telephone-${newRecipient.id}" placeholder="Telephone Number" value="${newRecipient.telephone}">
        </div>
      </div>

      <div class="form-group row">
        <label for="address-${newRecipient.id}" class="col-md-4 col-form-label">Address</label>
        <div class="col-md-6">
          <input type="text" class="form-control" id="address-${newRecipient.id}" name="address-${newRecipient.id}" autocomplete="off" placeholder="Address" value="${newRecipient.address}">
          <input type="hidden" id="zone-${newRecipient.id}" name="zone-${newRecipient.id}" value="${newRecipient.zone}">
          <input type="hidden" id="google-formatted-address-${newRecipient.id}" name="google-formatted-address-${newRecipient.id}" value="${newRecipient.googleFormattedAddress}">
          <div id="message-address-${newRecipient.id}"></div>
        </div>
      </div>
      
      <div class="form-group row">
        <label for="notes-address-${newRecipient.id}" class="col-md-4 col-form-label">Delivery Notes<br />(please include doorcode and floor)</label>
        <div class="col-md-6">
          <input type="text" class="form-control" id="notes-address-${newRecipient.id}" name="notes-address-${newRecipient.id}" placeholder="Delivery Notes" value="${newRecipient.notes}">
        </div>
      </div>
      
      <div class="form-group row">
        <label for="message-${newRecipient.id}" class="col-md-4 col-form-label">Optional Message</label>
        <div class="col-md-6">
          <input type="text" class="form-control" id="message-${newRecipient.id}" name="message-${newRecipient.id}" placeholder="Message" value="${newRecipient.message}">
        </div>
      </div>

      <div class="form-group row">
        <div class="col-md-6 offset-md-4">
          <button type="button" class="btn btn-success item-button add-recipient" id="add-recipient-${newRecipient.id}" name="add-recipient">Add New Recipient</button>
          <button type="button" class="btn btn-danger item-button remove-recipient" id="remove-recipient-${newRecipient.id}" name="remove-recipient">Remove</button>
        </div>
      </div>
    </fieldset>`;

  $(html).insertBefore('#submit-fieldset').hide().show(animationTime);
  updateButtonRow();

  if (newRecipient.name !== '') {
    validateInput($(`#name-${newRecipient.id}`));
  }
  if (newRecipient.telephone !== '') {
    validateInput($(`#telephone-${newRecipient.id}`));
  }
  if (newRecipient.address !== '') {
    $(`#message-address-${newRecipient.id}`).text(validateGoogleAddress($(`#address-${newRecipient.id}`), newRecipient));
  }

  // User Details
  $(`#name-${newRecipient.id}`).focusout(function callback() {
    newRecipient.name = $(this).val();
    validateInput($(this));
    if (newRecipient.name === '') {
      $(`.recipient-legend-name-${newRecipient.id}`).text(`Recipient ${newRecipient.id + 1}`);
    } else {
      $(`.recipient-legend-name-${newRecipient.id}`).text(newRecipient.name);
    }
  });

  $(`#telephone-${newRecipient.id}`).focusout(function callback() {
    newRecipient.telephone = $(this).val();
    validateInput($(this));
  });

  setUpAddressDropdown(newRecipient);
  $(`address-${newRecipient.id}`).focusout(function callback() {
    $(`#message-address-${newRecipient.id}`).text(validateGoogleAddress($(this), delivery));
  });

  $(`#notes-address-${newRecipient.id}`).change(function callback() {
    newRecipient.notes = $(this).val();
  });

  $(`#add-recipient-${newRecipient.id}`).click(() => {
    addNewRecipient();
  });

  $(`#remove-recipient-${newRecipient.id}`).click(() => {
    removeRecipient(newRecipient.id);
  });

  calculateDelivery();
  setAddRecipientStatus();
  updateNumRecipients();

  return newRecipient;
}

function validateAll() {
  const form = $('#treatbox-form');
  let valid = validateItems();
  $(`form#${form.attr('id')} :input`).each(function subCallback() {
    if ($(this).attr('form-validation-type') !== undefined) {
      valid = validateInput($(this)) && valid;
    }
  });
  $('[id^="address"]').each(function callback() {
    const id = getIdFromHtmlId($(this).prop('id'));
    if (id === null) {
      valid = validateGoogleAddress($(this), delivery) && valid;
    } else {
      const recipient = recipients.getRecipient(id);
      valid = validateGoogleAddress($(this), recipient) && valid;
    }
  });
  return valid;
}

$(document).ready(() => {
  $('#date').change(function callback() {
    const week = $(this).val();
    delivery.date = week;
    $('#date-text').val($('#date option:selected').text());
    if (timeframe[week].vegetablesOrderable) {
      $('#num-comboboxes').prop('disabled', false);
      $('#num-vegetableboxes').prop('disabled', false);
    } else {
      $('#num-comboboxes').val('0').trigger('change').prop('disabled', true);
      $('#num-vegetableboxes').val('0').trigger('change').prop('disabled', true);
    }
  });

  // Select Items
  $('#num-comboboxes, #num-treatboxes, #num-vegetableboxes').change(function callback() {
    const previousTotalDeliverable = products.totalDeliverableItems();
    const previousTotal = products.totalItems();

    // Remove removed items from recipients
    const removedItems = products.update($(this));
    for (let i = 0; i < removedItems.length; i += 1) {
      if (removedItems[i].recipientId != null) {
        const recipient = recipients.list[removedItems[i].recipientId];
        for (let j = 0; j < recipient.itemsToDeliver.length; j += 1) {
          if (recipient.itemsToDeliver[j].id === removedItems[i].id) {
            recipient.itemsToDeliver[j].pop();
          }
        }
      }
    }

    // Update Views
    updateButtonRow();
    updateTextareas();
    updatePrice();
    setDelivery();
    setAddRecipientStatus();

    if (previousTotalDeliverable === 0 && products.totalDeliverableItems() > 0) {
      $('#delivery').trigger('click');
    }

    if (previousTotal === 0 && products.totalItems() > 0) {
      $('#purchaser-details').show(animationTime);
      $('#delivery-details').show(animationTime);
    }
  });

  // User Details
  $('#name').focusout(function callback() {
    user.name = $(this).val();
    validateInput($(this));
  });

  $('#email').focusout(function callback() {
    user.email = $(this).val();
    validateInput($(this));
  });

  $('#telephone').focusout(function callback() {
    user.telephone = $(this).val();
    validateInput($(this));
  });

  // Delivery Type
  $('#delivery').click(() => {
    delivery.type = deliveryType.DELIVERY;
    calculateDelivery();
    $('#user-delivery').show(animationTime);
    $('#address').prop('disabled', false);
    $('#notes-address').prop('disabled', false);
    hideRecipients();
  });

  $('#collection').click(() => {
    delivery.type = deliveryType.COLLECTION;
    calculateDelivery();
    $('#user-delivery').hide(animationTime);
    hideRecipients();
  });

  $('#split-delivery').click(() => {
    delivery.type = deliveryType.SPLIT;
    calculateDelivery();
    $('#user-delivery').hide(animationTime);
    showRecipients();
    if (recipients.numRecipients() === 0) {
      addNewRecipient();
    }
  });

  setUpAddressDropdown();
  $('#address').focusout(function callback() {
    $('#message-address').text(validateGoogleAddress($(this), delivery));
  });

  $('#notes-address').change(function callback() {
    delivery.notes = $(this).val();
  });

  $('#add-recipient').click(() => {
    addNewRecipient();
  });

  $('#rebate-apply').click(() => {
    const code = $('#rebate-code').val();

    $.ajax({
      method: 'get',
      url: `${managementUrl}treatbox/lookuprebate`,
      data: {
        code
      }
    }).done((data) => {
      if (data.valid) {
        switch (data.code.type) {
          case 'zone3delivery':
            zone3delivery = true;
            validateAllAddresses();
            break;

          default:
            break;
        }
        $('#message-rebate-code').text('Code Applied!');
      } else {
        $('#message-rebate-code').text('Invalid Code');
      }
    }).catch((error) => {
      console.log(error);
    });
  });

  $('.form-validate').click(() => validateAll());

  dataLoading
    .then((response) => response.json())
    .then((data) => {
      products.setPrice(data);
      timeframe = data.timeframe;

      // Populate form if amending
      if (Object.keys(postData).length > 0) {
        $('#num-comboboxes').val(postData['num-comboboxes']).trigger('change');
        $('#num-treatboxes').val(postData['num-treatboxes']).trigger('change');
        $('#num-vegetableboxes').val(postData['num-vegetableboxes']).trigger('change');
        products.calculateFoodCost();
        user.name = postData.name;
        user.email = postData.email;
        user.telephone = postData.telephone;
        delivery.type = postData['delivery-type'];
        delivery.address = postData.address;
        delivery.zone = parseInt(postData.zone, 10);
        delivery.googleFormattedAddress = postData['google-formatted-address'];
        delivery.notes = postData['notes-address'];

        if (delivery.type === 'split-delivery') {
          let i = 0;
          let numRecipients = postData['recipients'];
          let counter = 0;
          console.log(numRecipients);

          while (counter < numRecipients) {
            if (`name-${i}` in postData) {
              const newRecipient = addNewRecipient({
                name: postData[`name-${i}`],
                telephone: postData[`telephone-${i}`],
                address: postData[`address-${i}`],
                zone: parseInt(postData[`zone-${i}`], 10),
                googleFormattedAddress: postData[`google-formatted-address-${i}`],
                notes: postData[`notes-address-${i}`],
                message: postData[`message-${i}`]
              });
              let numComboBoxes = parseInt(postData[`recipient-num-comboboxes-${i}`], 10);
              let numTreatBoxes = postData[`recipient-num-treatboxes-${i}`];
              let numVegetableBoxes = postData[`recipient-num-vegetableboxes-${i}`];
              products.selected.forEach((product) => {
                if (product.recipientId === null) {
                  switch (product.productType) {
                    case products.types.COMBO_BOX.name:
                      if (numComboBoxes > 0) {
                        addItemToRecipient(newRecipient.id, product);
                        numComboBoxes -= 1;
                      }
                      break;
                    case products.types.TREAT_BOX.name:
                      if (numTreatBoxes > 0) {
                        addItemToRecipient(newRecipient.id, product);
                        numTreatBoxes -= 1;
                      }
                      break;
                    case products.types.VEGETABLE_BOX.name:
                      if (numVegetableBoxes > 0) {
                        addItemToRecipient(newRecipient.id, product);
                        numVegetableBoxes -= 1;
                      }
                      break;
                    default:
                      break;
                  }
                }
              });
              counter += 1; 
            }
            i += 1;
          }
        }
      }

      setDates(postData.date);

      $('#loading-div').hide(animationTime);
      $('#date-selector').show(animationTime);
      $('#product-selector').show(animationTime);
      $('#submit-fieldset').show(animationTime);

      applyProperties();
      setDelivery();
      calculateDelivery();
      updateButtonRow();
      setAddRecipientStatus();

      if (Object.keys(postData).length > 0) {
        validateAll();
      }
    });
});
