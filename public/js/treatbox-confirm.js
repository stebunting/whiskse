// Constants
const managementBaseUrl = 'http://localhost:5000';
// const managementBaseUrl = 'https://whisk-management.herokuapp.com';

// Function to lookup Error Code
function lookupErrorCode(code) {
  switch (code) {
    case 'DB_ERROR':
      return 'Could not insert order into DB.';

    case 'CANCELLED':
      return 'The payment request was cancelled.';

    case 'DECLINED':
      return 'Transaction Declined by Customer.';

    case 'ERROR':
      return 'An Unknown Error Occured.';

    case 'FF08':
      return 'PaymentReference is invalid.';

    case 'RP03':
      return 'Callback URL is missing or does not use HTTPS.';

    case 'BE18':
      return 'Payer alias is invalid.';

    case 'RP01':
      return 'Missing Merchant Swish Number.';

    case 'PA02':
      return 'Amount value is missing or not a valid number.';

    case 'AM06':
      return 'Specified transaction amount is less than agreed minimum.';

    case 'AM02':
      return 'Amount value is too large.';

    case 'AM03':
      return 'Invalid or missing Currency.';

    case 'RP02':
      return 'Wrong formatted message.';

    case 'RP06':
      return 'A payment request already exists for that payer.';

    case 'RP09':
      return 'The given instructionUUID is not available';

    case 'ACMT03':
      return 'Unknown Swish ID, payer not enrolled. Please check your phone number.';

    case 'ACMT01':
      return 'Counterpart is not activated.';

    case 'ACMT07':
      return 'Payee not Enrolled.';

    default:
      return 'Unknown Error.';
  }
}

// Set Page Visual Elements to In Progress (or not)
function setOrderInProgress(inProgress, method) {
  if (inProgress) {
    $('input[type=radio]').prop('disabled', true);
    $('#submitorder').prop('disabled', true)
      .prepend('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>&nbsp;');
    if (method === 'Swish') {
      $('.open-swish').show();
    }
  } else {
    $('input[type=radio]').prop('disabled', false);
    $('#submitorder').prop('disabled', false);
    $('.spinner-border').remove();
    if (method === 'Swish') {
      $('.open-swish').hide();
    }
  }
}
// Function to print Errors to page
function updateErrors(errors) {
  $('.error-message').html('');
  if (errors !== null) {
    errors.forEach((error) => {
      $('.error-message').append(`<li>ERROR! ${lookupErrorCode(error)}</li>`);
    });
  }
}

// On DOM Loaded...
$(() => {
  $('#swish').click(() => {
    $('#submitorder').text('Order and Pay');
  });

  $('#invoice').click(() => {
    $('#submitorder').text('Order');
  });

  $('#submitorder').click((event) => {
    event.preventDefault();

    const payload = $('#payload').val();

    // Determine Method
    let method;
    if ($('#swish').is(':checked')) {
      method = 'Swish';
    } else {
      method = 'Invoice';
    }
    setOrderInProgress(true, method);

    // Call Payment API
    const url = `${managementBaseUrl}/treatbox/takepayment?method=${method}`;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payload
    };

    (async function callAPI() {
      let response = await fetch(url, options);
      let data = await response.json();

      // Error
      if (data.status === 'Error') {
        updateErrors(data.errors);
        setOrderInProgress(false, method);
      } else if (data.status === 'OK') {
        $('#transaction-id').val(data.id);
        $('#submitform').submit();

        // Invoice
        if (data.method === 'Invoice') {
          $('#submitform').submit();

        // Swish
        } else if (data.method === 'Swish') {
          const { id } = data;
          const timerId = setInterval(async () => {
            response = await fetch(`${managementBaseUrl}/treatbox/checkswishstatus?id=${id}`);
            data = await response.json();

            if (data.status === 'OK' && data.paymentStatus === 'Paid') {
              clearInterval(timerId);
              $('#submitform').submit();
            }
            if (data.status === 'Error') {
              clearInterval(timerId);
              updateErrors(data.errors);
              setOrderInProgress(false, method);
            }
          }, 1500);
        }
      }
    }());
  });
});
