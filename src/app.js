const videos = window.LOOP_VIDEOS || [];
const app = document.querySelector('#app');
const dialog = document.querySelector('#comment-dialog');
const commentInput = document.querySelector('#comment-input');
const commentTitle = document.querySelector('#comment-video-title');
const saveCommentBtn = document.querySelector('#save-comment-btn');

const STORAGE_KEY = 'loopFeedback';
const LAST_STATE_KEY = 'loopLastState';
const PLAYER_ID = 'yt-player';

let player = null;
let playerReady = false;
let ytApiPromise = null;
let touchStartY = null;
let touchStartX = null;
let touchStartedOnControl = false;
let wheelLock = false;
let toastTimer = null;

const state = {
  screen: 'intro',
  activeTopic: 'Todo',
  index: 0,
  showInfo: false,
  hideCopy: false,
  muted: false,
  paused: false,
  feedback: JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
};

try {
  const lastState = JSON.parse(localStorage.getItem(LAST_STATE_KEY) || '{}');
  if (lastState.activeTopic) state.activeTopic = lastState.activeTopic;
  if (Number.isInteger(lastState.index)) state.index = lastState.index;
  if (typeof lastState.muted === 'boolean') state.muted = lastState.muted;
} catch (error) {
  console.warn('LOOP: could not restore last state', error);
}

function persistState() {
  localStorage.setItem(LAST_STATE_KEY, JSON.stringify({
    activeTopic: state.activeTopic,
    index: state.index,
    muted: state.muted
  }));
}

function saveFeedback() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.feedback));
}

function topics() {
  return ['Todo', ...new Set(videos.map(video => video.topic))];
}

function filteredVideos() {
  return state.activeTopic === 'Todo' ? videos : videos.filter(video => video.topic === state.activeTopic);
}

function durationSeconds(duration) {
  const match = String(duration).match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration || '0s';
  return `${Number(match[1] || 0) * 60 + Number(match[2] || 0)}s`;
}

function formatViews(value) {
  const number = Number(value || 0);
  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
  if (number >= 1000) return `${Math.round(number / 1000)}K`;
  return number.toString();
}

function clampIndex() {
  const list = filteredVideos();
  if (!list.length) return;
  state.index = Math.max(0, Math.min(state.index, list.length - 1));
}

function currentVideo() {
  const list = filteredVideos();
  if (!list.length) return null;
  clampIndex();
  return list[state.index];
}

function ensureYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise(resolve => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousCallback === 'function') previousCallback();
      resolve();
    };

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);
  });

  return ytApiPromise;
}

function destroyPlayer() {
  playerReady = false;
  if (player?.destroy) {
    try { player.destroy(); } catch (error) { console.warn('LOOP: could not destroy player', error); }
  }
  player = null;
}

async function mountPlayer(video) {
  await ensureYouTubeApi();
  const mountNode = document.getElementById(PLAYER_ID);
  if (!mountNode || state.screen !== 'feed') return;
  if (currentVideo()?.id !== video.id) return;

  destroyPlayer();

  player = new window.YT.Player(PLAYER_ID, {
    videoId: video.video_id,
    host: 'https://www.youtube-nocookie.com',
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      playsinline: 1,
      rel: 0
    },
    events: {
      onReady: event => {
        playerReady = true;
        if (state.muted) {
          event.target.mute();
        } else {
          event.target.unMute();
          event.target.setVolume(100);
        }
        event.target.playVideo();
        state.paused = false;
        updatePlaybackControls();

        setTimeout(() => {
          if (!player?.getPlayerState) return;
          const status = player.getPlayerState();
          if (status !== window.YT.PlayerState.PLAYING) {
            state.paused = true;
            updatePlaybackControls();
            showToast('Pulsa Play para reproducir');
          }
        }, 700);
      },
      onStateChange: event => {
        if (event.data === window.YT.PlayerState.ENDED) nextVideo();
        if (event.data === window.YT.PlayerState.PLAYING) {
          state.paused = false;
          updatePlaybackControls();
        }
        if (event.data === window.YT.PlayerState.PAUSED) {
          state.paused = true;
          updatePlaybackControls();
        }
      }
    }
  });
}

function nextVideo() {
  const list = filteredVideos();
  if (!list.length) return;
  state.index = (state.index + 1) % list.length;
  state.showInfo = false;
  persistState();
  renderFeed();
}

