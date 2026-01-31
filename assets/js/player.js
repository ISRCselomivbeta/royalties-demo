// Substitua TODO o conteúdo por:
class MusicPlayer {
  constructor() {
    this.currentTrack = null;
    this.isPlaying = false;
    this.isRepeating = false;
    this.isShuffling = false;
    this.volume = 1;
    this.currentTime = 0;
    this.duration = 0;
    
    this.init();
  }
  
  init() {
    this.setupElements();
    this.setupEventListeners();
    this.setupYouTubeAPI();
  }
  
  setupElements() {
    this.elements = {
      audio: document.getElementById('music-player'),
      playBtn: document.getElementById('play-btn'),
      pauseBtn: document.getElementById('pause-btn'),
      prevBtn: document.getElementById('prev-btn'),
      nextBtn: document.getElementById('next-btn'),
      repeatBtn: document.getElementById('repeat-btn'),
      shuffleBtn: document.getElementById('shuffle-btn'),
      volumeSlider: document.getElementById('volume-slider'),
      progressBar: document.getElementById('progress-bar'),
      currentTimeEl: document.getElementById('current-time'),
      durationEl: document.getElementById('duration'),
      trackTitle: document.getElementById('track-title'),
      trackArtist: document.getElementById('track-artist'),
      trackCover: document.getElementById('track-cover'),
      youtubePlayer: null
    };
  }
  
  setupYouTubeAPI() {
    // Carregar API do YouTube
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    
    window.onYouTubeIframeAPIReady = () => {
      this.elements.youtubePlayer = new YT.Player('youtube-player', {
        height: '0',
        width: '0',
        events: {
          'onReady': this.onYouTubePlayerReady.bind(this),
          'onStateChange': this.onYouTubePlayerStateChange.bind(this)
        }
      });
    };
  }
  
  onYouTubePlayerReady(event) {
    console.log('✅ YouTube Player pronto');
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
      if (this.isRepeating) {
        this.playCurrentTrack();
      } else {
        this.playNextTrack();
      }
    }
    
    if (event.data === YT.PlayerState.PLAYING) {
      this.isPlaying = true;
      this.updatePlayPauseButtons();
    }
    
