/** Strict MI08 save/receipt validation. No mutation, persistence, DOM or game advancement. */
import { createGame, departurePersonSeeds, departureReceiptRoster, departureTideAt, terrainAt } from './simulation.mjs';

const FLAGS = ['quayContacted','refugeContacted','refugeAvailable','boardingOrdered','intakeClosed','passageClosed','emergencySeal','closureCompleted','accessMaintained','documentsInspected','registryCopied','forcedContractsVerified','manifestRead','reportTransmitted','reportFiled','maraContacted','maraPresent','maraDeparted','vannContacted'];
const COUNTS = ['controlsInspected','originsResolved','peopleTotal','peopleAtQuay','peopleAboard','peopleDeparted','peopleEnRoute','peopleArrived','peopleLocal','peopleLost','patientsTotal','patientsArrived','patientsLocal','patientsLost','boatsTotal','boatsDeparted','boatsArrived','boatsLost','techniciansAssigned'];
const PERSON_KEYS = ['id','sourceMission','sourceGroup','sourceKind','originalId','role','alive','safe','phase','met','consent','destination','boatId','departed','serviceAccepted'];
const BOAT_KEYS = ['id','kind','name','hp','maxHp','destroyed','phase','departed','arrived','returned'];
const PERSON_PHASES = ['origin','joining','quay','boarding','aboard','en-route','landing','arrived','returning','local','duty','offsite','lost'];
const BOAT_PHASES = ['moored','boarding','waiting','crossing','en-route','arrived','returning','returned','lost'];
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
function requireValue(ok, message) { if (!ok) throw new Error(`Sauvegarde invalide : départ de Nacre — ${message}`); }
function number(n, min, max, label, integer = false) { requireValue(Number.isFinite(n) && n >= min && n <= max && (!integer || Number.isInteger(n)), label); }
function boolean(v, label) { requireValue(typeof v === 'boolean', label); }
function equal(a,b,label) { requireValue(JSON.stringify(a) === JSON.stringify(b), label); }
function keys(value, expected, label) { requireValue(object(value) && Object.keys(value).length === expected.length && expected.every(k => Object.hasOwn(value,k)), label); }
function fixed(value, initial, fields, label) { for (const key of fields) requireValue(value[key] === initial[key], `${label}.${key}`); }
function shape(value, initial, label) {
  keys(value,Object.keys(initial),`${label} champs`);
  for (const [key, expected] of Object.entries(initial)) if (expected !== null && !object(expected) && !Array.isArray(expected)) requireValue(typeof value[key] === typeof expected, `${label}.${key} type`);
}

export function createDepartureDossier() {
  return { plan:'unselected', ...Object.fromEntries(COUNTS.map(k=>[k,0])), ...Object.fromEntries(FLAGS.map(k=>[k,false])), execution:'pending', roster:{people:[],boats:[]} };
}

export function departureContextFor(campaign) {
  const { passage, dike, ambulance } = campaign.world.nacre;
  return { ...Object.fromEntries(['refugeesPassed','refugeesLost','smugglerVerified','bargeCiviliansLost'].map(k=>[k,passage[k]])),
    ...Object.fromEntries(['residentsSafe','residentsLost','techniciansAlive','techniciansLost','homesUninhabitable','pumpsOnline','panelsLocked','emergencyShoring','dikeFatigue'].map(k=>[k,dike[k]])),
    patientsArrived:ambulance.patientsArrived, patientsLost:ambulance.patientsLost, staffArrived:ambulance.staffArrived, staffLost:ambulance.staffLost,
    medicalDestination:ambulance.destination, medicalVehicleRecovered:ambulance.vehicleRecovered, medicalVehicleSeized:ambulance.vehicleSeized,
    medicalWitnessId:ambulance.witnessId, medicalWitnessAvailable:ambulance.witnessAvailable };
}