function prevVideo() {
  const list = filteredVideos();
  if (!list.length) return;
  state.index = (state.index - 1 + list.length) % list.length;
  state.showInfo = false;
  persistState();
  renderFeed();
}

function feedbackText(video) {
  const item = state.feedback[video.id];
  if (!item) return 'Sin feedback';
  const labels = { more: 'Más contenido similar', less: 'Menos contenido similar' };
  if (item.comment && item.vote) return `${labels[item.vote] || item.vote} · Comentado`;
  if (item.comment) return 'Comentado';
  return labels[item.vote] || 'Guardado';
}

function renderIntro() {
  destroyPlayer();
  const totalTopics = topics().length - 1;
  app.innerHTML = `
    <section class="landing-screen">
      <div class="landing-bg"></div>
      <header class="landing-header">
        <div class="loop-wordmark"><span class="loop-logo">∞</span><strong>LOOP</strong></div>
        <span class="landing-pill">MVP visual</span>
      </header>

      <section class="landing-main">
        <div class="landing-copy">
          <p class="mini-label">Microlearning shorts</p>
          <h1>Scroll menos vacío. Aprende más.</h1>
          <p>Vídeos educativos cortos, filtrados por tema, con una experiencia simple tipo Shorts.</p>
          <div class="landing-actions">
            <button class="main-cta" data-action="start">Empezar</button>
            <button class="secondary-cta" data-action="demo">Demo directa</button>
          </div>
        </div>

        <button class="preview-phone" data-action="demo" aria-label="Abrir demo LOOP">
          <div class="preview-video"></div>
          <div class="preview-overlay">
            <span>Science · 34s</span>
            <strong>5 incredible facts about space</strong>
            <small>Swipe up to learn</small>
          </div>
          <div class="preview-rail"><i></i><i></i><i></i></div>
        </button>
      </section>

      <section class="landing-topics" aria-label="Seleccionar tema">
        <div class="section-title">
          <span>Temas</span>
          <strong>${videos.length} vídeos · ${totalTopics} categorías</strong>
        </div>
        <div class="topic-strip large">
          ${topics().map(topic => topicButton(topic)).join('')}
        </div>
      </section>
    </section>`;
}

function topicButton(topic) {
  const count = topic === 'Todo' ? videos.length : videos.filter(video => video.topic === topic).length;
  const active = topic === state.activeTopic ? 'active' : '';
  return `<button class="topic-chip ${active}" data-topic="${topic}"><span>${topic}</span><small>${count}</small></button>`;
}

