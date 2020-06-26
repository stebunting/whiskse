/* global dateFormat */
// Get Product Details
const managementUrl = 'https://whisk-management.herokuapp.com/';
const animationTime = 400;

// Constants
const dataLoading = fetch(`${managementUrl}treatbox/orderdetails`);
const dateFormatString = 'dddd dS mmmm';

$(() => {
  // When date selector changed, disable unavailable products
  // $('#date').change(function callback() {
  //   const week = $(this).val();
  //   // delivery.date = week;
  //   $('#date-text').val($('#date option:selected').text());
  //   if (timeframe[week].vegetablesOrderable) {
  //     $('#num-comboboxes').prop('disabled', false);
  //     $('#num-vegetableboxes').prop('disabled', false);
  //   } else {
  //     $('#num-comboboxes').val('0').trigger('change').prop('disabled', true);
  //     $('#num-vegetableboxes').val('0').trigger('change').prop('disabled', true);
  //   }
  // });

  // When Product Details Loaded
  dataLoading
    .then((response) => response.json())
    .then((data) => {
      if (data.status === 'OK') {
        console.log(data);
      }
    });

  // Hide Loading Spinner and Show Page
  $('#loading-div').hide(animationTime);
  $('#date-selector').show(animationTime);
  $('#product-selector').show(animationTime);
  $('#submit-fieldset').show(animationTime);
});
