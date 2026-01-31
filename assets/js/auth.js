// Substitua TODO o conteúdo por:
class MarketplaceManager {
  constructor() {
    this.musicas = [];
    this.currentFilter = 'all';
    this.init();
  }
  
  init() {
    this.loadMusicas();
    this.setupEventListeners();
  }
  
  async loadMusicas() {
    try {
      showLoading('Carregando músicas...');
      
      const result = await callApi('get_musicas');
      
      if (result.success && result.data) {
        this.musicas = result.data;
        console.log(`✅ ${this.musicas.length} músicas carregadas`);
        this.renderMusicas();
        this.renderTopInvestments();
      } else {
        throw new Error('Nenhuma música encontrada');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar músicas:', error);
      this.showEmptyState();
    } finally {
      hideLoading();
    }
  }
  
  renderMusicas(filter = 'all') {
    this.currentFilter = filter;
    const container = document.getElementById('musicas-container') || 
                     document.querySelector('.marketplace-grid, .music-grid');
    
    if (!container) {
      console.error('❌ Container de músicas não encontrado');
      return;
    }
    
    // Filtrar músicas
    let filteredMusicas = [...this.musicas];
    
    if (filter !== 'all') {
      filteredMusicas = filteredMusicas.filter(music => 
        music.genero && music.genero.toLowerCase() === filter.toLowerCase()
      );
    }
    
    // Ordenar por mais vendidas primeiro
    filteredMusicas.sort((a, b) => {
      const vendidasA = parseFloat(a.acoes_vendidas || 0);
      const vendidasB = parseFloat(b.acoes_vendidas || 0);
      return vendidasB - vendidasA;
    });
    
    if (filteredMusicas.length === 0) {
      this.showEmptyState();
      return;
    }
    
    // Gerar HTML das músicas
    container.innerHTML = filteredMusicas.map(music => this.createMusicCard(music)).join('');
    
    // Adicionar event listeners aos botões de compra
    this.setupBuyButtons();
  }
  
  createMusicCard(music) {
    const valorAcao = parseFloat(music.valor_acao || 0);
    const acoesVendidas = parseFloat(music.acoes_vendidas || 0);
    const percentualDisponivel = parseFloat(music.percentual_disponivel || 0);
    const totalAcoes = percentualDisponivel / 0.01; // Cada 1% = 1 ação
    const acoesDisponiveis = Math.max(0, totalAcoes - acoesVendidas);
    const percentualVendido = totalAcoes > 0 ? (acoesVendidas / totalAcoes * 100).toFixed(1) : 0;
    
    return `
      <div class="music-card" data-music-id="${music.id}">
        <div class="music-card-header">
          <img src="${music.link_capa || 'https://via.placeholder.com/300x200?text=Música'}" 
               alt="${music.titulo}" 
               class="music-cover"
               onerror="this.src='https://via.placeholder.com/300x200?text=Música'">
          <div class="music-badges">
            <span class="badge genre">${music.genero || 'Gênero'}</span>
            <span class="badge price">R$ ${valorAcao.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="music-card-body">
          <h3 class="music-title">${music.titulo || 'Título não disponível'}</h3>
          <p class="music-artist">🎤 ${music.artista || 'Artista desconhecido'}</p>
          
          <div class="music-stats">
            <div class="stat">
              <span class="stat-label">Ações Vendidas</span>
              <span class="stat-value">${acoesVendidas} / ${totalAcoes}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Percentual</span>
              <span class="stat-value">${percentualVendido}%</span>
            </div>
            <div class="stat">
              <span class="stat-label">Disponível</span>
              <span class="stat-value">${acoesDisponiveis} ações</span>
            </div>
          </div>
          
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentualVendido}%"></div>
          </div>
          
          <div class="music-actions">
            <button class="btn btn-outline listen-btn" data-youtube="${music.link_youtube || ''}" data-spotify="${music.link_spotify || ''}">
              <i class="fas fa-play"></i> Ouvir
            </button>
            
            ${acoesDisponiveis > 0 ? `
              <button class="btn btn-primary buy-btn" 
                      data-music-id="${music.id}"
                      data-music-title="${music.titulo}"
                      data-music-artist="${music.artista}"
                      data-music-price="${valorAcao}"
                      data-available-shares="${acoesDisponiveis}">
                <i class="fas fa-shopping-cart"></i> Comprar Ações
              </button>
            ` : `
              <button class="btn btn-disabled" disabled>
                <i class="fas fa-sold-out"></i> Esgotado
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }
  
  setupBuyButtons() {
    document.querySelectorAll('.buy-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        if (!authManager.isLoggedIn()) {
          showNotification('Faça login para comprar ações', 'warning');
          return;
        }
        
        const musicId = button.dataset.musicId;
        const musicTitle = button.dataset.musicTitle;
        const musicArtist = button.dataset.musicArtist;
        const musicPrice = parseFloat(button.dataset.musicPrice);
        const availableShares = parseInt(button.dataset.availableShares);
        
        this.showBuyModal(musicId, musicTitle, musicArtist, musicPrice, availableShares);
      });
    });
    
    // Botões de ouvir
    document.querySelectorAll('.listen-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const youtubeUrl = button.dataset.youtube;
        const spotifyUrl = button.dataset.spotify;
        
        if (youtubeUrl) {
          window.open(youtubeUrl, '_blank');
        } else if (spotifyUrl) {
          window.open(spotifyUrl, '_blank');
        } else {
          showNotification('Link de reprodução não disponível', 'warning');
        }
      });
    });
  }
  
  showBuyModal(musicId, title, artist, price, availableShares) {
    // Criar modal de compra
    const modalHTML = `
      <div class="modal-overlay" id="buy-modal">
        <div class="modal">
          <div class="modal-header">
            <h3>Comprar Ações</h3>
            <button class="modal-close">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="buy-info">
              <h4>${title}</h4>
              <p>Artista: ${artist}</p>
              <p>Preço por ação: <strong>R$ ${price.toFixed(2)}</strong></p>
              <p>Ações disponíveis: <strong>${availableShares}</strong></p>
            </div>
            
            <div class="form-group">
              <label for="share-quantity">Quantidade de ações:</label>
              <input type="number" 
                     id="share-quantity" 
                     min="1" 
                     max="${availableShares}" 
                     value="1"
                     class="form-control">
              <small class="form-text">Máximo: ${availableShares} ações</small>
            </div>
            
            <div class="form-group">
              <label>Valor total:</label>
              <div class="total-amount" id="total-amount">
                R$ ${price.toFixed(2)}
              </div>
            </div>
            
            <div class="user-balance-check">
              <p>Seu saldo: <span id="user-current-balance">R$ 0,00</span></p>
              <p id="balance-check-message"></p>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancel-buy">Cancelar</button>
            <button class="btn btn-primary" id="confirm-buy" disabled>
              <i class="fas fa-shopping-cart"></i> Confirmar Compra
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Adicionar modal ao body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('buy-modal');
    
    // Atualizar valor total quando quantidade mudar
    const quantityInput = document.getElementById('share-quantity');
    const totalAmount = document.getElementById('total-amount');
    const confirmBtn = document.getElementById('confirm-buy');
    
    const updateTotal = () => {
      const quantity = parseInt(quantityInput.value) || 1;
      const total = quantity * price;
      totalAmount.textContent = `R$ ${total.toFixed(2)}`;
      
      // Verificar saldo do usuário
      const user = authManager.getUser();
      const userBalance = parseFloat(user?.saldo || 0);
      
      document.getElementById('user-current-balance').textContent = 
        `R$ ${userBalance.toFixed(2)}`;
      
      const balanceCheck = document.getElementById('balance-check-message');
      
      if (total > userBalance) {
        balanceCheck.textContent = 'Saldo insuficiente';
        balanceCheck.className = 'text-danger';
        confirmBtn.disabled = true;
      } else {
        balanceCheck.textContent = 'Saldo suficiente';
        balanceCheck.className = 'text-success';
        confirmBtn.disabled = false;
      }
    };
    
    quantityInput.addEventListener('input', updateTotal);
    updateTotal(); // Calcular inicial
    
    // Botão de confirmar compra
    confirmBtn.addEventListener('click', async () => {
      const quantity = parseInt(quantityInput.value) || 1;
      const total = quantity * price;
      
      try {
        showLoading('Processando compra...');
        
        const result = await callApi('buy', {
          user_id: authManager.getUserId(),
          music_id: musicId,
          quantidade: quantity,
          valor_total: total
        }, 'POST');
        
        if (result.success) {
          showNotification('Compra realizada com sucesso!', 'success');
          
          // Atualizar dados do usuário
          await authManager.loadUserData();
          
          // Recarregar músicas
          await this.loadMusicas();
          
          // Fechar modal
          modal.remove();
          
          // Mostrar confirmação
          setTimeout(() => {
            showNotification('Contrato enviado para seu email!', 'info');
          }, 1000);
        } else {
          throw new Error(result.message || 'Erro na compra');
        }
      } catch (error) {
        console.error('❌ Erro na compra:', error);
        showNotification(error.message, 'error');
      } finally {
        hideLoading();
      }
    });
    
    // Fechar modal
    document.querySelector('.modal-close').addEventListener('click', () => {
      modal.remove();
    });
    
    document.getElementById('cancel-buy').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  async renderTopInvestments() {
    try {
      const result = await callApi('get_top_investments');
      
      if (result.success && result.data && result.data.length > 0) {
        const container = document.querySelector('.top-investments-list, .investments-grid');
        
        if (container) {
          const top5 = result.data.slice(0, 5);
          container.innerHTML = top5.map(investment => `
            <div class="investment-card">
              <div class="investment-rank">#${result.data.indexOf(investment) + 1}</div>
              <h4>${investment.titulo}</h4>
              <p class="investment-artist">${investment.artista}</p>
              <div class="investment-stats">
                <span class="stat">
                  <i class="fas fa-chart-line"></i>
                  ${parseFloat(investment.investment_score || 0).toFixed(1)} pts
                </span>
                <span class="stat">
                  <i class="fas fa-money-bill-wave"></i>
                  R$ ${parseFloat(investment.valor_acao || 0).toFixed(2)}
                </span>
              </div>
            </div>
          `).join('');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar top investimentos:', error);
    }
  }
  
  showEmptyState() {
    const container = document.getElementById('musicas-container') || 
                     document.querySelector('.marketplace-grid, .music-grid');
    
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-music empty-icon"></i>
          <h3>Nenhuma música disponível</h3>
          <p>As músicas aparecerão aqui quando forem cadastradas.</p>
          ${authManager.isLoggedIn() && authManager.getUser()?.tipo === 'artista' ? 
            `<button class="btn btn-primary" id="upload-first-music">
               <i class="fas fa-upload"></i> Cadastrar Primeira Música
             </button>` : 
            ''}
        </div>
      `;
      
      // Adicionar event listener para o botão de upload
      const uploadBtn = document.getElementById('upload-first-music');
      if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
          // Abrir modal de upload de música
          if (window.artistManager) {
            window.artistManager.showUploadModal();
          }
        });
      }
    }
  }
  
  setupEventListeners() {
    // Filtros de gênero
    document.querySelectorAll('.genre-filter').forEach(filter => {
      filter.addEventListener('click', (e) => {
        e.preventDefault();
        const genre = filter.dataset.genre || 'all';
        
        // Atualar botões ativos
        document.querySelectorAll('.genre-filter').forEach(f => {
          f.classList.remove('active');
        });
        filter.classList.add('active');
        
        // Filtrar músicas
        this.renderMusicas(genre);
      });
    });
    
    // Botão de recarregar
    const reloadBtn = document.getElementById('reload-musicas');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', () => {
        this.loadMusicas();
      });
    }
  }
}

// Inicializar marketplace quando o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
  window.marketplaceManager = new MarketplaceManager();
});
