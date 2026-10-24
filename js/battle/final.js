// ラスボス戦(魔王)のロジック: クラスチェンジ・カード使用・形態変化・5%の場面・復活
// データと台本は js/data/final.js。engine.js の startBattle / enemyAct / checkEnd から呼ばれる。
// =====================================================================
//  流れ(docs/ストーリー.md「第4章 ラスボス戦」)
//   第一形態: 毎ターン グラ/マッショ/ドクトルに クラスチェンジし、そのクラスのカードを1枚ランダムに使う
//   HP0 → 仮面にヒビ → 仮面が半分くだけ 正体判明 → 回想 → 第二形態(おたがいHP全回復・デッキ最初から)
//   第二形態: 毎ターン クラスチェンジ + 2枚を「融合」したカードを使う。HPは 5% で止まる
//   5% → 闇の剣でいこあんのHPが0 → 精霊アルカの問い(はい/いいえ) → ザ・デュエリストで復活
//   → 手札に光の剣が1枚だけ出る → 999ダメージで勝利
// =====================================================================
const FINAL_CLASSES = ['gladiator', 'macho', 'doctor'];
const CLS_AURA = {gladiator:'216,72,78', macho:'224,138,32', doctor:'63,168,96'};
const sceneEntry = def => ({async: done => openScene(def, done)});

// ---- 戦闘のはじまり ----
function finalInit(e){
  const b = battle;
  b.bgList = ['bg/final.png'];
  e.form = 1; e.floorHp = 0; e.power = FINAL.form1.power; e.cls = null; e.tag = ''; e.aura = '150,90,230';
  // テスト用(?start=ch4_throne&form=2 / &bosshp=0.06): 本編では使われない
  if (typeof PRESET_NAME !== 'undefined' && PRESET_NAME) {
    if (URL_Q.get('form') === '2') finalStartForm2(e, true);
    const r = parseFloat(URL_Q.get('bosshp'));
    if (r > 0 && r < 1) e.hp = e.dispHp = Math.max(e.floorHp + 1, Math.ceil(e.maxHp * r));
  }
}

// ---- 魔王の行動: クラスチェンジ + カード ----
function finalActEntries(e){
  const b = battle;
  const others = FINAL_CLASSES.filter(c => c !== e.cls), cls = others[rnd(0, others.length-1)];
  const pool = Object.keys(CARDS).filter(id => CARDS[id].cls === cls);
  const list = [{text:`魔王は「${CLASSES[cls].name}」に クラスチェンジした！`, fn:()=>{
    e.cls = cls; e.aura = CLS_AURA[cls]; b.flashRGB = CLS_AURA[cls]; b.flash = 350; }}];
  if (e.form === 2) {                                           // 第二形態: 同じクラスの2枚を融合した強力なカード
    const i = rnd(0, pool.length-1); let j = rnd(0, pool.length-2); if (j >= i) j++;
    list.push(...enemyCardEntries(e, fuseCards(CARDS[pool[i]], CARDS[pool[j]]), true));
  } else list.push(...enemyCardEntries(e, CARDS[pool[rnd(0, pool.length-1)]], false));
  let rg = 0, hp = 0, p = 0;
  list.push({text:null, fn:checkEnd},
    {text:()=>{ rg = (e.regen>0 && e.hp>0 && hero.hp>0) ? Math.min(e.regen, e.maxHp-e.hp) : 0; return rg>0 ? `魔王は リジェネで HPが ${rg} かいふくした！` : null; },
     fn:()=>{ if (rg>0) { e.hp += rg; pop(e.x, 70, '+'+rg, '#80ff90'); } }},
    {text:()=>{ hp = (b.heroPoison>0 && hero.hp>0 && e.hp>0) ? b.heroPoison : 0; return hp>0 ? `いこあんは どくで ${hp}の ダメージ！` : null; },
     fn:()=>{ if (hp>0) { hitHero(hp); b.heroPoison = Math.max(0, b.heroPoison-1); } }},
    {text:null, fn:checkEnd},
    {text:()=>{ p = (e.poison>0 && e.hp>0 && hero.hp>0) ? e.poison : 0; return p>0 ? `魔王は どくで ${p}の ダメージ！` : null; },
     fn:()=>{ if (p>0) { hitEnemy(p, e); e.poison = Math.max(0, e.poison-1); } }},
    {text:null, fn:checkEnd});
  return list;
}

