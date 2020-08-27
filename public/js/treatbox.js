/* global dataLayer, google, ejs, validateInput, setValid, initialiseBoundaries, getZone */
// Constants
// const managementBaseUrl = 'http://localhost:5000';
const managementBaseUrl = 'https://whisk-management.herokuapp.com';
const templates = {
  buttonRow: `<% buttons.forEach((button) => { %>
<button type="button" class="btn <%
  if (button.recipient == null) {
    %>btn-info<%
   } else {
     %>btn-secondary<%
   } %> item-button btn-sm" id="<%=button.id %>" name="<%=button.id %>"<%
   if (button.disabled) {
    %> disabled="true"<%
   } %>><%
   if (button.recipient != null && !button.disabled) {
     %>&times;&nbsp;<%
   } %><%=button.name %></button><%
}); %>`
};

/* HELPER FUNCTIONS */
// Get Postfix for identifier dependant on id
function getNamePostfix(id) {
  return id != null && id !== '' ? `-${id}` : '';
}

// Splits identifier into field and recipient ID
function getDetailsFromHtmlId(htmlId, options = {}) {
  if (htmlId == null) {
    return { field: undefined, id: undefined };
  }
  const [field, rawId] = htmlId.split('-');
  const numberId = parseInt(rawId, 10);
  let id = Number.isNaN(numberId) || options.noConvert === true ? rawId : numberId;
  id = id == null ? null : id;
  return {
    field,
    id
  };
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
  element: document.getElementById('items'),
  details: [],
  basket: [],
  update() {
    const oldItems = this.details.filter((x) => x.recipient !== null);
    this.details = [];
    this.basket = [];
    const quantities = document.querySelectorAll('*[id^="quantity-"]');
    quantities.forEach((element) => {
      const quantity = parseInt(element.value, 10);
      const { id } = getDetailsFromHtmlId(element.id, { noConvert: true });
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
  for(recipientId = null) {
    return this.details.filter((x) => x.recipient === recipientId);
  },
  sendToBody() {
    this.element.value = JSON.stringify(this.details);
  },
  getFromBody() {
    this.details = JSON.parse(this.element.value);
  }
};

// List of Recipients
const recipients = {
  element: document.getElementById('recipients'),
  ids: [],
  recipients: [],
  indexOf(id) {
    return this.ids.findIndex((x) => x === id);
  },
  isEmpty() {
    return this.ids.length === 0;
  },
  addNew() {
    const id = !this.isEmpty()
      ? this.ids[this.ids.length - 1] + 1
      : 0;
    this.ids.push(id);
    return id;
  },
  update() {
    products.update();

    // If purchaser is recipient, set id array to null
    const idArray = this.ids.length === 0 ? [null] : this.ids;

    // Create recipients array for lookupPrice API
    this.recipients = idArray.map((recipientId) => {
      const count = products.for(recipientId).reduce((total, product) => {
        const newTotal = total;
        newTotal[product.id] = (newTotal[product.id] || 0) + 1;
        return newTotal;
      }, {});
      const productQuantities = Object.keys(count).map((productId) => ({
        id: productId,
        quantity: count[productId]
      }));
      return {
        id: recipientId,
        zone: parseInt(document.getElementById(`zone${getNamePostfix(recipientId)}`).value, 10),
        products: productQuantities
      };
    });
  },
  sendToBody() {
    this.element.value = JSON.stringify(this.ids);
  },
  getFromBody() {
    this.ids = JSON.parse(this.element.value);
  }
};

// List of Rebate Codes
const codes = new Set();

// Details
let productsOrderable;

/* DISPLAY FUNCTIONS */
// Show a hidden Element
function show(ids) {
  const elements = document.querySelectorAll(ids);
  for (let i = 0; i < elements.length; i += 1) {
    elements[i].classList.remove('hidden');
    elements[i].classList.add('visible');
  }
}

// Hide an Element
function hide(ids) {
  const elements = document.querySelectorAll(ids);
  for (let i = 0; i < elements.length; i += 1) {
    elements[i].classList.remove('visible');
    elements[i].classList.add('hidden');
  }
}

function isVisible(element) {
  const parent = element.closest('.hideable');
  return parent.classList.contains('visible');
}

// Reveal correct delivery elements
function showDeliveryElement() {
  switch (window.deliveryType) {
    case 'delivery':
      show(['#user-delivery']);
      hide(['#user-collection', '#split-delivery-buttons', 'fieldset[id^="recipient"']);
      break;

    case 'split-delivery':
      show(['#split-delivery-buttons', 'fieldset[id^="recipient"']);
      hide(['#user-collection', '#user-delivery']);
      break;

    case 'collection':
    default:
      show(['#user-collection']);
      hide(['#user-delivery', '#split-delivery-buttons', 'fieldset[id^="recipient"']);
      break;
  }
}

function setAddressMessages(data) {
  const addresses = document.querySelectorAll('input[id^="address"]');
  for (let i = 0; i < addresses.length; i += 1) {
    const { id } = getDetailsFromHtmlId(addresses[i].id);
    const deliveryInfo = data.filter((x) => x.recipientId === id)[0] || {};
    const invalid = addresses[i].classList.contains('is-invalid');
    const namePostfix = getNamePostfix(id);
    const zone = parseInt(document.getElementById(`zone${namePostfix}`).value, 10);
    const message = [];
    switch (zone) {
      case 0:
        message.push('Local');
        break;

      case 1:
      case 2:
      case 3:
        message.push(`Zone ${zone}`);
        break;

      default:
        break;
    }
    if (invalid && zone === -1) {
      message.push('Invalid Address');
    } else if (invalid) {
      message.push('Delivery Not Available');
    } else if (deliveryInfo.price === 0) {
      message.push('Free Delivery');
    } else if (deliveryInfo.price > 0) {
      message.push(`${priceFormat(deliveryInfo.price)} Delivery`);
    }
    document.getElementById(`message-address${namePostfix}`).innerHTML = message.join(' // ');
  }
}

// Update Price
function updatePrice() {
  recipients.update();
  fetch(`${managementBaseUrl}/treatbox/lookupprice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      basket: products.basket,
      recipients: recipients.recipients,
      codes: JSON.stringify(Array.from(codes))
    })
  }).then((response) => response.json())
    .then((data) => {
      if (data.status === 'OK') {
        document.getElementById('food-cost').innerHTML = priceFormat(data.bottomLine.foodCost);
        document.getElementById('food-moms').innerHTML = priceFormat(data.bottomLine.foodMoms, { includeOre: true });
        document.getElementById('delivery-cost').innerHTML = priceFormat(data.bottomLine.deliveryCost);
        document.getElementById('delivery-moms').innerHTML = priceFormat(data.bottomLine.deliveryMoms, { includeOre: true });
        if (data.bottomLine.discount > 0) {
          document.getElementById('discount-amount').innerHTML = priceFormat(data.bottomLine.discount);
          document.getElementById('discount-moms').innerHTML = priceFormat(data.bottomLine.discountMoms, { includeOre: true });
          document.getElementById('discount-row').classList.remove('discount-row-hidden');
        }
        document.getElementById('total-cost').innerHTML = priceFormat(data.bottomLine.total);
        setAddressMessages(data.delivery);
      }
    });
}

// Validate address and generate message
function validateGoogleAddress(recipientId, options = {}) {
  const namePostfix = getNamePostfix(recipientId);

  const element = document.getElementById(`address${namePostfix}`);
  const addressToValidate = element.value;
  const googleAddress = document.getElementById(`google-formatted-address${namePostfix}`).value;
  const zone = parseInt(document.getElementById(`zone${namePostfix}`).value, 10);

  let valid = true;

  if (options.allowBlank !== false && addressToValidate === '') {
    valid = null;
    document.getElementById(`zone${namePostfix}`).value = -1;
  } else if (addressToValidate === '' || googleAddress !== addressToValidate || Number.isNaN(zone)) {
    valid = false;
    document.getElementById(`zone${namePostfix}`).value = -1;
  } else {
    const usersItems = products.for(recipientId);
    const highestZone = usersItems.length > 0
      ? usersItems.map((x) => x.zone).reduce((a, b) => Math.max(a, b))
      : 2;
    valid = highestZone >= zone;
  }

  setValid(element, valid);
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
  document.getElementById(`address${namePostfix}`).addEventListener('keydown', (event) => {
    const pacContainers = Array.from(document.getElementsByClassName('pac-container'));
    const pacContainerVisible = pacContainers.reduce((visible, pacContainer) => (
      window.getComputedStyle(pacContainer).display !== 'none' || visible
    ), false);
    if (event.which === 13 && pacContainerVisible) {
      event.preventDefault();
      return false;
    }
    return true;
  });
}

function updateTextAreas() {
  recipients.ids.forEach((recipient) => {
    const recipientsItems = products.details
      .filter((x) => x.recipient === recipient)
      .map((x) => x.name)
      .sort();
    const counts = recipientsItems.reduce((total, item) => {
      const updatedTotal = total;
      updatedTotal[item] = (updatedTotal[item] || 0) + 1;
      return updatedTotal;
    }, {});
    const listItemsArray = Object.entries(counts).map((x) => `${x[1]} x ${x[0]}`);
    const listItems = listItemsArray.length > 0 ? listItemsArray.join(', ') : 'Select items from above';
    document.getElementById(`items-to-deliver-${recipient}`).value = listItems;
  });
}

// Function to set 'Add New Recipient' button enabled or disabled
function setAddRemoveRecipientStatus() {
  // Products not assigned to a recipient
  const unassignedProducts = products.details.filter((x) => x.recipient === null).length;

  // Products assigned to a recipient
  const assignedProducts = recipients.ids.reduce((a, b) => (
    products.for(b).length > 0 ? a - 1 : a
  ), 0);

  // Disable button if unassigned is equal to assigned plus number of recipients
  const disabled = unassignedProducts === assignedProducts + recipients.ids.length;
  const buttons = document.getElementsByClassName('add-recipient');
  for (let i = 0; i < buttons.length; i += 1) {
    buttons[i].disabled = disabled;
  }
}

// Function to create button row for selecting items for each recipient
function updateButtonRow() {
  recipients.ids.forEach((recipient) => {
    // Render Buttons
    const buttons = [];
    products.details.forEach((item, index) => {
      buttons.push({
        recipient: item.recipient,
        name: item.name,
        id: `${recipient}-item-${item.id}-${index}`,
        disabled: item.recipient !== null && item.recipient !== recipient
      });
    });
    const buttonRow = ejs.render(templates.buttonRow, { buttons });
    document.getElementById(`button-row-${recipient}`).innerHTML = buttonRow;

    // Add Click Handlers to each button
    products.details.forEach((item, index) => {
      const id = `${recipient}-item-${item.id}-${index}`;
      document.getElementById(id).addEventListener('click', () => {
        if (item.recipient !== null) {
          products.details[index].recipient = null;
        } else {
          products.details[index].recipient = recipient;
        }
        updateButtonRow();
        updateTextAreas();
        setAddRemoveRecipientStatus();
        validateInput(`items-to-deliver-${recipient}`);
        validateGoogleAddress(recipient);
      });
    });
  });
  products.sendToBody();
}

function removeRecipient(id) {
  products.details.map((x) => {
    const y = x;
    if (y.recipient === id) {
      y.recipient = null;
    }
    return y;
  });

  document.getElementById(`recipient-${id}`).remove();
  recipients.ids.splice(recipients.indexOf(id), 1);
  recipients.sendToBody();

  updatePrice();
  updateButtonRow();
  setAddRemoveRecipientStatus();
}

function addNewRecipient() {
  const id = recipients.addNew();
  recipients.sendToBody();

  const template = document.createElement('template');
  template.innerHTML = ejs.render(templates.newrecipient, { id });

  const parentNode = document.getElementById('treatbox-form');
  const newNode = template.content.firstChild;
  parentNode.insertBefore(newNode, document.getElementById('submit-fieldset'));
  show(`#${newNode.id}`);
  updateButtonRow();
  setAddRemoveRecipientStatus();

  document.getElementById(`add-recipient-${id}`).addEventListener('click', () => {
    addNewRecipient();
  });
  document.getElementById(`removerecipient-${id}`).addEventListener('click', () => {
    removeRecipient(id);
  });

  // Validate Name
  document.getElementById(`name-${id}`).addEventListener('focusout', (event) => {
    validateInput(event.target.id);
    const elements = document.getElementsByClassName(`recipient-legend-name-${id}`);
    const legendName = event.target.value !== '' ? event.target.value : 'Recipient';
    for (let i = 0; i < elements.length; i += 1) {
      elements[i].innerHTML = legendName;
    }
  });

  // Validate Telephone Number
  document.getElementById(`telephone-${id}`).addEventListener('focusout', (event) => {
    validateInput(event.target.id);
  });

  // Address
  setUpAddressDropdown(id);
  document.getElementById(`address-${id}`).addEventListener('focusout', () => {
    validateGoogleAddress(id);
  });
}

// When using split-delivery, ensure no items are unaccounted
function validateAllItemsAccountedFor() {
  if (window.deliveryType === 'split-delivery') {
    return products.for(null).length === 0;
  }
  return true;
}

function validateAllInputs() {
  let valid = true;
  const elementsToValidate = [
    'input[id^="name"]',
    'input[id^="email"]',
    'input[id^="telephone"]',
    'textarea[id^="items-to-deliver"]',
    'input[id^="address"]'
  ];

  // Validate all visible elements
  const elements = document.querySelectorAll(elementsToValidate);
  for (let i = 0; i < elements.length; i += 1) {
    if (isVisible(elements[i])) {
      const { field, id } = getDetailsFromHtmlId(elements[i].id);
      valid = field === 'address'
        ? validateGoogleAddress(id) && valid
        : validateInput(elements[i].id) && valid;
    }
  }
  return validateAllItemsAccountedFor() && valid;
}

function touchAllAddresses() {
  const elements = document.querySelectorAll('input[id^="address"]');
  for (let i = 0; i < elements.length; i += 1) {
    elements[i].dispatchEvent(new Event('focusin'));
    elements[i].dispatchEvent(new Event('focusout'));
  }
}

async function lookupRebateCode(code) {
  const response = await fetch(`${managementBaseUrl}/treatbox/lookuprebate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ code })
  });
  const data = await response.json();
  if (data.valid) {
    switch (data.code.type) {
      case 'zone3Delivery': {
        const elements = document.querySelectorAll('select[id^="quantity-"]');
        for (let i = 0; i < elements.length; i += 1) {
          if (elements[i].getAttribute('data-deliverable-zone') === '2') {
            elements[i].setAttribute('data-deliverable-zone', '3');
          }
        }
        products.update();
        touchAllAddresses();
        break;
      }

      case 'costPrice':
      case 'discountPercent':
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
        document.getElementById(`quantity-${id}`).dispatchEvent(new Event('change'));
      }
      element.disabled = true;
    }
  });
}

function createCartTag(element, quantity) {
  const cartUpdate = {
    ecommerce: {
      currencyCode: 'SEK'
    }
  };
  const [, id] = element.id.split('-');
  let type;
  if (quantity > 0) {
    cartUpdate.event = 'addToCart';
    type = 'add';
  } else if (quantity < 0) {
    cartUpdate.event = 'removeFromCart';
    type = 'remove';
  } else {
    return;
  }
  cartUpdate.ecommerce[type] = {
    products: [{
      id,
      name: element.getAttribute('data-name'),
      brand: element.getAttribute('data-brand'),
      category: element.getAttribute('data-category'),
      price: parseInt(element.getAttribute('data-price'), 10),
      quantity: Math.abs(quantity)
    }]
  };
  dataLayer.push(cartUpdate);
}

function analyticsShoppingCartEvent(element) {
  const oldQuantity = parseInt(element.getAttribute('data-quantity'), 10);
  const quantity = parseInt(element.value, 10);
  element.setAttribute('data-quantity', quantity);
  createCartTag(element, quantity - oldQuantity);
}

// On Google API Loaded...
document.addEventListener('google-api-loaded', () => {
  initialiseBoundaries();

  // Get new recipient template
  fetch('/templates/newrecipient.ejs')
    .then((response) => response.text())
    .then((data) => {
      templates.newrecipient = data;
    });

  // Get orderable productsOrderable from DOM
  productsOrderable = window.orderable;

  // Update product availability when date changed
  document.getElementById('date').addEventListener('change', () => {
    updateProductAvailability();
  });

  // Select Items
  const quantityElements = document.querySelectorAll('select[id^="quantity-"]');
  for (let i = 0; i < quantityElements.length; i += 1) {
    quantityElements[i].addEventListener('change', () => {
      analyticsShoppingCartEvent(quantityElements[i]);
      products.update();
      updateButtonRow();
      setAddRemoveRecipientStatus();
      show(['#purchaser-details', '#delivery-details']);
      touchAllAddresses();
    });
  }

  // Validate User Details as they are entered
  const nameElements = document.querySelectorAll('input[id^="name"]');
  for (let i = 0; i < nameElements.length; i += 1) {
    nameElements[i].addEventListener('focusout', (event) => {
      // Update Legend Title if split delivery recipient
      const { id } = getDetailsFromHtmlId(event.target.id);
      if (id != null) {
        const name = event.target.value === '' ? 'Recipient' : event.target.value;
        const legendNames = document.getElementsByClassName(`recipient-legend-name-${id}`);
        for (let j = 0; j < legendNames.length; j += 1) {
          legendNames[j].innerHTML = name;
        }
      }

      // Validate Input
      validateInput(event.target.id);
    });
  }
  const contactElements = document.querySelectorAll(['input[id^="email"]', 'input[id^="telephone"]']);
  for (let i = 0; i < contactElements.length; i += 1) {
    contactElements[i].addEventListener('focusout', (event) => {
      validateInput(event.target.id);
    });
  }

  // Delivery Type
  const deliveryButtons = document.querySelectorAll('#delivery, #collection, #split-delivery');
  for (let i = 0; i < deliveryButtons.length; i += 1) {
    deliveryButtons[i].addEventListener('click', () => {
      const { id } = deliveryButtons[i];
      window.deliveryType = id;
      showDeliveryElement();
      if (id === 'split-delivery' && recipients.isEmpty()) {
        addNewRecipient();
      }
      updatePrice();
    });
  }

  // Address
  const addressInputs = document.querySelectorAll('input[id^="address"]');
  for (let i = 0; i < addressInputs.length; i += 1) {
    const { id } = getDetailsFromHtmlId(addressInputs[i].id);
    setUpAddressDropdown(id);
    addressInputs[i].addEventListener('focusout', () => {
      validateGoogleAddress(id);
    });
  }

  // Set up Add/Remove Recipient Buttons
  const addRecipientButtons = document.getElementsByClassName('add-recipient');
  for (let i = 0; i < addRecipientButtons.length; i += 1) {
    addRecipientButtons[i].addEventListener('click', () => {
      addNewRecipient();
    });
  }
  const removeRecipientButtons = document.getElementsByClassName('removerecipient');
  for (let i = 0; i < removeRecipientButtons.length; i += 1) {
    const { id } = getDetailsFromHtmlId(removeRecipientButtons[i].id);
    removeRecipientButtons[i].addEventListener('click', () => {
      removeRecipient(id);
    });
  }

  // Validate All when Submit Pressed
  const submitButton = document.getElementById('form-validate');
  submitButton.addEventListener('click', (event) => {
    if (!validateAllInputs()) {
      event.preventDefault();
    }
  });

  // Apply Rebate Code
  document.getElementById('rebate-apply').addEventListener('click', () => {
    const rebateMessage = document.getElementById('rebate-message');
    const code = document.getElementById('rebate-entry').value;
    lookupRebateCode(code).then((data) => {
      if (data.valid) {
        codes.add(data.code.value);
        document.getElementById('rebate-codes').value = JSON.stringify(Array.from(codes));
        rebateMessage.innerHTML = 'Code Applied!';
        updatePrice();
      } else {
        rebateMessage.innerHTML = data.message;
      }
    }).catch(() => {
      rebateMessage.innerHTML = 'There was an error looking up your code';
    });
  });

  // Hide Loading Spinner and Show Page
  document.getElementById('date').dispatchEvent(new Event('change'));
  hide(['#loading-div']);
  show(['#date-selector', '#product-selector', '#submit-fieldset']);

  // Check if form is posted
  if (window.post) {
    if (window.deliveryType === 'split-delivery') {
      products.getFromBody();
      recipients.getFromBody();
      updateButtonRow();
      updateTextAreas();
      setAddRemoveRecipientStatus();
    }
    document.querySelector('select[id^="quantity-"]').dispatchEvent(new Event('change'));

    const selectedRadio = document.querySelector(`input[name="delivery-type"][value="${window.deliveryType}"]`);
    selectedRadio.dispatchEvent(new MouseEvent('click'));

    const rebateCodes = document.getElementById('rebate-codes');
    if (rebateCodes.value !== '') {
      const codesToApply = JSON.parse(rebateCodes.value);
      codesToApply.forEach((code) => {
        codes.add(code);
        lookupRebateCode(code);
      });
      updatePrice();
    }
    validateAllInputs();
  }
});
