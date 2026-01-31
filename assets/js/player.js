/**
 * player.js
 * Sistema de player de música/vídeo integrado com YouTube
 */

class MusicPlayer {
    constructor() {
        this.youtubePlayer = null;
        this.youtubeAPILoaded = false;
        this.currentVolume = 80;
        this.isPlaying = false;
        this.isShuffle = false;
        this.isRepeat = false;
        this.currentTime = 0;
        this.duration = 0;
        this.progressInterval = null;
        this.inactivityTimer = null;
        this.INACTIVITY_TIMEOUT = 5000; // 5 segundos

        this.initializePlayer();
    }

    initializePlayer() {
        // Carrega API do YouTube
        this.loadYouTubeAPI();
        
        // Configura eventos
        this.setupEventListeners();
        
        // Inicia monitor de inatividade
        this.startInactivityMonitor();
    }

    // ========== YOUTUBE API ==========

    loadYouTubeAPI() {
        if (window.YT && window.YT.Player) {
            this.youtubeAPILoaded = true;
            return;
        }

        // Cria função global que será chamada pela API
        window.onYouTubeIframeAPIReady = () => {
            this.youtubeAPILoaded = true;
            console.log('YouTube API carregada');
            
            // Se há uma música para tocar, inicializa
            if (window.state?.currentTrackIndex >= 0) {
                const track = window.state.playlist[window.state.currentTrackIndex];
                if (track) {
                    const videoId = this.extractYouTubeId(track.link_youtube || track.LINK_YOUTUBE);
                    if (videoId) {
                        this.initializeYouTubePlayer(videoId);
                    }
                }
            }
        };

        // Carrega script da API
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        tag.async = true;
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    extractYouTubeId(url) {
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

    initializeYouTubePlayer(videoId) {
        console.log('Inicializando player para vídeo:', videoId);

        if (!videoId) {
            console.error('ID do vídeo inválido');
            return;
        }

        const playerElement = document.getElementById('youtubePlayer');
        if (!playerElement) {
            console.error('Elemento do player não encontrado');
            return;
        }

        // Destrói player anterior
        if (this.youtubePlayer && this.youtubePlayer.destroy) {
            try {
                this.youtubePlayer.destroy();
            } catch (e) {
                console.error('Erro ao destruir player anterior:', e);
            }
            this.youtubePlayer = null;
        }

        // Limpa container
        playerElement.innerHTML = '';

        if (!this.youtubeAPILoaded) {
            console.log('API não carregada, usando iframe direto');
            playerElement.innerHTML = `
                <iframe width="100%" height="100%" 
                        src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1&showinfo=0&rel=0" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                </iframe>
            `;
            return;
        }

        try {
            this.youtubePlayer = new YT.Player('youtubePlayer', {
                width: '100%',
                height: '100%',
                videoId: videoId,
                playerVars: {
                    'autoplay': 1,
                    'controls': 1,
                    'modestbranding': 1,
                    'rel': 0,
                    'showinfo': 0,
                    'fs': 1,
                    'playsinline': 1
                },
                events: {
                    'onReady': (event) => this.onPlayerReady(event),
                    'onStateChange': (event) => this.onPlayerStateChange(event),
                    'onError': (event) => this.onPlayerError(event)
                }
            });
        } catch (error) {
            console.error('Erro ao criar player:', error);
            playerElement.innerHTML = `
                <iframe width="100%" height="100%" 
                        src="https://www.youtube.com/embed/${videoId}" 
                        frameborder="0" 
                        allowfullscreen>
                </iframe>
            `;
        }
    }

    onPlayerReady(event) {
        console.log('Player YouTube pronto');
        event.target.setVolume(this.currentVolume);
        this.updateProgressBar();
        
        window.state.isPlaying = true;
        document.getElementById('playButton').innerHTML = '<i class="bi bi-pause-circle-fill"></i>';
        
        // Atualiza botão de favorito
        if (window.state.currentTrackIndex >= 0) {
            const track = window.state.playlist[window.state.currentTrackIndex];
            const isFavorite = window.state.favoriteMusicIds.includes(track.id.toString());
            this.updateFavoriteButton(!isFavorite);
        }
        
        this.showToast('Reproduzindo: ' + document.getElementById('playerTitle').textContent, 'info');
        this.resetInactivityTimer();
    }

    onPlayerStateChange(event) {
        console.log('Estado alterado:', event.data);
        
        switch(event.data) {
            case YT.PlayerState.PLAYING:
                window.state.isPlaying = true;
                document.getElementById('playButton').innerHTML = '<i class="bi bi-pause-circle-fill"></i>';
                this.updateProgressBar();
                this.resetInactivityTimer();
                break;
                
            case YT.PlayerState.PAUSED:
                window.state.isPlaying = false;
                document.getElementById('playButton').innerHTML = '<i class="bi bi-play-circle-fill"></i>';
                break;
                
            case YT.PlayerState.ENDED:
                window.state.isPlaying = false;
                document.getElementById('playButton').innerHTML = '<i class="bi bi-play-circle-fill"></i>';
                if (this.isRepeat) {
                    event.target.playVideo();
                } else {
                    this.playNext();
                }
                break;
                
            case YT.PlayerState.BUFFERING:
                console.log('Buffering...');
                break;
                
            case YT.PlayerState.CUED:
                console.log('Vídeo carregado');
                break;
        }
    }

    onPlayerError(event) {
        console.error('Erro no player:', event.data);
        this.showToast('Erro ao reproduzir vídeo. Tente outra música.', 'error');
        
        const playerElement = document.getElementById('youtubePlayer');
        if (playerElement && this.youtubePlayer?.getVideoData?.()) {
            const videoId = this.youtubePlayer.getVideoData().video_id;
            playerElement.innerHTML = `
                <iframe width="100%" height="100%" 
                        src="https://www.youtube.com/embed/${videoId}" 
                        frameborder="0" 
                        allowfullscreen>
                </iframe>
            `;
        }
    }

    // ========== CONTROLES DO PLAYER ==========

    playTrack(index) {
        console.log('Play track:', index);
        
        if (index < 0 || index >= window.state.playlist.length) {
            this.showToast('Música não encontrada', 'error');
            return;
        }

        window.state.currentTrackIndex = index;
        const track = window.state.playlist[index];

        // Atualiza UI
        document.getElementById('playerTitle').textContent = track.titulo || track.TITULO || 'Título desconhecido';
        document.getElementById('playerArtist').textContent = track.artista || track.ARTISTA || 'Artista desconhecido';
        document.getElementById('playerPrice').textContent = `${this.formatCurrency(track.valor_acao || track.VALOR_ACAO || 0)} por ação`;

        const playerAlbumArt = document.getElementById('playerAlbumArt');
        const coverUrl = track.link_capa || track.LINK_CAPA || 'https://via.placeholder.com/300x300/111418/00ff88?text=MIV';
        playerAlbumArt.src = coverUrl;
        playerAlbumArt.onerror = function() {
            this.src = 'https://via.placeholder.com/300x300/111418/00ff88?text=MIV';
        };

        // Atualiza favorito
        const isFavorite = window.state.favoriteMusicIds.includes(track.id.toString());
        this.updateFavoriteButton(isFavorite);

        // Mostra player
        document.getElementById('playerBar').style.display = 'block';

        // Inicializa player do YouTube
        const youtubeLink = track.link_youtube || track.LINK_YOUTUBE;
        if (youtubeLink) {
            const videoId = this.extractYouTubeId(youtubeLink);
            if (videoId) {
                console.log('Reproduzindo vídeo ID:', videoId);
                
                if (!this.youtubeAPILoaded) {
                    this.loadYouTubeAPI();
                }
                
                setTimeout(() => {
                    this.initializeYouTubePlayer(videoId);
                }, 100);
            } else {
                this.showToast('Link do YouTube inválido', 'error');
            }
        } else {
            this.showToast('Vídeo não disponível', 'error');
        }

        document.getElementById('playButton').innerHTML = '<i class="bi bi-pause-circle-fill"></i>';
        window.state.isPlaying = true;
        this.resetInactivityTimer();
    }

    togglePlay() {
        if (!this.youtubePlayer || typeof this.youtubePlayer.playVideo !== 'function') {
            return;
        }

        try {
            if (window.state.isPlaying) {
                this.youtubePlayer.pauseVideo();
                document.getElementById('playButton').innerHTML = '<i class="bi bi-play-circle-fill"></i>';
                window.state.isPlaying = false;
            } else {
                this.youtubePlayer.playVideo();
                document.getElementById('playButton').innerHTML = '<i class="bi bi-pause-circle-fill"></i>';
                window.state.isPlaying = true;
                this.updateProgressBar();
                this.resetInactivityTimer();
            }
        } catch (error) {
            console.error('Erro ao alternar play/pause:', error);
            this.showToast('Erro ao controlar reprodução', 'error');
        }
    }

    togglePlayerExpansion() {
        const playerBar = document.getElementById('playerBar');
        const isExpanded = playerBar.classList.contains('expanded');

        if (isExpanded) {
            playerBar.classList.remove('expanded');
            document.getElementById('expandCollapseIcon').className = 'bi bi-chevron-up';
        } else {
            playerBar.classList.add('expanded');
            document.getElementById('expandCollapseIcon').className = 'bi bi-chevron-down';
            this.resetInactivityTimer();
        }
    }

    seekMusic(event) {
        if (!this.youtubePlayer || typeof this.youtubePlayer.seekTo !== 'function') {
            return;
        }

        const progressContainer = document.getElementById('progressContainer');
        if (!progressContainer) return;

        const rect = progressContainer.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));

        try {
            const duration = this.youtubePlayer.getDuration();
            if (duration && duration > 0) {
                const seekTime = duration * percent;
                this.youtubePlayer.seekTo(seekTime, true);

                const progressBar = document.getElementById('musicProgress');
                if (progressBar) {
                    progressBar.style.width = `${percent * 100}%`;
                }
            }
        } catch (error) {
            console.error('Erro ao buscar posição:', error);
        }

        this.resetInactivityTimer();
    }