// カードの効果の大きさを k 倍にした写し(ダメージ・かいふく・強化など。回数と割合系はそのまま)
function scaleCard(c, k){
  const o = {...c};
  ['dmg','heal','atkUp','guard','thorn','poison','regen','selfDmg'].forEach(key => { if (o[key]) o[key] = Math.max(1, Math.round(o[key]*k)); });
  ['heal','regen'].forEach(key => { if (c[key]) o[key] = Math.max(1, Math.round(c[key]*k*0.5)); });   // 魔王の かいふくは さらに半分(長引きすぎないように)
  return o;
}
// 魔王がカード c を使う(いこあんのカードと同じ効果を、魔王側にかける)
function enemyCardEntries(e, c, fused){
  const b = battle, list = [];
  if (e.power !== 1) c = scaleCard(c, e.power);                  // 融合カードが強くなりすぎるので、効果の大きさを調整する
  if (fused) {
    list.push({text:'魔王は 2まいの カードを ゆうごうさせた！', fn:()=>{ b.flashRGB = null; b.flash = 700; }});
    list.push({text:`「${c.name}」が できあがった！`});
  } else list.push({text:`魔王は 「${c.name}」を つかった！`});
  if (c.atkUp) list.push({text:`魔王の こうげきりょくが ${c.atkUp} あがった！`, fn:()=>{ e.atkUp += c.atkUp; pop(e.x, 70, 'ATK+'+c.atkUp, '#ffd966'); }});
  if (c.guard) list.push({text:`魔王は まもりを かためた！(つぎに うける ダメージを ${c.guard} へらす)`, fn:()=>{ e.guard += c.guard; }});
  if (c.thorn) list.push({text:`魔王は はんげきの かまえ！(つぎに こうげきされたら ${c.thorn}+ かえす)`, fn:()=>{ e.thorn += c.thorn; }});
  if (c.regen) list.push({text:`魔王は じわじわ かいふくする！(まいターン HP+${c.regen})`, fn:()=>{ e.regen += c.regen; }});
  let dealt = 0;
  if (c.dmg || c.dmgPerAtk || c.dmgPerGuard || c.dmgFromHeal) {
    const hits = c.hits || 1;
    for (let k=0; k<hits; k++) {
      let d = 0;
      list.push({text:()=>{
          if (hero.hp <= 0) return null;
          const core = (c.dmg||0) + (c.dmgPerAtk||0)*e.atkUp + (c.dmgPerGuard||0)*e.guard + (c.dmgFromHeal||0)*(c.heal||0);
          const raw = Math.max(1, Math.round(core + e.atk + e.atkUp - hero.def*0.5 + rnd(-1,1)));
          const gd = b.guard; d = Math.max(1, raw-gd); b.guard = 0;
          const pre = hits>1 ? `${k+1}れんだ！ ` : '';
          return gd>0 ? `${pre}ガードで ${raw-d} ふせいだ！ いこあんは ${d}の ダメージ！` : `${pre}いこあんは ${d}の ダメージを うけた！`; },
        fn:()=>{ if (hero.hp <= 0) return; e.lunge = 300; dealt += d; hitHero(d); }});
    }
    list.push({text:()=>{ const t = (b.thorn>0 && hero.hp>0 && dealt>0) ? b.thorn + b.atkUp : 0; return t>0 ? `はんげき！ 魔王に ${t}の ダメージ！` : null; },
               fn:()=>{ if (b.thorn>0 && dealt>0) { hitEnemy(b.thorn + b.atkUp, e); b.thorn = 0; } }});
    list.push({text:null, fn:checkEnd});
  }
  if (c.poison) list.push({text:`いこあんは どくに おかされた！(どく +${c.poison})`, fn:()=>{ b.heroPoison += c.poison; }});
  if (c.drain) {
    let h = 0;
    list.push({text:()=>{ h = Math.min(Math.round(dealt*c.drain/100), e.maxHp-e.hp); return h>0 ? `魔王は HPを ${h} きゅうしゅうした！` : null; },
               fn:()=>{ if (h>0) { e.hp += h; pop(e.x, 70, '+'+h, '#80ff90'); } }});
  }
  if (c.heal) {
    let h = 0;
    list.push({text:()=>{ h = Math.min(c.heal, e.maxHp-e.hp); return h>0 ? `魔王は HPが ${h} かいふくした！` : null; },
               fn:()=>{ if (h>0) { e.hp += h; pop(e.x, 70, '+'+h, '#80ff90'); } }});
  }
  if (c.selfDmg) {
    let d = 0;
    list.push({text:()=>{ d = Math.max(0, Math.min(c.selfDmg, e.hp - Math.max(1, e.floorHp||0))); return d>0 ? `魔王は はんどうで ${d}の ダメージを うけた！` : null; },
               fn:()=>{ if (d>0) { e.hp -= d; e.shake = 300; pop(e.x, 70, String(d), '#fff'); } }});
  }
  return list;
}

// ---- checkEnd から呼ばれる: 形態変化 / 5%の場面 ----
function finalCheck(){
  const b = battle, e = b.enemies.find(x => x.final);
  if (!e || hero.hp <= 0) return false;
  if (e.form === 1 && e.hp <= 0 && !e.transforming) { e.transforming = true; finalForm1Down(e); return true; }
  if (e.form === 2 && e.floorHp && e.hp <= e.floorHp && !e.swordStarted) { e.swordStarted = true; finalSwordScene(e); return true; }
  return false;
}

