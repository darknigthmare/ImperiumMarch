/** Input preferences and standard-gamepad sampling. Pure: no DOM or storage. */
export const CONTROL_ACTIONS = [
  { id: 'left', label: 'Reculer', codes: ['KeyQ', 'KeyA', 'ArrowLeft'] },
  { id: 'right', label: 'Avancer', codes: ['KeyD', 'ArrowRight'] },
  { id: 'stepA', label: 'Groupe d’appuis A', codes: ['KeyJ'] },
  { id: 'stepB', label: 'Groupe d’appuis B', codes: ['KeyL'] },
  { id: 'brace', label: 'Ancrer le châssis', codes: ['Space'] },
  { id: 'vent', label: 'Purger la chaleur', codes: ['KeyV'] },
  { id: 'reload', label: 'Recharger', codes: ['KeyR'] },
  { id: 'repair', label: 'Réparer le radiateur', codes: ['KeyT'] },
  { id: 'interact', label: 'Scanner / interagir', codes: ['KeyE'] },
  { id: 'pause', label: 'Pause', codes: ['Escape'] },
  { id: 'fullscreen', label: 'Plein écran', codes: ['KeyF'] },
];
const codePattern = /^(Key[A-Z]|Digit[0-9]|Numpad[0-9]|Numpad(Add|Subtract|Multiply|Divide|Decimal|Enter)|Arrow(Left|Right|Up|Down)|Space|Enter|Escape|Shift(Left|Right)|Backspace|Home|End|Page(Up|Down)|Insert|Delete|Bracket(Left|Right)|Semicolon|Quote|Backquote|Comma|Period|Slash|Backslash|Minus|Equal)$/;
export function defaultBindings() { return Object.fromEntries(CONTROL_ACTIONS.map(a => [a.id, [...a.codes]])); }
export function normalizeBindings(value) {
  const fallback = defaultBindings();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  if (Object.keys(value).some(id => !Object.hasOwn(fallback, id))) return fallback;
  const result = {}, used = new Set();
  for (const action of CONTROL_ACTIONS) {
    const codes = value[action.id] ?? fallback[action.id];
    if (!Array.isArray(codes) || codes.length < 1 || codes.length > 3) return fallback;
    result[action.id] = [];
    for (const code of codes) {
      if (typeof code !== 'string' || !codePattern.test(code) || used.has(code) || (code === 'Escape' && action.id !== 'pause')) return fallback;
      used.add(code); result[action.id].push(code);
    }
  }
  // Escape is always retained as the emergency pause / dialog exit key.
  if (!result.pause.includes('Escape')) {
    if (result.pause.length >= 3) return fallback;
    result.pause.push('Escape');
  }
  return result;
}
export function bindingLabel(codes) {
  const names = { Space: 'Espace', Escape: 'Échap', Enter: 'Entrée', Backspace: 'Retour', Delete: 'Suppr', Insert: 'Inser', Home: 'Début', End: 'Fin', PageUp: 'Page ↑', PageDown: 'Page ↓', ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', ShiftLeft: 'Maj G', ShiftRight: 'Maj D', BracketLeft: '[', BracketRight: ']', Semicolon: ';', Quote: '’', Backquote: '`', Comma: ',', Period: '.', Slash: '/', Backslash: '\\', Minus: '−', Equal: '=' };
  return codes.map(c => names[c] ?? c.replace(/^Key|^Digit/, '').replace(/^Numpad/, 'Pavé ')).join(' / ');
}
/** Replace each original key token once; remapped names never feed another replacement. */
export function formatControlText(value, bindings) {
  const names = { Q:'left', A:'left', D:'right', J:'stepA', L:'stepB', Espace:'brace', ESPACE:'brace', V:'vent', R:'reload', T:'repair', E:'interact', F:'fullscreen', Échap:'pause' };
  // ASCII word boundaries split « Départ » after D and decomposed accents
  // after their base letter. Keep letters, marks, numbers and apostrophes
  // attached to their word, while preserving punctuation around real hints.
  return String(value || '').replace(/(^|[^\p{L}\p{M}\p{N}_’'])(Q\s*\/\s*A|Espace|ESPACE|Échap|Q(?!\s*\/\s*A)|D|J|L|V|R|T|E|F)(?![\p{L}\p{M}\p{N}_’'])/gu,
    (_, prefix, token) => prefix + bindingLabel(bindings[token.includes('/') ? 'left' : names[token]]));
}
export function remapBinding(bindings, actionId, code) {
  const action = CONTROL_ACTIONS.find(a => a.id === actionId), current = normalizeBindings(bindings);
  if (!action || typeof code !== 'string' || !codePattern.test(code) || code === 'Escape') return { ok: false, bindings: current, message: 'Cette touche est réservée à la navigation. Choisissez une autre touche.' };
  const conflict = CONTROL_ACTIONS.find(a => a.id !== actionId && current[a.id].includes(code));
  if (conflict) return { ok: false, bindings: current, message: `${bindingLabel([code])} est déjà utilisée pour « ${conflict.label} ».` };
  return { ok: true, bindings: { ...current, [actionId]: actionId === 'pause' ? [code, 'Escape'] : [code] }, message: `${action.label} : ${bindingLabel([code])}.` };
}
export function keyboardActions(keys, bindings) {
  return Object.fromEntries(CONTROL_ACTIONS.map(a => [a.id, bindings[a.id].some(code => keys.has(code))]));
}
const neutral = () => ({ move: 0, fire: false, secondary: false, brace: false, vent: false, reload: false, repair: false, interact: false, stepA: false, stepB: false, aimActive: false, aimX: 0, aimY: 0, pausePressed: false });
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
function axis(value, deadzone) {
  const n = Number.isFinite(value) ? clamp(value, -1, 1) : 0;
  return Math.abs(n) <= deadzone ? 0 : Math.sign(n) * (Math.abs(n) - deadzone) / (1 - deadzone);
}
export class GamepadInput {
  constructor(deadzone = .22) { this.deadzone = clamp(Number.isFinite(deadzone) ? deadzone : .22, .05, .6); this.identity = null; this.previousPause = false; this.waitForNeutral = true; }
  reset() { this.previousPause = false; this.waitForNeutral = true; }
  sample(gamepads) {
    const devices = Array.from(gamepads || []).filter(p => p && p.connected !== false);
    const pad = devices.find(p => p.mapping === 'standard');
    if (!pad) { this.identity = null; this.reset(); return { status: devices.length ? 'unsupported' : 'disconnected', input: neutral() }; }
    const identity = `${pad.index}:${pad.id}`;
    if (identity !== this.identity) { this.identity = identity; this.reset(); }
    const pressed = i => Boolean(pad.buttons?.[i]?.pressed || (Number.isFinite(pad.buttons?.[i]?.value) && pad.buttons[i].value > .55));
    const x = axis(pad.axes?.[0], this.deadzone), ax = axis(pad.axes?.[2], this.deadzone), ay = axis(pad.axes?.[3], this.deadzone);
    const anyHeld = Boolean(x || axis(pad.axes?.[1], this.deadzone) || ax || ay || Array.from(pad.buttons || []).some((_, i) => pressed(i)));
    if (this.waitForNeutral) {
      if (!anyHeld) this.waitForNeutral = false;
      return { status: anyHeld ? 'release' : 'ready', input: neutral() };
    }
    const pause = pressed(9), pausePressed = pause && !this.previousPause; this.previousPause = pause;
    const aimLength = Math.hypot(ax, ay), aimActive = aimLength > .02;
    return { status: 'ready', input: {
      move: x || (pressed(15) ? 1 : 0) - (pressed(14) ? 1 : 0),
      fire: pressed(7), secondary: pressed(5), brace: pressed(6), vent: pressed(4),
      interact: pressed(0), reload: pressed(2), repair: pressed(3), stepA: pressed(12), stepB: pressed(13),
      aimActive, aimX: aimActive ? ax / aimLength : 0, aimY: aimActive ? ay / aimLength : 0, pausePressed,
    } };
  }
}