function validateContext(c) {
  for (const key of ['smugglerVerified','pumpsOnline','emergencyShoring','medicalVehicleRecovered','medicalVehicleSeized','medicalWitnessAvailable']) boolean(c[key],`héritage ${key}`);
  for (const [key,max] of [['refugeesPassed',12],['refugeesLost',12],['bargeCiviliansLost',4],['residentsSafe',10],['residentsLost',10],['techniciansAlive',2],['techniciansLost',2],['homesUninhabitable',2],['panelsLocked',1],['patientsArrived',4],['patientsLost',4],['staffArrived',2],['staffLost',2]]) number(c[key],0,max,`héritage ${key}`,true);
  number(c.dikeFatigue,0,100,'fatigue héritée');
  requireValue(c.refugeesPassed+c.refugeesLost===12 && c.residentsSafe+c.residentsLost===10 && c.techniciansAlive+c.techniciansLost===2 && c.patientsArrived+c.patientsLost===4 && c.staffArrived+c.staffLost===2,'bilans antérieurs incomplets');
  requireValue(c.pumpsOnline && ['imperial','clinic'].includes(c.medicalDestination),'destinations antérieures');
  requireValue(c.medicalWitnessId===null || ['ambulance-driver','ambulance-medic'].includes(c.medicalWitnessId),'ancien témoin inconnu');
  requireValue(!c.medicalWitnessAvailable || c.medicalWitnessId!==null && c.staffArrived>0,'ancien témoin sans survivant arrivé');
  requireValue(!c.medicalVehicleSeized || c.medicalVehicleRecovered && c.medicalDestination==='imperial','véhicule saisi sans arrivée impériale');
}

export function validateDepartureFacts(facts, finished = false) {
  for (const key of FLAGS) boolean(facts[key],`bilan ${key}`);
  for (const key of COUNTS) number(facts[key],0,key.startsWith('boats')||key==='controlsInspected'||key==='techniciansAssigned'?2:key==='originsResolved'?3:key.startsWith('patients')?4:40,`bilan ${key}`,true);
  requireValue(['unselected','close','window','open'].includes(facts.plan),'conduite inconnue');
  requireValue(['pending','immediate','delayed','open','damaged'].includes(facts.execution),'exécution inconnue');
  requireValue(facts.boatsTotal===2,'flotte ajoutée ou supprimée');
  requireValue(facts.peopleArrived+facts.peopleLocal+facts.peopleLost+facts.peopleAtQuay+facts.peopleAboard+facts.peopleEnRoute<=facts.peopleTotal,'personnes comptées dans plusieurs états');
  requireValue(facts.peopleDeparted<=facts.peopleTotal && facts.peopleArrived<=facts.peopleDeparted,'arrivées sans départ');
  requireValue(facts.patientsArrived+facts.patientsLocal+facts.patientsLost<=facts.patientsTotal,'bilan des brancards');
  requireValue(facts.patientsTotal<=facts.peopleTotal && facts.patientsArrived<=facts.peopleArrived && facts.patientsLocal<=facts.peopleLocal && facts.patientsLost<=facts.peopleLost,'patients hors recensement');
  requireValue(facts.boatsArrived<=facts.boatsDeparted && facts.boatsArrived+facts.boatsLost<=2,'bilan des bateaux');
  requireValue(facts.refugeAvailable===facts.refugeContacted,'places du refuge sans confirmation');
  requireValue(facts.forcedContractsVerified===facts.registryCopied && (!facts.registryCopied || facts.documentsInspected),'constat sans pages copiées');
  requireValue(facts.closureCompleted===((facts.intakeClosed||facts.emergencySeal)&&facts.passageClosed),'fermeture des deux ouvrages contradictoire');
  requireValue(!facts.reportFiled || facts.reportTransmitted,'rapport enregistré avant transmission');
  requireValue(!facts.maraDeparted || facts.maraPresent && facts.maraContacted,'départ de Mara sans nouvelle rencontre');
  if (finished) requireValue(facts.plan!=='unselected' && facts.execution!=='pending' && facts.manifestRead && facts.controlsInspected===2 && facts.originsResolved===3 && facts.documentsInspected && facts.boardingOrdered && facts.reportTransmitted && facts.peopleArrived+facts.peopleLocal+facts.peopleLost===facts.peopleTotal && facts.patientsArrived+facts.patientsLocal+facts.patientsLost===facts.patientsTotal,'rapport final avant opérations et bilan');
}

