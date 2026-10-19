// All asset URLs are relative to game.js, never the current route.
const ASSET_BASE = new URL('.', document.currentScript ? document.currentScript.src : document.baseURI);
const assetURL = path => new URL(path, ASSET_BASE).href;

/* ================= ASSET NAME CONNECTOR =================
   Every path used by the game can have alternate names: the standard names from
   ASSETS_AUDIT_AND_STRUCTURE.md, legacy names, and .png/.webp swaps.
   Art.load() tries them in order, so renaming files in assets/ never breaks the game.
   ASSETS_RENAMED: set to true ONLY after you really swapped the mis-ordered level files
   (bacillus lv6<->lv7, leuconostoc lv1..6, lactobacillus lv1<->lv2) as listed in the audit. */
const ASSETS_RENAMED = false;
const ASSET_ALIASES = {};
const alias = (from, ...to) => { (ASSET_ALIASES[from] = ASSET_ALIASES[from] || []).push(...to); };
const swapExt = p => p.replace(/\.(png|webp)$/i, (m, e) => e.toLowerCase() === 'png' ? '.webp' : '.png');
const assetCandidates = src => {
  const out = [src];
  for (const a of (ASSET_ALIASES[src] || [])) if (!out.includes(a)) out.push(a);
  for (const p of out.slice()) { const s = swapExt(p); if (/^assets\//.test(s) && !out.includes(s)) out.push(s); }
  return out;
};
const GB = 'assets/good_bacteria/';
for (let n = 1; n <= 4; n++) {
  alias(`assets/boss/queen_lv${n}.png`, `assets/boss/boss_queen_lv${n}.png`, `assets/boss/boss_hive_queen_lv${n}.png`);
  alias(`assets/enemy/enemy_splitling_lv${n}.png`, 'assets/enemy/enemy_cocci_lv1.png');   // until real Splitling art exists
}
for (let n = 1; n <= 8; n++) {
  alias(`${GB}spirillum/character/spirillum_lv${n}.webp`, `${GB}spirillum/character/spirillum_frost_lv${n}.png`);
  alias(`${GB}hybrid/character/hybrid_lv${n}.png`, `${GB}hybrid/character/hybrid_pierce_lv${n}.png`);
}
alias(`${GB}spirillum/gun_effects/spirillum_ice_shard_frost_ring_t3.png`, `${GB}spirillum/gun_effects/spirillum_ice_shard_t3.png`);
alias(`${GB}spirillum/gun_effects/spirillum_ice_shard_golden_t4.png`, `${GB}spirillum/gun_effects/spirillum_ice_shard_t4.png`);
for (const n of [3, 4]) alias(`${GB}spirillum/gun_effects/spirillum_ice_shard_${n === 3 ? 'frost_ring_' : 'golden_'}t${n}_alt.png`, `${GB}spirillum/gun_effects/spirillum_ice_shard_t${n}_alt.png`);
alias('assets/effects/fx_gold_sparkle_01.png', 'assets/ui/fx_gold_sparkle.webp', 'assets/effects/fx_gold_sparkle.png');
alias('assets/background/bg_basic.png', 'assets/background/bg_meadow_landscape.png');
alias('assets/background/bg_red_area.png', 'assets/background/bg_gut_landscape.png');
alias('assets/background/bg_cold_area.png', 'assets/background/bg_lungs_landscape.png');
alias('assets/background/bg_blood_landscape.png', 'assets/background/bg_red_area.png', 'assets/background/bg_gut_landscape.png');
alias('assets/ui/hub/ui_hud_pill_wave.png', 'assets/ui/hud/ui_hud_pill_wave.png');

/* ================= ASSET HUB + UI KIT =================
   assets/manifest.json (made by tools/make_manifest.py) lists every file in assets/. When it exists, every file in
   assets/ui/** is loaded and exposed as a CSS variable --ui-<file name> plus a class html.ui-<file name>,
   so style.css can skin the HUD with any panel / badge / hud image. Without the manifest the known names below still work. */
const AssetHub = {
  files: [],
  ready: null,
  init() {
    const get = fetch(assetURL('assets/manifest.json'), { cache: 'no-cache' })
      .then(r => (r.ok ? r.json() : null)).catch(() => null);
    this.ready = Promise.race([get, new Promise(r => setTimeout(() => r(null), 2500))])
      .then(j => { this.files = j && Array.isArray(j.files) ? j.files.filter(f => typeof f === 'string') : []; return this.files; });
    return this.ready;
  },
  list(prefix) { return this.files.filter(f => f.startsWith(prefix)); }
};
AssetHub.init();
const hubAlias = p => (p.includes('/ui/hub/') ? p.replace('/ui/hub/', '/ui/hud/') : p.includes('/ui/hud/') ? p.replace('/ui/hud/', '/ui/hub/') : null);
const UIKIT_KNOWN = [
  ...['ad_badge','button_danger','button_primary','button_secondary','button_tap_to_start','checkbox_checked','checkbox_unchecked','close_button','hand_pointer',
      'loading_bar_fill','loading_bar_track','logo_plate','notification_dot','progress_circle','slider_knob','slider_knob_pressed','slider_track','slider_track_with_fill',
      'star_empty','star_filled','star_filled_glint','star_frame_big','subtitle_tag','toggle_off','toggle_on','tutorial_arrow','tutorial_ring'].map(k => `assets/ui/ui_${k}.webp`),
  ...['bar_boss_hp_frame','bar_fill_orange_warning','bar_fill_purple_boss','bar_fill_red','bar_fill_teal_progress','bar_frame_blue_empty','bar_track_empty','bar_wall_hp_frame',
      'bar_wave_progress_frame','enemy_bar_fill_red','enemy_bar_frame','pill_coins','pill_energy','pill_wave'].map(k => `assets/ui/hub/ui_hud_${k}.png`),
  ...['bubble_toast','bubble_tutorial','card_dim_overlay','card_shop_frame','panel_popup_dark','panel_popup_main','ribbon_title','row_list_frame','tab_pair'].map(k => `assets/ui/panels/ui_${k}.png`),
  ...['assassin', 'healer', 'mage', 'shooter', 'sniper', 'support', 'tank'].map(k => `assets/ui/badges/ui_chip_type_${k}.png`),
  ...['common','rare','epic','legendary'].map(k => `assets/ui/badges/ui_frame_rarity_${k}.png`), 'assets/ui/badges/ui_ribbon_new.png',
  ...[1, 2, 3, 4, 5, 6, 7, 8].map(n => `assets/ui/badges/ui_badge_level_${n}.png`)
];
const UIKit = {
  img: {},      // small baked canvases for canvas drawing (level badges, role chips)
  keys: [],
  keyOf: p => p.split('/').pop().replace(/\.[a-z0-9]+$/i, '').replace(/[^a-z0-9_-]/gi, '_'),
  init() {
    return AssetHub.ready.then(() => {
      const byKey = new Map();
      for (const p of [...UIKIT_KNOWN, ...AssetHub.list('assets/ui/')]) { const k = this.keyOf(p); if (!byKey.has(k)) byKey.set(k, p); }
      const root = document.documentElement;
      const jobs = [];
      byKey.forEach((p, k) => {
        const a = hubAlias(p); if (a) alias(p, a);
        jobs.push(Art.load(p, 7000).then(im => {
          if (!im) return;
          root.style.setProperty('--ui-' + k, `url("${im.src}")`);
          root.classList.add('ui-' + k);
          this.keys.push(k);
          if (/^ui_(badge|chip|hud_enemy_bar)/.test(k)) {
            const w = Math.min(k.includes('bar') ? 160 : 64, im.naturalWidth), h = Math.max(1, Math.round(im.naturalHeight * w / im.naturalWidth));
            const c = document.createElement('canvas'); c.width = w; c.height = h;
            const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, w, h);
            this.img[k] = c;
          }
        }));
      });
      return Promise.all(jobs);
    });
  }
};
// extra icons from assets/icon/ become usable as ic('<name>') (icon_<name>.png)
AssetHub.ready.then(() => { if (typeof ICON_ASSETS === 'undefined') return; for (const f of AssetHub.list('assets/icon/')) { const m = f.match(/icon_([a-z0-9_]+)\.(png|webp)$/i); if (m && !/^app_/.test(m[1]) && !ICON_ASSETS[m[1]]) ICON_ASSETS[m[1]] = f; } });

const ART_SRC = [
  'assets/mascot/mascot_idle.png',
  'assets/mascot/mascot_cheer.png',
  'assets/mascot/mascot_think.png',
  'assets/mascot/mascot_wave.png'
];

const levels = (folder, name, ext = 'png') => Array.from(
  { length: 8 },
  (_, i) => `assets/good_bacteria/${folder}/character/${name}_lv${i + 1}.${ext}`
);

const ORD = legacy => ASSETS_RENAMED ? [1,2,3,4,5,6,7,8] : legacy;   // legacy = order that fixes the swapped files
const UNIT_SRC = {
  shoot: ORD([2,1,3,4,5,6,7,8]).map(n => `assets/good_bacteria/lactobacillus/character/lactobacillus_shoot_lv${n}.png`),
  snipe: levels('bifido', 'bifido_snipe'),
  guard: ORD([1,2,3,4,5,7,6,8]).map(n => `assets/good_bacteria/bacillus/character/bacillus_guard_lv${n}.png`),
  spark: ORD([1,3,6,5,2,4,7,8]).map(n => `assets/good_bacteria/leuconostoc/character/leuconostoc_spark_lv${n}.png`),
  frost: levels('spirillum', 'spirillum', 'webp'),
  heal: levels('strepto', 'strepto_heal'),
  hybrid: levels('hybrid', 'hybrid')
};
const UNIT_MZ={"shoot": [[0.703, 0.72], [0.724, 0.705], [0.75, 0.664], [0.943, 0.516]], "snipe": [[0.719, 0.499], [0.719, 0.472], [0.818, 0.664], [0.807, 0.662]], "heal": [[0.703, 0.674], [0.74, 0.644], [0.755, 0.72], [0.911, 0.447]], "frost": [[0.729, 0.46], [0.786, 0.525], [0.75, 0.507], [0.938, 0.38]], "guard": [[0.682, 0.687], [0.698, 0.639], [0.786, 0.714], [0.922, 0.482]], "spark": [[0.708, 0.72], [0.734, 0.701], [0.802, 0.662], [0.891, 0.38]], "hybrid": [[0.807, 0.72], [0.839, 0.72], [0.938, 0.673], [0.953, 0.674]]};

/* The active bacteria roster drives the shop, Collection, Lab unlocks,
   recipes and combat stats. Its character and muzzle art paths resolve to the
   local assets bundled with this game. */
var BD_BACTERIA = [
  {
    id: 'shoot',                         // save key - never rename
    name: 'Lactobacillus',               // display name
    shortName: 'Lacto',                  // label on the shop tile
    badge: 'L',                          // letter on the in-battle badge
    color: '#4ade80',                    // identity colour (badge, shop tile, Collection)
    role: 'Shooter',
    description: 'Fast, reliable damage.',
    art: { tiers: UNIT_SRC.shoot, muzzle: UNIT_MZ.shoot, pedestal: 'round' },
    stats: { cost: 12, hp: 1, damage: 5, damageGrowth: 2.2, attackCooldown: 0.85, range: 230, projectileSpeed: 420 },
    attack: 'projectile',
    abilities: { markHunter: true },     // bonus damage to germs marked by a neighbouring Bifido
    unlock: { type: 'start' },
    shopFromWave: 1,
    sound: [640, .05, 'sine', .05, 380, 60],
    bot: { priority: 3, cols: [2, 1] }
  },
  {
    id: 'snipe',
    name: 'Bifido',
    shortName: 'Bifido',
    badge: 'B',
    color: '#38bdf8',
    role: 'Sniper',
    description: 'Long range, big hits, marks germs for Lactobacillus.',
    art: { tiers: UNIT_SRC.snipe, muzzle: UNIT_MZ.snipe, pedestal: 'diamond' },
    stats: { cost: 16, hp: 0.8, damage: 12, damageGrowth: 2.2, attackCooldown: 1.9, range: 420, projectileSpeed: 560 },
    attack: 'projectile',
    abilities: { marks: true, heavyShot: true, targets: 'strongest' },
    unlock: { type: 'start' },
    shopFromWave: 1,
    sound: [300, .12, 'sawtooth', .07, 140, 90],
    bot: { priority: 2.4, cols: [0, 1] }
  },
  {
    id: 'guard',
    name: 'Guardian Spore',
    shortName: 'Guardian',
    badge: 'G',
    color: '#fb923c',
    role: 'Tank',
    description: 'Tanky. Germs love to chew on it.',
    art: { tiers: UNIT_SRC.guard, muzzle: UNIT_MZ.guard, pedestal: 'square' },
    stats: { cost: 14, hp: 3.5, damage: 1.5, damageGrowth: 1.8, attackCooldown: 1.3, range: 130, projectileSpeed: 380 },
    attack: 'projectile',
    abilities: { taunt: true },          // germs prefer to attack it
    unlock: { type: 'start' },
    shopFromWave: 1,
    sound: [240, .06, 'square', .04, 150, 120],
    bot: { priority: 3, cols: [3] }
  },
  {
    id: 'spark',
    name: 'Spark Cell',
    shortName: 'Spark',
    badge: 'S',
    color: '#facc15',
    role: 'Chain caster',
    description: 'Lightning jumps between nearby germs.',
    art: { tiers: UNIT_SRC.spark, muzzle: UNIT_MZ.spark, pedestal: 'diamond' },
    stats: { cost: 16, hp: 0.9, damage: 4, damageGrowth: 2.1, attackCooldown: 1, range: 200 },
    attack: 'chain',
    abilities: { chain: 3, chainRange: 55 },
    unlock: { type: 'lab', cost: 80, labName: 'Unlock Spark Cell', labDesc: 'Chain lightning bacteria' },
    shopFromWave: 2,
    sound: [1400, .09, 'sawtooth', .05, 300, 80],
    bot: { priority: 2.2, cols: [2, 1] }
  },
  {
    id: 'frost',
    name: 'Frost Yeast',
    shortName: 'Frost',
    badge: 'F',
    color: '#a78bfa',
    role: 'Slower',
    description: 'Slowing shots.',
    art: { tiers: UNIT_SRC.frost, muzzle: UNIT_MZ.frost, pedestal: 'hex' },
    stats: { cost: 15, hp: 1, damage: 3, damageGrowth: 2, attackCooldown: 1.1, range: 230, projectileSpeed: 380 },
    attack: 'projectile',
    abilities: { slow: 1.6 },            // seconds of slow per hit
    unlock: { type: 'lab', cost: 80, labName: 'Unlock Frost Yeast', labDesc: 'Slowing bacteria' },
    shopFromWave: 2,
    sound: [820, .08, 'triangle', .05, 1200, 80],
    bot: { priority: 1.8, cols: [1, 2] }
  },
  {
    id: 'heal',
    name: 'Healer Probiotic',
    shortName: 'Healer',
    badge: 'H',
    color: '#f472b6',
    role: 'Support',
    description: 'Heals neighbours and the Wall.',
    art: { tiers: UNIT_SRC.heal, muzzle: UNIT_MZ.heal, pedestal: 'round' },
    stats: { cost: 14, hp: 1, damage: 0, damageGrowth: 1, attackCooldown: 2, range: 0 },
    attack: 'support',
    abilities: { healPct: 0.1, wallHeal: 2 },
    unlock: { type: 'lab', cost: 100, labName: 'Unlock Healer', labDesc: 'Heals neighbours and the Wall' },
    shopFromWave: 3,
    sound: [660, .24, 'sine', .06, 990, 350],
    bot: { priority: 1.5, cols: [0, 1] }
  },
  {
    id: 'hybrid',
    name: 'Hybrid Probiotic',
    shortName: 'Hybrid',
    badge: 'X',
    color: '#f59e0b',
    role: 'Piercer',
    description: 'Piercing shots. Made by merging Lactobacillus + Bifido.',
    art: { tiers: UNIT_SRC.hybrid, muzzle: UNIT_MZ.hybrid, pedestal: 'round' },
    stats: { cost: 0, hp: 1.1, damage: 7, damageGrowth: 2.2, attackCooldown: 0.8, range: 300, projectileSpeed: 480 },
    attack: 'projectile',
    abilities: { pierceBonus: 2 },
    unlock: { type: 'recipe', from: ['shoot', 'snipe'] },   // merge Lv-equal Lactobacillus + Bifido
    sound: [520, .11, 'sawtooth', .055, 980, 70],
    bot: { priority: 3, cols: [1, 2] }
  }
];

(()=>{'use strict';
/* ---- tuning: every number lives here ---- */
const BAL={tutResume:[0,3,4,8,10,11],LW:640,LH:360,STEP:1/60,cols:4,rows:5,cell:46,x0:44,laneY0:88,laneH:46,wallX:36,spawnX:652,roadY0:52,roadY1:308,unitR:14,angSpread:2.8,speedMul:1.5,maxLvl:8,R:18,
 startEnergy:60,labGrowth:1,sellPerLvl:5,quick:{sec:15,frac:.25},wallHp:100,
 clearBase:10,clearPerWave:3,killEnergy:.35,idle:{after:6,rate:1.5},touchLift:40,
 count:{a:8,b:6,c:.5,cc:.18},hp:{base:8,lin:.12,exp:1.12,cexp:1.035},spawnSecBase:8,spawnSecPerWave:.9,spawnSecMax:40,bossEvery:5,bosses:[3,8,9,13],speedPerWave:.5,ad:{minSession:120000,gap:180000,guard:90000},maxGerms:700,wallMul:.6,thorn:{base:3,perWave:.5},newBoost:1.5,ptsMul:1,dpsGrow:.03,perf:{ms:12},
 ab:{spitCd:2,spitMul:2,medicCd:1.5,medicPct:.05,medicR:45,blastR:56,blastDmg:12,blastPerWave:1.5,cloudCd:6,slamCd:9,slamN:2,slamDis:1.5,tele:1,cloudDur:4,queenCd:7},
 def:{hp:30,hpG:1.3,fan:.4},zapBase:3,zapPerWave:1.5,
 stack:[0,0,.10,.20,.35],rowMin:3,rowPierce:1,mark:{bonus:.25,sec:3},taunt:{range:90},
 evoAt:[4,8],evo:{rapid:{n:'Rapid',d:'Faster, weaker shots',rate:1.6,dmg:.65,hp:1},frost:{n:'Frost',d:'Shots slow germs',rate:1,dmg:.9,hp:1.2,slow:1.5}},
 hide:{dur:2,charges:2,ucd:6},rally:{max:100,kill:1.5,zap:6,dur:4,boost:.4},
 bomb:{cost:40,cd:20,base:20,perWave:12,speed:520,slow:2},heal:{cost:25,amt:25},
 shop:{n:3,reroll:5,free:1},ghost:{rebuild:.5},milestone:{every:5,base:6,per:2},
 germs:[
  {n:'Cocci',r:6,hp:1,sp:34,dps:6,c:'#ff4d6d',pts:1,from:1,tip:'Basic germ. Shoot it.'},
  {n:'Runner',r:5,hp:.6,sp:60,dps:4,c:'#ffa62b',pts:1.2,from:2,tip:'Fast and fragile.'},
  {n:'Brute',r:9,hp:3,sp:20,dps:12,c:'#9d4edd',pts:4,from:4,tip:'Slow and tough. Focus fire it.'},
  {n:'Mega Staph',r:18,hp:20,sp:14,dps:30,c:'#7b2ff7',boss:1,tip:'Boss! Huge HP.'},
  {n:'Spitter',r:7,hp:1.2,sp:30,dps:5,c:'#84cc16',pts:3,from:6,range:105,tip:'Stops far away and spits acid at your front column.'},
  {n:'Medic',r:7,hp:1.5,sp:28,dps:3,c:'#2dd4bf',pts:3,from:8,tip:'Heals nearby germs. Kill it first!'},
  {n:'Bloater',r:10,hp:2.2,sp:22,dps:8,c:'#fb7185',pts:3,from:10,tip:'Explodes when it dies. Pop it far from your squad.'},
  {n:'Swarm',r:3.4,hp:.3,sp:78,dps:2,c:'#fde047',pts:3.6,from:12,pack:12,gap:.12,tip:'A fast cloud of tiny germs. Use pierce and Spark.'},
  {n:'Plague Prince',r:20,hp:24,sp:12,dps:30,c:'#65a30d',boss:1,tip:'Boss! Poison clouds disable a bacteria for a few seconds.'},
  {n:'Hive Queen',r:21,hp:28,sp:11,dps:30,c:'#c026d3',boss:1,tip:'Boss! Keeps spawning Medics and Spitters.'},
  {n:'Shielded',r:8,hp:2,shield:1.4,noSlow:1,sp:22,dps:9,c:'#3b82f6',pts:4,from:14,tip:'A shield soaks up damage first. Frost cannot slow it.'},
  {n:'Splitter',r:9,hp:2.4,sp:26,dps:7,c:'#d97706',pts:4,from:16,split:2,kid:12,tip:'Splits into 2 small germs when it dies. Finish the pieces.'},
  {n:'Splitling',r:4.2,hp:.45,sp:50,dps:3,c:'#f59e0b',pts:0,hid:1,tip:'A small, quick piece of a Splitter.'},
  {n:'Amoeba Emperor',r:22,hp:30,sp:10,dps:30,c:'#a855f7',boss:1,tip:'Boss! Its slam stuns bacteria for a moment.'}],
 bot:{tick:.5,guardAfter:2,guards:2,heals:1,healAt:5,reserve:6,healBelow:55,hideBelow:.45,bombAt:10,bombPad:70,bombReserve:10,sellMaxLvl:2,zapPerSec:0,maxSec:240,novMergeAt:3,novOpen:2,
  pri:{},cols:{},rows:[2,1,3,0,4]},
 dbg:{energy:100,refresh:.25},
 audio:{loadHold:1.4,xfade:.8,fan:[523,659,784,1047],fanGap:.11,fanVol:.12},
 mini:{every:10,hp:8,r:1.5,dps:1.5,sp:.85,reward:15,list:[2,6,10,11]}};   // mini-boss: every 10th non-boss wave; strong copy of a normal germ
/* ---- roster: character data lives in BD_BACTERIA (its own script block). This validates it and builds the unit table. ---- */
const Roster=(()=>{
  const RES=['cols','reroll','energy','wall'],ATK=['projectile','chain','support'],PED=['round','diamond','square','hex'];
  const W=(...a)=>{try{console.warn('[Bio Defense roster]',...a)}catch(e){}};
  const fin=(v,lo,hi,d)=>{const n=+v;return Number.isFinite(n)?Math.min(hi,Math.max(lo,n)):d};
  const imgs=v=>Array.isArray(v)?v.filter(x=>typeof x==='string'&&x.length>0):(typeof v==='string'&&v?[v]:[]);
  const list=Array.isArray(window.BD_BACTERIA)?window.BD_BACTERIA:[],defs=[],byId={};
  for(const raw of list){try{
    if(!raw||typeof raw!=='object'){W('skipped an entry that is not an object');continue}
    const id=String(raw.id||'');
    if(!/^[a-z][a-z0-9_]{1,23}$/.test(id)||RES.includes(id)){W('skipped "'+id+'": an id must be 2-24 lowercase letters, digits or _ (and not '+RES.join(', ')+')');continue}
    if(byId[id]){W('skipped duplicate id "'+id+'"');continue}
    const s=raw.stats||{},art=raw.art||{},u=raw.unlock||{},ab=Object.assign({},raw.abilities||{});
    let attack=raw.attack||'projectile';if(!ATK.includes(attack)){W(id+': unknown attack "'+attack+'", using projectile');attack='projectile'}
    const name=String(raw.name||id),d={id,name,
      short:String(raw.shortName||name.split(' ')[0]).slice(0,12),
      badge:String(raw.badge||name.charAt(0)||'?').slice(0,2).toUpperCase(),
      color:/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw.color||'')?raw.color:'#cbd5e1',
      role:String(raw.role||({projectile:'Shooter',chain:'Chain caster',support:'Support'})[attack]),
      desc:String(raw.description||''),attack,ab,
      art:{tiers:imgs(art.tiers),muzzle:Array.isArray(art.muzzle)?art.muzzle:null,pedestal:PED.includes(art.pedestal)?art.pedestal:'round',scale:fin(art.scale,.5,2,1),anim:art.anim&&typeof art.anim==='object'?art.anim:null},
      st:{cost:fin(s.cost,0,9999,10),hp:fin(s.hp,.05,100,1),dmg:fin(s.damage,0,1e5,1),g:fin(s.damageGrowth,1,5,2),cd:fin(s.attackCooldown,.05,60,1),range:fin(s.range,0,5000,attack==='support'?0:200),spd:fin(s.projectileSpeed,20,5000,400)},
      unlock:{type:['start','lab','recipe'].includes(u.type)?u.type:'start',cost:fin(u.cost,0,1e6,100),labName:u.labName?String(u.labName):'',labDesc:u.labDesc?String(u.labDesc):'',from:Array.isArray(u.from)?u.from.map(String):null},
      from:fin(raw.shopFromWave,1,999,1),sound:Array.isArray(raw.sound)&&raw.sound.length>=4?raw.sound.slice(0,6):null,bot:raw.bot&&typeof raw.bot==='object'?raw.bot:{}};
    if(d.unlock.type==='recipe')d.from=99;   // recipe bacteria are made by merging, never sold
    if(!d.art.tiers.length&&!d.art.anim)W(id+': no art listed - a placeholder token will be drawn');
    defs.push(d);byId[id]=d}catch(e){W('skipped a broken entry',e)}}
  const recipes=[];
  for(const d of defs)if(d.unlock.type==='recipe'){const f=d.unlock.from;
    if(f&&f.length===2&&f[0]!==f[1]&&byId[f[0]]&&byId[f[1]]&&byId[f[0]].unlock.type!=='recipe'&&byId[f[1]].unlock.type!=='recipe'&&!recipes.some(r=>(r.a===f[0]&&r.b===f[1])||(r.a===f[1]&&r.b===f[0])))recipes.push({a:f[0],b:f[1],out:d.id});
    else W(d.id+': unlock.from must name two different, existing, non-recipe bacteria (and the pair must be unused)')}
  const types={};
  for(const d of defs){const t=types[d.id]={n:d.name,L:d.badge,col:d.color,cost:d.st.cost,from:d.from,hp:d.st.hp,dmg:d.st.dmg,g:d.st.g,cd:d.st.cd,range:d.st.range};
    if(d.attack==='projectile')t.spd=d.st.spd;
    if(d.attack==='chain'){t.chain=fin(d.ab.chain,0,20,3);t.chainR=fin(d.ab.chainRange,10,400,55)}
    if(d.ab.slow>0)t.slow=fin(d.ab.slow,0,10,0);
    if(d.attack==='support'){t.healPct=fin(d.ab.healPct,0,1,.1);t.wallHeal=fin(d.ab.wallHeal,0,50,0)}
    if(d.ab.pierceBonus>0)t.pierceBonus=fin(d.ab.pierceBonus,0,20,0)}
  return{defs,byId,recipes,types,warn:W};
})();
BAL.types=Roster.types;for(const d of Roster.defs){BAL.bot.pri[d.id]=+d.bot.priority||1;BAL.bot.cols[d.id]=Array.isArray(d.bot.cols)&&d.bot.cols.length?d.bot.cols:[0,1,2,3]}
const TY=BAL.types,TKEYS=Object.keys(TY),DEF=Roster.byId;
const recipeOf=(a,b)=>{for(const r of Roster.recipes)if((r.a===a&&r.b===b)||(r.a===b&&r.b===a))return r.out;return null};
const owned=k=>{const u=DEF[k]&&DEF[k].unlock;return !u?false:u.type==='recipe'?!!Save.d.cx.r[k]:u.type==='lab'?Save.d.lab[k]>0:true};   // Collection: has the player got this bacterium?
const STR={vic:{rib:'VICTORY',waves:'Waves',kills:'Germs',time:'Time',coins:'Coins',lost:'Lost'},dbg:{title:'Debug',skip:'Skip wave',en:'+100 energy',wave:'Set wave',go:'Go',spawn:'Spawn',god:'God mode',on:'ON',off:'OFF',hide:'Hide panel',show:'Debug',needBattle:'Press BATTLE first',frame:'frame',germs:'germs',bul:'bullets',wv:'wave',lbl:'Debug tools'},mini:'MINI-BOSS',miniTip:'A tougher germ with a health bar. Focus it with everything you have.',tut:{
 Place:'Drag a bacteria onto a cell. Or tap it, then tap a cell.',Merge:'Buy another one. Drop it on the first. Equal bacteria merge into a stronger one.',Stack:'Place one in the same column. Stacked bacteria shoot faster.',
 Battle:'Press BATTLE. Germs charge from the right. Your bacteria shoot anything in front of them.',Zap:'Tap a germ to zap it yourself.',Bomb:'The Bomb hits the whole field. Tap it!',
 Hide:'This bacteria is hurt. Tap it to wrap it in a biofilm.','Hold the line':'Keep fighting until every germ is gone.',Boost:'Pick a boost card. It lasts the whole run.',Shop:'Want new offers? Reroll the shop.',
 'New germs':'New germs appear as waves grow. Read the info card. Then press BATTLE.',Boss:'A boss wave! Mega Staph has huge health. Press BATTLE. Zap it and use the Bomb.'},
 tutKb:{Place:'Keys: 1, then Enter.',Merge:'Keys: 1, move the cursor to the first one, Enter.',Stack:'Keys: 1, arrows to the same column, Enter.',Battle:'Key: B.',Zap:'Key: Z zaps the nearest germ.',Bomb:'Key: B.',Hide:'Keys: arrows to the bacteria, then Enter.',Shop:'Key: X.'},
 tutDone:'Place, merge and stack. Then hold the line. Bosses arrive every 5th wave. On Home, check Today and the Lab.',wave:'Wave',cleared:'cleared!',defeat:'Defeat!',again:'Try again',next:'Next prep',place:'Place a bacteria first',noEnergy:'Not enough energy',bombCd:'Bomb is recharging',noAd:'No ad available. No reward given.',sold:'Sold',quick:'Quick Start bonus!',evolve:'Evolve!',rebuilt:'Rebuilt'};
const LVC=['#4ade80','#38bdf8','#a78bfa','#f472b6','#facc15','#fb923c','#ef4444','#ffffff'],K='#16213e';   // K: the dark navy outline of the whole art style
const _shc={};function shade(c,f){const k=c+f;if(_shc[k])return _shc[k];let n=String(c).replace('#','');if(n.length===3)n=n.replace(/./g,'$&$&');const v=parseInt(n.slice(0,6),16);if(!Number.isFinite(v))return _shc[k]=c;
  let r=v>>16&255,g=v>>8&255,b=v&255;if(f>0){r+=(255-r)*f;g+=(255-g)*f;b+=(255-b)*f}else{r*=1+f;g*=1+f;b*=1+f}return _shc[k]='#'+(16777216+((r|0)<<16)+((g|0)<<8)+(b|0)).toString(16).slice(1)}   // lighter (f>0) / darker (f<0) tone for two-tone shading
if(!CanvasRenderingContext2D.prototype.roundRect)CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){r=Math.max(0,Math.min(+r||0,Math.abs(w)/2,Math.abs(h)/2));this.moveTo(x+r,y);this.arcTo(x+w,y,x+w,y+h,r);this.arcTo(x+w,y+h,x,y+h,r);this.arcTo(x,y+h,x,y,r);this.arcTo(x,y,x+w,y,r);this.closePath()};   // older Android / iOS 15 webviews
const ICON_ASSETS = {"bolt": "assets/icon/icon_energy_bolt.png", "coin": "assets/icon/icon_coin.png", "heart": "assets/icon/icon_heart.png", "star": "assets/icon/icon_star.png", "lock": "assets/icon/icon_lock.png", "map": "assets/icon/icon_map_pin.png", "cal": "assets/icon/icon_calendar.png", "gift": "assets/icon/icon_gift.png", "flask": "assets/icon/icon_flask.png", "book": "assets/icon/icon_codex_book.png", "trophy": "assets/icon/icon_trophy.png", "bomb": "assets/icon/icon_skull.png"};
Object.assign(ICON_ASSETS, {star_glint: 'assets/ui/ui_star_filled_glint.webp', ad_badge: 'assets/ui/ui_ad_badge.webp', star: 'assets/ui/ui_star_filled.webp', star0: 'assets/ui/ui_star_empty.webp',
  ad_ticket: 'assets/icon/icon_ad_ticket.png', chest_closed: 'assets/icon/icon_chest_closed.png', chest_open: 'assets/icon/icon_chest_open.png', clock: 'assets/icon/icon_clock.png',
  crosshair: 'assets/icon/icon_crosshair.png', crown: 'assets/icon/icon_crown.png', dna: 'assets/icon/icon_dna.png', fire_streak: 'assets/icon/icon_fire_streak.png',
  key: 'assets/icon/icon_key.png', magnifier: 'assets/icon/icon_magnifier.png', medal: 'assets/icon/icon_medal.png', shield: 'assets/icon/icon_shield.png', skull: 'assets/icon/icon_skull.png'});
STR.load={tips:['Merge two equal bacteria to make a stronger one.','Stack bacteria in one column for a fire-rate bonus.','Tap a hurt bacteria to hide it in biofilm.','Medics heal other germs. Kill them first!','Bloaters explode when they die. Pop them far away.','Frost cannot slow a Shielded germ.','Tap a germ to zap it and charge your Rally.','Every fifth wave brings a boss.'],studio:'Bilal Studio',presents:'presents',start:'Tap to start',reset:'Reset progress',sure:'Tap again to erase',tabBac:'Bacteria',tabGerm:'Germs'};
const ic=(n,c)=> ICON_ASSETS[n] ? `<img class="ic assetIcon${c ? " "+c : ""}" src="${assetURL(ICON_ASSETS[n])}" alt="" aria-hidden="true">` : '<svg class="ic'+(c?' '+c:'')+'" aria-hidden="true"><use href="#i-'+n+'"/></svg>';
const $=id=>document.getElementById(id),clamp=(v,a,b)=>v<a?a:v>b?b:v;
const DEBUG=/[?&]debug=1/.test(location.search);
function mul(s){let a=s>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const seed=+(new URLSearchParams(location.search).get('seed'))||(Date.now()&0xffffff);
let RW,RS,RB;function seedAll(s){RW=mul(s);RS=mul(s^0x9e3779b9);RB=mul(s^0x51ed51ed)}seedAll(seed);   // waves, shop and in-battle rolls are separate gameplay streams
const ST={PREP:'prep',BATTLE:'battle',RESULT:'result',OVER:'over'};
const cv=$('cv'),ctx=cv.getContext('2d');
let S,drag=null,G={spd:1,acc:0,last:0,kb:false,ms:0,msAvg:0,q:0,qt:0,paused:false,sim:false,scr:'loading',disp:0,daily:false,mode:'endless',stage:-1,theme:'meadow'};
const num=(v,lo,hi,d)=>{const n=+v;return Number.isFinite(n)?clamp(n,lo,hi):d};
const withTimeout=(p,ms)=>Promise.race([Promise.resolve(p),new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms))]);
const dbg=(...a)=>{if(DEBUG)console.log('[bd]',...a)};
function dayKey(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function daySeed(k){let h=2166136261;for(let i=0;i<k.length;i++){h^=k.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
/* ---- save: schema v4, migrates the old v3 key, SDK data module -> localStorage -> memory ---- */
const yKey=()=>{const d=new Date(Date.now()-864e5);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
/* ---- save v7 (adds tut.step): reads v7, then v5, v4 and the old v3 key; every field is sanitised ---- */
const Save={k:'bd.save.v7',mem:null,
 d:{v:7,best:0,kills:0,coins:0,sfx:.8,music:.6,muted:false,reduced:null,shakeOff:false,partsLow:false,dailyBest:{day:'',wave:0},lab:{cols:0,reroll:0,energy:0,wall:0,spark:0,frost:0,heal:0},tut:{done:false,step:0},camp:{stars:[0,0,0]},dr:{last:'',streak:0},mis:{day:'',list:[]},cx:{g:{},r:{},e:{}},met:{tut:{}},st:{waves:0,merges:0,bosses:0,hides:0,evos:0},ach:{},tips:{},seenB:{},theme:'meadow',legacy:null},
 raw(k,api){let r=null;try{if(api)r=api.getItem(k)}catch(e){}if(!r)try{r=localStorage.getItem(k)}catch(e){}return r},
 load(){const api=Portal.data();let o=null,from='';
  for(const k of['bd.save.v7','bd.save.v6','bd.save.v5','bd.save.v4','bd.save.v3']){let r=this.raw(k,api);if(!r&&k==='bd.save.v7')r=this.mem;if(!r)continue;try{const x=JSON.parse(r);if(x&&typeof x==='object'){o=x;from=k;break}}catch(e){}}
  if(!o)return;const d=this.d,L=o.lab&&typeof o.lab==='object'?o.lab:{};
  d.best=num(o.best,0,99999,0);d.kills=num(o.kills,0,1e9,0);d.coins=num(o.coins,0,1e7,0);d.sfx=num(o.sfx,0,1,.8);d.music=num(o.music,0,1,.6);d.muted=o.muted===true;d.reduced=typeof o.reduced==='boolean'?o.reduced:null;d.shakeOff=o.shakeOff===true;d.partsLow=o.partsLow===true;
  if(o.dailyBest&&typeof o.dailyBest==='object')d.dailyBest={day:DATE_RE.test(o.dailyBest.day)?o.dailyBest.day:'',wave:num(o.dailyBest.wave,0,99999,0)};
  if(from==='bd.save.v3'){d.legacy={coins:num(o.coins,0,1e7,0),lab:o.lab||null,dr:o.dr||null,mis:o.mis||null,tutDone:o.tutDone===true,seen:o.seen||null};d.tut.done=o.tutDone===true}   // old tutorial = basics done
  else{if(o.legacy&&typeof o.legacy==='object'){d.legacy=o.legacy;if(o.legacy.tutDone===true)d.tut.done=true}
   for(const u of LAB)d.lab[u.id]=num(L[u.id],0,u.max,0);
   if(o.tut&&o.tut.done===true)d.tut.done=true;
   if(o.tut&&typeof o.tut==='object'&&!d.tut.done)d.tut.step=BAL.tutResume.includes(o.tut.step)?o.tut.step:0;   // resume point: only a real chapter start is accepted
   if(o.camp&&Array.isArray(o.camp.stars))d.camp.stars=[0,1,2].map(i=>num(o.camp.stars[i],0,3,0));
   if(o.dr&&typeof o.dr==='object')d.dr={last:DATE_RE.test(o.dr.last)?o.dr.last:'',streak:num(o.dr.streak,0,999,0)};
   if(o.mis&&DATE_RE.test(o.mis.day)&&Array.isArray(o.mis.list))d.mis={day:o.mis.day,list:o.mis.list.slice(0,3).filter(m=>m&&typeof m.k==='string'&&MK[m.k]).map(m=>({k:m.k,need:num(m.need,1,9999,1),have:num(m.have,0,99999,0),claimed:m.claimed===true}))};
   if(o.cx&&typeof o.cx==='object'){for(const k in(o.cx.g||{}))if(/^\d{1,2}$/.test(k)&&+k<BAL.germs.length)d.cx.g[k]=1;if(o.cx.r&&typeof o.cx.r==='object')for(const rc of Roster.recipes)if(o.cx.r[rc.out])d.cx.r[rc.out]=1;if(o.cx.e&&typeof o.cx.e==='object')for(const k of['rapid','frost'])if(o.cx.e[k])d.cx.e[k]=1}
   if(o.met&&o.met.tut&&typeof o.met.tut==='object')for(const k in o.met.tut)if(/^\d{1,2}$/.test(k))d.met.tut[k]=num(o.met.tut[k],0,9999,0);
   if(o.st&&typeof o.st==='object')for(const k in d.st)d.st[k]=num(o.st[k],0,1e9,0);
   if(o.ach&&typeof o.ach==='object')for(const k in o.ach)if(/^[a-z0-9]{1,12}$/.test(k)&&o.ach[k])d.ach[k]=1;
   if(o.tips&&typeof o.tips==='object')for(const k in o.tips)if(/^[a-z0-9]{1,12}$/.test(k)&&o.tips[k])d.tips[k]=1;
   if(o.seenB&&typeof o.seenB==='object')for(const k in o.seenB)if(DEF[k]&&o.seenB[k])d.seenB[k]=1;
   if(typeof o.theme==='string'&&/^(meadow|gut|lungs|blood)$/.test(o.theme))d.theme=o.theme}},
 flush(){const s=JSON.stringify(this.d),api=Portal.data();try{if(api){api.setItem(this.k,s);return}}catch(e){}try{localStorage.setItem(this.k,s);return}catch(e){}this.mem=s}};
/* ---- Lab upgrades (meta), campaign stages, themes, missions, boosts ---- */
const LAB=[{id:'cols',n:'Wider formation',d:'+1 grid column',max:2,cost:l=>60+60*l},{id:'reroll',n:'Shop reroll',d:'+1 free reroll every wave',max:2,cost:l=>40+40*l},
 {id:'energy',n:'Starting energy',d:'+10 energy at the start of a run',max:3,cost:l=>30+30*l},{id:'wall',n:'Tougher Wall',d:'+15 Wall HP',max:4,cost:l=>40+30*l},
];
for(const d of Roster.defs)if(d.unlock.type==='lab')LAB.push({id:d.id,n:d.unlock.labName||'Unlock '+d.name,d:d.unlock.labDesc||d.desc,max:1,cost:()=>d.unlock.cost,unit:d.id});
for(const u of LAB)if(!(u.id in Save.d.lab))Save.d.lab[u.id]=0;
const unlocked=k=>G.sim||G.mode==='prac'||!(DEF[k]&&DEF[k].unlock.type==='lab')||Save.d.lab[k]>0;
const CAMP=[{id:'gut',n:'The Gut',th:'gut',off:0,en:0,mulHp:.75,mulN:.8,fast:330},{id:'lungs',n:'The Lungs',th:'lungs',off:5,en:220,mulHp:.8,mulN:.9,fast:370},{id:'blood',n:'Bloodstream',th:'blood',off:10,en:420,mulHp:.8,mulN:.95,fast:440}];
const THEMES={meadow:{g:'#94ad5b',g2:'#9fb866',g3:'#8aa353',rd:'#dcc596',sp:'#cdb482',f1:'#6d4f33',f2:'#8a6a45',f3:'#5b4029',t1:'#5a9442',t2:'#6aa84f',t3:'#7bba5c',t4:'#4a8138',c1:'#e9d9ad',c2:'#d6c190'},
 gut:{g:'#c97c8f',g2:'#d58b9d',g3:'#bd6e82',rd:'#f2c8b0',sp:'#e2ae95',f1:'#8e3d52',f2:'#a8546a',f3:'#6e2a3c',t1:'#e0768e',t2:'#ee8aa0',t3:'#f6a3b5',t4:'#c85d78',c1:'#f8dccb',c2:'#eab9a0'},
 lungs:{g:'#7fb6cf',g2:'#90c4da',g3:'#6ea8c2',rd:'#eadff0',sp:'#d9cce3',f1:'#4f6d86',f2:'#6585a0',f3:'#3d566b',t1:'#a9d6e8',t2:'#bfe3f1',t3:'#d6f0f8',t4:'#8fc3d8',c1:'#f3ecf7',c2:'#ddd0e8'},
 blood:{g:'#b24a55',g2:'#c25a65',g3:'#a03e4a',rd:'#e8a8a0',sp:'#d68f88',f1:'#6e1f2b',f2:'#8a3140',f3:'#521520',t1:'#d86a74',t2:'#e8808a',t3:'#f59aa3',t4:'#c05560',c1:'#f4c4bc',c2:'#e3a39b'}};
const THN={meadow:'Meadow',gut:'The Gut',lungs:'The Lungs',blood:'Bloodstream'};
const themeOk=k=>{if(k==='meadow')return true;const i=CAMP.findIndex(c=>c.th===k);return i>=0&&Save.d.camp.stars[i]>0};
const MK={wave:{n:'Clear {n} waves',t:[4,6,9]},kill:{n:'Defeat {n} germs',t:[120,250,400]},merge:{n:'Merge {n} times',t:[4,8,12]},hide:{n:'Hide bacteria {n} times',t:[2,4,6]},reach:{n:'Reach wave {n} in Endless',t:[5,7,9]}};
const MREW=[12,18,25],DR=[10,15,20,25,30,40,60];
/* ---- lifetime stats and achievements (real runs only; tutorial, practice and simulations never count) ---- */
const stat=(k,n)=>{if(G.sim||G.mode==='tut'||G.mode==='prac')return;Save.d.st[k]=(Save.d.st[k]||0)+(n||1);Save.d.dirty=1};
const starSum=()=>Save.d.camp.stars.reduce((a,b)=>a+b,0);
const ACH=[{id:'w10',n:'Warm-up',d:'Clear 10 waves in total',v:()=>Save.d.st.waves,need:10,r:10},{id:'w60',n:'Veteran',d:'Clear 60 waves in total',v:()=>Save.d.st.waves,need:60,r:30},
 {id:'k500',n:'Germ buster',d:'Defeat 500 germs',v:()=>Save.d.kills,need:500,r:15},{id:'k5k',n:'Germ exterminator',d:'Defeat 5000 germs',v:()=>Save.d.kills,need:5000,r:40},
 {id:'m25',n:'Merge master',d:'Merge 25 times',v:()=>Save.d.st.merges,need:25,r:10},{id:'m150',n:'Merge legend',d:'Merge 150 times',v:()=>Save.d.st.merges,need:150,r:30},
 {id:'b1',n:'Boss slayer',d:'Defeat a boss',v:()=>Save.d.st.bosses,need:1,r:15},{id:'b10',n:'Boss hunter',d:'Defeat 10 bosses',v:()=>Save.d.st.bosses,need:10,r:40},
 {id:'h10',n:'Now you see me',d:'Use Hide 10 times',v:()=>Save.d.st.hides,need:10,r:10},{id:'e1',n:'Evolved',d:'Evolve a bacteria',v:()=>Save.d.st.evos,need:1,r:10},
 {id:'hy',n:'Mad scientist',d:'Discover the Hybrid recipe',v:()=>Save.d.cx.r.hybrid?1:0,need:1,r:15},{id:'bw15',n:'Deep breath',d:'Reach wave 15 in Endless',v:()=>Save.d.best,need:15,r:30},
 {id:'bw25',n:'Iron Wall',d:'Reach wave 25 in Endless',v:()=>Save.d.best,need:25,r:60},{id:'st9',n:'Three-star doctor',d:'Earn 9 campaign stars',v:starSum,need:9,r:50}];
const achReady=()=>ACH.filter(a=>!Save.d.ach[a.id]&&a.v()>=a.need).length;
const Mis={ensure(){const k=dayKey();if(Save.d.mis.day===k&&Save.d.mis.list.length===3)return;const r=mul(daySeed(k)+7),pool=Object.keys(MK),list=[];for(let i=0;i<3;i++){const kk=pool.splice(Math.floor(r()*pool.length),1)[0];list.push({k:kk,need:MK[kk].t[i],have:0,claimed:false})}Save.d.mis={day:k,list}},
 add(k,n){if(G.sim||G.mode==='tut'||G.mode==='prac')return;this.ensure();for(const m of Save.d.mis.list)if(m.k===k)m.have=Math.min(m.need,m.have+n)},
 max(k,v){if(G.sim||G.mode==='tut'||G.mode==='prac')return;this.ensure();for(const m of Save.d.mis.list)if(m.k===k)m.have=Math.max(m.have,Math.min(m.need,v))}};
const has=ty=>S.grid.some(r=>r.some(u=>u&&u.type===ty)),hasDef=f=>S.grid.some(r=>r.some(u=>u&&DEF[u.type]&&f(DEF[u.type])));
const BOOSTS=[
 {id:'stack',n:'Tight Ranks',d:'+15% stack bonus',r:'common',fx:b=>{b.stack+=.15}},{id:'pierce',n:'Needle Rounds',d:'+1 pierce for all',r:'rare',fx:b=>{b.pierce+=1}},
 {id:'regen',n:'Membrane Repair',d:'Wall heals 8 between waves',r:'common',fx:b=>{b.regen+=8}},{id:'freebuy',n:'Lab Discount',d:'First buy each wave is free',r:'rare',fx:b=>{b.freeBuy+=1}},
 {id:'hide',n:'Thick Biofilm',d:'Hide lasts +1s and +1 charge',r:'common',fx:b=>{b.hideDur+=1;b.hideCh+=1}},{id:'dmg',n:'Strong Strain',d:'+10% damage',r:'common',fx:b=>{b.dmg+=.1}},
 {id:'rate',n:'Quick Metabolism',d:'+8% fire rate',r:'common',fx:b=>{b.rate+=.08}},{id:'energy',n:'Nutrient Rich',d:'+25% energy income',r:'common',fx:b=>{b.energy+=.25}},
 {id:'rally',n:'Team Spirit',d:'Rally fills 40% faster',r:'common',fx:b=>{b.rally+=.4}},{id:'thorn',n:'Sharp Membrane',d:'Wall thorns +50%',r:'rare',fx:b=>{b.thorn+=.5}},
 {id:'hp',n:'Thick Walls',d:'+20% bacteria HP',r:'rare',fx:b=>{b.hp+=.2}},{id:'epicd',n:'Superstrain',d:'+25% damage and +10% fire rate',r:'epic',fx:b=>{b.dmg+=.25;b.rate+=.1}},
 {id:'epics',n:'Phalanx',d:'+40% stack bonus and +1 pierce',r:'epic',fx:b=>{b.stack+=.4;b.pierce+=1}},
 {id:'chain',n:'Storm Cell',d:'Spark chains +2 targets',r:'rare',need:()=>hasDef(d=>d.attack==='chain'),fx:b=>{b.chain+=2}},{id:'cold',n:'Deep Freeze',d:'Slows are 50% stronger',r:'rare',need:()=>hasDef(d=>d.ab.slow>0),fx:b=>{b.slow+=.5}},
 {id:'mark',n:'Hunter Mark',d:'Marked germs take +25% more',r:'rare',need:()=>hasDef(d=>!!d.ab.marks),fx:b=>{b.mark+=.25}},{id:'bloom',n:'Probiotic Bloom',d:'Healers heal +50%',r:'rare',need:()=>hasDef(d=>d.attack==='support'),fx:b=>{b.healP+=.5}}];
const newBf=()=>({stack:0,pierce:0,regen:0,freeBuy:0,hideDur:0,hideCh:0,dmg:0,rate:0,energy:0,rally:0,thorn:0,hp:0,chain:0,slow:0,mark:0,healP:0});
/* ---- portal adapter: every call guarded; a missing SDK just means the game plays ---- */
const Portal={sdk:null,adblock:false,gp:false,lastAd:0,t0:Date.now(),
 async init(){try{const s=window.CrazyGames&&window.CrazyGames.SDK;if(!s)return;await withTimeout(s.init(),4000);this.sdk=s}catch(e){this.sdk=null;return}
  try{this.adblock=(await withTimeout(this.sdk.ad.hasAdblock(),1500))===true}catch(e){}
  try{this.sdk.game.addSettingsChangeListener(s=>{Audio.sdk=!!(s&&s.muteAudio);Audio.apply()})}catch(e){}
  try{Audio.sdk=!!this.sdk.game.settings.muteAudio}catch(e){}},
 data(){try{return this.sdk&&this.sdk.data||null}catch(e){return null}},
 loadingStart(){try{this.sdk&&this.sdk.game.loadingStart()}catch(e){}},loadingStop(){try{this.sdk&&this.sdk.game.loadingStop()}catch(e){}},
 setGameplay(on){if(on===this.gp)return;this.gp=on;try{if(this.sdk){on?this.sdk.game.gameplayStart():this.sdk.game.gameplayStop()}}catch(e){}},
 canAd(k){if(G.sim||G.mode==='tut'||G.mode==='prac'||!this.sdk||this.adblock)return false;if(k==='midgame'){const n=Date.now();if(n-this.t0<BAL.ad.minSession||n-this.lastAd<BAL.ad.gap)return false}return true},
 request(kind,cb){let done=false,g=0;const fin=ok=>{if(done)return;done=true;clearTimeout(g);Audio.ad=false;Audio.apply();cb(ok)};g=setTimeout(()=>fin(false),BAL.ad.guard);
  try{this.sdk.ad.requestAd(kind,{adStarted:()=>{Audio.ad=true;Audio.apply();this.lastAd=Date.now()},adFinished:()=>fin(true),adError:()=>fin(false)})}catch(e){fin(false)}}};
/* ---- procedural audio: no files. [freq, dur, wave, vol, slideTo, minGapMs] ---- */
const SND={place:[520,.09,'sine',.12,720],merge:[600,.16,'triangle',.14,1100],sell:[420,.12,'triangle',.1,260],deny:[180,.12,'square',.08,120],zap:[900,.05,'square',.06,500,40],

 pop:[330,.05,'triangle',.05,160,35],bite:[110,.12,'square',.09,70,220],heart:[70,.16,'sine',.25,45],bomb:[120,.5,'sawtooth',.16,30],heal:[500,.25,'triangle',.1,900],rally:[400,.4,'square',.1,1000],
 hide:[700,.15,'sine',.1,300],evolve:[500,.5,'triangle',.14,1500],horn:[196,.6,'sawtooth',.14,175],win:[660,.5,'triangle',.14,990],lose:[200,.8,'sawtooth',.14,60],click:[660,.04,'sine',.08]};
for(const d of Roster.defs)SND['f_'+d.id]=d.sound||[640,.05,'sine',.05,380,60];   // each bacterium's shot sound comes from its roster entry
const Audio={ctx:null,ls:{},user:false,ad:false,sdk:false,
 prep(){return !!(window.AudioContext||window.webkitAudioContext)},
 unlock(){if(this.ctx){if(this.ctx.state==='suspended')this.ctx.resume();return}
  try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=this.ctx=new C();this.m=c.createGain();this.s=c.createGain();this.u=c.createGain();this.s.connect(this.m);this.u.connect(this.m);this.m.connect(c.destination);
   this.rum=c.createOscillator();this.rg=c.createGain();this.rum.type='triangle';this.rum.frequency.value=48;this.rg.gain.value=0;this.rum.connect(this.rg);this.rg.connect(this.s);this.rum.start();this.apply();AudioFiles.init()}catch(e){this.ctx=null}},
 apply(){if(!this.ctx)return;const off=this.user||this.ad||this.sdk||document.hidden;this.m.gain.value=off?0:1;this.s.gain.value=Save.d.sfx;this.u.gain.value=Save.d.music*.5},
 tone(f,d,ty,v,to){const c=this.ctx;if(!c)return;const t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type=ty;o.frequency.setValueAtTime(f,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(this.s);o.start(t);o.stop(t+d+.02)},
 snd(n,r){if(G.sim||!this.ctx)return;const D=SND[n];if(!D)return;const now=performance.now();if(D[5]&&now-(this.ls[n]||0)<D[5])return;this.ls[n]=now;const file=n.startsWith('f_')?'shoot':({click:'ui_click',buy:'coin',merge:'pop',bomb:'explosion',hurt:'hit',heart:'hit',win:'win',lose:'lose',heal:'heal',boss:'boss_alert'})[n]||n;if(AudioFiles.play(file))return;this.tone(D[0]*(r||1),D[1],D[2],D[3],D[4]?D[4]*(r||1):0)},
fanfare(){if(G.sim||!this.ctx)return;const A=BAL.audio;A.fan.forEach((f,i)=>setTimeout(()=>this.tone(f,.28,'triangle',A.fanVol,f*1.01),i*A.fanGap*1000))},
 rumble(n){if(this.ctx)this.rg.gain.value=Math.min(.09,n/400*.09)}};

const AudioFiles = {
 buffers: {}, pending: false,
 paths: {"boss_alert": "assets/audio/sfx/sfx_boss_alert.wav", "win": "assets/audio/sfx/sfx_win.wav", "explosion": "assets/audio/sfx/sfx_explosion.wav", "lose": "assets/audio/sfx/sfx_lose.wav", "heal": "assets/audio/sfx/sfx_heal.wav", "pop": "assets/audio/sfx/sfx_pop.wav", "shoot": "assets/audio/sfx/sfx_shoot.wav", "ui_click": "assets/audio/sfx/sfx_ui_click.wav", "coin": "assets/audio/sfx/sfx_coin.wav", "hit": "assets/audio/sfx/sfx_hit.wav", "music_prep": "assets/audio/bgm/bgm_main_menu.mp3", "music_battle": "assets/audio/bgm/bgm_battle.mp3", "music_boss": "assets/audio/bgm/bgm_boss.mp3"},
 init() {
  if(this.pending || !Audio.ctx)return; this.pending=true;
  for(const [key,path] of Object.entries(this.paths)) {
   fetch(assetURL(path)).then(r=>{if(!r.ok)throw Error(r.status);return r.arrayBuffer()})
    .then(data=>Audio.ctx.decodeAudioData(data)).then(buffer=>{this.buffers[key]=buffer})
    .catch(()=>{}); // synthesized fallback remains available
  }
 },
 play(key) {const buffer=this.buffers[key];if(!buffer || !Audio.ctx)return false;
   const node=Audio.ctx.createBufferSource();node.buffer=buffer;node.connect(Audio.s);node.start();return true;}
};

document.addEventListener('visibilitychange',()=>Audio.apply());
/* three music layers (prep, battle, boss) always scheduled; moods crossfade their gains */
const Music={on:false,want:'load',hold:0,gs:{},
 L:{prep:{ty:'triangle',base:220,pat:[0,null,4,null,7,null,4,null,2,null,5,null,9,null,5,null],dt:.3,v:.5,i:0,nt:0},
    load:{ty:'sine',base:196,pat:[0,null,7,null,12,null,7,null,5,null,12,null,9,null,4,null],dt:.34,v:.45,i:0,nt:0},
    battle:{ty:'square',base:110,pat:[0,0,7,0,5,0,7,3,0,0,7,0,5,0,10,7],dt:.15,v:.28,i:0,nt:0},
    boss:{ty:'sawtooth',base:82,pat:[0,1,0,1,3,1,0,1,0,1,0,6,5,3,1,0],dt:.12,v:.3,i:0,nt:0}},
 start(){const c=Audio.ctx;if(!c||this.on)return;this.on=true;for(const k in this.L){const g=c.createGain();g.gain.value=0;g.connect(Audio.u);this.gs[k]=g;this.L[k].nt=c.currentTime+.1}
  this.mood(this.want);setInterval(()=>this.tick(),120)},
 tick(){const c=Audio.ctx;if(!c)return;for(const k in this.L){const L=this.L[k];const buffer=AudioFiles.buffers['music_'+k];if(buffer){if(!L.fileSource){const node=c.createBufferSource();node.buffer=buffer;node.loop=true;node.connect(this.gs[k]);node.start();L.fileSource=node}L.nt=c.currentTime+.1;continue}while(L.nt<c.currentTime+.25){const n=L.pat[L.i%L.pat.length];L.i++;
  if(n!==null){const o=c.createOscillator(),g=c.createGain();o.type=L.ty;o.frequency.value=L.base*Math.pow(2,n/12);g.gain.setValueAtTime(L.v,L.nt);g.gain.exponentialRampToValueAtTime(.0001,L.nt+L.dt*.9);o.connect(g);g.connect(this.gs[k]);o.start(L.nt);o.stop(L.nt+L.dt)}L.nt+=L.dt}}},
 mood(m){if(m==='menu')m='prep';const now=performance.now();if(this.want==='load'&&m!=='load'&&now<this.hold){clearTimeout(this.ht);this.ht=setTimeout(()=>this.mood(m),this.hold-now+20);return}   // let the loading loop breathe, then crossfade
  this.want=m;if(!this.on)return;const c=Audio.ctx;for(const k in this.gs)this.gs[k].gain.setTargetAtTime(k===m?1:0,c.currentTime,BAL.audio.xfade/2)}};
const cx=q=>BAL.x0+q*BAL.cell+BAL.cell/2,cy=r=>BAL.laneY0+r*BAL.laneH,cellX=q=>BAL.x0+q*BAL.cell,cellY=r=>BAL.laneY0-BAL.laneH/2+r*BAL.laneH;
const legacyCurve=()=>G.mode==='camp'||G.mode==='tut'||G.mode==='prac';   // Campaign, tutorial and practice keep the gentle v5 curve; Endless and Daily use the steeper one
const hpOf=w=>BAL.hp.base*(1+BAL.hp.lin*(w-1))*Math.pow(legacyCurve()?BAL.hp.cexp:BAL.hp.exp,w-1)*(S&&S.mulHp||1);
const evm=(u,k)=>{let m=1;for(const e of u.ev)m*=BAL.evo[e][k];return m};
const unitHp=u=>BAL.def.hp*Math.pow(BAL.def.hpG,u.lvl-1)*TY[u.type].hp*evm(u,'hp')*(1+(S&&S.bf?S.bf.hp:0));
const cost=t=>TY[t].cost+S.bought*BAL.labGrowth,price=t=>S.freeLeft>0?0:cost(t);
const dw=()=>S.wave-S.off;
const canMerge=(a,b)=>a.lvl===b.lvl&&a.lvl<BAL.maxLvl&&(a.type===b.type||!!recipeOf(a.type,b.type));
/* ---- art: local roster sprites are baked once with their outline and shadow ---- */
const ANIM_ST=['idle','attack','hurt'];
const Art={cv:{},an:{},src:{},res:{},miss:{},ok:false,K:1.15,n:0,tot:0,ready:null,
 // per bacterium: 4 art tiers (Lv1-2,3-4,5-6,7-8), 8 sprites (one per level) or 1 sprite for every level
 tier(l,t){const n=DEF[t]?DEF[t].art.tiers.length:0;return n>=8?Math.min(l-1,n-1):Math.min(l>=7?3:l>=5?2:l>=3?1:0,Math.max(0,n-1))},
 get(t,l){const L=this.cv[t];if(!L||!L.length)return null;const i=this.tier(l,t);if(L[i])return L[i];for(let k=i-1;k>=0;k--)if(L[k])return L[k];for(let k=i+1;k<L.length;k++)if(L[k])return L[k];return null},   // nearest tier of the SAME bacterium, never another character
 mz(t,i){const m=DEF[t]&&DEF[t].art.muzzle;if(!m||!m.length)return[.9,.55];const k=m.length>=8?i:Math.min(i>>1,m.length-1);return m[k]||m[m.length-1]},   // 8 levels share 4 muzzle points: lv1-2 -> 0, lv3-4 -> 1 ...
 bake(src,w,h){const max=256,scale=Math.min(1,max/Math.max(w,h));w=Math.max(1,Math.round(w*scale));h=Math.max(1,Math.round(h*scale));const P=16,c=document.createElement('canvas');c.width=w+P*2;c.height=h+P*2;const g=c.getContext('2d');
  const s=document.createElement('canvas');s.width=w;s.height=h;const sg=s.getContext('2d');sg.imageSmoothingEnabled=true;sg.imageSmoothingQuality='high';sg.drawImage(src,0,0,w,h);sg.globalCompositeOperation='source-in';sg.fillStyle=K;sg.fillRect(0,0,w,h);
  const ring=(ox,oy,rad)=>{for(let k=0;k<12;k++){const a=k/12*6.28319;g.drawImage(s,P+ox+Math.cos(a)*rad,P+oy+Math.sin(a)*rad)}g.drawImage(s,P+ox,P+oy)};
  ring(11,11,4);ring(0,0,3);g.drawImage(src,P,P,w,h);
  const fl=document.createElement('canvas');fl.width=w;fl.height=h;const fg=fl.getContext('2d');fg.imageSmoothingEnabled=true;fg.imageSmoothingQuality='high';fg.drawImage(src,0,0,w,h);fg.globalCompositeOperation='source-in';fg.fillStyle='#fff';fg.fillRect(0,0,w,h);   // device-resolution art keeps the mobile/retina cache lean
  return{c,w,h,P,fl,ti:0}},
 load(src,ms){const cands=assetCandidates(src);return new Promise(res=>{let i=0;const next=()=>{if(i>=cands.length){res(null);return}const c=cands[i++];this.load1(c,ms).then(im=>{if(im){this.res[src]=c;res(im)}else next()})};next()})},   // tries the alias names in order
 load1(src,ms){return new Promise(res=>{const im=new Image();let done=false,tm=0;const fin=ok=>{if(done)return;done=true;clearTimeout(tm);im.onload=im.onerror=null;res(ok?im:null)};tm=setTimeout(()=>fin(false),ms);im.onload=()=>fin(im.naturalWidth>0&&im.naturalHeight>0);im.onerror=()=>fin(false);im.decoding='async';im.src=assetURL(src)})},
 init(){const jobs=[];
  for(const d of Roster.defs){this.cv[d.id]=[];d.art.tiers.forEach((src,i)=>jobs.push({t:d.id,st:'tier',tier:i,i,src}));
   const an=d.art.anim;if(an)for(const st of ANIM_ST){const a=an[st];if(!a||!Array.isArray(a.frames)||!a.frames.length)continue;
    const A=(this.an[d.id]=this.an[d.id]||{})[st]={fps:Math.min(30,Math.max(1,+a.fps||8)),tiers:[]};
    if(a.frames.some(Array.isArray))a.frames.forEach((L,ti)=>(Array.isArray(L)?L:[L]).forEach((src,i)=>{if(typeof src==='string'&&src)jobs.push({t:d.id,st,tier:ti,i,src})}));
    else a.frames.forEach((src,i)=>{if(typeof src==='string'&&src)jobs.push({t:d.id,st,tier:0,i,src})})}}
  this.tot=jobs.length;
  const nm=src=>src.startsWith('data:')?'embedded image':src;
  this.ready=Promise.all(jobs.map(j=>this.load(j.src,8000).then(im=>{
    try{if(im){const B=this.bake(im,im.naturalWidth,im.naturalHeight);B.ti=j.tier;
      if(j.st==='tier')this.cv[j.t][j.i]=B;else{const A=this.an[j.t][j.st];(A.tiers[j.tier]=A.tiers[j.tier]||[])[j.i]=B}}
     else{(this.miss[j.t]=this.miss[j.t]||[]).push(j.src);Roster.warn('could not load an image for "'+j.t+'" ('+nm(j.src)+'). A placeholder is drawn instead.')}}catch(e){(this.miss[j.t]=this.miss[j.t]||[]).push(j.src)}
    this.n++}))).then(()=>{
     for(const d of Roster.defs){const L=this.cv[d.id];let k=L.findIndex(Boolean);
      if(k>=0){const t0=d.art.tiers[k];this.src[d.id]=this.res[t0]||t0}
      else{const A=this.an[d.id],f=A&&(A.idle||A.attack);const B=f&&f.tiers.find(t=>t&&t.length)&&f.tiers.find(t=>t&&t.length).find(Boolean);if(B){L[0]=B;const fs=d.art.anim[A.idle?'idle':'attack'].frames;this.src[d.id]=Array.isArray(fs[0])?fs[0][0]:fs[0]}}}   // no tier art but frames exist: use the first frame as the static sprite
     this.ok=true});
 },
 muzzle(x,y,u,tilt,A){A=A||this.get(u.type,u.lvl);const M=this.mz(u.type,A.ti),f=(BAL.R*1.75*this.K*(DEF[u.type]?DEF[u.type].art.scale:1))/A.w,hh=A.h*f/2,fy=y-BAL.R*.07+hh,px=(M[0]-.5)*A.w*f,py=(M[1]-1)*A.h*f,c=Math.cos(tilt||0),s=Math.sin(tilt||0);return{x:x+px*c-py*s,y:fy+px*s+py*c}}};
Art.init();

const GermPaths = [
  levelsForGerm('enemy', 'enemy_cocci'),
  levelsForGerm('enemy', 'enemy_runner'),
  levelsForGerm('enemy', 'enemy_brute', 'webp'),
  levelsForGerm('boss', 'boss_mega_staph'),
  levelsForGerm('enemy', 'enemy_spitter', 'webp'),
  levelsForGerm('enemy', 'enemy_medic'),
  levelsForGerm('enemy', 'enemy_bloater'),
  levelsForGerm('enemy', 'enemy_swarm'),
  levelsForGerm('boss', 'boss_smog_wraith'),
  levelsForGerm('boss', 'queen'),
  levelsForGerm('enemy', 'enemy_shielded'),
  levelsForGerm('enemy', 'enemy_splitter', 'webp'),
  levelsForGerm('enemy', 'enemy_splitling'),
  levelsForGerm('boss', 'boss_amoeba_emperor')
];

function levelsForGerm(folder, prefix, ext = 'png') {
  if (folder === 'boss' && prefix === 'queen') {
    return Array.from({ length: 4 }, (_, i) => `assets/boss/queen_lv${i + 1}.png`);
  }
  return Array.from({ length: 4 }, (_, i) => `assets/${folder}/${prefix}_lv${i + 1}.${ext}`);
}

function fitGermSprite(image, maxSide = 256) {
  const w = image.naturalWidth || image.width, h = image.naturalHeight || image.height;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  if (scale >= 1) return image;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function tintGermSprite(image, color) {
  const w = image.width || image.naturalWidth, h = image.height || image.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0);
  context.globalCompositeOperation = 'source-atop';
  context.fillStyle = color;
  context.fillRect(0, 0, w, h);
  context.globalCompositeOperation = 'source-over';
  return canvas;
}

const GermArt = {
  images: [],
  flashes: [],
  slows: [],
  missing: [],
  paths: GermPaths,
  level(type, wave) {
    const T = BAL.germs[type];
    const start = Number.isFinite(T && T.from) ? T.from : BAL.bossEvery;
    return clamp(1 + Math.floor(Math.max(0, wave - start) / 5), 1, 4);
  },
  src(type, wave) {
    const list = this.paths[type] || [];
    const p = list[this.level(type, wave) - 1] || list[0] || '';
    return Art.res[p] || p;
  },
  get(type, wave) {
    const list = this.images[type] || [];
    const level = this.level(type, wave) - 1;
    return list[level] || list.find(Boolean) || null;
  },
  getFlash(type, wave) {
    const list = this.flashes[type] || [];
    const level = this.level(type, wave) - 1;
    return list[level] || list.find(Boolean) || null;
  },
  getSlow(type, wave) {
    const list = this.slows[type] || [];
    const level = this.level(type, wave) - 1;
    return list[level] || list.find(Boolean) || null;
  },
  init() {
    const jobs = [];
    this.paths.forEach((paths, type) => {
      this.images[type] = [];
      this.flashes[type] = [];
      this.slows[type] = [];
      paths.forEach((src, level) => jobs.push(
        Art.load(src, 8000).then(image => {
          if (image) {
            const sprite = fitGermSprite(image);
            this.images[type][level] = sprite;
            this.flashes[type][level] = tintGermSprite(sprite, 'rgba(255,255,255,.92)');
            this.slows[type][level] = tintGermSprite(sprite, 'rgba(125,211,252,.45)');
          } else this.missing.push(src);
        })
      ));
    });
    return Promise.all(jobs);
  }
};
GermArt.ready = GermArt.init();

const FxArt = {
  sets: { germ_pop_small: 6, bomb_explosion: 6, heal_pulse: 6, acid_splash: 6, splitter_split: 6, boss_amoeba_slam: 6, boss_queen_heart: 6, boss_smog_breath: 6, boss_staph_spore: 6, gold_sparkle: 1 },
  frames: {},
  init() {
    const jobs = [];
    for (const [k, n] of Object.entries(this.sets)) {
      this.frames[k] = [];
      for (let i = 1; i <= n; i++) jobs.push(Art.load(`assets/effects/fx_${k}_${String(i).padStart(2, '0')}.png`, 6000)
        .then(im => { if (im) this.frames[k][i - 1] = fitGermSprite(im, 96); }));
    }
    return Promise.all(jobs);
  },
  ok(k) { const f = this.frames[k]; return !!(f && f.some(Boolean)); }
};
FxArt.ready = FxArt.init();

const FieldArt = {
  paths: {
    meadow: 'assets/background/bg_basic.png',
    gut: 'assets/background/bg_red_area.png',
    lungs: 'assets/background/bg_cold_area.png',
    blood: 'assets/background/bg_blood_landscape.png'
  },
  images: {},
  get(theme) {
    return this.images[theme] || this.images.meadow || null;
  },
  init() {
    return Promise.all(Object.entries(this.paths).map(([theme, src]) =>
      Art.load(src, 8000).then(image => {
        if (image) this.images[theme] = image;
      })
    ));
  }
};
FieldArt.ready = FieldArt.init();

// Only combat-relevant effects are preloaded. Missing artwork keeps the vector fallback.
const WeaponArt = {
 paths: {"shoot": {"projectile": ["assets/good_bacteria/lactobacillus/gun_effects/lactobacillus_bubble_t1.webp", "assets/good_bacteria/lactobacillus/gun_effects/lactobacillus_bubble_t2.webp", "assets/good_bacteria/lactobacillus/gun_effects/lactobacillus_bubble_t3.webp", "assets/good_bacteria/lactobacillus/gun_effects/lactobacillus_bubble_t4.webp"], "muzzle": ["assets/good_bacteria/lactobacillus/gun_effects/lactobacillus_bubble_muzzle_t1.webp", "assets/good_bacteria/lactobacillus/gun_effects/lactobacillus_bubble_muzzle_t2.webp", "assets/good_bacteria/lactobacillus/gun_effects/lactobacillus_bubble_muzzle_t3.webp", "assets/good_bacteria/lactobacillus/gun_effects/lactobacillus_bubble_muzzle_t4.webp"]}, "snipe": {"projectile": ["assets/good_bacteria/bifido/gun_effects/bifido_needle_dart_t1.png", "assets/good_bacteria/bifido/gun_effects/bifido_blue_arrow_t1.png", "assets/good_bacteria/bifido/gun_effects/bifido_blue_arrow_t2.png", "assets/good_bacteria/bifido/gun_effects/bifido_ice_shard_muzzle_t4.png"], "muzzle": ["assets/good_bacteria/bifido/gun_effects/bifido_needle_dart_muzzle_t2.png", "assets/good_bacteria/bifido/gun_effects/bifido_needle_dart_muzzle_t2.png", "assets/good_bacteria/bifido/gun_effects/bifido_needle_dart_muzzle_t2.png", "assets/good_bacteria/bifido/gun_effects/bifido_needle_dart_muzzle_t2.png"]}, "guard": {"projectile": ["assets/good_bacteria/bacillus/gun_effects/bacillus_rivet_slug_t1.png", "assets/good_bacteria/bacillus/gun_effects/bacillus_rivet_slug_t2.png", "assets/good_bacteria/bacillus/gun_effects/bacillus_rivet_slug_t3.png", "assets/good_bacteria/bacillus/gun_effects/bacillus_rivet_slug_t4.png"], "muzzle": ["assets/good_bacteria/bacillus/gun_effects/bacillus_rivet_slug_muzzle_t1_alt.png", "assets/good_bacteria/bacillus/gun_effects/bacillus_rivet_slug_muzzle_t1_alt.png", "assets/good_bacteria/bacillus/gun_effects/bacillus_rivet_slug_muzzle_t1_alt.png", "assets/good_bacteria/bacillus/gun_effects/bacillus_rivet_slug_muzzle_t1_alt.png"]}, "frost": {"projectile": ["assets/good_bacteria/spirillum/gun_effects/spirillum_ice_shard_t1.png", "assets/good_bacteria/spirillum/gun_effects/spirillum_ice_shard_t2.png", "assets/good_bacteria/spirillum/gun_effects/spirillum_ice_shard_frost_ring_t3.png", "assets/good_bacteria/spirillum/gun_effects/spirillum_ice_shard_golden_t4.png"], "muzzle": ["assets/good_bacteria/spirillum/gun_effects/spirillum_ice_shard_muzzle_t1.png", "assets/good_bacteria/spirillum/gun_effects/spirillum_ice_shard_muzzle_t2.png", "assets/good_bacteria/spirillum/gun_effects/spirillum_ice_shard_muzzle_t3.png", "assets/good_bacteria/spirillum/gun_effects/spirillum_ice_shard_muzzle_t4.png"]}, "hybrid": {"projectile": ["assets/good_bacteria/hybrid/gun_effects/proj_twin_bolts_t1_cyan_01.png", "assets/good_bacteria/hybrid/gun_effects/proj_twin_bolts_t2_cyan_01.png", "assets/good_bacteria/hybrid/gun_effects/proj_twin_bolts_t3_cyan_01.png", "assets/good_bacteria/hybrid/gun_effects/proj_twin_bolts_t4_cyan_01.png"], "muzzle": ["assets/good_bacteria/hybrid/gun_effects/fx_twin_bolts_muzzle_bolts_orange_cyan.png", "assets/good_bacteria/hybrid/gun_effects/fx_twin_bolts_muzzle_bolts_gold_cyan.png", "assets/good_bacteria/hybrid/gun_effects/fx_twin_bolts_muzzle_double_barrel.png", "assets/good_bacteria/hybrid/gun_effects/fx_twin_bolts_muzzle_double_barrel_gold_sparkle.png"]}, "spark": {"projectile": ["assets/good_bacteria/leuconostoc/gun_effects/proj_spark_orb_t1_01.png", "assets/good_bacteria/leuconostoc/gun_effects/proj_spark_orb_t2_01.png", "assets/good_bacteria/leuconostoc/gun_effects/proj_spark_orb_t3_01.png", "assets/good_bacteria/leuconostoc/gun_effects/proj_spark_orb_t4_01.png"], "muzzle": ["assets/good_bacteria/leuconostoc/gun_effects/fx_spark_orb_muzzle_t1.png", "assets/good_bacteria/leuconostoc/gun_effects/fx_spark_orb_muzzle_t2.png", "assets/good_bacteria/leuconostoc/gun_effects/fx_spark_orb_muzzle_t3.png", "assets/good_bacteria/leuconostoc/gun_effects/fx_spark_orb_muzzle_t4.png"]}, "heal": {"projectile": ["assets/good_bacteria/strepto/gun_effects/proj_heart_pellet_t1_01.png", "assets/good_bacteria/strepto/gun_effects/proj_heart_pellet_t2_01.png", "assets/good_bacteria/strepto/gun_effects/proj_heart_pellet_t3_01.png", "assets/good_bacteria/strepto/gun_effects/proj_heart_pellet_t4_01.png"], "muzzle": ["assets/good_bacteria/strepto/gun_effects/fx_heart_pellet_muzzle_t1.png", "assets/good_bacteria/strepto/gun_effects/fx_heart_pellet_muzzle_t2.png", "assets/good_bacteria/strepto/gun_effects/fx_heart_pellet_muzzle_t3.png", "assets/good_bacteria/strepto/gun_effects/fx_heart_pellet_muzzle_t4.png"]}},
 images: {},
 init() {
   const jobs = [];
   for (const [type, groups] of Object.entries(this.paths)) {
     this.images[type] = {};
     for (const [kind, paths] of Object.entries(groups)) {
       const list = this.images[type][kind] = [];
       paths.forEach((src, i) => jobs.push(Art.load(src, 8000).then(image => {
         if (image) list[i] = fitGermSprite(image, 96);
       })));
     }
   }
   return Promise.all(jobs);
 },
 get(type, level, kind) {
   const list = this.images[type] && this.images[type][kind];
   return list && list[Math.min(3, Math.max(0, Math.floor((level - 1) / 2)))];
 }
};
WeaponArt.ready = WeaponArt.init();

/* gun_effects that WeaponArt does not cover: hit impacts, bubble trail and the second animation frame of projectiles */
const ImpactArt = (() => {
  const G_ = n => `${GB}${n}/gun_effects/`, T4 = [1, 2, 3, 4];
  const SRC = {
    impact: {
      shoot: T4.map(t => `${G_('lactobacillus')}lactobacillus_bubble_impact_t${t}.webp`),
      snipe: [`${G_('bifido')}bifido_needle_dart_impact_01.png`, ...[1, 2, 3].map(n => `${G_('bifido')}bifido_ice_shard_impact_0${n}.png`)],
      guard: T4.map(t => `${G_('bacillus')}bacillus_rivet_slug_impact_t${t}.png`),
      spark: T4.map(t => `${G_('leuconostoc')}fx_spark_orb_impact_t${t}.png`),
      frost: ['spirillum_snowflake_impact_01', 'spirillum_frost_burst_01', 'spirillum_snowflake_burst_01', 'spirillum_frost_burst_golden_01'].map(n => `${G_('spirillum')}${n}.png`),
      heal: T4.map(t => `${G_('strepto')}fx_heart_pellet_impact_t${t}.png`),
      hybrid: ['sparkle_01', 'spiral_01', 'starburst_01', 'starburst_04'].map(n => `${G_('hybrid')}fx_twin_bolts_impact_${n}.png`)
    },
    alt: {   // second frame of the projectile: the sprite swaps every 0.1 s
      shoot: T4.map(t => `${G_('lactobacillus')}lactobacillus_bubble_t${t}_alt.webp`),
      spark: T4.map(t => `${G_('leuconostoc')}proj_spark_orb_t${t}_02.png`),
      heal: T4.map(t => `${G_('strepto')}proj_heart_pellet_t${t}_02.png`),
      hybrid: T4.map(t => `${G_('hybrid')}proj_twin_bolts_t${t}_cyan_02.png`),
      frost: [`spirillum_ice_shard_t1_alt`, `spirillum_ice_shard_t2_alt`, `spirillum_ice_shard_frost_ring_t3_alt`, `spirillum_ice_shard_golden_t4_alt`].map(n => `${G_('spirillum')}${n}.png`)
    },
    trail: { shoot: T4.map(t => `${G_('lactobacillus')}lactobacillus_bubble_trail_t${t}.webp`) },
    pop: { shoot: [1, 2, 3, 4].map(n => `${G_('lactobacillus')}lactobacillus_bubble_pop_0${n}.webp`) }
  };
  const A = { impact: {}, alt: {}, trail: {}, pop: {} };
  const tier = l => Math.min(3, Math.max(0, Math.floor((l - 1) / 2)));
  const jobs = [];
  for (const kind in SRC) for (const type in SRC[kind]) {
    A[kind][type] = [];
    SRC[kind][type].forEach((src, i) => jobs.push(Art.load(src, 7000).then(im => { if (im) A[kind][type][i] = fitGermSprite(im, 96); })));
  }
  const pick = (kind, type, level) => { const L = A[kind][type]; if (!L) return null; const i = tier(level); return L[i] || L.slice(0, i).reverse().find(Boolean) || null; };
  return {
    ready: Promise.all(jobs),
    impact: (t, l) => pick('impact', t, l), alt: (t, l) => pick('alt', t, l), trail: (t, l) => pick('trail', t, l),
    pop: t => { const L = A.pop[t]; return L ? L.find(Boolean) || null : null; }
  };
})();


/* ---- run ---- */
let RM=matchMedia('(prefers-reduced-motion: reduce)').matches;const SYS_RM=RM,PCAP=[260,100,40];
const poolG=[],poolB=[];
const HC=24,HW=Math.ceil((BAL.LW+80)/HC),HH=Math.ceil(BAL.LH/HC),head=new Int16Array(HW*HH),nxt=new Int16Array(BAL.maxGerms+64);
function hashBuild(gs){head.fill(-1);for(let i=0;i<gs.length;i++){const g=gs[i];if(g.x<0||g.x>=HW*HC||g.y<0||g.y>=BAL.LH)continue;const k=((g.y/HC)|0)*HW+((g.x/HC)|0);nxt[i]=head[k];head[k]=i}}
function newRun(){
  if(S){for(const g of S.germs)poolG.push(g);for(const b of S.bul)poolB.push(b)}
  S={st:ST.PREP,wave:1,hp:BAL.wallHp,en:BAL.startEnergy,bought:0,kills:0,grid:Array.from({length:BAL.rows},()=>Array(BAL.cols).fill(null)),gh:Array.from({length:BAL.rows},()=>Array(BAL.cols).fill(null)),
   germs:[],bul:[],pa:[],ft:[],arcs:[],links:[],q:[],qi:0,qt:0,si:1,prepT:0,idle:0,shop:[],freeRR:BAL.shop.free,quick:false,shake:0,t:0,sel:null,cur:{q:0,r:2},gid:0,banner:0,
   rally:0,rallyT:0,pf:[],wh:0,dec:0,hideC:BAL.hide.charges,bomb:null,bcd:0,evo:null,stack:0,pRows:0,cl:[],seen:{},cnt:[],rg:[],fl:[],ip:[],leaves:[],f:0,hb:0,push:0,gate:0,revived:false,nextQ:null,gridA:1,off:0,mulHp:1,mulN:1,bf:newBf(),picked:[],lost:0,bt:0,freeLeft:0,zaps:0,rerolled:0,coinsRun:0,fa:[]};
  startPrep();
}
function rollShop(){const av=TKEYS.filter(k=>TY[k].from<=S.wave&&unlocked(k)),o=[];while(o.length<BAL.shop.n&&o.length<av.length){const k=av[Math.floor(RS()*av.length)];if(!o.includes(k))o.push(k)}S.shop=o}
const bossOf=w=>BAL.bosses[((w/BAL.bossEvery-1)|0)%BAL.bosses.length];
function miniOf(w){const M=BAL.mini,d=w-(S?S.off|0:0);if(G.mode==='tut'||G.mode==='prac'||d<1||d%BAL.bossEvery===0)return -1;const n=d-((d/BAL.bossEvery)|0);return n%M.every?-1:M.list[(n/M.every-1)%M.list.length]}
const germHp=(t,w,mini)=>{const T=BAL.germs[t];return hpOf(w)*(T.hp+(T.shield||0))*(mini?BAL.mini.hp:1)};
const SPQ=[];
function makeQueue(w){
  const GT=BAL.germs,q=[],av=[];let left=Math.round((BAL.count.a+BAL.count.b*w+(legacyCurve()?BAL.count.cc:BAL.count.c)*w*w)*BAL.ptsMul*(S&&S.mulN||1));
  for(let t=0;t<GT.length;t++)if(!GT[t].boss&&!GT[t].hid&&GT[t].from<=w)av.push(t);
  const wt=av.map(t=>(GT[t].from===w&&w>1&&t!==7?BAL.newBoost:1)*(t===0?2.2:1));let tot=0;for(const x of wt)tot+=x;
  while(left>0){let r=RW()*tot,i=0;for(;i<av.length-1;i++){if(r<wt[i])break;r-=wt[i]}const t=av[i];for(let k=0;k<(GT[t].pack||1);k++)q.push(t);left-=GT[t].pts}
  const mt=miniOf(w);if(mt>=0)q.push(mt);   // the mini-boss is always last in the queue
  if(w%BAL.bossEvery===0)q.push(bossOf(w));return q;
}
function intro(t){const T=BAL.germs[t],src=GermArt.src(t,S.wave);$('ngN').textContent=T.n+(T.boss?' (BOSS)':' (NEW)');$('ngT').textContent=T.tip;$('ngD').style.backgroundColor=T.c;$('ngD').style.backgroundImage=src?'url("'+src+'")':'none';const el=$('newGerm');el.classList.remove('hidden');clearTimeout(intro.h);intro.h=setTimeout(()=>el.classList.add('hidden'),5500)}
function startPrep(){
  S.q=S.nextQ||makeQueue(S.wave);S.nextQ=null;if(!G.sim)tgx.clearRect(0,0,BAL.LW,BAL.LH);S.prepT=0;S.idle=0;S.st=ST.PREP;S.sel=null;S.freeRR=BAL.shop.free;rollShop();S.cl.length=0;
  if(G.mode==='tut'){S.q=S.wave===1?[0,0,0,0,0,0,0,0,0,0]:S.wave>=5?[3,0,0,0,0,0]:[0,0,1,0,1,4,0,1];S.shop=['shoot','guard','snipe'];S.en=Math.max(S.en,150)}
  if(G.mode==='prac')S.q=[];
  S.freeLeft=S.bf.freeBuy;S.hp=Math.min(BAL.wallHp,S.hp+S.bf.regen);for(const row of S.grid)for(const u of row)if(u)u.mhp=unitHp(u);
  for(const row of S.grid)for(const u of row)if(u){u.hp=u.mhp;u.hide=0;u.dis=0}
  $('ov').classList.add('hidden');
  const c=S.cnt;c.length=0;for(let i=0;i<BAL.germs.length;i++)c[i]=0;S.q.forEach(t=>c[t]++);
  S.miniQ=miniOf(S.wave)>=0;S.prev=`${STR.wave} ${dw()}: ${S.q.length} germs`+(S.miniQ?' · '+STR.mini:'');
  if(!G.sim&&S.miniQ)tipCard('mini',STR.mini,STR.miniTip,'#ffd23f');
  if(!G.sim)for(let t=1;t<c.length;t++)if(c[t]&&!S.seen[t]){S.seen[t]=1;intro(t);break}
  if(!G.sim)for(const ty of S.shop)if(ty&&!Save.d.seenB[ty]){introB(ty);break}
  if(!G.sim&&S.gh.some(r=>r.some(Boolean)))tipCard('ghost','Fallen bacteria','Tap a faded ghost cell to rebuild it for half price.','#fb923c');
}
const units=()=>{let n=0;for(const row of S.grid)for(const u of row)if(u)n++;return n};
function mk(type,paid,lvl,ev){const u={type,lvl:lvl||1,ev:ev||[],cd:.3,fresh:true,paid,pop:.3,rc:0,hide:0,dis:0,hcd:0,hc:1,rateM:1,pierce:0,mk:false};u.mhp=u.hp=unitHp(u);return u}
const ft=(x,y,t,c)=>{if(S.ft.length<48)S.ft.push({x,y,t,c,l:.9})};
function hurt(g,d){if(g.sh>0){const a=d<g.sh?d:g.sh;g.sh-=a;d-=a;if(g.sh<=0)burst(g.x,g.y,'#7dd3fc',6)}g.hp-=d;g.hpP=g.hp}   // every hit on a germ goes through here: shield first, then HP
function fxAnim(k,x,y,sz){if(G.sim||RM||G.q>=2||!FxArt.ok(k)||S.fa.length>=24)return;S.fa.push({k,x,y,sz,t:0})}   // sprite-sheet style effects from assets/effects
function burst(x,y,c,n){if(RM||Save.d.partsLow)n=Math.ceil(n*.3);for(let i=0;i<n&&S.pa.length<PCAP[G.q];i++){const a=Math.random()*6.28,v=35+Math.random()*90;S.pa.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-25,l:.45,c,s:2.6+Math.random()*2.2})}}   // visual only: Math.random, never the gameplay streams
function tipCard(key,title,text,col){if(G.sim||G.mode==='tut'||Save.d.tips[key])return;const c0=$('newGerm');if(!c0.classList.contains('hidden'))return;
  Save.d.tips[key]=1;Save.flush();$('ngN').textContent=title;$('ngT').textContent=text;$('ngD').style.background=col||'#ffd23f';c0.classList.remove('hidden');clearTimeout(intro.h);intro.h=setTimeout(()=>c0.classList.add('hidden'),5500)}
function introB(ty){   // one-time card: a bacterium the player has never bought shows up in the shop
  const D=DEF[ty];if(!D||G.sim||G.mode==='tut'||G.mode==='prac')return;const key='b'+ty.slice(0,11);if(Save.d.tips[key])return;
  const c0=$('newGerm');if(!c0.classList.contains('hidden'))return;Save.d.tips[key]=1;Save.flush();
  const src=Art.src[ty];$('ngN').textContent=D.name+' (NEW)';$('ngT').textContent=D.role+': '+D.desc;$('ngD').style.backgroundColor=D.color;$('ngD').style.backgroundImage=src?'url("'+src+'")':'none';
  c0.classList.remove('hidden');clearTimeout(intro.h);intro.h=setTimeout(()=>c0.classList.add('hidden'),6000)}
function toast(m){if(G.sim)return;const t=$('toast');t.textContent=m;t.classList.remove('hidden');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.add('hidden'),1300)}
/* ---- synergies: stack (column), row focus (row), marking (adjacent Bifido), links drawn on board ---- */
const NB=[[1,0],[-1,0],[0,1],[0,-1]];
function syn(){
  const cc=Array(BAL.cols).fill(0),rc=Array(BAL.rows).fill(0),L=S.links;L.length=0;
  for(let r=0;r<BAL.rows;r++)for(let q=0;q<BAL.cols;q++)if(S.grid[r][q]){cc[q]++;rc[r]++}
  for(let q=0;q<BAL.cols;q++){let p=-1;for(let r=0;r<BAL.rows;r++)if(S.grid[r][q]){if(p>=0)L.push([q,p,q,r,'#ffd23f']);p=r}}
  S.pRows=0;for(let r=0;r<BAL.rows;r++)if(rc[r]>=BAL.rowMin){S.pRows++;let a=-1,b=-1;for(let q=0;q<BAL.cols;q++)if(S.grid[r][q]){if(a<0)a=q;b=q}L.push([a,r,b,r,'#38bdf8'])}
  S.stack=Math.max(...cc);
  for(let r=0;r<BAL.rows;r++)for(let q=0;q<BAL.cols;q++){const u=S.grid[r][q];if(!u)continue;
    u.rateM=1+BAL.stack[Math.min(cc[q],4)]*(1+S.bf.stack);u.pierce=(rc[r]>=BAL.rowMin?BAL.rowPierce:0)+S.bf.pierce;u.mk=false;
    for(const[dq,dr]of NB){const n=S.grid[r+dr]&&S.grid[r+dr][q+dq];if(!n)continue;
      if(DEF[u.type].ab.markHunter&&DEF[n.type].ab.marks){u.mk=true;L.push([q,r,q+dq,r+dr,'#f472b6'])}
      if(DEF[n.type].attack==='support'&&dq+dr>0)L.push([q,r,q+dq,r+dr,'#4ade80'])}}
  if(!G.sim){if(S.stack>=2)tipCard('stack','Column Stack','Bacteria in the same column fire faster. Tall stacks are strong!','#ffd23f');if(S.pRows)tipCard('row','Row Focus','Three or more in one row gives your bullets extra pierce.','#38bdf8');if(L.some(l=>l[4]==='#f472b6'))tipCard('mark','Hunter Mark','A Bifido next to a Lactobacillus marks germs for bonus damage.','#f472b6')}
}
/* ---- placement ---- */
const cellAt=p=>{const q=Math.floor((p.x-BAL.x0)/BAL.cell),r=Math.floor((p.y-cellY(0))/BAL.laneH);return q>=0&&q<BAL.cols&&r>=0&&r<BAL.rows?{q,r}:null};
const U=c=>S.grid[c.r][c.q],same=(a,b)=>a.q===b.q&&a.r===b.r;
function valid(src,c){
  const t=U(c);
  if(src.shop!==undefined){const ty=S.shop[src.shop];if(!ty||S.en<price(ty))return false;return !t||(t.type===ty&&t.lvl===1)}
  if(same(src.from,c))return false;const s=U(src.from);if(!s)return false;
  return !t||canMerge(s,t);
}
function merged(c,u){u.mhp=unitHp(u);u.hp=u.mhp;u.pop=.3;const x=cx(c.q),y=cy(c.r);burst(x,y,LVC[u.lvl-1],14);fxAnim('gold_sparkle',x,y-4,46);ft(x,y-24,'LV '+u.lvl,LVC[u.lvl-1]);Audio.snd('merge',1+u.lvl*.05);Mis.add('merge',1);stat('merges',1);if(S.rg.length<32)S.rg.push({x,y,r:8,l:.4,c:LVC[u.lvl-1]});if(u.lvl>=3)ft(x,y-42,'LEVEL UP!','#fff');
  const k=BAL.evoAt.indexOf(u.lvl);if(k>=0&&u.ev.length<=k)evolve(u)}
function act(src,c){
  if(!valid(src,c)){if(src.shop!==undefined&&S.en<price(S.shop[src.shop]))toast(STR.noEnergy);Audio.snd('deny');return}
  S.idle=0;S.gh[c.r][c.q]=null;Audio.snd('place');
  if(src.shop!==undefined){const ty=S.shop[src.shop],p=price(ty),t=U(c);if(S.freeLeft>0)S.freeLeft--;S.en-=p;S.bought++;if(!Save.d.seenB[ty]){Save.d.seenB[ty]=1;Save.flush()}
    if(t){t.lvl++;t.paid+=p;merged(c,t)}else{S.grid[c.r][c.q]=mk(ty,p);burst(cx(c.q),cy(c.r)+14,'#dcc596',6)}
  }else{const s=U(src.from),t=U(c);S.grid[src.from.r][src.from.q]=null;
    if(t){if(t.type!==s.type){const out=recipeOf(s.type,t.type)||t.type,first=!Save.d.cx.r[out];t.type=out;Save.d.cx.r[out]=1;Save.flush();toast(first?'Recipe discovered: '+TY[out].n+'!':TY[out].n+' created!')}t.lvl++;t.paid+=s.paid;t.fresh=t.fresh&&s.fresh;merged(c,t)}else{S.grid[c.r][c.q]=s;s.pop=.2}}
  syn();
}
function sell(a){const u=U(a);if(!u)return;const v=u.fresh?u.paid:BAL.sellPerLvl*u.lvl;S.en+=v;S.grid[a.r][a.q]=null;S.sel=null;ft(cx(a.q),cy(a.r),'+'+v,'#ffd23f');toast(STR.sold+' +'+v);Audio.snd('sell');syn()}
function rebuild(c){const g=S.gh[c.r][c.q];if(!g)return;if(S.en<g.cost){toast(STR.noEnergy);return}S.en-=g.cost;S.gh[c.r][c.q]=null;const u=mk(g.type,g.cost,g.lvl,g.ev);S.grid[c.r][c.q]=u;toast(STR.rebuilt);syn()}
function evolve(u){
  if(G.sim){u.ev.push('rapid');u.mhp=unitHp(u);u.hp=u.mhp;return}
  S.evo=u;$('ovS').innerHTML='';Audio.snd('evolve');Audio.fanfare();const E=BAL.evo,ks=['rapid','frost'];
  $('ov').querySelector('.card').classList.remove('wide');$('ov').querySelector('.ovBtns').classList.add('stack');$('newGerm').classList.add('hidden');
  $('rib').classList.remove('gold');$('rib').textContent=STR.evolve;$('rib').style.background='#8b6bff';$('ovT').textContent=TY[u.type].n+' reached level '+u.lvl+'. Pick a form:';
  ks.forEach((k,i)=>{const b=$(i?'ovB2':'ovB');b.textContent=E[k].n+': '+E[k].d;b.style.background=i?'#c4b5fd':'#ffd23f';b.classList.remove('hidden');
    b.onclick=()=>{u.ev.push(k);stat('evos',1);Save.d.cx.e[k]=1;Save.flush();u.mhp=unitHp(u);u.hp=u.mhp;u.pop=.3;S.evo=null;$('ov').classList.add('hidden');syn()}});
  $('ov').classList.remove('hidden');$('ovB').focus();
}
const OVI={Resume:'play',Home:'home','Try again':'retry','Next prep':'next','Play Endless':'play',Continue:'next','Watch ad to revive':'ad_ticket','Stage select':'map',Campaign:'map'};
const RIBC={'#38bdf8':'#38b6ff','#e0382f':'#ff5a6e','#d99a00':'#ffb21f','#7c5cff':'#8b6bff'};
function setBtn(b,label){const n=OVI[label];b.innerHTML=(n?ic(n):'')+'<span></span>'+(/^Watch ad/i.test(label)?ic('ad_badge','adTag'):'');b.querySelector('span').textContent=label}
function ov(rib,col,txt,btn,fn,btn2,fn2){if(G.sim)return;countUp.id=(countUp.id|0)+1;const card=$('ov').querySelector('.card'),R=$('rib');card.classList.remove('wide');$('ov').querySelector('.ovBtns').classList.remove('stack');$('ovB').classList.remove('hidden');$('newGerm').classList.add('hidden');$('ovS').innerHTML='';
  R.classList.remove('gold');R.textContent=rib;R.style.background=RIBC[col]||col;for(const e of[card,R]){e.style.animation='none';void e.offsetWidth;e.style.animation=''}   // replay the pop-in for every new card
  $('ovT').textContent=txt;const b2=$('ovB2');if(btn2){setBtn(b2,btn2);b2.onclick=fn2;b2.style.background='#fff';b2.classList.remove('hidden')}else b2.classList.add('hidden');
  const b=$('ovB');setBtn(b,btn);b.onclick=fn;b.style.background=col==='#e0382f'?'#5ed36a':'#ffd23f';$('ov').classList.remove('hidden');b.focus({preventScroll:true})}
/* ---- shop + abilities ---- */
function reroll(){if(S.st!==ST.PREP||S.evo)return;if(S.freeRR>0)S.freeRR--;else if(S.en>=BAL.shop.reroll)S.en-=BAL.shop.reroll;else{toast(STR.noEnergy);return}S.sel=null;S.rerolled++;rollShop()}
function bomb(){if(S.st!==ST.BATTLE)return;if(S.bcd>0||S.bomb){toast(STR.bombCd);Audio.snd('deny');return}if(S.en<BAL.bomb.cost){toast(STR.noEnergy);Audio.snd('deny');return}S.en-=BAL.bomb.cost;S.bcd=BAL.bomb.cd;S.bomb={x:BAL.wallX,id:S.t,dmg:BAL.bomb.base+S.wave*BAL.bomb.perWave};S.shake=.4;Audio.snd('bomb')}
function healWall(){if(S.st===ST.OVER||S.evo||S.hp>=BAL.wallHp)return;if(S.en<BAL.heal.cost){toast(STR.noEnergy);Audio.snd('deny');return}S.en-=BAL.heal.cost;S.hp=Math.min(BAL.wallHp,S.hp+BAL.heal.amt);ft(30,cellY(0),'+'+BAL.heal.amt,'#ff7aa8');burst(20,BAL.LH/2,'#ff9eb0',12);fxAnim('heal_pulse',30,BAL.LH/2,70);Audio.snd('heal')}
function rally(){if(S.st!==ST.BATTLE||S.rally<BAL.rally.max)return;S.rally=0;S.rallyT=BAL.rally.dur;ft(BAL.LW/2,100,'RALLY!','#f472b6');Audio.snd('rally')}
function hide(c){const u=U(c);if(!u||S.hideC<=0||u.hcd>0||u.hide>0)return false;u.hide=BAL.hide.dur+S.bf.hideDur;u.hcd=BAL.hide.ucd;S.hideC--;Mis.add('hide',1);stat('hides',1);burst(cx(c.q),cy(c.r),'#7dd3fc',8);Audio.snd('hide');return true}
function zapNear(){let z=null,zd=1e9;const x=cx(S.cur.q),y=cy(S.cur.r);for(const g of S.germs){if(g.hp<=0)continue;const d=Math.hypot(g.x-x,g.y-y);if(d<zd){zd=d;z=g}}if(z){G.kb=true;zapHit(z)}}   // keyboard zap: nearest germ to the cursor
function zap(p){const c=cellAt(p);if(c&&U(c)&&hide(c))return;let z=null,zd=18;for(const g of S.germs){if(g.hp<=0)continue;const d=Math.hypot(g.x-p.x,g.y-p.y)-g.r;if(d<zd){zd=d;z=g}}
  if(z)zapHit(z)}
function zapHit(z){Audio.snd('zap');const d=Math.round(BAL.zapBase+S.wave*BAL.zapPerWave);hurt(z,d);S.zaps++;S.rally=Math.min(BAL.rally.max,S.rally+BAL.rally.zap*(1+S.bf.rally));ft(z.x,z.y-12,'-'+d,'#ff7aa8');burst(z.x,z.y,'#fff',4)}
/* ---- battle ---- */
function startBattle(){
  if(S.st!==ST.PREP||S.evo)return;
  if(!units()){toast(STR.place);return}
  S.quick=S.prepT<=BAL.quick.sec;S.sel=null;drag=null;S.hideC=BAL.hide.charges+S.bf.hideCh;
  for(const row of S.grid)for(const u of row)if(u){u.fresh=false;u.hcd=0}
  let gaps=0;for(const ty of S.q)gaps+=BAL.germs[ty].gap||1;
  const D=(G.mode==='tut'&&S.wave===1)?22:Math.min(BAL.spawnSecMax,BAL.spawnSecBase+BAL.spawnSecPerWave*S.wave);S.si=D/gaps;S.qi=0;S.qt=.6;S.st=ST.BATTLE;S.banner=1.4;S.push=.5;S.gate=.6;syn();Audio.snd('horn');Music.mood(S.wave%BAL.bossEvery===0?'boss':'battle');Portal.setGameplay(true);$('go').classList.add('stamp');setTimeout(()=>$('go').classList.remove('stamp'),360);
}
function spawnG(ty,x,y,mini){const lane=0;
  const T=BAL.germs[ty],g=poolG.pop()||{},w=S.wave,hp=hpOf(w)*T.hp;
  if(!G.sim&&!T.hid&&!Save.d.cx.g[ty]){Save.d.cx.g[ty]=1;Save.d.dirty=1}g.id=S.gid++;g.x=x;g.prevX=x;g.lane=lane;g.dy=0;g.ang=(RB()-.5)*BAL.angSpread;g.y=y;g.ty=ty;g.r=T.r;g.hp=g.mhp=hp;g.sp=T.sp*(1+BAL.speedPerWave*(w-1)/10);g.dps=T.dps*(1+BAL.dpsGrow*(w-1));
  g.ph=RB()*6;g.bit=0;g.slow=0;g.mark=0;g.tk=0;g.bh=-1;g.at=T.boss?3:(ty===5?RB()*BAL.ab.medicCd:1);
  g.sh=T.shield?T.shield*hpOf(w):0;g.hpP=g.hp;g.ns=T.noSlow?1:0;g.mini=0;
  if(mini){const M=BAL.mini;g.mini=1;g.hp=g.mhp=hp*M.hp;g.sh*=M.hp;g.hpP=g.hp;g.r=T.r*M.r;g.dps*=M.dps;g.sp*=M.sp}
  S.germs.push(g);return g;
}
function spawn(){const ty=S.q[S.qi++];spawnG(ty,BAL.spawnX+RB()*40,BAL.roadY0+12+RB()*(BAL.roadY1-BAL.roadY0-24),S.miniQ&&S.qi===S.q.length)}
function shoot(x,y,vx,vy,a,dmg,u,T,sl){
  const b=poolB.pop()||{};b.x=x;b.y=y;b.vx=vx;b.vy=vy;b.a=a;b.dmg=dmg;b.big=!!DEF[u.type].ab.heavyShot;b.c=LVC[u.lvl-1];b.l=(T.range+u.lvl*14)/Math.hypot(vx,vy)+.3;
  b.type=u.type;b.level=u.lvl;b.pierce=u.pierce+(T.pierceBonus||0);b.ex=b.pierce?[]:null;b.slow=sl;b.mark=!!DEF[u.type].ab.marks;b.mk=u.mk;b.dead=false;S.bul.push(b);S.fl.push({x,y,l:.09,type:u.type,level:u.lvl,a});Audio.snd('f_'+u.type);
}
const fr=[];
const UL=[];
function fireOf(u,q,r,tg,gs){
  const T=TY[u.type],ux=cx(q),uy=cy(r),tilt=Math.atan2(tg.y-uy,tg.x-ux)*.3,A=Art.get(u.type,u.lvl),m=A?Art.muzzle(ux,uy,u,tilt,A):{x:ux+16,y:uy-2};
  const dmg=T.dmg*Math.pow(T.g,u.lvl-1)*evm(u,'dmg')*(1+S.bf.dmg);let sl=T.slow||(u.ev.includes('frost')?BAL.evo.frost.slow:0);if(sl)sl*=1+S.bf.slow;
  u.aim=Math.atan2(tg.y-uy,tg.x-ux);u.aimT=.45;
  if(DEF[u.type].attack==='chain'){
    const hit=[tg],pts=[m.x,m.y,tg.x,tg.y];let cur=tg;
    for(let k=0;k<T.chain+S.bf.chain;k++){let nb=null,bd=T.chainR;for(const g of gs){if(g.hp<=0||hit.includes(g))continue;const d=Math.hypot(g.x-cur.x,g.y-cur.y);if(d<bd){bd=d;nb=g}}if(!nb)break;hit.push(nb);pts.push(nb.x,nb.y);cur=nb}
    hit.forEach((g,k)=>{hurt(g,dmg*Math.pow(.8,k));g.bit=.08;if(sl)g.slow=sl;burst(g.x,g.y,'#fff3b0',3)});S.arcs.push({pts,l:.14});Audio.snd('f_'+u.type);return}
  const a=clamp(Math.atan2(tg.y-m.y,tg.x-m.x),-1.5708,1.5708),sp=T.spd;   // front half-circle: 180 degrees
  shoot(m.x,m.y,Math.cos(a)*sp,Math.sin(a)*sp,a,dmg,u,T,sl);
}
function healNear(m){const R2=BAL.ab.medicR,gs=S.germs;for(let i=0;i<gs.length;i++){const g=gs[i];if(g===m||g.hp>=g.mhp||Math.abs(g.x-m.x)>R2||Math.abs(g.y-m.y)>R2)continue;g.hp=Math.min(g.mhp,g.hp+g.mhp*BAL.ab.medicPct)}burst(m.x,m.y,'#2dd4bf',3)}
function blast(g){const R2=BAL.ab.blastR,d=BAL.ab.blastDmg+S.wave*BAL.ab.blastPerWave;burst(g.x,g.y,'#fb7185',16);fxAnim('bomb_explosion',g.x,g.y,BAL.ab.blastR*1.5);
  for(let r=0;r<BAL.rows;r++)for(let q=0;q<BAL.cols;q++){const u=S.grid[r][q];if(u&&u.hide<=0&&Math.hypot(cx(q)-g.x,cy(r)-g.y)<R2){u.hp-=d;ft(cx(q),cy(r)-20,'-'+Math.round(d),'#fb7185')}}}
function battle(dt){
  S.bt+=dt;if(G.mode==='tut'&&S.hp<30)S.hp=30;
  const GT=BAL.germs,gs=S.germs,AB=BAL.ab,WX=BAL.wallX,UR=BAL.unitR,gy0=cellY(0)-4,gy1=cellY(BAL.rows)+4,ry0=BAL.roadY0,ry1=BAL.roadY1;
  S.qt-=dt;while(S.qt<=0&&S.qi<S.q.length&&gs.length<BAL.maxGerms){const t=S.q[S.qi];spawn();S.qt+=S.si*(GT[t].gap||1)}if(S.qt<-1)S.qt=-1;   // a full field never builds a burst backlog
  S.bcd=Math.max(0,S.bcd-dt);S.rallyT=Math.max(0,S.rallyT-dt);
  let nu=0;for(let r=0;r<BAL.rows;r++)for(let q=0;q<BAL.cols;q++){const u=S.grid[r][q];if(u&&u.hide<=0&&u.hp>0){const o=UL[nu]||(UL[nu]={});o.u=u;o.x=cx(q);o.y=cy(r);o.tn=!!DEF[u.type].ab.taunt;nu++}}
  hashBuild(gs);
  for(let i=0;i<gs.length;i++){const g=gs[i],T=GT[g.ty];
    // Defenders are always ahead (to the left). A germ never reverses to chase one behind it.
    let tu=null,bd=1e9;
    for(let k=0;k<nu;k++){
      const o=UL[k];
      if(o.x>=g.x)continue;
      let d=Math.hypot(g.x-o.x,g.y-o.y);
      if(o.tn)d-=BAL.taunt.range;
      if(d<bd){bd=d;tu=o}
    }
    const wallStop=WX+g.r+2;
    const wallD=Math.max(0,g.x-wallStop);
    const atk=!!tu&&bd<=wallD;
    const spd=g.sp*BAL.speedMul*(g.slow>0?.5:1)*(G.mode==='tut'?.6:1);
    let ax,ay;
    if(atk){
      const standX=tu.x+UR+g.r+(T.range||0);
      ax=Math.max(wallStop,Math.min(g.x,standX));
      ay=clamp(tu.y+Math.sin(g.ang)*Math.min(UR,g.r*1.5),ry0+g.r,ry1-g.r);
    }else{
      ax=wallStop;
      ay=clamp(g.y,gy0,gy1);
    }
    const dx=ax-g.x,dy=ay-g.y,d=Math.hypot(dx,dy);
    let arrived=false;
    if(d>1.5){
      const st=Math.min(spd*dt,d);
      g.x=Math.max(ax,g.x-Math.max(0,-dx/d*st));
      g.y+=dy/d*st;
    }else arrived=true;
    g.x=Math.min(g.x,g.prevX===undefined?g.x:g.prevX);
    g.prevX=g.x;
    g.y=clamp(g.y+Math.sin(S.t*6+g.ph)*7*dt,ry0+g.r,ry1-g.r);
    g.slow-=dt;g.mark-=dt;g.bit-=dt;
    if(arrived){
      if(atk){if(T.range){g.at-=dt;if(g.at<=0){g.at=AB.spitCd;tu.u.hp-=g.dps*AB.spitMul;S.arcs.push({pts:[g.x,g.y,tu.x,tu.y],l:.18,c:'#84cc16'});fxAnim('acid_splash',tu.x,tu.y,26)}}else{g.bit=.1;tu.u.hp-=g.dps*dt}}
      else{g.bit=.1;S.wh=.15;S.hp-=g.dps*dt*BAL.wallMul;hurt(g,(BAL.thorn.base+BAL.thorn.perWave*S.wave)*(1+S.bf.thorn)*dt);Audio.snd('bite');S.shake=Math.max(S.shake,.15)}}
    if(g.ty===5){g.at-=dt;if(g.at<=0){g.at=AB.medicCd;healNear(g)}}
    else if(g.ty===8){g.at-=dt;if(g.at<=0){g.at=AB.cloudCd;const oc=[];for(let r=0;r<BAL.rows;r++)for(let q=0;q<BAL.cols;q++)if(S.grid[r][q])oc.push([q,r]);if(oc.length){const p=oc[Math.floor(RB()*oc.length)];S.cl.push({q:p[0],r:p[1],tt:AB.tele,at:AB.cloudDur});fxAnim('boss_smog_breath',cx(p[0]),cy(p[1]),64)}}}
    else if(g.ty===9){g.at-=dt;if(g.at<=0){g.at=AB.queenCd;if(gs.length<BAL.maxGerms-6){for(const t of[5,5,4,4])spawnG(t,g.x+RB()*24,clamp(g.y+(RB()-.5)*50,ry0+10,ry1-10));burst(g.x,g.y,'#c026d3',14);fxAnim('boss_queen_heart',g.x,g.y,76)}}}
    else if(g.ty===13){g.at-=dt;if(g.at<=0){g.at=AB.slamCd;const oc=[];for(let r=0;r<BAL.rows;r++)for(let q=0;q<BAL.cols;q++)if(S.grid[r][q])oc.push([q,r]);for(let k=0;k<AB.slamN&&oc.length;k++){const p=oc.splice(Math.floor(RB()*oc.length),1)[0],u=S.grid[p[1]][p[0]];u.dis=Math.max(u.dis,AB.slamDis);fxAnim('boss_amoeba_slam',cx(p[0]),cy(p[1]),62)}S.shake=Math.max(S.shake,.25);burst(g.x,g.y,'#a855f7',12)}}
  }
  for(const c of S.cl){if(c.tt>0)c.tt-=dt;else{c.at-=dt;const u=S.grid[c.r][c.q];if(u)u.dis=Math.max(u.dis,.15)}}
  let w=0;for(const c of S.cl)if(c.at>0)S.cl[w++]=c;S.cl.length=w;
  if(S.bomb){const b=S.bomb;b.x+=BAL.bomb.speed*dt;for(const g of gs)if(g.x<=b.x&&g.bh!==b.id&&g.hp>0){g.bh=b.id;hurt(g,b.dmg);g.slow=BAL.bomb.slow;g.bit=.1;burst(g.x,g.y,'#fff',3)}if(b.x>BAL.LW+30)S.bomb=null}
  for(let r=0;r<BAL.rows;r++)for(let q=0;q<BAL.cols;q++){const u=S.grid[r][q];if(!u)continue;
    if(G.mode==='tut'&&u.hp<2)u.hp=2;
    if(u.hpL!==undefined&&u.hp<u.hpL-.05)u.hitT=.14;u.hpL=u.hp;   // hit reaction (visual)
    if(u.hp<u.mhp*.5&&S.hideC>0&&!Save.d.tips.hide)tipCard('hide','Hide!','Tap a hurt bacteria to wrap it in biofilm. It cannot shoot, but nothing can hurt it.','#7dd3fc');
    if(u.hp<=0){S.lost++;S.gh[r][q]={type:u.type,lvl:u.lvl,ev:u.ev,cost:Math.ceil(u.paid*BAL.ghost.rebuild)};S.grid[r][q]=null;burst(cx(q),cy(r),LVC[u.lvl-1],16);if(!G.sim&&S.pf.length<12)S.pf.push({x:cx(q),y:cy(r),l:.5});syn();continue}
    u.hcd=Math.max(0,u.hcd-dt);u.rc=Math.max(0,u.rc-dt);u.pop=Math.max(0,u.pop-dt);u.aimT=Math.max(0,(u.aimT||0)-dt);
    if(u.hide>0){u.hide-=dt;continue}
    if(u.dis>0){u.dis-=dt;continue}
    const T=TY[u.type];
    if(DEF[u.type].attack==='support'){u.hc-=dt;if(u.hc<=0){u.hc=T.cd;u.af=S.t;Audio.snd('f_'+u.type);for(const[dq,dr]of NB){const n=S.grid[r+dr]&&S.grid[r+dr][q+dq];if(n&&n.hp<n.mhp){n.hp=Math.min(n.mhp,n.hp+T.healPct*(1+S.bf.healP)*n.mhp*(1+.3*(u.lvl-1)));burst(cx(q+dq),cy(r+dr),'#4ade80',3)}}S.hp=Math.min(BAL.wallHp,S.hp+T.wallHeal*u.lvl)}continue}
    u.cd-=dt;if(u.cd>0)continue;
    const ux=cx(q),uy=cy(r),rng=T.range+u.lvl*14,strong=DEF[u.type].ab.targets==='strongest';let tg=null,bs=1e9;
    for(let i=0;i<gs.length;i++){const g=gs[i],dx=g.x-ux;if(g.hp<=0||dx<-2||g.x>BAL.LW-4)continue;   // only the front half-plane (180 degrees)
      const dd=Math.hypot(dx,g.y-uy);if(dd>rng)continue;
      const pr=g.ty===5?1:0,sc=strong?-g.hp-pr*3e5:dd-pr*3e4;if(sc<bs){bs=sc;tg=g}}
    if(!tg)continue;
    fireOf(u,q,r,tg,gs);u.af=S.t;u.cd=T.cd/(u.rateM*evm(u,'rate')*(1+S.bf.rate)*(S.rallyT>0?1+BAL.rally.boost:1));u.rc=.1;
  }
  for(const b of S.bul){b.x+=b.vx*dt;b.y+=b.vy*dt;b.l-=dt;if(b.l<=0||b.x>BAL.LW+20||b.x<-20||b.y<-20||b.y>BAL.LH+20){b.dead=true;continue}
    const hx=(b.x/HC)|0,hy=(b.y/HC)|0;if(hx<0||hx>=HW||hy<0||hy>=HH)continue;
    scan:for(let yy=Math.max(0,hy-1);yy<=Math.min(HH-1,hy+1);yy++)for(let xx=Math.max(0,hx-1);xx<=Math.min(HW-1,hx+1);xx++)for(let j=head[yy*HW+xx];j>=0;j=nxt[j]){const g=gs[j];
      if(g.hp>0&&Math.abs(g.x-b.x)<g.r+5&&Math.abs(g.y-b.y)<g.r+5&&!(b.ex&&b.ex.includes(g.id))){
        hurt(g,b.dmg*(b.mk&&g.mark>0?1+BAL.mark.bonus+S.bf.mark:1));g.bit=.08;if(b.slow)g.slow=b.slow;if(b.mark)g.mark=BAL.mark.sec;burst(b.x,b.y,b.c,2);impactAt(b);
        if(b.pierce>0){b.pierce--;b.ex.push(g.id)}else b.dead=true;break scan}}}
  w=0;for(const b of S.bul){if(!b.dead)S.bul[w++]=b;else poolB.push(b)}S.bul.length=w;
  for(let i=0;i<gs.length;i++){const g=gs[i];   // shield absorbs this step's damage; one pass covers bullets, Spark, zap, Bomb and thorns
    if(g.sh>0){const d=g.hpP-g.hp;if(d>0){const a=d<g.sh?d:g.sh;g.sh-=a;g.hp+=a;if(g.sh<=0)burst(g.x,g.y,'#7dd3fc',6)}g.hpP=g.hp}
    if(g.ns)g.slow=0}
  w=0;for(const g of gs){if(g.hp>0)gs[w++]=g;else{S.kills++;Mis.add('kill',1);if(GT[g.ty].boss)stat('bosses',1);S.en+=BAL.killEnergy*(1+S.bf.energy);S.rally=Math.min(BAL.rally.max,S.rally+BAL.rally.kill*(1+S.bf.rally));Audio.snd('pop');burst(g.x,g.y,GT[g.ty].c,GT[g.ty].boss?24:(g.r<4?2:5));fxAnim('germ_pop_small',g.x,g.y,Math.max(16,g.r*2.8));if(!G.sim)splat(g);if(g.ty===6)blast(g);if(GT[g.ty].split){fxAnim('splitter_split',g.x,g.y,Math.max(30,g.r*3.6));SPQ.push(g.x,g.y,GT[g.ty].kid)}if(GT[g.ty].boss)fxAnim(({3:'boss_staph_spore',8:'boss_smog_breath',9:'boss_queen_heart',13:'boss_amoeba_slam'})[g.ty]||'bomb_explosion',g.x,g.y,96);if(g.mini){S.en+=BAL.mini.reward;burst(g.x,g.y,'#ffd23f',18);fxAnim('gold_sparkle',g.x,g.y,48)}poolG.push(g)}}gs.length=w;
  for(let i=0;i<SPQ.length;i+=3)for(let k=0;k<2;k++)if(gs.length<BAL.maxGerms)spawnG(SPQ[i+2],Math.max(BAL.wallX+10,SPQ[i]+(k?7:-7)),clamp(SPQ[i+1]+(k?8:-8),BAL.roadY0+6,BAL.roadY1-6));SPQ.length=0;
  if(S.hp<=0){loseRun();return}
  if(G.mode==='tut'&&Tut.i>=4&&Tut.i<7&&gs.length<3)spawnG(0,BAL.spawnX,BAL.roadY0+20+RB()*(BAL.roadY1-BAL.roadY0-40));   // keep targets alive while the abilities are being taught
  if(S.qi>=S.q.length&&!gs.length&&G.mode!=='prac'&&!(G.mode==='tut'&&Tut.i>=0&&Tut.i<7)){
    const bonus=Math.round((BAL.clearBase+BAL.clearPerWave*S.wave)*(S.quick?1+BAL.quick.frac:1)*(1+S.bf.energy));S.en+=bonus;S.st=ST.RESULT;S.bomb=null;S.rallyT=0;winUI(bonus)}
}
function step(dt){
  if(G.god&&S){S.hp=BAL.wallHp;for(const row of S.grid)for(const u of row)if(u)u.hp=u.mhp}   // debug god mode (only reachable with ?debug=1)

  if(G.mode==='prac'){S.hp=BAL.wallHp;S.en=9999}
  S.t+=dt;S.shake=Math.max(0,S.shake-dt);S.banner=Math.max(0,S.banner-dt);fx(dt);
  if(S.st===ST.PREP){S.prepT+=dt;S.idle+=dt;if(S.idle>BAL.idle.after)S.en+=BAL.idle.rate*dt}
  else if(S.st===ST.BATTLE)battle(dt);
  if(S.st!==ST.BATTLE&&S.bul.length){for(const b of S.bul)poolB.push(b);S.bul.length=0}   // bullets never outlive a battle (they used to freeze on the prep screen)
  for(const p of S.pa){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=260*dt;p.l-=dt}let w=0;for(const p of S.pa)if(p.l>0)S.pa[w++]=p;S.pa.length=w;
  for(const f of S.ft){f.y-=30*dt;f.l-=dt}w=0;for(const f of S.ft)if(f.l>0)S.ft[w++]=f;S.ft.length=w;
  for(const a of S.arcs)a.l-=dt;w=0;for(const a of S.arcs)if(a.l>0)S.arcs[w++]=a;S.arcs.length=w;
}
/* ---- field: baked once per theme at the canvas resolution (navy outlines, two-tone shading) ---- */
let field=null,cellsL=null;
/* ---- path alignment: the painted sand path of every background is stretched to exactly
   cover the deployment rows (roadY0..roadY1), so bacteria and germs always stand ON the path ---- */
const BG_LANE_DEFAULT=[.27,.68];   // fallback: fraction of the image height where the sand path starts/ends
const _laneCache=new Map();
function bgLane(img){
  if(_laneCache.has(img))return _laneCache.get(img);
  let res=BG_LANE_DEFAULT;
  try{
    const W=160,H=Math.max(40,Math.round(W*(img.naturalHeight||img.height)/(img.naturalWidth||img.width))),c=document.createElement('canvas');c.width=W;c.height=H;
    const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0,W,H);
    const x0=Math.round(W*.62),cols=Math.round(W*.28),px=g.getImageData(x0,0,cols,H).data;   // right of the board: only path + walls
    const row=y=>{let r=0,gg=0,b=0;for(let x=0;x<cols;x++){const i=(y*cols+x)*4;r+=px[i];gg+=px[i+1];b+=px[i+2]}return[r/cols,gg/cols,b/cols]};
    const far=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])>70,mid=Math.round(H*.5),base=row(mid);
    let t=mid,bt=mid,miss=0;while(t>0){if(far(row(t-1),base)){if(++miss>=2)break}else{miss=0;bt=t-1}t--}
    let u=mid,bb=mid;miss=0;while(u<H-1){if(far(row(u+1),base)){if(++miss>=2)break}else{miss=0;bb=u+1}u++}
    const a=bt/H,b=(bb+1)/H;if(b-a>.18&&b-a<.75&&a>.05&&b<.95)res=[a,b];
  }catch(e){}   // tainted canvas (file://) or odd art: keep the default
  _laneCache.set(img,res);return res;
}
function drawWorld(g,img,theme,LW,LH){
  const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,[a,b]=bgLane(img),sy0=a*ih,sy1=b*ih,dy0=BAL.roadY0,dy1=BAL.roadY1;
  g.clearRect(0,0,LW,LH);
  g.drawImage(img,0,0,iw,sy0,0,0,LW,dy0);                         // top scenery, squeezed above the path
  g.drawImage(img,0,sy0,iw,sy1-sy0,0,dy0,LW,dy1-dy0);             // the path, stretched over every grid row
  g.drawImage(img,0,sy1,iw,ih-sy1,0,dy1,LW,LH-dy1);               // bottom scenery
}
function bake(){
  const TH=THEMES[G.theme||'meadow']||THEMES.meadow,LW=BAL.LW,LH=BAL.LH,y0=BAL.roadY0,y1=BAL.roadY1,sc=G.bk||2;
  const mkc=()=>{const c=document.createElement('canvas');c.width=LW*sc;c.height=LH*sc;const g=c.getContext('2d');g.scale(sc,sc);g.lineJoin='round';g.lineCap='round';return[c,g]};
  const[c,g]=mkc();let sd=7;const rn=()=>(sd=sd*16807%2147483647)/2147483647;
  g.fillStyle=TH.g;g.fillRect(0,0,LW,LH);
  for(let i=0;i<70;i++){g.fillStyle=rn()<.5?TH.g2:TH.g3;g.beginPath();g.ellipse(rn()*LW,rn()*LH,10+rn()*22,5+rn()*10,0,0,6.3);g.fill()}
  g.strokeStyle=shade(TH.g3,-.12);g.lineWidth=1.4;g.beginPath();for(let i=0;i<64;i++){const x=rn()*LW,y=rn()<.5?10+rn()*(y0-28):y1+20+rn()*(LH-y1-26);g.moveTo(x-3,y);g.lineTo(x-1.6,y-4);g.moveTo(x,y);g.lineTo(x+.4,y-5.5);g.moveTo(x+3,y);g.lineTo(x+3.6,y-3.6)}g.stroke();   // grass tufts
  g.fillStyle=TH.rd;g.fillRect(0,y0,LW,y1-y0);g.fillStyle=TH.sp;for(let i=0;i<150;i++)g.fillRect(rn()*LW,y0+4+rn()*(y1-y0-8),2+rn()*3,2);
  for(let i=0;i<24;i++){const x=rn()*LW,y=y0+14+rn()*(y1-y0-28),r=1.4+rn()*2.4;g.beginPath();g.ellipse(x,y,r*1.4,r,0,0,6.3);g.fillStyle=TH.sp;g.fill();g.lineWidth=1;g.strokeStyle='rgba(22,33,62,.3)';g.stroke()}   // pebbles
  g.fillStyle='rgba(22,33,62,.15)';g.fillRect(0,y0,LW,7);g.fillStyle='rgba(255,255,255,.18)';g.fillRect(0,y1-4,LW,4);   // fence shadow + lit lower edge
  const rail=y=>{g.fillStyle=TH.f1;g.fillRect(0,y,LW,6);g.fillStyle=TH.f2;g.fillRect(0,y,LW,2);g.fillStyle=K;g.fillRect(0,y-1,LW,1.2);g.fillRect(0,y+6,LW,1.2)};
  rail(y0-7);rail(y1+1);
  for(let x=6;x<LW;x+=16)for(const yy of[y0-13,y1-1]){g.beginPath();g.roundRect(x,yy,4.5,13,1.6);g.fillStyle=TH.f3;g.fill();g.lineWidth=1.3;g.strokeStyle=K;g.stroke()}
  const bush=(x,y,s)=>{g.fillStyle='rgba(22,33,62,.2)';g.beginPath();g.ellipse(x+2,y+s*.55,s*.95,s*.3,0,0,6.3);g.fill();
    const C=[[x-s*.4,y,s*.6],[x+s*.4,y,s*.6],[x,y-s*.25,s*.7]];g.beginPath();for(const[a,b,r]of C){g.moveTo(a+r,b);g.arc(a,b,r,0,6.3)}g.lineWidth=3;g.strokeStyle=K;g.stroke();g.fillStyle=TH.t1;g.fill();
    g.fillStyle=TH.t2;g.beginPath();g.arc(x,y-s*.25,s*.7,0,6.3);g.fill();g.fillStyle=TH.t3;g.beginPath();g.arc(x-s*.2,y-s*.45,s*.25,0,6.3);g.fill()};
  const tree=(x,y,s)=>{g.fillStyle='rgba(22,33,62,.22)';g.beginPath();g.ellipse(x+s*.15,y+s*.05,s*.6,s*.2,0,0,6.3);g.fill();
    g.beginPath();g.rect(x-s*.08,y-s*.3,s*.16,s*.32);g.fillStyle=TH.f1;g.fill();g.lineWidth=2;g.strokeStyle=K;g.stroke();
    for(let k=0;k<3;k++){const w=s*(.62-k*.13),b=y-s*(.18+k*.4),t=b-s*.62;g.beginPath();g.moveTo(x,t);g.lineTo(x+w,b);g.lineTo(x-w,b);g.closePath();g.lineWidth=8.4;g.strokeStyle=K;g.stroke();g.fillStyle=TH.t1;g.strokeStyle=TH.t1;g.lineWidth=5;g.fill();g.stroke();
      g.fillStyle=TH.t4;g.beginPath();g.moveTo(x,t+2);g.lineTo(x+w-2,b-1);g.lineTo(x,b-1);g.closePath();g.fill();g.fillStyle=TH.t3;g.beginPath();g.arc(x-w*.3,b-s*.16,s*.05,0,6.3);g.fill()}};
  [[58,y0-14,24],[176,y0-12,20],[318,y0-14,26],[452,y0-12,22],[560,y0-14,26],[620,y0-12,18]].forEach(a=>tree(...a));[[110,y0-14,8],[250,y0-12,9],[390,y0-14,8],[510,y0-12,8]].forEach(a=>bush(...a));
  [[40,LH-8,28],[150,LH-6,22],[290,LH-8,30],[420,LH-6,24],[540,LH-8,28],[612,LH-6,20]].forEach(a=>tree(...a));[[96,LH-10,9],[220,LH-8,9],[360,LH-10,8],[480,LH-8,9]].forEach(a=>bush(...a));
  const vg=g.createRadialGradient(LW/2,LH/2,LH*.4,LW/2,LH/2,LW*.66);vg.addColorStop(0,'rgba(22,33,62,0)');vg.addColorStop(1,'rgba(22,33,62,.22)');g.fillStyle=vg;g.fillRect(0,0,LW,LH);   // soft vignette pulls the eye to the road
  const world=FieldArt.get(G.theme||'meadow');if(world)drawWorld(g,world,G.theme||'meadow',LW,LH);
  field=c;
  const[c2,g2]=mkc(),gx=cellX(0),gy=cellY(0),gw=BAL.cols*BAL.cell,gh=BAL.rows*BAL.laneH;
  g2.fillStyle='rgba(22,33,62,.25)';g2.beginPath();g2.roundRect(gx-3,gy+2,gw+6,gh+6,10);g2.fill();g2.fillStyle=K;g2.beginPath();g2.roundRect(gx-3,gy-3,gw+6,gh+6,10);g2.fill();   // the deployment board
  for(let r=0;r<BAL.rows;r++)for(let q=0;q<BAL.cols;q++){const x=cellX(q),y=cellY(r),c0=(r+q)%2?TH.c1:TH.c2;
    g2.fillStyle=shade(c0,-.14);g2.beginPath();g2.roundRect(x+1.5,y+1.5,BAL.cell-3,BAL.cell-3,6);g2.fill();
    g2.fillStyle=c0;g2.beginPath();g2.roundRect(x+1.5,y+1.5,BAL.cell-3,BAL.cell-7,6);g2.fill();
    g2.fillStyle='rgba(255,255,255,.3)';g2.beginPath();g2.roundRect(x+6,y+4.5,BAL.cell-12,2.4,1.2);g2.fill()}
  cellsL=c2;
}
/* ---- drawing ---- */
const rr=(x,y,w,h,r)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r)};
function pedPath(sh,px,py,rx,ry){ctx.beginPath();if(sh==='diamond'){ctx.moveTo(px,py-ry);ctx.lineTo(px+rx,py);ctx.lineTo(px,py+ry);ctx.lineTo(px-rx,py);ctx.closePath()}
  else if(sh==='square')ctx.roundRect(px-rx,py-ry,rx*2,ry*2,4);else if(sh==='hex'){for(let i=0;i<6;i++){const a=i/6*6.283;ctx.lineTo(px+Math.cos(a)*rx,py+Math.sin(a)*ry)}ctx.closePath()}else ctx.ellipse(px,py,rx,ry,0,0,6.283)}
