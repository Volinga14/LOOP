import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { server } from '../server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
let passed = 0;
async function test(name, run) {
  await run();
  passed++;
  console.log(`OK ${name}`);
}

function makeApp(stored = {}, options = {}) {
  const nodes = new Map();
  const documentHandlers = {};
  const timers = new Map();
  let nextTimer = 0;
  function node(selector) {
    if (!nodes.has(selector)) nodes.set(selector, {
      innerHTML: '', textContent: '', value: '', open: false, hidden: true, handlers: {},
      classList: { toggle() {} }, addEventListener(type, callback) {this.handlers[type] = callback;},
      setAttribute() {}, appendChild() {}, remove() {}, focus() {},
      showModal() {this.open = true;}, close() {this.open = false; this.handlers.close?.();},
      querySelector: node
    });
    return nodes.get(selector);
  }
  const sandbox = {
    window: {addEventListener() {}, LOOP_CONFIG: {}}, navigator: {},
    document: {querySelector: node, getElementById: node, createElement: node, head: node('head'),
      addEventListener: (name, fn) => {documentHandlers[name] = fn;}},
    localStorage: {getItem: key => stored[key] ?? null, setItem: (key, value) => {stored[key] = value;}},
    URL, AbortController,
    console: {warn() {}},
    setTimeout: (fn, delay) => {const id = ++nextTimer; timers.set(id, {fn, delay}); return id;},
    clearTimeout: id => timers.delete(id), setInterval: () => 0, clearInterval() {}
  };
  const context = vm.createContext(sandbox);
  const evaluate = code => vm.runInContext(code, context);
  for (const file of ['src/data.js', 'src/discovered-data.js']) evaluate(read(file));
  if (options.setup) evaluate(options.setup);
  evaluate(read('src/app.js'));
  evaluate('var feedRenders = 0; renderFeed = () => {feedRenders++;}; renderIntro = () => {}; showToast = () => {};');
  return {context, evaluate, node, timers, documentHandlers, stored};
}

