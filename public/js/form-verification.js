// Script to add form verification to html forms
// Form must have data-validation="true" and a unique id
// Each input must have data-validation="true" and data-validation-type="type"
// type can be number, name, email, phone, notes, password, date
// Submit button must have class form-validate

// Clear messages and print current message
function setValid(element, valid) {
  if (valid === null) {
    element.classList.remove('is-valid');
    element.classList.remove('is-invalid');
  } else if (!valid) {
    element.classList.remove('is-valid');
    element.classList.add('is-invalid');
  } else {
    element.classList.remove('is-invalid');
    element.classList.add('is-valid');
  }
}

// Function to validate input
function validateInput(id) {
  const element = document.getElementById(id);
  const { value } = element;
  const validationType = element.getAttribute('data-validation-type');
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
      valid = value !== 'Select items from above';

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

    // If invalid data-validation-type
    } else {
      valid = false;
    }

  // If no input
  } else {
    valid = false;
  }

  setValid(element, valid);
  return valid;
}
