import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { Chess } from 'chess.js';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));

function loadSource(relativePath, imports = {}, globals = {}) {
  const filename = path.join(testDirectory, '..', relativePath);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }, fileName: filename,
  }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(code, {
    exports: compiledModule.exports, module: compiledModule,
    require: (id) => { if (id in imports) return imports[id]; throw new Error(`Unexpected import: ${id}`); },
    ...globals,
  }, { filename });
  return compiledModule.exports;
}
const { onlineGameReducer: reduce, initialOnlineUiState: initial } = loadSource('src/features/chess/online/gameState.ts');
function game(moves = [], extra = {}) {
  const chess = new Chess();
  for (const move of moves) chess.move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move.slice(4) || undefined });
  return { gameId: 'unit-game', fen: chess.fen(), moves, status: 'IN_PROGRESS', serverTime: 1000 + moves.length, ...extra };
}
function receive(state, next, options = {}) {
  return reduce(state, { type: 'receive', snapshot: { game: next, receivedAt: 2000 }, ...options });
}

test('clock, draw offer, and connection updates preserve selection and promotion', () => {
  let state = receive(initial, game());
  state = reduce(state, { type: 'select', square: 'e2' });
  state = reduce(state, { type: 'promotion', promotion: { from: 'a7', to: 'a8' } });
  state = receive(state, game([], { serverTime: 1100, drawOfferedBy: 'black', whiteMillis: 9500, black: { connected: false } }));
  assert.equal(state.selectedSquare, 'e2');
  assert.equal(state.pendingPromotion.to, 'a8');
});

test('new legal position clears move input but preserves an explicitly reviewed ply', () => {
  let state = receive(initial, game(['e2e4', 'e7e5']));
  state = reduce(state, { type: 'review', ply: 1 });
  state = reduce(state, { type: 'select', square: 'g1' });
  state = receive(state, game(['e2e4', 'e7e5', 'g1f3']));
  assert.equal(state.selectedSquare, null);
  assert.equal(state.viewPly, 1);
});

test('changed history invalidates review even if its length is unchanged', () => {
  let state = receive(initial, game(['e2e4', 'e7e5']));
  state = reduce(state, { type: 'review', ply: 1 });
  state = receive(state, game(['d2d4', 'd7d5'], { serverTime: 2000 }));
  assert.equal(state.viewPly, null);
});

test('metadata cannot roll back a pending move; server acknowledgement resolves it', () => {
  let state = receive(initial, game());
  state = reduce(state, { type: 'move', move: { fen: game(['e2e4']).fen, from: 'e2', to: 'e4', basePly: 0 } });
  state = receive(state, game([], { serverTime: 1001, drawOfferedBy: 'black' }));
  assert.equal(state.optimistic.to, 'e4');
  state = receive(state, game(['e2e4'], { serverTime: 1002 }));
  assert.equal(state.optimistic, null);
  assert.equal(state.snapshot.game.moves[0], 'e2e4');
});

test('authoritative reconnect resolves an unacknowledged move without resending it', () => {
  let state = receive(initial, game());
  state = reduce(state, { type: 'move', move: { fen: game(['e2e4']).fen, from: 'e2', to: 'e4', basePly: 0 } });
  state = receive(state, game([], { serverTime: 2000 }), { resync: true });
  assert.equal(state.optimistic, null);
  assert.equal(state.snapshot.game.moves.length, 0);
});

test('older snapshots never rewind the game or its clock', () => {
  const state = receive(initial, game(['e2e4', 'e7e5'], { serverTime: 2000 }));
  assert.equal(receive(state, game(['e2e4', 'e7e5'], { serverTime: 1500 })), state);
  assert.equal(receive(state, game(['e2e4'], { serverTime: 2500 })), state);
});

test('finished games clear pending input and retain review; another game resets local state', () => {
  let state = receive(initial, game(['e2e4', 'e7e5']));
  state = reduce(state, { type: 'review', ply: 0 });
  state = reduce(state, { type: 'promotion', promotion: { from: 'a7', to: 'a8' } });
  state = receive(state, game(['e2e4', 'e7e5'], { status: 'RESIGNED', serverTime: 2000 }));
  assert.equal(state.pendingPromotion, null);
  assert.equal(state.viewPly, 0);
  assert.equal(receive(state, game([], { gameId: 'another-game' })).viewPly, null);
});

test('first socket update compares with the already loaded REST position', () => {
  const state = { ...initial, selectedSquare: 'e2' };
  assert.equal(receive(state, game(), { initialGame: game() }).selectedSquare, 'e2');
});

