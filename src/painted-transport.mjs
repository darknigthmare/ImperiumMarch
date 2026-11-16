/** Painted railway and industrial transport. Simulation owns all body positions. */
import { PAINTED_TRANSPORT_LAYOUT } from './painted-transport-layout.mjs';

export const PAINTED_TRANSPORT_URLS = Object.freeze({
  locomotive: new URL('../assets/painted/transport/locomotive.png', import.meta.url).href,
  wagons: new URL('../assets/painted/transport/wagons.png', import.meta.url).href,
  carrier: new URL('../assets/painted/transport/carrier.png', import.meta.url).href,
  cargo: new URL('../assets/painted/transport/cargo.png', import.meta.url).href,
});
const images = new Map(), statuses = new Map();
let loading = null, generation = 0;
const dimensions = image => [Number(image?.naturalWidth || image?.width || 0), Number(image?.naturalHeight || image?.height || 0)];
export function paintedTransportStatus() {
  return Object.fromEntries(Object.keys(PAINTED_TRANSPORT_URLS).map(key => [key, {...statuses.get(key) || {state:'idle'}}]));
}
export function clearPaintedTransport() { generation++; images.clear(); statuses.clear(); loading = null; }
export function setPaintedTransportImage(key, image) {
  if (!Object.hasOwn(PAINTED_TRANSPORT_URLS,key)) throw new RangeError(`Unknown transport atlas: ${key}`);
  const [width,height] = dimensions(image), expected = PAINTED_TRANSPORT_LAYOUT[key].size;
  if (width !== expected[0] || height !== expected[1]) throw new RangeError(`Unexpected transport dimensions: ${key}`);
  images.set(key,image); statuses.set(key,{state:'ready',width,height});
}
function browserImage(url) {
  return new Promise((resolve,reject) => {
    if (typeof globalThis.Image !== 'function') { reject(new Error('Image decoding unavailable')); return; }
    const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('Transport atlas decoding failed')); image.src = url;
  });
}
export function loadPaintedTransport({loadImage = browserImage} = {}) {
  if (loading) return loading;
  const version = generation;
  loading = Promise.all(Object.entries(PAINTED_TRANSPORT_URLS).map(async ([key,url]) => {
    if (images.has(key)) return;
    statuses.set(key,{state:'loading'});
    try { const image = await loadImage(url,key); if (version === generation) setPaintedTransportImage(key,image); }
    catch { if (version === generation) statuses.set(key,{state:'failed'}); }
  })).then(() => paintedTransportStatus());
  return loading;
}
export function paintedTransportFrame(atlas, name) {
  const spec = PAINTED_TRANSPORT_LAYOUT[atlas], frame = spec?.frames?.[name];
  if (!frame) return null;
  const [x,y,w,h] = frame.source;
  if (![x,y,w,h,...frame.target].every(Number.isFinite) || x<0 || y<0 || !(w>0 && h>0) || x+w>spec.size[0] || y+h>spec.size[1]) return null;
  return {atlas,name,...structuredClone(frame)};
}
function ready(atlas,name) {
  const image = images.get(atlas), frame = paintedTransportFrame(atlas,name);
  return image && frame ? {image,...frame} : null;
}
export function drawPaintedTransportFrame(ctx,atlas,name,{x=0,y=0,scaleX=1,scaleY=scaleX,rotation=0} = {}) {
  const frame = ready(atlas,name);
  if (!frame || typeof ctx.drawImage !== 'function') return false;
  ctx.save(); ctx.translate(x,y); ctx.rotate(rotation); ctx.scale(scaleX,scaleY); ctx.imageSmoothingEnabled = true;
  ctx.drawImage(frame.image,...frame.source,...frame.target); ctx.restore(); return true;
}
export function trainCarPaintedFrame(car,train,campaign = {}) {
  const lost = car.destroyed || car.hp <= 0;
  const damaged = car.hp / car.maxHp < .72;
  if (car === train) return {atlas:'locomotive',name:lost ? 'wreck' : damaged ? 'damaged' : 'intact'};
  const occupied = car.kind === 'hostages' || car.id === 'hostages' || car.offset === -352;
  if (!occupied) return {atlas:'wagons',name:lost ? 'ore-wreck' : damaged ? 'ore-damaged' : 'ore-intact'};
  return {atlas:'wagons',name:lost ? 'hostages-wreck' : campaign.rescueResolved ? damaged ? 'hostages-open-damaged' : 'hostages-open' : damaged ? 'hostages-damaged' : 'hostages-closed'};
}
export function trainWheelPose(car,train,side) {
  return {x:car.x + side*(car.w/2-24),y:car.y+car.h/2-3,radius:15,
    // Position-based orientation remains unchanged when motion stops.
    rotation:Number.isFinite(car.x) ? car.x/15 : 0};
}
/** Attach to the painted hardware only when that car can use its painted path.
 * Mixed load failures retain the vector endpoint on the affected car. */