function validatePeopleAndBoats(people, boats, facts, context, initial, receipt = false) {
  const seeds=departurePersonSeeds(context);
  requireValue(Array.isArray(people)&&people.length===seeds.length && Array.isArray(boats)&&boats.length===2,'recensement ou flotte incomplets');
  boats.forEach((boat,i)=>{
    if (receipt) keys(boat,BOAT_KEYS,'champs de bateau au rapport'); else shape(boat,initial.boats[i],`bateau ${i}`);
    fixed(boat,initial.boats[i],['id','kind','name','maxHp'],'identité de bateau');
    number(boat.hp,0,boat.maxHp,'intégrité de bateau');
    for(const key of ['destroyed','departed','arrived','returned'])boolean(boat[key],`bateau ${key}`);
    requireValue(BOAT_PHASES.includes(boat.phase),'phase de bateau');
    requireValue(boat.destroyed===(boat.hp===0) && (boat.phase==='lost')===boat.destroyed,'perte de bateau contradictoire');
    requireValue(!boat.arrived || boat.departed && !boat.destroyed,'arrivée navale sans sortie acquise');
    requireValue(!boat.returned || !boat.arrived,'bateau simultanément arrivé et revenu');
  });
  people.forEach((p,i)=>{
    if(receipt)keys(p,PERSON_KEYS,'champs individuels au rapport'); else shape(p,initial.people[i],`personne ${i}`);
    fixed(p,seeds[i],Object.keys(seeds[i]),'identité et provenance de personne');
    for(const key of ['alive','safe','met','consent','departed','serviceAccepted'])boolean(p[key],`personne ${key}`);
    requireValue(PERSON_PHASES.includes(p.phase) && ['unselected','refuge','local'].includes(p.destination),'phase ou destination de personne');
    requireValue((p.phase==='lost')===!p.alive && p.safe===['arrived','local'].includes(p.phase) && (!p.safe||p.alive),'vie, perte ou accueil contradictoires');
    requireValue(p.boatId===null || boats.some(b=>b.id===p.boatId),'bateau de personne inconnu');
    requireValue(!p.consent||p.met,'accord sans contact');
    requireValue(!p.serviceAccepted||p.met && ['technician','crew','harbourmaster','mara'].includes(p.role),'service sans rencontre ni rôle');
    requireValue(p.phase!=='offsite'||p.role==='mara' && !p.met && !p.consent && !p.departed && !p.safe && p.boatId===null,'personne sortie de scène indûment');
    requireValue(!p.departed || p.boatId!==null && boats.some(b=>b.id===p.boatId&&b.departed),'départ individuel sans bateau sorti');
    requireValue(p.phase!=='arrived'||p.departed && p.destination==='refuge' && facts.refugeAvailable && p.consent && boats.some(b=>b.id===p.boatId&&b.arrived),'arrivée individuelle sans destination confirmée et arrivée navale');
    const returningAboard=p.phase==='aboard'&&p.destination==='local'&&!p.departed&&boats.some(b=>b.id===p.boatId&&b.phase==='returning');
    requireValue(!['boarding','aboard','en-route','landing'].includes(p.phase)||p.alive&&p.consent&&(p.destination==='refuge'||returningAboard)&&p.boatId!==null,'embarquement sans accord et allocation');
    requireValue(!['en-route','landing'].includes(p.phase)||p.departed,'transit sans départ acquis');
  });
  const present=people.filter(p=>p.phase!=='offsite'), count=fn=>present.filter(fn).length, patient=fn=>present.filter(p=>p.role==='patient'&&fn(p)).length;
  const derived={peopleTotal:present.length,peopleAtQuay:count(p=>['quay','boarding'].includes(p.phase)),peopleAboard:count(p=>p.phase==='aboard'),peopleDeparted:count(p=>p.departed),peopleEnRoute:count(p=>['en-route','landing'].includes(p.phase)),peopleArrived:count(p=>p.phase==='arrived'),peopleLocal:count(p=>p.phase==='local'),peopleLost:count(p=>!p.alive),patientsTotal:patient(()=>true),patientsArrived:patient(p=>p.phase==='arrived'),patientsLocal:patient(p=>p.phase==='local'),patientsLost:patient(p=>!p.alive),boatsTotal:2,boatsDeparted:boats.filter(b=>b.departed).length,boatsArrived:boats.filter(b=>b.arrived).length,boatsLost:boats.filter(b=>b.destroyed).length,techniciansAssigned:people.filter(p=>p.role==='technician'&&p.serviceAccepted).length,maraPresent:people.find(p=>p.role==='mara').phase!=='offsite',maraDeparted:people.find(p=>p.role==='mara').departed};
  fixed(facts,derived,Object.keys(derived),'bilan sans fait physique');
  requireValue(derived.peopleArrived<=initial.refuge.capacity&&derived.patientsArrived<=initial.refuge.stretcherCapacity,'refuge surchargé');
  for(const [i,boat]of boats.entries()){
    const aboard=people.filter(p=>p.alive&&p.boatId===boat.id&&['boarding','aboard','en-route','landing','arrived'].includes(p.phase));
    const operators=aboard.filter(p=>['crew','harbourmaster'].includes(p.role));
    const stretchers=aboard.filter(p=>p.role==='patient');
    const seats=aboard.filter(p=>!['crew','harbourmaster','patient'].includes(p.role));
    requireValue(operators.length<=initial.boats[i].crewCapacity&&stretchers.length<=initial.boats[i].stretcherCapacity&&seats.length<=initial.boats[i].seatCapacity,'capacité navale dépassée');
    if(['crossing','en-route'].includes(boat.phase)&&aboard.length)requireValue(operators.length>0&&(!stretchers.length||aboard.some(p=>['staff','mara'].includes(p.role))),'bateau parti sans opérateur ou accompagnant sanitaire');
  }
}