await test('No matches return an empty result, never random videos', () => {
  const {evaluate} = makeApp();
  assert.equal(evaluate(`fallbackSearchVideos('zzzz_no_match_987654', buildYouTubeSearchUrl('zzzz_no_match_987654')).length`), 0);
});
await test('Local fallback preserves original categories and reports its source', () => {
  const {evaluate} = makeApp();
  assert.equal(evaluate(`fallbackSearchVideos('space', buildYouTubeSearchUrl('space')).every(v => v.source === 'local-catalog' && v.topicKey === v.sourceOriginalTopicKey)`), true);
  assert.ok(evaluate(`fallbackSearchVideos('space', buildYouTubeSearchUrl('space')).length`) > 0);
});
await test('Search results arriving after home do not render or apply', async () => {
  const {evaluate} = makeApp();
  evaluate('var finish; fetchYouTubeSearch = () => new Promise(resolve => {finish = resolve;});');
  const pending = evaluate(`runSearch('old')`);
  evaluate(`goHome(); finish({videos: [allVideos[0]]});`);
  await pending;
  assert.equal(evaluate('state.screen'), 'intro');
  assert.equal(evaluate('state.searchResults.length'), 0);
  assert.equal(evaluate('feedRenders'), 1);
});
await test('A newer search owns results and loading state', async () => {
  const {evaluate} = makeApp();
  evaluate('var finishes = {}; fetchYouTubeSearch = term => new Promise(resolve => {finishes[term] = resolve;});');
  const old = evaluate(`runSearch('old')`);
  const recent = evaluate(`runSearch('recent')`);
  evaluate(`finishes.old({videos:[allVideos[0]]});`);
  await old;
  assert.equal(evaluate('state.searchLoading'), true);
  evaluate(`finishes.recent({videos:[allVideos[1]]});`);
  await recent;
  assert.equal(evaluate('state.searchResults[0].video_id === allVideos[1].video_id'), true);
  assert.equal(evaluate('state.searchLoading'), false);
});
await test('Pagination cannot contaminate a new category', async () => {
  const {evaluate} = makeApp();
  evaluate(`state.screen='feed'; state.mode='search'; state.activeSearch='old'; state.activeSearchNextPage='page2'; var finish; fetchPublicYouTubeSearch=()=>new Promise(resolve=>{finish=resolve;});`);
  const pending = evaluate('loadMoreSearchResults()');
  evaluate(`chooseTopic('biology'); finish({videos:[{id:'old',video_id:'abcdefghijk'}],nextPage:'page3'});`);
  await pending;
  assert.equal(evaluate(`state.playlist.every(v => v.topicKey === 'biology')`), true);
  assert.equal(evaluate('state.activeSearchNextPage'), '');
});
await test('Typing or an open comment dialog cannot trigger shortcuts', () => {
  const {evaluate, documentHandlers, node} = makeApp();
  evaluate(`state.screen='feed'; state.index=0;`);
  for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A']) {
    for (const key of ['ArrowDown', ' ', 'm', 'c']) documentHandlers.keydown({key, target: {tagName}, preventDefault() {}});
  }
  node('#comment-dialog').open = true;
  documentHandlers.keydown({key:'ArrowDown', target: {tagName:'BODY'}, preventDefault() {}});
  assert.equal(evaluate('state.index'), 0);
});
await test('A comment is saved to the video selected when opening the dialog', () => {
  const {evaluate, node} = makeApp();
  evaluate(`state.screen='feed'; state.index=0; openComment(); var original=commentVideoId; state.index=1;`);
  node('#comment-input').value = 'A useful explanation';
  node('#save-comment-btn').handlers.click({preventDefault() {}});
  assert.equal(evaluate('state.feedback[original].comment'), 'A useful explanation');
  assert.equal(evaluate('state.feedback[currentVideo().video_id]'), undefined);
});
await test('Legacy feedback migrates to a stable video ID across searches', () => {
  const stored = {'loopFeedback.v3': JSON.stringify({'astronomy-0-7nNoAaeZQoI': {vote:'more', comment:'Keep this',at:'2026-01-01'}})};
  const {evaluate} = makeApp(stored);
  assert.equal(evaluate(`feedbackText({id:'another-search',video_id:'7nNoAaeZQoI'})`), 'Más contenido similar · Comentado');
  evaluate('saveFeedback()');
  assert.equal(JSON.parse(stored['loopFeedback.v4'])['7nNoAaeZQoI'].comment, 'Keep this');
});
await test('Malformed storage data does not prevent startup', () => {
  for (const raw of ['null', '[]', '7', '{broken', '{"topics":null,"videos":null}']) {
    const {evaluate} = makeApp({'loopFeedback.v4':raw,'loopLastState.v3':raw,'loopViewedCatalog.v1':raw});
    assert.ok(evaluate('allVideos.length') > 0);
  }
});
await test('Storage write failures preserve session operation and return false', () => {
  const {evaluate} = makeApp();
  evaluate(`localStorage.setItem=()=>{throw new Error('quota exceeded');}; persistState(); saveViewedLocally(allVideos[0], allTopics[0]);`);
  assert.equal(evaluate('saveFeedback()'), false);
});
await test('Discovered videos and categories survive a browser restart', () => {
  const stored = {'loopViewedCatalog.v1':JSON.stringify({topics:[{key:'test_topic',label:'Test'}],videos:[{id:'test',video_id:'abcdefghijk',title:'Test',topicKey:'test_topic'}]})};
  const {evaluate} = makeApp(stored);
  assert.equal(evaluate(`allVideos.some(v => v.video_id==='abcdefghijk') && !!topicByKey('test_topic')`), true);
});
await test('Known long videos and malformed video IDs are excluded from remote search', () => {
  const {evaluate} = makeApp();
  assert.equal(evaluate(`playableSearchVideos([{video_id:'abcdefghijk',duration:'PT4M'}, {video_id:'invalid',duration:'PT1M'}, {video_id:'12345678901',duration:'PT3M'}]).length`), 1);
});
await test('Hidden panels are inert and search fields have accessible labels', () => {
  const {evaluate} = makeApp();
  evaluate(`state.screen='feed'; mountPlayer=()=>{};`);
  // Render the actual implementation in a separate fresh VM, without loading YouTube.
  evaluate(read('src/app.js').slice(read('src/app.js').indexOf('function renderFeed()'), read('src/app.js').indexOf('function render()')));
  evaluate('renderFeed()');
  assert.match(evaluate('app.innerHTML'), /aria-hidden="true" inert/);
  assert.match(evaluate('app.innerHTML'), /aria-label="Buscar un tema"/);
});
await test('Blocked YouTube API rejects and can be retried', async () => {
  const {evaluate, node} = makeApp();
  const first = evaluate('ensureYouTubeApi()');
  node('script').onerror();
  await assert.rejects(first, /unavailable/);
  assert.equal(evaluate('ytApiPromise'), null);
  const retry = evaluate('ensureYouTubeApi()');
  evaluate('window.YT={Player:function(){}}; window.onYouTubeIframeAPIReady();');
  await retry;
});
await test('YouTube API loading has a timeout', async () => {
  const {evaluate, timers} = makeApp();
  const pending = evaluate('ensureYouTubeApi()');
  [...timers.values()].find(timer => timer.delay===10000).fn();
  await assert.rejects(pending, /unavailable/);
});
await test('Errors from destroyed players cannot affect the current player', async () => {
  const {evaluate, node} = makeApp();
  evaluate(`state.screen='feed'; var options; window.YT={Player:function(id, settings){options=settings; this.destroy=()=>{};},PlayerState:{}};`);
  await evaluate('mountPlayer(currentVideo())');
  evaluate('destroyPlayer(); options.events.onError({data:100});');
  assert.equal(node('[data-player-error]').hidden, true);
});