function pedestal(px,py,rx,ry,type,col){const sh=DEF[type]?DEF[type].art.pedestal:'round';
  pedPath(sh,px+3,py+3,rx,ry);ctx.fillStyle=K;ctx.fill();                       // hard shadow
  pedPath(sh,px,py,rx,ry);ctx.fillStyle=shade(col,-.25);ctx.fill();             // dark rim
  pedPath(sh,px,py-ry*.2,rx*.84,ry*.7);ctx.fillStyle=col;ctx.fill();            // lit top
  pedPath(sh,px,py,rx,ry);ctx.lineWidth=3;ctx.lineJoin='round';ctx.strokeStyle=K;ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.ellipse(px-rx*.38,py-ry*.4,rx*.2,ry*.15,0,0,6.283);ctx.fill()}   // gloss
function animFrame(u,A){const an=Art.an[u.type];if(!an)return A;const ti=A.ti|0,pick=st=>{const L=st.tiers[ti]||st.tiers[0];return L&&L.length?L:null};
  if(an.attack&&u.af!=null&&S){const L=pick(an.attack);if(L){const k=((S.t-u.af)*an.attack.fps)|0;if(k>=0&&k<L.length&&L[k])return L[k]}}
  if(an.hurt&&u.hitT>0){const L=pick(an.hurt);if(L){const k=(((.14-u.hitT)*an.hurt.fps)|0)%L.length;if(L[k])return L[k]}}
  if(an.idle&&S){const L=pick(an.idle);if(L){const k=(((S.t+(u.lvl*.37))*an.idle.fps)|0)%L.length;if(L[k])return L[k]}}
  return A}   // optional roster animation frames (idle loops, attack / hurt play once); falls back to the static tier sprite
