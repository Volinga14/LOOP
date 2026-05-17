const allVideos = window.LOOP_VIDEOS || [];
const allTopics = window.LOOP_TOPICS || [];

const app = document.querySelector('#app');
const dialog = document.querySelector('#comment-dialog');
const commentInput = document.querySelector('#comment-input');
const commentTitle = document.querySelector('#comment-video-title');
const saveCommentBtn = document.querySelector('#save-comment-btn');

const STORAGE_KEY = 'loopFeedback.v3';
const LAST_STATE_KEY = 'loopLastState.v3';
const PLAYER_ID = 'yt-player';

let player = null;
let playerReady = false;
let ytApiPromise = null;
let progressTimer = null;
let isSeeking = false;
let toastTimer = null;
let wheelLock = false;
let deferredInstallPrompt = null;
let ignoreNextCenterClick = false;

let touchStartY = null;
let touchStartX = null;
let touchStartTime = 0;
let touchStartedOnControl = false;

const state = {
  screen: 'intro',
  mode: 'random', // random | topic | search
  activeTopic: '',
  activeSearch: '',
  index: 0,
  playlist: [],
  showSearch: false,
  showInfo: false,
  hideCopy: false,
  muted: false,
  paused: false,
  feedback: readJson(STORAGE_KEY, {})
};

const lastState = readJson(LAST_STATE_KEY, {});
if (lastState.mode) state.mode = lastState.mode;
if (lastState.activeTopic) state.activeTopic = lastState.activeTopic;
if (lastState.activeSearch) state.activeSearch = lastState.activeSearch;
if (Number.isInteger(lastState.index)) state.index = lastState.index;
if (typeof lastState.muted === 'boolean') state.muted = lastState.muted;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(error => console.warn('LOOP: service worker not registered', error));
  });
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
});

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

function persistState() {
  localStorage.setItem(LAST_STATE_KEY, JSON.stringify({
    mode: state.mode,
    activeTopic: state.activeTopic,
    activeSearch: state.activeSearch,
    index: state.index,
    muted: state.muted
  }));
}

function saveFeedback() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.feedback));
}

function normalize(value = '') {
  return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function topicByKey(key) {
  return allTopics.find(topic => topic.key === key);
}

function topicLabel(key) {
  return topicByKey(key)?.label || 'Todos';
}

function sourcePool() {
  if (state.mode === 'topic' && state.activeTopic) {
    return allVideos.filter(video => video.topicKey === state.activeTopic);
  }
  if (state.mode === 'search' && state.activeSearch) {
    const term = normalize(state.activeSearch);
    return allVideos.filter(video =>
      normalize(video.title).includes(term) ||
      normalize(video.topic).includes(term) ||
      normalize(video.topicKey).includes(term) ||
      normalize(video.channel).includes(term)
    );
  }
  return allVideos;
}

function rebuildPlaylist({ keepCurrent = false } = {}) {
  const current = keepCurrent ? currentVideo() : null;
  let next = shuffle(sourcePool());
  if (current && next.some(video => video.id === current.id)) {
    next = [current, ...next.filter(video => video.id !== current.id)];
  }
  state.playlist = next;
  state.index = keepCurrent ? 0 : 0;
}

function playlist() {
  if (!state.playlist.length) rebuildPlaylist();
  return state.playlist;
}

function currentVideo() {
  const list = playlist();
  if (!list.length) return null;
  state.index = Math.max(0, Math.min(state.index, list.length - 1));
  return list[state.index];
}

function feedTitle() {
  if (state.mode === 'search') return `Búsqueda: ${state.activeSearch}`;
  if (state.mode === 'topic') return topicLabel(state.activeTopic);
  return 'Aleatorio';
}

function formatViews(value) {
  const number = Number(value || 0);
  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
  if (number >= 1000) return `${Math.round(number / 1000)}K`;
  return number.toString();
}

function durationSeconds(duration) {
  const match = String(duration).match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration || '0s';
  return `${Number(match[1] || 0) * 60 + Number(match[2] || 0)}s`;
}

function formatClock(seconds = 0) {
  const safe = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
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

function stopProgressPolling() {
  clearInterval(progressTimer);
  progressTimer = null;
}

function destroyPlayer() {
  stopProgressPolling();
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
        if (state.muted) event.target.mute();
        else {
          event.target.unMute();
          event.target.setVolume(100);
        }
        event.target.playVideo();
        state.paused = false;
        updatePlaybackControls();
        startProgressPolling();
        setTimeout(() => {
          if (!player?.getPlayerState) return;
          const status = player.getPlayerState();
          if (status !== window.YT.PlayerState.PLAYING) {
            state.paused = true;
            updatePlaybackControls();
            showToast('Toca el vídeo para reproducir');
          }
        }, 850);
      },
      onStateChange: event => {
        if (event.data === window.YT.PlayerState.ENDED) nextVideo();
        if (event.data === window.YT.PlayerState.PLAYING) {
          state.paused = false;
          updatePlaybackControls();
          startProgressPolling();
        }
        if (event.data === window.YT.PlayerState.PAUSED) {
          state.paused = true;
          updatePlaybackControls();
        }
      }
    }
  });
}