function renderFeed() {
  const list = filteredVideos();
  const video = currentVideo();

  if (!video) {
    destroyPlayer();
    app.innerHTML = `<section class="empty-screen"><h1>No hay vídeos para este tema.</h1><button class="main-cta" data-action="back">Volver</button></section>`;
    return;
  }

  destroyPlayer();
  const feedback = feedbackText(video);

  app.innerHTML = `
    <section class="shorts-screen">
      <article class="short-card">
        <div id="${PLAYER_ID}" class="short-player"></div>

        <div class="shade top-shade"></div>
        <div class="shade bottom-shade"></div>

        <header class="short-topbar">
          <button class="glass-icon" data-action="back" aria-label="Volver">‹</button>
          <button class="loop-mini" data-action="home" aria-label="LOOP inicio"><span class="loop-logo small">∞</span><strong>LOOP</strong></button>
        </header>

        <button class="center-play-zone" data-action="toggle-play" aria-label="Pausar o reproducir vídeo"></button>
        <button class="paused-indicator ${state.paused ? 'visible' : ''}" data-action="toggle-play" aria-label="Reproducir"><span>▶</span></button>

        <aside class="action-rail" aria-label="Acciones de feedback">
          <button class="rail-btn positive" data-action="more"><span>＋</span><small>Más</small></button>
          <button class="rail-btn" data-action="less"><span>−</span><small>Menos</small></button>
          <button class="rail-btn" data-action="comment"><span>💬</span><small>Comentar</small></button>
          <button class="rail-btn" data-action="toggle-play"><span data-play-icon>${state.paused ? '▶' : 'Ⅱ'}</span><small data-play-label>${state.paused ? 'Play' : 'Pausa'}</small></button>
          <button class="rail-btn" data-action="toggle-mute"><span data-mute-icon>${state.muted ? '🔇' : '🔊'}</span><small data-mute-label>${state.muted ? 'Sonido' : 'Mute'}</small></button>
          <button class="rail-btn" data-action="toggle-copy"><span data-copy-icon>${state.hideCopy ? 'Aa' : '⌄'}</span><small data-copy-label>${state.hideCopy ? 'Texto' : 'Ocultar'}</small></button>
          <button class="rail-btn" data-action="toggle-info"><span>?</span><small>Info</small></button>
        </aside>

        <section class="short-copy ${state.hideCopy ? 'is-hidden' : ''}">
          <div class="video-meta-line">
            <span class="topic-dot">${video.topic}</span>
            <span>${durationSeconds(video.duration)}</span>
            <span>${formatViews(video.views)} views</span>
          </div>
          <h1>${video.title}</h1>
          <p>${video.summary}</p>
          <div class="source-line">
            <span>@${video.channel || 'Unknown'}</span>
            <span data-feedback-line>${feedback}</span>
          </div>
        </section>

        <button class="text-restore ${state.hideCopy ? 'visible' : ''}" data-action="toggle-copy">Mostrar texto</button>

        <nav class="bottom-topic-bar" aria-label="Cambiar tema">
          ${topics().map(topic => topicButton(topic)).join('')}
        </nav>

        <section class="info-sheet ${state.showInfo ? 'open' : ''}" aria-hidden="${state.showInfo ? 'false' : 'true'}">
          <div class="sheet-handle"></div>
          <p class="mini-label">Filtro LOOP</p>
          <h2>Por qué aparece</h2>
          <p>${video.reason}</p>
          <div class="score-row">
            <span>Calidad <strong>${video.quality}</strong></span>
            <span>Utilidad <strong>${video.usefulness}</strong></span>
            <span>Duración <strong>${durationSeconds(video.duration)}</strong></span>
          </div>
        </section>
      </article>
    </section>`;

  mountPlayer(video);
}

function render() {
  state.screen === 'intro' ? renderIntro() : renderFeed();
}

function showToast(message) {
  const card = document.querySelector('.short-card');
  if (!card) return;
  clearTimeout(toastTimer);
  document.querySelector('.toast')?.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  card.appendChild(toast);
  toastTimer = setTimeout(() => toast.remove(), 1200);
}

function updatePlaybackControls() {
  const playIcon = document.querySelector('[data-play-icon]');
  const playLabel = document.querySelector('[data-play-label]');
  const muteIcon = document.querySelector('[data-mute-icon]');
  const muteLabel = document.querySelector('[data-mute-label]');
  const pausedIndicator = document.querySelector('.paused-indicator');

  if (playIcon) playIcon.textContent = state.paused ? '▶' : 'Ⅱ';
  if (playLabel) playLabel.textContent = state.paused ? 'Play' : 'Pausa';
  if (muteIcon) muteIcon.textContent = state.muted ? '🔇' : '🔊';
  if (muteLabel) muteLabel.textContent = state.muted ? 'Sonido' : 'Mute';
  if (pausedIndicator) pausedIndicator.classList.toggle('visible', state.paused);
}

function updateCopyVisibility() {
  document.querySelector('.short-copy')?.classList.toggle('is-hidden', state.hideCopy);
  document.querySelector('.text-restore')?.classList.toggle('visible', state.hideCopy);
  const copyIcon = document.querySelector('[data-copy-icon]');
  const copyLabel = document.querySelector('[data-copy-label]');
  if (copyIcon) copyIcon.textContent = state.hideCopy ? 'Aa' : '⌄';
  if (copyLabel) copyLabel.textContent = state.hideCopy ? 'Texto' : 'Ocultar';
}

function setVote(vote) {
  const video = currentVideo();
  if (!video) return;
  state.feedback[video.id] = { ...(state.feedback[video.id] || {}), vote, at: new Date().toISOString() };
  saveFeedback();
  const line = document.querySelector('[data-feedback-line]');
  if (line) line.textContent = feedbackText(video);
  showToast('Feedback guardado');
}

function togglePlay() {
  if (!playerReady || !player) {
    showToast('Cargando vídeo...');
    return;
  }
  const status = player.getPlayerState?.();
  if (status === window.YT.PlayerState.PLAYING) {
    player.pauseVideo();
    state.paused = true;
  } else {
    if (!state.muted) {
      player.unMute();
      player.setVolume(100);
    }
    player.playVideo();
    state.paused = false;
  }
  updatePlaybackControls();
}