    if (event.data === YT.PlayerState.PAUSED) {
      this.isPlaying = false;
      this.updatePlayPauseButtons();
    }
  }
  
  setupEventListeners() {
    // Botão play/pause
    this.elements.playBtn?.addEventListener('click', () => {
      this.play();
    });
    
    this.elements.pauseBtn?.addEventListener('click', () => {
      this.pause();
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
    this.elements.progressBar?.addEventListener('click', (e) => {
      const rect = e.target.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      this.seekTo(percent * this.duration);
    });
    
    // Atualizar tempo atual
    setInterval(() => {
      this.updateCurrentTime();
    }, 1000);
  }
  
  loadTrack(track) {
    this.currentTrack = track;
    
    // Atualizar interface
    if (this.elements.trackTitle) {
      this.elements.trackTitle.textContent = track.titulo || 'Título desconhecido';
    }
    
    if (this.elements.trackArtist) {
      this.elements.trackArtist.textContent = track.artista || 'Artista desconhecido';
    }
    
    if (this.elements.trackCover) {
      this.elements.trackCover.src = track.link_capa || 'https://via.placeholder.com/300x300?text=Música';
      this.elements.trackCover.onerror = () => {
        this.elements.trackCover.src = 'https://via.placeholder.com/300x300?text=Música';
      };
    }
    
    // Carregar no YouTube Player
    this.loadYouTubeTrack(track.link_youtube);
  }
  
  loadYouTubeTrack(youtubeUrl) {
    if (!youtubeUrl || !this.elements.youtubePlayer) return;
    
    try {
      // Extrair ID do vídeo do YouTube
      const videoId = this.extractYouTubeId(youtubeUrl);
      
      if (videoId) {
        this.elements.youtubePlayer.loadVideoById(videoId);
        console.log('🎵 Carregando vídeo do YouTube:', videoId);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar vídeo do YouTube:', error);
    }
  }
  
  extractYouTubeId(url) {
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
    if (this.elements.youtubePlayer) {
      this.elements.youtubePlayer.playVideo();
      this.isPlaying = true;
      this.updatePlayPauseButtons();
    }
  }
  
  pause() {
    if (this.elements.youtubePlayer) {
      this.elements.youtubePlayer.pauseVideo();
      this.isPlaying = false;
      this.updatePlayPauseButtons();
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
    // Implementar lógica para próxima música
    console.log('⏭️ Próxima música');
    // Você pode integrar com uma playlist aqui
  }
  
  playPrevTrack() {
    // Implementar lógica para música anterior
    console.log('⏮️ Música anterior');
  }
  
  toggleRepeat() {
    this.isRepeating = !this.isRepeating;
    
    if (this.elements.repeatBtn) {
      if (this.isRepeating) {
        this.elements.repeatBtn.classList.add('active');
        this.elements.repeatBtn.innerHTML = '<i class="fas fa-redo"></i> <span>Ativado</span>';
      } else {
        this.elements.repeatBtn.classList.remove('active');
        this.elements.repeatBtn.innerHTML = '<i class="fas fa-redo"></i> <span>Repetir</span>';
      }
    }
    
    showNotification(`Repetir ${this.isRepeating ? 'ativado' : 'desativado'}`, 'info');
  }
  
  toggleShuffle() {
    this.isShuffling = !this.isShuffling;
    
    if (this.elements.shuffleBtn) {
      if (this.isShuffling) {
        this.elements.shuffleBtn.classList.add('active');
        this.elements.shuffleBtn.innerHTML = '<i class="fas fa-random"></i> <span>Ativado</span>';
      } else {
        this.elements.shuffleBtn.classList.remove('active');
        this.elements.shuffleBtn.innerHTML = '<i class="fas fa-random"></i> <span>Embaralhar</span>';
      }
    }
    
    showNotification(`Embaralhar ${this.isShuffling ? 'ativado' : 'desativado'}`, 'info');
  }
  
  setVolume(volume) {
    this.volume = volume;
    
    if (this.elements.youtubePlayer) {
      this.elements.youtubePlayer.setVolume(volume * 100);
    }
    
    if (this.elements.volumeSlider) {
      this.elements.volumeSlider.value = volume * 100;
    }
  }
  
  seekTo(time) {
    if (this.elements.youtubePlayer) {
      this.elements.youtubePlayer.seekTo(time, true);
    }
  }
  
  updateCurrentTime() {
    if (this.elements.youtubePlayer && this.elements.youtubePlayer.getCurrentTime) {
      try {
        this.currentTime = this.elements.youtubePlayer.getCurrentTime();
        this.duration = this.elements.youtubePlayer.getDuration();
        
        // Atualizar elementos de tempo
        if (this.elements.currentTimeEl) {
          this.elements.currentTimeEl.textContent = this.formatTime(this.currentTime);
        }
        
        if (this.elements.durationEl) {
          this.elements.durationEl.textContent = this.formatTime(this.duration);
        }
        
        // Atualizar barra de progresso
        if (this.elements.progressBar && this.duration > 0) {
          const progress = (this.currentTime / this.duration) * 100;
          this.elements.progressBar.style.width = `${progress}%`;
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
  
  updatePlayPauseButtons() {
    if (this.elements.playBtn && this.elements.pauseBtn) {
      if (this.isPlaying) {
        this.elements.playBtn.style.display = 'none';
        this.elements.pauseBtn.style.display = 'inline-flex';
      } else {
        this.elements.playBtn.style.display = 'inline-flex';
        this.elements.pauseBtn.style.display = 'none';
      }
    }
  }
  
  // Método para tocar música do marketplace
  playMusicFromMarketplace(music) {
    this.loadTrack(music);
    this.play();
    
    // Mostrar notificação
    showNotification(`Tocando: ${music.titulo}`, 'info');
  }
}

// Inicializar player
document.addEventListener('DOMContentLoaded', function() {
  window.musicPlayer = new MusicPlayer();
  
  // Expor método global para tocar música
  window.playMusic = function(music) {
    if (window.musicPlayer) {
      window.musicPlayer.playMusicFromMarketplace(music);
    }
  };
});