function placeholder(x,y,r,type){const T=TY[type],c=T?T.col:'#cbd5e1',s=r*1.15;   // missing art: a clearly marked token in the bacterium's own colour, never another sprite
  ctx.fillStyle=K;rr(x-s+2,y-s*1.15+3,s*2,s*2.2,s*.55);ctx.fill();ctx.fillStyle=c;rr(x-s,y-s*1.15,s*2,s*2.2,s*.55);ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle=K;ctx.stroke();
  ctx.setLineDash([3,3]);ctx.lineWidth=1.5;ctx.strokeStyle='#ffffffcc';rr(x-s*.68,y-s*.82,s*1.36,s*1.54,s*.36);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle=K;ctx.font=`700 ${s*1.05}px 'BD Grotesk',system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(T?T.L:'?',x,y)}
function badge(x,y,r,fill,txt){ctx.beginPath();ctx.arc(x,y,r,0,6.3);ctx.fillStyle=fill;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=K;ctx.stroke();ctx.fillStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.arc(x-r*.35,y-r*.4,r*.28,0,6.3);ctx.fill();
  ctx.fillStyle=K;ctx.font=`700 ${r*1.22}px 'BD Grotesk',system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,x,y+1)}
const ROLECHIP={shooter:'shooter',sniper:'sniper',tank:'tank','chain caster':'mage',support:'healer',slower:'support',piercer:'assassin'};
function badgeImg(x,y,r,im,txt,fill){ctx.drawImage(im,x-r*1.12,y-r*1.12,r*2.24,r*2.24);ctx.font=`700 ${r*1.2}px 'BD Grotesk',system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=2.6;ctx.strokeStyle=K;ctx.strokeText(txt,x,y+1);ctx.fillStyle=fill;ctx.fillText(txt,x,y+1)}
function drawUnit(x,y,u,sc,al){
  const R=BAL.R,r=R*.7*sc,col=LVC[u.lvl-1],D=DEF[u.type],A=Art.get(u.type,u.lvl),as=D?D.art.scale:1,T=TY[u.type]||{col:'#cbd5e1',L:'?'};
  ctx.save();ctx.globalAlpha=al||1;
  const pk=u.pop>0?Math.sin(u.pop/.3*Math.PI):0,rec=u.rc>0?u.rc/.1:0,br=Math.sin(S.t*2.8+u.lvl+x*.031)*.03,hit=u.hitT>0?u.hitT/.14:0;
  const f=A?(R*1.75*sc*Art.K*as)/A.w:1,hh=A?A.h*f/2:r,ry=R*.34*sc,rx=R*sc,py=y-r*.1+hh+ry*.45;
  // pedestal removed: characters stand directly on the path (badges below keep level + type visible)
  if(A){const F=animFrame(u,A),k=F===A?f:(R*1.75*sc*Art.K*as)/F.w,jx=hit&&!RM?(Math.random()-.5)*2.4*sc:0;
    ctx.save();ctx.translate(x-rec*3*sc+jx,y-r*.1+hh);ctx.rotate(u.aimT>0?clamp(u.aim,-1.5,1.5)*.3:0);ctx.scale(1+br+pk*.12-rec*.06,1-br-pk*.1+rec*.05);
    const W=F.c.width*k,H=F.c.height*k,ox=-W/2,oy=-(F.c.height-F.P)*k;ctx.drawImage(F.c,ox,oy,W,H);
    if(hit){ctx.globalAlpha=(al||1)*hit*.8;ctx.drawImage(F.fl,ox+F.P*k,oy+F.P*k,F.w*k,F.h*k)}   // white hit flash
    ctx.restore()}
  else placeholder(x,y,r,u.type);
  if(u.lvl%2===0){const oa=S.t*1.8;for(let k=0;k<2;k++){const a=oa+k*Math.PI;ctx.beginPath();ctx.arc(x+Math.cos(a)*R*.9*sc,y+Math.sin(a)*R*.45*sc-r*.2,2.6*sc,0,6.3);ctx.fillStyle='#ffd23f';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=K;ctx.stroke()}}
  const by=py-ry*.1,bR=r*.52;{const li=UIKit.img['ui_badge_level_'+u.lvl],ci=UIKit.img['ui_chip_type_'+(ROLECHIP[String(D&&D.role||'').toLowerCase()]||'shooter')];
   if(li)badgeImg(x-rx*.82,by,bR,li,u.lvl,'#fff');else badge(x-rx*.82,by,bR,'#fff',u.lvl);
   if(ci)badgeImg(x+rx*.82,by,bR,ci,T.L,'#fff');else badge(x+rx*.82,by,bR,T.col,T.L)}
  if(u.ev&&u.ev.length){ctx.fillStyle='#ffd23f';rr(x-5,py+ry*.25,11,10,3);ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=K;ctx.stroke();ctx.fillStyle=K;ctx.font=`700 8px 'BD Grotesk',system-ui`;ctx.textAlign='center';ctx.fillText(u.ev[u.ev.length-1]==='rapid'?'R':'F',x+.5,py+ry*.25+5.5)}
  if(u.hide>0){ctx.beginPath();ctx.arc(x,y,R*(1.05+Math.sin(S.t*12)*.04),0,6.3);ctx.fillStyle='rgba(125,211,252,.38)';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=K;ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.beginPath();ctx.arc(x,y,R*.82,3.5,4.6);ctx.stroke()}
  if(u.dis>0){ctx.fillStyle='rgba(101,163,13,.5)';ctx.beginPath();ctx.arc(x,y,R*1.05,0,6.3);ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=K;ctx.stroke()}
  ctx.restore();
  if(u.hp<u.mhp&&u.mhp>1){const w=32,hx=x-w/2,hy=y+R*1.15+4,p=clamp(u.hp/u.mhp,0,1);ctx.fillStyle=K;rr(hx-1.5,hy-1.5,w+3,8,4);ctx.fill();ctx.fillStyle='#fff';rr(hx,hy,w,5,2.5);ctx.fill();
    if(p>0){ctx.fillStyle=p>.5?'#5ed36a':p>.25?'#ffd23f':'#ff5a6e';rr(hx,hy,Math.max(3,w*p),5,2.5);ctx.fill();ctx.fillStyle='rgba(255,255,255,.45)';ctx.fillRect(hx+2,hy+1,Math.max(0,w*p-4),1.3)}}
}
const MN=[],laneOf=g=>clamp(((g.y-BAL.roadY0)/((BAL.roadY1-BAL.roadY0)/BAL.rows))|0,0,BAL.rows-1);
function gpath(g,k){const s=k||1;if(BAL.germs[g.ty].split){const r=g.r*.68*s,o=g.r*.45;ctx.moveTo(g.x-o+r,g.y);ctx.arc(g.x-o,g.y,r,0,6.283);ctx.moveTo(g.x+o+r,g.y);ctx.arc(g.x+o,g.y,r,0,6.283)}else{const r=g.r*s;ctx.moveTo(g.x+r,g.y);ctx.arc(g.x,g.y,r,0,6.283)}}   // Splitter is a two-lobed peanut
function gpathIn(g,k){const s=(k||1)*.82,dx=-g.r*.12,dy=-g.r*.15;if(BAL.germs[g.ty].split){const r=g.r*.68*s,o=g.r*.45;ctx.moveTo(g.x-o+dx+r,g.y+dy);ctx.arc(g.x-o+dx,g.y+dy,r,0,6.283);ctx.moveTo(g.x+o+dx+r,g.y+dy);ctx.arc(g.x+o+dx,g.y+dy,r,0,6.283)}else{const r=g.r*s;ctx.moveTo(g.x+dx+r,g.y+dy);ctx.arc(g.x+dx,g.y+dy,r,0,6.283)}}   // lit face: leaves a dark crescent bottom-right (cel shading)
function drawGermsAndFx(){
  const gs=S.germs,GT=BAL.germs,hq=G.q===0;MN.length=BAL.rows;MN.fill(1e9);for(const g of gs){const l=laneOf(g);if(g.x<MN[l])MN[l]=g.x}
  ctx.lineJoin='round';
  const germSize=(g,T)=>T.boss?clamp(g.r*3.4,60,76):(g.ty===7||g.ty===12?clamp(g.r*4.1,20,30):clamp(g.r*4.2,28,48));
  const germRadius=g=>g.drawR||g.r;
  for(const g of gs){
    const T=GT[g.ty],art=GermArt.get(g.ty,S.wave),size=art?germSize(g,T):0;
    g.drawArt=!!art;g.drawR=art?size*.5:g.r;
    ctx.save();
    if(art){
      const x=g.x-size/2,y=g.y-size/2;
      ctx.fillStyle='rgba(22,33,62,.24)';ctx.beginPath();ctx.ellipse(g.x,g.y+size*.34,size*.32,size*.095,0,0,6.283);ctx.fill();
      ctx.globalAlpha=g.bit>0?.88:1;
      ctx.drawImage(g.slow>0?GermArt.getSlow(g.ty,S.wave):art,x,y,size,size);
      if(g.bit>0){const flash=GermArt.getFlash(g.ty,S.wave);if(flash)ctx.drawImage(flash,x,y,size,size)}
      ctx.globalAlpha=1;
      if(g.slow>0){ctx.beginPath();ctx.arc(g.x,g.y,size*.49,0,6.283);ctx.lineWidth=2;ctx.strokeStyle='#bfeaff';ctx.stroke()}
    }else{
      const fl=g.bit>0,c=fl?'#fff':(g.slow>0?'#9fe0ff':T.c);
      ctx.beginPath();gpath(g,fl?1.08:1);ctx.fillStyle=fl?'#fff':shade(c,-.28);ctx.fill();ctx.lineWidth=T.boss?2.8:1.8;ctx.strokeStyle=K;ctx.stroke();
      if(!fl){ctx.beginPath();gpathIn(g);ctx.fillStyle=c;ctx.fill()}
    }
    if(T.boss){
      const bw=48,bh=6,bx=g.x-bw/2,by=g.y-(art?size*.5:g.r)-11,p=clamp(g.hp/g.mhp,0,1);
      ctx.fillStyle=K;rr(bx-1.5,by-1.5,bw+3,bh+3,4);ctx.fill();ctx.fillStyle='#fff';rr(bx,by,bw,bh,3);ctx.fill();
      if(p>0){ctx.fillStyle='#a45bff';rr(bx,by,Math.max(3,bw*p),bh,3);ctx.fill()}
    }
    ctx.restore();
  }
  if(hq){ctx.beginPath();for(const g of gs)if(!g.drawArt&&g.r>=5){const x=g.x-g.r*.4,y=g.y-g.r*.45,q=g.r*.2;ctx.moveTo(x+q,y);ctx.arc(x,y,q,0,6.283)}ctx.fillStyle='rgba(255,255,255,.62)';ctx.fill()}   // glossy highlight
  ctx.beginPath();for(const g of gs)if(!g.drawArt&&g.r>=6){const e=g.r*.24,ex=g.r*.3,ey=g.y-g.r*.1;ctx.moveTo(g.x-ex+e,ey);ctx.arc(g.x-ex,ey,e,0,6.283);ctx.moveTo(g.x+ex*.7+e,ey);ctx.arc(g.x+ex*.7,ey,e,0,6.283)}
  ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=1;ctx.strokeStyle=K;ctx.stroke();
  if(G.q<2){ctx.beginPath();for(const g of gs)if(!g.drawArt&&g.r>=6){const p=g.r*.12,ex=g.r*.3,ey=g.y-g.r*.08;ctx.moveTo(g.x-ex-p*.5+p,ey);ctx.arc(g.x-ex-p*.5,ey,p,0,6.283);ctx.moveTo(g.x+ex*.7-p*.5+p,ey);ctx.arc(g.x+ex*.7-p*.5,ey,p,0,6.283)}ctx.fillStyle=K;ctx.fill()}   // pupils look at the Wall
  ctx.strokeStyle=K;ctx.lineWidth=2.4;ctx.beginPath();for(const g of gs)if(GT[g.ty].boss&&!g.drawArt){const ex=g.r*.3,ey=g.y-g.r*.42;ctx.moveTo(g.x-ex-g.r*.26,ey-g.r*.1);ctx.lineTo(g.x-ex+g.r*.2,ey+g.r*.06);ctx.moveTo(g.x+ex*.7+g.r*.24,ey-g.r*.1);ctx.lineTo(g.x+ex*.7-g.r*.2,ey+g.r*.06)}ctx.stroke();   // angry boss brows
  ctx.lineWidth=1.6;ctx.beginPath();for(const g of gs)if(g.ty===11){const r=germRadius(g);ctx.moveTo(g.x,g.y-r*.5);ctx.lineTo(g.x,g.y+r*.5)}ctx.stroke();   // Splitter seam
  let sh=false;ctx.beginPath();for(const g of gs)if(g.sh>0){const r=germRadius(g)+3;ctx.moveTo(g.x+r,g.y);ctx.arc(g.x,g.y,r,0,6.283);sh=true}   // Shielded: cyan ring while the shield holds
  if(sh){ctx.strokeStyle=K;ctx.lineWidth=4.6;ctx.stroke();ctx.strokeStyle='#bae6fd';ctx.lineWidth=2.4;ctx.stroke()}
  ctx.strokeStyle='#ffd23f';ctx.lineWidth=2.6;ctx.beginPath();let mn=false;for(const g of gs)if(g.mini){const r=germRadius(g)+5;ctx.moveTo(g.x+r,g.y);ctx.arc(g.x,g.y,r,0,6.283);mn=true}if(mn)ctx.stroke();
  for(const g of gs)if(g.mini){const bw=38,bx=g.x-bw/2,by=g.y-germRadius(g)-14,p=clamp(g.hp/g.mhp,0,1);const eF=UIKit.img.ui_hud_enemy_bar_frame,eR=UIKit.img.ui_hud_enemy_bar_fill_red;if(eF){ctx.fillStyle='#3a1520';rr(bx,by,bw,6,3);ctx.fill();if(p>0){if(eR&&eR.width/eR.height>2)ctx.drawImage(eR,0,0,eR.width*p,eR.height,bx,by,Math.max(3,bw*p),6);else{ctx.fillStyle='#ff5a6e';rr(bx,by,Math.max(3,bw*p),6,3);ctx.fill()}}ctx.drawImage(eF,bx-3,by-3.5,bw+6,13)}else{ctx.fillStyle=K;rr(bx-1.5,by-1.5,bw+3,9,4.5);ctx.fill();ctx.fillStyle='#fff';rr(bx,by,bw,6,3);ctx.fill();if(p>0){ctx.fillStyle='#ff5a6e';rr(bx,by,Math.max(3,bw*p),6,3);ctx.fill()}}
    if(g.sh>0){ctx.fillStyle='#7dd3fc';ctx.fillRect(bx+1,by+1,(bw-2)*clamp(g.sh/(g.mhp*BAL.germs[g.ty].shield/BAL.germs[g.ty].hp),0,1),2)}}   // mini-boss health bar
  ctx.strokeStyle='#fff';ctx.lineWidth=1.8;ctx.beginPath();for(const g of gs)if(g.ty===5){ctx.moveTo(g.x-3,g.y+3);ctx.lineTo(g.x+3,g.y+3);ctx.moveTo(g.x,g.y);ctx.lineTo(g.x,g.y+6)}ctx.stroke();
  if(G.q<1){ctx.strokeStyle=K;ctx.lineWidth=2;ctx.beginPath();for(const g of gs){const r=germRadius(g)+1;if(r>=5&&g.x<MN[laneOf(g)]+26){ctx.moveTo(g.x+r,g.y);ctx.arc(g.x,g.y,r,0,6.283)}}ctx.stroke()}
  ctx.strokeStyle='#f472b6';ctx.lineWidth=1.8;ctx.beginPath();for(const g of gs)if(g.mark>0){const r=germRadius(g)+3;ctx.moveTo(g.x+r,g.y);ctx.arc(g.x,g.y,r,0,6.283)}ctx.stroke();
  for(const c of S.cl){const x=cx(c.q),y=cy(c.r);if(c.tt>0){ctx.setLineDash([4,3]);ctx.lineWidth=3;ctx.strokeStyle='#65a30d';ctx.beginPath();ctx.arc(x,y,24,0,6.3);ctx.stroke();ctx.setLineDash([]);ctx.font=`700 16px 'BD Grotesk',system-ui`;ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle=K;ctx.strokeText('!',x,y-26);ctx.fillStyle='#d9f99d';ctx.fillText('!',x,y-26)}
    else{ctx.fillStyle='rgba(132,204,22,.4)';for(let k=0;k<3;k++){ctx.beginPath();ctx.arc(x+Math.cos(S.t*3+k*2.1)*8,y+Math.sin(S.t*3+k*2.1)*6,14,0,6.3);ctx.fill()}}}
  ctx.lineCap='round';
  for(const b of S.bul){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.a);
    let sprite=WeaponArt.get(b.type,b.level,'projectile');
    if(sprite){const z=b.big?26:20,alt=ImpactArt.alt(b.type,b.level),tr=ImpactArt.trail(b.type,b.level);if(alt&&((S.t*10+b.x*.05)|0)%2)sprite=alt;ctx.globalAlpha=Math.min(1,b.l*7);if(tr&&!RM){ctx.globalAlpha*=.55;ctx.drawImage(tr,-z*1.9,-z*.45,z*1.1,z*.9);ctx.globalAlpha=Math.min(1,b.l*7)}ctx.drawImage(sprite,-z/2,-z/2,z,z);ctx.restore();continue}   // fades out at max range instead of hanging in mid-air
    const L=b.big?9:5.5,w=b.big?6.5:5;   // capsule bullets with a fading trail
    ctx.globalAlpha=.35;ctx.strokeStyle=b.c;ctx.lineWidth=w*.7;ctx.beginPath();ctx.moveTo(-L-20,0);ctx.lineTo(-L,0);ctx.stroke();ctx.globalAlpha=1;
    ctx.beginPath();ctx.moveTo(-L,0);ctx.lineTo(L,0);ctx.strokeStyle=K;ctx.lineWidth=w+3;ctx.stroke();ctx.strokeStyle=b.slow?'#bfeaff':(b.big?'#ffd23f':'#ffe98a');ctx.lineWidth=w;ctx.stroke();
    ctx.beginPath();ctx.moveTo(-L*.5,-w*.18);ctx.lineTo(L*.6,-w*.18);ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=w*.32;ctx.stroke();ctx.restore()}
  for(const a of S.arcs){ctx.lineJoin='round';for(const[w,c]of[[5.5,K],[2.6,a.c||'#fff3b0'],[1,'#fff']]){if(c==='#fff'&&a.c)continue;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();for(let i=0;i<a.pts.length;i+=2)i?ctx.lineTo(a.pts[i]+(Math.random()-.5)*4,a.pts[i+1]+(Math.random()-.5)*4):ctx.moveTo(a.pts[0],a.pts[1]);ctx.stroke()}}
  if(S.bomb){const x=S.bomb.x,y0=BAL.roadY0,y1=BAL.roadY1;ctx.globalAlpha=.25;ctx.fillStyle='#ffd23f';ctx.fillRect(x-40,y0,40,y1-y0);ctx.globalAlpha=1;ctx.beginPath();ctx.moveTo(x,y0);for(let y=y0;y<=y1;y+=12)ctx.lineTo(x+Math.sin(y*.12+S.t*30)*3,y);
    ctx.lineWidth=13;ctx.strokeStyle=K;ctx.stroke();ctx.lineWidth=6;ctx.strokeStyle='#ffd23f';ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke()}
  for(const p of S.pa){const a=clamp(p.l*2.4,0,1),z=(p.s||3.6)*(.6+a*.4);ctx.globalAlpha=a;ctx.beginPath();ctx.arc(p.x,p.y,z,0,6.3);ctx.fillStyle=p.c;ctx.fill();if(G.q<2){ctx.lineWidth=1.2;ctx.strokeStyle=K;ctx.stroke()}}ctx.globalAlpha=1;
  ctx.font=`700 14px 'BD Grotesk',system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=4;ctx.lineJoin='round';
  for(const f of S.ft){const k=f.l>.78?1+(f.l-.78)*2.6:1;ctx.globalAlpha=clamp(f.l*2,0,1);if(k!==1){ctx.save();ctx.translate(f.x,f.y);ctx.scale(k,k);ctx.strokeStyle=K;ctx.strokeText(f.t,0,0);ctx.fillStyle=f.c;ctx.fillText(f.t,0,0);ctx.restore()}else{ctx.strokeStyle=K;ctx.strokeText(f.t,f.x,f.y);ctx.fillStyle=f.c;ctx.fillText(f.t,f.x,f.y)}}ctx.globalAlpha=1;
}
const carrying=()=>drag&&drag.moved?(drag.shop!==undefined?{shop:drag.shop}:{from:drag.from}):S.sel;
const trail=document.createElement('canvas');trail.width=BAL.LW;trail.height=BAL.LH;const tgx=trail.getContext('2d');tgx.fillStyle='rgba(110,84,50,.35)';
function splat(g){if(S.dec>6||RM)return;S.dec++;const T=BAL.germs[g.ty];tgx.globalAlpha=.2;tgx.fillStyle=T.c;tgx.beginPath();tgx.ellipse(g.x,g.y+g.r*.4,g.r*1.3,g.r*.6,0,0,6.283);tgx.fill();tgx.globalAlpha=1;tgx.fillStyle='rgba(110,84,50,.35)'}   // faint marks where germs popped; cleared every prep
function fx(dt){
  S.push=Math.max(0,S.push-dt);S.gate=Math.max(0,S.gate-dt);
  if(S.st===ST.BATTLE&&S.hp>0&&S.hp<BAL.wallHp*.3){S.hb-=dt;if(S.hb<=0){S.hb=.8;Audio.snd('heart')}}
  let w=0;for(const f of S.fl){f.l-=dt;if(f.l>0)S.fl[w++]=f}S.fl.length=w;
  w=0;for(const r of S.rg){r.r+=70*dt;r.l-=dt;if(r.l>0)S.rg[w++]=r}S.rg.length=w;
  w=0;for(const p of S.pf){p.l-=dt;if(p.l>0)S.pf[w++]=p}S.pf.length=w;S.wh=Math.max(0,S.wh-dt);
  w=0;for(const a of S.fa){a.t+=dt;if(a.t<.55)S.fa[w++]=a}S.fa.length=w;
  w=0;for(const p of S.ip){p.t+=dt;if(p.t<.3)S.ip[w++]=p}S.ip.length=w;
  for(const row of S.grid)for(const u of row)if(u&&u.hitT>0)u.hitT-=dt;
  if(S.st===ST.BATTLE)S.gridA=Math.max(0,S.gridA-dt*2.2);else if(S.st===ST.PREP)S.gridA=Math.min(1,S.gridA+dt*3);   // the grid vanishes when the battle starts
  if(G.sim)return;
  if(S.st===ST.BATTLE&&((++S.f)&3)===0){const gs=S.germs;for(let i=0;i<gs.length;i+=5)tgx.fillRect(gs[i].x|0,(gs[i].y+gs[i].r*.6)|0,2,1)}
  if(!RM){if(S.leaves.length<10&&Math.random()<.03)S.leaves.push({x:BAL.LW+10,y:Math.random()<.5?6+Math.random()*40:BAL.LH-46+Math.random()*40,v:20+Math.random()*30,ph:Math.random()*6});
   for(const l of S.leaves){l.x-=l.v*dt;l.y+=Math.sin(S.t*2+l.ph)*12*dt}w=0;for(const l of S.leaves)if(l.x>-10)S.leaves[w++]=l;S.leaves.length=w}
}
function impactAt(b){if(G.sim||RM||G.q>=2||S.ip.length>=18||!ImpactArt.impact(b.type,b.level))return;S.ip.push({x:b.x,y:b.y,t:0,type:b.type,level:b.level,a:(b.x*7+b.y*3)%6.28})}
function drawImpacts(){for(const p of S.ip){const im=ImpactArt.impact(p.type,p.level);if(!im)continue;const k=p.t/.3,z=18+k*14;ctx.save();ctx.globalAlpha=clamp(1-k*k,0,1);ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.drawImage(im,-z/2,-z/2,z,z);ctx.restore()}ctx.globalAlpha=1}
function drawFxAnims(){
  for(const a of S.fa){const L=FxArt.frames[a.k];if(!L)continue;let i=Math.min(L.length-1,(a.t*12)|0),im=L[i];while(!im&&i>0)im=L[--i];if(!im)continue;ctx.globalAlpha=clamp((.55-a.t)*4,0,.9);ctx.drawImage(im,a.x-a.sz/2,a.y-a.sz/2,a.sz,a.sz)}ctx.globalAlpha=1}
