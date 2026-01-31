// Substitua TODO o conteúdo por:
class MIVApp {
  constructor() {
    this.currentView = 'dashboard';
    this.init();
  }
  
  init() {
    this.setupNavigation();
    this.setupEventListeners();
    this.checkInitialLoad();
    
    // Verificar status da API
    setTimeout(() => {
      checkApiStatus();
    }, 1000);
  }
  
  checkInitialLoad() {
    // Verificar se está na página principal
    if (window.location.hash) {
      const view = window.location.hash.replace('#', '');
      this.navigateTo(view);
    } else {
      this.navigateTo('dashboard');
    }
  }
  
  setupNavigation() {
    // Configurar links de navegação
    document.querySelectorAll('.nav-link, .sidebar-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        const target = link.dataset.target || link.hash || 'dashboard';
        const view = target.replace('#', '');
        
        this.navigateTo(view);
        
        // Atualizar URL
        window.location.hash = view;
      });
    });
    
    // Lidar com mudanças no hash da URL
    window.addEventListener('hashchange', () => {
      const view = window.location.hash.replace('#', '');
      this.navigateTo(view);
    });
  }
  
  navigateTo(view) {
    this.currentView = view;
    
    // Esconder todas as views
    document.querySelectorAll('.app-view').forEach(view => {
      view.style.display = 'none';
    });
    
    // Mostrar view atual
    const currentViewEl = document.getElementById(`${view}-view`);
    if (currentViewEl) {
      currentViewEl.style.display = 'block';
    } else {
      // Fallback para dashboard
      document.getElementById('dashboard-view').style.display = 'block';
    }
    
    // Atualizar links ativos
    document.querySelectorAll('.nav-link, .sidebar-link').forEach(link => {
      const linkView = (link.dataset.target || link.hash || '#dashboard').replace('#', '');
      if (linkView === view) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
    
    // Executar ações específicas da view
    this.onViewChange(view);
    
    console.log(`📍 Navegou para: ${view}`);
  }
  onViewChange(view) {
    switch(view) {
        case 'dashboard':
            this.loadDashboard();
            break;
        case 'marketplace':
            this.loadMarketplace();
            break;
        case 'portfolio':
            this.loadPortfolio();
            // ADICIONE ESTA LINHA:
            if (window.ledgerManager) {
                window.ledgerManager.loadLedger();
            }
            break;
        case 'artist':
            this.loadArtistPanel();
            break;
        case 'withdraw':
            this.loadWithdrawPanel();
            break;
        case 'playlists':
            this.loadPlaylists();
            break;
        case 'extrato': // Se você tiver uma view específica para extrato
            this.loadExtrato();
            break;
    }
}

// Adicione esta função se tiver view específica para extrato
async loadExtrato() {
    if (!authManager.isLoggedIn()) {
        this.showLoginRequired();
        return;
    }
    
    if (window.ledgerManager) {
        await window.ledgerManager.loadLedger();
    }
}
  async loadDashboard() {
    // Atualizar dados do usuário
    if (authManager.isLoggedIn()) {
      await authManager.loadUserData();
    }
    
    // Carregar notícias ou atualizações
    this.loadDashboardUpdates();
  }
  
  async loadMarketplace() {
    // Inicializar marketplace se não estiver inicializado
    if (!window.marketplaceManager) {
      window.marketplaceManager = new MarketplaceManager();
    } else {
      // Recarregar músicas
      await window.marketplaceManager.loadMusicas();
    }
  }
  
  async loadPortfolio() {
    if (!authManager.isLoggedIn()) {
      this.showLoginRequired();
      return;
    }
    
    try {
      showLoading('Carregando carteira...');
      
      // Carregar carteira
      const carteiraResult = await callApi('get_carteira', {
        user_id: authManager.getUserId()
      });
      
      // Carregar extrato
      const extratoResult = await callApi('get_extrato', {
        user_id: authManager.getUserId()
      });
      
      this.renderPortfolio(carteiraResult, extratoResult);
      
    } catch (error) {
      console.error('❌ Erro ao carregar portfólio:', error);
      showNotification('Erro ao carregar carteira', 'error');
    } finally {
      hideLoading();
    }
  }
  
  renderPortfolio(carteiraResult, extratoResult) {
    // Renderizar carteira
    const carteiraContainer = document.getElementById('portfolio-assets') || 
                             document.querySelector('.portfolio-grid');
    
    if (carteiraContainer && carteiraResult.success && carteiraResult.data) {
      if (carteiraResult.data.length === 0) {
        carteiraContainer.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-wallet"></i>
            <h3>Carteira vazia</h3>
            <p>Você ainda não possui ações de músicas.</p>
            <a href="#marketplace" class="btn btn-primary">
              <i class="fas fa-shopping-cart"></i> Explorar Marketplace
            </a>
          </div>
        `;
      } else {
        // Calcular valor total da carteira
        let totalValue = 0;
        
        carteiraContainer.innerHTML = carteiraResult.data.map(item => {
          const total = parseFloat(item.valor_total || 0);
          totalValue += total;
          
          return `
            <div class="portfolio-item">
              <div class="portfolio-item-header">
                <h4>Música #${item.music_id}</h4>
                <span class="portfolio-value">R$ ${total.toFixed(2)}</span>
              </div>
              
              <div class="portfolio-item-details">
                <p><strong>Ações:</strong> ${item.quantidade}</p>
                <p><strong>Preço médio:</strong> R$ ${parseFloat(item.valor_pago_por_acao || 0).toFixed(2)}</p>
                <p><strong>Data da compra:</strong> ${new Date(item.data_compra).toLocaleDateString('pt-BR')}</p>
                <p><strong>Contrato:</strong> ${item.contrato_id || 'N/A'}</p>
              </div>
              
              <div class="portfolio-item-actions">
                <button class="btn btn-sm btn-outline view-contract-btn" 
                        data-contract-id="${item.contrato_id}">
                  <i class="fas fa-file-contract"></i> Ver Contrato
                </button>
                
                <button class="btn btn-sm btn-outline sell-btn" 
                        data-item-id="${item.id}"
                        data-music-id="${item.music_id}"
                        data-quantity="${item.quantidade}">
                  <i class="fas fa-dollar-sign"></i> Vender
                </button>
              </div>
            </div>
          `;
        }).join('');
        
        // Atualizar valor total da carteira
        document.querySelectorAll('.portfolio-total-value, .carteira-total').forEach(el => {
          el.textContent = `R$ ${totalValue.toFixed(2)}`;
        });
      }
    }
    
    // Renderizar extrato
    const extratoContainer = document.getElementById('transaction-history') || 
                            document.querySelector('.extrato-table tbody');
    
    if (extratoContainer && extratoResult.success && extratoResult.data) {
      if (extratoResult.data.length === 0) {
        if (extratoContainer.tagName === 'TBODY') {
          extratoContainer.innerHTML = `
            <tr>
              <td colspan="4" class="text-center">
                <i class="fas fa-history"></i> Nenhuma transação realizada
              </td>
            </tr>
          `;
        } else {
          extratoContainer.innerHTML = `
            <div class="empty-state">
              <i class="fas fa-history"></i>
              <h3>Nenhuma transação</h3>
              <p>Seu histórico de transações aparecerá aqui.</p>
            </div>
          `;
        }
      } else {
        const transactions = extratoResult.data.slice(0, 10); // Últimas 10 transações
        
        if (extratoContainer.tagName === 'TBODY') {
          extratoContainer.innerHTML = transactions.map(trans => `
            <tr>
              <td>${new Date(trans.data).toLocaleDateString('pt-BR')}</td>
              <td>${trans.descricao || trans.tipo}</td>
              <td class="${parseFloat(trans.valor || 0) >= 0 ? 'text-success' : 'text-danger'}">
                R$ ${Math.abs(parseFloat(trans.valor || 0)).toFixed(2)}
              </td>
              <td>
                ${trans.contrato_id ? 
                  `<button class="btn btn-sm btn-outline view-transaction-contract" 
                           data-contract-id="${trans.contrato_id}">
                    <i class="fas fa-eye"></i>
                   </button>` : 
                  '—'}
              </td>
            </tr>
          `).join('');
        } else {
          extratoContainer.innerHTML = transactions.map(trans => `
            <div class="transaction-item ${parseFloat(trans.valor || 0) >= 0 ? 'income' : 'expense'}">
              <div class="transaction-icon">
                <i class="fas fa-${parseFloat(trans.valor || 0) >= 0 ? 'arrow-down' : 'arrow-up'}"></i>
              </div>
              
              <div class="transaction-details">
                <h5>${trans.descricao || trans.tipo}</h5>
                <p class="transaction-date">${new Date(trans.data).toLocaleDateString('pt-BR')}</p>
              </div>
              
              <div class="transaction-amount">
                <span>R$ ${Math.abs(parseFloat(trans.valor || 0)).toFixed(2)}</span>
              </div>
            </div>
          `).join('');
        }
      }
    }
  }
  
  loadArtistPanel() {
    if (!authManager.isLoggedIn()) {
      this.showLoginRequired();
      return;
    }
    
    const user = authManager.getUser();
    if (user?.tipo !== 'artista') {
      this.showNotAnArtist();
      return;
    }
    
    // Inicializar painel do artista
    if (!window.artistManager) {
      window.artistManager = new ArtistManager();
    }
  }
  
  loadWithdrawPanel() {
    if (!authManager.isLoggedIn()) {
      this.showLoginRequired();
      return;
    }
    
    this.renderWithdrawPanel();
  }
  
  renderWithdrawPanel() {
    const container = document.getElementById('withdraw-view') || 
                     document.querySelector('.withdraw-container');
    
    if (!container) return;
    
    const user = authManager.getUser();
    const balance = parseFloat(user?.saldo || 0);
    
    container.innerHTML = `
      <div class="withdraw-card">
        <h3><i class="fas fa-money-bill-wave"></i> Solicitar Saque</h3>
        
        <div class="balance-display">
          <p>Saldo disponível para saque:</p>
          <h2 class="available-balance">R$ ${balance.toFixed(2)}</h2>
        </div>
        
        ${balance > 0 ? `
          <form id="withdraw-form">
            <div class="form-group">
              <label for="withdraw-amount">Valor do saque (R$)</label>
              <input type="number" 
                     id="withdraw-amount" 
                     class="form-control" 
                     min="10" 
                     max="${balance}" 
                     step="0.01"
                     value="${balance}"
                     required>
              <small class="form-text">Valor mínimo: R$ 10,00</small>
            </div>
            
            <div class="form-group">
              <label for="payment-method">Método de pagamento</label>
              <select id="payment-method" class="form-control" required>
                <option value="PIX">PIX</option>
                <option value="TED">TED/DOC</option>
                <option value="BOLETO">Boleto</option>
              </select>
            </div>
            
            <div class="form-group" id="bank-details-group" style="display: none;">
              <label for="bank-details">Dados bancários</label>
              <textarea id="bank-details" 
                        class="form-control" 
                        rows="3"
                        placeholder="Banco, Agência, Conta, CPF/CNPJ"></textarea>
            </div>
            
            <div class="withdraw-info">
              <p><i class="fas fa-info-circle"></i> O saque será processado em 5 a 9 dias úteis.</p>
              <p><i class="fas fa-info-circle"></i> Uma confirmação por email será enviada.</p>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block">
              <i class="fas fa-paper-plane"></i> Solicitar Saque
            </button>
          </form>
        ` : `
          <div class="empty-state">
            <i class="fas fa-wallet"></i>
            <h3>Saldo insuficiente</h3>
            <p>Você precisa de saldo para realizar um saque.</p>
            <button class="btn btn-primary" id="add-funds-btn">
              <i class="fas fa-plus-circle"></i> Adicionar Fundos
            </button>
          </div>
        `}
      </div>
    `;
    
    // Configurar formulário de saque
    if (balance > 0) {
      const form = document.getElementById('withdraw-form');
      const paymentMethod = document.getElementById('payment-method');
      const bankDetailsGroup = document.getElementById('bank-details-group');
      
      // Mostrar/ocultar dados bancários
      paymentMethod.addEventListener('change', () => {
        if (paymentMethod.value === 'TED') {
          bankDetailsGroup.style.display = 'block';
        } else {
          bankDetailsGroup.style.display = 'none';
        }
      });
      
      // Submeter formulário
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('withdraw-amount').value);
        const method = document.getElementById('payment-method').value;
        const bankDetails = document.getElementById('bank-details')?.value || '';
        
        if (amount > balance) {
          showNotification('Valor maior que o saldo disponível', 'error');
          return;
        }
        
        if (amount < 10) {
          showNotification('Valor mínimo: R$ 10,00', 'error');
          return;
        }
        
        try {
          showLoading('Processando solicitação...');
          
          const result = await callApi('request_withdrawal', {
            user_id: authManager.getUserId(),
            amount: amount,
            payment_method: method,
            bank_details: bankDetails
          }, 'POST');
          
          if (result.success) {
            showNotification('Solicitação enviada! Verifique seu email para confirmar.', 'success');
            
            // Recarregar dados do usuário
            await authManager.loadUserData();
            
            // Recarregar painel de saque
            this.renderWithdrawPanel();
          } else {
            throw new Error(result.message || 'Erro ao solicitar saque');
          }
        } catch (error) {
          console.error('❌ Erro ao solicitar saque:', error);
          showNotification(error.message, 'error');
        } finally {
          hideLoading();
        }
      });
    } else {
      // Botão para adicionar fundos
      document.getElementById('add-funds-btn')?.addEventListener('click', () => {
        this.showAddFundsModal();
      });
    }
  }
  
  showAddFundsModal() {
    const modalHTML = `
      <div class="modal-overlay" id="add-funds-modal">
        <div class="modal">
          <div class="modal-header">
            <h3><i class="fas fa-plus-circle"></i> Adicionar Fundos</h3>
            <button class="modal-close">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="payment-options">
              <div class="payment-option active" data-method="mercadopago">
                <i class="fas fa-credit-card"></i>
                <h5>Mercado Pago</h5>
                <p>Pagamento rápido com PIX ou cartão</p>
              </div>
              
              <div class="payment-option" data-method="transfer">
                <i class="fas fa-university"></i>
                <h5>Transferência Bancária</h5>
                <p>TED/DOC - Até 2 dias úteis</p>
              </div>
            </div>
            
            <div class="form-group">
              <label for="funds-amount">Valor (R$)</label>
              <input type="number" 
                     id="funds-amount" 
                     class="form-control" 
                     min="10" 
                     value="50"
                     step="0.01">
              <small class="form-text">Valor mínimo: R$ 10,00</small>
            </div>
            
            <div class="payment-info" id="mercadopago-info">
              <p><i class="fas fa-bolt"></i> Pagamento instantâneo com PIX</p>
              <p><i class="fas fa-shield-alt"></i> Ambiente seguro do Mercado Pago</p>
            </div>
            
            <div class="payment-info" id="transfer-info" style="display: none;">
              <p><strong>Dados para transferência:</strong></p>
              <p>Banco: 999 - Banco SELO MIV</p>
              <p>Agência: 0001</p>
              <p>Conta: 123456-7</p>
              <p>CNPJ: 12.345.678/0001-99</p>
              <p><strong>Envie o comprovante para: ${ADMIN_EMAIL}</strong></p>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancel-payment">Cancelar</button>
            <button class="btn btn-primary" id="proceed-payment">
              <i class="fas fa-external-link-alt"></i> Prosseguir para Pagamento
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('add-funds-modal');
    
    // Selecionar método de pagamento
    let selectedMethod = 'mercadopago';
    
    document.querySelectorAll('.payment-option').forEach(option => {
      option.addEventListener('click', () => {
        document.querySelectorAll('.payment-option').forEach(o => {
          o.classList.remove('active');
        });
        option.classList.add('active');
        
        selectedMethod = option.dataset.method;
        
        // Mostrar informações do método selecionado
        document.getElementById('mercadopago-info').style.display = 
          selectedMethod === 'mercadopago' ? 'block' : 'none';
        document.getElementById('transfer-info').style.display = 
          selectedMethod === 'transfer' ? 'block' : 'none';
      });
    });
    
    // Processar pagamento
    document.getElementById('proceed-payment').addEventListener('click', async () => {
      const amount = parseFloat(document.getElementById('funds-amount').value);
      
      if (amount < 10) {
        showNotification('Valor mínimo: R$ 10,00', 'warning');
        return;
      }
      
      if (selectedMethod === 'mercadopago') {
        try {
          showLoading('Gerando link de pagamento...');
          
          const result = await callApi('generate_payment_link', {
            user_id: authManager.getUserId(),
            amount: amount
          }, 'POST');
          
          if (result.success) {
            // Abrir link do Mercado Pago
            window.open(result.data.payment_link, '_blank');
            showNotification('Redirecionando para pagamento...', 'info');
            modal.remove();
          } else {
            throw new Error(result.message || 'Erro ao gerar link de pagamento');
          }
        } catch (error) {
          console.error('❌ Erro ao gerar link de pagamento:', error);
          showNotification(error.message, 'error');
        } finally {
          hideLoading();
        }
      } else {
        // Para transferência bancária, apenas mostrar informações
        showNotification('Realize a transferência e envie o comprovante', 'info');
        modal.remove();
      }
    });
    
    // Fechar modal
    document.querySelector('.modal-close').addEventListener('click', () => {
      modal.remove();
    });
    
    document.getElementById('cancel-payment').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  loadPlaylists() {
    if (!authManager.isLoggedIn()) {
      this.showLoginRequired();
      return;
    }
    
    this.renderPlaylists();
  }
  
  async renderPlaylists() {
    try {
      const result = await callApi('get_user_playlists', {
        user_id: authManager.getUserId()
      });
      
      const container = document.getElementById('playlists-container') || 
                       document.querySelector('.playlists-grid');
      
      if (container) {
        if (result.success && result.data && result.data.length > 0) {
          container.innerHTML = result.data.map(playlist => `
            <div class="playlist-card">
              <div class="playlist-cover">
                <i class="fas fa-music"></i>
              </div>
              
              <div class="playlist-info">
                <h4>${playlist.playlist_name}</h4>
                <p class="playlist-count">
                  ${playlist.music_ids ? playlist.music_ids.split(',').length : 0} músicas
                </p>
                <p class="playlist-date">
                  Criada em ${new Date(playlist.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              
              <div class="playlist-actions">
                <button class="btn btn-sm btn-outline play-playlist-btn"
                        data-playlist-id="${playlist.id}">
                  <i class="fas fa-play"></i>
                </button>
                
                <button class="btn btn-sm btn-outline edit-playlist-btn"
                        data-playlist-id="${playlist.id}">
                  <i class="fas fa-edit"></i>
                </button>
              </div>
            </div>
          `).join('');
        } else {
          container.innerHTML = `
            <div class="empty-state">
              <i class="fas fa-list-music"></i>
              <h3>Nenhuma playlist</h3>
              <p>Crie sua primeira playlist para organizar suas músicas favoritas.</p>
              <button class="btn btn-primary" id="create-first-playlist">
                <i class="fas fa-plus"></i> Criar Playlist
              </button>
            </div>
          `;
          
          document.getElementById('create-first-playlist')?.addEventListener('click', () => {
            this.showCreatePlaylistModal();
          });
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar playlists:', error);
    }
  }
  
  showCreatePlaylistModal() {
    const modalHTML = `
      <div class="modal-overlay" id="create-playlist-modal">
        <div class="modal">
          <div class="modal-header">
            <h3><i class="fas fa-plus"></i> Criar Nova Playlist</h3>
            <button class="modal-close">&times;</button>
          </div>
          
          <div class="modal-body">
            <form id="create-playlist-form">
              <div class="form-group">
                <label for="playlist-name">Nome da Playlist *</label>
                <input type="text" 
                       id="playlist-name" 
                       class="form-control" 
                       required
                       placeholder="Ex: Minhas Favoritas">
              </div>
              
              <div class="form-group">
                <div class="form-check">
                  <input type="checkbox" 
                         id="playlist-public" 
                         class="form-check-input">
                  <label class="form-check-label" for="playlist-public">
                    Playlist pública (outros usuários podem ver)
                  </label>
                </div>
              </div>
              
              <div class="form-group">
                <label for="playlist-description">Descrição (Opcional)</label>
                <textarea id="playlist-description" 
                          class="form-control" 
                          rows="2"
                          placeholder="Descreva sua playlist..."></textarea>
              </div>
            </form>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancel-playlist">Cancelar</button>
            <button class="btn btn-primary" id="create-playlist">
              <i class="fas fa-save"></i> Criar Playlist
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('create-playlist-modal');
    
    // Criar playlist
    document.getElementById('create-playlist').addEventListener('click', async () => {
      const name = document.getElementById('playlist-name').value;
      
      if (!name) {
        showNotification('Digite um nome para a playlist', 'warning');
        return;
      }
      
      try {
        showLoading('Criando playlist...');
        
        const result = await callApi('create_playlist', {
          user_id: authManager.getUserId(),
          playlist_name: name,
          is_public: document.getElementById('playlist-public').checked
        }, 'POST');
        
        if (result.success) {
          showNotification('Playlist criada com sucesso!', 'success');
          modal.remove();
          
          // Recarregar playlists
          this.renderPlaylists();
        } else {
          throw new Error(result.message || 'Erro ao criar playlist');
        }
      } catch (error) {
        console.error('❌ Erro ao criar playlist:', error);
        showNotification(error.message, 'error');
      } finally {
        hideLoading();
      }
    });
    
    // Fechar modal
    document.querySelector('.modal-close').addEventListener('click', () => {
      modal.remove();
    });
    
    document.getElementById('cancel-playlist').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  loadDashboardUpdates() {
    // Carregar atualizações, notícias ou estatísticas
    const updatesContainer = document.getElementById('dashboard-updates');
    if (updatesContainer) {
      // Você pode adicionar atualizações dinâmicas aqui
      updatesContainer.innerHTML = `
        <div class="update-card">
          <div class="update-icon">
            <i class="fas fa-bullhorn"></i>
          </div>
          <div class="update-content">
            <h5>Bem-vindo ao SELO MIV!</h5>
            <p>Plataforma de investimento em música.</p>
            <small class="update-time">Hoje</small>
          </div>
        </div>
      `;
    }
  }
  
  showLoginRequired() {
    const currentView = document.getElementById(`${this.currentView}-view`);
    if (currentView) {
      currentView.innerHTML = `
        <div class="login-required">
          <i class="fas fa-sign-in-alt"></i>
          <h3>Login necessário</h3>
          <p>Faça login para acessar esta funcionalidade.</p>
          <button class="btn btn-primary" id="go-to-login">
            <i class="fas fa-sign-in-alt"></i> Fazer Login
          </button>
        </div>
      `;
      
      document.getElementById('go-to-login').addEventListener('click', () => {
        // Implementar redirecionamento para login
        showNotification('Implemente o modal de login aqui', 'info');
      });
    }
  }
  
  showNotAnArtist() {
    const artistView = document.getElementById('artist-view');
    if (artistView) {
      artistView.innerHTML = `
        <div class="not-artist">
          <i class="fas fa-user-tie"></i>
          <h3>Acesso restrito</h3>
          <p>Esta área é exclusiva para artistas cadastrados.</p>
          <p>Se você é um artista, entre em contato com a administração.</p>
          <a href="#marketplace" class="btn btn-primary">
            <i class="fas fa-shopping-cart"></i> Explorar Marketplace
          </a>
        </div>
      `;
    }
  }
  
  setupEventListeners() {
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        authManager.logout();
      });
    }
    
    // Atualizar saldo
    const refreshBalanceBtn = document.getElementById('refresh-balance');
    if (refreshBalanceBtn) {
      refreshBalanceBtn.addEventListener('click', () => {
        authManager.loadUserData();
      });
    }
    
    // Botão de ajuda
    const helpBtn = document.getElementById('help-btn');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        showNotification('Central de ajuda em desenvolvimento', 'info');
      });
    }
    
    // Configurações
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        showNotification('Configurações em desenvolvimento', 'info');
      });
    }
  }
}

// Funções auxiliares globais
function showNotification(message, type = 'info') {
  // Remover notificações existentes
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : 
                        type === 'error' ? 'exclamation-circle' : 
                        type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
      <span>${message}</span>
    </div>
    <button class="notification-close">&times;</button>
  `;
  
  document.body.appendChild(notification);
  
  // Mostrar
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Fechar
  notification.querySelector('.notification-close').addEventListener('click', () => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  });
  
  // Auto-remover após 5 segundos
  setTimeout(() => {
    if (notification.parentNode) {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }
  }, 5000);
}

function showLoading(message = 'Carregando...') {
  // Remover loadings existentes
  const existing = document.getElementById('global-loading');
  if (existing) existing.remove();
  
  const loading = document.createElement('div');
  loading.id = 'global-loading';
  loading.className = 'loading-overlay';
  loading.innerHTML = `
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <p class="loading-message">${message}</p>
    </div>
  `;
  
  document.body.appendChild(loading);
  
  // Mostrar
  setTimeout(() => {
    loading.classList.add('show');
  }, 10);
}

function hideLoading() {
  const loading = document.getElementById('global-loading');
  if (loading) {
    loading.classList.remove('show');
    setTimeout(() => {
      if (loading.parentNode) {
        loading.remove();
      }
    }, 300);
  }
}

// Inicializar app quando o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
  // Verificar se API está configurada
  if (!window.API_CONFIG || !window.API_CONFIG.BASE_URL) {
    console.error('❌ API não configurada. Verifique config.js');
    showNotification('Erro de configuração. Contate o administrador.', 'error');
    return;
  }
  
  // Inicializar aplicação
  window.mivApp = new MIVApp();
  
  // Verificar autenticação
  if (authManager.isLoggedIn()) {
    console.log('✅ Usuário logado:', authManager.getUser()?.email);
  } else {
    console.log('🔒 Usuário não logado');
  }
});
