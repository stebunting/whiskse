/* global numZone2Deliveries */
function priceFormat(num) {
  const str = parseInt((num / 100), 10).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  return `${str.replace(',', '')} SEK`;
}

function updatePrice() {
  const comboBoxPrice = parseInt(window.localStorage.getItem('comboBoxPrice'), 10);
  const treatBoxPrice = parseInt(window.localStorage.getItem('treatBoxPrice'), 10);
  const vegetableBoxPrice = parseInt(window.localStorage.getItem('vegetableBoxPrice'), 10);
  const zone2Delivery = parseInt(window.localStorage.getItem('zone2Delivery'), 10);
  const foodMomsRate = 1 + (parseInt(window.localStorage.getItem('foodMomsRate'), 10) / 100);
  const deliveryMomsRate = 1 + (parseInt(window.localStorage.getItem('deliveryMomsRate'), 10) / 100);

  const numComboBoxes = parseInt($('#combobox-quantity').text(), 10) || 0;
  const numTreatBoxes = parseInt($('#treatbox-quantity').text(), 10) || 0;
  const numVegetableBoxes = parseInt($('#vegetablebox-quantity').text(), 10) || 0;

  const totalComboBoxes = comboBoxPrice * numComboBoxes;
  const totalTreatBoxes = treatBoxPrice * numTreatBoxes;
  const totalVegetableBoxes = vegetableBoxPrice * numVegetableBoxes;

  const foodCost = totalComboBoxes + totalTreatBoxes + totalVegetableBoxes;
  const foodMoms = foodCost - (foodCost / foodMomsRate);
  const deliveryCost = numZone2Deliveries * zone2Delivery;
  const deliveryMoms = deliveryCost - (deliveryCost / deliveryMomsRate);
  const momsTotal = foodMoms + deliveryMoms;
  const totalCost = foodCost + deliveryCost;

  $('#combobox-price').text(priceFormat(comboBoxPrice));
  $('#combobox-subtotal').text(priceFormat(totalComboBoxes));
  $('#treatbox-price').text(priceFormat(treatBoxPrice));
  $('#treatbox-subtotal').text(priceFormat(totalTreatBoxes));
  $('#vegetablebox-price').text(priceFormat(vegetableBoxPrice));
  $('#vegetablebox-subtotal').text(priceFormat(totalVegetableBoxes));
  $('#food-total').text(priceFormat(foodCost));
  $('#delivery-total').text(priceFormat(deliveryCost));
  $('#moms-total').text(priceFormat(momsTotal));
  $('#total-to-pay').text(priceFormat(totalCost));
}

$(document).ready(() => {
  updatePrice();

  $('#swish').click(function() {
    $('#submitorder').text('Order and Pay');
  });

  $('#invoice').click(function() {
    $('#submitorder').text('Order');
  });

  $('#submitorder').click(function callback() {
    if ($('#swish').is(':checked')) {
      $(this).prop('disabled', true)
        .prepend('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>&nbsp;');
      $
      $('#submitform').submit();
      $('.open-swish').show();
    }
  });
});
