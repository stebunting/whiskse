/* global google, ejs, validateInput, setValid, initialiseBoundaries, getZone */
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

// Splits identifier into field and MongoDB ID`
function getDetailsFromMongoId(htmlId) {
  if (htmlId == null) {
    return { field: undefined, id: undefined };
  }
  const array = htmlId.split('-');
  const [field, id] = array;
  return { field, id };
}

// Splits element identifier into field and recipient ID
function getRecipientIdFromElement(element) {
  const identifier = element.id;
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
  for(recipientId = null) {
    return this.details.filter((x) => x.recipient === recipientId);
  }
};
const recipients = {
  ids: [],
  indexOf(id) {
    return this.ids.findIndex((x) => x === id);
  },
  isEmpty() {
    return this.ids.length === 0;
  }
};
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
function showDeliveryElement(type) {
  switch (type) {
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

// Update Price
function updatePrice() {
  const delivery = [0, 0, 0, 0];
  if (!document.getElementById('collection').checked) {
    const elements = document.querySelectorAll('input[id^="zone"]');
    for (let i = 0; i < elements.length; i += 1) {
      const recipientId = getRecipientIdFromElement(elements[i]);
      const inputIdSelector = recipientId != null
        ? document.getElementById(`address-${recipientId}`)
        : document.getElementById('address');
      if (isVisible(inputIdSelector) && inputIdSelector.classList.contains('is-valid')) {
        const zone = parseInt(elements[i].value, 10);
        if (zone >= 0 && zone <= 3) {
          delivery[zone] += 1;
        }
      }
    }
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
        document.getElementById('food-cost').innerHTML = priceFormat(data.bottomLine.foodCost);
        document.getElementById('food-moms').innerHTML = priceFormat(data.bottomLine.foodMoms, { includeOre: true });
        document.getElementById('delivery-cost').innerHTML = priceFormat(data.bottomLine.deliveryCost);
        document.getElementById('delivery-moms').innerHTML = priceFormat(data.bottomLine.deliveryMoms, { includeOre: true });
        document.getElementById('total-cost').innerHTML = priceFormat(data.bottomLine.total);
        data.delivery.forEach((zone) => {
          const price = zone.price !== 0 ? priceFormat(zone.price) : 'Free';
          const elements = document.getElementsByClassName(`zone${zone.zone}-surcharge-amount`);
          for (let i = 0; i < elements.length; i += 1) {
            elements[i].innerHTML = price;
          }
        });
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

  setValid(element, valid);
  document.getElementById(`message-address${namePostfix}`).innerHTML = message.join(' // ');
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
    const pacContainer = document.getElementsByClassName('pac-container');
    const pacContainerVisible = window.getComputedStyle(pacContainer[0]).display !== 'none';
    return !(event.which === 13 && pacContainerVisible);
  });
}

function updateTextAreas() {
  recipients.ids.forEach((recipient) => {
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
    document.getElementById(`items-to-deliver-${recipient}`).value = listItems;
  });
}

function setAddRemoveRecipientStatus() {
  const unassignedItems = products.details.filter((x) => x.recipient === null).length;
  let assigned = recipients.ids.length;
  recipients.ids.forEach((recipient) => {
    const recipientHasItems = products.details
      .filter((x) => x.recipient === recipient).length > 0;
    if (recipientHasItems) {
      assigned -= 1;
    }
  });
  const buttons = document.getElementsByClassName('add-recipient');
  for (let i = 0; i < buttons.length; i += 1) {
    buttons[i].disabled = unassignedItems - assigned === 0;
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
  document.getElementById('items').value = JSON.stringify(products.details);
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
  document.getElementById('recipients').value = JSON.stringify(recipients.ids);

  updatePrice();
  updateButtonRow();
  setAddRemoveRecipientStatus();
}

function addNewRecipient() {
  const id = recipients.ids.length > 0
    ? recipients.ids[recipients.ids.length - 1] + 1
    : 0;
  recipients.ids.push(id);
  document.getElementById('recipients').value = JSON.stringify(recipients.ids);

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
    for (let i = 0; i < elements.length; i += 1) {
      elements[i].innerHTML = event.target.value;
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

function validateAllInputs() {
  let valid = true;
  const elementsToValidate = [
    'input[id^="name"]',
    'input[id^="email"]',
    'input[id^="telephone"]',
    'textarea[id^="items-to-deliver"]',
    'input[id^="address"]'
  ];
  const elements = document.querySelectorAll(elementsToValidate);
  for (let i = 0; i < elements.length; i += 1) {
    if (isVisible(elements[i])) {
      const { field, id } = getDetailsFromMongoId(elements[i].id);
      valid = field === 'address'
        ? validateGoogleAddress(id) && valid
        : validateInput(elements[i].id) && valid;
    }
  }
  return valid;
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
      case 'zone3delivery': {
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
        document.getElementById(`quantity-${id}`).dispatchEvent(new Event('change'));
      }
      element.disabled = true;
    }
  });
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
      const id = getRecipientIdFromElement(event.target);
      if (id != null) {
        const index = recipients.indexOf(id);
        const name = event.target.value === '' ? `Recipient ${index + 1}` : event.target.value;
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
      showDeliveryElement(id);
      updatePrice();
      if (id === 'split-delivery' && recipients.isEmpty()) {
        addNewRecipient();
      }
    });
  }

  // Address
  const addressInputs = document.querySelectorAll('input[id^="address"]');
  for (let i = 0; i < addressInputs.length; i += 1) {
    const id = getRecipientIdFromElement(addressInputs[i]);
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
    const id = getRecipientIdFromElement(removeRecipientButtons[i]);
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
        rebateMessage.innerHTML = 'Invalid Code';
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
      products.details = JSON.parse(document.getElementById('items').value);
      recipients.ids = JSON.parse(document.getElementById('recipients').value);
      updateButtonRow();
      updateTextAreas();
      setAddRemoveRecipientStatus();
    }
    document.querySelectorAll('select[id^="quantity-"]')[0].dispatchEvent(new Event('change'));

    const selectedRadio = document.querySelectorAll(`input[name="delivery-type"][value="${window.deliveryType}"]`)[0];
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