function drawFx(){
  drawFxAnims();drawImpacts();
  for(const f of S.fl){const sprite=WeaponArt.get(f.type,f.level,'muzzle');if(sprite){ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.a||0);ctx.drawImage(sprite,-19,-19,38,38);ctx.restore();continue}ctx.beginPath();for(let k=0;k<8;k++){const a=k*.785,q=k%2?3:7.5;ctx.lineTo(f.x+Math.cos(a)*q,f.y+Math.sin(a)*q)}ctx.closePath();ctx.fillStyle='#fff6b0';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle=K;ctx.stroke()}   // muzzle flash
  for(const r of S.rg){ctx.globalAlpha=clamp(r.l*3,0,1);ctx.lineWidth=7;ctx.strokeStyle=K;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,6.3);ctx.stroke();ctx.lineWidth=3;ctx.strokeStyle=r.c;ctx.stroke()}ctx.globalAlpha=1;
  for(const p of S.pf){const k=1-p.l/.5;ctx.globalAlpha=clamp(p.l*3,0,1);ctx.fillStyle='#fff';ctx.lineWidth=2.5;ctx.strokeStyle=K;ctx.beginPath();for(let i=0;i<5;i++){const a=i*1.2566+k,d=6+k*18,x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d*.7,r=7*(1-k*.5);ctx.moveTo(x+r,y);ctx.arc(x,y,r,0,6.283)}ctx.stroke();ctx.fill()}ctx.globalAlpha=1}   // defeat puff