export function trainCouplerPose(car,train,campaign,side,{painted=true}={}) {
  const selected=trainCarPaintedFrame(car,train,campaign),frame=ready(selected.atlas,selected.name);
  const point=painted && ready('locomotive','wheel') && frame?.anchors.couplers?.[side<0?'left':'right'];
  return point ? {x:car.x+point[0]*car.w/frame.nominal[0],y:car.y+point[1]*car.h/frame.nominal[1],painted:true}
    : {x:car.x+side*car.w/2,y:car.y+22,painted:false};
}
export function trainPassengerCount(car,campaign={}) {
  if (car.destroyed || car.hp<=0 || campaign.rescueResolved) return 0;
  return Math.max(0,Math.floor((campaign.hostagesTotal || 0)-(campaign.hostagesLost || 0)));
}
export function drawPaintedTrainCar(ctx,car,train,campaign={},options={}) {
  const selection = trainCarPaintedFrame(car,train,campaign), frame = ready(selection.atlas,selection.name);
  if (!frame || !ready('locomotive','wheel') || typeof ctx.drawImage !== 'function') return false;
  for (const side of [-1,1]) {
    const wheel = trainWheelPose(car,train,side);
    // Suspension belongs between the real axle and the empty authored wheel
    // arch. Without these mountings the separated body would float above it.
    ctx.save();ctx.strokeStyle='#526065';ctx.lineWidth=4;
    for(const dx of [-8,8]) {ctx.beginPath();ctx.moveTo(wheel.x+dx,car.y+car.h/2-33);ctx.lineTo(wheel.x+dx*.35,wheel.y);ctx.stroke();}
    ctx.fillStyle='#67736b';ctx.fillRect(wheel.x-12,car.y+car.h/2-30,24,5);ctx.restore();
    drawPaintedTransportFrame(ctx,'locomotive','wheel',{x:wheel.x,y:wheel.y,scaleX:wheel.radius,rotation:options.reducedMotion?0:wheel.rotation});
  }
  const sx = car.w/frame.nominal[0], sy = car.h/frame.nominal[1];
  drawPaintedTransportFrame(ctx,selection.atlas,selection.name,{x:car.x,y:car.y,scaleX:sx,scaleY:sy});
  if (frame.window && !campaign.rescueResolved && !car.destroyed && car.hp>0) {
    const [x,y,w,h] = frame.window, count = trainPassengerCount(car,campaign);
    ctx.save(); ctx.translate(car.x,car.y); ctx.scale(sx,sy);
    ctx.beginPath(); ctx.rect(x,y,w,h); ctx.clip();
    for (let i=0;i<count;i++) {
      const px = x + (i+.5)*w/Math.max(1,count), py = y+h*.36;
      ctx.beginPath(); ctx.arc(px,py,Math.min(2.5,h*.18),0,Math.PI*2); ctx.fillStyle = '#c4c7ab'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(px,py+h*.16); ctx.lineTo(px,y+h*.95); ctx.strokeStyle='#97aaa0'; ctx.lineWidth=3; ctx.stroke();
    }
    // Bars are a presentation of the still-closed gate, never extra people.
    for (let px=x+5;px<x+w;px+=11) { ctx.beginPath(); ctx.moveTo(px,y); ctx.lineTo(px,y+h); ctx.strokeStyle='#8d9b8e'; ctx.lineWidth=1.3; ctx.stroke(); }
    ctx.restore();
  }
  if (car === train && train.moving && !car.destroyed && !options.reducedMotion) {
    ctx.save(); ctx.fillStyle='#b5b7ab';
    for (let i=0;i<4;i++) {ctx.globalAlpha=.12-i*.025;ctx.beginPath();ctx.arc(car.x-car.w/2+12-i*12,car.y-car.h/2-6-i*7,6+i*3,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  return true;
}
export function industrialCarrierPaintedFrame(carrier) {
  return carrier.destroyed || carrier.hp<=0 ? 'wreck' : carrier.hp < carrier.maxHp*.6 ? 'damaged' : 'intact';
}
export function industrialCargoPaintedFrame(cargo) {
  return cargo.destroyed || cargo.hp<=0 ? 'destroyed' : cargo.hp<cargo.maxHp ? 'damaged' : cargo.markingCopied ? 'copied' : 'sealed';
}
export function drawPaintedIndustrialCargo(ctx,cargo) {
  const name=industrialCargoPaintedFrame(cargo), frame=ready('cargo',name);
  if(!frame) return false;
  return drawPaintedTransportFrame(ctx,'cargo',name,{x:cargo.x,y:cargo.y+cargo.h/2,scaleX:cargo.w/frame.nominal[0],scaleY:cargo.h/frame.nominal[1]});
}
export function industrialWheelPose(carrier,wheel) {
  return {x:wheel.x,y:wheel.y,radius:wheel.radius,rotation:Number.isFinite(carrier.distance)?carrier.distance/wheel.radius:0};
}
export function drawPaintedIndustrialCarrier(ctx,carrier,{reducedMotion=false}={}) {
  const name=industrialCarrierPaintedFrame(carrier), frame=ready('carrier',name);
  if (!frame || !ready('carrier','wheel') || typeof ctx.drawImage !== 'function') return false;
  for (const wheel of carrier.wheels) {
    const pose=industrialWheelPose(carrier,wheel);
    ctx.beginPath();ctx.moveTo(wheel.x,carrier.y-8);ctx.lineTo(wheel.x,wheel.y);ctx.strokeStyle='#5d6a6b';ctx.lineWidth=5;ctx.stroke();
    drawPaintedTransportFrame(ctx,'carrier','wheel',{x:pose.x,y:pose.y,scaleX:pose.radius,rotation:reducedMotion?0:pose.rotation});
  }
  // Deck registration keeps both separately simulated crates on their supports.
  drawPaintedTransportFrame(ctx,'carrier',name,{x:carrier.x,y:carrier.y,scaleX:carrier.w/frame.nominal[0],scaleY:1});
  return true;
}