function startProgressPolling() {
  stopProgressPolling();
  updateProgressBar();
  progressTimer = setInterval(updateProgressBar, 300);
}

function updateProgressBar() {
  if (!playerReady || !player || isSeeking) return;
  const slider = document.querySelector('.progress-slider');
  const time = document.querySelector('[data-progress-time]');
  if (!slider) return;
  const duration = Number(player.getDuration?.() || 0);
  const current = Number(player.getCurrentTime?.() || 0);
  if (!duration) return;
  slider.max = String(duration);
  slider.value = String(current);
  slider.style.setProperty('--progress', `${Math.min(100, (current / duration) * 100)}%`);
  if (time) time.textContent = `${formatClock(current)} / ${formatClock(duration)}`;
}

function seekToSliderValue(value) {
  if (!playerReady || !player) return;
  const seconds = Number(value || 0);
  player.seekTo(seconds, true);
  player.playVideo();
  state.paused = false;
  updatePlaybackControls();
  updateProgressBar();
}

function nextVideo() {
  const list = playlist();
  if (!list.length) return;
  state.index = (state.index + 1) % list.length;
  state.showInfo = false;
  persistState();
  renderFeed();
}

function prevVideo() {
  const list = playlist();
  if (!list.length) return;
  state.index = (state.index - 1 + list.length) % list.length;
  state.showInfo = false;
  persistState();
  renderFeed();
}

function chooseRandomAll() {
  state.mode = 'random';
  state.activeTopic = '';
  state.activeSearch = '';
  state.showSearch = false;
  state.showInfo = false;
  rebuildPlaylist();
  persistState();
  state.screen = 'feed';
  renderFeed();
}

function chooseTopic(topicKey) {
  if (!topicByKey(topicKey)) return;
  state.mode = 'topic';
  state.activeTopic = topicKey;
  state.activeSearch = '';
  state.showSearch = false;
  state.showInfo = false;
  rebuildPlaylist();
  persistState();
  state.screen = 'feed';
  renderFeed();
}