function drawLeaves(){if(RM)return;ctx.fillStyle='#c9d36a';ctx.globalAlpha=.75;for(const l of S.leaves){ctx.save();ctx.translate(l.x,l.y);ctx.rotate(S.t*2+l.ph);ctx.beginPath();ctx.ellipse(0,0,3.5,1.6,0,0,6.3);ctx.fill();ctx.restore()}ctx.globalAlpha=1}
function gIcon(x,y,r,c){ctx.beginPath();ctx.arc(x,y,r,0,6.3);ctx.fillStyle=shade(c,-.28);ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=K;ctx.stroke();ctx.beginPath();ctx.arc(x-r*.12,y-r*.15,r*.82,0,6.3);ctx.fillStyle=c;ctx.fill();
  ctx.beginPath();ctx.moveTo(x-r*.32+r*.24,y-r*.1);ctx.arc(x-r*.32,y-r*.1,r*.24,0,6.3);ctx.moveTo(x+r*.22+r*.24,y-r*.1);ctx.arc(x+r*.22,y-r*.1,r*.24,0,6.3);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=1;ctx.stroke()}
function drawPreview(){
  if(S.st!==ST.PREP||S.gridA<.5)return;const GT=BAL.germs,x0=Math.max(290,cellX(BAL.cols)+8),y0=74,w=Math.min(336,BAL.LW-6-x0),h=62,hx=x0+w-100,boss=dw()%BAL.bossEvery===0;
  ctx.fillStyle=K;rr(x0,y0+4,w,h,10);ctx.fill();ctx.fillStyle='#fff';rr(x0,y0,w,h,10);ctx.fill();
  ctx.save();ctx.clip();ctx.fillStyle=boss?'#ff5a6e':'#38b6ff';ctx.fillRect(x0,y0,w,20);ctx.fillStyle=K;ctx.fillRect(x0,y0+20,w,2.4);ctx.restore();rr(x0,y0,w,h,10);ctx.lineWidth=3;ctx.strokeStyle=K;ctx.stroke();
  const ht='WAVE '+dw()+' · '+S.q.length+' GERMS'+(S.miniQ?' · '+STR.mini:'');ctx.font=`700 11px 'BD Grotesk',system-ui`;ctx.textAlign='left';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle=K;ctx.strokeText(ht,x0+9,y0+11);ctx.fillStyle='#fff';ctx.fillText(ht,x0+9,y0+11);
  const mx=Math.floor((w-120)/36);let k=0;for(let t=GT.length-1;t>=0&&k<mx;t--)if(S.cnt[t]){const x=x0+18+k*36,y=y0+42;gIcon(x,y,8,GT[t].c);ctx.font=`700 10px 'BD Grotesk',system-ui`;ctx.textAlign='left';ctx.lineWidth=3;ctx.strokeStyle='#fff';const lab=GT[t].boss?'BOSS':'×'+S.cnt[t];ctx.strokeText(lab,x+9,y+7);ctx.fillStyle=K;ctx.fillText(lab,x+9,y+7);k++}
  ctx.fillStyle='#eef6fd';rr(hx-4,y0+26,98,32,6);ctx.fill();const n=Math.min(S.q.length,170);for(let i=0;i<n;i++){ctx.fillStyle=GT[S.q[i]].c;ctx.fillRect(hx+((i*37)%90),y0+29+((i*53)%22),3,3)}
  ctx.font=`700 8px 'BD Grotesk',system-ui`;ctx.textAlign='right';ctx.fillStyle='#5a6b8c';ctx.fillText('HORDE SIZE',x0+w-7,y0+h-6);
}
function ribbon(t,x,y,fs,col){ctx.font=`700 ${fs}px 'BD Grotesk',system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';const w=ctx.measureText(t).width+fs*1.5,h=fs*1.42,l=x-w/2,tp=y-h/2,tl=fs*.8;
  ctx.fillStyle=shade(col,-.32);ctx.lineWidth=3;ctx.strokeStyle=K;ctx.lineJoin='round';
  for(const sd of[-1,1]){const ex=sd<0?l-tl:l+w+tl,ix=sd<0?l+tl*.6:l+w-tl*.6;ctx.beginPath();ctx.moveTo(ix,tp+h*.32);ctx.lineTo(ex,tp+h*.32);ctx.lineTo(ex-sd*tl*.45,tp+h*.82);ctx.lineTo(ex,tp+h*1.32);ctx.lineTo(ix,tp+h*1.32);ctx.closePath();ctx.fill();ctx.stroke()}
  ctx.fillStyle=K;rr(l,tp+4,w,h,8);ctx.fill();ctx.fillStyle=col;rr(l,tp,w,h,8);ctx.fill();ctx.save();ctx.clip();ctx.fillStyle=shade(col,-.14);ctx.fillRect(l,tp+h*.56,w,h);ctx.fillStyle='rgba(255,255,255,.42)';ctx.fillRect(l+8,tp+4,w-16,h*.15);ctx.restore();rr(l,tp,w,h,8);ctx.lineWidth=3;ctx.stroke();
  ctx.lineWidth=fs*.24;ctx.strokeText(t,x,y+1);ctx.fillStyle='#fff';ctx.fillText(t,x,y+1)}
function draw(){
  if(!field)bake();
  const LW=BAL.LW,LH=BAL.LH,gy0=cellY(0),gy1=cellY(BAL.rows),ga=S.gridA;
  ctx.save();const sh=(S.shake>0&&!RM&&!Save.d.shakeOff)?S.shake*14:0;if(sh)ctx.translate((Math.random()-.5)*sh,(Math.random()-.5)*sh);
  if(S.push>0&&!RM){const k=1+.06*S.push/.5;ctx.translate(LW/2,LH/2);ctx.scale(k,k);ctx.translate(-LW/2,-LH/2)}
  S.dec=0;ctx.drawImage(field,0,0,LW,LH);if(ga>.01){ctx.globalAlpha=ga;ctx.drawImage(cellsL,0,0,LW,LH);ctx.globalAlpha=1}ctx.drawImage(trail,0,0,LW,LH);drawLeaves();
  const low=S.hp<BAL.wallHp*.3,pulse=1+(low?.09:.04)*Math.sin(S.t*(low?9:4));
  const wy=gy0-8,wh=gy1-gy0+8;ctx.fillStyle=K;rr(8,wy+4,32,wh,12);ctx.fill();ctx.fillStyle=low?'#ff4d6d':'#ff7a8f';rr(4,wy,32,wh,12);ctx.fill();   // the Body Wall
  ctx.save();ctx.clip();ctx.fillStyle=low?'#df3757':'#ef5a73';ctx.fillRect(25,wy,12,wh);ctx.fillStyle='rgba(255,255,255,.45)';ctx.fillRect(9,wy+12,3.5,wh-24);if(S.wh>0&&!RM){ctx.fillStyle='rgba(255,255,255,'+(S.wh/.15*.55).toFixed(2)+')';ctx.fillRect(4,wy,32,wh)}ctx.restore();
  rr(4,wy,32,wh,12);ctx.lineWidth=3;ctx.strokeStyle=K;ctx.stroke();
  for(let i=0;i<BAL.rows;i++){const hy=cy(i)-3,z=7.5*pulse;ctx.beginPath();ctx.moveTo(20,hy+z*.95);ctx.bezierCurveTo(20-z*1.5,hy-z*.1,20-z*.85,hy-z*1.25,20,hy-z*.45);ctx.bezierCurveTo(20+z*.85,hy-z*1.25,20+z*1.5,hy-z*.1,20,hy+z*.95);ctx.closePath();
    ctx.fillStyle='#ff3d61';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=K;ctx.stroke();ctx.fillStyle='rgba(255,255,255,.85)';ctx.beginPath();ctx.arc(16.6,hy-z*.42,z*.2,0,6.3);ctx.fill()}
  if(S.hp<BAL.wallHp*.66){ctx.lineWidth=2.4;ctx.strokeStyle=K;ctx.beginPath();ctx.moveTo(8,gy0+30);ctx.lineTo(22,gy0+50);ctx.lineTo(12,gy0+70);ctx.moveTo(30,gy1-60);ctx.lineTo(18,gy1-44);ctx.stroke()}
  {const on=S.st===ST.BATTLE&&S.qi<S.q.length,gx=LW-21,gh=gy1-gy0+22;ctx.fillStyle=K;rr(gx+3,gy0-10,19,gh,9);ctx.fill();ctx.fillStyle=S.gate>0?'#fff':(on?'#a45bff':'#7b2ff7');rr(gx,gy0-13,18,gh,9);ctx.fill();   // the germ gate
   ctx.save();ctx.clip();ctx.fillStyle='rgba(22,33,62,.35)';ctx.fillRect(gx+11,gy0-13,8,gh);if(on&&!RM){ctx.fillStyle='rgba(255,255,255,.35)';const o=(S.t*40)%24;for(let y=gy0-13-24+o;y<gy0-13+gh;y+=24)ctx.fillRect(gx+3,y,6,10)}ctx.restore();rr(gx,gy0-13,18,gh,9);ctx.lineWidth=3;ctx.strokeStyle=K;ctx.stroke()}
  const car=carrying();
  if(car&&S.st===ST.PREP)for(let r=0;r<BAL.rows;r++)for(let q=0;q<BAL.cols;q++){const c={q,r};if(!valid(car,c))continue;const m=!!U(c),x=cellX(q),y=cellY(r);
    ctx.fillStyle=m?'rgba(255,210,63,.4)':'rgba(94,211,106,.42)';rr(x+2,y+2,BAL.cell-4,BAL.cell-4,8);ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=m?'#e8a600':'#2e9e47';ctx.setLineDash([6,4]);ctx.lineDashOffset=-S.t*12;ctx.stroke();ctx.setLineDash([]);
    if(!m){let n=0;for(let k=0;k<BAL.rows;k++)if(S.grid[k][q])n++;const b=BAL.stack[Math.min(n+1,4)];if(b){ctx.font=`700 10px 'BD Grotesk',system-ui`;ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle=K;ctx.strokeText('+'+Math.round(b*100)+'%',x+23,y+8);ctx.fillStyle='#ffd23f';ctx.fillText('+'+Math.round(b*100)+'%',x+23,y+8)}}}
  for(let r=0;r<BAL.rows;r++)for(let q=0;q<BAL.cols;q++){const g=S.gh[r][q];if(g&&!S.grid[r][q]&&ga>.01){drawUnit(cx(q),cy(r),{type:g.type,lvl:g.lvl,ev:[],hp:1,mhp:1,pop:0,rc:0,hide:0},.82,.3*ga);ctx.globalAlpha=ga;const lx=cx(q),ly=cy(r)+14;ctx.fillStyle=K;rr(lx-15,ly-7,30,14,7);ctx.fill();ctx.fillStyle='#fff';rr(lx-14,ly-6,28,12,6);ctx.fill();ctx.lineWidth=1.6;ctx.strokeStyle=K;ctx.beginPath();ctx.arc(lx-7,ly,3.4,.6,5.6);ctx.stroke();ctx.beginPath();ctx.moveTo(lx-4.4,ly-4.6);ctx.lineTo(lx-4,ly-1.4);ctx.lineTo(lx-7.2,ly-2);ctx.stroke();ctx.font=`700 9px 'BD Grotesk',system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=K;ctx.fillText(g.cost,lx+4,ly+.5);ctx.globalAlpha=1}}   // rebuild tag
  for(let r=0;r<BAL.rows;r++)for(let q=0;q<BAL.cols;q++){const u=S.grid[r][q];if(!u)continue;if(drag&&drag.moved&&drag.from&&same(drag.from,{q,r}))continue;drawUnit(cx(q),cy(r),u,1)}
  if(ga>.01){ctx.globalAlpha=ga;for(const l of S.links){const x1=cx(l[0]),y1=cy(l[1]),x2=cx(l[2]),y2=cy(l[3]);ctx.lineCap='round';ctx.lineWidth=5;ctx.strokeStyle=K;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.lineWidth=2.5;ctx.strokeStyle=l[4];ctx.stroke()}ctx.globalAlpha=1}
  if(ga>.01){ctx.globalAlpha=ga;for(let q=0;q<BAL.cols;q++){let n=0;for(let r=0;r<BAL.rows;r++)if(S.grid[r][q])n++;const b=BAL.stack[Math.min(n,4)];if(b){ctx.font=`700 11px 'BD Grotesk',system-ui`;ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle=K;ctx.strokeText('+'+Math.round(b*100)+'%',cx(q),gy0-8);ctx.fillStyle='#ffd23f';ctx.fillText('+'+Math.round(b*100)+'%',cx(q),gy0-8)}}ctx.globalAlpha=1}
  if(S.sel&&S.sel.from&&S.st===ST.PREP){rr(cellX(S.sel.from.q),cellY(S.sel.from.r),BAL.cell,BAL.cell,9);ctx.lineWidth=7;ctx.strokeStyle=K;ctx.stroke();ctx.lineWidth=4;ctx.strokeStyle='#ffd23f';ctx.stroke()}
  if(G.kb&&!S.evo&&S.st===ST.PREP){ctx.lineWidth=3;ctx.strokeStyle='#1d93db';ctx.setLineDash([5,3]);rr(cellX(S.cur.q)-1,cellY(S.cur.r)-1,BAL.cell+2,BAL.cell+2,9);ctx.stroke();ctx.setLineDash([])}
  drawGermsAndFx();drawFx();drawPreview();
  if(drag&&drag.moved){const y=drag.y-(drag.touch?BAL.touchLift:0);if(drag.shop!==undefined){const ty=S.shop[drag.shop];if(ty)drawUnit(drag.x,y,{type:ty,lvl:1,ev:[],hp:1,mhp:1,pop:0,rc:0,hide:0},1.1,.9)}else{const u=U(drag.from);if(u)drawUnit(drag.x,y,u,1.1,.92)}}
  if(S.banner>0){const boss=S.wave%BAL.bossEvery===0,t=(boss?'BOSS WAVE ':'WAVE ')+dw(),k=S.banner>1.22&&!RM?1+(S.banner-1.22)*2.6:1;   // ribbon banner pops in, then fades
    ctx.save();ctx.globalAlpha=clamp(S.banner*2,0,1);ctx.translate(LW/2,112);ctx.scale(k,k);ribbon(t,0,0,28,boss?'#ff5a6e':'#38b6ff');if(S.miniQ)ribbon(STR.mini,0,38,15,'#ffb21f');ctx.restore()}
  if(DEBUG){ctx.font='11px monospace';ctx.fillStyle='#000';ctx.textAlign='left';ctx.fillText(`germs ${S.germs.length} bullets ${S.bul.length} frame ${G.ms.toFixed(2)}ms`,6,LH-4)}
  ctx.restore();
}
const hc={};const tx=(el,v)=>{if(hc[el.id||el]!==v){hc[el.id||el]=v;el.textContent=v}};
const offers=[...document.querySelectorAll('.offer')];
const stEl=$('stage');
function bumpEl(e,c){e.classList.remove(c);void e.offsetWidth;e.classList.add(c)}
function hud(){
  tx($('wv'),G.mode==='camp'?CAMP[G.stage].n+' '+dw()+'/15':G.mode==='tut'?'Tutorial':G.mode==='prac'?'Practice':STR.wave+' '+S.wave);
  const en=Math.floor(S.en);if(hc.en!==en){if(hc.en!=null&&en>hc.en+2&&!RM)bumpEl($('en'),'bump');hc.en=en;$('enN').textContent=en}
  const hp=Math.max(0,S.hp),wp=Math.round(hp/BAL.wallHp*100);if(hc.hp!==wp){const now=performance.now();if(hc.hp!=null&&wp<hc.hp&&!RM&&!(hc.wt>now)){bumpEl($('wall'),'hit');hc.wt=now+300}hc.hp=wp;$('hpF').style.width=wp+'%';$('hpN').textContent=Math.ceil(hp);$('wall').classList.toggle('low',wp<30)}
  const ph=S.st===ST.BATTLE?'b':'p';if(hc.ph!==ph){hc.ph=ph;stEl.classList.toggle('ph-battle',ph==='b');stEl.classList.toggle('ph-prep',ph==='p')}
  {const tot=S.q.length||1,left=S.st===ST.BATTLE?Math.max(0,S.germs.length+S.q.length-S.qi):tot,pc=Math.round((1-left/tot)*100);if(hc.wp!==pc){hc.wp=pc;const f=$('wvF');if(f)f.style.width=pc+'%'}}
  const pr=G.mode==='prac';if(hc.pr!==pr){hc.pr=pr;stEl.classList.toggle('prac',pr)}
  offers.forEach((el,i)=>{const ty=S.shop[i],c=ty?price(ty):0,off=S.st!==ST.PREP||S.en<c,sel=!!(S.sel&&S.sel.shop===i),nw=!!ty&&!Save.d.seenB[ty]&&G.mode!=='tut'&&G.mode!=='prac',key=ty?ty+'|'+c+'|'+off+'|'+sel+'|'+Art.ok+'|'+nw:'-';if(hc['o'+i]===key)return;hc['o'+i]=key;
    el.classList.toggle('hidden',!ty);if(!ty)return;const T=TY[ty],th=Art.src[ty],bl=el.querySelector('.blob');
    el.querySelector('b').textContent=DEF[ty].short;el.querySelector('.cst span').textContent=c;bl.style.backgroundColor=T.col;bl.style.backgroundImage=th?'url("'+th+'")':'none';bl.classList.toggle('art',!!th);bl.classList.remove('rar-common','rar-rare','rar-epic','rar-legendary');bl.classList.add('rar-'+rarityOf(ty));bl.firstChild.textContent=T.L;
    el.setAttribute('aria-label',T.n+', '+c+' energy');el.classList.toggle('off',off);el.classList.toggle('sel',sel);el.classList.toggle('new',nw)});
  const rrb=$('rr'),fr=S.freeRR>0;rrb.disabled=S.st!==ST.PREP;rrb.title=fr?'Free reroll':'Reroll '+BAL.shop.reroll;rrb.classList.toggle('free',fr);tx($('rrN'),fr?'':String(BAL.shop.reroll));
  const pb=pr&&S.st===ST.BATTLE;$('go').disabled=S.st!==ST.PREP&&!pb;tx($('goL'),pb?'Prep':'Battle');$('go').classList.toggle('ready',S.st===ST.PREP&&units()>0);$('pract').classList.toggle('hidden',!pb);
  const set=(id,deg)=>{const k='cd'+id;if(hc[k]!==deg){hc[k]=deg;$(id).style.setProperty('--cd',deg+'deg')}};
  $('bomb').disabled=S.st!==ST.BATTLE;set('bomb',Math.round(S.bcd/BAL.bomb.cd*360));
  $('heal').disabled=S.hp>=BAL.wallHp;$('rally').disabled=S.st!==ST.BATTLE||S.rally<BAL.rally.max;set('rally',Math.round((1-S.rally/BAL.rally.max)*360));
  const syns=(S.stack>=2?` · Stack ×${S.stack} +${Math.round(BAL.stack[Math.min(S.stack,4)]*100)}%`:'')+(S.pRows?` · Pierce rows ${S.pRows}`:'');
  tx($('chip'),(G.mode==='tut'||G.mode==='prac')?'':S.st===ST.PREP?S.prev+syns+(S.prepT<=BAL.quick.sec?' · quick +'+BAL.quick.frac*100+'%':''):(S.st===ST.BATTLE?`${S.germs.length+S.q.length-S.qi} germs left · Hide ×${S.hideC}`+(S.rallyT>0?' · RALLY':''):''));
  if(S.st===ST.BATTLE&&G.mode!=='tut'){if(((hc.bf=(hc.bf|0)+1)&3)===0){let b=null;for(const g of S.germs)if((BAL.germs[g.ty].boss||g.mini)&&(!b||g.mhp>b.mhp))b=g;   // boss / mini-boss health bar
      const on=!!b;if(hc.bb!==on){hc.bb=on;$('bossBar').classList.toggle('hidden',!on);$('bossBar').classList.toggle('on',on)}
      if(b){const T=BAL.germs[b.ty];tx($('bbN'),b.mini?T.n+' · '+STR.mini:T.n);$('bbF').style.width=(clamp(b.hp/b.mhp,0,1)*100).toFixed(1)+'%';const sm=T.shield?b.mhp*T.shield/T.hp:0;$('bbS').style.width=(sm?clamp(b.sh/sm,0,1)*100:0).toFixed(1)+'%'}}}
  else if(hc.bb){hc.bb=false;$('bossBar').classList.add('hidden');$('bossBar').classList.remove('on')}
}
/* ---- input ---- */
function toL(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*BAL.LW,y:(e.clientY-r.top)/r.height*BAL.LH}}
cv.addEventListener('pointerdown',e=>{
  if(drag||S.evo||G.scr!=='game'||G.paused)return;const p=toL(e);G.kb=false;
  if(S.st===ST.BATTLE){zap(p);return}
  if(S.st!==ST.PREP)return;
  const c=cellAt(p);if(!c)return;
  if(U(c))drag={from:c,x:p.x,y:p.y,sx:e.clientX,sy:e.clientY,moved:false,touch:e.pointerType==='touch',id:e.pointerId};
  else if(S.sel){act(S.sel,c);S.sel=null}
  else if(S.gh[c.r][c.q])rebuild(c);
});
offers.forEach(el=>el.addEventListener('pointerdown',e=>{if(S.st!==ST.PREP||drag||S.evo||G.scr!=='game'||G.paused)return;const p=toL(e);G.kb=false;drag={shop:+el.dataset.i,x:p.x,y:p.y,sx:e.clientX,sy:e.clientY,moved:false,touch:e.pointerType==='touch',id:e.pointerId};e.preventDefault()}));
addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const p=toL(e);drag.x=p.x;drag.y=p.y;if(Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)>6)drag.moved=true});
addEventListener('pointercancel',e=>{if(drag&&e.pointerId===drag.id)drag=null});cv.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('pointerup',e=>{
  if(!drag||e.pointerId!==drag.id)return;const d=drag;drag=null;if(S.st!==ST.PREP||S.evo)return;
  const p=toL(e);
  if(d.moved){const c=cellAt({x:p.x,y:p.y-(d.touch?BAL.touchLift:0)});
    if(d.shop!==undefined){if(c)act({shop:d.shop},c)}
    else{const el=document.elementFromPoint(e.clientX,e.clientY);if(el&&el.closest('#shop'))sell(d.from);else if(c)act({from:d.from},c)}
  }else if(d.shop!==undefined){S.sel=S.sel&&S.sel.shop===d.shop?null:{shop:d.shop}}
  else{const c=d.from;
    if(S.sel&&S.sel.from&&same(S.sel.from,c))S.sel=null;
    else if(S.sel&&valid(S.sel,c)){act(S.sel,c);S.sel=null}
    else S.sel={from:c}}
});
addEventListener('keydown',e=>{
  const k=e.key,kl=k.length===1?k.toLowerCase():k;if(G.scr!=='game'||S.evo)return;
  if(kl==='p'||(k==='Escape'&&(G.paused||!S.sel))){pause(!G.paused);return}if(kl==='f'){fsToggle();return}if(G.paused)return;
  if(e.target&&e.target.tagName==='BUTTON'&&(k==='Enter'||k===' '))return;
  const m={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[k];
  if(m){G.kb=true;S.cur.q=clamp(S.cur.q+m[0],0,BAL.cols-1);S.cur.r=clamp(S.cur.r+m[1],0,BAL.rows-1);e.preventDefault();return}
  if(S.st===ST.BATTLE){if(kl==='z'){zapNear();return}if(kl==='b')bomb();else if(kl==='h')healWall();else if(kl==='r')rally();else if(k==='Enter'||k===' '){G.kb=true;hide(S.cur);e.preventDefault()}return}
  if(S.st!==ST.PREP)return;
  if(kl==='b'){startBattle();return}
  if(kl==='h'){healWall();return}
  if(kl==='x'){reroll();return}
  if(k>='1'&&k<='3'){G.kb=true;if(S.shop[k-1])S.sel={shop:k-1};return}
  if(k==='Escape'){S.sel=null;return}
  if(k==='Enter'||k===' '){G.kb=true;const c={q:S.cur.q,r:S.cur.r};   // copy: a selection must not follow the cursor
    if(S.sel){if(S.sel.from&&same(S.sel.from,c))S.sel=null;else{act(S.sel,c);S.sel=null}}
    else if(U(c))S.sel={from:c};else if(S.gh[c.r][c.q])rebuild(c);
    e.preventDefault()}
});
offers.forEach(el=>el.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&S.st===ST.PREP){const i=+el.dataset.i;S.sel=S.sel&&S.sel.shop===i?null:{shop:i};G.kb=true;e.preventDefault();e.stopPropagation()}}));
function pause(on){if(on===G.paused||G.scr!=='game')return;
  if(on){if(S.evo||S.st===ST.RESULT||S.st===ST.OVER||!$('ov').classList.contains('hidden'))return;G.paused=true;Portal.setGameplay(false);ov('Paused','#38bdf8','Take a breath.','Resume',()=>pause(false),'Home',goHome);
    const row=el('div','row'),sb=el('button','btn');const up=()=>{const m=Save.d.muted;sb.className='btn '+(m?'ghostBtn':'sky');sb.innerHTML=ic(m?'mute':'sound')+'<span>'+(m?'Sound off':'Sound on')+'</span>';sb.setAttribute('aria-pressed',String(!m))};up();
    sb.onclick=()=>{Save.d.muted=!Save.d.muted;applySettings();Save.flush();up()};row.style.justifyContent='center';row.appendChild(sb);$('ovS').appendChild(row)}
  else{G.paused=false;$('ov').classList.add('hidden');if(S.st===ST.BATTLE)Portal.setGameplay(true)}}
