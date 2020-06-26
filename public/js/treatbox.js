// Get Product Details
const managementUrl = 'https://whisk-management.herokuapp.com/';
const animationTime = 400;

// Constants
const dataLoading = fetch(`${managementUrl}treatbox/orderdetails`);
// const dateFormatString = 'dddd dS mmmm';

// User Choices
let deliverable = false;

// User Choices
// let itemsSelected = 0;

// Show Purchaser/Delivery Details if hidden
function showPurchaserDetails() {
  if (!$('#purchaser-details').is(':visible')) {
    $('#purchaser-details').show(animationTime);
    $('#delivery-details').show(animationTime);
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
    let selectDelivery = false;
    if ($('#delivery').prop('disabled')) {
      selectDelivery = true;
    }
    $('#delivery').prop('disabled', false);
    $('#split-delivery').prop('disabled', false);
    if (selectDelivery) {
      $('#delivery').trigger('click');
    }
  } else {
    $('#delivery').prop('disabled', true);
    $('#split-delivery').prop('disabled', true);
    $('#collection').trigger('click');
  }
}

$(() => {
  // Select Items
  $('select[id^=quantity-]').change(() => {
    setDelivery();
    showPurchaserDetails();

    // const previousTotalDeliverable = products.totalDeliverableItems();
    // const previousTotal = products.totalItems();

    // // Remove removed items from recipients
    // const removedItems = products.update($(this));
    // for (let i = 0; i < removedItems.length; i += 1) {
    //   if (removedItems[i].recipientId != null) {
    //     const recipient = recipients.list[removedItems[i].recipientId];
    //     for (let j = 0; j < recipient.itemsToDeliver.length; j += 1) {
    //       if (recipient.itemsToDeliver[j].id === removedItems[i].id) {
    //         recipient.itemsToDeliver[j].pop();
    //       }
    //     }
    //   }
    // }
  });

  // When Product Details Loaded
  // dataLoading
  //   .then((response) => response.json())
  //   .then((data) => {
  //     if (data.status === 'OK') {
  //       console.log(data);
  //     }
  //   });

  // Hide Loading Spinner and Show Page
  $('#loading-div').hide(animationTime);
  $('#date-selector').show(animationTime);
  $('#product-selector').show(animationTime);
  $('#submit-fieldset').show(animationTime);
});
