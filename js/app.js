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

function initApp() {
    initMap();
    loadSettings();
    loadHistory();
    addEventListeners();
}

function addEventListeners() {
    document.getElementById('fareProfile').addEventListener('change', loadProfile);
    document.querySelector('.toggle-btn').addEventListener('click', togglePanel);
}

function initMap() {
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

async function calculateRoute() {
    try {
        showLoading(true);
        clearPreviousRoute();

        const settings = getValidatedSettings();
        const addresses = getValidatedAddresses();
        
        const start = await geocodeAddress(addresses.origin);
        const end = await geocodeAddress(addresses.destination);

        const route = await drawRoute(start, end);
        displayRouteResults(settings, route);

    } catch (error) {
        console.error('Erro ao calcular rota:', error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

async function geocodeAddress(query) {
    const response = await fetch(`${CONFIG.endpoints.geocoding}${encodeURIComponent(query)}`);
    const data = await response.json();
    if (!data || data.length === 0) throw new Error('Endereço não encontrado');
    return { lat: data[0].lat, lon: data[0].lon };
}

async function drawRoute(start, end) {
    return new Promise((resolve, reject) => {
        if (!L.Routing) {
            reject(new Error('Leaflet Routing Machine não foi carregado!'));
            return;
        }

        CONFIG.routingControl = L.Routing.control({
            waypoints: [
                L.latLng(start.lat, start.lon),
                L.latLng(end.lat, end.lon)
            ],
            routeWhileDragging: true,
            show: false
        }).addTo(CONFIG.map);

        CONFIG.routingControl.on('routesfound', (e) => {
            resolve(e.routes[0]);
        });
        CONFIG.routingControl.on('routingerror', (e) => {
            reject(new Error('Erro ao calcular a rota: ' + (e.error.message || 'Desconhecido')));
        });
    });
}

function displayRouteResults(settings, route) {
    const distance = (route.summary.totalDistance / 1000).toFixed(2);
    const duration = (route.summary.totalTime / 60).toFixed(2);
    const total = calculateFare(settings, distance, duration);

    document.getElementById('results').innerHTML = `
        <div class="result-card">
            <h3>📝 Resultado da Corrida</h3>
            <p>Distância: ${distance} km</p>
            <p>Duração: ${duration} minutos</p>
            <p class="total">Total: R$ ${total}</p>
        </div>
    `;

    saveToHistory({ distance, duration, total });
}

function calculateFare(settings, distance, duration) {
    const base = parseFloat(settings.baseFare);
    const perKm = parseFloat(settings.costPerKm) * parseFloat(distance);
    const perMin = parseFloat(settings.costPerMin) * parseFloat(duration);
    const total = base + perKm + perMin;
    return Math.max(total, parseFloat(settings.minFare)).toFixed(2);
}

function clearPreviousRoute() {
    if (CONFIG.routingControl) {
        CONFIG.map.removeControl(CONFIG.routingControl);
        CONFIG.routingControl = null;
    }
    document.getElementById('results').innerHTML = '';
}

function getValidatedSettings() {
    const baseFare = document.getElementById('baseFare').value || 5;
    const minFare = document.getElementById('minFare').value || 10;
    const costPerKm = document.getElementById('costPerKm').value || 2;
    const costPerMin = document.getElementById('costPerMin').value || 0.5;
    return { baseFare, minFare, costPerKm, costPerMin };
}

function getValidatedAddresses() {
    const origin = document.getElementById('origin').value.trim();
    const destination = document.getElementById('destination').value.trim();
    if (!origin || !destination) throw new Error('Preencha ambos os endereços');
    return { origin, destination };
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

function showError(message) {
    alert(message); // Pode ser substituído por um modal mais elegante
}

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem(CONFIG.storageKeys.settings) || '{}');
    document.getElementById('baseFare').value = settings.baseFare || '';
    document.getElementById('minFare').value = settings.minFare || '';
    document.getElementById('costPerKm').value = settings.costPerKm || '';
    document.getElementById('costPerMin').value = settings.costPerMin || '';
}

function saveConfig() {
    const settings = getValidatedSettings();
    localStorage.setItem(CONFIG.storageKeys.settings, JSON.stringify(settings));
    console.log('Configurações salvas:', settings);
    showError('Configurações salvas com sucesso!');
}

function loadProfile() {
    const profile = document.getElementById('fareProfile').value;
    let settings = {};
    if (profile === 'padrao') settings = { baseFare: 5, minFare: 10, costPerKm: 2, costPerMin: 0.5 };
    else if (profile === 'premium') settings = { baseFare: 10, minFare: 20, costPerKm: 3, costPerMin: 1 };
    Object.keys(settings).forEach(key => document.getElementById(key).value = settings[key]);
    saveConfig(); // Salva automaticamente ao mudar o perfil
}

function saveToHistory(ride) {
    const history = JSON.parse(localStorage.getItem(CONFIG.storageKeys.history) || '[]');
    history.unshift({
        date: new Date().toLocaleString(),
        origin: document.getElementById('origin').value,
        destination: document.getElementById('destination').value,
        ...ride
    });
    localStorage.setItem(CONFIG.storageKeys.history, JSON.stringify(history));
    console.log('Histórico salvo:', history);
    loadHistory();
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem(CONFIG.storageKeys.history) || '[]');
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = history.map(item => `
        <div class="history-item">
            <p>${item.date}: ${item.origin} → ${item.destination}</p>
            <p>R$ ${item.total}</p>
        </div>
    `).join('');
}

function clearHistory() {
    localStorage.removeItem(CONFIG.storageKeys.history);
    loadHistory();
}

function togglePanel() {
    const panel = document.querySelector('.panel-content');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    document.querySelector('.toggle-btn').textContent = panel.style.display === 'none' ? '▼' : '▲';
}

window.addEventListener('DOMContentLoaded', initApp);