function fsToggle(){const d=document,el=d.documentElement;if(d.fullscreenElement){d.exitFullscreen()}else if(el.requestFullscreen){el.requestFullscreen().then(()=>{try{screen.orientation.lock('landscape').catch(()=>{})}catch(e){}}).catch(()=>{})}}
$('pause').addEventListener('click',()=>pause(!G.paused));$('fs').addEventListener('click',fsToggle);$('fs').classList.toggle('hidden',!document.fullscreenEnabled);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&S.st===ST.BATTLE)pause(true)});addEventListener('blur',()=>{if(S.st===ST.BATTLE)pause(true)});
$('go').addEventListener('click',()=>{if(G.mode==='prac'&&S.st===ST.BATTLE){for(const g of S.germs)poolG.push(g);S.germs.length=0;for(const x of S.bul)poolB.push(x);S.bul.length=0;S.bomb=null;startPrep()}else startBattle()});$('rr').addEventListener('click',reroll);
$('bomb').addEventListener('click',bomb);$('heal').addEventListener('click',healWall);$('rally').addEventListener('click',rally);
$('spd').addEventListener('click',()=>{G.spd=G.spd===1?2:1;$('spd').textContent=G.spd+'×'});
const COARSE=matchMedia('(pointer:coarse)').matches;
function resize(){
  const sa=getComputedStyle($('sa')),pl=parseFloat(sa.paddingLeft)||0,pr=parseFloat(sa.paddingRight)||0,pt=parseFloat(sa.paddingTop)||0,pb=parseFloat(sa.paddingBottom)||0;   // notches / rounded corners
  const VW=innerWidth,VH=innerHeight,W=Math.max(100,VW-pl-pr),H=Math.max(100,VH-pt-pb),s=Math.min(W/BAL.LW,H/BAL.LH),st=$('stage'),w=Math.floor(BAL.LW*s),h=Math.floor(BAL.LH*s);
  const dpr=Math.min(G.q>=2?1:G.q>=1?1.5:2,devicePixelRatio||1);   // low-performance mode also lowers the canvas resolution
  st.style.width=w+'px';st.style.height=h+'px';st.style.left=(pl+((W-w)>>1))+'px';st.style.top=(pt+((H-h)>>1))+'px';
  const cw=Math.round(w*dpr),ch=Math.round(h*dpr);if(cv.width!==cw||cv.height!==ch){cv.width=cw;cv.height=ch}
  const R=document.documentElement.style;R.setProperty('--s',s.toFixed(3));R.setProperty('--ms',(VH>VW?clamp(VW/390,.9,1.6):clamp(Math.min(VW/760,VH/400),.9,1.9)).toFixed(3));   // menu scale: phones ~1, tablets/desktops up to 1.9
  st.classList.toggle('compact',w<600);st.classList.toggle('tiny',w<520);
  const bk=clamp(Math.ceil(cw/BAL.LW),1,3);if(bk!==G.bk){G.bk=bk;field=null}
  if(VH>VW&&G.scr==='game'&&COARSE)pause(true);   // phone in portrait: the rotate screen covers the game, the game waits
}
addEventListener('resize',resize);addEventListener('orientationchange',resize);
function autoFs(){try{if(matchMedia('(pointer:coarse)').matches&&document.fullscreenEnabled&&!document.fullscreenElement)document.documentElement.requestFullscreen().then(()=>{try{screen.orientation.lock('landscape').catch(()=>{})}catch(e){}}).catch(()=>{})}catch(e){}}
function frame(ts){
  requestAnimationFrame(frame);const t0=performance.now();
  if(G.scr!==G.scrP){G.scrP=G.scr;document.documentElement.classList.toggle('in-game',G.scr==='game')}   // the rotate prompt only matters in a battle
  const dt=G.last?Math.min(.1,(ts-G.last)/1000):0;G.last=ts;
  if(G.scr==='game'&&!S.evo&&!G.paused){G.acc+=dt*(S.st===ST.BATTLE?G.spd:1);let n=0;while(G.acc>=BAL.STEP&&n<16){step(BAL.STEP);G.acc-=BAL.STEP;n++}if(n>=16)G.acc=0}
  if(G.scr==='game'&&G.mode==='tut')Tut.tick(dt);if(G.scr==='game'){ctx.setTransform(cv.width/BAL.LW,0,0,cv.width/BAL.LW,0,0);draw();hud()}Audio.rumble(G.scr==='game'&&S.st===ST.BATTLE?S.germs.length:0);G.ms=performance.now()-t0;if(DEBUG&&dbgInit.tick)dbgInit.tick(dt);
  G.msAvg=G.msAvg*.95+G.ms*.05;
  if(G.msAvg>BAL.perf.ms&&G.q<2){G.qt+=dt;if(G.qt>3){G.q++;G.qt=0;G.msAvg=BAL.perf.ms*.5;resize()}}else G.qt=0;   // low-performance mode: particles first, never gameplay
}
/* ---- headless balance helpers (console): BD.sim({waves:30,seed:1}) and BD.perf() ---- */
function squadDps(){let d=0;for(const row of S.grid)for(const u of row){if(!u||DEF[u.type].attack==='support')continue;const T=TY[u.type];d+=T.dmg*Math.pow(T.g,u.lvl-1)*evm(u,'dmg')/(T.cd/(u.rateM*evm(u,'rate')))*(DEF[u.type].attack==='chain'?1.8:1)}return d}
function botMerge(){const N=BAL.rows*BAL.cols;
  for(let it=0;it<60;it++){let hit=false;
    for(let a=0;a<N&&!hit;a++){const ca={q:a%BAL.cols,r:(a/BAL.cols)|0},ua=U(ca);if(!ua)continue;
      for(let b=a+1;b<N;b++){const cb={q:b%BAL.cols,r:(b/BAL.cols)|0},ub=U(cb);if(!ub||!canMerge(ua,ub))continue;
        const keepB=DEF[ua.type].ab.taunt?cb.q>=ca.q:cb.q<=ca.q;   // Guardians survive in the front (right) column, the rest toward the back
        act({from:keepB?ca:cb},keepB?cb:ca);hit=true;break}}
    if(!hit)break}}
