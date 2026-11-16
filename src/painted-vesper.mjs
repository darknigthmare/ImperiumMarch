/** Vesper bitmap presentation. No simulation or saved-state writes. */
import { PAINTED_VESPER_LAYOUT } from './painted-vesper-layout.mjs';

export const PAINTED_VESPER_URLS = Object.freeze({
  military: new URL('../assets/painted/vesper/military.png', import.meta.url).href,
  dispensary: new URL('../assets/painted/vesper/dispensary.png', import.meta.url).href,
  housing: new URL('../assets/painted/vesper/housing.png', import.meta.url).href,
  outposts: new URL('../assets/painted/vesper/outposts.png', import.meta.url).href,
  machinery: new URL('../assets/painted/vesper/machinery.png', import.meta.url).href,
  civilworks: new URL('../assets/painted/vesper/civilworks.png', import.meta.url).href,
});
const networkStates = ['active','disabled','damaged','disabled-damaged','destroyed'];
export const PAINTED_VESPER_PARTS = Object.freeze({
  military: { atlas:'military', size:[64,164], states:networkStates },
  dispensary: { atlas:'dispensary', size:[160,184], states:networkStates },
  housing: { atlas:'housing', size:[170,156], states:networkStates },
  depot: { atlas:'outposts', size:[228,121], names:{normal:'depot'} },
  'filter-crate': { atlas:'outposts', size:[24,14], names:{normal:'filter-crate'} },
  maintenance: { atlas:'outposts', size:[152,160], names:{normal:'maintenance',damaged:'maintenance-damaged',destroyed:'maintenance-destroyed'} },
  'record-terminal': { atlas:'outposts', size:[42,59], names:{normal:'record-terminal'} },
  pump: { atlas:'machinery', size:[72,50], names:{disconnected:'pump-disconnected',connected:'pump-connected'} },
  turbine: { atlas:'machinery', size:[90,126], names:{hot:'turbine-hot',cooled:'turbine-cooled'} },
  'turbine-rotor': { atlas:'machinery', size:[72,72], names:{normal:'turbine-rotor'} },
  radio: { atlas:'machinery', size:[44,107], names:{unavailable:'radio-unavailable',available:'radio-available',contacted:'radio-contacted'} },
  'slab-winch': { atlas:'civilworks', size:[74,49], names:{normal:'slab-winch'} },
  'slab-wheel': { atlas:'civilworks', size:[32,32], names:{normal:'slab-wheel'} },
  harpoon: { atlas:'civilworks', size:[81,48], names:{latched:'harpoon-latched',released:'harpoon-released'} },
  'harpoon-reel': { atlas:'civilworks', size:[36,36], names:{normal:'harpoon-reel'} },
  'ground-terminal': { atlas:'civilworks', size:[36,25], names:{exposed:'terminal-exposed',protected:'terminal-protected'} },
  pipe: { atlas:'civilworks', size:[80,13], names:{normal:'pipe'} },
  slab: { atlas:'civilworks', size:[28,13], names:{normal:'slab'} },
});
const images = new Map(), statuses = new Map();
let loading = null, generation = 0;
const rectangle = a => Array.isArray(a) && a.length===4 && a.every(Number.isFinite) && a[2]>0 && a[3]>0;
export function setPaintedVesperImage(key,image) {
  const atlas=PAINTED_VESPER_LAYOUT[key];
  if(!atlas) throw new RangeError(`Unknown Vesper atlas: ${key}`);
  const width=Number(image?.naturalWidth||image?.width||0),height=Number(image?.naturalHeight||image?.height||0);
  if(width!==atlas.size[0]||height!==atlas.size[1]) throw new RangeError(`Unexpected Vesper dimensions: ${key}`);
  images.set(key,image); statuses.set(key,{state:'ready',width,height});
}
export function clearPaintedVesper() { generation++; loading=null; images.clear(); statuses.clear(); }
export function paintedVesperStatus() {
  return Object.fromEntries(Object.keys(PAINTED_VESPER_URLS).map(key=>[key,{...(statuses.get(key)||{state:'idle'})}]));
}
function browserImage(url) {
  return new Promise((resolve,reject)=>{
    if(typeof globalThis.Image!=='function') { reject(new Error('Image decoding unavailable')); return; }
    const image=new globalThis.Image(); image.onload=()=>resolve(image); image.onerror=()=>reject(new Error('Vesper image decoding failed')); image.src=url;
  });
}
export function loadPaintedVesper({loadImage=browserImage}={}) {
  if(loading) return loading;
  const current=generation;
  loading=Promise.all(Object.entries(PAINTED_VESPER_URLS).map(async([key,url])=>{
    if(images.has(key)) return;
    statuses.set(key,{state:'loading'});
    try { const image=await loadImage(url,key); if(current===generation) setPaintedVesperImage(key,image); }
    catch { if(current===generation) statuses.set(key,{state:'failed'}); }
  })).then(()=>paintedVesperStatus());
  return loading;
}
export function paintedVesperFrame(part,state) {
  const spec=PAINTED_VESPER_PARTS[part]; if(!spec) return null;
  const selected=state??spec.states?.[0]??Object.keys(spec.names||{})[0];
  const name=spec.states?spec.states.includes(selected)&&selected:spec.names[selected];
  const atlas=PAINTED_VESPER_LAYOUT[spec.atlas], frame=atlas?.frames[name];
  if(!frame||!rectangle(frame.source)||!rectangle(frame.target)||frame.source[0]<0||frame.source[1]<0||
    frame.source[0]+frame.source[2]>atlas.size[0]||frame.source[1]+frame.source[3]>atlas.size[1]) return null;
  return {atlas:spec.atlas,frame:name,part,state:selected,...structuredClone(frame)};
}
export function vesperNetworkState(station) {
  if(station.destroyed) return 'destroyed';
  const damaged=station.hp<station.maxHp*.75;
  return station.disabled?(damaged?'disabled-damaged':'disabled'):(damaged?'damaged':'active');
}
export function drawPaintedVesperPart(ctx,options={}) {
  const spec=PAINTED_VESPER_PARTS[options.part], frame=paintedVesperFrame(options.part,options.state),image=images.get(frame?.atlas);
  if(!spec||!frame||!image||typeof ctx.drawImage!=='function') return false;
  const x=options.x??0,y=options.y??0,scale=options.scale??1,rotation=options.rotation??0;
  const sx=scale*(options.width??spec.size[0])/spec.size[0],sy=scale*(options.height??spec.size[1])/spec.size[1];
  if(![x,y,sx,sy,rotation].every(Number.isFinite)||sx<=0||sy<=0) return false;
  ctx.save();
  try {
    ctx.imageSmoothingEnabled=true; ctx.translate(x,y); if(rotation) ctx.rotate(rotation); ctx.scale(sx,sy);
    ctx.drawImage(image,...frame.source,...frame.target); return true;
  } catch { images.delete(frame.atlas);statuses.set(frame.atlas,{state:'failed'});return false; }
  finally {ctx.restore();}
}
/** Rotating parts are separate pixels; their historical physical pivots do not move. */
export function drawPaintedVesperWinch(ctx,{kind='slab',x=0,y=0,released=false,working=false,time=0,reducedMotion=false}={}) {
  if(!images.has('civilworks')||typeof ctx.drawImage!=='function') return false;
  const body=kind==='harpoon'?'harpoon':'slab-winch', wheel=kind==='harpoon'?'harpoon-reel':'slab-wheel';
  const ok=drawPaintedVesperPart(ctx,{part:body,state:kind==='harpoon'?(released?'released':'latched'):'normal',x,y});
  if(!ok) return false;
  return drawPaintedVesperPart(ctx,{part:wheel,x,y:y-(kind==='harpoon'?27:31),rotation:working&&!reducedMotion?time*2:0});
}
export function drawPaintedVesperTurbine(ctx,{x=0,y=0,cooled=false,time=0,reducedMotion=false}={}) {
  if(!images.has('machinery')||typeof ctx.drawImage!=='function') return false;
  if(!drawPaintedVesperPart(ctx,{part:'turbine',state:cooled?'cooled':'hot',x,y})) return false;
  // Both painted apertures have at least a 19.9-unit clear radius. The 38-unit
  // rotor sweeps 19.17 units, leaving their fixed metal rim visible at all angles.
  return drawPaintedVesperPart(ctx,{part:'turbine-rotor',x,y:y-71,width:38,height:38,rotation:reducedMotion?0:time*(cooled?.15:2.3)});
}
/** Small image strips follow the exact terrain already used by feet. No new surface. */
export function drawPaintedVesperGroundStrip(ctx,{part,from,to,groundAt,offset=0}={}) {
  if(!['pipe','slab'].includes(part)||typeof groundAt!=='function'||![from,to,offset].every(Number.isFinite)||to<=from) return false;
  const frame=paintedVesperFrame(part),image=images.get(frame?.atlas);
  if(!image||typeof ctx.drawImage!=='function') return false;
  const [u,v,w,h]=frame.alphaBounds, count=Math.max(1,Math.ceil((to-from)/4));
  ctx.save();
  try {
    ctx.imageSmoothingEnabled=true;
    for(let i=0;i<count;i++) {
      const a=i/count,b=(i+1)/count,x=from+(to-from)*a,width=(to-from)*(b-a);
      const ground=groundAt(x+width/2);if(!Number.isFinite(ground)) return false;
      ctx.drawImage(image,u+w*a,v,w*(b-a),h,x,ground+offset,width+.03,13);
    }
    return true;
  } catch {images.delete(frame.atlas);statuses.set(frame.atlas,{state:'failed'});return false;}
  finally {ctx.restore();}
}
