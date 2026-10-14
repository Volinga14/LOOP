// Read-only regression probes for the first review. No external video APIs are called.
import fs from 'node:fs';
import vm from 'node:vm';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const results = [];
const report = (name, observation) => results.push({ name, observation });
for (const name of ['src/app.js', 'src/data.js', 'src/discovered-data.js', 'src/config.js', 'service-worker.js', 'server.mjs']) {
  const check = spawnSync(process.execPath, ['--check', path.join(root, name)], { encoding: 'utf8' });
  report(`Syntax: ${name}`, check.status === 0 ? 'OK' : check.error?.message || check.stderr);
}
JSON.parse(read('manifest.webmanifest'));
report('Manifest JSON', 'OK');

function appContext() {
  const handlers = {};
  const element = { innerHTML: '', addEventListener() {}, classList: { toggle() {} } };
  const sandbox = {
    window: { addEventListener() {}, LOOP_CONFIG: {} },
    navigator: {},
    document: { querySelector: () => element, addEventListener: (type, fn) => { handlers[type] = fn; } },
    localStorage: { getItem: () => null, setItem() {} },
    URL, AbortController, console, setTimeout, clearTimeout, setInterval, clearInterval
  };
  const context = vm.createContext(sandbox);
  for (const name of ['src/data.js', 'src/discovered-data.js', 'src/app.js']) vm.runInContext(read(name), context);
  vm.runInContext('var auditFeedRenders = 0; renderFeed = () => {auditFeedRenders++;}; renderIntro = () => {}; showToast = () => {};', context);
  return { context, handlers, element };
}
const { context, handlers } = appContext();
const evaluate = code => vm.runInContext(code, context);
report('Dataset', evaluate(`({base: window.LOOP_VIDEOS.length, discovered: window.LOOP_DISCOVERED.videos.length, unique: allVideos.length, topics: allTopics.length, invalidIds: allVideos.filter(v => !/^[a-zA-Z0-9_-]{11}$/.test(v.video_id)).length, missingTopics: allVideos.filter(v => !topicByKey(v.topicKey)).length, over180s: allVideos.filter(v => {const m = v.duration.match(/^PT(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+)S)?$/); return m && (+m[1] * 3600 || 0) + (+m[2] * 60 || 0) + (+m[3] || 0) > 180;}).length})`));
report('Search without a match', evaluate(`({exact: localSearchVideos('zzzz_no_match_987654', buildYouTubeSearchUrl('zzzz_no_match_987654')).length, fallback: fallbackSearchVideos('zzzz_no_match_987654', buildYouTubeSearchUrl('zzzz_no_match_987654')).length})`));
report('Category counts', evaluate(`Object.fromEntries(allTopics.map(t => [t.key, allVideos.filter(v => v.topicKey === t.key).length]))`));
report('Feedback identity across searches', evaluate(`(() => {const v = allVideos[0]; state.feedback[v.video_id] = {vote:'more'}; const result = normalizeSearchVideo({...v, id:'search-' + v.video_id}, 'space', buildYouTubeSearchUrl('space')); return {sameVideo: v.video_id === result.video_id, original: feedbackText(v), search: feedbackText(result)};})()`));
evaluate(`state.screen = 'feed'; state.index = 0;`);
const before = evaluate('state.index');
handlers.keydown({ key: 'ArrowDown', target: { tagName: 'TEXTAREA', isContentEditable: false }, preventDefault() {} });
report('ArrowDown while editing a comment', { before, after: evaluate('state.index') });
evaluate(`localStorage.setItem = () => {throw new Error('QuotaExceededError');};`);
try { evaluate('persistState()'); report('Storage failure', 'Handled'); }
catch (error) { report('Storage failure', error.message); }
evaluate(`localStorage.setItem = () => {};`);

const race = appContext().context;
vm.runInContext(`var finishSearch; fetchYouTubeSearch = () => new Promise(resolve => {finishSearch = resolve;});`, race);
const pendingSearch = vm.runInContext(`runSearch('old search')`, race);
vm.runInContext(`goHome(); finishSearch({videos: [allVideos[0]], nextPage: ''});`, race);
await pendingSearch;
report('Search completing after returning home', vm.runInContext(`({screen: state.screen, resultsApplied: state.searchResults.length, feedRenders: auditFeedRenders})`, race));
vm.runInContext(`state.mode = 'search'; state.activeSearch = 'old'; state.activeSearchUrl = buildYouTubeSearchUrl('old'); state.activeSearchNextPage = 'page2'; var finishPage; fetchPublicYouTubeSearch = () => new Promise(resolve => {finishPage = resolve;});`, race);
const pendingPage = vm.runInContext('loadMoreSearchResults()', race);
vm.runInContext(`chooseTopic('biology'); finishPage({videos: [{id: 'old_result', video_id: 'abcdefghijk'}], nextPage: ''});`, race);
await pendingPage;
report('Pagination completing after category switch', vm.runInContext(`({mode: state.mode, contaminated: state.playlist.some(v => v.id === 'old_result')})`, race));

const swHandlers = {};
const matches = [];
const sw = vm.createContext({
  self: { registration: {scope: 'http://localhost/'}, location: { origin: 'http://localhost' }, addEventListener: (type, fn) => {swHandlers[type] = fn;} },
  URL,
  caches: { match: async request => {matches.push(typeof request === 'string' ? request : request.url); return undefined;} },
  fetch: async () => {throw new Error('Offline');}
});
vm.runInContext(read('service-worker.js'), sw);
let swResponse;
swHandlers.fetch({ request: {method: 'GET', url: 'http://localhost/api/youtube-search?q=test'}, respondWith(promise) {swResponse = promise;} });
await swResponse;
report('Service worker API offline fallback', matches);
const cachedAssets = vm.runInContext('CORE_ASSETS', sw);
const scripts = [...read('index.html').matchAll(/<script src="([^"]+)"/g)].map(match => match[1]);
report('HTML scripts missing from exact precache URLs', scripts.filter(src => !cachedAssets.includes(src)));

// Discover the OS-assigned port from the listening process via an isolated launcher.
const launcher = `const {server} = await import('./server.mjs'); server.listen(0, '127.0.0.1', () => console.log('AUDIT_PORT=' + server.address().port));`;
const probeServer = spawn(process.execPath, ['--input-type=module', '-e', launcher], {cwd: root, env: {...process.env, PORT: '0'}, stdio: ['ignore', 'pipe', 'pipe']});
try {
  const port = await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error('Server startup timeout')), 5000);
    probeServer.stdout.on('data', chunk => {output += chunk; const match = output.match(/AUDIT_PORT=(\d+)/); if (match) {clearTimeout(timeout); resolve(match[1]);}});
    probeServer.on('error', error => {clearTimeout(timeout); reject(error);});
    probeServer.on('exit', code => {clearTimeout(timeout); reject(new Error(`Server exited: ${code}`));});
  });
  for (const route of ['/', '/src/app.js', '/not-found.js', '/.git/HEAD', '/server.mjs']) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`);
    report(`HTTP GET ${route}`, {status: response.status, type: response.headers.get('content-type')});
    await response.arrayBuffer();
  }
} finally {
  probeServer.kill();
  await once(probeServer, 'exit');
}
console.log(JSON.stringify(results, null, 2));
