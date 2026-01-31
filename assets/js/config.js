// ========== CONFIGURAÇÃO AVANÇADA ==========
const CONFIG = {
    // IMPORTANTE: Substituir com sua URL real ou usar proxy
    API_URL: 'https://script.google.com/macros/s/AKfycbxZPd-HCis21bpnWsKOKSIToQDlaNg9hH1f9zaaj1W9SGzs6RPFIiiJHBaPVvQA-Go/exec',
    SPREADSHEET_ID: '1CwF9hf-lsjYkol-V7r3WOT5ld3dQFqKRTQ8nHcV45Wo',
    LOCAL_STORAGE_KEY: 'selo_miv_data_v2',
    VERSION: '2.1.0',
    AUTO_REFRESH_INTERVAL: 60000, // 1 minuto
    DEFAULT_BALANCE: 1000,
    
    // Mapeamento de abas da planilha
    SHEET_NAMES: {
        USERS: 'usuarios',
        MUSIC: 'musicas',
        PORTFOLIO: 'carteira',
        TRANSACTIONS: 'transacoes',
        ARTIST_DATA: 'artist_data'
    }
};

// ========== ESTADO GLOBAL ==========
const state = {
    currentUser: null,
    userBalance: 0,
    playlist: [],
    portfolioAssets: [],
    ledgerData: [],
    currentTrackIndex: -1,
    isPlaying: false,
    currentInvestTrack: null,
    youtubePlayer: null,
    currentVolume: 80,
    isShuffle: false,
    isRepeat: false,
    offlineMode: false,
    appInitialized: false
};

// Inicializar variáveis globais necessárias
window.CONFIG = CONFIG;
window.state = state;
window.youtubeAPILoaded = false;
window.youtubePlayer = null;
