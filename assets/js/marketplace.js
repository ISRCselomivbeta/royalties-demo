// ========== PORTFÓLIO DO USUÁRIO ==========

// Carregar portfólio
async function loadPortfolio(silent = false) {
    if (!state.currentUser) return;
    
    if (!silent) showLoading('Carregando portfólio...');
    
    try {
        const result = await dataManager.getCarteira(
            state.currentUser.id || state.currentUser.email
        );
        
        if (result.success) {
            state.portfolioAssets = result.data || [];
            renderPortfolio();
        }
    } catch (error) {
        console.error('Erro ao carregar portfólio:', error);
        renderPortfolio();
    } finally {
        if (!silent) hideLoading();
    }
}

// Renderizar portfólio
function renderPortfolio() {
    const container = document.getElementById('portfolioContent');
    const countElement = document.getElementById('assetsCount');
    const portfolioValueElement = document.getElementById('portfolioValue');
    const updateTimeElement = document.getElementById('portfolioUpdateTime');
    
    if (!container) return;
    
    // Calcular valores totais
    let totalValue = 0;
    let totalInvestment = 0;
    
    state.portfolioAssets.forEach(asset => {
        // Encontrar música correspondente
        const music = state.playlist.find(m => m.id == asset.music_id || m.id == asset.id_musica);
        const currentPrice = music ? (music.valor_acao || 0) : (asset.valor_pago_por_acao || 0);
        const purchasePrice = asset.valor_pago_por_acao || 0;
        const quantity = asset.quantidade || asset.quantidade_acoes || 0;
        
        totalValue += currentPrice * quantity;
        totalInvestment += purchasePrice * quantity;
    });
    
    const totalProfit = totalValue - totalInvestment;
    const profitPercentage = totalInvestment > 0 ? (totalProfit / totalInvestment * 100).toFixed(2) : 0;
    
    // Atualizar valores na UI
    if (portfolioValueElement) {
        portfolioValueElement.textContent = formatCurrency(totalValue);
        
        if (totalProfit !== 0) {
            const profitClass = totalProfit >= 0 ? 'text-success' : 'text-danger';
            const profitSign = totalProfit >= 0 ? '+' : '';
            portfolioValueElement.innerHTML = `
                ${formatCurrency(totalValue)}
                <small class="${profitClass} d-block fs-6">${profitSign}${formatCurrency(totalProfit)} (${profitPercentage}%)</small>
            `;
        }
    }
    
    if (countElement) {
        countElement.textContent = `${state.portfolioAssets.length} ativo${state.portfolioAssets.length !== 1 ? 's' : ''}`;
    }
    
    if (updateTimeElement) {
        updateTimeElement.textContent = `Atualizado: ${new Date().toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })}`;
    }
    
    // Estado vazio
    if (!state.portfolioAssets || state.portfolioAssets.length === 0) {
        container.innerHTML = `
            <div class="empty-state-actionable">
                <i class="bi bi-briefcase empty-icon"></i>
                <h5 class="text-muted">Nenhum ativo na carteira</h5>
                <p class="text-muted">Invista em músicas para começar a construir seu portfólio</p>
                <div class="mt-3">
                    <button class="btn-miv me-2" onclick="changeSection('marketplace')">
                        <i class="bi bi-arrow-right me-2"></i> Explorar Marketplace
                    </button>
                    <button class="btn btn-outline-success" onclick="openAddBalanceModal()">
                        <i class="bi bi-plus-circle me-2"></i> Adicionar Saldo
                    </button>
                </div>
                <div class="mt-4 text-start">
                    <h6>Como começar:</h6>
                    <ol class="small">
                        <li>Adicione crédito à sua conta</li>
                        <li>Explore músicas no Marketplace</li>
                        <li>Compre ações das suas preferidas</li>
                        <li>Acompanhe seus investimentos aqui</li>
                    </ol>
                </div>
            </div>
        `;
        return;
    }
    
    // Renderizar ativos
    container.innerHTML = state.portfolioAssets.map(asset => {
        // Encontrar música correspondente (compatibilidade com diferentes nomes de campo)
        const music = state.playlist.find(m => 
            m.id == asset.music_id || 
            m.id == asset.id_musica || 
            m.id == asset.musica_id
        ) || {};
        
        const currentPrice = music.valor_acao || music.VALOR_ACAO || asset.valor_pago_por_acao || 0;
        const purchasePrice = asset.valor_pago_por_acao || 0;
        const quantity = asset.quantidade || asset.quantidade_acoes || 0;
        const currentValue = quantity * currentPrice;
        const purchaseValue = quantity * purchasePrice;
        const profitLoss = currentValue - purchaseValue;
        const profitLossPercent = purchaseValue > 0 ? (profitLoss / purchaseValue * 100).toFixed(2) : 0;
        const purchaseDate = asset.data_compra ? new Date(asset.data_compra) : null;
        
        return `
            <div class="music-card mb-3">
                <div class="d-flex">
                    <img src="${music.link_capa || music.LINK_CAPA || 'https://via.placeholder.com/80x80/111418/00ff88?text=MIV'}" 
                         style="width: 80px; height: 80px; object-fit: cover; border-radius: 0.75rem; margin-right: 1rem;" 
                         alt="${music.titulo || music.TITULO || 'Música'}"
                         onerror="this.src='https://via.placeholder.com/80x80/111418/00ff88?text=MIV'">
                    <div style="flex: 1;">
                        <h6 class="music-title">${music.titulo || music.TITULO || 'Música não encontrada'}</h6>
                        <p class="music-artist">${music.artista || music.ARTISTA || 'Artista Desconhecido'}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <small class="text-muted">Ações:</small>
                                <div class="fw-bold">${quantity}</div>
                                ${purchaseDate ? `
                                    <small class="text-muted">
                                        Compra: ${purchaseDate.toLocaleDateString('pt-BR')}
                                    </small>
                                ` : ''}
                            </div>
                            <div class="text-center">
                                <small class="text-muted">Valor atual:</small>
                                <div class="fw-bold">${formatCurrency(currentValue)}</div>
                            </div>
                            <div class="text-end">
                                <small class="text-muted">Rentabilidade:</small>
                                <div class="fw-bold ${profitLoss >= 0 ? 'text-success' : 'text-danger'}">
                                    ${profitLoss >= 0 ? '+' : ''}${formatCurrency(profitLoss)}
                                </div>
                                <small class="${profitLoss >= 0 ? 'text-success' : 'text-danger'}">
                                    (${profitLossPercent}%)
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Inicializar atualizações em tempo real
function initializePortfolioUpdates() {
    // Atualizar horário periodicamente
    setInterval(() => {
        const updateEl = document.getElementById('portfolioUpdateTime');
        if (updateEl) {
            updateEl.textContent = `Atualizado: ${new Date().toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })}`;
        }
    }, 60000); // A cada minuto
    
    // Atualizar dados periodicamente
    setInterval(() => {
        if (state.currentUser && !state.offlineMode) {
            loadPortfolio(true);
        }
    }, CONFIG.AUTO_REFRESH_INTERVAL);
}

// Exportar funções
window.loadPortfolio = loadPortfolio;
window.initializePortfolioUpdates = initializePortfolioUpdates;