const BOT={skill:'skilled'};   // headless bot profile: 'skilled' (columns, Guardian front, Hide, Bomb) or 'novice' (random cells, late merges, no abilities)
function botPrep(){const B=BAL.bot,N=BAL.rows*BAL.cols,nov=BOT.skill==='novice',cnt=t=>{let n=0;for(const row of S.grid)for(const u of row)if(u&&u.type===t)n++;return n},cntF=f=>{let n=0;for(const row of S.grid)for(const u of row)if(u&&f(DEF[u.type]))n++;return n},tank=t=>!!DEF[t].ab.taunt,supp=t=>DEF[t].attack==='support';
  const lvl1=t=>{for(let r=0;r<BAL.rows;r++)for(let q=0;q<BAL.cols;q++){const u=S.grid[r][q];if(u&&u.type===t&&u.lvl===1)return{q,r}}return null};
  if(!nov||units()>=N-B.novMergeAt)botMerge();
  for(let r=0;r<BAL.rows;r++)for(let q=0;q<BAL.cols;q++)if(S.gh[r][q]&&!S.grid[r][q]&&S.en>=S.gh[r][q].cost)rebuild({q,r});   // fallen bacteria come back at half price
  if(S.hp<B.healBelow&&S.en>=BAL.heal.cost+B.reserve)healWall();
  let rr=0;
  for(let it=0;it<80;it++){
    const nu=units();let best=-1,bs=-1;
    if(nov){const ok=[];S.shop.forEach((ty,i)=>{if(ty&&S.en>=price(ty)&&!(nu<B.novOpen&&(supp(ty)||tank(ty))))ok.push(i)});if(ok.length)best=ok[Math.floor(RS()*ok.length)];bs=9}else
    S.shop.forEach((ty,i)=>{if(!ty||S.en<price(ty))return;let sc=B.pri[ty]||1;
      if(tank(ty))sc=cntF(d=>!!d.ab.taunt)<B.guards&&nu>=B.guardAfter?sc*3:.3;
      if(supp(ty))sc=nu>=B.healAt&&cntF(d=>d.attack==='support')<B.heals?sc:.1;
      if(!cnt(ty))sc*=1.5;
      if(nu>=N&&!lvl1(ty))sc*=.1;
      if(sc>bs){bs=sc;best=i}});
    if(best<0)break;
    if(bs<1.5&&S.freeRR>0&&rr<2){reroll();rr++;continue}
    const ty=S.shop[best];let tc=null;
    if(nov){const fr=[];for(let r=0;r<BAL.rows;r++)for(let q=0;q<BAL.cols;q++)if(!S.grid[r][q])fr.push({q,r});if(fr.length)tc=fr[Math.floor(RS()*fr.length)]}
    else for(const q of(B.cols[ty]||[0,1,2,3])){for(const r of B.rows)if(!S.grid[r][q]){tc=cell2(q,r);break}if(tc)break}
    if(!tc)tc=lvl1(ty);
    if(!tc)for(let q=0;q<BAL.cols&&!tc;q++)for(const r of B.rows)if(!S.grid[r][q]){tc={q,r};break}
    if(!tc&&nov)break;
    if(!tc){   // grid full: swap out the weakest low-level bacteria when we have energy to spare
      let w=null,wv=1e9;for(let r=0;r<BAL.rows;r++)for(let q=0;q<BAL.cols;q++){const u=S.grid[r][q];if(!u||u.lvl>B.sellMaxLvl||DEF[u.type].ab.taunt)continue;const v=u.lvl*100+r;if(v<wv){wv=v;w={q,r}}}
      if(!w||S.en<price(ty)+B.reserve)break;sell(w);tc=w}
    act({shop:best},tc);if(!nov||units()>=N-B.novMergeAt)botMerge()}
}
const cell2=(q,r)=>({q,r});
function botBattle(){if(BOT.skill==='novice')return;const B=BAL.bot,GT=BAL.germs;
  for(let r=0;r<BAL.rows;r++)for(let q=0;q<BAL.cols;q++){const u=S.grid[r][q];if(u&&u.hp<u.mhp*B.hideBelow&&S.hideC>0&&!(u.hide>0)&&!(u.hcd>0))hide({q,r})}
  let near=0,boss=false;const xs=BAL.x0+BAL.cols*BAL.cell+B.bombPad;for(const g of S.germs)if(g.x<xs){near++;if(GT[g.ty].boss)boss=true}
  if((near>=B.bombAt||boss)&&S.bcd<=0&&!S.bomb&&S.en>=BAL.bomb.cost+B.bombReserve)bomb();
  if(B.zapPerSec>0){let z=null,zx=1e9;for(const g of S.germs)if(g.x<zx){zx=g.x;z=g}if(z)zapHit(z)}
}
function botBoost(){const pool=BOOSTS.filter(b=>!b.need||b.need());if(pool.length){const b=pool[Math.floor(RS()*pool.length)];b.fx(S.bf);S.picked.push(b.n)}}
function sim(o){o=o||{};BOT.skill=o.skill||'skilled';G.sim=true;seedAll(o.seed||1);S=null;G.mode=o.stage!=null?'camp':'endless';newRun();if(o.stage!=null){const c=CAMP[o.stage];S.off=c.off;S.wave=1+c.off;S.mulHp=c.mulHp;S.mulN=c.mulN;S.en+=c.en;startPrep()}const out=[];
  for(let w=1;w<=(o.waves||20);w++){botPrep();const dps=squadDps(),q=S.q.slice();let thp=0;q.forEach((t,i)=>{thp+=germHp(t,S.wave,S.miniQ&&i===q.length-1?1:0)});
    const en0=Math.floor(S.en),k0=S.kills;S.prepT=99;startBattle();let t=0,tk=0;const hp0=S.hp;
    while(S.st===ST.BATTLE&&t<BAL.bot.maxSec){step(BAL.STEP);t+=BAL.STEP;tk+=BAL.STEP;if(tk>=BAL.bot.tick){tk=0;botBattle()}}
    out.push({wave:S.wave,germs:q.length,germHp:+hpOf(S.wave).toFixed(1),totalHp:Math.round(thp),squadDps:Math.round(dps),energy:en0,income:Math.round(S.en-en0),units:units(),secs:+t.toFixed(1),wall:Math.round(S.hp),result:S.st});
    if(S.st!==ST.RESULT)break;if(o.boosts!==false)botBoost();S.wave++;startPrep()}
  G.sim=false;if(typeof console.table==='function'&&!o.quiet)console.table(out);return out}
function simMany(o){o=o||{};const n=o.seeds||20,W=o.waves||40,rows=[],deaths=[];
  for(let s=1;s<=n;s++){const r=sim({seed:s,waves:W,quiet:1,boosts:o.boosts,skill:o.skill});rows.push(r);const last=r[r.length-1];deaths.push(last.result==='result'&&r.length>=W?W+1:last.wave)}
  const at=w=>{const a=rows.map(r=>r.find(x=>x.wave===w)).filter(Boolean),m=k=>a.length?+(a.reduce((p,x)=>p+x[k],0)/a.length).toFixed(1):null;return{wave:w,alive:a.length+'/'+n,germs:m('germs'),germHp:m('germHp'),totalHp:m('totalHp'),squadDps:m('squadDps'),wall:m('wall'),income:m('income')}};
  const tbl=(o.at||[1,5,10,20,30,40]).map(at),avgDeath=+(deaths.reduce((p,x)=>p+x,0)/n).toFixed(1);
  const sorted=deaths.slice().sort((a,b)=>a-b);
  return{table:tbl,avgDeathWave:avgDeath,medianDeath:sorted[n>>1],min:sorted[0],max:sorted[n-1],deaths}}
function perf(){G.sim=true;G.mode='endless';seedAll(3);S=null;newRun();S.wave=30;S.en=4000;startPrep();botPrep();S.prepT=99;startBattle();S.si*=.12;let peak=0,tot=0,n=0;
  for(let i=0;i<5000&&S.st===ST.BATTLE;i++){S.hp=1e9;const t0=performance.now();step(BAL.STEP);const d=performance.now()-t0;if(S.germs.length>peak)peak=S.germs.length;if(S.germs.length>250){tot+=d;n++}}
  G.sim=false;return{peakGerms:peak,avgStepMsAbove250:n?+(tot/n).toFixed(3):null,samples:n}}
function flood(){G.sim=false;G.mode='endless';G.scr='game';show(null);seedAll(3);newRun();S.wave=30;S.en=4000;startPrep();G.sim=true;botPrep();G.sim=false;S.prepT=99;startBattle();S.si*=.12;S.hp=1e9}
const BDX=Object.assign({get S(){return S},get Tut(){return Tut},step(n){for(let i=0;i<n;i++)step(BAL.STEP)},energy(n){S.en+=n},skip(){if(S.st===ST.BATTLE){S.germs.length=0;S.qi=S.q.length}},BAL,sim,simMany,perf,seedAll,newRun,wave(w){const gm=G.mode;if(gm==='tut'||gm==='prac')G.mode='endless';const q=makeQueue(w),c={},mt=miniOf(w);G.mode=gm;let h=0;q.forEach((ty,i)=>{h+=germHp(ty,w,mt>=0&&i===q.length-1?1:0);const n=BAL.germs[ty].n;c[n]=(c[n]||0)+1});return{wave:w,mini:mt>=0?BAL.germs[mt].n:null,germs:q.length,germHp:+hpOf(w).toFixed(1),totalHp:Math.round(h),mix:c}}},{bot:botPrep,flood,spawnG,miniOf,makeQueue,Portal,Audio,Music,Save,G,ACH,Roster,Art,GermArt,FieldArt,DEF,LAB,owned,recipeOf,canMerge,achReady,act,hide,bomb,zap,startBattle,startPrep,reroll,startRun,goHome,renderCodex,renderHelp,renderHome,syn,units,mk,stats(){return{ms:G.ms,avg:G.msAvg,q:G.q,germs:S.germs.length,st:S.st,wave:S.wave,scr:G.scr}}});
if(DEBUG)window.BD=BDX;
/* ---- debug panel: built only with ?debug=1, so it costs nothing in the shipped game ---- */
function dbgInit(){
  const D=STR.dbg,box=document.createElement('div');box.id='dbg';box.setAttribute('role','group');box.setAttribute('aria-label',D.lbl);
  box.style.cssText='position:fixed;right:4px;bottom:4px;z-index:60;background:rgba(20,16,40,.88);color:#fff;font:11px/1.3 system-ui,sans-serif;padding:5px;border-radius:8px;display:flex;flex-direction:column;gap:3px;max-width:150px';
  const b=(t,fn)=>{const x=document.createElement('button');x.type='button';x.textContent=t;x.style.cssText='font:inherit;padding:3px 5px;border-radius:5px;border:0;background:#ffd23f;color:#222;cursor:pointer';x.onclick=e=>{e.stopPropagation();fn();x.blur()};return x};
  const info=document.createElement('div');info.setAttribute('aria-live','off');
  const body=document.createElement('div');body.style.cssText='display:flex;flex-direction:column;gap:3px';
  const num=document.createElement('input');num.type='number';num.min=1;num.value=10;num.setAttribute('aria-label',D.wave);num.style.cssText='width:100%;font:inherit;box-sizing:border-box';
  const sel=document.createElement('select');sel.setAttribute('aria-label',D.spawn);sel.style.cssText='width:100%;font:inherit';
  BAL.germs.forEach((g,i)=>{const o=document.createElement('option');o.value=i;o.textContent=g.n;sel.appendChild(o)});
  const god=b(D.god+': '+D.off,()=>{G.god=!G.god;god.textContent=D.god+': '+(G.god?D.on:D.off)});
  body.append(
    b(D.skip,()=>{if(!S)return;if(S.st===ST.BATTLE){for(const g of S.germs)poolG.push(g);S.germs.length=0;S.qi=S.q.length}}),
    b(D.en,()=>{if(S)S.en+=BAL.dbg.energy}),
    num,b(D.go,()=>{if(!S)return;const w=Math.max(1,num.value|0);for(const g of S.germs)poolG.push(g);S.germs.length=0;for(const x of S.bul)poolB.push(x);S.bul.length=0;S.bomb=null;S.wave=w;S.nextQ=null;S.st=ST.PREP;startPrep()}),
    sel,b(D.spawn,()=>{if(!S)return;if(S.st!==ST.BATTLE){toast(D.needBattle);return}spawnG(sel.value|0,BAL.spawnX,BAL.roadY0+12+Math.random()*(BAL.roadY1-BAL.roadY0-24),false)}),
    god);
  body.style.display='none';   // collapsed by default so it never covers the bottom buttons on a 360px-high screen
  const tg=b(D.show,()=>{const h=body.style.display==='none';body.style.display=h?'flex':'none';tg.textContent=h?D.hide:D.show});
  box.style.maxWidth='170px';box.style.opacity='.9';box.append(info,body,tg);document.body.appendChild(box);
  let acc=0;dbgInit.tick=dt=>{acc+=dt;if(acc<BAL.dbg.refresh)return;acc=0;if(!S||G.scr!=='game'){info.textContent='';return}
    info.textContent=D.wv+' '+S.wave+' · '+D.frame+' '+G.ms.toFixed(1)+'/'+G.msAvg.toFixed(1)+' ms · '+D.germs+' '+S.germs.length+' · '+D.bul+' '+S.bul.length}
}
if(DEBUG){if(document.body)dbgInit();else addEventListener('DOMContentLoaded',dbgInit)}
/* ---- results, defeat, revive ---- */
function countUp(el,to,ms,pre,suf){if(RM||G.sim){el.textContent=pre+to+suf;return}const id=countUp.id=(countUp.id|0)+1,t0=performance.now();(function f(){if(countUp.id!==id)return;const k=Math.min(1,(performance.now()-t0)/ms);el.textContent=pre+Math.round(to*k)+suf;if(k<1&&G.scr==='game')requestAnimationFrame(f)})()}
function showBoosts(next){
  const pool=BOOSTS.filter(b=>!b.need||b.need()),pick=[],W={common:60,rare:30,epic:10};
  while(pick.length<3&&pool.length){let tot=0;for(const b of pool)tot+=W[b.r];let r=RS()*tot,i=0;for(;i<pool.length-1;i++){if(r<W[pool[i].r])break;r-=W[pool[i].r]}pick.push(pool.splice(i,1)[0])}
  const box=el('div','bcards');
  for(const b of pick){const c=el('button','bcard '+b.r);c.append(el('i','',b.r),el('b','',b.n),el('span','',b.d));
    c.onclick=()=>{b.fx(S.bf);S.picked.push(b.n);Audio.snd('evolve');$('ov').querySelector('.card').classList.remove('wide');next()};box.appendChild(c)}
  $('ovS').appendChild(box);$('ovB').classList.add('hidden');$('ov').querySelector('.card').classList.add('wide');
}
function victory(sub,btn,fn,btn2,fn2){   // gold ribbon + short recap; used for Endless milestones and Campaign stage clears
  const V=STR.vic;ov(V.rib,'#f5b800',sub,btn,fn,btn2,fn2);$('rib').classList.add('gold');Audio.fanfare();
  const box=el('div','stg four'),chip=(v,l,i)=>{const d=el('div');if(i)d.insertAdjacentHTML('afterbegin',ic(i,'chipIc'));d.append(el('b','',String(v)),el('span','',l));return d};
  box.append(chip(dw(),V.waves,'crown'),chip(S.kills,V.kills,'skull'),chip(Math.round(S.bt)+'s',V.time,'clock'),chip(S.coinsRun,V.coins,'coin'));$('ovS').appendChild(box)}
function winUI(bonus){
  Portal.setGameplay(false);Music.mood('prep');Audio.snd('win');
  const real=!G.sim&&G.mode!=='tut'&&G.mode!=='prac',M=BAL.milestone,ms=real&&G.mode!=='camp'&&dw()%M.every===0?M.base+M.per*((dw()/M.every)|0):0,coins=real?2+Math.floor(S.wave/3)+ms:0;
  if(real){Save.d.coins+=coins;S.coinsRun+=coins;Mis.add('wave',1);stat('waves',1);if(G.mode==='endless')Mis.max('reach',S.wave);Save.flush()}
  if(G.mode==='camp'&&dw()>=15){if(!G.sim)campWin();return}
  S.nextQ=makeQueue(S.wave+1);
  const nw=BAL.germs.findIndex(g=>g.from===S.wave+1&&S.wave+1>1),nb=(S.wave+1)%BAL.bossEvery===0,next=()=>{S.wave++;startPrep()};
  if(ms&&!G.sim)victory('+0 energy',STR.next,next);else ov(STR.wave+' '+dw()+' '+STR.cleared,'#5ed36a','+0 energy',STR.next,next);
  if(G.sim)return;
  const p=el('div','nx','Next: '+S.nextQ.length+' germs'+(nw>0?' · NEW '+BAL.germs[nw].n:'')+(nb?' · BOSS':'')+(miniOf(S.wave+1)>=0?' · '+STR.mini:'')+(S.quick?' · '+STR.quick:'')+(ms?' · Milestone wave!':''));if(coins)p.insertAdjacentHTML('beforeend',' · +'+coins+' '+ic('coin'));$('ovS').appendChild(p);
  countUp($('ovT'),bonus,700,'+',' energy');
  showBoosts(next);
}
function campWin(){
  const c=CAMP[G.stage],stars=1+(S.lost===0?1:0)+(S.bt<=c.fast?1:0),st=Save.d.camp.stars;st[G.stage]=Math.max(st[G.stage],stars);
  const coins=30+20*stars;Save.d.coins+=coins;S.coinsRun+=coins;Save.flush();Audio.snd('evolve');
  victory(c.n+' · +'+coins+' coins',G.stage<2?'Stage select':'Campaign',openCamp,'Home',goHome);
  const box=el('div','stg'),mk=(on,tx)=>{const d=el('div');d.insertAdjacentHTML('beforeend',ic(on?'star_glint':'star0'));d.append(el('span','',tx));d.style.background=on?'#fff1b8':'#fff';d.classList.add('starBox');return d};
  box.append(mk(true,'Stage cleared'),mk(S.lost===0,'No bacteria lost'),mk(S.bt<=c.fast,'Fast ('+c.fast+'s)'));$('ovS').appendChild(box);
}
function loseRun(){S.hp=0;S.st=ST.OVER;if(G.sim)return;Portal.setGameplay(false);Music.mood('prep');Audio.snd('lose');
  if(!S.revived&&Portal.canAd('rewarded')){ov('The Body is failing!','#e0382f','Watch a short ad to restore 50% Wall HP and clear nearby germs. Once per run, optional.','Watch ad to revive',doRevive,'No thanks',finishRun);return}
  finishRun()}
function doRevive(){Portal.request('rewarded',ok=>{if(!ok){toast(STR.noAd);finishRun();return}S.revived=true;S.hp=BAL.wallHp*.5;for(const g of S.germs)if(g.x<150){g.sh=0;g.hp=-1}S.st=ST.BATTLE;$('ov').classList.add('hidden');Portal.setGameplay(true);Music.mood(S.wave%BAL.bossEvery===0?'boss':'battle')})}
function finishRun(){let nb=false;if((G.mode==='endless'||G.mode==='daily')&&S.wave>Save.d.best){Save.d.best=S.wave;nb=true}
  if(G.daily){const k=dayKey();if(Save.d.dailyBest.day!==k||S.wave>Save.d.dailyBest.wave)Save.d.dailyBest={day:k,wave:S.wave}}
  Save.d.kills+=S.kills;Save.d.dirty=0;Save.flush();
  if(Portal.canAd('midgame'))Portal.request('midgame',()=>showDefeat(nb));else showDefeat(nb)}
function nextLab(){let b=null;for(const u of LAB){const lv=Save.d.lab[u.id];if(lv>=u.max)continue;const c=u.cost(lv);if(!b||c<b.c)b={n:u.n,c}}return b}
function showDefeat(nb){ov(STR.defeat,'#e0382f',G.mode==='camp'?CAMP[G.stage].n:'','Try again',restartRun,'Home',goHome);
  const nl=nextLab();
  $('ovS').innerHTML='<div class="stg"><div><b>'+dw()+'</b><span>Wave reached</span></div><div><b>'+S.kills+'</b><span>Germs defeated</span></div><div><b>'+Save.d.best+'</b><span>Best wave</span></div></div>'+(nb?'<span class="sticker">New best wave!</span>':'')+
   '<div class="nx">Coins this run: +'+S.coinsRun+' '+ic('coin')+(nl?' · Next in the Lab: '+nl.n+' ('+ic('coin')+' '+nl.c+', you have '+Save.d.coins+')':' · Lab fully upgraded!')+'</div>'}
/* ---- screens, transitions, settings ---- */
const show=id=>{for(const s of document.querySelectorAll('.screen'))s.classList.toggle('hidden',s.id!==id)};
function transition(fn){if(RM||G.sim){fn();return}if(G.busy)return;G.busy=true;const c=$('curtain');c.classList.remove('go');void c.offsetWidth;c.classList.add('go');   // one transition at a time: double taps never start two runs
  setTimeout(()=>{try{fn()}catch(e){console.error(e)}},225);setTimeout(()=>{c.classList.remove('go');G.busy=false},520)}
let errN=0;const onErr=()=>{if(++errN>=3&&G.scr!=='error'){G.scr='error';Portal.setGameplay(false);show('errScr');$('errB').focus()}};
addEventListener('error',onErr);addEventListener('unhandledrejection',onErr);$('errB').addEventListener('click',()=>location.reload());
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e};
const mkBtn=(txt,cls,fn)=>{const b=el('button','btn '+(cls||''),txt);b.onclick=fn;return b};
const dotIc=n=>{const d=el('div','dot');d.innerHTML=ic(n);d.style.background='#fff';return d};
function setBtnIcon(id,name){const b=$(id);if(!b||!ICON_ASSETS[name])return;const t=document.createElement('template');t.innerHTML=ic(name);const n=t.content.firstChild,cur=b.querySelector('.ic');if(cur)cur.replaceWith(n);else b.prepend(n)}
function renderHome(){const d=Save.d;setBtnIcon('hCamp','map');setBtnIcon('hDaily','cal');setBtnIcon('hLab','flask');setBtnIcon('hCodex','book');$('hBest').innerHTML=d.best?ic('crown','sIc')+'Best wave: '+d.best+(d.dailyBest.day===dayKey()?' · Daily: '+d.dailyBest.wave:''):'';$('hCoins').innerHTML=ic('coin')+'<b>'+d.coins+'</b>';
  Mis.ensure();const claim=d.dr.last!==dayKey()||d.mis.list.some(m=>m.have>=m.need&&!m.claimed);$('hToday').classList.toggle('dotOn',claim);setBtnIcon('hToday',claim?'chest_closed':'chest_open');$('hCodex').classList.toggle('dotOn',achReady());
  const nh=d.tut.done;$('hBattle').classList.toggle('hint',!nh);$('hToday').classList.toggle('hint',nh&&!d.tips.today);$('hLab').classList.toggle('hint',nh&&!d.tips.lab);$('hHelp').classList.toggle('hint',!!(nh&&!d.met.tut[11]&&!d.tips.help))}
function hideTut(){Tut.i=-1;$('tut').classList.add('hidden');$('pract').classList.add('hidden')}
function goHome(){G.paused=false;G.pend=null;hideTut();Portal.setGameplay(false);$('ov').classList.add('hidden');Music.mood('prep');transition(()=>{G.scr='home';renderHome();show('homeScr');$('hBattle').focus({preventScroll:true})})}
function applyLab(mode){const L=Save.d.lab,tt=mode==='tut';BAL.cols=tt?4:4+L.cols;BAL.startEnergy=60+(tt?0:10*L.energy);BAL.wallHp=100+(tt?0:15*L.wall);BAL.shop.free=1+(tt?0:L.reroll)}
function startRun(mode,o){o=o||{};transition(()=>{
  hideTut();if(mode!=='tut')G.pend=null;G.mode=mode;G.daily=mode==='daily';G.stage=mode==='camp'?o.stage:-1;G.theme=mode==='camp'?CAMP[G.stage].th:(mode!=='tut'&&themeOk(Save.d.theme)?Save.d.theme:'meadow');field=null;applyLab(mode);
  seedAll(mode==='daily'?daySeed(dayKey()):mode==='tut'?424242:((Math.random()*2147483647)|0));newRun();
  if(mode==='camp'){const c=CAMP[G.stage];S.off=c.off;S.wave=1+c.off;S.mulHp=c.mulHp;S.mulN=c.mulN;S.en+=c.en;startPrep()}
  if(mode==='prac'){S.wave=8;S.en=9999;startPrep()}
  G.paused=false;G.scr='game';show(null);Music.mood('prep');
  if(mode==='tut')Tut.start(o.step||0)})}
const restartRun=()=>startRun(G.mode==='tut'||G.mode==='prac'?'endless':G.mode,{stage:G.stage});
function startGame(daily){startRun(daily?'daily':'endless')}
const gate=fn=>{Audio.unlock();if(!G.fsTry){G.fsTry=1;autoFs()}if(!Save.d.tut.done){G.pend=fn;startRun('tut',{step:Save.d.tut.step|0});return}fn()};   // new players get the short tutorial first, then continue to what they picked
function openList(id,fn){fn();show(id);const b=$(id).querySelector('[data-back]');if(b)b.focus()}
const LABI={cols:'map',reroll:'reroll',energy:'bolt',wall:'shield'};
let _med=null;
const rarityOf=k=>{const u=DEF[k]&&DEF[k].unlock&&DEF[k].unlock.type;if(u==='recipe')return 'legendary';if(u==='lab')return 'epic';if(_med===null)_med=TKEYS.map(x=>TY[x].cost).sort((a,b)=>a-b)[TKEYS.length>>1]||0;return TY[k]&&TY[k].cost>_med?'rare':'common'};
function unitDot(k,show){const T=TY[k],th=show&&Art.src[k],d=el('div','dot'+(th?' art':'')+(show?' rar-'+rarityOf(k):''),show?T.L:'?');d.style.backgroundColor=show?T.col:'#dde5ee';if(th)d.style.backgroundImage='url("'+th+'")';return d}
const coinBtn=(b,n)=>{b.innerHTML=ic('coin')+'<span>'+n+'</span>';return b};
function renderLab(){$('labCoins').innerHTML=ic('coin')+'<b>'+Save.d.coins+'</b>';const L=$('labList');L.textContent='';
  for(const u of LAB){const lv=Save.d.lab[u.id],maxed=lv>=u.max,c=u.cost(lv),it=el('div','item'),g=el('div','grow');
   if(u.unit)it.appendChild(unitDot(u.unit,true));else{const d=el('div','dot');d.innerHTML=ic(LABI[u.id]||'flask');d.style.background='#fff';it.appendChild(d)}
   g.append(el('b','',u.n),el('small','',u.d));if(u.unit&&!lv)g.firstChild.insertAdjacentHTML('afterbegin',ic('key','sIc'));const pips=el('span','pips');for(let i=0;i<u.max;i++)pips.appendChild(el('i',i<lv?'on':''));g.appendChild(pips);
   const b=el('button','btn '+(maxed?'ghostBtn':'gold'));if(maxed)b.innerHTML=ic('check')+'<span>Max</span>';else coinBtn(b,c);
   b.onclick=()=>{if(maxed||Save.d.coins<c)return;Save.d.coins-=c;Save.d.lab[u.id]++;Save.flush();Audio.snd('evolve');renderLab()};b.disabled=maxed||Save.d.coins<c;it.append(g,b);L.appendChild(it)}}
function renderToday(){Mis.ensure();const box=$('todayBox');box.textContent='';const d=Save.d.dr,k=dayKey(),can=d.last!==k,ns=can?(d.last===yKey()?d.streak+1:1):d.streak;
  const it=el('div','item'),g=el('div','grow');g.append(el('b','','Daily reward · day '+((ns-1)%7+1)+' of 7'),el('small','',can?'Claim '+DR[(ns-1)%7]+' coins. A streak grows the reward for 7 days.':'Claimed. Come back tomorrow!'),Object.assign(el('small','streakTag'),{innerHTML:ic('fire_streak','sIc')+'<b>'+ns+'</b> day streak'}));{const d0=el('div','dot');d0.innerHTML=ic(can?'chest_closed':'chest_open');d0.style.background='#fff';it.appendChild(d0)}
  const b=mkBtn(can?'Claim':'Done',can?'gold':'ghostBtn',()=>{d.streak=ns;d.last=k;Save.d.coins+=DR[(ns-1)%7];Save.flush();Audio.snd('evolve');renderToday()});b.disabled=!can;it.append(g,b);box.appendChild(it);
  Save.d.mis.list.forEach((m,i)=>{const row=el('div','item'),gg=el('div','grow');gg.append(el('b','',MK[m.k].n.replace('{n}',m.need)),el('small','',m.have+' / '+m.need+' · reward '+MREW[i]+' coins'));
   const bar=el('div','mbar'),f=el('i');f.style.width=Math.round(m.have/m.need*100)+'%';bar.appendChild(f);gg.appendChild(bar);
   const cb=mkBtn(m.claimed?'Done':'Claim',m.claimed?'ghostBtn':'gold',()=>{m.claimed=true;Save.d.coins+=MREW[i];Save.flush();Audio.snd('evolve');renderToday()});cb.disabled=m.claimed||m.have<m.need;row.append(dotIc(m.claimed?'medal':'crosshair'),gg,cb);box.appendChild(row)})}
function renderCamp(){const L=$('campList');L.textContent='';const st=Save.d.camp.stars;
  CAMP.forEach((c,i)=>{const open=i===0||st[i-1]>0,it=el('div','item'+(open?'':' lock')),g=el('div','grow');g.append(el('b','',c.n),el('small','',open?'15 waves · boss every 5th · '+(i===0?'a gentle start':i===1?'tougher germs':'the final test'):'Clear the previous stage to unlock'));
   const s=el('span','stars');s.setAttribute('aria-label',st[i]+' of 3 stars');s.innerHTML=[0,1,2].map(k=>ic(k<st[i]?'star':'star0')).join('');g.appendChild(s);{const d0=el('div','dot',String(i+1));d0.style.background=open?THEMES[c.th].g:'#dde5ee';it.appendChild(d0)}
   const b=mkBtn(open?'Play':'Locked',open?'':'ghostBtn',()=>{startRun('camp',{stage:i})});if(open)b.insertAdjacentHTML('afterbegin',ic('play'));else b.insertAdjacentHTML('afterbegin',ic('lock'));b.disabled=!open;it.append(g,b);L.appendChild(it)});
  L.appendChild(el('small','','Stars: clear the stage · lose no bacteria · finish fast'))}
const openCamp=()=>{$('ov').classList.add('hidden');G.paused=false;hideTut();Portal.setGameplay(false);G.scr='home';openList('campScr',renderCamp)};
let codexTab='bac';
function renderCodex(){renderCodex0();const L=$('codexList');let cur='bac';for(const c of [...L.children]){if(c.tagName==='H3')cur=/^Germs/.test(c.textContent)?'germ':'bac';c.hidden=cur!==codexTab}
  let bar=$('codexTabs');if(!bar){bar=el('div','tabPair');bar.id='codexTabs';bar.setAttribute('role','tablist');for(const[k,t]of[['bac',STR.load.tabBac],['germ',STR.load.tabGerm]]){const b=mkBtn(t,'ghostBtn',()=>{codexTab=k;renderCodex()});b.dataset.tab=k;b.setAttribute('role','tab');bar.appendChild(b)}L.parentNode.insertBefore(bar,L)}
  for(const b of bar.children)b.setAttribute('aria-selected',b.dataset.tab===codexTab)}