function toggleMute() {
  if (!playerReady || !player) {
    showToast('Cargando vídeo...');
    return;
  }
  state.muted = !state.muted;
  if (state.muted) {
    player.mute();
  } else {
    player.unMute();
    player.setVolume(100);
    player.playVideo();
    state.paused = false;
  }
  persistState();
  updatePlaybackControls();
}

function openComment() {
  const video = currentVideo();
  if (!video) return;
  commentTitle.textContent = video.title;
  commentInput.value = state.feedback[video.id]?.comment || '';
  dialog.showModal();
  setTimeout(() => commentInput.focus(), 50);
}

saveCommentBtn.addEventListener('click', event => {
  event.preventDefault();
  const video = currentVideo();
  if (!video) return;
  state.feedback[video.id] = { ...(state.feedback[video.id] || {}), comment: commentInput.value.trim(), at: new Date().toISOString() };
  saveFeedback();
  dialog.close();
  const line = document.querySelector('[data-feedback-line]');
  if (line) line.textContent = feedbackText(video);
  showToast('Comentario guardado');
});

app.addEventListener('click', event => {
  const topic = event.target.closest('[data-topic]')?.dataset.topic;
  const action = event.target.closest('[data-action]')?.dataset.action;

  if (topic) {
    state.activeTopic = topic;
    state.index = 0;
    state.screen = 'feed';
    state.showInfo = false;
    persistState();
    renderFeed();
    return;
  }

  if (!action) return;
  if (action === 'start' || action === 'demo') { state.screen = 'feed'; clampIndex(); persistState(); renderFeed(); }
  if (action === 'back' || action === 'home') { state.screen = 'intro'; state.showInfo = false; renderIntro(); }
  if (action === 'more') setVote('more');
  if (action === 'less') setVote('less');
  if (action === 'comment') openComment();
  if (action === 'toggle-info') { state.showInfo = !state.showInfo; renderFeed(); }
  if (action === 'toggle-play') togglePlay();
  if (action === 'toggle-mute') toggleMute();
  if (action === 'toggle-copy') { state.hideCopy = !state.hideCopy; updateCopyVisibility(); }
});

app.addEventListener('touchstart', event => {
  touchStartY = event.touches[0].clientY;
  touchStartX = event.touches[0].clientX;
  touchStartedOnControl = Boolean(event.target.closest('button, textarea, .topic-chip, .info-sheet, .action-rail, .bottom-topic-bar'));
}, { passive: true });

app.addEventListener('touchend', event => {
  if (state.screen !== 'feed' || touchStartY === null || touchStartX === null || touchStartedOnControl) {
    touchStartY = null;
    touchStartX = null;
    touchStartedOnControl = false;
    return;
  }

  const dy = event.changedTouches[0].clientY - touchStartY;
  const dx = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dy) > 70 && Math.abs(dy) > Math.abs(dx) * 1.25) dy < 0 ? nextVideo() : prevVideo();
  touchStartY = null;
  touchStartX = null;
  touchStartedOnControl = false;
}, { passive: true });

app.addEventListener('wheel', event => {
  if (state.screen !== 'feed' || wheelLock) return;
  if (Math.abs(event.deltaY) < 45) return;
  wheelLock = true;
  event.deltaY > 0 ? nextVideo() : prevVideo();
  setTimeout(() => { wheelLock = false; }, 720);
}, { passive: true });

document.addEventListener('keydown', event => {
  if (state.screen !== 'feed') return;
  if (event.key === 'ArrowDown' || event.key === 'PageDown') nextVideo();
  if (event.key === 'ArrowUp' || event.key === 'PageUp') prevVideo();
  if (event.key === ' ') { event.preventDefault(); togglePlay(); }
  if (event.key.toLowerCase() === 'm') setVote('more');
  if (event.key.toLowerCase() === 'l') setVote('less');
  if (event.key.toLowerCase() === 'c') openComment();
  if (event.key.toLowerCase() === 's') toggleMute();
  if (event.key.toLowerCase() === 't') { state.hideCopy = !state.hideCopy; updateCopyVisibility(); }
  if (event.key === 'Escape' && state.showInfo) { state.showInfo = false; renderFeed(); }
});

render();
