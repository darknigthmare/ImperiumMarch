/** Original production vector components, Ordre de Cendre 0.9.
 * One geometry stream feeds both Canvas and SVG exports. No DOM, images, Path2D, game-state writes or contact generation.
 * Coordinates are game-world units. x/y is a mechanical pivot, not the top left of an illustration.
 */
const PA_TAU = Math.PI * 2;
const paClamp = (v,a,b) => Math.max(a,Math.min(b,v));
export const PRODUCTION_RIGS = {
  WK01:{id:'WK01',name:'Vigie',designation:'M-12',legs:2,width:126,bodyHeight:70,height:180,color:'#d5ad72',assets:['AS02','AS36','AS41'],role:'Éclaireur haut, poitrine angulaire et jambes longues',footWidth:64,upper:111.6,lower:115.2,offsets:[-38,38]},
  WK02:{id:'WK02',name:'Caracal',designation:'C-5',legs:2,width:110,bodyHeight:70,height:80,color:'#8cb6b9',assets:['AS31','AS36','AS41'],role:'Bipède bas urbain, flanc ramassé et proue en pince',footWidth:58,upper:49.6,lower:51.2,offsets:[-38,38]},
  WK05:{id:'WK05',name:'Bastion',designation:'Q-40',legs:4,width:172,bodyHeight:62,height:115,color:'#a8b9af',assets:['AS03','AS36','AS41'],role:'Quadrupède de brèche, blindage frontal et coque basse',footWidth:58,upper:71.3,lower:73.6,offsets:[-71,71,-89,89]},
  WK06:{id:'WK06',name:'Arpenteur',designation:'A-17',legs:4,width:182,bodyHeight:62,height:220,color:'#bea9ce',assets:['AS31','AS36','AS41'],role:'Quadrupède haut, nacelle et longerons indépendants',footWidth:56,upper:136.4,lower:140.8,offsets:[-71,71,-89,89]},
  WK09:{id:'WK09',name:'Pèlerin',designation:'H-6',legs:6,width:188,bodyHeight:62,height:145,color:'#c8c6a8',assets:['AS04','AS36','AS41'],role:'Hexapode d’endurance, nacelle à équipement démontable',footWidth:54,upper:89.9,lower:92.8,offsets:[-88,0,88,-105,5,105]},
  WK10:{id:'WK10',name:'Cloporte',designation:'CL-4',legs:6,width:180,bodyHeight:62,height:72,color:'#b5c58e',assets:['AS31','AS36','AS41'],role:'Hexapode très bas, toit cuirassé et palpeur déporté',footWidth:50,upper:44.64,lower:46.08,offsets:[-88,0,88,-105,5,105]},
};
export const PRODUCTION_PART_NAMES = ['hull','turret','upper','lower','hip','knee','foot','radiator'];
export const PRODUCTION_COMPONENT_NAMES = ['ambulance','beacon','medical-case','ramp','dike-panel','auxiliary-pump','routing-valve','house-a','house-b','tide-marker','dock','ferry','barge-seizure','barge-rive-courte','winch','gate','gate-mechanism','boat-veille-aval','refuge','cooling-turbine','maintenance-post'];
export const SILHOUETTE_MODELS = [
  {id:'WK01',name:'Vigie M-12',legs:2,height:11,body:'scout',playable:true},
  {id:'WK02',name:'Caracal C-5',legs:2,height:5,body:'cat',playable:true},
  {id:'WK03',name:'Héron H-15',legs:2,height:15,body:'heron',playable:false},
  {id:'WK04',name:'Linceul L-7',legs:2,height:7,body:'stealth',playable:false},
  {id:'WK05',name:'Bastion Q-40',legs:4,height:8,body:'bastion',playable:true},
  {id:'WK06',name:'Arpenteur A-17',legs:4,height:17,body:'strider',playable:true},
  {id:'WK07',name:'Loutre LT-6',legs:4,height:6,body:'otter',playable:false},
  {id:'WK08',name:'Cataphracte CT-13',legs:4,height:13,body:'siege',playable:false},
  {id:'WK09',name:'Pèlerin H-6',legs:6,height:10,body:'pilgrim',playable:true},
  {id:'WK10',name:'Cloporte CL-4',legs:6,height:4,body:'woodlouse',playable:true},
  {id:'WK11',name:'Mégalithe MG-22',legs:6,height:22,body:'megalith',playable:false},
  {id:'WK12',name:'Noria N-9',legs:6,height:9,body:'rescue',playable:false},
];
function paTint(hex,amount){const raw=parseInt(hex.slice(1),16);return '#'+[raw>>16,(raw>>8)&255,raw&255].map(c=>Math.round(paClamp(c*amount,0,255)).toString(16).padStart(2,'0')).join('');}
function palette(rig,back=false){const factor=back?.7:1;return{dark:paTint('#14282d',factor),edge:paTint('#233d40',factor),low:paTint('#3f5a58',factor),mid:paTint('#76877b',factor),light:paTint('#b2b39b',factor),steel:paTint('#c2c8ba',factor),accent:paTint(rig?.color||'#88b7aa',factor),glass:paTint('#edbf7c',factor),rust:'#94684b'};}
function painter(){const shapes=[];return{shapes,
  poly(points,fill,stroke='#14282d',strokeWidth=1.4){shapes.push({type:'polygon',points,fill,stroke,strokeWidth});},
  rect(x,y,w,h,fill,stroke=null,strokeWidth=1){shapes.push({type:'rect',x,y,w,h,fill,stroke,strokeWidth});},
  line(x1,y1,x2,y2,stroke,width=1){shapes.push({type:'line',x1,y1,x2,y2,stroke,strokeWidth:width});},
  circle(x,y,r,fill,stroke=null,strokeWidth=1){shapes.push({type:'circle',x,y,r,fill,stroke,strokeWidth});},
  path(commands,fill,stroke=null,strokeWidth=1){shapes.push({type:'path',commands,fill,stroke,strokeWidth});},
  text(text,x,y,size,fill,anchor='start'){shapes.push({type:'text',text,x,y,size,fill,anchor});},
};}
function plate(d,points,p,top=p.mid,bottom=p.low){const ys=points.map(p=>p[1]);d.poly(points,{top,bottom,y1:Math.min(...ys),y2:Math.max(...ys)},p.dark,1.5);d.line(points[0][0]+1,points[0][1]+1,points[1][0],points[1][1]+1,p.light,.8);}
function rivet(d,x,y,p,r=1.8){d.circle(x,y,r+1,p.dark);d.circle(x,y-.35,r,p.steel);d.line(x-r*.5,y,x+r*.5,y,p.edge,.7);}
function grille(d,x,y,w,h,p,count=6,vertical=false){d.rect(x,y,w,h,p.dark,p.edge,.8);for(let i=1;i<=count;i++){if(vertical)d.line(x+w*i/(count+1),y+2,x+w*i/(count+1)-2,y+h-2,p.mid,1.2);else d.line(x+2,y+h*i/(count+1),x+w-2,y+h*i/(count+1),p.mid,1.2);}}
function scars(d,x,y,w,h,p,repaired=false){if(repaired){plate(d,[[x,y],[x+w,y+1],[x+w-2,y+h],[x+1,y+h-1]],p,p.mid,p.low);for(const [bx,by]of [[x+3,y+3],[x+w-3,y+3],[x+3,y+h-3],[x+w-3,y+h-3]])rivet(d,bx,by,p,1);d.line(x+4,y+h/2,x+w-4,y+h/2,p.steel,1);}else{d.poly([[x,y+2],[x+w*.3,y+h*.4],[x+w*.45,y],[x+w*.62,y+h*.58],[x+w,y+h],[x+w*.3,y+h*.6]],p.dark,null);d.line(x+2,y+2,x+w*.7,y+h,p.rust,1.1);d.circle(x+w*.6,y+h*.55,1.4,'#df945b');}}
function hullGeometry(d,rig,p,state){
  const id=rig.id;
  plate(d,[[-rig.width*.46,12],[rig.width*.43,12],[rig.width*.34,39],[-rig.width*.34,39]],p,p.low,p.edge);
  for(let i=0;i<rig.legs/2;i++)d.circle(-rig.width*.3+i*rig.width*.6/Math.max(1,rig.legs/2-1),28,9,p.dark,p.mid,1.6);
  if(id==='WK01'){
    plate(d,[[-65,-25],[-43,-44],[26,-41],[58,-23],[67,8],[43,31],[-42,27],[-65,9]],p);
    plate(d,[[-41,-37],[20,-35],[30,-15],[-43,-12]],p,p.light,p.mid);
    plate(d,[[33,-29],[58,-20],[63,3],[27,8],[24,-10]],p,p.mid,p.edge);
    d.poly([[29,-23],[51,-17],[54,-7],[30,-6]],p.glass,p.dark,2);d.line(39,-19,41,-7,p.edge,1.5);
    plate(d,[[-75,-28],[-61,-29],[-61,13],[-74,19],[-80,7]],p,p.mid,p.low);
    grille(d,-62,-9,21,28,p,5);d.rect(-34,-31,6,19,p.accent);d.line(-28,-13,18,-13,p.accent,2);
    d.rect(-34,1,31,11,p.edge);d.text('M–12',-31,9,8,p.light);d.line(13,23,35,24,p.steel,1);
    for(const [x,y]of [[-49,-26],[-43,18],[17,19],[20,-30]])rivet(d,x,y,p);
  }else if(id==='WK02'){
    plate(d,[[-58,-22],[-41,-35],[25,-35],[48,-24],[60,-6],[53,21],[31,29],[-45,25],[-61,8]],p,p.mid,p.low);
    plate(d,[[-43,-32],[24,-31],[41,-20],[-50,-19]],p,p.light,p.mid);
    plate(d,[[32,-21],[54,-8],[53,4],[27,5],[23,-9]],p,p.mid,p.edge);
    d.poly([[29,-17],[45,-11],[48,-3],[29,-3]],p.glass,p.dark,1.7);d.line(38,-13,38,-4,p.edge,1.2);
    plate(d,[[45,8],[64,2],[68,10],[58,24],[29,29]],p,p.mid,p.edge);
    d.line(-44,-25,21,-25,p.accent,3);grille(d,-55,-9,22,26,p,5);d.rect(-28,-9,43,26,p.edge);plate(d,[[-25,-6],[13,-6],[17,12],[-26,13]],p,p.mid,p.low);d.text('C–5',-19,7,8,p.light);
    for(const [x,y]of [[-41,-14],[-39,19],[20,18],[25,-27]])rivet(d,x,y,p,1.6);
  }else if(id==='WK05'){
    plate(d,[[-91,-14],[-65,-36],[45,-36],[86,-10],[82,18],[57,30],[-75,28]],p);
    plate(d,[[-64,-32],[34,-32],[57,-15],[-78,-15]],p,p.light,p.mid);
    plate(d,[[51,-26],[86,-11],[91,8],[77,25],[49,21],[43,-8]],p,p.mid,p.edge);
    d.poly([[56,-17],[76,-8],[74,0],[52,0]],p.glass,p.dark,2);d.line(64,-13,65,-1,p.edge,1.5);
    plate(d,[[-88,-7],[-55,-7],[-48,19],[-87,19]],p);grille(d,-83,-3,26,17,p,6,true);
    plate(d,[[-43,-8],[31,-8],[39,18],[-44,18]],p);d.rect(-34,-2,56,3,p.accent);d.text('Q–40',-30,12,8,p.light);
    plate(d,[[-35,-44],[18,-44],[28,-36],[-41,-36]],p,p.mid,p.edge);for(const x of [-63,-33,24,64])rivet(d,x,22,p);
    for(const x of [54,69,83])rivet(d,x,12,p,2.1);d.line(-83,26,59,28,p.dark,3);
  }else if(id==='WK06'){
    plate(d,[[-96,-17],[-76,-34],[41,-36],[87,-13],[92,9],[66,26],[-76,28]],p);
    plate(d,[[-77,-35],[-70,-59],[-15,-59],[-4,-35]],p,p.light,p.mid);
    for(let i=0;i<4;i++){d.line(-63+i*13,-54,-60+i*13,-40,p.edge,3);rivet(d,-63+i*13,-37,p,1.2);}
    plate(d,[[43,-29],[78,-13],[80,7],[47,12],[34,-9]],p,p.mid,p.edge);d.poly([[48,-22],[72,-11],[72,-2],[47,-3]],p.glass,p.dark,1.8);
    plate(d,[[-51,-16],[20,-16],[31,22],[-56,23]],p,p.mid,p.low);d.line(-45,-8,17,-8,p.accent,3);d.text('A–17',-32,10,9,p.light);
    d.rect(-26,27,38,18,p.edge,p.dark,1.4);d.line(-24,29,11,29,p.light,1);d.circle(-8,38,4,p.dark,p.mid,1);d.line(-21,38,5,38,p.steel,1);
    d.line(44,-32,44,-63,p.edge,5);d.circle(44,-65,5,p.light,p.dark,1.5);d.line(42,-65,46,-65,p.accent,1.2);grille(d,-91,-7,22,24,p,5);
    for(const x of [-71,-44,25,66])rivet(d,x,21,p);
  }else if(id==='WK09'){
    plate(d,[[-99,-20],[-76,-40],[47,-38],[91,-19],[98,10],[74,29],[-80,29],[-100,10]],p);
    plate(d,[[-76,-33],[42,-32],[58,-14],[-84,-14]],p,p.light,p.mid);
    plate(d,[[61,-27],[89,-12],[92,4],[55,10]],p,p.mid,p.edge);d.poly([[65,-19],[83,-10],[85,-3],[61,-2]],p.glass,p.dark,1.8);
    for(let j=0;j<3;j++){const x=-69+j*31;plate(d,[[x,-6],[x+25,-6],[x+28,17],[x-3,17]],p);grille(d,x+3,-1,19,13,p,4);rivet(d,x+4,20,p,1.5);d.line(x+23,-7,x+23,-12,p.steel,2);}
    d.rect(29,-5,8,24,p.accent);d.text('H–6',-18,-20,9,p.edge);for(const x of [-92,-76]){d.line(x,-30,x,-59,p.edge,6);d.line(x-3,-59,x+5,-59,p.mid,3);}
    plate(d,[[-53,-45],[-24,-45],[-22,-36],[-55,-36]],p,p.mid,p.edge);d.line(-47,-44,-47,-37,p.accent,2);d.line(-32,-44,-32,-37,p.accent,2);
  }else{
    plate(d,[[-100,-15],[-79,-34],[44,-34],[90,-20],[100,3],[85,23],[-83,24],[-100,10]],p);
    for(let i=0;i<5;i++){const x=-82+i*29;plate(d,[[x,-32],[x+23,-37],[x+32,-18],[x-4,-18]],p,p.light,p.mid);d.line(x+3,-29,x+22,-31,p.accent,1.2);rivet(d,x+5,-23,p,1.2);}
    plate(d,[[62,-20],[89,-12],[95,1],[65,5]],p,p.mid,p.edge);d.poly([[67,-13],[85,-8],[86,-3],[66,-3]],p.glass,p.dark,1.4);
    for(let i=0;i<3;i++){const x=-68+i*37;plate(d,[[x,-11],[x+27,-11],[x+30,14],[x-3,14]],p);grille(d,x+3,-5,20,12,p,3);}
    d.line(-94,-12,-111,-3,p.edge,7);d.line(-108,-4,-122,-14,p.steel,3);d.circle(-123,-15,3,p.accent,p.dark,1);d.text('CL–4',-19,-21,8,p.edge);d.rect(45,-8,5,22,p.accent);
  }
  const short=['WK02','WK10'].includes(id),mast=short?-51:-72;
  d.line(-18,-36,-18,mast,p.dark,2.5);d.line(-18,mast,-13,mast-8,p.steel,1.2);d.circle(-18,mast+3,1.8,p.accent);
  d.rect(-9,-46,24,7,p.edge,p.dark,1);d.circle(7,-43,2.4,'#b6d2bf',p.dark,.8);
  for(let i=0;i<4;i++)d.line(-rig.width/2+28+i*9,24,-rig.width/2+33+i*9,27,p.accent,.8);
  if(state==='damaged'||state==='hit')scars(d,-29,-8,25,17,p);
  if(state==='repaired')scars(d,-29,-8,25,17,p,true);
  if(state==='braced'){d.line(-rig.width*.34,34,-rig.width*.4,44,p.steel,3);d.line(rig.width*.34,34,rig.width*.4,44,p.steel,3);}
}
function limbGeometry(d,part,rig,p,state){
  const lower=part==='lower',width=100,h=24,slender=rig.id==='WK06'||rig.id==='WK01',compact=['WK02','WK10'].includes(rig.id);
  plate(d,[[0,-h/2],[width-9,-h/2],[width,-h*.3],[width,h*.3],[width-9,h/2],[0,h/2]],p);
  plate(d,[[8,-8],[compact?66:57,-8],[70,-3],[67,6],[9,7]],p,p.edge,p.low);
  d.line(12,-7,65,-7,p.light,1.3);d.line(10,7,67,7,p.dark,1.5);
  d.rect(lower?39:44,-12,7,24,p.accent);for(let i=0;i<3;i++)d.line(72+i*6,-8,72+i*6,8,p.dark,1.8);
  if(slender){d.line(20,3,82,3,p.dark,6);d.line(22,2,67,2,p.steel,2.5);d.rect(63,-1,20,6,p.mid);}
  if(rig.id==='WK05'||rig.id==='WK10'){plate(d,[[11,-13],[37,-13],[43,-8],[8,-8]],p,p.light,p.mid);d.line(15,-10,33,-10,p.dark,.8);}
  if(rig.id==='WK09'){d.rect(14,-5,23,9,p.edge);d.line(16,-2,35,-2,p.accent,1);}
  rivet(d,5,0,p,2.2);rivet(d,94,0,p,2.2);if(state==='damaged'||state==='hit')scars(d,54,-7,14,12,p);if(state==='repaired')scars(d,54,-7,14,12,p,true);
}
function footGeometry(d,rig,p,state){
  const w=rig.footWidth/2;plate(d,[[-w+5,-14],[w-7,-14],[w,-6],[w,0],[-w,0],[-w,-6]],p,p.light,p.low);
  d.line(-w,-1,w,-1,p.dark,3);for(let i=-1;i<=1;i++)d.line(i*w*.36,-11,i*w*.36+3,-4,p.accent,1.7);
  plate(d,[[-11,-18],[9,-18],[13,-11],[-13,-11]],p,p.mid,p.edge);d.circle(0,-13,4.4,p.edge,p.steel,1.2);
  for(const x of [-w+5,w-5])rivet(d,x,-7,p,1.5);
  if(state==='braced'){d.poly([[-w+1,-4],[-w+1,0],[-w+8,0]],p.steel,p.dark,.7);d.poly([[w-1,-4],[w-1,0],[w-8,0]],p.steel,p.dark,.7);}
  if(state==='damaged'||state==='hit')scars(d,8,-10,11,8,p);
}
function radiatorGeometry(d,rig,p,state,progress){
  const h=rig.bodyHeight*.65,w=22;
  plate(d,[[-11,-h/2],[-7,-h/2-1],[9,-h/2+2],[11,h/2-2],[7,h/2],[-11,h/2-1]],p,p.mid,p.edge);
  d.rect(-7,-h/2+5,13,h-10,p.dark,p.low,.6);
  const broken=state==='damaged'||state==='hit';
  for(let i=0;i<8;i++){const y=-h/2+7+i*(h-15)/7;d.line(-7,y,6,y+(broken&&i>2&&i<6?3:0),broken&&i>2&&i<6?p.rust:p.light,1.35);}
  for(const y of [-h/2+2,h/2-3]){rivet(d,-8,y,p,1.1);rivet(d,7,y,p,1.1);}
  d.rect(8,-10,2,20,p.accent);if(broken)scars(d,-6,-8,11,16,p);
  if(state==='repaired'){d.rect(-8,-3,15,5,p.steel,p.edge,.6);rivet(d,-5,-.5,p,.8);rivet(d,4,-.5,p,.8);}
  if(state==='repairing'){const q=paClamp(progress,0,1);d.rect(-7,-h/2+5,13,(h-10)*q,'#779c8c');for(let i=0;i<8;i++){const y=-h/2+7+i*(h-15)/7;if(i/8<q)d.line(-7,y,6,y,p.steel,1.35);}d.line(-9,h/2-2,9,h/2-2,p.dark,2);d.line(-9,h/2-2,-9+18*q,h/2-2,p.accent,2);}
  if(state==='hit'){d.line(-8,-5,8,6,'#f7b16d',1.4);d.line(-5,9,6,-7,'#f7b16d',1);}
}
function turretGeometry(d,rig,p,state){
  const barrel=rig.legs===4?105:rig.legs===6?94:85;d.circle(0,0,21,p.edge,p.light,2.2);d.circle(0,0,12,p.mid,p.dark,2.2);
  plate(d,[[-8,-12],[39,-12],[48,-7],[48,8],[-8,13]],p,p.light,p.low);d.rect(33,-6,barrel-30,12,p.edge,p.dark,1);
  d.line(40,-5,barrel,-5,p.steel,2.4);d.rect(barrel-10,-11,17,22,p.light,p.dark,1.3);d.rect(barrel+3,-8,6,16,p.edge,p.dark,.8);
  for(let i=0;i<4;i++)d.line(48+i*9,-8,48+i*9,8,p.mid,1.6);rivet(d,10,-7,p,1.8);rivet(d,10,7,p,1.8);
  if(rig.legs===6){d.rect(30,14,57,6,p.edge,p.dark,1);d.line(32,14,88,14,p.mid,1.2);}
  if(rig.id==='WK02')d.line(19,-14,41,-14,p.accent,2);if(rig.id==='WK06')d.rect(16,-18,18,5,p.mid,p.dark,1);
  if(state==='damaged')scars(d,16,-7,13,10,p);
}

