const videos = window.LOOP_VIDEOS || [];
const app = document.querySelector('#app');
const dialog = document.querySelector('#comment-dialog');
const commentInput = document.querySelector('#comment-input');
const commentTitle = document.querySelector('#comment-video-title');
const saveCommentBtn = document.querySelector('#save-comment-btn');

const state = {
  screen: 'intro',
  activeTopic: 'Todo',
  index: 0,
  feedback: JSON.parse(localStorage.getItem('loopFeedback') || '{}')
};

function topics() {
  return ['Todo', ...new Set(videos.map(video => video.topic))];
}

function filteredVideos() {
  if (state.activeTopic === 'Todo') return videos;
  return videos.filter(video => video.topic === state.activeTopic);
}

function saveFeedback() {
  localStorage.setItem('loopFeedback', JSON.stringify(state.feedback));
}

function durationSeconds(duration) {
  const match = String(duration).match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration;
  const minutes = Number(match[1] || 0);
  const seconds = Number(match[2] || 0);
  return `${minutes * 60 + seconds}s`;
}

function getVideo() {
  const list = filteredVideos();
  if (!list.length) return null;
  state.index = Math.max(0, Math.min(state.index, list.length - 1));
  return list[state.index];
}

function renderIntro() {
  app.innerHTML = `
    <section class="intro-screen">
      <div class="intro-glow"></div>
      <header class="topbar">
        <div class="brand-lockup"><span class="brand-mark">∞</span><span class="brand-name">LOOP</span></div>
        <span class="prototype-pill">MVP visual</span>
      </header>
      <section class="hero-card">
        <p class="eyebrow">Scroll educativo · Datos seed antiguos</p>
        <h1>Aprende deslizando vídeos cortos.</h1>
        <p class="hero-copy">LOOP convierte el hábito de ver reels en una experiencia de microaprendizaje filtrada, estructurada y útil.</p>
        <div class="hero-actions">
          <button class="primary-btn" data-action="start">Entrar en LOOP</button>
          <button class="ghost-btn" data-action="demo">Ver demo directa</button>
        </div>
      </section>
      <section class="topic-panel">
        <div class="section-heading"><p class="eyebrow">Elige un interés</p><h2>Tu feed empieza por un tema</h2></div>
        <div class="topic-grid">
          ${topics().map(topic => `<button class="topic-card" data-topic="${topic}"><strong>${topic}</strong><span>${topic === 'Todo' ? videos.length : videos.filter(v => v.topic === topic).length} vídeos</span></button>`).join('')}
        </div>
      </section>
      <section class="intro-stats">
        <article><strong>${videos.length}</strong><span>vídeos de prueba</span></article>
        <article><strong>${topics().length - 1}</strong><span>categorías</span></article>
        <article><strong>Swipe</strong><span>arriba / abajo</span></article>
      </section>
    </section>`;
}