function renderCodex0(){const L=$('codexList'),sc=L.scrollTop;L.textContent='';const SI={Bacteria:'dna',Germs:'skull',Achievements:'medal',Evolutions:'crown','Recipes and synergies':'magnifier','Field styles':'map'},sec=t=>{const h=el('h3','',t);if(SI[t])h.insertAdjacentHTML('afterbegin',ic(SI[t]));L.appendChild(h)};sec('Bacteria');
  for(const k of TKEYS){const T=TY[k],D=DEF[k],open=owned(k),it=el('div','item'+(open?'':' lock')),g=el('div','grow');   // every roster entry appears here automatically
   g.append(el('b','',open?T.n+(D.role?' · '+D.role:''):'???'),el('small','',open?D.desc:D.unlock.type==='recipe'?'Discover by merging two different bacteria.':'Unlock in the Lab.'));
   if(open){const st=el('div','stats'),add=t=>st.appendChild(el('span','',t));if(D.unlock.type!=='recipe')add('Cost '+T.cost);if(T.dmg)add('Damage '+T.dmg);if(T.range)add('Range '+T.range);add((D.attack==='support'?'Pulse ':'Attacks ')+(1/T.cd).toFixed(2)+'/s');add('HP ×'+T.hp);if(Art.miss[k])add('Art missing');g.appendChild(st)}
   it.append(unitDot(k,open),g);L.appendChild(it)}
  sec('Evolutions');
  for(const k of['rapid','frost']){const E=BAL.evo[k],open=!!Save.d.cx.e[k],it=el('div','item'+(open?'':' lock')),d=el('div','dot',open?E.n[0]:'?');d.style.background=open?(k==='rapid'?'#facc15':'#a78bfa'):'#ddd';
   const g=el('div','grow');g.append(el('b','',open?E.n:'???'),el('small','',open?E.d+'. Chosen at level '+BAL.evoAt.join(' and ')+'.':'Reach level '+BAL.evoAt[0]+' with any bacteria and pick this form.'));it.append(d,g);L.appendChild(it)}
  sec('Germs');
  BAL.germs.forEach((T,i)=>{if(T.hid)return;const open=!!Save.d.cx.g[i],it=el('div','item'+(open?'':' lock')),d=el('div','dot germArt','');d.style.backgroundColor=open?T.c:'#ddd';d.style.borderRadius='50%';if(open){const art=GermArt.src(i,S.wave);if(art)d.style.backgroundImage='url("'+art+'")'}
   const g=el('div','grow');g.append(el('b','',open?T.n:'???'),el('small','',open?T.tip:'Not met yet.'));it.append(d,g);L.appendChild(it)});
  sec('Recipes and synergies');for(const rc of Roster.recipes){const on=!!Save.d.cx.r[rc.out],r=el('div','item'+(on?'':' lock'));const g=el('div','grow');g.append(el('b','',on?TY[rc.a].n+' + '+TY[rc.b].n+' = '+DEF[rc.out].short:'???'),el('small','',on?'Same level, drop one on the other.':'Try merging two different bacteria of the same level.'));r.appendChild(g);L.appendChild(r)}
  const sp=BAL.stack.slice(2).map(v=>Math.round(v*100)).join(' / ')+'%';
  for(const[n,t]of[['Column Stack','Same column, 2 / 3 / 4+ bacteria: +'+sp+' fire rate.'],['Row Focus',BAL.rowMin+' or more in one row: bullets pierce +'+BAL.rowPierce+'.'],['Hunter Mark','A Bifido next to a Lactobacillus marks germs for bonus damage.'],['Healing touch','A Healer heals its neighbours and slowly repairs the Wall.'],['Taunt','Guardian Spore pulls nearby germs toward itself.']]){const it=el('div','item'),gg=el('div','grow');gg.append(el('b','',n),el('small','',t));it.appendChild(gg);L.appendChild(it)}
  sec('Field styles');
  for(const k of Object.keys(THEMES)){const i=CAMP.findIndex(c=>c.th===k),open=themeOk(k),on=(Save.d.theme||'meadow')===k,it=el('div','item'+(open?'':' lock')),d=el('div','dot','');d.style.background='linear-gradient(90deg,'+THEMES[k].g+' 50%,'+THEMES[k].rd+' 50%)';
   const gg=el('div','grow');gg.append(el('b','',THN[k]),el('small','',open?'Looks only. Used in Endless and Daily.':'Clear '+CAMP[i].n+' in the Campaign to unlock.'));
   const b=mkBtn(on?'Selected':'Use','',()=>{Save.d.theme=k;Save.flush();renderCodex()});b.disabled=!open||on;it.append(d,gg,b);L.appendChild(it)}
  sec('Achievements');
  for(const a of ACH){const v=Math.min(a.need,a.v()),done=!!Save.d.ach[a.id],ok=v>=a.need,it=el('div','item'+(ok||done?'':' lock')),gg=el('div','grow');gg.append(el('b','',a.n),el('small','',a.d+' · '+v+' / '+a.need));
   const bar=el('div','mbar'),f=el('i');f.style.width=Math.round(v/a.need*100)+'%';bar.appendChild(f);gg.appendChild(bar);
   const b=mkBtn(done?'Done':String(a.r),done?'ghostBtn':'gold',()=>{if(Save.d.ach[a.id]||a.v()<a.need)return;Save.d.ach[a.id]=1;Save.d.coins+=a.r;Save.flush();Audio.snd('evolve');renderCodex()});if(!done)b.insertAdjacentHTML('afterbegin',ic('coin'));b.disabled=done||!ok;it.append(dotIc(done?'medal':ok?'trophy':'lock'),gg,b);L.appendChild(it)}
  L.scrollTop=sc}
const CHAPS=[['Place, merge and stack',0,'merge'],['Battle and 180° guns',3,'battle'],['Abilities',4,'hide'],['Boosts and shop',8,'cards'],['New germs',10,'horde'],['Boss fight',11,'boss']];
const DEMOS={merge:'<i class="a">1</i><i class="b2">1</i><i class="c">2</i>',battle:'<i style="left:.3rem;top:1.05rem"></i><span class="bl"></span><b style="top:1.2rem"></b><b style="top:.5rem;animation-delay:-1s"></b>',
 hide:'<i style="left:2.1rem;top:1rem"></i><span class="bub"></span><b style="top:1.2rem"></b>',cards:'<i class="k1"></i><i class="k2"></i><i class="k3"></i>',
 horde:'<b style="top:.2rem"></b><b style="top:.9rem;animation-delay:-.5s"></b><b style="top:1.6rem;animation-delay:-1s"></b><b style="top:2.3rem;animation-delay:-1.5s"></b><b style="top:1.2rem;animation-delay:-.2s"></b>',
 boss:'<b class="big"></b><span class="hpb"><u></u></span>'};
const demoEl=k=>{const d=el('div','demo d-'+k);d.setAttribute('aria-hidden','true');d.innerHTML=DEMOS[k]||'';return d};
function renderHelp(){const L=$('helpList');L.textContent='';
  const full=el('div','item'),g0=el('div','grow');g0.append(el('b','','Full tutorial'),el('small','',Save.d.tut.done?'Replay everything (about 3 minutes).':'Start here! You cannot lose.'));full.append(g0,mkBtn('Play','gold',()=>startRun('tut',{step:0})));full.prepend(Object.assign(el('div','dot'),{innerHTML:ic('help')}));L.appendChild(full);
  for(const[n,s,dk]of CHAPS){const it=el('div','item'),g=el('div','grow');g.append(el('b','',n),el('small','',Save.d.tut.done?'Replay this chapter':'Finish the tutorial first'));const b=mkBtn('Play','',()=>startRun('tut',{step:s}));b.disabled=!Save.d.tut.done;it.append(demoEl(dk),g,b);L.appendChild(it)}
  const pr=el('div','item'),gp=el('div','grow');gp.append(el('b','','Practice mode'),el('small','','Infinite energy. Spawn any germ and test your formation.'));pr.append(gp,mkBtn('Play','gold',()=>startRun('prac')));pr.prepend(Object.assign(el('div','dot'),{innerHTML:ic('swords')}));L.appendChild(pr);
  const tp=el('div','item'),gt=el('div','grow');gt.append(el('b','','First-time tips'),el('small','','Small tip cards appear once when you meet a new idea.'));tp.append(gt,mkBtn('Show again','',()=>{Save.d.tips={};Save.flush();toast('Tips will show again')}));L.appendChild(tp)}
/* ---- tutorial: spotlight, pointing hand, mascot; teaches by doing; cannot be lost; no ads ---- */
const TUT=[
 {t:'Place',p:'Drag a bacteria from the Lab onto a cell. Tapping the Lab and then a cell works too.',spot:{sel:'.offer[data-i="0"]'},from:{sel:'.offer[data-i="0"]'},to:{cell:[0,2]},ok:()=>units()>=1},
 {t:'Merge',p:'Buy another and drop it on the first one. Equal bacteria merge into a stronger one!',spot:{cell:[0,2]},from:{sel:'.offer[data-i="0"]'},to:{cell:[0,2]},ok:()=>S.grid.some(r=>r.some(u=>u&&u.lvl>=2))},
 {t:'Stack',p:'Now put one in the same column. A stack gives every member a fire rate bonus!',spot:{cell:[0,1]},from:{sel:'.offer[data-i="0"]'},to:{cell:[0,1]},ok:()=>S.stack>=2},
 {t:'Battle',p:'Press BATTLE! The grid vanishes and germs charge from the right. Your bacteria shoot anything in front of them, up to 180 degrees.',spot:{sel:'#go'},at:{sel:'#go'},ok:()=>S.st===ST.BATTLE},
 {t:'Zap',p:'Tap germs to zap them yourself.',spot:{area:[.4,.2,.5,.6]},ok:()=>S.zaps>=2},
 {t:'Bomb',p:'The Probiotic Bomb sweeps the whole field. Tap it!',spot:{sel:'#bomb'},at:{sel:'#bomb'},ok:()=>S.bcd>0,on:()=>{S.en+=60}},
 {t:'Hide',p:'One bacteria is hurt! Tap it to wrap it in a protective biofilm for a moment.',spot:{cell:[0,2]},at:{cell:[0,2]},ok:()=>S.hideC<BAL.hide.charges+S.bf.hideCh,on:()=>{const u=S.grid[2][0]||S.grid.flat().find(Boolean);if(u)u.hp=u.mhp*.25}},
 {t:'Hold the line',p:'Keep shooting until every germ is gone.',ok:()=>S.st===ST.RESULT||S.wave>=2},
 {t:'Boost',p:'Pick a boost card. It lasts for the whole run!',spot:{sel:'#ovS'},ok:()=>S.picked.length>=1},
 {t:'Shop',p:'Not happy with the offers? Reroll the Lab shop.',spot:{sel:'#rr'},at:{sel:'#rr'},ok:()=>S.rerolled>=1,on:()=>{S.freeRR=1}},
 {t:'New germs',p:'New germs show up as waves grow. Read the info card, press BATTLE, win, then pick a boost.',spot:{sel:'#go'},ok:()=>S.wave>=3},
 {t:'Boss',p:'A boss wave! Mega Staph has huge HP. Press BATTLE, focus fire, zap it and use the Bomb. It cannot beat you here.',spot:{sel:'#go'},ok:()=>S.wave>=6||(S.st===ST.RESULT&&S.wave>=5),on:()=>{for(const g of S.germs)poolG.push(g);S.germs.length=0;for(const x of S.bul)poolB.push(x);S.bul.length=0;S.bomb=null;S.rallyT=0;drag=null;S.nextQ=null;S.wave=5;startPrep()}},
 {t:'Ready',p:'',ok:()=>false}];
function trect(t){if(!t)return null;const st=$('stage').getBoundingClientRect(),s=st.width/BAL.LW;
  if(t.sel){const e=document.querySelector(t.sel);if(!e)return null;const r=e.getBoundingClientRect();return r.width?{x:r.left-st.left,y:r.top-st.top,w:r.width,h:r.height}:null}
  if(t.cell)return{x:cellX(t.cell[0])*s,y:cellY(t.cell[1])*s,w:BAL.cell*s,h:BAL.cell*s};
  if(t.area)return{x:t.area[0]*st.width,y:t.area[1]*st.height,w:t.area[2]*st.width,h:t.area[3]*st.height};return null}
let tutKbShown=false;
const Tut={i:-1,d:0,
 start(step){this.d=0;$('tmas').src=ART_SRC[0];const sk=$('tskip');sk.classList.remove('hidden');delete sk.dataset.sure;sk.textContent='Skip';   // always skippable; a first-time player confirms with a second tap

  const give=()=>{S.grid[2][0]=mk('shoot',12,2);S.grid[1][0]=mk('shoot',12);S.grid[3][0]=mk('snipe',16);syn()};
  if(step>=3)give();if(step>=4&&step<8){S.en=200;this.i=step;startBattle()}
  if(step>=8&&step<10){S.st=ST.RESULT;this.i=step;winUI(8)}if(step>=10){S.wave=step>=11?5:2;startPrep()}
  this.go(step)},
 txt(s,i){$('tt').textContent=(i+1)+'/'+(TUT.length-1)+' · '+s.t;$('tp').textContent=(STR.tut[s.t]||s.p)+(G.kb&&STR.tutKb[s.t]?' '+STR.tutKb[s.t]:'')},
 go(i){this.i=i;this.d=0;const s=TUT[i];if(i>=TUT.length-1){this.finish(false);return}
  this.txt(s,i);if(!Save.d.tut.done&&BAL.tutResume.includes(i)&&i>0&&Save.d.tut.step<i){Save.d.tut.step=i;Save.flush()}   // chapter reached: resume here next launch
  $('tut').classList.remove('hidden');const m=Save.d.met.tut;m[i]=(m[i]||0)+1;if(s.on)s.on()},
 finish(skipped){const first=!Save.d.tut.done;Save.d.tut.done=true;Save.d.tut.step=0;if(first&&!skipped)Save.d.coins+=25;Save.flush();hideTut();const p=G.pend;G.pend=null;
  if(skipped){Portal.setGameplay(false);G.paused=false;$('ov').classList.add('hidden');if(p)p();else goHome();return}Portal.setGameplay(false);
  ov('You are ready!','#d99a00',STR.tutDone+(first?' +25 coins':''),p?'Continue':'Play Endless',p||(()=>startRun('endless')),'Home',goHome)},
 tick(dt){if(this.i<0||this.i>=TUT.length)return;const s=TUT[this.i];if(tutKbShown!==G.kb){tutKbShown=G.kb;this.txt(s,this.i)}
  const sp=$('spot'),h=$('hand'),r=s.spot&&trect(s.spot);if(r){sp.style.cssText='display:block;left:'+(r.x-4)+'px;top:'+(r.y-4)+'px;width:'+(r.w+8)+'px;height:'+(r.h+8)+'px'}else sp.style.display='none';
  {const ar=$('tArrow');if(ar){if(r){const up=r.y<64;ar.style.cssText='display:block;left:'+(r.x+r.w/2)+'px;top:'+(up?r.y+r.h+6:r.y-6)+'px';ar.classList.toggle('down',up)}else ar.style.display='none'}}
  const a=trect(s.from||s.at),b=trect(s.to||s.at);if(a&&b){const hw=h.offsetWidth||36;h.style.display='block';h.style.setProperty('--x0',(a.x+a.w/2-hw*.36)+'px');h.style.setProperty('--y0',(a.y+a.h/2-hw*.06)+'px');h.style.setProperty('--x1',(b.x+b.w/2-hw*.36)+'px');h.style.setProperty('--y1',(b.y+b.h/2-hw*.06)+'px')}else h.style.display='none';
  if(s.ok()){this.d+=dt;if(this.d>.45)this.go(this.i+1)}else this.d=0}};
$('tskip').addEventListener('click',()=>{const b=$('tskip');if(!Save.d.tut.done&&!b.dataset.sure){b.dataset.sure='1';b.textContent='Skip? Tap again';clearTimeout(b._t);b._t=setTimeout(()=>{delete b.dataset.sure;b.textContent='Skip'},2600);return}clearTimeout(b._t);Tut.finish(true)});
for(const b of document.querySelectorAll('[data-back]'))b.addEventListener('click',()=>{show('homeScr');renderHome();$('hBattle').focus({preventScroll:true})});
for(const b of document.querySelectorAll('[data-back],#sBack')){const card=b.closest('.card');if(!card)continue;const x=document.createElement('button');x.className='xClose';x.type='button';x.setAttribute('aria-label','Close');x.addEventListener('click',()=>b.click());card.appendChild(x)}
$('hBattle').addEventListener('click',()=>gate(()=>startRun('endless')));$('hDaily').addEventListener('click',()=>gate(()=>startRun('daily')));
$('hCamp').addEventListener('click',()=>gate(openCamp));$('hLab').addEventListener('click',()=>{Audio.unlock();Save.d.tips.lab=1;Save.flush();openList('labScr',renderLab)});
$('hToday').addEventListener('click',()=>{Audio.unlock();Save.d.tips.today=1;Save.flush();openList('todayScr',renderToday)});$('hCodex').addEventListener('click',()=>{Audio.unlock();openList('codexScr',renderCodex)});$('hHelp').addEventListener('click',()=>{Audio.unlock();Save.d.tips.help=1;Save.flush();openList('helpScr',renderHelp)});
{const P=$('pract');BAL.germs.forEach((T,i)=>{if(T.hid)return;const b=mkBtn(T.n.split(' ')[0]+(T.boss?'':' ×10'),'',()=>{if(S.st!==ST.BATTLE)return;for(let k=0;k<(T.boss?1:10);k++)spawnG(i,BAL.spawnX+Math.random()*60,BAL.roadY0+14+Math.random()*(BAL.roadY1-BAL.roadY0-28))});b.style.background=T.c;P.appendChild(b)});const mb=mkBtn('Mini-boss','',()=>{if(S.st===ST.BATTLE)spawnG(BAL.mini.list[0],BAL.spawnX+20,(BAL.roadY0+BAL.roadY1)/2,true)});mb.style.background='#ffd23f';P.appendChild(mb)}
function applySettings(){Audio.user=Save.d.muted;Audio.apply();RM=Save.d.reduced===null?SYS_RM:Save.d.reduced;document.documentElement.classList.toggle('rm',RM);
  const set=(id,on,a,b)=>{$(id).setAttribute('aria-pressed',on);$(id).innerHTML=(id==='sSound'?ic(on?'sound':'mute'):'')+'<span>'+(on?a:b)+'</span>'};set('sSound',!Save.d.muted,'On','Off');set('sRm',RM,'On','Off');$('sSfx').value=Save.d.sfx;$('sMus').value=Save.d.music;for(const[id,on]of[['sShake',!Save.d.shakeOff],['sParts',!Save.d.partsLow]]){const b=$(id);if(b){b.setAttribute('aria-checked',on);b.classList.toggle('on',on)}}}

$('hSet').addEventListener('click',()=>{show('setScr');$('sBack').focus()});$('sBack').addEventListener('click',()=>{show('homeScr');renderHome();$('hBattle').focus({preventScroll:true})});
$('sSound').addEventListener('click',()=>{Save.d.muted=!Save.d.muted;applySettings();Save.flush()});
$('sSfx').addEventListener('input',e=>{Save.d.sfx=num(e.target.value,0,1,.8);Audio.apply();Audio.snd('click');Save.flush()});$('sMus').addEventListener('input',e=>{Save.d.music=num(e.target.value,0,1,.6);Audio.apply();Save.flush()});
$('sRm').addEventListener('click',()=>{Save.d.reduced=!RM;applySettings();Save.flush()});
$('sShake').addEventListener('click',()=>{Save.d.shakeOff=!Save.d.shakeOff;applySettings();Save.flush()});
$('sParts').addEventListener('click',()=>{Save.d.partsLow=!Save.d.partsLow;applySettings();Save.flush()});
$('sReset').addEventListener('click',()=>{const b=$('sReset'),t=b.querySelector('span');if(!b.dataset.sure){b.dataset.sure='1';t.textContent=STR.load.sure;clearTimeout(b._t);b._t=setTimeout(()=>{delete b.dataset.sure;t.textContent=STR.load.reset},3000);return}
  for(const k of['bd.save.v7','bd.save.v6','bd.save.v5','bd.save.v4','bd.save.v3']){try{localStorage.removeItem(k)}catch(e){}try{const a=Portal.data();if(a&&a.removeItem)a.removeItem(k)}catch(e){}}
  Save.mem=null;Save.flush=()=>{};location.reload()});$('sFs').addEventListener('click',fsToggle);$('sFsRow').classList.toggle('hidden',!document.fullscreenEnabled);
addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('setScr').classList.contains('hidden'))$('sBack').click()});
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('.btn,.iconBtn,.abil'))Audio.snd('click')});
/* ---- loading screen: abstract cells / membranes / particles only (no characters). Progress comes from real tasks; it never blocks. ---- */
const LoadFX={on:false,raf:0,t0:0,w:0,h:0,pat:null,parts:[],blobs:[],
 start(){const c=$('lbg');if(!c)return;this.c=c;this.g=c.getContext('2d');this.on=true;this.t0=performance.now();this._r=()=>this.fit();addEventListener('resize',this._r);this.fit();
  for(let i=0;i<36;i++)this.parts.push(this.mk(true));for(let i=0;i<6;i++)this.blobs.push({x:Math.random(),y:.15+Math.random()*.6,r:40+Math.random()*70,v:(Math.random()-.5)*.012,ph:Math.random()*6.28});
  const f=()=>{if(!this.on)return;this.draw();if(!RM)this.raf=requestAnimationFrame(f)};f()},
 stop(){if(!this.on)return;this.on=false;cancelAnimationFrame(this.raf);removeEventListener('resize',this._r);this.parts.length=0;this.blobs.length=0;this.pat=null;if(this.c){this.c.width=1;this.c.height=1}},
 fit(){const d=Math.min(1.5,devicePixelRatio||1);this.w=innerWidth;this.h=innerHeight;this.c.width=Math.round(this.w*d);this.c.height=Math.round(this.h*d);this.g.setTransform(d,0,0,d,0,0);if(RM)this.draw()},
 mk(init){const big=Math.random()<.35;return{x:Math.random()*(this.w||800),y:init?Math.random()*(this.h||600):(this.h||600)+20,r:big?4+Math.random()*8:1.5+Math.random()*2.5,v:14+Math.random()*30,ph:Math.random()*6.28,big,c:Math.random()<.5?'#ffd23f':'#ff8f9c'}},
 tile(){const S=240,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');let sd=11;const rn=()=>(sd=sd*16807%2147483647)/2147483647,n=4,cs=S/n;   // seamless tissue tile: organic rounded cells with nuclei
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){const x0=(i+.5+(rn()-.5)*.3)*cs,y0=(j+.5+(rn()-.5)*.3)*cs,R=cs*.37,m=8,pts=[];for(let k=0;k<m;k++){const a=k/m*6.283,q=R*(.84+rn()*.2);pts.push([Math.cos(a)*q,Math.sin(a)*q])}
   for(const ox of[-S,0,S])for(const oy of[-S,0,S]){const x=x0+ox,y=y0+oy;if(x<-cs||x>S+cs||y<-cs||y>S+cs)continue;g.beginPath();
    for(let k=0;k<m;k++){const p=pts[k],q=pts[(k+1)%m],mx=x+(p[0]+q[0])/2,my=y+(p[1]+q[1])/2;if(!k){const z=pts[m-1];g.moveTo(x+(z[0]+p[0])/2,y+(z[1]+p[1])/2)}g.quadraticCurveTo(x+p[0],y+p[1],mx,my)}g.closePath();
    g.fillStyle='rgba(255,255,255,.12)';g.fill();g.lineWidth=3;g.strokeStyle='rgba(22,33,62,.09)';g.stroke();g.beginPath();g.arc(x+R*.2,y-R*.12,R*.24,0,6.283);g.fillStyle='rgba(255,255,255,.16)';g.fill()}}
  return this.g.createPattern(c,'repeat')},
 wave(base,amp,len,sp,t,fill,top){const g=this.g,w=this.w;g.beginPath();g.moveTo(-10,top?-10:this.h+10);for(let x=-10;x<=w+30;x+=24)g.lineTo(x,base+Math.sin(x/len+t*sp)*amp+Math.sin(x/(len*.47)-t*sp*1.4)*amp*.35);g.lineTo(w+30,top?-10:this.h+10);g.closePath();g.fillStyle=fill;g.fill();g.lineWidth=4;g.strokeStyle=K;g.stroke()},
 draw(){const g=this.g,w=this.w,h=this.h,t=RM?0:(performance.now()-this.t0)/1000;if(!g||!w)return;g.clearRect(0,0,w,h);if(!this.pat)this.pat=this.tile();
  g.save();g.globalAlpha=.9;const o1=(t*7)%240,o2=(t*4)%240;g.translate(-o1,-o2);g.fillStyle=this.pat;g.fillRect(o1,o2,w,h);g.restore();
  g.save();g.globalAlpha=.55;g.scale(1.9,1.9);const o3=(t*11)%240;g.translate(o3,-o3*.4);g.fillStyle=this.pat;g.fillRect(-o3,o3*.4,w/1.9+2,h/1.9+2);g.restore();   // parallax layer
  for(const b of this.blobs){const x=((b.x+t*b.v)%1.2+1.2)%1.2*w-b.r,y=b.y*h+Math.sin(t*.6+b.ph)*12,r=b.r*(1+Math.sin(t*.9+b.ph)*.04);g.beginPath();g.arc(x,y,r,0,6.283);g.fillStyle='rgba(255,255,255,.1)';g.fill();g.lineWidth=3;g.strokeStyle='rgba(22,33,62,.12)';g.stroke();g.beginPath();g.arc(x+r*.25,y-r*.2,r*.3,0,6.283);g.fillStyle='rgba(255,255,255,.12)';g.fill()}
  {const v=g.createRadialGradient(w/2,h*.46,Math.min(w,h)*.25,w/2,h*.5,Math.max(w,h)*.75);v.addColorStop(0,'rgba(13,30,50,0)');v.addColorStop(1,'rgba(13,21,48,.55)');g.fillStyle=v;g.fillRect(0,0,w,h)}   // soft vignette
  for(const p of this.parts){p.y-=p.v*(RM?0:1/60);p.x+=Math.sin(t*1.3+p.ph)*.25;if(p.y<-20)Object.assign(p,this.mk(false));g.beginPath();g.arc(p.x,p.y,p.r,0,6.283);
   if(p.big){g.fillStyle='rgba(255,255,255,.28)';g.fill();g.lineWidth=2;g.strokeStyle='rgba(22,33,62,.4)';g.stroke();g.beginPath();g.arc(p.x-p.r*.35,p.y-p.r*.35,p.r*.28,0,6.283);g.fillStyle='rgba(255,255,255,.85)';g.fill()}
   else{g.fillStyle=p.c;g.fill();g.lineWidth=1.4;g.strokeStyle=K;g.stroke()}}}};
function bakeMascots(){const box=$('mas');if(!box||box.childElementCount)return Promise.resolve();   // the four existing mascot illustrations, outlined once
  return Promise.all(ART_SRC.map(src=>Art.load(src,6000).then(im=>{if(!im)return null;const B=Art.bake(im,im.naturalWidth,im.naturalHeight);B.c.setAttribute('aria-hidden','true');return B.c}))).then(L=>{for(const c of L)if(c)box.appendChild(c)})}

/* ---- loading scene: the seven Lv8 heroes line up, a mascot runs along the progress bar, tips rotate ---- */
const LoadScene={tm:0,
 start(){const box=$('lHeroes'),run=$('lRun'),tip=$('lTip'),L=STR.load;if(!box)return;
  Object.keys(UNIT_SRC).forEach((k,i)=>Art.load(UNIT_SRC[k][UNIT_SRC[k].length-1],8000).then(im=>{if(!im)return;const e=new Image();e.src=im.src;e.alt='';e.className='lHero';e.style.order=i;e.style.setProperty('--i',i);box.appendChild(e)}));
  if(run)Art.load('assets/mascot/mascot_wave.png',6000).then(im=>{if(im){run.src=im.src;run.classList.add('on')}});
  if(tip){let n=(Math.random()*L.tips.length)|0;const set=()=>{tip.textContent=L.tips[n++%L.tips.length]};set();if(!RM)this.tm=setInterval(()=>{tip.style.opacity=0;setTimeout(()=>{set();tip.style.opacity=1},220)},3200)}},
 stop(){clearInterval(this.tm)}};
async function boot(){
  document.documentElement.classList.toggle('rm',RM);$('healC').textContent=BAL.heal.cost;$('bombC').textContent=BAL.bomb.cost;
  if(!Roster.defs.length){$('errP').textContent='No valid bacteria were found in the roster (BD_BACTERIA). Check the browser console for details.';G.scr='error';show('errScr');return}
  LoadFX.start();LoadScene.start();
  const W={sdk:20,save:4,font:8,art:38,ui:10,field:12,audio:4,frame:8},P={};let total=0;for(const k in W){total+=W[k];P[k]=0}
  const MSG=[['save','Restoring your progress…'],['sdk','Initializing defense systems…'],['font','Calibrating the microscope…'],['art','Culturing the good bacteria…'],['ui','Polishing the lab…'],['field','Preparing the battlefield…'],['audio','Tuning the lab equipment…'],['frame','Final checks…']];
  const t0=performance.now(),fill=$('lFill'),pct=$('lPct'),stat=$('lStat'),bar=$('lBar'),runEl=$('lRun');let fin=false,msg='';
  const task=async(k,fn)=>{try{await fn()}catch(e){dbg('task',k,e)}P[k]=1};
  const now=()=>{let p=0;for(const k in W)p+=W[k]*Math.min(1,P[k]);return p/total*100};
  const cap=setTimeout(()=>{for(const k in P)P[k]=1},12000);   // hard cap: a slow network or a missing file can never trap the player here
  const pump=()=>{if(fin)return;if(Art.tot&&P.art<1)P.art=Math.max(P.art,Art.n/Art.tot*.96);const target=now();G.disp+=Math.max(Math.min(target-G.disp,.6+(target-G.disp)*.16),0);if(target>=100&&G.disp>99.4)G.disp=100;
   const v=Math.min(100,G.disp);fill.style.width=v.toFixed(1)+'%';runEl.style.left=v.toFixed(1)+'%';const n=Math.floor(v);if(pct._n!==n){pct._n=n;pct.textContent=n+'%';bar.setAttribute('aria-valuenow',n)}
   const m=v>=99.5?'Ready!':(MSG.find(([k])=>P[k]<1)||['','Final checks…'])[1];if(m!==msg){msg=m;stat.style.opacity=0;setTimeout(()=>{stat.textContent=msg;stat.style.opacity=1},140)}
   if(v>=100&&performance.now()-t0>=900){fin=true;clearTimeout(cap);done()}else requestAnimationFrame(pump)};
  requestAnimationFrame(pump);
  const done=()=>{Portal.loadingStop();const ls=$('loadScr'),go=$('lGo');ls.classList.add('done');stat.textContent='Ready!';
    if(!go){setTimeout(enterHome,RM?0:320);return}
    go.classList.add('show');try{go.focus({preventScroll:true})}catch(e){}
    let used=false;go.addEventListener('click',()=>{if(used)return;used=true;go.disabled=true;Audio.unlock();enterHome()})};   // the tap also unlocks browser audio
  const pInit=Portal.init().then(()=>Portal.loadingStart());          // loadingStart fires the moment the SDK is ready
  await Promise.all([task('sdk',()=>pInit),task('save',()=>{Save.load();Mis.ensure();applySettings()}),
    task('font',()=>withTimeout(document.fonts&&document.fonts.load?document.fonts.load("700 20px 'BD Grotesk'"):0,3000)),
    task('art',()=>withTimeout(Promise.all([Art.ready,GermArt.ready,FieldArt.ready,WeaponArt.ready,FxArt.ready,ImpactArt.ready,bakeMascots()]),9000).then(()=>{field=null})),task('ui',()=>withTimeout(UIKit.init(),9000)),task('field',()=>{resize();bake()}),task('audio',()=>Audio.prep())]);
  await task('frame',()=>{resize();ctx.setTransform(cv.width/BAL.LW,0,0,cv.width/BAL.LW,0,0);draw()});
}
function enterHome(){   // the loading screen irises out onto the existing main menu; it is never shown again this session
  const ls=$('loadScr'),hs=$('homeScr');G.scr='home';renderHome();Music.mood('menu');hs.classList.remove('hidden');
  const end=()=>{ls.classList.add('hidden');ls.classList.remove('exit');hs.classList.remove('late');LoadFX.stop();LoadScene.stop()};
  if(RM){end()}else{hs.classList.add('late');ls.classList.add('exit');setTimeout(end,680)}
  $('hBattle').focus({preventScroll:true})}
const unlockAudio=()=>{Audio.unlock();if(Audio.ctx){Music.start();if(Audio.ctx.state==='running')for(const t of['pointerdown','pointerup','keydown'])removeEventListener(t,unlockAudio,true)}};   // audio starts with the first real gesture anywhere
for(const t of['pointerdown','pointerup','keydown'])addEventListener(t,unlockAudio,true);
newRun();resize();requestAnimationFrame(frame);boot();
})();
