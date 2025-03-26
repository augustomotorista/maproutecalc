// Configurações Iniciais
const config = {
    appName: "Cálculo de Trajeto",
    map: null,
    routingControl: null,
    fareProfiles: {
        padrao: { baseFare: 5, minFare: 10, costPerKm: 2, costPerMin: 0.5 },
        premium: { baseFare: 10, minFare: 20, costPerKm: 3, costPerMin: 1 }
    }
};

// Mensagens atualizadas
const messages = {
    welcome: "Bem-vindo ao Cálculo de Trajeto!",
    configSaved: "Configurações salvas com sucesso! 🎉",
    routeCalculating: "Calculando melhor rota...",
    addressNotFound: "Endereço não encontrado 🗺️",
    configRequired: "Complete as configurações primeiro ⚙️"
};

// Inicialização
function init() {
    showMessage(messages.welcome);
    initMap();
    loadConfig();
    initAutocomplete();
    loadHistory();
}

// Funções atualizadas com novo nome
function showAppName() {
    return `<strong>${config.appName}</strong>`;
}

function showError(text) {
    const html = `
        <div class="error-message">
            ⚠️ ${text} - ${showAppName()}
        </div>
    `;
    // ... restante da função
}

// Restante do código mantido com ajustes de mensagens