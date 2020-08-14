/* global google, validateInput, setValid, initialiseBoundaries, getZone */

// Initialise Boundaries
initialiseBoundaries();

// Constants
// const managementBaseUrl = 'http://localhost:5000';
const managementBaseUrl = 'https://whisk-management.herokuapp.com';
const animationTime = 400;

/* HELPER FUNCTIONS */
// Get Postfix for identifier dependant on id
function getNamePostfix(id) {
  return id != null && id !== '' ? `-${id}` : '';
}

// Splits identifier into field and MongoDB ID`
function getDetailsFromMongoId(htmlId) {
  if (htmlId == null) {
    return { field: undefined, id: undefined };
  }
  const array = htmlId.split('-');
  if (array.length < 2) {
    return { field: undefined, id: undefined };
  }
  const [field, id] = array;
  return { field, id };
}

// Splits selector identifier into field and recipient ID
function getRecipientIdFromSelector(selector) {
  const identifier = selector.attr('id');
  if (identifier == null) {
    return null;
  }
  const [, id] = identifier.split('-');
  return id != null ? parseInt(id, 10) : null;
}

// Format number-type price in öre to user-viewable amount
function priceFormat(num, options = {}) {
  const includeOre = options.includeOre === true;
  const str = (num / 100).toLocaleString(undefined, {
    minimumFractionDigits: includeOre ? 2 : 0,
    maximumFractionDigits: includeOre ? 2 : 0
  });
  return options.includeSymbol === false ? str : `${str} SEK`;
}

// List of Items
const products = {
  details: [],
  basket: [],
  update() {
    const oldItems = this.details.filter((x) => x.recipient !== null);
    this.details = [];
    this.basket = [];
    const quantities = document.querySelectorAll('*[id^="quantity-"]');
    quantities.forEach((element) => {
      const quantity = parseInt(element.value, 10);
      const { id } = getDetailsFromMongoId(element.id);
      const name = element.getAttribute('data-name');
      const zone = parseInt(element.getAttribute('data-deliverable-zone'), 10);
      if (quantity > 0) {
        this.basket.push({ id, name, quantity });
      }

      for (let i = 0; i < quantity; i += 1) {
        const recipientIndex = oldItems.findIndex((x) => x.id === id);
        let recipient = null;
        if (recipientIndex > -1) {
          recipient = oldItems[recipientIndex].recipient;
          oldItems.splice(recipientIndex, 1);
        }

        this.details.push({
          id,
          name,
          zone,
          recipient
        });
      }
    });
  },
  for(recipientId) {
    return this.details.filter((x) => x.recipient === recipientId);
  }
};
let recipients = [];
const codes = new Set();

// Details
let productsOrderable;

/* DISPLAY FUNCTIONS */
// Reveal Purchaser/Delivery Details if hidden
function showPurchaserDetails() {
  if (!$('#purchaser-details').is(':visible')) {
    $('#purchaser-details, #delivery-details').show(animationTime);
  }
}

// Reveal correct delivery elements
function showDeliveryElement(type) {
  const defer = $.Deferred();
  const collection = type === 'collection'
    ? $('#user-collection').show(animationTime)
    : $('#user-collection').hide(animationTime);

  const delivery = type === 'delivery'
    ? $('#user-delivery').show(animationTime)
    : $('#user-delivery').hide(animationTime);

  const splitDelivery = type === 'split-delivery'
    ? $('fieldset[id^=recipient').show(animationTime)
    : $('fieldset[id^=recipient').hide(animationTime);

  $.when(collection, delivery, splitDelivery).done(() => {
    defer.resolve();
  });
  return defer;
}

