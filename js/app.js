const CONFIG = {
    map: null,
    routingControl: null,
    endpoints: {
        geocoding: 'https://nominatim.openstreetmap.org/search?format=json&q='
    },
    storageKeys: {
        settings: 'routeCalcSettings',
        history: 'routeCalcHistory',
        profiles: 'fareProfiles'
    },
    fareProfiles: {
        padrao: { baseFare: 5, minFare: 10, costPerKm: 2, costPerMin: 0.5 },
        premium: { baseFare: 10, minFare: 20, costPerKm: 3, costPerMin: 1 }
    }
};

// 1. Inicialização
function initApp() {
    initMap();
    loadSettings();
    initAutocomplete();
    loadHistory();
    loadProfileSettings();
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

// 3. Sistema de Rotas
async function calculateRoute() {
    try {
        showLoading(true);
        clearPreviousRoute();

        const settings = getValidatedSettings();
        const { origin, destination } = getValidatedAddresses();
        
        const start = await geocodeAddress(origin);
        const end = await geocodeAddress(destination);

        const route = await drawRoute(start, end);
        displayResults(route, settings);
        saveToHistory(route, settings);

    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

async function drawRoute(start, end) {
    return new Promise((resolve) => {
        if (CONFIG.routingControl) CONFIG.map.removeControl(CONFIG.routingControl);
        
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
    });
}

// 4. Configurações
function saveConfig() {
    const settings = {
        baseFare: parseFloat(document.getElementById('baseFare').value),
        minFare: parseFloat(document.getElementById('minFare').value),
        costPerKm: parseFloat(document.getElementById('costPerKm').value),
        costPerMin: parseFloat(document.getElementById('costPerMin').value)
    };

    if (Object.values(settings).some(isNaN)) {
        showError('Preencha todos os campos numéricos!');
        return;
    }

    localStorage.setItem(CONFIG.storageKeys.settings, JSON.stringify(settings));
    showMessage('Configurações salvas!', 'success');
}

function loadSettings() {
    const saved = JSON.parse(localStorage.getItem(CONFIG.storageKeys.settings));
    if (saved) {
        document.getElementById('baseFare').value = saved.baseFare || '';
        document.getElementById('minFare').value = saved.minFare || '';
        document.getElementById('costPerKm').value = saved.costPerKm || '';
        document.getElementById('costPerMin').value = saved.costPerMin || '';
    }
}

// 5. Perfis de Tarifa
function loadProfile() {
    const profile = document.getElementById('fareProfile').value;
    if (profile === 'custom') return;
    
    const selected = CONFIG.fareProfiles[profile];
    Object.entries(selected).forEach(([key, value]) => {
        document.getElementById(key).value = value;
    });
}

function loadProfileSettings() {
    const savedProfiles = localStorage.getItem(CONFIG.storageKeys.profiles);
    if (savedProfiles) {
        CONFIG.fareProfiles = JSON.parse(savedProfiles);
    }
}

// 6. Histórico
function saveToHistory(route, settings) {
    const history = JSON.parse(localStorage.getItem(CONFIG.storageKeys.history) || [];
    
    history.unshift({
        date: new Date().toLocaleString(),
        origin: document.getElementById('origin').value,
        destination: document.getElementById('destination').value,
        distance: (route.summary.totalDistance / 1000).toFixed(2),
        duration: (route.summary.totalTime / 60).toFixed(2),
        fare: calculateFare(settings, route)
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
                <p>${ride.distance} km • ${ride.duration} min • R$ ${ride.fare}</p>
            </div>
        `).join('');
}

// 7. Funções Auxiliares
function calculateFare(settings, route) {
    const distance = route.summary.totalDistance / 1000;
    const duration = route.summary.totalTime / 60;
    const total = settings.baseFare + (distance * settings.costPerKm) + (duration * settings.costPerMin);
    return Math.max(total, settings.minFare).toFixed(2);
}

function togglePanel() {
    document.querySelector('.config-panel').classList.toggle('collapsed');
}

function clearHistory() {
    localStorage.removeItem(CONFIG.storageKeys.history);
    loadHistory();
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

function showError(message) {
    const el = document.createElement('div');
    el.className = 'error-message';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5000);
}

// Inicialização
window.addEventListener('DOMContentLoaded', initApp);