// Player de Música Corrigido - Spotify Style
class MusicPlayer {
  constructor() {
    this.currentTrack = null;
    this.isPlaying = false;
    this.isRepeating = false;
    this.isShuffling = false;
    this.volume = 0.8; // 80% volume padrão
    this.currentTime = 0;
    this.duration = 0;
    this.youtubePlayer = null;
    
    this.init();
  }
  
  init() {
    this.createPlayerElements();
    this.setupEventListeners();
    this.setupYouTubeAPI();
    this.showPlayer(); // Sempre mostrar o player
  }
  
  createPlayerElements() {
    // Criar container do player se não existir
    if (!document.getElementById('spotify-player')) {
      const playerHTML = `
        <div id="spotify-player" class="spotify-player">
          <div class="player-container">
            <!-- Info da Música -->
            <div class="player-track-info">
              <img src="https://via.placeholder.com/56x56/111418/00ff88?text=MIV" 
                   alt="Album Art" 
                   class="track-cover"
                   id="spotify-track-cover">
              <div class="track-details">
                <div class="track-title" id="spotify-track-title">SELO MIV Player</div>
                <div class="track-artist" id="spotify-track-artist">Clique em uma música para tocar</div>
              </div>
              <button class="btn-favorite" id="spotify-favorite-btn" title="Favoritar">
                <i class="far fa-heart"></i>
              </button>
            </div>
            
            <!-- Controles Centrais -->
            <div class="player-controls">
              <div class="control-buttons">
                <button class="control-btn" id="spotify-shuffle-btn" title="Embaralhar">
                  <i class="fas fa-random"></i>
                </button>
                <button class="control-btn" id="spotify-prev-btn" title="Anterior">
                  <i class="fas fa-step-backward"></i>
                </button>
                <button class="control-btn play-btn" id="spotify-play-btn" title="Play/Pause">
                  <i class="fas fa-play" id="spotify-play-icon"></i>
                </button>
                <button class="control-btn" id="spotify-next-btn" title="Próxima">
                  <i class="fas fa-step-forward"></i>
                </button>
                <button class="control-btn" id="spotify-repeat-btn" title="Repetir">
                  <i class="fas fa-redo"></i>
                </button>
              </div>
              
              <div class="progress-container">
                <span class="time-current" id="spotify-current-time">0:00</span>
                <div class="progress-bar" id="spotify-progress-bar">
                  <div class="progress-fill" id="spotify-progress-fill"></div>
                </div>
                <span class="time-total" id="spotify-total-time">0:00</span>
              </div>
            </div>
            
            <!-- Controles Laterais -->
            <div class="player-extra">
              <button class="extra-btn" id="spotify-lyrics-btn" title="Letra">
                <i class="fas fa-microphone"></i>
              </button>
              <button class="extra-btn" id="spotify-queue-btn" title="Fila">
                <i class="fas fa-list"></i>
              </button>
              <button class="extra-btn" id="spotify-invest-btn" title="Investir">
                <i class="fas fa-chart-line"></i>
              </button>
              
              <div class="volume-control">
                <i class="fas fa-volume-down volume-icon"></i>
                <input type="range" 
                       class="volume-slider" 
                       id="spotify-volume-slider" 
                       min="0" 
                       max="100" 
                       value="80"
                       title="Volume">
                <i class="fas fa-volume-up volume-icon"></i>
              </div>
              
              <button class="extra-btn" id="spotify-expand-btn" title="Expandir">
                <i class="fas fa-expand"></i>
              </button>
            </div>
          </div>
          
          <!-- YouTube Player Escondido -->
          <div id="youtube-player-container" style="display: none;">
            <div id="youtube-player"></div>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', playerHTML);
    }
    
    // Configurar elementos
    this.elements = {
      player: document.getElementById('spotify-player'),
      playBtn: document.getElementById('spotify-play-btn'),
      playIcon: document.getElementById('spotify-play-icon'),
      prevBtn: document.getElementById('spotify-prev-btn'),
      nextBtn: document.getElementById('spotify-next-btn'),
      repeatBtn: document.getElementById('spotify-repeat-btn'),
      shuffleBtn: document.getElementById('spotify-shuffle-btn'),
      volumeSlider: document.getElementById('spotify-volume-slider'),
      progressBar: document.getElementById('spotify-progress-bar'),
      progressFill: document.getElementById('spotify-progress-fill'),
      progressContainer: document.getElementById('spotify-progress-bar'),
      currentTimeEl: document.getElementById('spotify-current-time'),
      durationEl: document.getElementById('spotify-total-time'),
      trackTitle: document.getElementById('spotify-track-title'),
      trackArtist: document.getElementById('spotify-track-artist'),
      trackCover: document.getElementById('spotify-track-cover'),
      favoriteBtn: document.getElementById('spotify-favorite-btn'),
      investBtn: document.getElementById('spotify-invest-btn'),
      expandBtn: document.getElementById('spotify-expand-btn'),
      youtubePlayer: null
    };
    
    // Adicionar CSS inline para garantir visibilidade
    this.addPlayerStyles();
  }
  
  addPlayerStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .spotify-player {
        position: fixed !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        height: 90px !important;
        background: #181818 !important;
        border-top: 1px solid #282828 !important;
        z-index: 9999 !important;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.5) !important;
        padding: 0 16px !important;
      }
      
      .player-container {
        display: grid !important;
        grid-template-columns: 1fr 2fr 1fr !important;
        align-items: center !important;
        height: 100% !important;
        max-width: 1800px !important;
        margin: 0 auto !important;
        gap: 20px !important;
      }
      
      .player-track-info {
        display: flex !important;
        align-items: center !important;
        gap: 14px !important;
        min-width: 180px !important;
      }
      
      .track-cover {
        width: 56px !important;
        height: 56px !important;
        border-radius: 4px !important;
        object-fit: cover !important;
      }
      
      .track-details {
        flex: 1 !important;
        overflow: hidden !important;
      }
      
      .track-title {
        font-size: 14px !important;
        font-weight: 600 !important;
        color: white !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        margin-bottom: 4px !important;
      }
      
      .track-artist {
        font-size: 12px !important;
        color: #b3b3b3 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }
      
      .btn-favorite {
        background: none !important;
        border: none !important;
        color: #b3b3b3 !important;
        font-size: 16px !important;
        cursor: pointer !important;
        padding: 8px !important;
        transition: color 0.2s ease !important;
      }
      
      .btn-favorite:hover {
        color: #00ff88 !important;
      }
      
      .btn-favorite.active {
        color: #00ff88 !important;
      }
      
      .player-controls {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 12px !important;
      }
      
      .control-buttons {
        display: flex !important;
        align-items: center !important;
        gap: 20px !important;
      }
      
      .control-btn {
        background: none !important;
        border: none !important;
        color: #b3b3b3 !important;
        font-size: 18px !important;
        cursor: pointer !important;
        padding: 8px !important;
        transition: color 0.2s ease !important;
      }
      
      .control-btn:hover {
        color: white !important;
      }
      
      .control-btn.active {
        color: #00ff88 !important;
      }
      
      .control-btn.play-btn {
        background: white !important;
        color: black !important;
        width: 40px !important;
        height: 40px !important;
        border-radius: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 16px !important;
        transition: transform 0.2s ease !important;
      }
      
      .control-btn.play-btn:hover {
        transform: scale(1.05) !important;
      }
      
      .progress-container {
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        width: 100% !important;
        max-width: 600px !important;
      }
      
      .progress-bar {
        flex: 1 !important;
        height: 4px !important;
        background: #535353 !important;
        border-radius: 2px !important;
        cursor: pointer !important;
        position: relative !important;
        overflow: hidden !important;
      }
      
      .progress-fill {
        height: 100% !important;
        background: #00ff88 !important;
        border-radius: 2px !important;
        width: 0% !important;
        transition: width 0.1s linear !important;
      }
      
      .time-current, .time-total {
        font-size: 11px !important;
        color: #b3b3b3 !important;
        min-width: 40px !important;
      }
      
      .time-current {
        text-align: right !important;
      }
      
      .time-total {
        text-align: left !important;
      }
      
      .player-extra {
        display: flex !important;
        align-items: center !important;
        justify-content: flex-end !important;
        gap: 16px !important;
      }
      
      .extra-btn {
        background: none !important;
        border: none !important;
        color: #b3b3b3 !important;
        font-size: 16px !important;
        cursor: pointer !important;
        padding: 8px !important;
        transition: color 0.2s ease !important;
      }
      
      .extra-btn:hover {
        color: white !important;
      }
      
      .volume-control {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
      }
      
      .volume-slider {
        width: 100px !important;
        height: 4px !important;
        -webkit-appearance: none !important;
        background: #535353 !important;
        border-radius: 2px !important;
        outline: none !important;
      }
      
      .volume-slider::-webkit-slider-thumb {
        -webkit-appearance: none !important;
        width: 12px !important;
        height: 12px !important;
        border-radius: 50% !important;
        background: white !important;
        cursor: pointer !important;
      }
      
      .volume-slider::-moz-range-thumb {
        width: 12px !important;
        height: 12px !important;
        border-radius: 50% !important;
        background: white !important;
        cursor: pointer !important;
        border: none !important;
      }
      
      .volume-icon {
        color: #b3b3b3 !important;
        font-size: 14px !important;
      }
      
      /* Responsividade */
      @media (max-width: 1024px) {
        .player-container {
          grid-template-columns: 1fr 1fr !important;
          gap: 15px !important;
        }
        
        .player-extra {
          display: none !important;
        }
      }
      
      @media (max-width: 768px) {
        .spotify-player {
          height: 80px !important;
          padding: 0 12px !important;
        }
        
        .player-container {
          grid-template-columns: 1fr !important;
          gap: 10px !important;
        }
        
        .player-track-info {
          display: none !important;
        }
        
        .control-buttons {
          gap: 15px !important;
        }
        
        .progress-container {
          max-width: 100% !important;
        }
        
        .time-current, .time-total {
          font-size: 10px !important;
          min-width: 35px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  setupYouTubeAPI() {
    if (window.YT && window.YT.Player) {
      this.createYouTubePlayer();
      return;
    }
    
    // Carregar API do YouTube se não estiver carregada
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
    
    window.onYouTubeIframeAPIReady = () => {
      this.createYouTubePlayer();
    };
  }
  
  createYouTubePlayer() {
    if (this.youtubePlayer) return;
    
    this.youtubePlayer = new YT.Player('youtube-player', {
      height: '0',
      width: '0',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        showinfo: 0
      },
      events: {
        'onReady': this.onYouTubePlayerReady.bind(this),
        'onStateChange': this.onYouTubePlayerStateChange.bind(this),
        'onError': this.onYouTubePlayerError.bind(this)
      }
    });
  }
  
  onYouTubePlayerReady(event) {
    console.log('✅ YouTube Player pronto');
    // Configurar volume inicial
    this.youtubePlayer.setVolume(this.volume * 100);
  }
  
  onYouTubePlayerStateChange(event) {
    const states = {
      '-1': 'unstarted',
      '0': 'ended',
      '1': 'playing',
      '2': 'paused',
      '3': 'buffering',
      '5': 'video cued'
    };
    
    console.log('🎬 Estado do YouTube:', states[event.data]);
    
    if (event.data === YT.PlayerState.ENDED) {
      if (this.isRepeating && this.currentTrack) {
        this.playCurrentTrack();
      } else {
        this.playNextTrack();
      }
    }
    
    if (event.data === YT.PlayerState.PLAYING) {
      this.isPlaying = true;
      this.updatePlayButton();
      this.startProgressUpdate();
    }
    
    if (event.data === YT.PlayerState.PAUSED) {
      this.isPlaying = false;
      this.updatePlayButton();
      this.stopProgressUpdate();
    }
  }
  
  onYouTubePlayerError(event) {
    console.error('❌ Erro no YouTube Player:', event.data);
    showNotification('Erro ao reproduzir vídeo', 'error');
  }
  
  setupEventListeners() {
    // Botão play/pause
    this.elements.playBtn?.addEventListener('click', () => {
      this.togglePlayPause();
    });
    
    // Botões de navegação
    this.elements.prevBtn?.addEventListener('click', () => {
      this.playPrevTrack();
    });
    
    this.elements.nextBtn?.addEventListener('click', () => {
      this.playNextTrack();
    });
    
    // Botão repeat
    this.elements.repeatBtn?.addEventListener('click', () => {
      this.toggleRepeat();
    });
    
    // Botão shuffle
    this.elements.shuffleBtn?.addEventListener('click', () => {
      this.toggleShuffle();
    });
    
    // Controle de volume
    this.elements.volumeSlider?.addEventListener('input', (e) => {
      this.setVolume(e.target.value / 100);
    });
    
    // Barra de progresso
    this.elements.progressContainer?.addEventListener('click', (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      this.seekTo(percent * this.duration);
    });
    
    // Botão de favoritar
    this.elements.favoriteBtn?.addEventListener('click', () => {
      this.toggleFavorite();
    });
    
    // Botão de investir
    this.elements.investBtn?.addEventListener('click', () => {
      this.openInvestmentModal();
    });
    
    // Botão de expandir
    this.elements.expandBtn?.addEventListener('click', () => {
      this.toggleFullscreen();
    });
    
    // Atualizar tempo atual
    this.progressInterval = null;
  }
  
  startProgressUpdate() {
    this.stopProgressUpdate();
    this.progressInterval = setInterval(() => {
      this.updateCurrentTime();
    }, 1000);
  }
  
  stopProgressUpdate() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }
  
  loadTrack(track) {
    this.currentTrack = track;
    
    // Atualizar interface
    this.elements.trackTitle.textContent = track.titulo || 'Título desconhecido';
    this.elements.trackArtist.textContent = track.artista || 'Artista desconhecido';
    
    this.elements.trackCover.src = track.link_capa || 'https://via.placeholder.com/300x300?text=Música';
    this.elements.trackCover.onerror = () => {
      this.elements.trackCover.src = 'https://via.placeholder.com/300x300?text=Música';
    };
    
    // Atualizar botão de investir
    this.elements.investBtn.onclick = () => {
      this.openInvestmentModalForTrack(track);
    };
    
    // Carregar no YouTube Player
    this.loadYouTubeTrack(track.link_youtube);
    
    // Mostrar notificação
    showNotification(`🎵 Tocando: ${track.titulo}`, 'info');
  }
  
  loadYouTubeTrack(youtubeUrl) {
    if (!youtubeUrl || !this.youtubePlayer) {
      showNotification('Link do YouTube não disponível', 'warning');
      return;
    }
    
    try {
      const videoId = this.extractYouTubeId(youtubeUrl);
      if (videoId) {
        this.youtubePlayer.loadVideoById(videoId);
        this.isPlaying = false;
        this.updatePlayButton();
        console.log('🎵 Carregando vídeo do YouTube:', videoId);
      } else {
        showNotification('Link do YouTube inválido', 'error');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar vídeo do YouTube:', error);
      showNotification('Erro ao carregar vídeo', 'error');
    }
  }
  
  extractYouTubeId(url) {
    if (!url) return null;
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }
  
  play() {
    if (this.youtubePlayer) {
      this.youtubePlayer.playVideo();
      this.isPlaying = true;
      this.updatePlayButton();
    }
  }
  
  pause() {
    if (this.youtubePlayer) {
      this.youtubePlayer.pauseVideo();
      this.isPlaying = false;
      this.updatePlayButton();
    }
  }
  
  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }
  
  playCurrentTrack() {
    if (this.currentTrack?.link_youtube) {
      this.loadYouTubeTrack(this.currentTrack.link_youtube);
      this.play();
    }
  }
  
  playNextTrack() {
    // Implementar lógica para próxima música da playlist
    console.log('⏭️ Próxima música');
    showNotification('Funcionalidade de playlist em desenvolvimento', 'info');
  }
  
  playPrevTrack() {
    // Implementar lógica para música anterior
    console.log('⏮️ Música anterior');
    showNotification('Funcionalidade de playlist em desenvolvimento', 'info');
  }
  
  toggleRepeat() {
    this.isRepeating = !this.isRepeating;
    
    if (this.elements.repeatBtn) {
      if (this.isRepeating) {
        this.elements.repeatBtn.classList.add('active');
        this.elements.repeatBtn.title = 'Repetir (Ativado)';
      } else {
        this.elements.repeatBtn.classList.remove('active');
        this.elements.repeatBtn.title = 'Repetir';
      }
    }
    
    showNotification(`Repetir ${this.isRepeating ? 'ativado' : 'desativado'}`, 'info');
  }
  
  toggleShuffle() {
    this.isShuffling = !this.isShuffling;
    
    if (this.elements.shuffleBtn) {
      if (this.isShuffling) {
        this.elements.shuffleBtn.classList.add('active');
        this.elements.shuffleBtn.title = 'Embaralhar (Ativado)';
      } else {
        this.elements.shuffleBtn.classList.remove('active');
        this.elements.shuffleBtn.title = 'Embaralhar';
      }
    }
    
    showNotification(`Embaralhar ${this.isShuffling ? 'ativado' : 'desativado'}`, 'info');
  }
  
  toggleFavorite() {
    const isFavorite = this.elements.favoriteBtn.classList.contains('active');
    
    if (isFavorite) {
      this.elements.favoriteBtn.classList.remove('active');
      this.elements.favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
      this.elements.favoriteBtn.title = 'Favoritar';
      showNotification('Removido dos favoritos', 'info');
    } else {
      this.elements.favoriteBtn.classList.add('active');
      this.elements.favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
      this.elements.favoriteBtn.title = 'Favorito (Remover)';
      showNotification('Adicionado aos favoritos', 'success');
    }
  }
  
  setVolume(volume) {
    this.volume = volume;
    
    if (this.youtubePlayer) {
      this.youtubePlayer.setVolume(volume * 100);
    }
    
    if (this.elements.volumeSlider) {
      this.elements.volumeSlider.value = volume * 100;
    }
  }
  
  seekTo(time) {
    if (this.youtubePlayer) {
      this.youtubePlayer.seekTo(time, true);
      this.updateCurrentTime();
    }
  }
  
  updateCurrentTime() {
    if (this.youtubePlayer && this.youtubePlayer.getCurrentTime) {
      try {
        this.currentTime = this.youtubePlayer.getCurrentTime();
        this.duration = this.youtubePlayer.getDuration();
        
        // Atualizar elementos de tempo
        if (this.elements.currentTimeEl) {
          this.elements.currentTimeEl.textContent = this.formatTime(this.currentTime);
        }
        
        if (this.elements.durationEl) {
          this.elements.durationEl.textContent = this.formatTime(this.duration);
        }
        
        // Atualizar barra de progresso
        if (this.elements.progressFill && this.duration > 0) {
          const progress = (this.currentTime / this.duration) * 100;
          this.elements.progressFill.style.width = `${progress}%`;
        }
      } catch (error) {
        // Ignorar erros se o player não estiver pronto
      }
    }
  }
  
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  updatePlayButton() {
    if (this.elements.playBtn && this.elements.playIcon) {
      if (this.isPlaying) {
        this.elements.playIcon.className = 'fas fa-pause';
        this.elements.playBtn.title = 'Pausar';
      } else {
        this.elements.playIcon.className = 'fas fa-play';
        this.elements.playBtn.title = 'Play';
      }
    }
  }
  
  showPlayer() {
    if (this.elements.player) {
      this.elements.player.style.display = 'block';
    }
  }
  
  hidePlayer() {
    if (this.elements.player) {
      this.elements.player.style.display = 'none';
    }
  }
  
  openInvestmentModal() {
    if (!this.currentTrack) {
      showNotification('Selecione uma música primeiro', 'warning');
      return;
    }
    
    this.openInvestmentModalForTrack(this.currentTrack);
  }
  
  openInvestmentModalForTrack(track) {
    // Usar o marketplace manager para abrir modal de investimento
    if (window.marketplaceManager) {
      window.marketplaceManager.showBuyModal(
        track.id,
        track.titulo,
        track.artista,
        parseFloat(track.valor_acao || 0),
        parseInt(track.acoes_disponiveis || 0)
      );
    } else {
      showNotification('Marketplace não carregado', 'error');
    }
  }
  
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      if (this.elements.player.requestFullscreen) {
        this.elements.player.requestFullscreen();
      } else if (this.elements.player.webkitRequestFullscreen) {
        this.elements.player.webkitRequestFullscreen();
      } else if (this.elements.player.msRequestFullscreen) {
        this.elements.player.msRequestFullscreen();
      }
      this.elements.expandBtn.innerHTML = '<i class="fas fa-compress"></i>';
      this.elements.expandBtn.title = 'Sair da tela cheia';
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      this.elements.expandBtn.innerHTML = '<i class="fas fa-expand"></i>';
      this.elements.expandBtn.title = 'Tela cheia';
    }
  }
  
  // Método para tocar música do marketplace
  playMusicFromMarketplace(music) {
    this.loadTrack(music);
    this.play();
  }
}

// Inicializar player quando o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
  // Aguardar um pouco para garantir que tudo carregou
  setTimeout(() => {
    window.musicPlayer = new MusicPlayer();
    
    // Expor método global para tocar música
    window.playMusic = function(music) {
      if (window.musicPlayer) {
        window.musicPlayer.playMusicFromMarketplace(music);
      }
    };
    
    console.log('✅ Spotify Player inicializado');
  }, 1000);
});

// Lidar com mudança de tela cheia
document.addEventListener('fullscreenchange', function() {
  const player = window.musicPlayer;
  if (player && player.elements) {
    if (!document.fullscreenElement) {
      player.elements.expandBtn.innerHTML = '<i class="fas fa-expand"></i>';
      player.elements.expandBtn.title = 'Tela cheia';
    }
  }
});
