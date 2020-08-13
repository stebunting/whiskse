/* global google */
// Geographical Constants

let whiskLocation;
let homeLocation;
let zone1Boundary;
let zone2Boundary;

const walkableDistance = 150; // metres

function whiskTo(location) {
  return google.maps.geometry.spherical.computeDistanceBetween(
    whiskLocation,
    location
  );
}

function homeTo(location) {
  return google.maps.geometry.spherical.computeDistanceBetween(
    homeLocation,
    location
  );
}

function inZone(zone, location) {
  switch (zone) {
    case 0:
      return whiskTo(location) < walkableDistance || homeTo(location) < walkableDistance;

    case 1:
      return google.maps.geometry.poly.containsLocation(location, zone1Boundary);

    case 2:
      return google.maps.geometry.poly.containsLocation(location, zone2Boundary);

    default:
      return false;
  }
};

function getZone(location) {
  for (let i = 0; i <= 2; i += 1) {
    if (inZone(i, location)) {
      return i;
    }
  }
  return 3;
}

async function initialiseBoundaries() {
  const response = await fetch('/js/boundaries.xml');
  const text = await response.text();

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

    switch (name) {
      case 'Whisk':
        ([whiskLocation] = boundaries.paths);
        break;

      case 'Home':
        ([homeLocation] = boundaries.paths);
        break;

      case 'Zone 2':
        zone2Boundary = new google.maps.Polygon(boundaries);
        break;

      case 'Zone 1':
        zone1Boundary = new google.maps.Polygon(boundaries);
        break;

      default:
        break;
    }
  });
}