test('muted and hidden pages emit no sound or vibration; supported alerts are bounded', async () => {
  const settings = { sound: false, vibration: false };
  const document = { visibilityState: 'visible' };
  const vibrated = [];
  let started = 0;
  class AudioContext {
    state = 'running'; currentTime = 0; destination = {};
    createOscillator() { return { frequency: {}, connect() {}, disconnect() {}, start() { started++; }, stop() {} }; }
    createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
  }
  const feedback = loadSource('src/features/chess/feedback.ts', {
    '@/features/chess/preferences': { useChessPreferences: { getState: () => settings } },
  }, { window: { AudioContext }, AudioContext, document, navigator: { vibrate: (pattern) => vibrated.push(pattern) } });
  assert.equal(await feedback.unlockChessAudio(), true);
  feedback.playChessFeedback('check');
  assert.equal(started, 0); assert.equal(vibrated.length, 0);
  settings.sound = true; settings.vibration = true;
  feedback.playChessFeedback('check');
  assert.equal(started, 2); assert.equal(vibrated.length, 1);
  document.visibilityState = 'hidden';
  feedback.playChessFeedback('lowTime');
  assert.equal(started, 2); assert.equal(vibrated.length, 1);
});

test('unsupported audio fails quietly', async () => {
  const feedback = loadSource('src/features/chess/feedback.ts', {
    '@/features/chess/preferences': { useChessPreferences: { getState: () => ({ sound: false, vibration: false }) } },
  }, { window: {} });
  assert.equal(await feedback.unlockChessAudio(), false);
});


test('resume lookup searches older pages and stops at the first active game', async () => {
  const calls = [];
  const active = { gameId: 'older-active', status: 'IN_PROGRESS' };
  const { getPageMeta } = loadSource('src/shared/lib/pagination.ts');
  const api = loadSource('src/features/chess/api.ts', {
    '@/shared/lib/pagination': { getPageMeta },
    '@/shared/api/http': { http: { get: async (url, options) => {
      assert.equal(url, '/api/chess/games');
      calls.push(options.params.page);
      const content = options.params.page === 0 ? [{ gameId: 'finished', status: 'CHECKMATE' }] : [active];
      return { data: { data: { content, page: { totalPages: 3, totalElements: 101 } } } };
    } } },
  });
  assert.equal((await api.getActiveChessGame()).gameId, 'older-active');
  assert.deepEqual(calls, [0, 1]);
});

test('resume lookup handles empty history without repeated requests', async () => {
  let calls = 0;
  const { getPageMeta } = loadSource('src/shared/lib/pagination.ts');
  const api = loadSource('src/features/chess/api.ts', {
    '@/shared/lib/pagination': { getPageMeta },
    '@/shared/api/http': { http: { get: async () => { calls++; return { data: { data: { content: [], totalPages: 0 } } }; } } },
  });
  assert.equal(await api.getActiveChessGame(), null);
  assert.equal(calls, 1);
});

test('low-time notification fires once per turn and can be enabled after crossing the threshold', () => {
  let now = 9000;
  const settings = { sound: false, vibration: false };
  const alerts = [];
  const ref = { current: null };
  let tick;
  let cleanup;
  const hooks = loadSource('src/features/chess/hooks/useChessFeedback.ts', {
    react: { useRef: () => ref, useEffect: (effect) => { cleanup = effect(); } },
    'chess.js': { Chess },
    '@/features/chess/feedback': { playChessFeedback: (kind) => alerts.push(kind) },
    '@/features/chess/preferences': { useChessPreferences: { getState: () => settings } },
  }, {
    Date: { now: () => now }, document: { visibilityState: 'visible' },
    window: { setInterval: (fn) => { tick = fn; return 1; }, clearInterval() {} },
  });
  const args = { gameId: 'game', turnKey: '1:white', millis: 20000, receivedAt: 0, running: true };
  hooks.useChessLowTimeFeedback(args);
  now = 10100; tick(); assert.equal(alerts.length, 0);
  settings.sound = true; tick(); tick(); assert.equal(alerts.length, 1);
  cleanup(); hooks.useChessLowTimeFeedback({ ...args, millis: 19500 });
  tick(); assert.equal(alerts.length, 1);
  cleanup(); hooks.useChessLowTimeFeedback({ ...args, turnKey: '3:white' });
  assert.equal(alerts.length, 2);
  cleanup();
});

test('move feedback skips initial load, duplicate acknowledgement and rollback', () => {
  const ref = { current: null };
  const alerts = [];
  const hooks = loadSource('src/features/chess/hooks/useChessFeedback.ts', {
    react: { useRef: () => ref, useEffect: (effect) => effect() },
    'chess.js': { Chess },
    '@/features/chess/feedback': { playChessFeedback: (kind) => alerts.push(kind) },
    '@/features/chess/preferences': { useChessPreferences: (selector) => selector({ sound: false }), useHydrateChessPreferences() {} },
  });
  hooks.useChessMoveFeedback(game(['e2e4']).fen, 1, 'game');
  assert.equal(alerts.length, 0);
  hooks.useChessMoveFeedback(game(['e2e4', 'e7e5']).fen, 2, 'game');
  hooks.useChessMoveFeedback(game(['e2e4', 'e7e5']).fen, 2, 'game');
  hooks.useChessMoveFeedback(game(['e2e4']).fen, 1, 'game');
  assert.deepEqual(alerts, ['move']);
});