function makeWorker() {
  const handlers = {};
  const puts = [];
  const deletions = [];
  const cached = new Map();
  const scope = 'https://example.test/LOOP/';
  const context = vm.createContext({URL, Response,
    self: {registration:{scope},location:{origin:'https://example.test'},clients:{claim:async()=>{}},skipWaiting:async()=>{},addEventListener:(type, fn)=>{handlers[type]=fn;}},
    caches:{open:async()=>({match:async request=>cached.get(typeof request==='string'?request:request.url),put:async(request)=>{puts.push(request.url);},addAll:async()=>{}}),
      keys:async()=>['unrelated-app', 'loop-%2FLOOP%2F-v7', 'loop-%2FOTHER%2F-v7'],delete:async name=>{deletions.push(name);}},
    fetch:async()=>new Response('fresh', {headers:{'content-type':'text/javascript'}})
  });
  vm.runInContext(read('service-worker.js'), context);
  async function request(relative, mode='cors') {
    let pending;
    const waits=[];
    handlers.fetch({request:{method:'GET',url:new URL(relative,scope).href,mode},respondWith:value=>{pending=value;},waitUntil:value=>waits.push(value)});
    const result=await pending;
    await Promise.all(waits);
    return result;
  }
  return {context, handlers, cached, puts, deletions, request};
}
await test('PWA precache matches the exact script and stylesheet URLs', () => {
  const {context}=makeWorker();
  const assets=vm.runInContext('CORE_ASSETS',context);
  for (const match of read('index.html').matchAll(/(?:src|href)="([^"]+\.(?:js|css)\?v=\d+)"/g)) assert.ok(assets.includes(match[1]), match[1]);
});
await test('PWA leaves APIs and other applications untouched', async () => {
  const {request,handlers,deletions}=makeWorker();
  assert.equal(await request('./api/youtube-search?q=test'), undefined);
  assert.equal(await request('/OTHER/index.html','navigate'), undefined);
  let pending; handlers.activate({waitUntil:value=>{pending=value;}}); await pending;
  assert.deepEqual(deletions,['loop-%2FLOOP%2F-v7']);
});
await test('PWA refreshes cached assets online and uses exact cached assets offline', async () => {
  const {context,request,cached,puts}=makeWorker();
  cached.set('https://example.test/LOOP/src/app.js?v=8',new Response('old'));
  assert.equal(await (await request('./src/app.js?v=8')).text(),'fresh');
  assert.equal(puts.length,1);
  vm.runInContext(`fetch=async()=>{throw new Error('offline');}`,context);
  assert.equal(await (await request('./src/app.js?v=8')).text(),'old');
});
await test('PWA uses HTML fallback only for navigation and never caches error responses', async () => {
  const {context,request,cached,puts}=makeWorker();
  cached.set('https://example.test/LOOP/index.html',new Response('shell'));
  vm.runInContext(`fetch=async()=>{throw new Error('offline');}`,context);
  assert.equal(await (await request('./','navigate')).text(),'shell');
  assert.equal((await request('./styles.css?v=8')).type,'error');
  vm.runInContext(`fetch=async()=>new Response('missing',{status:404});`,context);
  assert.equal((await request('./src/app.js?v=8')).status,404);
  assert.equal(puts.length,0);
});

await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
try {
  await test('Server serves public assets and rejects internal or missing files', async () => {
    for (const route of ['/', '/src/app.js?v=8','/manifest.webmanifest']) assert.equal((await fetch(base+route)).status,200);
    for (const route of ['/.git/HEAD','/server.mjs','/scripts/test-regressions.mjs','/not-found.js','/%2e%2e%5cserver.mjs']) assert.equal((await fetch(base+route)).status,404);
    assert.equal((await fetch(base+'/%ZZ')).status,400);
  });
  await test('Server rejects unsupported methods and supports HEAD', async () => {
    assert.equal((await fetch(base+'/src/app.js',{method:'POST'})).status,405);
    const response=await fetch(base+'/src/app.js',{method:'HEAD'});
    assert.equal(response.status,200); assert.equal(await response.text(),'');
  });
  await test('HTTP requests cannot rewrite the catalog', async () => {
    const original=read('src/discovered-data.js');
    const response=await fetch(base+'/api/seen-video',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({video:{video_id:'abcdefghijk'}})});
    assert.equal(response.status,410);
    assert.equal(read('src/discovered-data.js'),original);
  });
  await test('Malformed or unsafe search URLs are rejected before any external request', async () => {
    for (const value of ['bad-url','http://www.youtube.com/results?search_query=test','https://example.test/results?search_query=test','https://www.youtube.com:444/results?search_query=test']) {
      assert.equal((await fetch(base+'/api/youtube-search?url='+encodeURIComponent(value))).status,400);
    }
    assert.equal((await fetch(base+'/api/youtube-search?q=')).status,400);
  });
  await test('Upstream search failures return 502 without leaking internals', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      if (String(url).startsWith('https://www.youtube.com/')) throw new Error('private upstream detail');
      return originalFetch(url, options);
    };
    try {
      const response = await originalFetch(base+'/api/youtube-search?q=science');
      assert.equal(response.status,502);
      assert.equal((await response.json()).error,'YouTube search is temporarily unavailable');
    } finally { globalThis.fetch = originalFetch; }
  });
} finally {
  await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
}
console.log(`${passed} regression checks passed.`);
