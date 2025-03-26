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

// Inicialização
function initApp() {
    initMap();
    loadSettings();
    initAutocomplete();
    loadHistory();
    addEventListeners();
}

// Sistema de Mapa
function initMap() {
    if (!CONFIG.map) {
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
}

// Sistema de Configurações
function saveConfig() {
    const settings = {
        baseFare: parseFloat(document.getElementById('baseFare').value),
        minFare: parseFloat(document.getElementById('minFare').value),
        costPerKm: parseFloat(document.getElementById('costPerKm').value),
        costPerMin: parseFloat(document.getElementById('costPerMin').value)
    };

    if (Object.values(settings).some(isNaN)) {
        showError('Preencha todos os campos numéricos corretamente!');
        return;
    }

    localStorage.setItem(CONFIG.storageKeys.settings, JSON.stringify(settings));
    showMessage('Configurações salvas com sucesso!', 'success');
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

// Sistema de Rotas
async function calculateRoute() {
    try {
        showLoading(true);
        clearPreviousRoute();

        const settings = getValidatedSettings();
        const addresses = getValidatedAddresses();
        
        const [start, end] = await Promise.all([
            geocodeAddress(addresses.origin),
            geocodeAddress(addresses.destination)
        ]);

        drawRoute(start, end);
        calculateAndDisplayFare(settings, start, end);

    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

// Geocodificação Atualizada com seu User-Agent
async function geocodeAddress(address) {
    try {
        const response = await fetch(
            `${CONFIG.endpoints.geocoding}${encodeURIComponent(address)}`,
            {
                headers: {
                    'User-Agent': 'maproutecalc/1.0 (https://github.com/augustomotorista73/maproutecalc)'
                }
            }
        );

        const data = await response.json();
        if (!data || data.length === 0) throw new Error('Endereço não encontrado');
        
        return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
            address: data[0].display_name
        };
    } catch (error) {
        throw new Error(`Erro no endereço: ${error.message}`);
    }
}

// Funções Auxiliares
function togglePanel() {
    const panel = document.querySelector('.config-panel');
    panel.classList.toggle('collapsed');
}

function clearHistory() {
    localStorage.removeItem(CONFIG.storageKeys.history);
    loadHistory();
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

window.addEventListener('DOMContentLoaded', initApp);