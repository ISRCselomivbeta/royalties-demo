// Substitua TODO o conteúdo por:
class ArtistManager {
  constructor() {
    this.artistData = null;
    this.init();
  }
  
  init() {
    if (!authManager.isLoggedIn()) return;
    
    const user = authManager.getUser();
    if (user?.tipo === 'artista') {
      this.loadArtistData();
      this.setupEventListeners();
    }
  }
  
  async loadArtistData() {
    try {
      const result = await callApi('get_artist_data', {
        user_id: authManager.getUserId()
      });
      
      if (result.success && result.data) {
        this.artistData = result.data;
        this.renderArtistDashboard();
        console.log('✅ Dados do artista carregados:', this.artistData);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados do artista:', error);
    }
  }
  
  renderArtistDashboard() {
    if (!this.artistData) return;
    
    // Atualizar estatísticas
    const stats = {
      totalMusicas: document.getElementById('total-musicas') || 
                   document.querySelector('.stats-total-musicas'),
      totalRoyalties: document.getElementById('total-royalties') || 
                     document.querySelector('.stats-total-royalties'),
      acoesVendidas: document.getElementById('acoes-vendidas') || 
                    document.querySelector('.stats-acoes-vendidas'),
      receitaMensal: document.getElementById('receita-mensal') || 
                    document.querySelector('.stats-receita-mensal')
    };
    
    if (stats.totalMusicas) {
      stats.totalMusicas.textContent = this.artistData.total_musicas || '0';
    }
    
    if (stats.totalRoyalties) {
      const royalties = parseFloat(this.artistData.total_royalties || 0);
      stats.totalRoyalties.textContent = `R$ ${royalties.toFixed(2)}`;
    }
    
    if (stats.acoesVendidas) {
      stats.acoesVendidas.textContent = this.artistData.total_acoes_vendidas || '0';
    }
    
    if (stats.receitaMensal) {
      const receita = parseFloat(this.artistData.royalties_mensais || 0);
      stats.receitaMensal.textContent = `R$ ${receita.toFixed(2)}`;
    }
    
    // Renderizar lista de músicas
    this.renderArtistMusics();
  }
  
  renderArtistMusics() {
    const container = document.getElementById('artist-musics-list') || 
                     document.querySelector('.artist-musics-grid');
    
    if (!container || !this.artistData?.musicas) return;
    
    if (this.artistData.musicas.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-music"></i>
          <h3>Nenhuma música cadastrada</h3>
          <p>Cadastre sua primeira música para começar a vender ações.</p>
          <button class="btn btn-primary" id="upload-first-music-btn">
            <i class="fas fa-upload"></i> Cadastrar Primeira Música
          </button>
        </div>
      `;
      
      document.getElementById('upload-first-music-btn')?.addEventListener('click', () => {
        this.showUploadModal();
      });
      
      return;
    }
    
    container.innerHTML = this.artistData.musicas.map(music => `
      <div class="artist-music-card" data-music-id="${music.id}">
        <div class="music-header">
          <img src="${music.link_capa || 'https://via.placeholder.com/100x100?text=Música'}" 
               alt="${music.titulo}"
               class="music-thumbnail"
               onerror="this.src='https://via.placeholder.com/100x100?text=Música'">
          
          <div class="music-info">
            <h4 class="music-title">${music.titulo}</h4>
            <p class="music-genre">${music.genero || 'Gênero não informado'}</p>
            
            <div class="music-stats-small">
              <span class="stat">
                <i class="fas fa-money-bill-wave"></i>
                R$ ${parseFloat(music.valor_acao || 0).toFixed(2)}
              </span>
              <span class="stat">
                <i class="fas fa-chart-pie"></i>
                ${parseFloat(music.percentual_vendido || 0).toFixed(1)}% vendido
              </span>
              <span class="stat">
                <i class="fas fa-users"></i>
                ${music.total_investidores || 0} investidores
              </span>
            </div>
          </div>
        </div>
        
        <div class="music-actions">
          <button class="btn btn-sm btn-outline view-details-btn" 
                  data-music-id="${music.id}">
            <i class="fas fa-chart-bar"></i> Detalhes
          </button>
          
          <button class="btn btn-sm btn-primary edit-music-btn" 
                  data-music-id="${music.id}">
            <i class="fas fa-edit"></i> Editar
          </button>
          
          ${music.link_youtube || music.link_spotify ? `
            <button class="btn btn-sm btn-success listen-btn"
                    data-youtube="${music.link_youtube || ''}"
                    data-spotify="${music.link_spotify || ''}">
              <i class="fas fa-play"></i> Ouvir
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');
    
    // Adicionar event listeners
    this.setupMusicCardListeners();
  }
  
  setupMusicCardListeners() {
    // Botões de detalhes
    document.querySelectorAll('.view-details-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const musicId = btn.dataset.musicId;
        this.showMusicDetails(musicId);
      });
    });
    
    // Botões de editar
    document.querySelectorAll('.edit-music-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const musicId = btn.dataset.musicId;
        this.showEditModal(musicId);
      });
    });
    
    // Botões de ouvir
    document.querySelectorAll('.listen-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const youtubeUrl = btn.dataset.youtube;
        const spotifyUrl = btn.dataset.spotify;
        
        if (youtubeUrl) {
          window.open(youtubeUrl, '_blank');
        } else if (spotifyUrl) {
          window.open(spotifyUrl, '_blank');
        }
      });
    });
  }
  
  showUploadModal() {
    const modalHTML = `
      <div class="modal-overlay" id="upload-music-modal">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h3><i class="fas fa-upload"></i> Cadastrar Nova Música</h3>
            <button class="modal-close">&times;</button>
          </div>
          
          <div class="modal-body">
            <form id="upload-music-form">
              <div class="form-row">
                <div class="form-group col-md-6">
                  <label for="music-title">Título da Música *</label>
                  <input type="text" 
                         id="music-title" 
                         class="form-control" 
                         required
                         placeholder="Ex: Minha Melhor Música">
                </div>
                
                <div class="form-group col-md-6">
                  <label for="music-genre">Gênero Musical *</label>
                  <select id="music-genre" class="form-control" required>
                    <option value="">Selecione um gênero</option>
                    <option value="ROCK">Rock</option>
                    <option value="POP">Pop</option>
                    <option value="HIPHOP">Hip Hop</option>
                    <option value="MPB">MPB</option>
                    <option value="SERTANEJO">Sertanejo</option>
                    <option value="ELETRONICA">Eletrônica</option>
                    <option value="FUNK">Funk</option>
                    <option value="SAMBA">Samba</option>
                    <option value="PAGODE">Pagode</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group col-md-6">
                  <label for="youtube-link">Link do YouTube</label>
                  <input type="url" 
                         id="youtube-link" 
                         class="form-control" 
                         placeholder="https://youtube.com/watch?v=...">
                  <small class="form-text">O link do YouTube ou Spotify é obrigatório</small>
                </div>
                
                <div class="form-group col-md-6">
                  <label for="spotify-link">Link do Spotify</label>
                  <input type="url" 
                         id="spotify-link" 
                         class="form-control" 
                         placeholder="https://open.spotify.com/track/...">
                </div>
              </div>
              
              <div class="form-group">
                <label for="cover-link">Link da Capa (Opcional)</label>
                <input type="url" 
                       id="cover-link" 
                       class="form-control" 
                       placeholder="https://exemplo.com/capa.jpg">
                <small class="form-text">URL de uma imagem para capa da música</small>
              </div>
              
              <div class="form-row">
                <div class="form-group col-md-6">
                  <label for="share-price">Valor por Ação (R$) *</label>
                  <input type="number" 
                         id="share-price" 
                         class="form-control" 
                         min="1" 
                         step="0.01" 
                         required
                         value="10.00"
                         placeholder="Ex: 15.50">
                  <small class="form-text">Valor que cada ação será vendida</small>
                </div>
                
                <div class="form-group col-md-6">
                  <label for="share-percentage">Percentual para Venda (%) *</label>
                  <input type="number" 
                         id="share-percentage" 
                         class="form-control" 
                         min="1" 
                         max="49" 
                         required
                         value="20"
                         placeholder="Ex: 25">
                  <small class="form-text">Percentual da música disponível para investidores (máx 49%)</small>
                </div>
              </div>
              
              <div class="form-group">
                <div class="form-check">
                  <input type="checkbox" 
                         id="terms-agreement" 
                         class="form-check-input" 
                         required>
                  <label class="form-check-label" for="terms-agreement">
                    Concordo com os <a href="#" target="_blank">Termos de Serviço</a> e confirmo que sou o detentor dos direitos desta obra.
                  </label>
                </div>
              </div>
            </form>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancel-upload">Cancelar</button>
            <button class="btn btn-primary" id="submit-upload">
              <i class="fas fa-upload"></i> Cadastrar Música
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('upload-music-modal');
    
    // Configurar validação
    const form = document.getElementById('upload-music-form');
    const submitBtn = document.getElementById('submit-upload');
    
    const validateForm = () => {
      const youtube = document.getElementById('youtube-link').value;
      const spotify = document.getElementById('spotify-link').value;
      const isValid = form.checkValidity() && (youtube || spotify);
      submitBtn.disabled = !isValid;
    };
    
    form.addEventListener('input', validateForm);
    validateForm();
    
    // Submeter formulário
    submitBtn.addEventListener('click', async () => {
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      
      const youtube = document.getElementById('youtube-link').value;
      const spotify = document.getElementById('spotify-link').value;
      
      if (!youtube && !spotify) {
        showNotification('Informe pelo menos um link (YouTube ou Spotify)', 'warning');
        return;
      }
      
      const musicData = {
        user_id: authManager.getUserId(),
        titulo: document.getElementById('music-title').value,
        artista: authManager.getUser()?.nome || '',
        genero: document.getElementById('music-genre').value,
        link_youtube: youtube,
        link_spotify: spotify,
        link_capa: document.getElementById('cover-link').value || '',
        valor_acao: parseFloat(document.getElementById('share-price').value),
        percentual_disponivel: parseFloat(document.getElementById('share-percentage').value)
      };
      
      try {
        showLoading('Cadastrando música...');
        
        const result = await callApi('uploadmusic', musicData, 'POST');
        
        if (result.success) {
          showNotification('Música cadastrada com sucesso!', 'success');
          
          // Fechar modal
          modal.remove();
          
          // Recarregar dados
          await this.loadArtistData();
          
          // Recarregar marketplace
          if (window.marketplaceManager) {
            await window.marketplaceManager.loadMusicas();
          }
        } else {
          throw new Error(result.message || 'Erro ao cadastrar música');
        }
      } catch (error) {
        console.error('❌ Erro ao cadastrar música:', error);
        showNotification(error.message, 'error');
      } finally {
        hideLoading();
      }
    });
    
    // Fechar modal
    document.querySelector('.modal-close').addEventListener('click', () => {
      modal.remove();
    });
    
    document.getElementById('cancel-upload').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  showMusicDetails(musicId) {
    const music = this.artistData?.musicas?.find(m => m.id == musicId);
    if (!music) return;
    
    // Implementar modal de detalhes
    showNotification(`Detalhes da música: ${music.titulo}`, 'info');
    // Você pode expandir isso para mostrar um modal completo com gráficos
  }
  
  showEditModal(musicId) {
    const music = this.artistData?.musicas?.find(m => m.id == musicId);
    if (!music) return;
    
    showNotification(`Editar música: ${music.titulo}`, 'info');
    // Implementar funcionalidade de edição
  }
  
  setupEventListeners() {
    // Botão de upload no painel do artista
    const uploadBtn = document.getElementById('upload-music-btn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        this.showUploadModal();
      });
    }
    
    // Botão de atualizar dados
    const refreshBtn = document.getElementById('refresh-artist-data');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadArtistData();
      });
    }
  }
}

// Inicializar quando o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
  // Aguardar autenticação carregar
  setTimeout(() => {
    const user = authManager.getUser();
    if (user?.tipo === 'artista') {
      window.artistManager = new ArtistManager();
    }
  }, 1000);
});
