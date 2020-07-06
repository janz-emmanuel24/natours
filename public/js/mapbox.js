/* eslint-disable */
export const displayMap = locations => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiamFuejEyMzQiLCJhIjoiY2tidDQwbzFyMDY3ZzM1dDc2MDM2cWNiOCJ9.09DNNRdxkGsundzCduOMIg';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/janz1234/ckbt4ynqk0k021jnrj34wy786',
        scrollZoom: false
            // center: [-118.121010, 34.112045],
            // zoom: 8,
            // interactive: false
    });

    const bounds = new mapboxgl.LngLatBounds(); //this is the area that will be displayed on the map

    locations.forEach(loc => {
        // Create element to be the marker
        const el = document.createElement('div');
        el.className = 'marker';

        // Add the marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom' // this means that its the bottom of that element(pin) that will be on the exact gps coordinates
        }).setLngLat(loc.coordinates).addTo(map);

        // Add popup
        new mapboxgl.Popup({
            offset: 30
        }).setLngLat(loc.coordinates).setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`).addTo(map);

        // Extend the map boundaries to include current locations
        bounds.extend(loc.coordinates);
    });

    // Make the map to fit the bounds
    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    });
}