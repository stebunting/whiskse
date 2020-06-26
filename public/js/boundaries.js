/* global google */
// Geographical Constants

let whiskLocation;
let zone1Boundary;
let zone2Boundary;

const localDistance = 100; // metres

const locationDistance = (location) => google.maps.geometry.spherical.computeDistanceBetween(
  whiskLocation,
  location
);

const isLocal = (location) => locationDistance(location) < localDistance;

const inZoneOne = (location) => google.maps.geometry.poly.containsLocation(location, zone1Boundary);

const inZoneTwo = (location) => google.maps.geometry.poly.containsLocation(location, zone2Boundary);

const initialise = () => {
  fetch('/js/boundaries.xml')
    .then((data) => data.text())
    .then((text) => {
      $($.parseXML(text)).find('Placemark').each(function callback() {
        const name = $(this).find('name').text();
        const boundaries = { paths: [] };

        const coordinates = $(this).find('coordinates').text().split(/\r?\n/);
        coordinates.forEach((line) => {
          const lineArray = line.split(',').map((x) => parseFloat(x.replace(' ', '')));
          if (lineArray.length === 3 && !Number.isNaN(lineArray[0])
                                     && !Number.isNaN(lineArray[1])) {
            boundaries.paths.push(new google.maps.LatLng(lineArray[1], lineArray[0]));
          }
        });

        if (name === 'Whisk') {
          whiskLocation = boundaries.paths[0];
        } else if (name === 'Zone 2') {
          zone2Boundary = new google.maps.Polygon(boundaries);
        } else if (name === 'Zone 1') {
          zone1Boundary = new google.maps.Polygon(boundaries);
        }
      });
    });
};

export {
  initialise,
  isLocal,
  inZoneOne,
  inZoneTwo
};
