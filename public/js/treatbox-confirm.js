// On DOM Loaded...
$(() => {
  $('#swish').click(() => {
    $('#submitorder').text('Order and Pay');
  });

  $('#invoice').click(() => {
    $('#submitorder').text('Order');
  });

  $('#submitorder').click(function callback() {
    if ($('#swish').is(':checked')) {
      $(this).prop('disabled', true)
        .prepend('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>&nbsp;');
      $('#submitform').submit();
      $('.open-swish').show();
    }
  });
});