// Update Price
function updatePrice() {
  const delivery = [0, 0, 0, 0];
  if (!$('#collection').is(':checked')) {
    $('input[id^=zone]').each(function callback() {
      const recipientId = getRecipientIdFromSelector($(this));
      const inputIdSelector = recipientId != null
        ? $(`#address-${recipientId}`)
        : $('#address');
      if (inputIdSelector.is(':visible') && inputIdSelector.hasClass('is-valid')) {
        const zone = parseInt($(this).val(), 10);
        if (zone >= 0 && zone <= 3) {
          delivery[zone] += 1;
        }
      }
    });
  }

  fetch(`${managementBaseUrl}/treatbox/lookupprice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      basket: products.basket,
      delivery,
      codes: Array.from(codes)
    })
  }).then((response) => response.json())
    .then((data) => {
      if (data.status === 'OK') {
        $('#food-cost').text(priceFormat(data.bottomLine.foodCost));
        $('#food-moms').text(priceFormat(data.bottomLine.foodMoms, { includeOre: true }));
        $('#delivery-cost').text(priceFormat(data.bottomLine.deliveryCost));
        $('#delivery-moms').text(priceFormat(data.bottomLine.deliveryMoms, { includeOre: true }));
        $('#total-cost').text(priceFormat(data.bottomLine.total));
        data.delivery.forEach((zone) => {
          const price = zone.price !== 0 ? priceFormat(zone.price) : 'Free';
          $(`.zone${zone.zone}-surcharge-amount`).text(price);
        });
      }
    });
}

// Validate address and generate message
function validateGoogleAddress(recipientId, options = {}) {
  const namePostfix = getNamePostfix(recipientId);

  const selector = $(`#address${namePostfix}`);
  const addressToValidate = $(`#address${namePostfix}`).val();
  const googleAddress = $(`#google-formatted-address${namePostfix}`).val();
  const zone = parseInt($(`#zone${namePostfix}`).val(), 10);

  let valid = true;
  const message = [];

  if (options.allowBlank !== false && addressToValidate === '') {
    valid = null;
  } else if (addressToValidate === '' || googleAddress !== addressToValidate || Number.isNaN(zone)) {
    message.push('Invalid Address, please select from dropdown menu');
    valid = false;
  } else {
    const usersItems = products.for(recipientId);
    const highestZone = usersItems.length > 0
      ? usersItems.map((x) => x.zone).reduce((a, b) => Math.max(a, b))
      : 2;
    valid = highestZone >= zone;

    if (zone === 0) {
      message.push('Local');
    } else {
      message.push(`Zone ${zone}`);
    }

    if (valid) {
      message.push(`<span class="zone${zone}-surcharge-amount">Free</span> Delivery`);
    } else {
      message.push('Delivery not available');
    }
  }

  setValid(selector, valid);
  $(`#message-address${namePostfix}`).html(message.join(' // '));
  updatePrice();

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
    document.getElementById(`address${namePostfix}`).value = googleLocation.formatted_address;
    document.getElementById(`google-formatted-address${namePostfix}`).value = googleLocation.formatted_address;
    document.getElementById(`zone${namePostfix}`).value = getZone(googleLocation.geometry.location);
    validateGoogleAddress(recipientId);
  });

  // Enter key should select Autocomplete item when list is open
  $(`#address${namePostfix}`).keydown((e) => !(e.which === 13 && $('.pac-container:visible').length));
}

function updateTextAreas() {
  recipients.forEach((recipient) => {
    const recipientsItems = products.details
      .filter((x) => x.recipient === recipient)
      .map((x) => x.name)
      .sort();
    const counts = {};
    recipientsItems.forEach((item) => {
      counts[item] = (counts[item] || 0) + 1;
    });
    const listItemsArray = Object.entries(counts).map((x) => `${x[1]} x ${x[0]}`);
    const listItems = listItemsArray.length > 0 ? listItemsArray.join(', ') : 'Select items from above';
    $(`#items-to-deliver-${recipient}`).val(listItems);
  });
}