export function productionPartGeometry({walkerId='WK01',part='hull',back=false,state='normal',progress=0}={}){
  const rig=PRODUCTION_RIGS[walkerId];if(!rig)throw new RangeError(`Unknown production rig: ${walkerId}`);
  const d=painter(),p=palette(rig,back);let size,bounds;
  if(part==='hull'){hullGeometry(d,rig,p,state);size=[rig.width,rig.bodyHeight];bounds=[-rig.width*.7,-86,rig.width*1.4,136];}
  else if(part==='upper'||part==='lower'){limbGeometry(d,part,rig,p,state);size=[100,24];bounds=[-3,-16,106,32];}
  else if(part==='foot'){footGeometry(d,rig,p,state);size=[rig.footWidth,18];bounds=[-rig.footWidth/2-2,-21,rig.footWidth+4,24];}
  else if(part==='radiator'){radiatorGeometry(d,rig,p,state,progress);size=[22,rig.bodyHeight*.65];bounds=[-13,-rig.bodyHeight*.325-3,26,rig.bodyHeight*.65+6];}
  else if(part==='turret'){turretGeometry(d,rig,p,state);size=[rig.legs===4?105:rig.legs===6?94:85,42];bounds=[-24,-25,size[0]+37,50];}
  else if(part==='hip'||part==='knee'){d.circle(0,0,14,p.dark,p.mid,1.8);d.circle(0,0,8,p.light,p.dark,1.8);d.line(-5,0,5,0,p.edge,2);for(let i=0;i<4;i++){const a=i*Math.PI/2;rivet(d,Math.cos(a)*11,Math.sin(a)*11,p,.9);}size=[28,28];bounds=[-16,-16,32,32];}
  else throw new RangeError(`Unknown production part: ${part}`);
  return {id:`${walkerId}-${part}-${back?'far':'near'}-${state}`,walkerId,part,state,size,pivot:[0,0],bounds,shapes:d.shapes};
}
function canvasFill(ctx,fill){if(typeof fill==='string')return fill;const g=ctx.createLinearGradient(0,fill.y1,0,fill.y2||fill.y1+1);g.addColorStop(0,fill.top);g.addColorStop(1,fill.bottom);return g;}
export function drawProductionGeometry(ctx,geometry,{mirrorText=false}={}){
  for(const s of geometry.shapes){ctx.beginPath();
    if(s.type==='polygon'){ctx.moveTo(...s.points[0]);for(let i=1;i<s.points.length;i++)ctx.lineTo(...s.points[i]);ctx.closePath();}
    else if(s.type==='rect')ctx.rect(s.x,s.y,s.w,s.h);
    else if(s.type==='circle')ctx.arc(s.x,s.y,s.r,0,PA_TAU);
    else if(s.type==='line'){ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);}
    else if(s.type==='path')for(const command of s.commands){const [op,...v]=command;if(op==='M')ctx.moveTo(...v);if(op==='L')ctx.lineTo(...v);if(op==='C')ctx.bezierCurveTo(...v);if(op==='Q')ctx.quadraticCurveTo(...v);if(op==='Z')ctx.closePath();}
    else if(s.type==='text'){ctx.fillStyle=s.fill;ctx.font=`500 ${s.size}px "Courier New",monospace`;ctx.textAlign=s.anchor==='middle'?'center':s.anchor==='end'?'right':'left';if(mirrorText){ctx.save();ctx.translate(s.x,s.y);ctx.scale(-1,1);ctx.fillText(s.text,0,0);ctx.restore();}else ctx.fillText(s.text,s.x,s.y);continue;}
    if(s.fill){ctx.fillStyle=canvasFill(ctx,s.fill);ctx.fill();}if(s.stroke){ctx.strokeStyle=s.stroke;ctx.lineWidth=s.strokeWidth;ctx.stroke();}
  }
}
const productionDrawCache=new Map();
export function drawProductionPart(ctx,options={}){
  const progress=Math.round(paClamp(options.progress||0,0,1)*128)/128,key=[options.walkerId||'WK01',options.part||'hull',options.state||'normal',!!options.back,progress].join(':');
  let geometry=productionDrawCache.get(key);if(!geometry){geometry=PRODUCTION_COMPONENT_NAMES.includes(options.part)?productionComponentGeometry({...options,progress}):productionPartGeometry({...options,progress});if(productionDrawCache.size>=1024)productionDrawCache.clear();productionDrawCache.set(key,geometry);}
  ctx.save();ctx.translate(options.x||0,options.y||0);if(options.rotation)ctx.rotate(options.rotation);ctx.scale((options.width??geometry.size[0])/geometry.size[0]*(options.facing===-1?-1:1),(options.height??geometry.size[1])/geometry.size[1]);drawProductionGeometry(ctx,geometry,{mirrorText:options.facing===-1});ctx.restore();return geometry;
}
function svgEscape(v){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
export function productionGeometrySVG(geometry,{title=geometry.id,technical=false,mirrorText=false}={}){
  const defs=[],elements=[],number=n=>Number(n.toFixed(4));
  for(let index=0;index<geometry.shapes.length;index++){
    const s=geometry.shapes[index];let fill=s.fill||'none';if(typeof fill==='object'){const id=`paint-${index}`;defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="${fill.y1}" y2="${fill.y2}"><stop stop-color="${fill.top}"/><stop offset="1" stop-color="${fill.bottom}"/></linearGradient>`);fill=`url(#${id})`;}
    const attrs=`fill="${fill}" stroke="${s.stroke||'none'}" stroke-width="${s.strokeWidth||1}" stroke-linejoin="round"`;
    if(s.type==='polygon')elements.push(`<polygon points="${s.points.map(p=>p.map(number).join(',')).join(' ')}" ${attrs}/>`);
    if(s.type==='rect')elements.push(`<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" ${attrs}/>`);
    if(s.type==='circle')elements.push(`<circle cx="${s.x}" cy="${s.y}" r="${s.r}" ${attrs}/>`);
    if(s.type==='line')elements.push(`<path d="M${s.x1} ${s.y1} L${s.x2} ${s.y2}" ${attrs}/>`);
    if(s.type==='path')elements.push(`<path d="${s.commands.map(c=>c[0]+c.slice(1).map(number).join(' ')).join(' ')}" ${attrs}/>`);
    if(s.type==='text'){const text=`<text x="${mirrorText?0:s.x}" y="${mirrorText?0:s.y}" fill="${fill}" font-family="Courier New,monospace" font-size="${s.size}" text-anchor="${s.anchor}">${svgEscape(s.text)}</text>`;elements.push(mirrorText?`<g transform="translate(${s.x} ${s.y}) scale(-1 1)">${text}</g>`:text);}
  }
  if(technical)elements.push('<g fill="none" stroke="#ee9463" stroke-width="0.6"><circle r="3"/><path d="M-5 0H5 M0-5V5"/></g>');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${geometry.bounds.join(' ')}" role="img" aria-labelledby="asset-title"><title id="asset-title">${svgEscape(title)}</title><metadata>${svgEscape(JSON.stringify({id:geometry.id,pivot:geometry.pivot,size:geometry.size,units:'game-world-unit',source:'src/production-assets.mjs',generator:'tools/build-production-assets.mjs',original:true}))}</metadata><defs>${defs.join('')}</defs><g id="${geometry.id}">${elements.join('')}</g></svg>\n`;
}

const COMPONENT_SPECS = {
  ambulance:{size:[176,78],assets:['AS49'],anchors:{cargo:[24,-55],beacon:[-99,26],patientExit:[65,38],driverDoor:[53,3]},states:['normal','damaged','destroyed']},
  beacon:{size:[26,20],assets:['AS60'],anchors:{mount:[0,0],cable:[12,-3]},states:['attached','dismantling','recovered','lost']},
  'medical-case':{size:[74,32],assets:['AS49'],anchors:{handle:[0,-16],inspection:[0,0]},states:['normal','inspecting','verified','destroyed']},
  ramp:{size:[240,28],assets:['AS49'],anchors:{road:[-120,0],quay:[120,-12],hinge:[95,-10]},states:['closed','working','prepared']},
  'dike-panel':{size:[78,144],assets:['AS48'],anchors:{hinge:[-34,0],support:[-40,30],lock:[29,0]},states:['normal','supported','locked','damaged','destroyed']},
  'auxiliary-pump':{size:[72,68],assets:['AS48','AS39'],anchors:{inlet:[-36,14],outlet:[36,-6],fuel:[-20,-24]},states:['normal','connected','active','destroyed']},
  'routing-valve':{size:[68,80],assets:['AS48','AS39'],anchors:{inlet:[-34,28],main:[34,28],bypass:[0,40]},states:['normal','working','completed']},
  'house-a':{size:[178,164],assets:['AS52'],anchors:{threshold:[17,82],roofRescue:[-40,-82],waterMark:[-78,51]},states:['dry','exposed','flooded','destroyed']},
  'house-b':{size:[186,158],assets:['AS52'],anchors:{threshold:[-44,79],roofRescue:[34,-79],waterMark:[81,48]},states:['dry','exposed','flooded','destroyed']},
  'tide-marker':{size:[24,110],assets:['AS44','AS17'],anchors:{datum:[0,55]},states:['normal']},
  dock:{size:[240,88],assets:['AS46','AS17'],anchors:{boatStop:[-120,-10],gangway:[-85,-5],land:[120,-5]},states:['normal','damaged']},
  ferry:{size:[134,58],assets:['AS46'],anchors:{exit:[45,4],mooring:[62,12]},states:['waiting','moving','arrived','destroyed']},
  'barge-seizure':{size:[172,78],assets:['AS45'],anchors:{winch:[-45,-33],radio:[37,-34],document:[18,-27]},states:['normal','released','damaged','destroyed']},
  'barge-rive-courte':{size:[184,68],assets:['AS45','AS50'],anchors:{winch:[-57,-31],radio:[43,-39],gangway:[68,0]},states:['waiting','boarding','moving','arrived','destroyed']},
  winch:{size:[44,44],assets:['AS45','AS47'],anchors:{cable:[-22,1],axle:[0,0]},states:['normal','loaded','released','destroyed']},
  gate:{size:[96,180],assets:['AS50'],anchors:{hinge:[-42,0],mechanism:[-220,64],inspection:[0,60],passage:[0,90]},states:['closed','working','open','damaged','blocked']},
  'gate-mechanism':{size:[56,52],assets:['AS50'],anchors:{axle:[0,-2],service:[0,26]},states:['normal','working','damaged','destroyed']},
  'boat-veille-aval':{size:[164,64],assets:['AS50'],anchors:{radio:[-33,-36],gangway:[-72,0],stretcherDeck:[30,-8]},states:['waiting','boarding','moving','arrived','destroyed']},
  refuge:{size:[212,152],assets:['AS50'],anchors:{entrance:[-42,76],stretcherEntrance:[42,76],lamp:[0,-68]},states:['normal','receiving','damaged']},
  'cooling-turbine':{size:[90,126],assets:['AS39'],anchors:{valve:[32,39],coupling:[-45,35]},states:['hot','working','cooled']},
  'maintenance-post':{size:[152,160],assets:['AS40'],anchors:{terminal:[42,34],entrance:[-15,80]},states:['normal','damaged','destroyed']},
};
export const PRODUCTION_COMPONENT_SPECS = COMPONENT_SPECS;
function warningStripe(d,x,y,w,h,p){d.rect(x,y,w,h,p.accent,p.dark,.7);for(let i=0;i<w;i+=9)d.poly([[x+i,y],[Math.min(x+i+4,x+w),y],[Math.min(x+i+9,x+w),y+h],[Math.min(x+i+5,x+w),y+h]],p.edge,null);}
function wheel(d,x,y,r,p){d.circle(x,y,r,p.dark,p.edge,1.5);d.circle(x,y,r*.63,p.low,p.mid,1.5);d.circle(x,y,r*.27,p.steel,p.dark,1.2);for(let i=0;i<5;i++){const a=i*PA_TAU/5;rivet(d,x+Math.cos(a)*r*.4,y+Math.sin(a)*r*.4,p,.8);}}
function componentGeometry(d,part,p,state,progress){
  const broken=state==='destroyed'||state==='lost';
  if(part==='ambulance'){
    d.rect(-76,17,153,13,p.edge,p.dark,2);for(const x of [-53,52])wheel(d,x,26,14,p);
    if(broken){plate(d,[[-83,2],[-58,-10],[-23,5],[3,-7],[27,13],[62,-4],[85,11],[76,25],[-79,25]],p,p.low,p.dark);scars(d,-44,-3,46,27,p);d.line(-63,-3,-49,-31,p.rust,4);d.line(55,-7,65,-24,p.edge,6);return;}
    plate(d,[[-85,-27],[-71,-36],[28,-36],[34,-30],[60,-30],[82,-7],[88,17],[74,23],[-83,21]],p,p.light,p.mid);
    plate(d,[[34,-30],[60,-29],[80,-7],[35,-7]],p,p.mid,p.edge);d.poly([[41,-25],[58,-25],[73,-10],[41,-10]],'#a2c3bd',p.dark,2);d.line(54,-24,54,-10,p.edge,1.2);
    d.rect(-69,-26,86,41,p.low,p.edge,1.4);d.rect(-65,-22,77,32,'#96a99b',p.dark,.7);d.line(-25,-21,-25,10,p.edge,1.2);for(const x of [-60,-19])d.rect(x,-16,29,13,'#34565a',p.edge,.7);
    d.rect(-78,-5,98,4,p.accent);d.line(35,-4,35,20,p.dark,1.3);d.rect(39,0,6,3,p.steel);grille(d,63,1,19,12,p,3);d.rect(83,9,5,6,p.glass,p.dark,.7);
    // Medical emblem is original: open ring around a two-rail stretcher, never a protected red cross.
    d.circle(-44,2,8,'#c9d1b7',p.edge,1);d.line(-49,0,-39,0,p.edge,2);d.line(-49,5,-39,5,p.edge,1);d.line(-47,-3,-47,7,p.edge,1);d.line(-41,-3,-41,7,p.edge,1);
    d.text('SOINS / 04',-65,14,5.4,p.edge);d.line(-77,-37,-40,-37,p.steel,2);d.rect(-76,-41,29,4,p.mid,p.dark,.8);for(const x of [-77,15,39,75])rivet(d,x,17,p,1.4);
    d.rect(-88,13,5,8,p.rust,p.dark,.7);if(state==='damaged')scars(d,0,-19,26,31,p);
  }else if(part==='beacon'){
    // The recovered state preserves the module and both torn clamps; lost renders an empty damaged mount.
    d.rect(-13,-6,26,12,p.edge,p.dark,1);for(const x of [-10,10]){d.rect(x-2,-10,4,20,p.mid,p.dark,.7);rivet(d,x,-7,p,1);rivet(d,x,7,p,1);}
    if(broken){d.line(-8,-3,6,4,p.rust,2);d.line(5,3,12,5,p.steel,1);scars(d,-6,-4,10,8,p);return;}
    const lift=state==='dismantling'?-6*paClamp(progress,0,1):state==='recovered'?-5:0;
    plate(d,[[-8,-8+lift],[7,-8+lift],[10,-4+lift],[10,6+lift],[-8,7+lift]],p,p.light,p.low);d.rect(-5,-5+lift,8,5,p.dark);d.circle(6,-3+lift,1.2,state==='recovered'?p.mid:p.accent);d.line(-4,3+lift,6,3+lift,p.edge,1);d.line(9,-1+lift,13,-3,p.steel,1.1);if(state==='recovered'){d.rect(-11,8,4,2,p.steel);d.rect(6,8,5,2,p.steel);}
  }else if(part==='medical-case'){
    if(broken){plate(d,[[-36,4],[-28,-9],[-8,1],[10,-13],[34,3],[29,15],[-33,15]],p,p.low,p.edge);scars(d,-21,-8,30,18,p);return;}
    plate(d,[[-37,-11],[-31,-16],[30,-16],[37,-10],[37,14],[-37,14]],p,p.light,p.mid);d.rect(-31,-10,62,18,p.low,p.edge,1);d.line(-35,-1,35,-1,p.dark,2);for(const x of [-25,25]){d.rect(x-3,-12,6,23,p.mid,p.dark,.8);rivet(d,x,8,p,1.2);}d.rect(-8,-18,16,3,p.edge,p.dark,.8);d.text('SAN / 04',-17,10,5,p.edge);d.circle(0,-6,3,state==='verified'?'#b8cfac':p.accent,p.dark,.8);if(state==='inspecting')d.line(-29+58*paClamp(progress,0,1),-13,-29+58*paClamp(progress,0,1),12,'#b9dbce',1.2);
  }else if(part==='ramp'){
    const q=state==='prepared'?1:state==='working'?paClamp(progress,0,1):0,y=-3-9*q;
    plate(d,[[-120,7],[95,y],[120,y],[120,y+14],[-120,14]],p,p.mid,p.edge);for(let i=0;i<16;i++){const x=-112+i*14;d.line(x,7+(x+120)/240*(y-7),x+4,14+(x+120)/240*(y-7),p.dark,1.7);}d.line(-117,6,116,y-1,p.light,1.5);d.circle(96,y+6,5,p.edge,p.steel,1.2);warningStripe(d,103,y-2,16,4,p);
  }else if(part==='dike-panel'||part==='gate'){
    const gate=part==='gate',w=gate?96:78,h=gate?180:144,q=state==='open'?1:paClamp(progress,0,1),dy=gate?-h*.72*q:0;
    for(const x of [-w/2+2,w/2-2]){d.rect(x-4,-h/2,8,h,p.edge,p.dark,1.5);d.line(x,-h/2,x,h/2,p.steel,1);}
    if(state==='destroyed'){plate(d,[[-w/2+8,h/2-25],[-w/4,h/2-43],[0,h/2-20],[w/2-7,h/2-30],[w/2-7,h/2],[-w/2+8,h/2]],p,p.low,p.edge);return;}
    plate(d,[[-w/2+8,-h/2+5+dy],[w/2-8,-h/2+5+dy],[w/2-8,h/2-4+dy],[-w/2+8,h/2-4+dy]],p,p.mid,p.low);
    for(let i=1;i<=5;i++){const y=-h/2+i*h/6+dy;d.rect(-w/2+10,y-3,w-20,6,p.edge,p.dark,.6);d.line(-w/2+12,y-3,w/2-12,y-3,p.light,1);}
    for(const x of [-w/2+13,w/2-13])for(let i=0;i<6;i++)rivet(d,x,-h/2+11+i*(h-22)/5+dy,p,1.5);
    d.rect(-10,-h/2+15+dy,20,10,p.dark);d.text(gate?'AVAL':'TV',0,-h/2+22+dy,6,p.light,'middle');
    if(state==='locked'||state==='blocked'){for(const y of [-h*.22,h*.22]){d.rect(w/2-17,y,22,6,p.steel,p.dark,1);d.rect(w/2-2,y-3,8,12,p.edge,p.dark,1);}}
    if(state==='supported'){d.line(-w/2-6,h/2,-7,11,p.dark,11);d.line(-w/2-6,h/2,-7,11,p.mid,7);d.line(-w/2-6,h/2,-7,11,p.steel,2);}
    if(state==='damaged'||state==='blocked')scars(d,-18,-13+dy,33,38,p);
  }else if(part==='gate-mechanism'){
    plate(d,[[-28,-23],[-23,-26],[24,-26],[28,-21],[28,26],[-28,26]],p,p.mid,p.low);d.circle(0,-2,18,p.edge,p.light,1.6);d.circle(0,-2,11,p.dark,p.mid,1);d.line(0,-2,Math.cos(-1.1+progress*2.2)*14,-2+Math.sin(-1.1+progress*2.2)*14,p.accent,2);d.rect(-23,18,46,5,p.edge);for(const x of [-22,22])for(const y of [-20,21])rivet(d,x,y,p,1.3);if(state==='damaged'||broken)scars(d,-18,-16,36,33,p);
  }else if(part==='boat-veille-aval'){
    if(broken){plate(d,[[-82,4],[-54,-5],[-22,10],[11,0],[37,15],[74,2],[60,32],[-64,32]],p,p.low,p.dark);scars(d,-20,8,39,21,p);return;}
    plate(d,[[-82,-2],[82,-2],[70,18],[47,32],[-61,30],[-78,13]],p,p.light,p.low);d.line(-77,4,75,4,p.mid,2);d.line(-64,21,54,24,p.accent,3);plate(d,[[-53,-30],[-24,-39],[1,-28],[6,-2],[-58,-2]],p,p.light,p.mid);d.rect(-44,-28,15,15,'#a5c3b8',p.dark,1.2);d.rect(-24,-26,19,13,'#a5c3b8',p.dark,1.2);d.line(-51,-30,-51,-45,p.dark,1.6);d.circle(-51,-45,1.6,p.accent);d.rect(13,-20,55,18,p.edge,p.dark,1);d.line(17,-24,63,-24,p.mid,4);d.line(18,-23,18,-1,p.mid,2);d.line(61,-23,61,-1,p.mid,2);d.rect(24,-12,30,5,p.light);d.line(25,-14,25,-5,p.mid,1);d.line(52,-14,52,-5,p.mid,1);d.text('VEILLE / AVAL',-47,16,6,p.edge);for(const x of [-67,64])d.circle(x,5,5,p.dark,p.mid,1.2);if(state==='arrived')d.line(-76,-3,-95,-7,p.mid,3);
  }else if(part==='auxiliary-pump'){
    if(broken){plate(d,[[-35,16],[-22,-3],[-4,7],[9,-12],[30,8],[34,31],[-35,31]],p,p.low,p.edge);scars(d,-14,-2,26,24,p);return;}
    plate(d,[[-36,-22],[-26,-32],[21,-32],[34,-20],[34,29],[-36,29]],p);d.rect(-29,-23,26,47,p.edge,p.dark,1);grille(d,-25,-18,17,32,p,7);d.circle(15,1,18,p.low,p.dark,1.5);d.circle(15,1,12,p.mid,p.steel,1);d.circle(15,1,5,p.edge,p.dark,1);
    for(let i=0;i<6;i++){const a=i*PA_TAU/6+(state==='active'?progress*PA_TAU:0);d.line(15+Math.cos(a)*6,1+Math.sin(a)*6,15+Math.cos(a)*11,1+Math.sin(a)*11,p.steel,1.4);}d.rect(-38,8,8,10,p.mid,p.dark,1);d.rect(30,-11,8,10,p.mid,p.dark,1);d.rect(-25,-35,14,5,p.accent,p.dark,1);d.circle(20,-23,2,state==='connected'||state==='active'?'#b9d3ae':p.rust,p.dark,.7);d.line(-31,31,29,31,p.dark,4);
  }else if(part==='routing-valve'){
    d.rect(-34,18,68,19,p.low,p.dark,1.5);d.rect(-8,-30,16,63,p.mid,p.dark,1.5);d.circle(0,-12,25,p.edge,p.light,2.5);d.circle(0,-12,17,p.dark,p.mid,1.5);const a=(state==='completed'?1:progress)*Math.PI/2;for(let i=0;i<4;i++){const v=a+i*Math.PI/2;d.line(Math.cos(v)*6,-12+Math.sin(v)*6,Math.cos(v)*21,-12+Math.sin(v)*21,p.mid,4);}d.circle(0,-12,6,p.accent,p.dark,1.5);for(const x of [-27,27]){d.rect(x-3,14,6,27,p.mid,p.dark,1);rivet(d,x,20,p,1.2);rivet(d,x,34,p,1.2);}
  }else if(part==='house-a'||part==='house-b'||part==='maintenance-post'||part==='refuge'){
    const spec=COMPONENT_SPECS[part],[w,h]=spec.size,half=w/2,bottom=h/2,refuge=part==='refuge',post=part==='maintenance-post',second=part==='house-b';
    if(broken){plate(d,[[-half,bottom],[-half,bottom-62],[-half+23,bottom-74],[-20,bottom-31],[13,bottom-52],[half-20,bottom-21],[half,bottom-36],[half,bottom]],p,p.low,p.edge);for(let i=0;i<7;i++)d.poly([[-half+6+i*24,bottom-3],[-half+11+i*24,bottom-19-(i%3)*9],[-half+28+i*24,bottom-2]],p.mid,p.dark,1);d.line(-half+22,bottom-49,-half+25,bottom-95,p.rust,3);return;}
    plate(d,[[-half,-h*.34],[-half+15,-h/2],[half-15,-h/2],[half,-h*.34],[half,bottom],[-half,bottom]],p,post?'#9c9c81':'#839a8f',p.low);
    plate(d,[[-half-5,-h*.34],[-half+13,-h/2-5],[half-15,-h/2-5],[half+6,-h*.34]],p,p.mid,p.edge);d.line(-half+3,-h*.34+3,half-4,-h*.34+3,p.light,2);
    for(let i=0;i<3;i++){const y=-h*.25+i*37;d.line(-half+5,y,half-5,y,p.edge,1);for(let j=0;j<3;j++){const x=-half+17+j*(w-45)/3;d.rect(x,y+8,24,19,p.edge,p.dark,1.3);d.rect(x+3,y+11,18,12,'#c1c7a0',p.dark,.7);d.line(x+12,y+11,x+12,y+23,p.mid,1);}}
    const door=spec.anchors.entrance||spec.anchors.threshold||[-15,bottom];d.rect(door[0]-15,bottom-47,30,47,p.dark,p.mid,2);d.rect(door[0]-10,bottom-41,20,41,p.low);d.line(door[0]+5,bottom-26,door[0]+8,bottom-26,p.steel,1.5);d.rect(door[0]-20,bottom-3,40,4,p.light,p.edge,1);
    if(second){for(let i=0;i<5;i++)d.rect(-half-13+i*10,bottom-6-i*5,12,6,p.mid,p.dark,.8);d.line(-half-7,bottom-26,-half+35,bottom-49,p.steel,2);}
    d.line(half-9,-h*.32,half-9,bottom-4,p.dark,4);d.line(half-8,-h*.32,half-8,bottom-4,p.mid,1.5);
    d.rect(-half+9,bottom-36,7,30,p.light,p.dark,.6);for(let i=0;i<5;i++)d.line(-half+9,bottom-32+i*6,-half+16,bottom-32+i*6,p.edge,1);
    if(post){d.rect(28,8,33,48,p.edge,p.dark,1.5);d.rect(32,13,25,15,'#a7bea6',p.dark,1);d.line(35,18,52,18,p.edge,.8);d.line(35,23,48,23,p.edge,.8);d.circle(43,41,4,p.accent,p.dark,1);d.text('POSTE',-30,-h*.34+15,8,p.light);}
    if(refuge){d.rect(27,bottom-53,40,53,p.dark,p.light,1.7);d.line(35,bottom-50,35,bottom,p.mid,2);d.line(57,bottom-50,57,bottom,p.mid,2);d.text('REFUGE',0,-h*.34+16,10,p.light,'middle');d.rect(-10,-h/2+8,20,6,p.glass,p.dark,1);}
    if(state==='exposed'){warningStripe(d,-half+3,bottom-58,31,6,p);d.line(-half,bottom-4,half,bottom-4,'#a4c9c7',2);}
    if(state==='flooded'){d.poly([[-half,bottom-30],[-half+40,bottom-33],[0,bottom-29],[half,bottom-32],[half,bottom],[-half,bottom]],'#375c62',p.edge,1);d.line(-half,bottom-30,half,bottom-32,'#8fb7b4',1.4);d.rect(door[0]-13,bottom-42,26,5,p.rust);}
    if(state==='damaged')scars(d,-half+24,-h*.2,35,44,p);
  }else if(part==='tide-marker'){
    d.rect(-7,-55,14,110,p.mid,p.dark,1.5);d.rect(-4,-53,8,106,p.light,p.edge,.5);for(let i=0;i<11;i++){const y=-49+i*9;d.line(-4,y,i%2?1:4,y,p.edge,1.4);if(i%2===0)d.text(String(10-i),8,y+2,5,p.light);}d.rect(-12,51,24,4,p.edge,p.dark,1);
  }else if(part==='dock'){
    for(const x of [-91,-20,62,110]){d.rect(x-7,-5,14,49,p.low,p.dark,1.5);d.line(x-4,10,x+4,10,p.mid,1);d.line(x-4,31,x+4,31,p.mid,1);}
    plate(d,[[-120,-16],[120,-16],[120,-3],[-120,-3]],p,p.light,p.low);for(let x=-114;x<120;x+=19)d.line(x,-14,x,-5,p.dark,1.3);for(const x of [-105,-62,-19]){d.circle(x,0,8,p.dark,p.mid,2);d.line(x-5,-7,x-5,-15,p.steel,1);}for(const x of [-90,70]){d.rect(x,-38,4,23,p.edge,p.dark,.8);d.circle(x+2,-39,3,p.glass,p.dark,1);}d.line(-88,-27,72,-27,p.mid,2);if(state==='damaged')scars(d,15,-14,31,10,p);
  }else if(part==='ferry'||part==='barge-seizure'||part==='barge-rive-courte'){
    const [w,h]=COMPONENT_SPECS[part].size,half=w/2,seizure=part==='barge-seizure',ferry=part==='ferry';
    if(broken){plate(d,[[-half,h*.1],[-half+27,-h*.05],[-8,h*.23],[30,-h*.04],[half-5,h*.15],[half-22,h*.5],[-half+21,h*.5]],p,p.low,p.dark);scars(d,-half+22,2,44,h*.4,p);return;}
    plate(d,[[-half,-2],[half,-2],[half-14,h*.42],[half-35,h*.5],[-half+20,h*.5]],p,p.mid,p.edge);d.line(-half+3,3,half-5,3,p.light,2);d.line(-half+16,h*.32,half-21,h*.32,p.accent,3);
    plate(d,[[half*.12,-h*.42],[half*.6,-h*.42],[half*.75,-h*.13],[half*.75,-2],[half*.09,-2]],p,p.light,p.mid);d.rect(half*.18,-h*.35,half*.33,h*.16,'#9ac1b7',p.dark,1.3);d.line(half*.34,-h*.35,half*.34,-h*.19,p.edge,1);
    d.rect(-half+15,-h*.27,half*.88,h*.24,p.low,p.dark,1);for(let x=-half+20;x<0;x+=15){d.line(x,-h*.24,x,-h*.06,p.mid,1);d.circle(x,-h*.29,1.3,p.steel);}
    if(seizure){warningStripe(d,-half+8,-5,half*.85,5,p);d.rect(-45,-33,20,24,p.edge,p.dark,1.2);d.circle(-35,-23,7,p.mid,p.steel,1);d.line(-35,-23,-68,-36,p.steel,1.5);d.text('SAISIE',-20,16,7,p.light);}
    else d.text(ferry?'PASSAGE':'RIVE–COURTE',-half+26,15,ferry?6:7,p.light);
    d.line(half*.46,-h*.42,half*.46,-h*.68,p.dark,2);d.circle(half*.46,-h*.68,1.8,p.accent);for(const x of [-half+12,half-22])d.circle(x,8,5,p.dark,p.mid,1.2);if(state==='arrived')d.line(half-5,-3,half+15,-8,p.mid,3);if(state==='damaged')scars(d,-45,6,27,20,p);
  }else if(part==='winch'){
    d.rect(-22,13,44,9,p.edge,p.dark,1);d.rect(-18,-17,36,34,p.low,p.dark,1.3);d.circle(0,0,15,p.mid,p.dark,2);d.circle(0,0,9,p.edge,p.steel,1.2);for(let i=0;i<5;i++){const a=i*PA_TAU/5;d.line(Math.cos(a)*5,Math.sin(a)*5,Math.cos(a)*12,Math.sin(a)*12,p.light,1.6);}d.circle(0,0,4,p.accent,p.dark,1);if(state!=='released'&&!broken)d.line(-21,1,-14,1,p.steel,2);else d.line(-20,1,-16,6,p.rust,1.5);if(broken)scars(d,-15,-14,28,25,p);
  }else if(part==='cooling-turbine'){
    d.rect(-39,49,78,14,p.edge,p.dark,1.5);plate(d,[[-36,-53],[-23,-63],[20,-63],[36,-52],[40,49],[-40,49]],p,p.mid,p.low);grille(d,-29,-47,58,75,p,13);d.circle(0,-10,28,p.edge,p.light,2);d.circle(0,-10,20,p.dark,p.mid,1);for(let i=0;i<6;i++){const a=i*PA_TAU/6+progress*PA_TAU;d.line(Math.cos(a)*6,-10+Math.sin(a)*6,Math.cos(a)*18,-10+Math.sin(a)*18,p.steel,2.7);}d.circle(0,-10,7,p.mid,p.dark,1.3);d.rect(-45,29,21,14,p.mid,p.dark,1);d.circle(31,39,8,p.edge,p.light,1.5);d.line(26,39,36,39,p.accent,2);d.rect(-28,35,38,7,state==='cooled'?'#a8c2b1':'#d38a51',p.dark,1);
  }
}
export function productionComponentGeometry({part='beacon',state='normal',progress=0,back=false}={}){
  const spec=COMPONENT_SPECS[part];if(!spec)throw new RangeError(`Unknown production component: ${part}`);const d=painter(),p=palette(null,back);componentGeometry(d,part,p,state,progress);
  const [w,h]=spec.size;const bounds=part==='gate'?[-54,-230,108,324]:part==='beacon'?[-15,-21,32,34]:part==='barge-rive-courte'||part==='barge-seizure'||part==='ferry'||part==='boat-veille-aval'?[-w/2-3,-h*.73,w+23,h*1.3]:[-w/2-18,-h/2-10,w+36,h+22];
  return{id:`nacre-${part}-${state}`,part,state,size:[...spec.size],pivot:[0,0],bounds,anchors:spec.anchors,assets:spec.assets,shapes:d.shapes};
}

/** Derive visible joints from authoritative feet, exactly as the existing inverse-kinematics renderer.
 * This helper never moves a foot, changes a contact or introduces a new collision. */
export function productionLegPose(player,walker,foot){
  const hip=[player.x+foot.homeOffset*(walker.legs===2?.37:.68),player.y+player.height/2-9];
  const upper=walker.height*.62,lower=walker.height*.64,dx=foot.x-hip[0],dy=foot.y-hip[1];
  const reach=Math.max(2,Math.min(Math.hypot(dx,dy),upper+lower-2));
  const a=Math.acos(paClamp((upper*upper+reach*reach-lower*lower)/(2*upper*reach),-1,1)),base=Math.atan2(dy,dx),bend=walker.legs===2?-1:foot.homeOffset<0?1:-1;
  const knee=[hip[0]+Math.cos(base+a*bend)*upper,hip[1]+Math.sin(base+a*bend)*upper];
  return{hip,knee,ankle:[foot.x,foot.y-8],contact:[foot.x,foot.y],upper,lower};
}
export function productionWalkerParts(player,walker,{includeRadiator=true}={}){
  const parts=[],walkerId=walker.id,add=(part,options)=>parts.push({walkerId,part,...options});
  const leg=foot=>{const pose=productionLegPose(player,walker,foot),back=foot.side==='back',thickness=walker.legs===2?23:18,state=foot.health<45?'damaged':player.braced?'braced':'normal';
    for(const [part,a,b,h]of [['upper',pose.hip,pose.knee,thickness],['lower',pose.knee,pose.ankle,thickness*.7]])add(part,{name:`${foot.id}-${part}`,x:a[0],y:a[1],width:Math.hypot(b[0]-a[0],b[1]-a[1]),height:h,rotation:Math.atan2(b[1]-a[1],b[0]-a[0]),back,state});
    add('hip',{name:`${foot.id}-hip`,x:pose.hip[0],y:pose.hip[1],width:thickness*1.24,height:thickness*1.24,back,state});
    add('knee',{name:`${foot.id}-knee`,x:pose.knee[0],y:pose.knee[1],width:thickness*1.3,height:thickness*1.3,back,state});
    add('foot',{name:`${foot.id}-foot`,x:foot.x,y:foot.y,back,state,contact:foot.contact,group:foot.group});
  };
  for(const foot of player.feet.filter(f=>f.side==='back'))leg(foot);
  add('hull',{name:'hull',x:player.x,y:player.y,width:player.width,height:player.height,facing:player.facing,state:player.hull/player.maxHull<.45?'damaged':player.braced?'braced':'normal'});
  for(const foot of player.feet.filter(f=>f.side!=='back'))leg(foot);
  add('turret',{name:'turret',x:player.x+9,y:player.y+8,rotation:player.aimAngle||0,state:'normal'});
  if(includeRadiator&&player.radiator){const r=player.radiator;add('radiator',{name:'radiator',x:player.x-player.facing*(player.width/2+6),y:player.y-2,width:22,height:player.height*.65,state:r.repairing?'repairing':r.health<50?'damaged':r.repairKits<r.maxRepairKits?'repaired':'normal',progress:r.repairProgress});}
  return parts;
}

/** Concept silhouettes for the six additional chassis. Height is canon metres, not a collision promise. */
export function productionSilhouetteGeometry(id){
  const model=SILHOUETTE_MODELS.find(m=>m.id===id);if(!model)throw new RangeError(`Unknown silhouette ${id}`);
  const d=painter(),ink='#c2c8b9',dark='#132b32',h=model.height*12,w=model.legs===2?68:model.legs===4?122:158,bodyY=-h*.72;
  const limb=(x1,y1,x2,y2,x3,y3,width)=>{d.line(x1,y1,x2,y2,ink,width);d.line(x2,y2,x3,y3,ink,width*.72);d.circle(x2,y2,width*.65,ink);d.poly([[x3-width,y3-6],[x3+width,y3-6],[x3+width+3,y3],[x3-width-3,y3]],ink,null);};
  if(model.body==='heron'){
    limb(-14,bodyY+10,-31,-h*.36,-23,0,9);limb(17,bodyY+12,47,-h*.45,31,0,9);d.line(-31,-h*.36,-25,-h*.12,dark,2);d.line(47,-h*.45,35,-h*.12,dark,2);
    d.poly([[-39,bodyY-18],[-24,bodyY-33],[17,bodyY-29],[39,bodyY-7],[17,bodyY+13],[-30,bodyY+11]],ink,null);d.rect(-15,bodyY-50,5,26,ink);d.rect(-28,bodyY-51,32,5,ink);d.circle(-12,bodyY-57,7,ink);d.rect(12,bodyY-4,91,6,ink);d.rect(94,bodyY-8,13,13,ink);d.rect(-27,bodyY-11,29,5,dark);d.line(-5,bodyY+4,14,bodyY+4,dark,2);
  }else if(model.body==='stealth'){
    limb(-16,bodyY+6,-44,-h*.26,-23,0,13);limb(14,bodyY+5,47,-h*.31,31,0,12);
    d.poly([[-48,bodyY-4],[-26,bodyY-25],[25,bodyY-22],[49,bodyY-5],[20,bodyY+10],[-22,bodyY+14]],ink,null);d.poly([[-28,bodyY-23],[-43,bodyY-41],[1,bodyY-26]],ink,null);d.rect(21,bodyY-2,48,8,ink);d.rect(-24,bodyY-11,27,4,dark);d.line(-36,bodyY+5,29,bodyY-11,dark,2);d.rect(-39,bodyY+4,13,19,ink);d.rect(11,bodyY+8,20,12,ink);
  }else if(model.body==='otter'){
    for(const sign of [-1,1]){limb(sign*35,bodyY+8,sign*55,-h*.27,sign*75,0,12);limb(sign*19,bodyY+14,sign*30,-h*.25,sign*43,0,10);d.poly([[sign*75-24,-5],[sign*75+24,-5],[sign*75+28,0],[sign*75-28,0]],ink,null);}
    d.poly([[-73,bodyY-9],[-51,bodyY-25],[39,bodyY-25],[72,bodyY-7],[54,bodyY+17],[-51,bodyY+15]],ink,null);d.rect(-51,bodyY-35,30,13,ink);d.rect(18,bodyY-18,30,7,dark);d.line(-52,bodyY+5,51,bodyY+5,dark,2);d.rect(33,bodyY-4,61,7,ink);d.rect(-29,bodyY-19,22,4,dark);
  }else if(model.body==='siege'){
    for(const sign of [-1,1]){limb(sign*37,bodyY+10,sign*58,-h*.35,sign*78,0,17);limb(sign*18,bodyY+13,sign*27,-h*.37,sign*47,0,15);d.rect(sign*78-13,-10,26,10,ink);}
    d.poly([[-74,bodyY-17],[-42,bodyY-41],[32,bodyY-38],[78,bodyY-8],[74,bodyY+25],[-62,bodyY+20]],ink,null);d.poly([[49,bodyY-29],[75,bodyY-14],[85,bodyY+18],[65,bodyY+30],[43,bodyY+4]],ink,null);d.rect(20,bodyY-24,94,10,ink);d.rect(15,bodyY-6,100,10,ink);d.rect(106,bodyY-28,16,35,ink);d.rect(-35,bodyY-20,28,7,dark);d.line(-52,bodyY+3,33,bodyY+3,dark,3);
  }else if(model.body==='megalith'){
    for(const x of [-69,-31,18,58,85,-90])limb(x*.65,bodyY+13,x*1.05,-h*.35,x*1.18,0,18);
    d.poly([[-103,bodyY-24],[-66,bodyY-52],[57,bodyY-50],[109,bodyY-24],[94,bodyY+28],[-91,bodyY+28]],ink,null);for(let i=0;i<3;i++)d.rect(-35+i*19,bodyY-82,10,53,ink);d.rect(-43,bodyY-40,75,23,ink);d.rect(25,bodyY-35,128,14,ink);d.rect(142,bodyY-40,21,23,ink);d.rect(-75,bodyY-15,38,7,dark);d.rect(43,bodyY-12,38,7,dark);for(let x=-80;x<80;x+=40)d.line(x,bodyY+5,x+22,bodyY+5,dark,3);
  }else if(model.body==='rescue'){
    for(const x of [-70,-40,-4,30,63,87])limb(x*.65,bodyY+15,x*.88,-h*.3,x,0,10);
    d.poly([[-84,bodyY-15],[-60,bodyY-30],[37,bodyY-30],[78,bodyY-8],[66,bodyY+25],[-71,bodyY+25]],ink,null);d.rect(-30,bodyY+15,58,26,ink);d.rect(-23,bodyY+20,43,15,dark);d.rect(-15,bodyY+26,28,4,ink);d.rect(42,bodyY-20,23,8,dark);d.line(-47,bodyY-23,-56,bodyY-57,ink,7);d.line(-56,bodyY-57,-10,bodyY-52,ink,7);d.line(-10,bodyY-52,-10,bodyY-25,ink,2);d.circle(-10,bodyY-22,4,ink);d.line(-56,bodyY-27,-36,bodyY-27,dark,2);
  }else{
    const rig=PRODUCTION_RIGS[id],footOffsets=rig.offsets,scale=h/(rig.height+82),bodyHeight=rig.bodyHeight*scale;
    for(let i=0;i<footOffsets.length;i++){const x=footOffsets[i]*scale,kx=x*(model.legs===2?1.35:1.12);limb(x*.5,-rig.height*scale+bodyHeight/2,kx,-rig.height*scale*.42,x,0,(model.legs===2?15:12)*scale);}
    const body=productionPartGeometry({walkerId:id,part:'hull'});for(const shape of body.shapes){if(shape.type==='text')continue;const transformPoint=(x,y)=>[x*scale,y*scale-rig.height*scale];let s={...shape,fill:shape.fill?ink:null,stroke:shape.stroke?ink:null,strokeWidth:(shape.strokeWidth||1)*scale};
      if(s.type==='polygon')s.points=s.points.map(p=>transformPoint(...p));if(s.type==='line'){[s.x1,s.y1]=transformPoint(s.x1,s.y1);[s.x2,s.y2]=transformPoint(s.x2,s.y2);}if(s.type==='rect'){[s.x,s.y]=transformPoint(s.x,s.y);s.w*=scale;s.h*=scale;}if(s.type==='circle'){[s.x,s.y]=transformPoint(s.x,s.y);s.r*=scale;}d.shapes.push(s);}
    d.rect(9*scale,-rig.height*scale+2*scale,95*scale,9*scale,ink);d.rect(94*scale,-rig.height*scale-2*scale,15*scale,17*scale,ink);
  }
  return{id:`${id}-silhouette`,part:'silhouette',model,size:[Math.max(w*2,220),h],pivot:[0,0],bounds:[-190,-Math.max(h+36,120),390,Math.max(h+36,120)+5],shapes:d.shapes};
}
