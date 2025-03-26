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

// 1. Inicialização
function initApp() {
    initMap();
    loadSettings();
    initAutocomplete();
    loadHistory();
}

// 2. Sistema de Mapa
function initMap() {
    CONFIG.map = L.map('map', {
        center: [-23.5505, -46.6333],
        zoom: 13,
        zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(CONFIG.map);

    L.control.zoom({ position: 'topright' }).addTo(CONFIG.map);
}

// 3. Validação de Dados
function getValidatedSettings() {
    const settings = JSON.parse(localStorage.getItem(CONFIG.storageKeys.settings));
    if (!settings) throw new Error('Configure as tarifas primeiro!');
    return settings;
}

function getValidatedAddresses() {
    const origin = document.getElementById('origin').value.trim();
    const destination = document.getElementById('destination').value.trim();
    if (!origin || !destination) throw new Error('Preencha origem e destino!');
    return { origin, destination };
}

// 4. Sistema de Rotas
function drawRoute(start, end) {
    if (CONFIG.routingControl) {
        CONFIG.map.removeControl(CONFIG.routingControl);
    }

    CONFIG.routingControl = L.Routing.control({
        waypoints: [
            L.latLng(start.lat, start.lon),
            L.latLng(end.lat, end.lon)
        ],
        routeWhileDragging: true,
        show: false
    }).addTo(CONFIG.map);

    return new Promise(resolve => {
        CONFIG.routingControl.on('routesfound', e => {
            resolve(e.routes[0]);
        });
    });
}

// 5. Cálculo do Valor
async function calculateAndDisplayFare(settings, start, end) {
    const route = await drawRoute(start, end);
    
    const distance = (route.summary.totalDistance / 1000).toFixed(2);
    const duration = (route.summary.totalTime / 60).toFixed(2);
    
    const total = Math.max(
        settings.baseFare + 
        (distance * settings.costPerKm) + 
        (duration * settings.costPerMin),
        settings.minFare
    );

    document.getElementById('results').innerHTML = `
        <div class="result-card">
            <h3>📝 Resultado da Corrida</h3>
            <p>Distância: ${distance} km</p>
            <p>Duração: ${duration} minutos</p>
            <p class="total">Total: R$ ${total.toFixed(2)}</p>
        </div>
    `;

    saveToHistory({ distance, duration, total });
}

// 6. Histórico
function saveToHistory(ride) {
    const history = JSON.parse(localStorage.getItem(CONFIG.storageKeys.history) || [];
    history.unshift({
        date: new Date().toLocaleString(),
        origin: document.getElementById('origin').value,
        destination: document.getElementById('destination').value,
        ...ride
    });
    localStorage.setItem(CONFIG.storageKeys.history, JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem(CONFIG.storageKeys.history) || []);
    document.getElementById('historyList').innerHTML = history
        .map(ride => `
            <div class="history-item">
                <small>${ride.date}</small>
                <p>${ride.origin} → ${ride.destination}</p>
                <p>${ride.distance} km • ${ride.duration} min • R$ ${ride.total}</p>
            </div>
        `).join('');
}

// 7. Funções Auxiliares
function clearPreviousRoute() {
    if (CONFIG.routingControl) {
        CONFIG.map.removeControl(CONFIG.routingControl);
        CONFIG.routingControl = null;
    }
    document.getElementById('results').innerHTML = '';
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

function showError(message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.textContent = message;
    document.body.appendChild(errorEl);
    setTimeout(() => errorEl.remove(), 5000);
}

// 8. Inicialização Final
window.addEventListener('DOMContentLoaded', initApp);