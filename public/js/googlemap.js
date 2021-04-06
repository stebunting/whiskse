/* global google */
/* eslint-disable-next-line no-unused-vars */
function initMap() {
  const googleApiLoadedEvent = new Event('google-api-loaded');
  document.dispatchEvent(googleApiLoadedEvent);

  const mapStyle = new google.maps.StyledMapType([
    // https://snazzymaps.com/style/36739/light-grey
    {
      featureType: 'administrative',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#444444' }]
    }, {
      featureType: 'landscape',
      elementType: 'all',
      stylers: [{ color: '#f2f2f2' }]
    }, {
      featureType: 'poi',
      elementType: 'all',
      stylers: [{ visibility: 'off' }]
    }, {
      featureType: 'road',
      elementType: 'all',
      stylers: [
        { saturation: -100 },
        { lightness: 45 }
      ]
    }, {
      featureType: 'road.highway',
      elementType: 'all',
      stylers: [{ visibility: 'simplified' }]
    }, {
      featureType: 'road.arterial',
      elementType: 'labels.icon',
      stylers: [{ visibility: 'off' }]
    }, {
      featureType: 'transit',
      elementType: 'all',
      stylers: [{ visibility: 'off' }]
    }, {
      featureType: 'water',
      elementType: 'all',
      stylers: [
        { color: '#b6dae0' },
        { visibility: 'on' }
      ]
    }
  ]);

  // Define centre
  const address = { lat: 59.341579, lng: 18.110855 };

  // Create Map
  const map = new google.maps.Map(
    document.getElementById('map'), {
      zoom: 13,
      center: address,
      disableDefaultUI: true,
      mapTypeControlOptions: {
        mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain', 'styled_map']
      }
    }
  );

  // Apply style
  map.mapTypes.set('styled_map', mapStyle);
  map.setMapTypeId('styled_map');

  // Add marker
  // const marker = new google.maps.Marker({
  //   position: address,
  //   icon: {
  //     url: 'https://maps.google.com/mapfiles/ms/icons/pink-dot.png'
  //   },
  //   map
  // });
}
