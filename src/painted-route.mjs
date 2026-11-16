/** MI09 presentation only. Contacts, movement, jobs and consequences stay in the simulation. */
import { PAINTED_ROUTE_LAYOUT } from './painted-route-layout.mjs';

// Literal URLs are embedded byte-for-byte by the offline builder.
export const PAINTED_ROUTE_URLS = Object.freeze({
  barrier: new URL('../assets/painted/route/barrier.png', import.meta.url).href,
  terminals: new URL('../assets/painted/route/terminals.png', import.meta.url).href,
  logistics: new URL('../assets/painted/route/logistics.png', import.meta.url).href,
});
export const PAINTED_ROUTE_PARTS = Object.freeze({
  'migration-barrier': { size: [170,112], states: ['closed','working','open','broken'] },
  'barrier-control': { size: [56,52], states: ['normal','broken'] },
  'route-map': { size: [95,110], states: ['concealed','surveyed'] },
  'route-terminal': { size: [48,54], states: ['idle','working','done'] },
  'route-marker': { size: [50,90], states: ['imperial','local'] },
  'route-logistics': { size: [126,68], states: ['normal','damaged','destroyed'] },
  'route-light': { size: [44,138], states: ['off','on'] },
});
const images = new Map(), statuses = new Map();
let generation = 0, loading = null;
const dimensions = image => [Number(image?.naturalWidth || image?.width || 0), Number(image?.naturalHeight || image?.height || 0)];
const rectangle = values => Array.isArray(values) && values.length === 4 && values.every(Number.isFinite) && values[2] > 0 && values[3] > 0;

export function setPaintedRouteImage(key,image) {
  if (!Object.hasOwn(PAINTED_ROUTE_URLS,key)) throw new RangeError(`Unknown route atlas: ${key}`);
  const [width,height] = dimensions(image), expected = PAINTED_ROUTE_LAYOUT[key].size;
  if (width !== expected[0] || height !== expected[1]) throw new RangeError(`Unexpected route atlas dimensions: ${key}`);
  images.set(key,image); statuses.set(key,{state:'ready',width,height});
}
export function setPaintedRouteImages(decoded) {
  for (const [key,image] of Object.entries(decoded)) setPaintedRouteImage(key,image);
  return paintedRouteStatus();
}
export function clearPaintedRoute() { generation++; images.clear(); statuses.clear(); loading=null; }
export function paintedRouteStatus() {
  return Object.fromEntries(Object.keys(PAINTED_ROUTE_URLS).map(key => [key,{...(statuses.get(key) || {state:'idle'})}]));
}
function browserImage(url) {
  return new Promise((resolve,reject) => {
    if (typeof globalThis.Image !== 'function') { reject(new Error('Image decoding unavailable')); return; }
    const image = new globalThis.Image(); image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Route atlas decoding failed')); image.src=url;
  });
}
export function loadPaintedRoute({loadImage=browserImage}={}) {
  if (loading) return loading;
  const version = generation;
  loading = Promise.all(Object.entries(PAINTED_ROUTE_URLS).map(async ([key,url]) => {
    if (images.has(key)) return;
    statuses.set(key,{state:'loading'});
    try { const image=await loadImage(url,key); if(version===generation) setPaintedRouteImage(key,image); }
    catch { if(version===generation) statuses.set(key,{state:'failed'}); }
  })).then(() => paintedRouteStatus());
  return loading;
}
export function paintedRouteFrame(key,name) {
  const atlas=PAINTED_ROUTE_LAYOUT[key], frame=atlas?.frames?.[name];
  if (!frame || !rectangle(frame.source) || !rectangle(frame.target) || frame.source[0]<0 || frame.source[1]<0 ||
      frame.source[0]+frame.source[2]>atlas.size[0] || frame.source[1]+frame.source[3]>atlas.size[1]) return null;
  return {atlas:key,frame:name,...structuredClone(frame)};
}
export function paintedRoutePartFrames(part,state) {
  const definition=PAINTED_ROUTE_PARTS[part];
  if (!definition?.states.includes(state)) return null;
  let key,names;
  if(part==='migration-barrier') { key='barrier'; names=state==='broken'?['pedestal-broken','arm-broken']:['pedestal','arm']; }
  else if(part==='barrier-control') { key='barrier'; names=[state==='broken'?'control-broken':'control']; }
  else if(part==='route-map') { key='terminals'; names=['map-'+state]; }
  else if(part==='route-terminal') { key='terminals'; names=['terminal-'+state]; }
  else if(part==='route-marker') { key='terminals'; names=['marker-'+state]; }
  else if(part==='route-logistics') { key='logistics'; names=['truck-'+state]; }
  else if(part==='route-light') { key='logistics'; names=['light-'+state]; }
  return names.map(name=>paintedRouteFrame(key,name));
}
/** Returns false for a missing/failed bitmap, so the scene keeps its vector fallback.
 * Bottom anchors and the historical barrier hinge are presentation coordinates only. */
export function drawPaintedRouteAsset(ctx,options={}) {
  const definition=PAINTED_ROUTE_PARTS[options.part], state=options.state??definition?.states[0];
  const frames=paintedRoutePartFrames(options.part,state);
  if (!frames || typeof ctx.drawImage!=='function' || frames.some(f=>!f || f.usage!=='runtime' || !images.has(f.atlas))) return false;
  const x=options.x??0,y=options.y??0, scale=options.scale??1;
  const sx=scale*(options.width??definition.size[0])/definition.size[0], sy=scale*(options.height??definition.size[1])/definition.size[1];
  if (![x,y,sx,sy].every(Number.isFinite) || sx<=0 || sy<=0) return false;
  const draw=frame=>ctx.drawImage(images.get(frame.atlas),...frame.source,...frame.target);
  ctx.save();
  try {
    ctx.imageSmoothingEnabled=true; ctx.translate(x,y); ctx.scale(sx*(options.facing===-1?-1:1),sy);
    if(options.part==='migration-barrier' && state!=='broken') {
      draw(frames[0]);
      // Match the original authored hinge and real opening; time alone never opens a barrier.
      const opening=state==='open'?1:state==='working'?Math.max(0,Math.min(1,Number.isFinite(options.progress)?options.progress:0)):0;
      ctx.save();
      try { ctx.translate(-76,-77); ctx.rotate(-Math.PI*.69*opening); draw(frames[1]); }
      finally { ctx.restore(); }
      ctx.beginPath();ctx.moveTo(90,2);ctx.lineTo(90,-65);ctx.strokeStyle='#82946f';ctx.lineWidth=6;ctx.stroke();
      ctx.beginPath();ctx.moveTo(82,-67);ctx.lineTo(99,-67);ctx.strokeStyle='#c2c393';ctx.lineWidth=4;ctx.stroke();
    } else for(const frame of frames) draw(frame);
    return true;
  } catch {
    for(const frame of frames) { images.delete(frame.atlas);statuses.set(frame.atlas,{state:'failed'}); }
    return false;
  } finally { ctx.restore(); }
}
