/* eslint no-underscore-dangle: 0 */
const recipients = {
  list: [],

  add(name = '', telephone = '', address = '', googleFormattedAddress = '', zone = null, notes = '', message = '') {
    const id = this._idCounter;
    const newRecipient = {
      id,
      name,
      telephone,
      address,
      googleFormattedAddress,
      zone,
      notes,
      message,
      itemsToDeliver: [],
      numComboBoxes: 0,
      numTreatBoxes: 0,
      numVegetableBoxes: 0
    };
    this.list.push(newRecipient);

    this._idCounter += 1;
    return this.list[this.list.length - 1];
  },

  remove(recipientId) {
    const index = this._getIndexById(recipientId);
    this.list.splice(index, 1);
  },

  addItem(recipientId, item) {
    const recipient = this.getRecipient(recipientId);
    recipient.itemsToDeliver.push(item.id);
    switch (item.productType) {
      case 'Combo Box':
        recipient.numComboBoxes += 1;
        break;
      case 'Treat Box':
        recipient.numTreatBoxes += 1;
        break;
      case 'Vegetable Box':
        recipient.numVegetableBoxes += 1;
        break;
      default:
        // Should never happen
        break;
    }
  },

  removeItem(recipientId, item) {
    const recipient = this.getRecipient(recipientId);
    for (let i = 0; i < recipient.itemsToDeliver.length; i += 1) {
      if (recipient.itemsToDeliver[i] === item.id) {
        recipient.itemsToDeliver.splice(i, 1);
        break;
      }
    }
    switch (item.productType) {
      case 'Combo Box':
        recipient.numComboBoxes -= 1;
        break;
      case 'Treat Box':
        recipient.numTreatBoxes -= 1;
        break;
      case 'Vegetable Box':
        recipient.numVegetableBoxes -= 1;
        break;
      default:
        // Should never happen
        break;
    }
  },

  getRecipient(recipientId) {
    const index = this._getIndexById(recipientId);
    return this.list[index];
  },

  numRecipients() {
    return this.list.length;
  },

  _getIndexById(userId) {
    for (let i = 0; i < this.list.length; i += 1) {
      if (this.list[i].id === userId) {
        return i;
      }
    }
    return null;
  },

  _idCounter: 0
};

export default recipients;
