/* eslint no-underscore-dangle: 0 */
const products = {
  setPrice(priceDetails) {
    this.types.COMBO_BOX._price = parseInt(priceDetails.cost.food.comboBox, 10);
    this.types.TREAT_BOX._price = parseInt(priceDetails.cost.food.treatBox, 10);
    this.types.VEGETABLE_BOX._price = parseInt(priceDetails.cost.food.vegetableBox, 10);
    this.cost.ZONE_2_DELIVERY_COST = parseInt(priceDetails.cost.delivery.zone2, 10);
    this.cost._foodMomsRate = 1 + (parseInt(priceDetails.momsRate.food, 10) / 100);
    this.cost._deliveryMomsRate = 1 + (parseInt(priceDetails.momsRate.delivery, 10) / 100);
    window.localStorage.setItem('comboBoxPrice', priceDetails.cost.food.comboBox);
    window.localStorage.setItem('treatBoxPrice', priceDetails.cost.food.treatBox);
    window.localStorage.setItem('vegetableBoxPrice', priceDetails.cost.food.vegetableBox);
    window.localStorage.setItem('zone2Delivery', priceDetails.cost.delivery.zone2);
    window.localStorage.setItem('foodMomsRate', priceDetails.momsRate.food);
    window.localStorage.setItem('deliveryMomsRate', priceDetails.momsRate.delivery);
  },

  types: {
    COMBO_BOX: {
      name: 'Combo Box',
      _price: 0,
      price() {
        return products._priceFormat(this._price);
      }
    },
    TREAT_BOX: {
      name: 'Treat Box',
      _price: 0,
      price() {
        return products._priceFormat(this._price);
      }
    },
    VEGETABLE_BOX: {
      name: 'Vegetable Box',
      _price: 0,
      price() {
        return products._priceFormat(this._price);
      }
    }
  },

  comboBoxes: 0,
  treatBoxes: 0,
  vegetableBoxes: 0,

  cost: {
    ZONE_2_DELIVERY_COST: 5000,
    zone2Surcharge() {
      return products._priceFormat(this.ZONE_2_DELIVERY_COST);
    },
    _foodCost: 0,
    _deliveryCost: 0,
    _foodMomsRate: 0,
    _deliveryMomsRate: 0,
    _foodMoms() {
      return this._foodCost - (this._foodCost / this._foodMomsRate);
    },
    _deliveryMoms() {
      return this._deliveryCost - (this._deliveryCost / this._deliveryMomsRate);
    },
    foodCost() {
      return products._priceFormat(this._foodCost);
    },
    deliveryCost() {
      return products._priceFormat(this._deliveryCost);
    },
    foodMoms() {
      return products._priceFormat(this._foodMoms());
    },
    deliveryMoms() {
      return products._priceFormat(this._deliveryMoms());
    },
    totalMoms() {
      return products._priceFormat(this._foodMoms() + this._deliveryMoms());
    },
    totalCost() {
      return products._priceFormat(this._foodCost + this._deliveryCost);
    },
    setDeliveryCost(cost) {
      this._deliveryCost = cost;
    },
    getFormattedDeliveryCost() {
      return products._priceformat(this._deliveryCost);
    }
  },
  calculateFoodCost() {
    this.cost._foodCost = this.comboBoxes * this.types.COMBO_BOX._price
      + this.treatBoxes * this.types.TREAT_BOX._price
      + this.vegetableBoxes * this.types.VEGETABLE_BOX._price;
  },

  selected: [],

  _idCounter: 0,

  _priceFormat(num) {
    const str = (num / 100).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return str.replace(',', '');
  },
  
  // Method to get product index by provided id
  _getProductById(idToFind) {
    for (let i = 0; i < this.selected.length; i += 1) {
      if (this.selected[i].id === idToFind) {
        return i;
      }
    }
    return null;
  },

  // Method to add or remove items from selected list
  _updateSelected(productType, newValue) {
    let difference;
    const removedItems = [];
    switch (productType.name) {
      case this.types.COMBO_BOX.name:
        difference = newValue - this.comboBoxes;
        break;
      case this.types.TREAT_BOX.name:
        difference = newValue - this.treatBoxes;
        break;
      case this.types.VEGETABLE_BOX.name:
        difference = newValue - this.vegetableBoxes;
        break;
      default:
        difference = 0;
    }
    if (difference > 0) {
      for (let i = 0; i < difference; i += 1) {
        this.selected.push({
          id: this._idCounter,
          productType: productType.name,
          recipientId: null
        });
        this._idCounter += 1;
      }
    } else if (difference < 0) {
      for (let i = this.selected.length - 1; i >= 0; i -= 1) {
        if (this.selected[i].productType === productType.name) {
          removedItems.push(this.selected[i]);
          this.selected.pop(i);
          difference += 1;
          if (difference === 0) {
            break;
          }
        }
      }
    }
    return removedItems;
  },

  totalDeliverableItems() {
    return this.comboBoxes + this.treatBoxes;
  },

  totalItems() {
    return this.comboBoxes + this.treatBoxes + this.vegetableBoxes;
  },

  update(selector) {
    const newValue = parseInt(selector.val(), 10) || 0;
    let removedItems;
    switch (selector.attr('id')) {
      case 'num-comboboxes':
        removedItems = this._updateSelected(this.types.COMBO_BOX, newValue);
        this.comboBoxes = newValue;
        this.calculateFoodCost();
        return removedItems;
      case 'num-treatboxes':
        removedItems = this._updateSelected(this.types.TREAT_BOX, newValue);
        this.treatBoxes = newValue;
        this.calculateFoodCost();
        return removedItems;
      case 'num-vegetableboxes':
        removedItems = this._updateSelected(this.types.VEGETABLE_BOX, newValue);
        this.vegetableBoxes = newValue;
        this.calculateFoodCost();
        return removedItems;
      default:
        return null;
    }
  },

  addRecipient(id, userId) {
    const index = this._getProductById(id);
    this.selected[index].recipientId = userId;
  },

  removeRecipient(id) {
    const index = this._getProductById(id);
    this.selected[index].recipientId = null;
  },

  getProduct(id) {
    const index = this._getProductById(id);
    return this.selected[index];
  },

  allClaimed() {
    for (let i = 0; i < this.selected.length; i += 1) {
      if (this.selected[i].recipientId === null) {
        return false;
      }
    }
    return true;
  }
};

export default products;
