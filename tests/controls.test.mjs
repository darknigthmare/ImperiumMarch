import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultBindings, normalizeBindings, remapBinding, keyboardActions, bindingLabel, GamepadInput , formatControlText } from '../src/controls.mjs';
const pad = (changes = {}) => ({ index: 0, id: 'standard-fixture', mapping: 'standard', connected: true, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), ...changes });
const press = (p, index, value = 1) => { p.buttons[index] = { pressed: value > .55, value }; return p; };

test('keyboard preferences retain AZERTY/QWERTY defaults and own independent arrays', () => {
  const a = defaultBindings(), b = normalizeBindings(null); a.left.push('KeyZ');
  assert.deepEqual(b.left, ['KeyQ', 'KeyA', 'ArrowLeft']);
  assert.equal(keyboardActions(new Set(['KeyA', 'Space', 'KeyE']), b).left, true);
  assert.equal(keyboardActions(new Set(['KeyA', 'Space', 'KeyE']), b).brace, true);
});
test('rebinding preserves a complete map, rejects conflicts and keeps emergency Escape', () => {
  const original = defaultBindings(), mapped = remapBinding(original, 'interact', 'KeyG');
  assert.equal(mapped.ok, true); assert.deepEqual(mapped.bindings.interact, ['KeyG']); assert.deepEqual(original.interact, ['KeyE']);
  assert.equal(keyboardActions(new Set(['KeyE']), mapped.bindings).interact, false);
  assert.equal(keyboardActions(new Set(['KeyG']), mapped.bindings).interact, true);
  assert.equal(remapBinding(mapped.bindings, 'repair', 'KeyG').ok, false);
  assert.equal(remapBinding(mapped.bindings, 'left', 'Tab').ok, false);
  assert.equal(remapBinding(mapped.bindings, 'left', 'Escape').ok, false);
  assert.deepEqual(remapBinding(mapped.bindings, 'pause', 'KeyP').bindings.pause, ['KeyP', 'Escape']);
  assert.equal(bindingLabel(['Space', 'KeyG', 'ArrowLeft']), 'Espace / G / ←');
});
test('damaged or conflicting preferences fall back safely without partial action loss', () => {
  for (const corrupt of [{ ...defaultBindings(), left: [] }, { ...defaultBindings(), left: ['KeyE'] }, { ...defaultBindings(), unknown: ['KeyZ'] }, { ...defaultBindings(), left: ['<script>'] }, { ...defaultBindings(), pause: ['Escape', 'Escape'] }]) assert.deepEqual(normalizeBindings(corrupt), defaultBindings());
  const a = normalizeBindings({ interact: ['KeyG'] }); assert.deepEqual(a.interact, ['KeyG']); assert.deepEqual(a.right, defaultBindings().right);
});
test('gamepad requires neutral input after connection, focus reset or replacement', () => {
  const input = new GamepadInput(), p = press(pad(), 7);
  assert.equal(input.sample([p]).status, 'release'); assert.equal(input.sample([p]).input.fire, false);
  press(p, 7, 0); assert.equal(input.sample([p]).status, 'ready'); press(p, 7);
  assert.equal(input.sample([p]).input.fire, true); input.reset(); assert.equal(input.sample([p]).input.fire, false);
  press(p, 7, 0); input.sample([p]); press(p, 7); assert.equal(input.sample([p]).input.fire, true);
  p.id = 'replacement'; assert.equal(input.sample([p]).status, 'release');
});
test('gamepad deadzone, twin-stick aim and standard buttons produce bounded controls', () => {
  const input = new GamepadInput(), p = pad(); input.sample([null, p]);
  p.axes = [.1, -.1, .1, -.1]; assert.equal(input.sample([p]).input.move, 0); assert.equal(input.sample([p]).input.aimActive, false);
  p.axes = [-1, 0, .9, -.9]; press(p, 0); press(p, 6); press(p, 5); press(p, 12);
  const result = input.sample([p]).input; assert.equal(result.move, -1); assert.equal(result.brace, true); assert.equal(result.secondary, true); assert.equal(result.interact, true); assert.equal(result.stepA, true); assert.ok(result.aimX > 0 && result.aimY < 0); assert.ok(Math.abs(Math.hypot(result.aimX, result.aimY) - 1) < 1e-12);
  p.axes = [Infinity, NaN, undefined, -Infinity]; assert.equal(input.sample([p]).input.move, 0); assert.equal(input.sample([p]).input.aimActive, false);
});
test('gamepad pause is edge-triggered and unsupported or disconnected devices release all input', () => {
  const input = new GamepadInput(), p = pad(); input.sample([p]); press(p, 9);
  assert.equal(input.sample([p]).input.pausePressed, true); assert.equal(input.sample([p]).input.pausePressed, false);
  press(p, 9, 0); input.sample([p]); press(p, 9); assert.equal(input.sample([p]).input.pausePressed, true);
  assert.equal(input.sample([]).input.pausePressed, false); assert.equal(input.sample([pad({ mapping: '' })]).status, 'unsupported');
  assert.equal(input.sample([pad({ connected: false })]).status, 'disconnected');
});

test('displayed instructions replace original physical keys once without recursive remapping', () => {
  let b=defaultBindings();b=remapBinding(b,'repair','KeyB').bindings;b=remapBinding(b,'interact','KeyT').bindings;
  assert.equal(formatControlText('E pour examiner, T pour réparer.',b),'T pour examiner, B pour réparer.');
  b=remapBinding(b,'right','KeyG').bindings;
  assert.equal(formatControlText('D : avancer ; Q/A : reculer.',b),'G : avancer ; Q / A / ← : reculer.');
  assert.equal(formatControlText('L’ambulance. D’une porte. Appuis A et B.',b),'L’ambulance. D’une porte. Appuis A et B.');
});

test('key hints respect accented letters, combining marks and apostrophes in French radio text', () => {
  const radio = 'Rive-Courte a quitté la zone des portes. Départ acquis ; le refuge doit encore confirmer l’arrivée.';
  assert.equal(formatControlText(radio, defaultBindings()), radio);
  let bindings = defaultBindings();
  for (const [action, code] of [['repair', 'KeyB'], ['interact', 'KeyT'], ['right', 'KeyG'], ['left', 'KeyH'], ['reload', 'KeyN'], ['stepB', 'KeyK'], ['fullscreen', 'KeyU'], ['pause', 'KeyP']]) {
    const remapped = remapBinding(bindings, action, code);
    assert.equal(remapped.ok, true); bindings = remapped.bindings;
  }
  for (const prose of [
    radio,
    'Dès février, Réparation et Départ restent des mots. Échappée, PréÉchap et Échappement aussi.',
    'éD Dà éE Eé Q/Aé E\u0301 e\u0301D D\u0301 9D D9 _D D_',
    "L’ambulance. D’une porte. L'ambulance. D'une porte. l'Échap. Appuis A et B. 'D' et ’E’.",
  ]) assert.equal(formatControlText(prose, bindings), prose);
  assert.equal(formatControlText('(D), [E] — Q/A ; Échap.', bindings), '(G), [T] — H ; P / Échap.');
});