function videoEmbed(video) {
  if (!video?.video_id) {
    return '<div class="video-fallback">Vídeo no disponible</div>';
  }
  return `<iframe src="https://www.youtube-nocookie.com/embed/${video.video_id}?rel=0&modestbranding=1&playsinline=1" title="${video.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
}

function feedbackText(video) {
  const item = state.feedback[video.id];
  if (!item) return 'Sin feedback todavía.';
  const parts = [];
  if (item.vote) parts.push(`voto: ${item.vote}`);
  if (item.comment) parts.push(`comentario: ${item.comment}`);
  return parts.join(' · ');
}

function renderFeed() {
  const list = filteredVideos();
  const video = getVideo();
  if (!video) {
    app.innerHTML = '<section class="empty-screen"><h1>No hay vídeos para este tema.</h1><button class="primary-btn" data-action="back">Volver</button></section>';
    return;
  }

  app.innerHTML = `
    <section class="feed-screen">
      <aside class="feed-sidebar">
        <button class="icon-btn" data-action="back" aria-label="Volver">←</button>
        <div class="mini-brand"><span class="brand-mark">∞</span><span>LOOP</span></div>
        <div class="feed-progress"><span>${state.index + 1}</span><i></i><span>${list.length}</span></div>
      </aside>
      <section class="phone-stage">
        <div class="phone-frame">
          <div class="feed-header">
            <button class="chip-btn" data-action="topic">Tema: ${state.activeTopic}</button>
            <button class="chip-btn" data-action="reset-feedback">Reset feedback</button>
          </div>
          <article class="reel-card">
            <div class="video-box">${videoEmbed(video)}</div>
            <div class="reel-gradient"></div>
            <div class="reel-info">
              <span class="topic-badge">${video.topic}</span>
              <h1>${video.title}</h1>
              <p>${video.summary}</p>
              <div class="meta-row"><span>${video.channel}</span><span>${durationSeconds(video.duration)}</span><span>${Number(video.views || 0).toLocaleString('es-ES')} views</span></div>
            </div>
            <button class="nav-zone top" data-action="prev" aria-label="Vídeo anterior"></button>
            <button class="nav-zone bottom" data-action="next" aria-label="Siguiente vídeo"></button>
          </article>
          <div class="feed-controls">
            <button class="control-btn" data-action="less">Menos</button>
            <button class="control-btn" data-action="comment">Comentario</button>
            <button class="control-btn danger" data-action="trash">Trash</button>
            <button class="control-btn positive" data-action="more">Más</button>
          </div>
        </div>
      </section>
      <aside class="learning-panel">
        <p class="eyebrow">Filtro LOOP</p>
        <h2>${video.title}</h2>
        <p>${video.summary}</p>
        <dl class="score-list">
          <div><dt>Calidad</dt><dd>${video.quality}</dd></div>
          <div><dt>Utilidad</dt><dd>${video.usefulness}</dd></div>
          <div><dt>Duración</dt><dd>${durationSeconds(video.duration)}</dd></div>
        </dl>
        <div class="panel-block"><span class="panel-label">Por qué aparece</span><p>${video.reason}</p></div>
        <div class="panel-block"><span class="panel-label">Feedback guardado</span><p>${feedbackText(video)}</p></div>
      </aside>
    </section>`;
}

function render() {
  state.screen === 'intro' ? renderIntro() : renderFeed();
}

function setVote(vote) {
  const video = getVideo();
  if (!video) return;
  state.feedback[video.id] = { ...(state.feedback[video.id] || {}), vote, at: new Date().toISOString() };
  saveFeedback();
  nextVideo();
}

function nextVideo() {
  const list = filteredVideos();
  state.index = (state.index + 1) % list.length;
  renderFeed();
}

function prevVideo() {
  const list = filteredVideos();
  state.index = (state.index - 1 + list.length) % list.length;
  renderFeed();
}

function openComment() {
  const video = getVideo();
  if (!video) return;
  commentTitle.textContent = video.title;
  commentInput.value = state.feedback[video.id]?.comment || '';
  dialog.showModal();
}

saveCommentBtn.addEventListener('click', event => {
  event.preventDefault();
  const video = getVideo();
  if (!video) return;
  state.feedback[video.id] = { ...(state.feedback[video.id] || {}), comment: commentInput.value.trim(), at: new Date().toISOString() };
  saveFeedback();
  dialog.close();
  renderFeed();
});

app.addEventListener('click', event => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  const topic = event.target.closest('[data-topic]')?.dataset.topic;
  if (topic) {
    state.activeTopic = topic;
    state.index = 0;
    state.screen = 'feed';
    renderFeed();
    return;
  }
  if (!action) return;
  if (action === 'start' || action === 'demo') { state.screen = 'feed'; state.index = 0; renderFeed(); }
  if (action === 'back') { state.screen = 'intro'; renderIntro(); }
  if (action === 'next') nextVideo();
  if (action === 'prev') prevVideo();
  if (action === 'more') setVote('more');
  if (action === 'less') setVote('less');
  if (action === 'trash') setVote('trash');
  if (action === 'comment') openComment();
  if (action === 'topic') { state.screen = 'intro'; renderIntro(); }
  if (action === 'reset-feedback') { state.feedback = {}; saveFeedback(); renderFeed(); }
});

let touchStartY = null;
app.addEventListener('touchstart', event => { touchStartY = event.touches[0].clientY; }, { passive: true });
app.addEventListener('touchend', event => {
  if (state.screen !== 'feed' || touchStartY === null) return;
  const delta = event.changedTouches[0].clientY - touchStartY;
  if (Math.abs(delta) > 60) delta < 0 ? nextVideo() : prevVideo();
  touchStartY = null;
}, { passive: true });

document.addEventListener('keydown', event => {
  if (state.screen !== 'feed') return;
  if (event.key === 'ArrowDown') nextVideo();
  if (event.key === 'ArrowUp') prevVideo();
});

render();