export function validateDepartureReceipt(receipt, context) {
  validateContext(context); validateDepartureFacts(receipt,true);
  const initial=createGame({missionId:'MI08',campaignContext:context}).departure;
  keys(receipt.roster,['people','boats'],'registre nominatif absent');
  validatePeopleAndBoats(receipt.roster.people,receipt.roster.boats,receipt,context,initial,true);
  requireValue(receipt.plan===({obey:'close',delay:'window',defy:'open'}[receipt.choice]),'conduite contraire au choix');
  requireValue(receipt.reportFiled===(receipt.choice==='defy'),'transmission officielle contradictoire');
}

export function validateDepartureMission(value, template) {
  const d=value.departure, t=template.departure, f=value.campaign, context=f.context;
  requireValue(object(d)&&f.missionId==='MI08','scène absente');
  validateContext(context); validateDepartureFacts(f,value.status==='won');
  requireValue(['approach','preparation','decision','boarding','passage','report','complete'].includes(f.phase),'phase de mission');
  requireValue(f.plan===(value.decision.choice===null?'unselected':{obey:'close',delay:'window',defy:'open'}[value.decision.choice]),'plan contraire à la décision');
  equal(d.tide,departureTideAt(value.elapsed),'marée contraire au temps écoulé');
  number(d.basin,0,1,'niveau du bassin'); number(d.current,0,3,'courant du bassin');
  requireValue(d.current===Math.abs(d.tide.flow)+Math.abs(d.basin-d.tide.level)*.8,'courant contraire au bassin et à la marée');
  for(const group of ['locks','origins','ramps']){
    requireValue(Array.isArray(d[group])&&d[group].length===t[group].length,`${group} incomplet`);
    d[group].forEach((item,i)=>shape(item,t[group][i],`${group} ${i}`));
  }
  function solid(item,original,move=false){
    fixed(item,original,move?['id','w','h','maxHp']:['id','x','y','w','h','maxHp'],'géométrie fixe');
    number(item.hp,0,item.maxHp,'intégrité');number(item.flash,0,10,'impact');boolean(item.destroyed,'destruction');
    requireValue(item.destroyed===(item.hp===0),'destruction sans perte d’intégrité');
  }
  function progress(item,done=null){
    boolean(item.working,'travail actif');number(item.progress,0,1,'progression');
    if(done){boolean(item[done],`travail ${done}`);requireValue(!item.working||!item[done],'travail achevé encore actif');}
  }
  d.locks.forEach((gate,i)=>{
    const original=t.locks[i]; solid(gate,original);shape(gate.mechanism,original.mechanism,'mécanisme');solid(gate.mechanism,original.mechanism);
    fixed(gate,original,['kind','controlX'],'ouvrage et commande');
    for(const key of ['opening','targetOpening','startOpening','progress','scanProgress','sealProgress'])number(gate[key],0,1,`porte ${key}`);
    for(const key of ['pressure','fatigue'])number(gate[key],0,100,`porte ${key}`);
    requireValue(gate.pressure===(i===0?Math.abs(.75-d.basin):Math.abs(d.basin-d.tide.level)),'pression contraire aux niveaux');
    for(const key of ['working','inspected','scanning','closedOnce','damageNoted','sealWorking','sealed'])boolean(gate[key],`porte ${key}`);
    requireValue(!gate.destroyed || gate.opening===1&&gate.mechanism.destroyed,'porte détruite sans brèche');
    requireValue(!gate.working||!gate.destroyed&&!gate.mechanism.destroyed,'manœuvre d’un mécanisme détruit');
    requireValue(i===0||!gate.sealed&&!gate.sealWorking&&gate.sealProgress===0,'obturation fictive sur la porte de passage');
    requireValue(!gate.sealed||gate.sealProgress===1&&!gate.sealWorking,'obturation inachevée');
  });
  d.origins.forEach((origin,i)=>{
    fixed(origin,t.origins[i],['id','sourceMission','x','y','total'],'groupe d’origine');progress(origin,'resolved');
    for(const key of ['contacted','invited'])boolean(origin[key],`origine ${key}`);
    requireValue(!origin.invited||origin.contacted&&origin.resolved,'invitation sans échange achevé');
  });
  d.ramps.forEach((ramp,i)=>{solid(ramp,t.ramps[i]);fixed(ramp,t.ramps[i],['boatId'],'passerelle');progress(ramp,'prepared');requireValue(!ramp.prepared||!ramp.destroyed,'passerelle prête mais détruite');});
  for(const key of ['quay','refugeRadio','registry']){shape(d[key],t[key],key);solid(d[key],t[key]);progress(d[key]);}
  for(const key of ['quay','refugeRadio']){for(const flag of ['contacted','resolved'])boolean(d[key][flag],`${key}.${flag}`);requireValue(!d[key].contacted||d[key].resolved,'contact sans résolution');requireValue(!d[key].working||!d[key].resolved,'constat déjà résolu encore actif');}
  for(const flag of ['inspected','copied'])boolean(d.registry[flag],`registre ${flag}`);
  requireValue(!d.registry.copied||d.registry.inspected&&d.registry.progress===1,'copie avant lecture');
  for(const key of ['refuge','shelter','serviceShelter']){shape(d[key],t[key],key);fixed(d[key],t[key],Object.keys(t[key]).filter(k=>!['prepared','working','progress'].includes(k)),`accueil ${key}`);}
  requireValue(d.serviceShelter.prepared,'niche technique supprimée');progress(d.shelter,'prepared');
  for(const key of ['vann','mara','technical']){shape(d[key],t[key],key);fixed(d[key],t[key],['id','x','y'],`liaison ${key}`);progress(d[key],'resolved');for(const flag of ['available','contacted'])boolean(d[key][flag],`liaison ${key}.${flag}`);requireValue(!d[key].contacted||d[key].resolved,'liaison sans échange achevé');}
  for(const key of ['boarding','report']){shape(d[key],t[key],key);progress(d[key]);}
  for(const flag of ['ordered','assigned','recallOrdered'])boolean(d.boarding[flag],`embarquement ${flag}`);
  boolean(d.report.transmitted,'transmission');requireValue(!d.report.transmitted||d.report.progress===1&&!d.report.working,'transmission inachevée');
  shape(d.alert,t.alert,'alerte');boolean(d.alert.announced,'annonce de contrôle');boolean(d.alert.triggered,'contrôle présent');number(d.alert.elapsed,0,value.mission.departure.alertDelay,'horloge de contrôle');
  requireValue(!d.alert.triggered||d.alert.announced,'contrôle sans annonce');
  requireValue(d.alert.triggered===(d.alert.elapsed>=value.mission.departure.alertDelay),'arrivée de contrôle avant le délai');
  if(!d.alert.triggered)for(const drone of value.enemies.filter(e=>e.id.startsWith('aval-control-drone-'))){const initial=template.enemies.find(e=>e.id===drone.id);requireValue(!drone.dead&&!drone.active&&drone.hp===drone.maxHp&&drone.x===initial.x&&drone.y===initial.y,'drone présent avant son arrivée');}
  validatePeopleAndBoats(d.people,d.boats,f,context,t);
  d.people.forEach((p,i)=>{
    fixed(p,t.people[i],['w','h','maxHp'],'gabarit de personne');number(p.hp,0,p.maxHp,'santé');number(p.x,0,value.mission.length,'position individuelle');number(p.y,-1000,2000,'hauteur individuelle');number(p.boardingProgress,0,1,'embarquement individuel');
    requireValue(p.alive===(p.hp>0),'santé et survie contradictoires');
    if(p.phase==='arrived')requireValue(p.x===d.refuge.x,'arrivée avant porte du refuge');
    if(p.phase==='local')requireValue(p.x===(p.role==='technician'?d.serviceShelter.x:d.shelter.x),'arrivée locale hors accueil');
    if(['origin','offsite'].includes(p.phase))requireValue(p.x===t.people[i].x&&!p.departed&&!p.safe,'personne déplacée sans sortie de son abri');
  });
  d.boats.forEach((boat,i)=>{
    solid(boat,t.boats[i],true);fixed(boat,t.boats[i],['seatCapacity','stretcherCapacity','crewCapacity','speed','currentLimit'],'capacités et propulsion navales');
    number(boat.x,t.boats[i].x,value.mission.departure.refugeDockXs[i],'position navale');number(boat.y,-1000,2000,'hauteur navale');
    requireValue(boat.y===terrainAt(boat.x,value.planetId)-35,'hauteur navale contraire au parcours');
    for(const flag of ['available','boardingReady','moving','departureOrdered','returning'])boolean(boat[flag],`bateau ${flag}`);
    requireValue(!boat.moving||!boat.destroyed&&!boat.arrived&&!boat.returned,'bateau immobile en mouvement');
    const available=!boat.destroyed&&(i?d.quay.contacted&&d.people.some(p=>p.role==='harbourmaster'&&p.alive):d.vann.contacted&&d.people.some(p=>p.role==='crew'&&p.alive));
    requireValue(boat.available===available&&boat.boardingReady===(available&&d.ramps[i].prepared&&!d.ramps[i].destroyed),'disponibilité navale sans équipage et accès');
    requireValue(!boat.departed||boat.x>=value.mission.departure.exitX||boat.returning||boat.returned||boat.destroyed,'départ avant sortie de la zone');
    requireValue(!boat.arrived||boat.x===value.mission.departure.refugeDockXs[i],'arrivée navale hors quai du refuge');
  });
  const damageResolved=d.locks.some(g=>g.destroyed||g.mechanism.destroyed)&&d.locks.every(g=>!(g.destroyed||g.mechanism.destroyed)||g.damageNoted);
  const physical={controlsInspected:d.locks.filter(g=>g.inspected).length,originsResolved:d.origins.filter(g=>g.resolved).length,quayContacted:d.quay.contacted,refugeContacted:d.refugeRadio.contacted,refugeAvailable:d.refugeRadio.contacted,boardingOrdered:d.boarding.ordered,intakeClosed:d.locks[0].opening<=.05,passageClosed:d.locks[1].opening<=.05,emergencySeal:d.locks[0].sealed,accessMaintained:f.plan==='open'&&d.locks[1].opening>=.85&&!d.locks[1].destroyed&&!d.locks[1].mechanism.destroyed,documentsInspected:d.registry.inspected,registryCopied:d.registry.copied,forcedContractsVerified:d.registry.copied,manifestRead:d.locks.every(g=>g.inspected)&&d.origins.every(o=>o.resolved)&&d.quay.resolved&&d.refugeRadio.resolved&&d.registry.inspected,reportTransmitted:d.report.transmitted,reportFiled:d.report.transmitted&&value.decision.choice==='defy',maraContacted:d.mara.contacted,vannContacted:d.vann.contacted};
  physical.execution=f.plan==='unselected'?'pending':damageResolved?'damaged':physical.accessMaintained?'open':f.closureCompleted?f.boatsDeparted?'delayed':'immediate':'pending';
  fixed(f,physical,Object.keys(physical),'constat sans opération physique');
  requireValue(f.manifestRead===value.evidence.collected && value.stats.evidence===0,'registre confondu avec une preuve globale');
  requireValue(d.vann.available===d.people.some(p=>p.role==='crew'&&p.alive) && d.technical.available===d.people.some(p=>p.role==='technician'&&p.alive) && d.mara.available===d.people.find(p=>p.role==='mara').alive,'liaison disponible sans personne vivante');
  if(value.status==='won')requireValue(f.phase==='complete'&&value.decision.resolved&&value.objectives.every(o=>o.complete),'victoire avant objectifs accomplis');
}

export function departureDossierFromGame(game) {
  return Object.fromEntries(Object.keys(createDepartureDossier()).map(key=>[key,key==='roster'?departureReceiptRoster(game):game.campaign[key]]));
}
