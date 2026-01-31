// ========== UTILITÁRIOS ==========

// Sistema de notificações Toast
function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return null;
    
    const toast = document.createElement('div');
    const toastId = 'toast_' + Date.now();
    
    toast.id = toastId;
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="bi ${getToastIcon(type)} toast-icon"></i>
        <div class="toast-message">${message}</div>
        <button class="btn btn-sm btn-link text-white p-0" onclick="dismissToast('${toastId}')">
            <i class="bi bi-x"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    if (duration > 0) {
        setTimeout(() => {
            dismissToast(toastId);
        }, duration);
    }
    
    return toastId;
}

function getToastIcon(type) {
    const icons = {
        'success': 'bi-check-circle',
        'error': 'bi-exclamation-circle',
        'warning': 'bi-exclamation-triangle',
        'info': 'bi-info-circle'
    };
    return icons[type] || 'bi-info-circle';
}

function dismissToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// Sistema de loading
function showLoading(message = 'Carregando...') {
    const loadingScreen = document.getElementById('loadingScreen');
    const loadingMessage = document.getElementById('loadingMessage');
    
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
    }
    
    if (loadingMessage) {
        loadingMessage.textContent = message;
    }
}

function hideLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
}

// Sistema de modais
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// Formatação de dados
function formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) value = 0;
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(value));
}

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Agora mesmo';
        if (diffMins < 60) return `Há ${diffMins} min`;
        if (diffHours < 24) return `Há ${diffHours} h`;
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 7) return `Há ${diffDays} dias`;
        
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Validação de email
function validateEmailField(field) {
    const email = field.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailRegex.test(email)) {
        field.classList.add('is-invalid');
        return false;
    } else {
        field.classList.remove('is-invalid');
        return true;
    }
}

// Normalização de dados da planilha
function normalizeSheetData(data) {
    if (!data || !Array.isArray(data)) return data;
    
    return data.map(item => {
        const normalized = {};
        
        // Normaliza propriedades para minúsculas com underscore
        for (const key in item) {
            if (item.hasOwnProperty(key)) {
                const normalizedKey = key.toLowerCase().replace(/ /g, '_');
                normalized[normalizedKey] = item[key];
            }
        }
        
        return normalized;
    });
}

// Cálculo de ações disponíveis
function calculateAvailableShares(track) {
    if (!track) return 0;
    
    const percentAvailable = parseFloat(track.percentual_disponivel) || 0;
    const sharesSold = parseFloat(track.acoes_vendidas) || 0;
    
    // Percentual disponível representa o total de ações
    // Ex: 25% disponível = 25 ações (se 1% = 1 ação)
    const totalShares = percentAvailable; // Já está em número de ações
    
    return Math.max(0, totalShares - sharesSold);
}

// Exportar dados
function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        showToast('Nenhum dado para exportar', 'warning');
        return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            const value = row[header];
            // Escapa vírgulas e aspas
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Arquivo exportado com sucesso', 'success');
}

// Atualizar display do saldo
function updateBalanceDisplay() {
    const balanceElement = document.getElementById('currentBalance');
    if (balanceElement) {
        balanceElement.textContent = formatCurrency(state.userBalance);
        
        if (state.offlineMode) {
            balanceElement.innerHTML = `${formatCurrency(state.userBalance)} <small class="text-warning">(offline)</small>`;
        }
    }
}

// Extrair ID do YouTube
function extractYouTubeId(url) {
    if (!url) return null;
    
    const cleanUrl = url.split('&')[0];
    
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/e\/)([^#&?]{11})/,
        /^([^#&?]{11})$/
    ];
    
    for (const pattern of patterns) {
        const match = cleanUrl.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    
    return null;
}

// Gerar spinner
function createSpinner() {
    const style = document.createElement('style');
    style.textContent = `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
}

// Exportar funções para uso global
window.showToast = showToast;
window.dismissToast = dismissToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showModal = showModal;
window.closeModal = closeModal;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.validateEmailField = validateEmailField;
window.updateBalanceDisplay = updateBalanceDisplay;
window.extractYouTubeId = extractYouTubeId;
