// Substitua TODO o conteúdo por:
const API_CONFIG = {
  // ⚠️ SUBSTITUA pela URL REAL do seu Google Apps Script
  // Exemplo: https://script.google.com/macros/s/SEU_ID_AQUI/exec
  BASE_URL: 'https://script.google.com/macros/s/AKfycbz2YAhOVFhcae3BGegp46J7inDnpRbRyJFSvlpUctRMoNc9qzk3OmkY3r7yG8NyJc8/exec',
  
  ENDPOINTS: {
    TEST: 'test',
    LOGIN: 'login',
    REGISTER: 'register',
    GET_MUSICAS: 'get_musicas',
    GET_SALDO: 'get_saldo',
    GET_CARTEIRA: 'get_carteira',
    GET_EXTRATO: 'get_extrato',
    GET_ARTIST_DATA: 'get_artist_data',
    BUY_SHARES: 'buy',
    UPLOAD_MUSIC: 'uploadmusic',
    GET_TOP_INVESTMENTS: 'get_top_investments',
    GET_USER_PLAYLISTS: 'get_user_playlists',
    CREATE_PLAYLIST: 'create_playlist',
    ADD_TO_PLAYLIST: 'add_to_playlist',
    FAVORITE_MUSIC: 'favorite_music',
    REQUEST_WITHDRAWAL: 'request_withdrawal',
    CONFIRM_WITHDRAWAL: 'confirm_withdrawal',
    GENERATE_PAYMENT_LINK: 'generate_payment_link'
  }
};

// Função para fazer requisições à API
async function callApi(action, params = {}, method = 'GET') {
  try {
    const url = new URL(API_CONFIG.BASE_URL);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (method === 'GET') {
      url.searchParams.append('action', action);
      Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
      });
    } else {
      options.body = JSON.stringify({ action, ...params });
    }
    
    console.log(`📡 Chamando API: ${action}`, params);
    
    const response = await fetch(url.toString(), options);
    const data = await response.json();
    
    console.log(`📥 Resposta da API ${action}:`, data);
    
    if (!data.success) {
      throw new Error(data.message || 'Erro na API');
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Erro na API ${action}:`, error);
    throw error;
  }
}

// Verificar se API está online
async function checkApiStatus() {
  try {
    const result = await callApi('test');
    console.log('✅ API Online:', result.message);
    return true;
  } catch (error) {
    console.error('❌ API Offline:', error);
    showNotification('API offline. Verifique a conexão.', 'error');
    return false;
  }
}

// Expor funções globalmente
window.API_CONFIG = API_CONFIG;
window.callApi = callApi;
window.checkApiStatus = checkApiStatus;