    setVolume(value) {
        this.currentVolume = parseInt(value);
        window.state.currentVolume = this.currentVolume;

        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.value = value;
        }

        const volumeIcon = document.getElementById('volumeIcon');
        if (volumeIcon) {
            if (value == 0) {
                volumeIcon.className = 'bi bi-volume-mute';
            } else if (value < 50) {
                volumeIcon.className = 'bi bi-volume-down';
            } else {
                volumeIcon.className = 'bi bi-volume-up';
            }
        }

        if (this.youtubePlayer && typeof this.youtubePlayer.setVolume === 'function') {
            try {
                this.youtubePlayer.setVolume(value);
            } catch (error) {
                console.error('Erro ao definir volume:', error);
            }
        }

        this.resetInactivityTimer();
    }

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        window.state.isShuffle = this.isShuffle;
        
        const icon = document.getElementById('shuffleIcon');
        const btn = document.getElementById('shuffleBtn');

        if (this.isShuffle) {
            icon.style.color = 'var(--neon-green)';
            btn.style.color = 'var(--neon-green)';
            this.showToast('Modo aleatório ativado', 'info');
        } else {
            icon.style.color = '';
            btn.style.color = '';
            this.showToast('Modo aleatório desativado', 'info');
        }

        this.resetInactivityTimer();
    }

    toggleRepeat() {
        this.isRepeat = !this.isRepeat;
        window.state.isRepeat = this.isRepeat;
        
        const icon = document.getElementById('repeatIcon');
        const btn = document.getElementById('repeatBtn');

        if (this.isRepeat) {
            icon.style.color = 'var(--neon-green)';
            btn.style.color = 'var(--neon-green)';
            this.showToast('Repetição ativada', 'info');
        } else {
            icon.style.color = '';
            btn.style.color = '';
            this.showToast('Repetição desativada', 'info');
        }

        this.resetInactivityTimer();
    }

    playNext() {
        if (window.state.playlist.length === 0) return;

        let nextIndex;
        if (this.isShuffle) {
            nextIndex = Math.floor(Math.random() * window.state.playlist.length);
            while (nextIndex === window.state.currentTrackIndex && window.state.playlist.length > 1) {
                nextIndex = Math.floor(Math.random() * window.state.playlist.length);
            }
        } else {
            nextIndex = (window.state.currentTrackIndex + 1) % window.state.playlist.length;
        }

        this.playTrack(nextIndex);
        this.resetInactivityTimer();
    }

    playPrevious() {
        if (window.state.playlist.length === 0) return;

        let prevIndex;
        if (this.isShuffle) {
            prevIndex = Math.floor(Math.random() * window.state.playlist.length);
            while (prevIndex === window.state.currentTrackIndex && window.state.playlist.length > 1) {
                prevIndex = Math.floor(Math.random() * window.state.playlist.length);
            }
        } else {
            prevIndex = window.state.currentTrackIndex > 0 ? window.state.currentTrackIndex - 1 : window.state.playlist.length - 1;
        }

        this.playTrack(prevIndex);
        this.resetInactivityTimer();
    }

    // ========== BARRA DE PROGRESSO ==========

    updateProgressBar() {
        if (!this.youtubePlayer || typeof this.youtubePlayer.getCurrentTime !== 'function') {
            return;
        }

        try {
            const currentTime = this.youtubePlayer.getCurrentTime();
            const duration = this.youtubePlayer.getDuration();

            if (duration > 0) {
                const percent = (currentTime / duration) * 100;
                const progressBar = document.getElementById('musicProgress');
                if (progressBar) {
                    progressBar.style.width = `${percent}%`;
                }

                const currentTimeElement = document.getElementById('currentTime');
                const durationTimeElement = document.getElementById('durationTime');

                if (currentTimeElement) {
                    currentTimeElement.textContent = this.formatTime(currentTime);
                }
                if (durationTimeElement) {
                    durationTimeElement.textContent = this.formatTime(duration);
                }
            }

            if (window.state.isPlaying) {
                this.progressInterval = setTimeout(() => this.updateProgressBar(), 1000);
            }
        } catch (error) {
            console.error('Erro ao atualizar barra de progresso:', error);
        }
    }

    // ========== INATIVIDADE DO PLAYER ==========

    startInactivityMonitor() {
        const playerBar = document.getElementById('playerBar');
        if (playerBar) {
            playerBar.addEventListener('mousemove', () => this.resetInactivityTimer());
            playerBar.addEventListener('click', () => this.resetInactivityTimer());
            playerBar.addEventListener('touchstart', () => this.resetInactivityTimer());
        }

        this.resetInactivityTimer();
    }

    resetInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }

        const playerBar = document.getElementById('playerBar');
        if (playerBar && playerBar.classList.contains('minimized')) {
            playerBar.classList.remove('minimized');
            window.state.playerMinimized = false;
        }

        this.inactivityTimer = setTimeout(() => {
            this.minimizePlayer();
        }, this.INACTIVITY_TIMEOUT);
    }

    minimizePlayer() {
        const playerBar = document.getElementById('playerBar');
        if (playerBar && playerBar.style.display !== 'none' && !playerBar.classList.contains('expanded')) {
            playerBar.classList.add('minimized');
            window.state.playerMinimized = true;
        }
    }

    // ========== UTILITÁRIOS ==========

    setupEventListeners() {
        // Eventos já configurados no HTML via onclick
        // Esta função é para eventos adicionais se necessário
    }

    updateFavoriteButton(isFavorite) {
        const btn = document.getElementById('favoritePlayerBtn');
        const icon = document.getElementById('favoritePlayerIcon');

        if (btn && icon) {
            if (isFavorite) {
                btn.classList.remove('btn-outline-warning');
                btn.classList.add('btn-warning');
                icon.className = 'bi bi-star-fill';
            } else {
                btn.classList.remove('btn-warning');
                btn.classList.add('btn-outline-warning');
                icon.className = 'bi bi-star';
            }
        }
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    formatCurrency(value) {
        if (value === null || value === undefined || isNaN(value)) value = 0;
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Number(value));
    }

    showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // ========== LIMPEZA ==========

    cleanup() {
        if (this.youtubePlayer && this.youtubePlayer.destroy) {
            try {
                this.youtubePlayer.destroy();
            } catch (e) {
                console.error('Erro ao limpar player:', e);
            }
            this.youtubePlayer = null;
        }

        if (this.progressInterval) {
            clearTimeout(this.progressInterval);
            this.progressInterval = null;
        }

        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }

        const playerElement = document.getElementById('youtubePlayer');
        if (playerElement) {
            playerElement.innerHTML = '';
        }
    }
}

// Instância global do player
const musicPlayer = new MusicPlayer();

// Exportar funções globais
window.playTrack = (index) => musicPlayer.playTrack(index);
window.togglePlay = () => musicPlayer.togglePlay();
window.togglePlayerExpansion = () => musicPlayer.togglePlayerExpansion();
window.seekMusic = (event) => musicPlayer.seekMusic(event);
window.setVolume = (value) => musicPlayer.setVolume(value);
window.toggleShuffle = () => musicPlayer.toggleShuffle();
window.toggleRepeat = () => musicPlayer.toggleRepeat();
window.playNext = () => musicPlayer.playNext();
window.playPrevious = () => musicPlayer.playPrevious();
window.toggleFavorite = (index) => {
    if (window.toggleFavoriteMusic) {
        const track = window.state.playlist[index];
        if (track) {
            window.toggleFavoriteMusic(track.id, index);
        }
    }
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('Music Player inicializado');
});

export default musicPlayer;