// 第一形態を倒した → 仮面のヒビ → 正体 → 回想 → 第二形態
function finalForm1Down(e){
  const b = battle, T = FINAL_TEXT;
  b.queue.length = 0; skipChain = null;
  const L = [{text:'魔王の HPが ゼロに なった…！', fn:()=>{ e.hp = 0; }},
             sceneEntry({art:'cutin/maou_crack.png', fx:'crack', name:T.crack.name, lines:T.crack.lines})];
  T.half.forEach((d, i) => L.push(sceneEntry({art:'cutin/maou_half.png', fx:'half', keep: i > 0, name:d.name, lines:d.lines})));
  T.memory.forEach(m => L.push(sceneEntry({...m, chain:'memory'})));
  L.push(sceneEntry(T.afterMemory), sceneEntry(T.form2Talk),
         {text:null, fn:()=>finalStartForm2(e)},
         {text:'魔王は ほんきを だした！'});
  sayNow(L);
}
function finalStartForm2(e, silent){
  const b = battle, F = FINAL.form2;
  e.form = 2; e.artId = 'maou_unmasked'; e.transforming = false; b.bgList = ['bg/final_2.png', 'bg/final.png'];
  e.title = 'いこあん';                                          // HPバーの上の名前だけ「いこあん」(正体が分かったあと)。メッセージとセリフの話者は「魔王」のまま(現代のいこあんと区別するため)
  e.maxHp = F.hp; e.hp = F.hp; e.dispHp = silent ? F.hp : 0; e.atk = F.atk; e.def = F.def; e.power = F.power;
  e.floorHp = Math.ceil(F.hp * FINAL.floor);
  e.atkUp = e.guard = e.thorn = e.regen = e.poison = 0; e.cls = null; e.tag = ''; e.aura = '255,80,80';
  e.down = false; e.fading = false; e.alpha = 1;
  hero.hp = hero.maxHp; b.dispHp = silent ? hero.hp : b.dispHp;
  b.pile = hero.deck.map(mkCard); b.hand = [];                  // デッキを さいしょから
  b.atkUp = b.guard = b.thorn = b.regen = b.heroPoison = 0;
  if (!silent) { b.flashRGB = '255,255,255'; b.flash = 900; }
}

// HPが 5% で止まった → 闇の剣 → 精霊 → ザ・デュエリストで復活
function finalSwordScene(e){
  const b = battle, T = FINAL_TEXT;
  b.queue.length = 0;
  sayNow([
    sceneEntry(T.last),
    {text:'魔王は やみの つるぎ「オブリビオン・エッジ」を かまえた！', fn:()=>{ b.flashRGB = '30,0,50'; b.flash = 800; e.lunge = 300; }},
    {text:'くろい ひかりが いこあんを つらぬいた！', fn:()=>{ b.flashRGB = '0,0,0'; b.flash = 1200; b.heroShake = 700; hero.hp = 0; pop(118, 118, 'HP 0', '#c080ff'); }},
    {text:'いこあんの HPが 0に なった…！'},
    {text:'いこあんの いしきが とおのいていく…'},
    {text:'・・・'}, {text:'・・・・・・'}, {text:'・・・・・・・・・'},                       // 敗北の余韻
    sceneEntry(T.spirit1), sceneEntry(T.spirit2),
    {async: done => finalAsk(done)},                            // 精霊の絵の上で「はい/いいえ」を選ぶ
    sceneEntry(T.awaken),
    {text:'いこあんの からだが なないろの ひかりに つつまれた！', fn:()=>{ b.flashRGB = '255,255,255'; b.flash = 1200; }},
    {text:'いこあんは「ザ・デュエリスト」として よみがえった！', fn:()=>{
      b.duelist = true; hero.hp = hero.maxHp; e.floorHp = 0; e.guard = 0; e.thorn = 0; b.guard = 0; b.heroPoison = 0; }},
    {text:'ふくが なないろに かがやく ボーダーに かわっている！'},
    {text:'てふだに、ひかりの つるぎが あらわれた…！', fn:()=>{ b.forceHand = [makeGenesis()]; }},
  ]);
}
// 精霊アルカの問い: 精霊の絵の上で「はい/いいえ」を選ぶ。「はい」を選ぶまで、何度でも聞かれる
function finalAsk(done){
  const T = FINAL_TEXT; let n = 0;
  const ask = () => openChoice({prompt:T.askPrompt, options:[
    {label:'はい', fn:() => endScene()},                         // 場面を閉じる → 復活の演出へ
    {label:'いいえ', fn:() => { Object.assign(sceneBox, {name:'アルカ', lines:T.refuse[n++ % T.refuse.length].slice(), i:0, pages:null, t:600}); }},
  ]});
  openScene({...T.ask, onLast:ask}, done);
}
