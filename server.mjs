import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8000);
const CATALOG_PATH = path.join(__dirname, 'src', 'discovered-data.js');

const MIME_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.csv', 'text/csv; charset=utf-8']
]);

createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === 'GET' && requestUrl.pathname === '/api/youtube-search') {
      await handleYouTubeSearch(requestUrl, response);
      return;
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/seen-video') {
      await handleSeenVideo(request, response);
      return;
    }

    if (requestUrl.pathname.startsWith('/api/')) {
      sendJson(response, 404, { error: 'API endpoint not found' });
      return;
    }

    await serveStatic(requestUrl, response);
  } catch (error) {
    console.error('LOOP server error:', error);
    sendJson(response, 500, { error: 'Internal server error' });
  }
}).listen(PORT, () => {
  console.log(`LOOP listo en http://localhost:${PORT}`);
  console.log('Busca en LOOP para leer resultados desde YouTube y guardar lo visto.');
});

async function handleYouTubeSearch(requestUrl, response) {
  const rawUrl = requestUrl.searchParams.get('url');
  const searchUrl = rawUrl ? new URL(rawUrl) : buildSearchUrl(requestUrl.searchParams.get('q') || '');

  if (searchUrl.hostname !== 'www.youtube.com' || searchUrl.pathname !== '/results') {
    sendJson(response, 400, { error: 'Expected a YouTube results URL' });
    return;
  }

  const term = searchUrl.searchParams.get('search_query')?.replace(/^"|"$/g, '') || '';
  const html = await fetchYouTubeHtml(searchUrl.toString());
  const initialData = extractInitialData(html);
  const videos = extractVideos(initialData, term, searchUrl.toString()).slice(0, 40);

  sendJson(response, 200, {
    searchUrl: searchUrl.toString(),
    term,
    videos
  });
}

async function handleSeenVideo(request, response) {
  const body = await readBody(request);
  const payload = JSON.parse(body || '{}');
  if (!payload.video?.video_id) {
    sendJson(response, 400, { error: 'Missing video.video_id' });
    return;
  }

  const topic = payload.topic || topicFromVideo(payload.video);
  const catalog = await readCatalog();
  catalog.topics = mergeByKey(catalog.topics || [], [topic], 'key');
  catalog.videos = mergeByKey(catalog.videos || [], [payload.video], 'video_id');
  await writeCatalog(catalog);

  sendJson(response, 200, {
    ok: true,
    topics: catalog.topics.length,
    videos: catalog.videos.length
  });
}

async function fetchYouTubeHtml(searchUrl) {
  const youtubeResponse = await fetch(searchUrl, {
    headers: {
      'accept-language': 'en-US,en;q=0.9,es;q=0.8',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36'
    }
  });

  if (!youtubeResponse.ok) {
    throw new Error(`YouTube returned ${youtubeResponse.status}`);
  }

  return youtubeResponse.text();
}

function buildSearchUrl(term) {
  const searchUrl = new URL('https://www.youtube.com/results');
  searchUrl.searchParams.set('search_query', `"${term}"`);
  searchUrl.searchParams.set('sp', 'EgIQCQ%3D%3D');
  return searchUrl;
}

function extractInitialData(html) {
  const marker = 'ytInitialData';
  const markerIndex = html.indexOf(marker);
  if (markerIndex === -1) throw new Error('ytInitialData not found');

  const firstBrace = html.indexOf('{', markerIndex);
  if (firstBrace === -1) throw new Error('ytInitialData object not found');

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = firstBrace; index < html.length; index += 1) {
    const char = html[index];

    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') inString = true;
    else if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(html.slice(firstBrace, index + 1));
      }
    }
  }

  throw new Error('Could not parse ytInitialData');
}

function extractVideos(initialData, term, searchUrl) {
  const videos = [];
  const seen = new Set();

  walk(initialData, value => {
    if (value.shortsLockupViewModel) {
      const video = videoFromShortsLockup(value.shortsLockupViewModel, term, searchUrl);
      if (!video || seen.has(video.video_id)) return;
      seen.add(video.video_id);
      videos.push(video);
      return;
    }

    const renderer = value.videoRenderer || value.reelItemRenderer || value.compactVideoRenderer;
    if (!renderer?.videoId || seen.has(renderer.videoId)) return;
    seen.add(renderer.videoId);

    const duration = textFrom(renderer.lengthText) || durationFromOverlays(renderer.thumbnailOverlays);
    const title = textFrom(renderer.title) || renderer.headline?.simpleText || 'YouTube video';
    const channel = textFrom(renderer.ownerText) || textFrom(renderer.longBylineText) || textFrom(renderer.shortBylineText) || 'YouTube';
    const views = parseViews(textFrom(renderer.viewCountText) || textFrom(renderer.shortViewCountText));

    videos.push({
      id: `youtube_${slugify(term)}-${renderer.videoId}`,
      video_id: renderer.videoId,
      title,
      url: `https://www.youtube.com/watch?v=${renderer.videoId}`,
      views,
      duration: toIsoDuration(duration),
      publishedAt: '',
      topic: term || 'YouTube Search',
      topicKey: `youtube_${slugify(term)}`,
      channel,
      quality: estimateQuality(views),
      usefulness: 72,
      summary: title,
      reason: `Resultado de la busqueda en YouTube para "${term}".`,
      source: 'youtube-results',
      sourceSearchTerm: term,
      sourceSearchUrl: searchUrl,
      discoveredAt: new Date().toISOString()
    });
  });

  return videos;
}

