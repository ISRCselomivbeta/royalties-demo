/**
 * artist.js
 * Painel do Artista - SELO MIV
 * Funcionalidades específicas para artistas da plataforma
 */

// ============== MÓDULO PAINEL DO ARTISTA ==============
const artistModule = {
    // Inicializar módulo do artista
    init: function() {
        this.bindEvents();
        this.checkArtistAccess();
    },
    
    // Verificar se usuário tem acesso ao painel do artista
    checkArtistAccess: function() {
        const user = dataManager.getCurrentUser();
        if (!user || (user.tipo !== 'artista' && user.tipo !== 'admin')) {
            this.hideArtistSection();
            return false;
        }
        return true;
    },
    
    // Ocultar seção do artista se não tiver permissão
    hideArtistSection: function() {
        const artistSection = document.querySelector('[data-section="artist"]');
        if (artistSection) {
            artistSection.style.display = 'none';
        }
        
        // Remover botão do artista da navegação
        const artistNavBtn = document.querySelector('[data-target="artist"]');
        if (artistNavBtn) {
            artistNavBtn.style.display = 'none';
        }
    },
    
    // Vincular eventos
    bindEvents: function() {
        // Evento para abrir modal de cadastro
        document.addEventListener('click', (e) => {
            if (e.target.closest('#openAddMusicModal')) {
                this.openAddMusicModal();
            }
            
            if (e.target.closest('#registerMusicBtn')) {
                this.registerMusic();
            }
            
            // Editar música
            if (e.target.closest('[data-action="edit-music"]')) {
                const musicId = e.target.closest('[data-music-id]').dataset.musicId;
                this.editMusic(musicId);
            }
            
            // Excluir música
            if (e.target.closest('[data-action="delete-music"]')) {
                const musicId = e.target.closest('[data-music-id]').dataset.musicId;
                this.confirmDeleteMusic(musicId);
            }
        });
        
        // Formatar valores em tempo real
        const priceInput = document.getElementById('musicPrice');
        if (priceInput) {
            priceInput.addEventListener('input', (e) => {
                this.formatCurrencyInput(e.target);
            });
        }
    },
    
    // ========== CARREGAMENTO DE DADOS ==========
    
    // Carregar dados do artista
    async loadArtistData(forceRefresh = false) {
        if (!this.checkArtistAccess()) return;
        
        try {
            app.showLoading('Carregando dados do artista...');
            
            const user = dataManager.getCurrentUser();
            const result = await dataManager.getArtistData(user.id || user.email);
            
            if (result.success) {
                this.renderArtistDashboard(result.data || {});
            } else {
                throw new Error(result.message || 'Erro ao carregar dados');
            }
        } catch (error) {
            console.error('Erro ao carregar dados do artista:', error);
            this.showErrorMessage('Erro ao carregar dados do perfil');
        } finally {
            app.hideLoading();
        }
    },
    
    // Renderizar dashboard do artista
    renderArtistDashboard: function(artistData) {
        // Atualizar estatísticas principais
        this.updateStatistics(artistData);
        
        // Renderizar músicas
        this.renderArtistMusic(artistData.musicas || []);
        
        // Renderizar gráficos (se disponíveis)
        if (artistData.estatisticas) {
            this.renderCharts(artistData.estatisticas);
        }
        
        // Atualizar informações do perfil
        this.updateProfileInfo(artistData);
    },
    
    // Atualizar estatísticas
    updateStatistics: function(data) {
        const elements = {
            'artistMusicCount': data.total_musicas || 0,
            'artistRoyalties': this.formatCurrency(data.total_royalties || 0),
            'artistSharesSold': data.total_acoes_vendidas || 0,
            'artistTotalInvestors': data.total_investidores || 0
        };
        
        // Calcular receita mensal estimada (5% dos royalties totais)
        const monthlyEarnings = (data.total_royalties || 0) * 0.05;
        elements['artistMonthlyEarnings'] = this.formatCurrency(monthlyEarnings);
        
        // Atualizar elementos no DOM
        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });
    },
    
    // Renderizar músicas do artista
    renderArtistMusic: function(musics) {
        const container = document.getElementById('artistMusicContent');
        if (!container) return;
        
        const user = dataManager.getCurrentUser();
        
        // Filtrar músicas do artista atual
        const artistMusics = musics.filter(music => 
            music.artista_id === user.id || music.artista === user.nome
        );
        
        // Estado vazio
        if (!artistMusics || artistMusics.length === 0) {
            container.innerHTML = `
                <div class="empty-state text-center py-5">
                    <div class="empty-icon mb-3">
                        <i class="bi bi-music-note-beamed" style="font-size: 3rem; color: var(--neon-green);"></i>
                    </div>
                    <h5 class="text-light mb-2">Nenhuma música cadastrada</h5>
                    <p class="text-muted mb-4">Cadastre sua primeira música para começar a vender ações</p>
                    <button class="btn-miv" onclick="artistModule.openAddMusicModal()">
                        <i class="bi bi-plus-circle me-2"></i> Cadastrar Primeira Música
                    </button>
                </div>
            `;
            return;
        }
        
        // Renderizar grid de músicas
        container.innerHTML = artistMusics.map(music => {
            const percentSold = music.percentual_vendido || 0;
            const earnings = music.arrecadacao_total || 0;
            const availableShares = this.calculateAvailableSharesForMusic(music);
            const totalShares = music.total_acoes || 100;
            
            // Determinar cor do progresso
            let progressClass = 'success';
            if (percentSold >= 80) progressClass = 'danger';
            else if (percentSold >= 50) progressClass = 'warning';
            
            return `
                <div class="col-md-6 col-lg-4 mb-4" data-music-id="${music.id}">
                    <div class="music-card artist-music-card">
                        <div class="music-card-header">
                            <img src="${music.link_capa || 'https://via.placeholder.com/300x300/111418/00ff88?text=MIV'}" 
                                 class="music-cover" 
                                 alt="${music.titulo}"
                                 onerror="this.src='https://via.placeholder.com/300x300/111418/00ff88?text=MIV'">
                            <div class="music-badges">
                                <span class="badge bg-${progressClass}">${percentSold.toFixed(1)}% vendido</span>
                                ${music.status === 'pendente' ? '<span class="badge bg-warning">Pendente</span>' : ''}
                            </div>
                        </div>
                        <div class="music-info p-3">
                            <h6 class="music-title mb-1">${music.titulo}</h6>
                            <p class="music-artist mb-2">
                                <i class="bi bi-person me-1"></i>${user.nome}
                            </p>
                            
                            <div class="progress mb-3" style="height: 6px;">
                                <div class="progress-bar bg-${progressClass}" 
                                     role="progressbar" 
                                     style="width: ${percentSold}%">
                                </div>
                            </div>
                            
                            <div class="row g-2 mb-3">
                                <div class="col-6">
                                    <small class="text-muted d-block">Valor por ação</small>
                                    <strong class="text-neon">${this.formatCurrency(music.valor_acao)}</strong>
                                </div>
                                <div class="col-6">
                                    <small class="text-muted d-block">Disponível</small>
                                    <strong>${availableShares}/${totalShares}</strong>
                                </div>
                            </div>
                            
                            <div class="music-actions d-flex gap-2">
                                <button class="btn btn-outline-neon btn-sm flex-fill" 
                                        data-action="edit-music">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                                <button class="btn btn-outline-danger btn-sm" 
                                        data-action="delete-music">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                            
                            <div class="mt-3 text-center">
                                <small class="text-muted">
                                    <i class="bi bi-cash-coin me-1"></i>
                                    Arrecadado: ${this.formatCurrency(earnings)}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    // ========== OPERAÇÕES COM MÚSICAS ==========
    
    // Abrir modal para cadastrar música
    openAddMusicModal: function() {
        if (!this.checkArtistAccess()) {
            app.showToast('Apenas artistas podem cadastrar músicas', 'error');
            return;
        }
        
        // Limpar formulário
        document.getElementById('musicTitle').value = '';
        document.getElementById('musicGenre').value = 'pop';
        document.getElementById('musicYoutube').value = '';
        document.getElementById('musicCover').value = '';
        document.getElementById('musicDescription').value = '';
        document.getElementById('musicPrice').value = '10.00';
        document.getElementById('musicTotalShares').value = '100';
        document.getElementById('musicPercent').value = '20';
        document.getElementById('musicTerms').checked = false;
        
        // Abrir modal
        app.openModal('addMusicModal');
    },
    
    // Cadastrar nova música
    async registerMusic() {
        if (!this.checkArtistAccess()) {
            app.showToast('Apenas artistas podem cadastrar músicas', 'error');
            return;
        }
        
        // Obter valores do formulário
        const formData = this.getMusicFormData();
        
        // Validações
        const validation = this.validateMusicForm(formData);
        if (!validation.valid) {
            app.showToast(validation.message, 'error');
            return;
        }
        
        const registerBtn = document.getElementById('registerMusicBtn');
        const originalText = registerBtn.innerHTML;
        
        registerBtn.disabled = true;
        registerBtn.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i> Cadastrando...';
        
        try {
            const user = dataManager.getCurrentUser();
            const musicData = {
                ...formData,
                artista_id: user.id,
                artista: user.nome,
                status: 'pendente',
                data_cadastro: new Date().toISOString()
            };
            
            const result = await dataManager.uploadMusic(musicData);
            
            if (result.success) {
                app.showToast('Música cadastrada com sucesso! Aguarde aprovação.', 'success');
                
                // Recarregar dados
                await this.loadArtistData(true);
                
                // Fechar modal
                app.closeModal('addMusicModal');
            } else {
                throw new Error(result.message || 'Erro ao cadastrar música');
            }
        } catch (error) {
            console.error('Erro ao cadastrar música:', error);
            app.showToast(error.message || 'Erro de conexão ao cadastrar música', 'error');
        } finally {
            registerBtn.disabled = false;
            registerBtn.innerHTML = originalText;
        }
    },
    
    // Obter dados do formulário de música
    getMusicFormData: function() {
        return {
            titulo: document.getElementById('musicTitle').value.trim(),
            genero: document.getElementById('musicGenre').value,
            link_youtube: document.getElementById('musicYoutube').value.trim(),
            link_capa: document.getElementById('musicCover').value.trim() || 
                      'https://via.placeholder.com/300x300/111418/00ff88?text=MIV',
            descricao: document.getElementById('musicDescription').value.trim(),
            valor_acao: parseFloat(document.getElementById('musicPrice').value) || 0,
            total_acoes: parseInt(document.getElementById('musicTotalShares').value) || 100,
            percentual_disponivel: parseFloat(document.getElementById('musicPercent').value) || 0
        };
    },
    
    // Validar formulário de música
    validateMusicForm: function(formData) {
        if (!formData.titulo || !formData.genero || !formData.link_youtube) {
            return { valid: false, message: 'Preencha todos os campos obrigatórios' };
        }
        
        if (!document.getElementById('musicTerms').checked) {
            return { valid: false, message: 'Aceite os termos para continuar' };
        }
        
        if (formData.valor_acao <= 0) {
            return { valid: false, message: 'O valor por ação deve ser maior que zero' };
        }
        
        if (formData.percentual_disponivel <= 0 || formData.percentual_disponivel > 100) {
            return { valid: false, message: 'O percentual deve estar entre 1% e 100%' };
        }
        
        const youtubeId = this.extractYouTubeId(formData.link_youtube);
        if (!youtubeId) {
            return { valid: false, message: 'Link do YouTube inválido' };
        }
        
        return { valid: true, message: 'Formulário válido' };
    },
    
    // Editar música
    editMusic: function(musicId) {
        app.showToast('Funcionalidade de edição em desenvolvimento', 'info');
        // TODO: Implementar edição completa
    },
    
    // Confirmar exclusão de música
    confirmDeleteMusic: function(musicId) {
        app.showConfirmDialog({
            title: 'Excluir Música',
            message: 'Tem certeza que deseja excluir esta música? Esta ação não pode ser desfeita.',
            confirmText: 'Excluir',
            cancelText: 'Cancelar',
            onConfirm: () => this.deleteMusic(musicId),
            type: 'danger'
        });
    },
    
    // Excluir música
    async deleteMusic(musicId) {
        try {
            app.showLoading('Excluindo música...');
            
            const result = await dataManager.deleteMusic(musicId);
            
            if (result.success) {
                app.showToast('Música excluída com sucesso', 'success');
                await this.loadArtistData(true);
            } else {
                throw new Error(result.message || 'Erro ao excluir música');
            }
        } catch (error) {
            console.error('Erro ao excluir música:', error);
            app.showToast(error.message || 'Erro ao excluir música', 'error');
        } finally {
            app.hideLoading();
        }
    },
    
    // ========== FUNÇÕES AUXILIARES ==========
    
    // Extrair ID do YouTube
    extractYouTubeId: function(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    },
    
    // Calcular ações disponíveis para uma música
    calculateAvailableSharesForMusic: function(music) {
        const percentAvailable = music.percentual_disponivel || 0;
        const sharesSold = music.acoes_vendidas || 0;
        const totalShares = music.total_acoes || 100;
        const availablePercent = (percentAvailable / 100) * totalShares;
        return Math.max(0, availablePercent - sharesSold);
    },
    
    // Formatar moeda
    formatCurrency: function(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    },
    
    // Formatar input de moeda
    formatCurrencyInput: function(input) {
        let value = input.value.replace(/\D/g, '');
        value = (parseInt(value) / 100).toFixed(2);
        input.value = value;
    },
    
    // Renderizar gráficos
    renderCharts: function(stats) {
        // TODO: Implementar gráficos com Chart.js
        console.log('Renderizar gráficos com dados:', stats);
    },
    
    // Atualizar informações do perfil
    updateProfileInfo: function(artistData) {
        const profileName = document.getElementById('artistProfileName');
        const profileGenre = document.getElementById('artistProfileGenre');
        
        if (profileName) {
            profileName.textContent = artistData.nome || dataManager.getCurrentUser().nome;
        }
        
        if (profileGenre && artistData.genero_principal) {
            profileGenre.textContent = artistData.genero_principal;
        }
    },
    
    // Mostrar mensagem de erro
    showErrorMessage: function(message) {
        const container = document.getElementById('artistMusicContent');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    ${message}
                </div>
            `;
        }
    }
};

// Inicializar módulo quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    artistModule.init();
});

// Exportar para escopo global
window.artistModule = artistModule;
