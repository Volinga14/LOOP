const videos = window.LOOP_VIDEOS || [];
const app = document.querySelector('#app');
const dialog = document.querySelector('#comment-dialog');
const commentInput = document.querySelector('#comment-input');
const commentTitle = document.querySelector('#comment-video-title');
const saveCommentBtn = document.querySelector('#save-comment-btn');

const STORAGE_KEY = 'loopFeedback';
const LAST_STATE_KEY = 'loopLastState';

const state = {
  screen: 'intro',
  activeTopic: 'Todo',
  index: 0,
  showInfo: false,
  toast: '',
  feedback: JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
};

try {
  const lastState = JSON.parse(localStorage.getItem(LAST_STATE_KEY) || '{}');
  if (lastState.activeTopic) state.activeTopic = lastState.activeTopic;
  if (Number.isInteger(lastState.index)) state.index = lastState.index;
} catch (error) {
  console.warn('LOOP: could not restore last state', error);
}

function persistState() {
  localStorage.setItem(LAST_STATE_KEY, JSON.stringify({ activeTopic: state.activeTopic, index: state.index }));
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

function embedUrl(video, autoplay = true) {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    controls: '0',
    mute: '1'
  });
  if (autoplay) params.set('autoplay', '1');
  return `https://www.youtube-nocookie.com/embed/${video.video_id}?${params.toString()}`;
}

function feedbackText(video) {
  const item = state.feedback[video.id];
  if (!item) return 'Sin feedback';
  const labels = { more: 'Más contenido similar', less: 'Menos contenido similar', trash: 'Descartado' };
  if (item.comment && item.vote) return `${labels[item.vote] || item.vote} · Comentado`;
  if (item.comment) return 'Comentado';
  return labels[item.vote] || 'Guardado';
}

function renderIntro() {
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
    app.innerHTML = `<section class="empty-screen"><h1>No hay vídeos para este tema.</h1><button class="main-cta" data-action="back">Volver</button></section>`;
    return;
  }

  const next = list[(state.index + 1) % list.length];
  const feedback = feedbackText(video);

  app.innerHTML = `
    <section class="shorts-screen">
      <article class="short-card">
        <iframe class="short-player" src="${embedUrl(video)}" title="${video.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
        ${next ? `<iframe class="preload-player" src="${embedUrl(next, false)}" title="Preload next video" tabindex="-1" aria-hidden="true"></iframe>` : ''}

        <div class="shade top-shade"></div>
        <div class="shade bottom-shade"></div>

        <header class="short-topbar">
          <button class="glass-icon" data-action="back" aria-label="Volver">‹</button>
          <button class="loop-mini" data-action="home" aria-label="LOOP inicio"><span class="loop-logo small">∞</span><strong>LOOP</strong></button>
          <button class="glass-icon" data-action="toggle-info" aria-label="Información">i</button>
        </header>

        <div class="tap-zone up" data-action="prev" aria-label="Vídeo anterior"></div>
        <div class="tap-zone down" data-action="next" aria-label="Siguiente vídeo"></div>

        <aside class="action-rail" aria-label="Acciones de feedback">
          <button class="rail-btn positive" data-action="more"><span>＋</span><small>Más</small></button>
          <button class="rail-btn" data-action="less"><span>−</span><small>Menos</small></button>
          <button class="rail-btn" data-action="comment"><span>💬</span><small>Comentar</small></button>
          <button class="rail-btn danger" data-action="trash"><span>⌫</span><small>Trash</small></button>
          <button class="rail-btn" data-action="toggle-info"><span>?</span><small>Info</small></button>
        </aside>

        <section class="short-copy">
          <div class="video-meta-line">
            <span class="topic-dot">${video.topic}</span>
            <span>${durationSeconds(video.duration)}</span>
            <span>${formatViews(video.views)} views</span>
          </div>
          <h1>${video.title}</h1>
          <p>${video.summary}</p>
          <div class="source-line">
            <span>@${video.channel || 'Unknown'}</span>
            <span>${feedback}</span>
          </div>
        </section>

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

        ${state.toast ? `<div class="toast">${state.toast}</div>` : ''}
      </article>
    </section>`;
}

function render() {
  state.screen === 'intro' ? renderIntro() : renderFeed();
}

function setVote(vote) {
  const video = currentVideo();
  if (!video) return;
  state.feedback[video.id] = { ...(state.feedback[video.id] || {}), vote, at: new Date().toISOString() };
  saveFeedback();
  state.toast = vote === 'trash' ? 'Vídeo descartado' : 'Feedback guardado';
  renderFeed();
  setTimeout(() => {
    state.toast = '';
    nextVideo();
  }, 450);
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
  state.toast = 'Comentario guardado';
  renderFeed();
  setTimeout(() => { state.toast = ''; renderFeed(); }, 900);
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
  if (action === 'next') nextVideo();
  if (action === 'prev') prevVideo();
  if (action === 'more') setVote('more');
  if (action === 'less') setVote('less');
  if (action === 'trash') setVote('trash');
  if (action === 'comment') openComment();
  if (action === 'toggle-info') { state.showInfo = !state.showInfo; renderFeed(); }
});

let touchStartY = null;
let touchStartX = null;
app.addEventListener('touchstart', event => {
  touchStartY = event.touches[0].clientY;
  touchStartX = event.touches[0].clientX;
}, { passive: true });

app.addEventListener('touchend', event => {
  if (state.screen !== 'feed' || touchStartY === null || touchStartX === null) return;
  const dy = event.changedTouches[0].clientY - touchStartY;
  const dx = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dy) > 58 && Math.abs(dy) > Math.abs(dx)) dy < 0 ? nextVideo() : prevVideo();
  touchStartY = null;
  touchStartX = null;
}, { passive: true });

let wheelLock = false;
app.addEventListener('wheel', event => {
  if (state.screen !== 'feed' || wheelLock) return;
  if (Math.abs(event.deltaY) < 30) return;
  wheelLock = true;
  event.deltaY > 0 ? nextVideo() : prevVideo();
  setTimeout(() => { wheelLock = false; }, 650);
}, { passive: true });

document.addEventListener('keydown', event => {
  if (state.screen !== 'feed') return;
  if (event.key === 'ArrowDown' || event.key === 'PageDown') nextVideo();
  if (event.key === 'ArrowUp' || event.key === 'PageUp') prevVideo();
  if (event.key.toLowerCase() === 'm') setVote('more');
  if (event.key.toLowerCase() === 'l') setVote('less');
  if (event.key.toLowerCase() === 'c') openComment();
  if (event.key === 'Escape' && state.showInfo) { state.showInfo = false; renderFeed(); }
});

render();