function videoFromShortsLockup(renderer, term, searchUrl) {
  const endpoint = renderer.onTap?.innertubeCommand?.reelWatchEndpoint;
  const videoId = endpoint?.videoId || renderer.entityId?.match(/([a-zA-Z0-9_-]{11})$/)?.[1];
  if (!videoId) return null;

  const accessibilityText = renderer.accessibilityText || '';
  const title = titleFromShortsAccessibility(accessibilityText) || 'YouTube Short';
  const views = parseViews(accessibilityText);

  return {
    id: `youtube_${slugify(term)}-${videoId}`,
    video_id: videoId,
    title,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    views,
    duration: '',
    publishedAt: '',
    topic: term || 'YouTube Search',
    topicKey: `youtube_${slugify(term)}`,
    channel: 'YouTube Shorts',
    quality: estimateQuality(views),
    usefulness: 72,
    summary: title,
    reason: `Resultado de la busqueda en YouTube para "${term}".`,
    source: 'youtube-results',
    sourceSearchTerm: term,
    sourceSearchUrl: searchUrl,
    discoveredAt: new Date().toISOString()
  };
}

function titleFromShortsAccessibility(value = '') {
  return value
    .replace(/,\s*[\d.,]+\s*(?:k|m|b|thousand|million|billion)?\s+views?\s+-\s+play\s+short$/i, '')
    .trim();
}

function walk(value, visit) {
  if (!value || typeof value !== 'object') return;
  visit(value);
  if (Array.isArray(value)) {
    value.forEach(item => walk(item, visit));
    return;
  }
  Object.values(value).forEach(item => walk(item, visit));
}

function textFrom(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value.simpleText) return value.simpleText;
  if (Array.isArray(value.runs)) return value.runs.map(run => run.text || '').join('');
  return '';
}

function durationFromOverlays(overlays = []) {
  for (const overlay of overlays) {
    const text = textFrom(overlay.thumbnailOverlayTimeStatusRenderer?.text);
    if (text) return text;
  }
  return '';
}

function parseViews(value = '') {
  const normalized = value.toLowerCase().replace(/views?|visualizaciones/g, '').trim();
  const numberText = normalized.match(/\d[\d.,]*/)?.[0];
  if (!numberText) return '';
  const suffix = normalized.includes('billion') || normalized.includes(' b') ? 1000000000
    : normalized.includes('million') || normalized.includes(' m') || /\d[\d.,]*m\b/.test(normalized) ? 1000000
      : normalized.includes('thousand') || normalized.includes(' k') || /\d[\d.,]*k\b/.test(normalized) ? 1000
        : 1;
  const number = Number(numberText.replace(/,/g, '.'));
  if (!Number.isFinite(number)) return '';
  return String(Math.round(number * suffix));
}

function toIsoDuration(value = '') {
  const parts = value.split(':').map(part => Number(part.trim()));
  if (!parts.length || parts.some(part => !Number.isFinite(part))) return '';
  let seconds = 0;
  parts.forEach(part => { seconds = seconds * 60 + part; });
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return `PT${hours ? `${hours}H` : ''}${minutes ? `${minutes}M` : ''}${rest || (!hours && !minutes) ? `${rest}S` : ''}`;
}

function estimateQuality(views) {
  const number = Number(views || 0);
  if (number >= 10000000) return 82;
  if (number >= 1000000) return 76;
  if (number >= 100000) return 72;
  return 68;
}

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'youtube_search';
}

function topicFromVideo(video) {
  return {
    key: video.topicKey || `youtube_${slugify(video.sourceSearchTerm || video.topic || 'search')}`,
    label: video.topic || video.sourceSearchTerm || 'YouTube Search',
    file: 'discovered-data.js',
    description: `Videos vistos desde ${video.source || 'LOOP'}.`
  };
}

function mergeByKey(existing, incoming, keyName) {
  const byKey = new Map();
  [...existing, ...incoming].filter(Boolean).forEach(item => {
    const key = item[keyName] || item.id;
    if (!key) return;
    byKey.set(key, { ...(byKey.get(key) || {}), ...item });
  });
  return [...byKey.values()];
}

async function readCatalog() {
  if (!existsSync(CATALOG_PATH)) return { topics: [], videos: [] };
  const source = await readFile(CATALOG_PATH, 'utf8');
  const json = source.match(/window\.LOOP_DISCOVERED\s*=\s*(\{[\s\S]*\});?\s*$/)?.[1];
  if (!json) return { topics: [], videos: [] };
  return JSON.parse(json);
}

async function writeCatalog(catalog) {
  const source = `window.LOOP_DISCOVERED = ${JSON.stringify(catalog, null, 2)};\n`;
  await writeFile(CATALOG_PATH, source, 'utf8');
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function serveStatic(requestUrl, response) {
  const cleanPath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '') || 'index.html';
  const resolvedPath = path.resolve(__dirname, cleanPath);

  if (!resolvedPath.startsWith(__dirname)) {
    sendText(response, 403, 'Forbidden');
    return;
  }

  const filePath = existsSync(resolvedPath) ? resolvedPath : path.join(__dirname, 'index.html');
  const extension = path.extname(filePath);
  const body = await readFile(filePath);
  response.writeHead(200, {
    'content-type': MIME_TYPES.get(extension) || 'application/octet-stream',
    'cache-control': 'no-store'
  });
  response.end(body);
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, status, payload) {
  response.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
  response.end(payload);
}
