/* eslint-disable no-undef */
describe('Boundary Tests', () => {
  describe('Boundaries', () => {
    it('has no boundaries initialised', () => {
      assert.isNotOk(whiskLocation);
      assert.isNotOk(homeLocation);
      assert.isNotOk(zone1Boundary);
      assert.isNotOk(zone2Boundary);
    });

    it('initialises boundaries', async () => {
      await initialiseBoundaries();

      assert.isOk(whiskLocation);
      assert.isOk(homeLocation);
      assert.isOk(zone1Boundary);
      assert.isOk(zone2Boundary);
    });

    it('identifies local address to Whisk as zone 0', () => {
      const erikssonsKott = new google.maps.LatLng(59.340613, 18.032487);
      assert.isOk(inZone(0, erikssonsKott));
      assert.strictEqual(getZone(erikssonsKott), 0);

      const tehranGrill = new google.maps.LatLng(59.340075, 18.032718);
      assert.isOk(inZone(0, tehranGrill));
      assert.strictEqual(getZone(tehranGrill), 0);

      const stockholmFargCenter = new google.maps.LatLng(59.341469, 18.034090);
      assert.isOk(inZone(0, stockholmFargCenter));
      assert.strictEqual(getZone(stockholmFargCenter), 0);
    });

    it('identifies local address to home as zone 0', () => {
      const stfVandrarhemReception = new google.maps.LatLng(59.341337, 18.111270);
      assert.isOk(inZone(0, stfVandrarhemReception));
      assert.strictEqual(getZone(stfVandrarhemReception), 0);

      const gardetsGrill = new google.maps.LatLng(59.340759, 18.111040);
      assert.isOk(inZone(0, gardetsGrill));
      assert.strictEqual(getZone(gardetsGrill), 0);

      const sehlstedtsgatan7 = new google.maps.LatLng(59.342748, 18.111856);
      assert.isOk(inZone(0, sehlstedtsgatan7));
      assert.strictEqual(getZone(sehlstedtsgatan7), 0);
    });

    it('identifies addresses in zone 1', () => {
      const erikdalsBadet = new google.maps.LatLng(59.304888, 18.075489);
      assert.isOk(inZone(1, erikdalsBadet));
      assert.isNotOk(inZone(0, erikdalsBadet));
      assert.strictEqual(getZone(erikdalsBadet), 1);

      const kristineberg = new google.maps.LatLng(59.332940, 18.002695);
      assert.isOk(inZone(1, kristineberg));
      assert.isNotOk(inZone(0, kristineberg));
      assert.strictEqual(getZone(kristineberg), 1);

      const huvudsta = new google.maps.LatLng(59.350105, 17.989210);
      assert.isOk(inZone(1, huvudsta));
      assert.isNotOk(inZone(0, huvudsta));
      assert.strictEqual(getZone(huvudsta), 1);

      const frosunda = new google.maps.LatLng(59.375164, 18.013014);
      assert.isOk(inZone(1, frosunda));
      assert.isNotOk(inZone(0, frosunda));
      assert.strictEqual(getZone(frosunda), 1);

      const frescati = new google.maps.LatLng(59.374969, 18.046840);
      assert.isOk(inZone(1, frescati));
      assert.isNotOk(inZone(0, frescati));
      assert.strictEqual(getZone(frescati), 1);

      const hjorthagen = new google.maps.LatLng(59.357752, 18.105429);
      assert.isOk(inZone(1, hjorthagen));
      assert.isNotOk(inZone(0, hjorthagen));
      assert.strictEqual(getZone(hjorthagen), 1);

      const blockhusudden = new google.maps.LatLng(59.321918, 18.152807);
      assert.isOk(inZone(1, blockhusudden));
      assert.isNotOk(inZone(0, blockhusudden));
      assert.strictEqual(getZone(blockhusudden), 1);
    });

    it('identifies addresses in zone 2', () => {
      const elfvik = new google.maps.LatLng(59.369073, 18.254605);
      assert.isOk(inZone(2, elfvik));
      assert.isNotOk(inZone(1, elfvik));
      assert.isNotOk(inZone(0, elfvik));
      assert.strictEqual(getZone(elfvik), 2);

      const trolldalen = new google.maps.LatLng(59.389104, 18.136846);
      assert.isOk(inZone(2, trolldalen));
      assert.isNotOk(inZone(1, trolldalen));
      assert.isNotOk(inZone(0, trolldalen));
      assert.strictEqual(getZone(trolldalen), 2);

      const rinkebySkogen = new google.maps.LatLng(59.416949, 18.008046);
      assert.isOk(inZone(2, rinkebySkogen));
      assert.isNotOk(inZone(1, rinkebySkogen));
      assert.isNotOk(inZone(0, rinkebySkogen));
      assert.strictEqual(getZone(rinkebySkogen), 2);

      const rinkeby = new google.maps.LatLng(59.391101, 17.928167);
      assert.isOk(inZone(2, rinkeby));
      assert.isNotOk(inZone(1, rinkeby));
      assert.isNotOk(inZone(0, rinkeby));
      assert.strictEqual(getZone(rinkebySkogen), 2);

      const spanga = new google.maps.LatLng(59.387676, 17.868773);
      assert.isOk(inZone(2, spanga));
      assert.isNotOk(inZone(1, spanga));
      assert.isNotOk(inZone(0, spanga));
      assert.strictEqual(getZone(spanga), 2);

      const grimsta = new google.maps.LatLng(59.363335, 17.861784);
      assert.isOk(inZone(2, grimsta));
      assert.isNotOk(inZone(1, grimsta));
      assert.isNotOk(inZone(0, grimsta));
      assert.strictEqual(getZone(grimsta), 2);

      const bromma = new google.maps.LatLng(59.339937, 17.887308);
      assert.isOk(inZone(2, bromma));
      assert.isNotOk(inZone(1, bromma));
      assert.isNotOk(inZone(0, bromma));
      assert.strictEqual(getZone(bromma), 2);

      const hagerstensbadet = new google.maps.LatLng(59.290364, 17.983026);
      assert.isOk(inZone(2, hagerstensbadet));
      assert.isNotOk(inZone(1, hagerstensbadet));
      assert.isNotOk(inZone(0, hagerstensbadet));
      assert.strictEqual(getZone(hagerstensbadet), 2);

      const vastberga = new google.maps.LatLng(59.292126, 18.015506);
      assert.isOk(inZone(2, vastberga));
      assert.isNotOk(inZone(1, vastberga));
      assert.isNotOk(inZone(0, vastberga));
      assert.strictEqual(getZone(vastberga), 2);

      const arsta = new google.maps.LatLng(59.296735, 18.049048);
      assert.isOk(inZone(2, arsta));
      assert.isNotOk(inZone(1, arsta));
      assert.isNotOk(inZone(0, arsta));
      assert.strictEqual(getZone(arsta), 2);

      const gullmarsplan = new google.maps.LatLng(59.296853, 18.080497);
      assert.isOk(inZone(2, gullmarsplan));
      assert.isNotOk(inZone(1, gullmarsplan));
      assert.isNotOk(inZone(0, gullmarsplan));
      assert.strictEqual(getZone(gullmarsplan), 2);

      const eastNacka = new google.maps.LatLng(59.314892, 18.213942);
      assert.isOk(inZone(2, eastNacka));
      assert.isNotOk(inZone(1, eastNacka));
      assert.isNotOk(inZone(0, eastNacka));
      assert.strictEqual(getZone(eastNacka), 2);
    });

    it('identifies addresses outside zone 2', () => {
      const alvsjo = new google.maps.LatLng(59.279286, 18.007586);
      assert.isNotOk(inZone(2, alvsjo));
      assert.strictEqual(getZone(alvsjo), 3);

      const saltsjoBoo = new google.maps.LatLng(59.315084, 18.228385);
      assert.isNotOk(inZone(2, saltsjoBoo));
      assert.strictEqual(getZone(saltsjoBoo), 3);

      const drottningholm = new google.maps.LatLng(59.323701, 17.889933);
      assert.isNotOk(inZone(2, drottningholm));
      assert.strictEqual(getZone(drottningholm), 3);

      const hasselby = new google.maps.LatLng(59.384230, 17.798652);
      assert.isNotOk(inZone(2, hasselby));
      assert.strictEqual(getZone(hasselby), 3);

      const kista = new google.maps.LatLng(59.404725, 17.947225);
      assert.isNotOk(inZone(2, kista));
      assert.strictEqual(getZone(kista), 3);

      const taby = new google.maps.LatLng(59.431231, 18.062496);
      assert.isNotOk(inZone(2, taby));
      assert.strictEqual(getZone(taby), 3);

      const vaxholm = new google.maps.LatLng(59.390131, 18.250036);
      assert.isNotOk(inZone(2, vaxholm));
      assert.strictEqual(getZone(vaxholm), 3);
    });
  });
});