function setAddRemoveRecipientStatus() {
  const unassignedItems = products.details.filter((x) => x.recipient === null).length;
  let assigned = recipients.length;
  for (let i = 0; i < recipients.length; i += 1) {
    if (products.details.filter((x) => x.recipient === recipients[i]).length > 0) {
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
    products.details.forEach((item, index) => {
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
    products.details.forEach((item, index) => {
      const selector = `${recipient}-item-${item.id}-${index}`;
      $(`#${selector}`).click(() => {
        if (item.recipient !== null) {
          products.details[index].recipient = null;
        } else {
          products.details[index].recipient = recipient;
        }
        updateButtonRow();
        updateTextAreas();
        setAddRemoveRecipientStatus();
        validateInput($(`#items-to-deliver-${recipient}`));
        validateGoogleAddress(recipient);
      });
    });
  });
  $('#items').val(JSON.stringify(products.details));
}

function removeRecipient(id) {
  products.details.map((x) => {
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
          <textarea class="form-control" data-validation-type="notes" height="5" id="items-to-deliver-${id}" name="items-to-deliver-${id}" readonly="true">Select items from above</textarea>
        </div>
      </div>

      <div class="form-group row">
        <label for="name-${id}" class="col-md-4 col-form-label">Name</label>
        <div class="col-md-6">
          <input type="text" class="form-control" data-validation-type="name" id="name-${id}" name="name-${id}" placeholder="Name">
        </div>
      </div>
      
      <div class="form-group row">
        <label for="telephone-${id}" class="col-md-4 col-form-label">Telephone Number</label>
        <div class="col-md-6">
          <input type="telephone" class="form-control" data-validation-type="phone" id="telephone-${id}" name="telephone-${id}" placeholder="Telephone Number">
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

function validateAllInputs() {
  let valid = true;
  $('input[id^=name], input[id^=email], input[id^=telephone], textarea[id^=items-to-deliver]').each(function callback() {
    if ($(this).is(':visible')) {
      valid = validateInput($(this)) && valid;
    }
  });
  $('input[id^=address]').each(function callback() {
    if ($(this).is(':visible')) {
      const { id } = getDetailsFromMongoId($(this).attr('id'));
      valid = validateGoogleAddress(id) && valid;
    }
  });
  return valid;
}

function touchAllAddresses() {
  $('input[id^=address]').focusout();
}

async function lookupRebateCode(code) {
  const data = await $.ajax({
    method: 'get',
    url: `${managementBaseUrl}/treatbox/lookuprebate`,
    data: {
      code
    }
  });
  if (data.valid) {
    switch (data.code.type) {
      case 'zone3delivery':
        $('select[id^=quantity-]').each(function callback() {
          if ($(this).attr('data-deliverable-zone') === '2') {
            $(this).attr('data-deliverable-zone', '3');
          }
        });
        products.update();
        touchAllAddresses();
        break;

      case 'costprice':
        updatePrice();
        break;

      default:
        break;
    }
  }
  return data;
}

function updateProductAvailability() {
  const selectedDate = document.getElementById('date').value;
  const orderableProduct = productsOrderable[selectedDate].products;
  Object.keys(orderableProduct).forEach((id) => {
    const element = document.getElementById(`quantity-${id}`);
    if (orderableProduct[id]) {
      element.disabled = false;
    } else {
      if (element.value > 0) {
        element.value = 0;
        $(`#quantity-${id}`).trigger('change');
      }
      element.disabled = true;
    }
  });
}

// On DOM Loaded...
$(() => {
  // Get orderable productsOrderable from DOM
  productsOrderable = window.orderable;

  // Update product availability when date changed
  $('#date').change(updateProductAvailability);

  // Select Items
  $('select[id^=quantity-]').change(() => {
    products.update();
    updateButtonRow();
    setAddRemoveRecipientStatus();
    showPurchaserDetails();
    touchAllAddresses();
  });

  // Validate User Details as they are entered
  $('input[id^=name]').focusout(function callback() {
    // Update Legend Title if split delivery recipient
    const id = getRecipientIdFromSelector($(this));
    if (id != null) {
      const index = recipients.findIndex((x) => x === id);
      const name = $(this).val() === '' ? `Recipient ${index + 1}` : $(this).val();
      $(`.recipient-legend-name-${id}`).text(name);
    }

    // Validate Input
    validateInput($(this));
  });
  $('input[id^=email], input[id^=telephone]').focusout(function callback() {
    validateInput($(this));
  });

  // Delivery Type
  $('#delivery, #collection, #split-delivery').click(function callback() {
    const id = $(this).attr('id');
    showDeliveryElement(id).done(() => {
      updatePrice();
    });
    if (id === 'split-delivery' && recipients.length === 0) {
      addNewRecipient();
    }
  });

  // Address
  $('input[id^=address]').each(function callback() {
    const id = getRecipientIdFromSelector($(this));
    setUpAddressDropdown(id);
    $(this).focusout(() => validateGoogleAddress(id));
  });

  // Set up Add Recipient Button
  $('.add-recipient').click(() => {
    addNewRecipient();
  });
  $('.removerecipient').each(function callback() {
    const id = getRecipientIdFromSelector($(this));
    $(this).click(() => {
      removeRecipient(id);
    });
  });

  // Validate All when Submit Pressed
  $('.form-validate').click(() => validateAllInputs());

  // Apply Rebate Code
  $('#rebate-apply').click(() => {
    const code = $('#rebate-entry').val();
    lookupRebateCode(code).then((data) => {
      if (data.valid) {
        codes.add(data.code.value);
        $('#rebate-codes').val(JSON.stringify(Array.from(codes)));
        $('#rebate-message').text('Code Applied!');
        updatePrice();
      } else {
        $('#rebate-message').text('Invalid Code');
      }
    }).catch(() => {
      $('#rebate-message').text('There was an error looking up your code');
    });
  });

  // Hide Loading Spinner and Show Page
  $('#date').trigger('change');
  $('#loading-div').hide(animationTime);
  $('#date-selector, #product-selector, #submit-fieldset').show(animationTime);

  // Check if form is posted
  if (window.post) {
    if (window.deliveryType === 'split-delivery') {
      products.details = JSON.parse($('#items').val());
      recipients = JSON.parse($('#recipients').val());
      updateButtonRow();
      updateTextAreas();
      setAddRemoveRecipientStatus();
    }
    $('select[id^=quantity-]:first').trigger('change');
    $(`input[name=delivery-type][value=${window.deliveryType}]`).click();
    if ($('#rebate-codes').val() !== '') {
      const codesToApply = JSON.parse($('#rebate-codes').val());
      codesToApply.forEach((code) => {
        codes.add(code);
        lookupRebateCode(code);
      });
      updatePrice();
    }
    validateAllInputs();
  }
});
