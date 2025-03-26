const CONFIG = {
    map: null,
    routingControl: null,
    endpoints: {
        geocoding: 'https://nominatim.openstreetmap.org/search?format=json&q='
    },
    storageKeys: {
        settings: 'routeCalcSettings',
        history: 'routeCalcHistory'
    }
};

function initMap() {
    console.log('Inicializando mapa...');
    if (typeof L === 'undefined') {
        console.error('Leaflet não foi carregado!');
        return;
    }

    CONFIG.map = L.map('map', {
        center: [-23.5505, -46.6333], // São Paulo como padrão
        zoom: 13,
        zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(CONFIG.map);

    L.control.zoom({ position: 'topright' }).addTo(CONFIG.map);
}

function initApp() {
    console.log('Leaflet carregado?', typeof L !== 'undefined');
    initMap();
}

window.addEventListener('DOMContentLoaded', initApp);