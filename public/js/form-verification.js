// Script to add form verification to html forms
// Form must have form-validation="true" and a unique id
// Each input must have form-validation="true" and form-validation-type="type"
// type can be number, name, email, phone, notes, password, date
// Submit button must have class form-validate

// Clear messages and print current message
function printMessage(selector, valid) {
  const id = selector.attr('id');

  if (valid === null) {
    $(`#${id}`).removeClass('is-valid');
    $(`#${id}`).removeClass('is-invalid');
  } else if (!valid) {
    $(`#${id}`).removeClass('is-valid');
    $(`#${id}`).addClass('is-invalid');
  } else {
    $(`#${id}`).removeClass('is-invalid');
    $(`#${id}`).addClass('is-valid');
  }
}

// Function to validate input
function validateInput(selector) {
  const value = selector.val();
  const validationType = selector.attr('form-validation-type');
  let valid = true;

  // Check that something has been entered
  if (value.length > 0) {
    // Check for valid number
    if (validationType === 'number') {
      const reg = /[^0-9]/;
      valid = !reg.test(value);

    // Check for valid number
    } else if (validationType === 'doorcode') {
      const reg = /[^0-9#*]/;
      valid = !reg.test(value);

    // Check for valid name
    } else if (validationType === 'name') {
      const reg = /[^a-zA-ZÀ-ƶ '-]/;
      valid = !reg.test(value);

    // Check for valid e-mail address
    } else if (validationType === 'email') {
      // Ensure @ followed by .
      const emailSplit = value.split('@');
      if (emailSplit.length < 2) {
        valid = false;
      } else {
        const domainSplit = emailSplit[emailSplit.length - 1].split('.');
        if (domainSplit.length < 2) {
          valid = false;
        } else {
          const reg = /[^a-zA-Z0-9-]/;
          valid = !reg.test(domainSplit[0]);
        }
      }

    // Check for valid phone number
    } else if (validationType === 'phone') {
      const phoneNumber = value.replace(/-/g, '').replace(/ /g, '').replace('(', '').replace(')', '');
      if ((phoneNumber.charAt(0) !== '0' && phoneNumber.charAt(0) !== '+') || phoneNumber.length < 10) {
        valid = false;
      } else {
        const reg = /[^0-9+]/;
        valid = !reg.test(phoneNumber);
      }

    // Check that address is not empty
    } else if (validationType === 'address') {
      valid = true;

    // Check that notes is not empty
    } else if (validationType === 'notes') {
      valid = value != 'Select items from above';

    // Check that password is not empty
    } else if (validationType === 'password') {
      valid = true;

    // Check that date is not empty
    } else if (validationType === 'date') {
      const date = value.split('-');
      if (date.length !== 3) {
        valid = false;
      } else {
        const year = parseInt(date[0], 10);
        const month = parseInt(date[1], 10);
        const day = parseInt(date[2], 10);
        if (year < 2020 || month < 1 || month > 12 || day < 1 || day > 31) {
          valid = false;
        } else {
          const reg = /[^0-9-]/;
          valid = !reg.test(value);
        }
      }

    // If invalid form-validation-type
    } else {
      valid = false;
    }

  // If no input
  } else {
    valid = false;
  }

  printMessage(selector, valid);
  return valid;
}
