/* eslint-disable no-undef */
describe('Treatbox JS', () => {
  describe('Helper functions', () => {
    it('gets identifier postfix from id', () => {
      assert.strictEqual(getNamePostfix('ID123'), '-ID123');
      assert.strictEqual(getNamePostfix(null), '');
      assert.strictEqual(getNamePostfix(undefined), '');
      assert.strictEqual(getNamePostfix(''), '');
    });

    it('gets details from id', () => {
      assert.strictEqual(getDetailsFromHtmlId('quantity-ID123').field, 'quantity');
      assert.strictEqual(getDetailsFromHtmlId('quantity-ID123').id, 'ID123');
      assert.strictEqual(getDetailsFromHtmlId('zone-57F3DA78-extra-info').field, 'zone');
      assert.strictEqual(getDetailsFromHtmlId('zone-57F3DA78-extra-info').id, '57F3DA78');
      assert.strictEqual(getDetailsFromHtmlId('invalid').id, null);
      assert.strictEqual(getDetailsFromHtmlId('').id, null);
    });

    it('returns undefined object from invalid id', () => {
      const undefinedReturn = {
        field: undefined,
        id: undefined
      };
      assert.deepEqual(getDetailsFromHtmlId(null), undefinedReturn);
      assert.deepEqual(getDetailsFromHtmlId(undefined), undefinedReturn);
    });

    it('formats price with SEK', () => {
      assert.strictEqual(priceFormat(57483), '575 SEK');
      assert.strictEqual(priceFormat(1), '0 SEK');
      assert.strictEqual(priceFormat(-167), '-2 SEK');
      assert.strictEqual(priceFormat(-16845.87364), '-168 SEK');
      assert.strictEqual(priceFormat(30798.67462), '308 SEK');
      assert.strictEqual(priceFormat(10050, { includeSymbol: true }), '101 SEK');
      assert.strictEqual(priceFormat(10049.999999999), '100 SEK');
    });

    it('formats price without SEK', () => {
      assert.strictEqual(priceFormat(665, { includeSymbol: false, includeOre: false }), '7');
      assert.strictEqual(priceFormat(0, { includeSymbol: false }), '0');
      assert.strictEqual(priceFormat(50, { includeSymbol: false }), '1');
      assert.strictEqual(priceFormat(49.99999, { includeSymbol: false }), '0');
      assert.strictEqual(priceFormat(30668, { includeSymbol: false }), '307');
    });

    it('formats price with SEK and öre', () => {
      assert.strictEqual(priceFormat(57483, { includeOre: true }), '574.83 SEK');
      assert.strictEqual(priceFormat(1, { includeOre: true }), '0.01 SEK');
      assert.strictEqual(priceFormat(-78943, { includeOre: true }), '-789.43 SEK');
      assert.strictEqual(priceFormat(-23.2135, { includeOre: true }), '-0.23 SEK');
      assert.strictEqual(priceFormat(61726.500000, { includeOre: true }), '617.27 SEK');
      assert.strictEqual(priceFormat(61726.4999999, { includeOre: true }), '617.26 SEK');
      assert.strictEqual(priceFormat(0, { includeOre: true }), '0.00 SEK');
    });

    it('formats price without SEK and with öre', () => {
      assert.strictEqual(priceFormat(198, { includeSymbol: false, includeOre: true }), '1.98');
      assert.strictEqual(priceFormat(0, { includeSymbol: false, includeOre: true }), '0.00');
      assert.strictEqual(priceFormat(50, { includeSymbol: false, includeOre: true }), '0.50');
      assert.strictEqual(priceFormat(13443, { includeSymbol: false, includeOre: true }), '134.43');
      assert.strictEqual(priceFormat(9885.653, { includeSymbol: false, includeOre: true }), '98.86');
    });
  });

  describe('Helper functions that require DOM', () => {
    let div;
    const testDom = document.getElementById('testDom');

    beforeEach(() => {
      testDom.innerHTML = '';
      div = document.createElement('div');
    });

    it('gets no recipient id from selector', () => {
      div.id = 'name';
      testDom.appendChild(div);
    });

    it('gets recipient id from selector', () => {
      div.id = 'name-0';
      testDom.appendChild(div);
    });

    it('gets no recipient id from invalid selector', () => {
    });
  });
});