function runSearch(rawTerm) {
  const term = String(rawTerm || '').trim();
  if (!term) {
    chooseRandomAll();
    return;
  }
  const normalized = normalize(term);
  const matchingTopic = allTopics.find(topic => normalize(topic.label).includes(normalized) || normalize(topic.key).includes(normalized));
  if (matchingTopic) {
    chooseTopic(matchingTopic.key);
    return;
  }
  state.mode = 'search';
  state.activeSearch = term;
  state.activeTopic = '';
  state.showSearch = false;
  state.showInfo = false;
  rebuildPlaylist();
  state.screen = 'feed';
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

function introCategoryButtons() {
  return allTopics.map(topic => `<button class="category ${state.activeTopic === topic.key ? 'active' : ''}" data-topic="${topic.key}">${escapeHtml(topic.label)}</button>`).join('');
}

function feedCategoryButtons() {
  const allActive = state.mode === 'random' ? 'active' : '';
  const allButton = `<button class="category ${allActive}" data-action="random-all">Todos</button>`;
  return allButton + allTopics.map(topic => {
    const active = state.mode === 'topic' && state.activeTopic === topic.key ? 'active' : '';
    return `<button class="category ${active}" data-topic="${topic.key}">${escapeHtml(topic.label)}</button>`;
  }).join('');
}

function renderIntro() {
  destroyPlayer();
  app.innerHTML = `
    <section id="intro" class="intro-screen">
      <h1>LOOP</h1>
      <p class="subtitle">Aprende deslizando</p>

      <form class="search search-intro" data-search-form>
        <input id="introSearchInput" name="q" placeholder="Escribe o toca una categoría..." autocomplete="off" />
        <button type="submit" aria-label="Buscar">🔍</button>
      </form>

      <div class="category-bar intro-categories">
        ${introCategoryButtons()}
      </div>

      <button class="start" data-action="start">Empezar</button>
    </section>`;
}

function renderFeed() {
  const list = playlist();
  const video = currentVideo();

  if (!video) {
    destroyPlayer();
    app.innerHTML = `
      <section class="empty-screen">
        <div>
          <h1>No hay resultados.</h1>
          <p>Prueba con astronomy, biology, physics, cooking o coffee.</p>
          <form class="search empty-search" data-search-form>
            <input name="q" placeholder="Buscar categoría o texto" autocomplete="off" />
            <button type="submit">🔍</button>
          </form>
          <button class="start" data-action="back">Volver</button>
        </div>
      </section>`;
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

        <header class="short-topbar shorts-minimal-header">
          <button class="logo-corner" data-action="home" aria-label="Volver a inicio">LOOP</button>
          <button class="search-corner" data-action="toggle-search" aria-label="Buscar">🔍</button>
        </header>

        <section class="search-drawer ${state.showSearch ? 'open' : ''}" aria-hidden="${state.showSearch ? 'false' : 'true'}">
          <form class="search header-search" data-search-form>
            <input name="q" value="${escapeHtml(state.activeSearch)}" placeholder="Buscar categoría o vídeo" autocomplete="off" />
            <button type="submit" aria-label="Buscar">🔍</button>
          </form>
          <nav class="category-bar app-categories" aria-label="Categorías">
            ${feedCategoryButtons()}
          </nav>
        </section>

        <div class="center-play-zone" data-action="center-toggle" aria-hidden="true"></div>
        <button class="paused-indicator ${state.paused ? 'visible' : ''}" data-action="toggle-play" aria-label="Reproducir"><span>▶</span></button>

        <aside class="action-rail" aria-label="Acciones de feedback">
          <button class="rail-btn positive" data-action="more"><span>＋</span><small>Más</small></button>
          <button class="rail-btn" data-action="less"><span>−</span><small>Menos</small></button>
          <button class="rail-btn" data-action="comment"><span>💬</span><small>Comentar</small></button>
          <button class="rail-btn" data-action="toggle-mute"><span data-mute-icon>${state.muted ? '🔇' : '🔊'}</span><small data-mute-label>${state.muted ? 'Sonido' : 'Mute'}</small></button>
          <button class="rail-btn" data-action="toggle-info"><span>?</span><small>Info</small></button>
        </aside>

        <button class="copy-tab ${state.hideCopy ? 'is-hidden-copy' : ''}" data-action="toggle-copy">
          <span data-copy-label>${state.hideCopy ? 'Mostrar texto' : 'Ocultar texto'}</span>
        </button>

        <section class="short-copy ${state.hideCopy ? 'is-hidden' : ''}">
          <div class="video-meta-line">
            <span class="topic-dot">${escapeHtml(feedTitle())}</span>
            <span>${state.index + 1}/${list.length}</span>
            <span>${durationSeconds(video.duration)}</span>
            <span>${formatViews(video.views)} views</span>
          </div>
          <h1>${escapeHtml(video.title)}</h1>
          <p>${escapeHtml(video.summary || video.title)}</p>
          <div class="source-line">
            <span>@${escapeHtml(video.channel || 'YouTube Shorts')}</span>
            <span data-feedback-line>${feedback}</span>
          </div>
        </section>

        <div class="progress-shell">
          <input class="progress-slider" type="range" min="0" max="100" value="0" step="0.1" aria-label="Progreso del vídeo" />
          <span data-progress-time>0:00 / 0:00</span>
        </div>

        <section class="info-sheet ${state.showInfo ? 'open' : ''}" aria-hidden="${state.showInfo ? 'false' : 'true'}">
          <button class="sheet-close" data-action="close-info" aria-label="Cerrar información">×</button>
          <button class="sheet-handle" data-action="close-info" aria-label="Cerrar información"></button>
          <p class="mini-label">Filtro LOOP</p>
          <h2>Por qué aparece</h2>
          <p>${escapeHtml(video.reason || 'Vídeo seleccionado de forma aleatoria desde la base inicial de LOOP. Más adelante se sustituirá por el algoritmo de recomendación.')}</p>
          <div class="score-row">
            <span>Calidad <strong>${video.quality || '-'}</strong></span>
            <span>Utilidad <strong>${video.usefulness || '-'}</strong></span>
            <span>Origen <strong>${escapeHtml(video.topic || topicLabel(video.topicKey))}</strong></span>
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
  const card = document.querySelector('.short-card') || document.querySelector('.intro-screen');
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
  const muteIcon = document.querySelector('[data-mute-icon]');
  const muteLabel = document.querySelector('[data-mute-label]');
  const pausedIndicator = document.querySelector('.paused-indicator');
  if (muteIcon) muteIcon.textContent = state.muted ? '🔇' : '🔊';
  if (muteLabel) muteLabel.textContent = state.muted ? 'Sonido' : 'Mute';
  if (pausedIndicator) pausedIndicator.classList.toggle('visible', state.paused);
}

function updateInfoVisibility() {
  const sheet = document.querySelector('.info-sheet');
  if (!sheet) return;
  sheet.classList.toggle('open', state.showInfo);
  sheet.setAttribute('aria-hidden', state.showInfo ? 'false' : 'true');
}

function updateSearchVisibility() {
  const drawer = document.querySelector('.search-drawer');
  if (!drawer) return;
  drawer.classList.toggle('open', state.showSearch);
  drawer.setAttribute('aria-hidden', state.showSearch ? 'false' : 'true');
  if (state.showSearch) setTimeout(() => drawer.querySelector('input')?.focus(), 40);
}

function updateCopyVisibility() {
  document.querySelector('.short-copy')?.classList.toggle('is-hidden', state.hideCopy);
  const tab = document.querySelector('.copy-tab');
  const copyLabel = document.querySelector('[data-copy-label]');
  if (tab) tab.classList.toggle('is-hidden-copy', state.hideCopy);
  if (copyLabel) copyLabel.textContent = state.hideCopy ? 'Mostrar texto' : 'Ocultar texto';
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
  if (state.muted) player.mute();
  else {
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

app.addEventListener('submit', event => {
  const form = event.target.closest('[data-search-form]');
  if (!form) return;
  event.preventDefault();
  const input = form.querySelector('input[name="q"]');
  runSearch(input?.value || '');
});

app.addEventListener('click', async event => {
  const topic = event.target.closest('[data-topic]')?.dataset.topic;
  const action = event.target.closest('[data-action]')?.dataset.action;

  if (topic) {
    chooseTopic(topic);
    return;
  }
  if (!action) return;

  if (action === 'start') chooseRandomAll();
  if (action === 'random-all') chooseRandomAll();
  if (action === 'back' || action === 'home') { state.screen = 'intro'; state.showInfo = false; state.showSearch = false; renderIntro(); }
  if (action === 'more') setVote('more');
  if (action === 'less') setVote('less');
  if (action === 'comment') openComment();
  if (action === 'toggle-info') { state.showInfo = !state.showInfo; updateInfoVisibility(); }
  if (action === 'close-info') { state.showInfo = false; updateInfoVisibility(); }
  if (action === 'toggle-search') { state.showSearch = !state.showSearch; updateSearchVisibility(); }
  if (action === 'toggle-play') togglePlay();
  if (action === 'center-toggle') {
    if (ignoreNextCenterClick) {
      ignoreNextCenterClick = false;
      return;
    }
    togglePlay();
  }
  if (action === 'toggle-mute') toggleMute();
  if (action === 'toggle-copy') { state.hideCopy = !state.hideCopy; updateCopyVisibility(); }
  if (action === 'install' && deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice.catch(() => null);
    deferredInstallPrompt = null;
  }
});

app.addEventListener('input', event => {
  const slider = event.target.closest('.progress-slider');
  if (!slider) return;
  isSeeking = true;
  const duration = Number(slider.max || 0);
  const value = Number(slider.value || 0);
  if (duration) slider.style.setProperty('--progress', `${Math.min(100, (value / duration) * 100)}%`);
  const time = document.querySelector('[data-progress-time]');
  if (time) time.textContent = `${formatClock(value)} / ${formatClock(duration)}`;
});

app.addEventListener('change', event => {
  const slider = event.target.closest('.progress-slider');
  if (!slider) return;
  seekToSliderValue(slider.value);
  isSeeking = false;
});

app.addEventListener('pointerdown', event => {
  if (event.target.closest('.progress-slider')) isSeeking = true;
});

app.addEventListener('pointerup', event => {
  const slider = event.target.closest('.progress-slider') || document.querySelector('.progress-slider');
  if (isSeeking && slider) seekToSliderValue(slider.value);
  isSeeking = false;
});

app.addEventListener('touchstart', event => {
  if (state.screen !== 'feed') return;
  const touch = event.touches[0];
  touchStartY = touch.clientY;
  touchStartX = touch.clientX;
  touchStartTime = Date.now();
  touchStartedOnControl = Boolean(event.target.closest('button, input, textarea, .search-drawer, .info-sheet, .action-rail, .progress-shell'));
}, { passive: true });

app.addEventListener('touchmove', event => {
  if (state.screen !== 'feed' || touchStartedOnControl) return;
  const touch = event.touches[0];
  if (!touch || touchStartY === null) return;
  const dy = touch.clientY - touchStartY;
  const dx = touch.clientX - touchStartX;
  if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
    event.preventDefault();
  }
}, { passive: false });

app.addEventListener('touchend', event => {
  if (state.screen !== 'feed' || touchStartY === null || touchStartX === null) {
    resetTouch();
    return;
  }

  const touch = event.changedTouches[0];
  const dy = touch.clientY - touchStartY;
  const dx = touch.clientX - touchStartX;
  const elapsed = Date.now() - touchStartTime;
  const isVerticalSwipe = Math.abs(dy) > 42 && Math.abs(dy) > Math.abs(dx) * 1.15;
  const isTap = Math.abs(dy) < 12 && Math.abs(dx) < 12 && elapsed < 360;

  if (!touchStartedOnControl && isVerticalSwipe) {
    dy < 0 ? nextVideo() : prevVideo();
    ignoreNextCenterClick = true;
    setTimeout(() => { ignoreNextCenterClick = false; }, 350);
  } else if (!touchStartedOnControl && isTap) {
    togglePlay();
    ignoreNextCenterClick = true;
    setTimeout(() => { ignoreNextCenterClick = false; }, 350);
  }

  resetTouch();
}, { passive: true });

function resetTouch() {
  touchStartY = null;
  touchStartX = null;
  touchStartedOnControl = false;
  touchStartTime = 0;
}

app.addEventListener('wheel', event => {
  if (state.screen !== 'feed' || wheelLock || event.target.closest('.progress-shell, .info-sheet, .search-drawer')) return;
  if (Math.abs(event.deltaY) < 35) return;
  wheelLock = true;
  event.deltaY > 0 ? nextVideo() : prevVideo();
  setTimeout(() => { wheelLock = false; }, 420);
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
  if (event.key === 'Escape') {
    if (state.showSearch) { state.showSearch = false; updateSearchVisibility(); }
    if (state.showInfo) { state.showInfo = false; updateInfoVisibility(); }
  }
});

rebuildPlaylist();
render();
