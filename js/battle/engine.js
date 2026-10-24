// 戦闘エンジン: ターン進行・カード効果・勝敗・報酬
// =====================================================================
// ===== 戦闘 (カードバトル) =====
// ルール
//  - 毎ターン、山札(pile)からランダムに最大3枚が「手札(hand)」として提示される
//  - 1枚えらんで使う、または2枚えらんで「融合」して強力なカードを作って使う
//  - 使ったカードはその戦闘では戻らない。使わなかったカードは山札に戻る
//  - 提示できるカードが無くなったら敗北(カードオタクなので)
// 進行: 「メッセージ列(queue)」を順に表示する。各メッセージは表示の瞬間に fn を実行するので、
//   HPゲージ変化やエフェクトがメッセージと同期する。text が null の項目は表示せず fn だけ実行。
//   text は関数でもよく、その場合は表示の直前に評価される(ダメージ計算などに使う)。
// =====================================================================


let battle = null;
let fadeIn = 0;
const rnd = (a,b)=> a + Math.floor(Math.random()*(b-a+1));

// bossId を渡すと固定のボス戦(BOSSES)、省略すると草むらのランダム戦闘。
// opts.onEnd(結果) が あれば、戦闘が終わったときに呼ばれる(イベントの続きを実行するために使う)
// 敵1体を作る。n=同時に出る数(2体のとき横にならべる)
function makeEnemy(base, i, n){
  return {...base, maxHp:base.hp, dispHp:base.hp, shake:0, alpha:1, lunge:0, turn:0, poison:0, down:false, enraged:false, atkUp:0, guard:0, thorn:0, regen:0, floorHp:0,
          x: n === 1 ? 345 : ([262, 392][i] ?? 345),
          phases:(base.phases||[]).map(p => ({...p, done:false})),
          pattern: base.pattern ? base.pattern.map(p => ({...p})) : undefined};   // 戦闘中に変える(強化)ので写しを使う
}

// bossId を渡すと固定のボス戦(BOSSES)、BOSS_GROUPS のキーなら複数の敵と同時に戦う。省略すると草むらのランダム戦闘。
// opts.onEnd(結果) が あれば、戦闘が終わったときに呼ばれる(イベントの続きを実行するために使う)
function startBattle(bossId, opts){
  opts = opts || {};
  // ランダム戦闘は、マップごとの出現リスト(encounters)があればそこから、なければ全種類から選ぶ
  const pool = (curMap && curMap.encounters) ? ENEMIES.filter(x => curMap.encounters.includes(x.id)) : ENEMIES;
  const group = bossId && BOSS_GROUPS[bossId];
  const bases = group ? group.members.map(k => BOSSES[k]) : [bossId ? BOSSES[bossId] : pool[rnd(0, pool.length-1)]];
  const enemies = bases.map((bs, i) => makeEnemy(bs, i, bases.length));
  const lead = group || bases[0];                              // intro / noFlee などを持っているもの
  battle = {
    enemies, tIdx:0, enemy:enemies[0],                         // enemy = いまの ねらい(ターゲット)
    noFlee:!!lead.noFlee, onEnd:opts.onEnd || null, tipCharge:false,
    state:'trans', t:0,            // trans / msg / menu / out
    queue:[], msg:'', chars:0,
    pile: hero.deck.map(mkCard), hand:[],   // 山札 / 提示中の手札
    ui:'pick', cursor:0, ac:0, src:-1, partner:-1, pc:0, fused:null, note:'',
    atkUp:0, guard:0,              // この戦闘中の攻撃力アップ / 次の被ダメ軽減
    thorn:0, regen:0,              // はんげき(次の被弾時に返す) / リジェネ(毎ターン回復)。敵の毒は 敵ごと(e.poison)
    dispHp:hero.hp, heroShake:0, heroLunge:0, flash:0, pops:[], over:null,
    turnCount:0, heroPoison:0, duelist:false, forceHand:null, final:!!lead.final, flashRGB:null,
  };
  if (lead.final) finalInit(enemies[0]);                        // ラスボス戦の準備(final.js)
  Object.keys(keys).forEach(k=>keys[k]=false);
  say(lead.intro || `${lead.name}が あらわれた！`);
  if (lead.intro2) say(lead.intro2);
  if (hero.fights++ === 0) {
    say('いこあんは カードオタクだ。カードで たたかうぞ！');
    say('カードを 1まい えらんで つかうか、2まいを ゆうごうさせよう！');
    say('つかわなかった カードは 山札に もどる。つかえる カードが なくなったら まけだよ！');
  }
}

// ---- ねらう あいて(敵が2体のとき) ----
function fixTarget(){                                          // ターゲットが倒れていたら、生きている敵へ
  const b = battle;
  if (b.enemies[b.tIdx].hp <= 0) { const i = b.enemies.findIndex(e => e.hp > 0); if (i >= 0) b.tIdx = i; }
  b.enemy = b.enemies[b.tIdx];
}
function setTarget(i){ const b = battle; if (b.enemies[i] && b.enemies[i].hp > 0) { b.tIdx = i; b.enemy = b.enemies[i]; } }
function cycleTarget(){
  const b = battle, n = b.enemies.length;
  for (let k=1; k<=n; k++) { const i = (b.tIdx+k) % n; if (b.enemies[i].hp > 0) { setTarget(i); return; } }
}
const aliveEnemies = () => battle.enemies.filter(e => e.hp > 0);

// ---- メッセージ列 ----
function say(text, fn){ battle.queue.push({text, fn}); }
function sayNow(list){ battle.queue.unshift(...list); } // 実行中の項目の直後に差し込む

function nextMsg(){
  const b = battle;
  while (b.queue.length) {
    const m = b.queue.shift();
    if (m.async) { b.state = 'wait'; m.async(() => nextMsg()); return; }   // 一枚絵・選択肢など、終わるまで待つ項目
    const t = typeof m.text === 'function' ? m.text() : m.text;   // 先に評価(ダメージ値などを確定)
    if (m.fn) m.fn();
    if (t != null) { b.msg = t; b.chars = 0; b.state = 'msg'; return; }
  }
  if (b.over) { b.state = 'out'; b.t = 0; return; }
  if (!drawHand()) { nextMsg(); return; }                          // 手札が出せない → 敗北メッセージへ
  fixTarget();
  b.state = 'menu'; b.ui = 'pick'; b.cursor = 0;
}

// 山札からランダムに最大3枚を手札へ。出せなければ敗北
function drawHand(){
  const b = battle;
  if (b.forceHand) { b.hand = b.forceHand; b.forceHand = null; b.turnCount++; return true; }   // ラスボス戦: 光の剣だけを出す
  if (b.pile.length === 0) {
    b.over = 'lose';
    sayNow([{text:'もう つかえる カードが ない…！'}, {text:'カードオタクの いこあんは しょんぼり まけを みとめた…'}]);
    return false;
  }
  b.hand = []; b.turnCount++;
  for (let i=0; i<3 && b.pile.length; i++) b.hand.push(b.pile.splice(rnd(0, b.pile.length-1), 1)[0]);
  return true;
}

// ---- ダメージ ----
function pop(x, y, text, color){ battle.pops.push({x, y, text, color, t:0}); }
function hitEnemy(d, e){ sfx('hit'); e = e || battle.enemy; d = Math.max(0, Math.min(d, e.hp - (e.floorHp||0))); e.hp -= d; e.shake=300; pop(e.x,70,String(d),'#fff'); }   // floorHp: それ以上は へらない(ラスボス戦の5%)
function hitHero(d){ hero.hp=Math.max(0,hero.hp-d); battle.heroShake=300; pop(118,118,String(d),'#ff8080'); }

// ---- カードを使う ----
function useCards(cards, fused, tIdx){
  const b = battle;
  if (tIdx !== undefined) setTarget(tIdx);                   // ねらう あいて(ドラッグ先など)
  fixTarget();
  b.pile.push(...b.hand.filter(c => !cards.includes(c)));   // 使わなかった分は山札へ戻る
  b.hand = []; b.state = 'msg';
  const questMsgs = recordCardUse(cards);                    // クエストの回数を数える(達成したら メッセージ)
  b.queue.push(...playEntries(fused || cards[0], !!fused),
               ...questMsgs.map(t => ({text:t})),
               {text:null, fn:checkEnd},
               ...enemyTurnEntries());
  nextMsg();
}

// 敵のターン: 生きている敵が 1ターンに 1回ずつ行動する → ターン終了時の リジェネ
function enemyTurnEntries(){
  const b = battle;
  return [...b.enemies.map(e => ({text:null, fn:()=>{ if (e.hp > 0 && hero.hp > 0) sayNow(enemyAct(e)); }})),
          {text:null, fn:()=>sayNow(regenEntries())}];
}
function regenEntries(){
  const b = battle;
  let h = 0;
  return [
    {text:()=>{ h = (b.regen>0 && hero.hp>0 && aliveEnemies().length) ? Math.min(b.regen, hero.maxHp-hero.hp) : 0;
                return h>0 ? `リジェネで HPが ${h} かいふくした！` : null; },
     fn:()=>{ if (h>0) { hero.hp += h; pop(118,118,'+'+h,'#80ff90'); } }},
    {text:null, fn:checkEnd},
  ];
}

function playEntries(c, isFusion){
  const b = battle, e = b.enemy, list = [];
  if (isFusion) {
    list.push({text:'いこあんは 2まいの カードを ゆうごうさせた！', fn:()=>{ b.flash = 700; sfx('fuse'); }});
    list.push({text:`「${c.name}」が できあがった！`});
  } else {
    list.push({text:`いこあんは 「${c.name}」を つかった！`, fn:()=>sfx('card')});
  }
  // 効果の順序: きょうか系 → こうげき → どく → きゅうしゅう → かいふく → はんどう
  //  (きょうかを先にするので、融合した きょうか がその場の こうげきにも のる)
  if (c.scenes) c.scenes.forEach(d => list.push({async: done => openScene(d, done)}));      // 光の剣: 刃を交える挿絵とセリフ
  if (c.intro) list.push({text:c.intro, fn:()=>{ b.flashRGB = '255,250,220'; b.flash = 900; }});
  if (c.atkUp) list.push({text:`こうげきりょくが ${c.atkUp} あがった！`, fn:()=>{ sfx('buff'); b.atkUp += c.atkUp; pop(118,118,'ATK+'+c.atkUp,'#ffd966'); }});
  if (c.guard) list.push({text:`まもりを かためた！(つぎの ダメージを ${c.guard} へらす)`, fn:()=>{ sfx('buff'); b.guard += c.guard; }});
  if (c.thorn) list.push({text:`はんげきの かまえ！(つぎに こうげきされたら ${c.thorn}+ かえす)`, fn:()=>{ sfx('buff'); b.thorn += c.thorn; }});
  if (c.regen) list.push({text:`じわじわ かいふくする！(まいターン HP+${c.regen})`, fn:()=>{ sfx('buff'); b.regen += c.regen; }});

  let dealt = 0;
  if (c.dmg || c.dmgPerAtk || c.dmgPerGuard || c.dmgFromHeal) {
    const hits = c.hits || 1;
    for (let k=0; k<hits; k++) {
      let d = 0;
      list.push({text:()=>{
          if (e.hp <= 0 || (e.floorHp && e.hp <= e.floorHp)) return null;   // 先の連続攻撃で倒していたら(5%で止まっていたら)省略
          if (c.fixed) d = c.fixed;                    // 光の剣など: 防御に関係なく ぴったり この値
          else {
            d = Math.max(1, Math.round((c.dmg||0) + b.atkUp + hero.atk
                  + (c.dmgPerAtk||0)*b.atkUp + (c.dmgPerGuard||0)*b.guard + (c.dmgFromHeal||0)*(c.heal||0) - e.def*0.5));
            if (e.guard > 0) { d = Math.max(1, d - e.guard); e.guard = 0; }       // 敵のガード(魔王)
          }
          if (e.floorHp) d = Math.min(d, e.hp - e.floorHp);
          return hits>1 ? `${k+1}れんだ！ ${e.name}に ${d}の ダメージ！` : `${e.name}に ${d}の ダメージ！`; },
        fn:()=>{ if (e.hp<=0) return; b.heroLunge = 300; dealt += d; hitEnemy(d, e); }});
    }
  }
  if (e.thorn > 0) {                                                 // 敵の はんげき(魔王): こうげきを うけたあと ぶつけ返す
    let t = 0;
    list.push({text:()=>{ t = (e.thorn>0 && dealt>0 && hero.hp>0) ? e.thorn + e.atkUp : 0; return t>0 ? `${e.name}の はんげき！ いこあんは ${t}の ダメージ！` : null; },
               fn:()=>{ if (t>0) hitHero(t); e.thorn = 0; }});
  }
  if (c.poison) list.push({text:`${e.name}は どくに おかされた！(どく +${c.poison})`, fn:()=>{ sfx('poison'); e.poison += c.poison; }});
  if (c.drain) {
    let h = 0;
    list.push({text:()=>{ h = Math.min(Math.round(dealt*c.drain/100), hero.maxHp-hero.hp);
                          return h>0 ? `いこあんは HPを ${h} きゅうしゅうした！` : null; },
               fn:()=>{ if (h>0) { sfx('heal'); hero.hp += h; pop(118,118,'+'+h,'#80ff90'); } }});
  }
  if (c.heal) {
    let h = 0;
    list.push({text:()=>{ h = Math.min(c.heal, hero.maxHp-hero.hp);
                          return h>0 ? `HPが ${h} かいふくした！` : 'HPは もう まんたんだった…'; },
               fn:()=>{ hero.hp += h; if (h>0) { sfx('heal'); pop(118,118,'+'+h,'#80ff90'); } }});
  }
  if (c.selfDmg) list.push({text:`はんどうで ${c.selfDmg}の ダメージを うけた！`, fn:()=>{ sfx('hurt'); hitHero(c.selfDmg); }});
  return list;
}

function enemyAct(e){
  const b = battle;
  // ボスは pattern を順に繰り返す。{} = ふつうの こうげき / mult=攻撃倍率(0なら攻撃しない) / charge=ためる
  //   shred=山札のカードを破棄 / healAlly=なかまのHPを回復
  if (e.final) return finalActEntries(e);                         // ラスボス(魔王)は 専用の行動(final.js)
  const act = e.pattern ? e.pattern[e.turn++ % e.pattern.length] : {};
  const mult = act.mult === undefined ? 1 : act.mult;
  let d = 0, t = 0, p = 0, n = 0, n2 = 0, ally = null;
  const title = {text:`${e.name}の ${act.name || 'こうげき'}！`, fn:()=>{ e.lunge = 300; }};
  const attack = [
    title,
    {text:()=>{
        const raw = Math.max(1, Math.round(e.atk*mult - hero.def*0.5 + rnd(-1,1)));
        const gd = b.guard; d = Math.max(1, raw-gd); b.guard = 0;
        return gd>0 ? `ガードで ${raw-d} ふせいだ！ いこあんは ${d}の ダメージ！` : `いこあんは ${d}の ダメージを うけた！`; },
     fn:()=>hitHero(d)},
    // はんげき(マッショ): 攻撃を受けたあと、たまった分を ぶつけ返す
    {text:()=>{ t = (b.thorn>0 && hero.hp>0) ? b.thorn + b.atkUp : 0;
                return t>0 ? `はんげき！ ${e.name}に ${t}の ダメージ！` : null; },
     fn:()=>{ if (t>0) hitEnemy(t, e); b.thorn = 0; }},
  ];
  const charge = [{text: act.text || `${e.name}は ちからを ためている…！`}];
  if (!b.tipCharge) { b.tipCharge = true; charge.push({text:'(つぎに つよい こうげきが くる！ ガードで ふせごう)'}); }
  // 山札のカードを こなごなに する(シュレッダー)。山札が 0まいに なると、つぎの ターンで まけ
  const shred = {text:()=>{ n = Math.min(act.shred || 0, b.pile.length);
                            return n>0 ? `${e.name}は 山札の カードを ${n}まい こなごなに した！(のこり ${b.pile.length-n}まい)` : null; },
                 fn:()=>{ for (let i=0; i<n; i++) b.pile.splice(rnd(0, b.pile.length-1), 1); if (n>0) b.flash = 250; }};
  // なかまの HP を 回復する(セリカ)
  const healAlly = {text:()=>{ ally = b.enemies.find(x => x !== e && x.hp > 0); n2 = ally ? Math.min(act.healAlly || 0, ally.maxHp - ally.hp) : 0;
                               return n2>0 ? `${e.name}は ${ally.name}の きずを いやした！(+${n2})` : null; },
                  fn:()=>{ if (n2>0) { ally.hp += n2; pop(ally.x, 70, '+'+n2, '#80ff90'); } }};
  let seq = act.charge ? charge : mult > 0 ? attack : [title];
  if (act.shred) seq = [...seq, shred];
  if (act.healAlly) seq = [...seq, healAlly];
  return [
    ...seq,
    {text:null, fn:checkEnd},
    // ターン終了時: どく(この敵の)
    {text:()=>{ p = (e.poison>0 && e.hp>0 && hero.hp>0) ? e.poison : 0;
                return p>0 ? `${e.name}は どくで ${p}の ダメージ！` : null; },
     fn:()=>{ if (p>0) { hitEnemy(p, e); e.poison = Math.max(0, e.poison-1); } }},
    {text:null, fn:checkEnd},
  ];
}

function doFlee(){
  const b = battle;
  if (b.noFlee) return;                          // ボス戦は にげられない
  b.pile.push(...b.hand); b.hand = []; b.state = 'msg';
  const ok = Math.random() < 0.6;
  b.queue.push({text:'いこあんは にげだした！'});
  if (ok) b.queue.push({text:'うまく にげきれた！', fn:()=>{ b.over='flee'; b.queue.length=0; }});
  else b.queue.push({text:'しかし まわりこまれてしまった！'}, ...enemyTurnEntries());
  nextMsg();
}

// 勝敗チェック: 決着したらメッセージ列を差し替える
function checkEnd(){
  const b = battle;
  if (finalCheck()) return;                                      // ラスボス戦の演出(形態変化・5%の場面)があれば そちらを優先
  const newlyDown = b.enemies.filter(e => e.hp <= 0 && !e.down);       // いま 倒れた敵
  newlyDown.forEach(e => { e.down = true; });
  const alive = b.enemies.filter(e => e.hp > 0);
  if (!alive.length) {
    // ---- 全員倒した → 勝利 ----
    b.queue.length = 0; b.over = 'win';
    const list = newlyDown.map(e => ({text:`${e.name}を たおした！`, fn:()=>{ e.fading = true; }}));
    const exp = b.enemies.reduce((a, e) => a + (e.exp || 0), 0);
    list.push({text:`けいけんち ${exp} を かくとく！`});
    hero.exp += exp;
    while (hero.exp >= expNeed(hero.lv)) {   // 複数レベル同時アップもあり得る
      hero.exp -= expNeed(hero.lv); hero.lv++;
      hero.maxHp += 6; hero.hp += 6; hero.atk += 1; hero.def += 1;
      list.push({text:`いこあんは レベル${hero.lv}に あがった！`});
      list.push({text:'さいだいHP+6 こうげき+1 まもり+1'});
    }
    // クラス経験値: いまのクラスに入る。MAXでマスター(そのクラスカードが どのクラスでも使えるように)
    const cls = hero.cls;
    if (cls !== 'basic' && !hero.mastered[cls]) {
      hero.classExp[cls] = Math.min(CLASS_MAX, (hero.classExp[cls]||0) + exp);
      list.push({text:`クラスけいけんち ${exp}！ (${CLASSES[cls].name} ${hero.classExp[cls]}/${CLASS_MAX})`});
      if (hero.classExp[cls] >= CLASS_MAX) {
        hero.mastered[cls] = true;
        list.push({text:`クラス「${CLASSES[cls].name}」を マスターした！`});
        list.push({text:`${CLASSES[cls].name}の カードは べつの クラスでも つかえる！(デッキに ${FOREIGN_MAX}まいまで)`});
      }
    }
    // ドロップ: おかねは確定(敵の強さに応じた額)。さらに敵ごとに確率で カードの がぞうデータ(ボスは確定)。
    // がぞうデータは ベーシックカード + いまのクラスのカード から抽選(別クラスのカードは出ない)
    const money = b.enemies.reduce((a, e) => a + (e.money || 0), 0);
    hero.money += money;
    list.push({text:`おかねを ${money}えん てにいれた！ (しょじきん ${hero.money}えん)`});
    b.enemies.forEach(e => {
      if (Math.random() < (e.dropRate === undefined ? 0.4 : e.dropRate)) {
        const pool = dropPool(), id = pool[rnd(0, pool.length-1)];
        hero.images[id] = (hero.images[id] || 0) + 1;
        list.push({text:`「${CARDS[id].name}」の がぞうデータを ひろった！`});
        if (hero.rewards++ === 0) list.push({text:'がぞうデータは、まちの コンビニの コピーきで プロキシ(カード)に できるよ！(1まい 10えん)'});
      }
    });
    sayNow(list);
  } else if (hero.hp <= 0) {
    b.queue.length = 0; b.over = 'lose';
    sayNow([{text:'いこあんは たおれてしまった…'}, {text:'めの まえが まっくらに なった…'}]);
  } else {
    const list = newlyDown.map(e => ({text:`${e.name}を たおした！`, fn:()=>{ e.fading = true; fixTarget(); }}));
    // 激昂(げきこう): なかまが倒れた / 自分のHPが enrageHp(割合)以下になった とき、一度だけ 強くなる
    alive.forEach(a => {
      if (!a.enrage || a.enraged) return;
      const byAlly = newlyDown.length > 0, bySelf = !!a.enrageHp && a.hp / a.maxHp <= a.enrageHp;
      if (!byAlly && !bySelf) return;
      a.enraged = true;
      const lines = (bySelf && !byAlly && a.enrage.linesSelf) ? a.enrage.linesSelf : a.enrage.lines;
      // 順番: セリフ → (変身・強化がその場で起きる: フラッシュ+姿が変わる) → ナレーション(after)
      list.push(...lines.map(t => ({text:t})),
                {text:null, fn:()=>{ b.flash = 900; a.rageForm = true; if (a.enrage.fn) a.enrage.fn(a); }},
                ...(a.enrage.after || []).map(t => ({text:t})));
    });
    // ボスのフェーズ演出: HPが しきい値を きったとき、一度だけ セリフと強化
    alive.forEach(a => {
      const ph = (a.phases || []).find(p => !p.done && a.hp/a.maxHp <= p.hp);
      if (ph) { ph.done = true; list.push(...ph.lines.map(t => ({text:t})), {text:null, fn:()=>{ if (ph.fn) ph.fn(a); }}); }
    });
    if (list.length) sayNow(list);
  }
}

// ---- 更新 ----
function updateBattle(dt){
  const b = battle;
  b.t += dt;
  if (b.state==='trans' && b.t > 700) { b.t=0; nextMsg(); }
  if (b.state==='msg' && b.chars < b.msg.length) b.chars += dt/28;
  b.heroShake = Math.max(0, b.heroShake-dt); b.heroLunge = Math.max(0, b.heroLunge-dt);
  b.flash = Math.max(0, b.flash-dt); if (b.flash <= 0) b.flashRGB = null;
  for (const e of b.enemies) {
    e.shake = Math.max(0, e.shake-dt); e.lunge = Math.max(0, e.lunge-dt);
    if (e.fading) e.alpha = Math.max(0, e.alpha - dt/600);
    // HPゲージはなめらかに追従
    const eStep = dt*e.maxHp/700;
    e.dispHp += Math.sign(e.hp-e.dispHp)*Math.min(Math.abs(e.hp-e.dispHp), eStep);
  }
  const hStep = dt*hero.maxHp/700;
  b.dispHp += Math.sign(hero.hp-b.dispHp)*Math.min(Math.abs(hero.hp-b.dispHp), hStep);
  b.pops.forEach(p=>p.t+=dt); b.pops = b.pops.filter(p=>p.t<800);
  if (b.state==='out' && b.t > 450) endBattle();
}

function endBattle(){
  const over = battle.over, cb = battle.onEnd;
  battle = null; fadeIn = 400;
  if (over==='lose') { // 村/街の入口に戻る(マップごとの respawn。なければ村)
    hero.hp = hero.maxHp;
    const rs = (curMap && curMap.respawn) || {map:'village', x:4, y:5, dir:'down', label:'むら'};
    loadMap(rs.map, rs.x, rs.y, rs.dir);
    if (!cb) dialog = {name:'', lines:[rs.wake || `いこあんは ${rs.label}の いりぐちで めを さました…`,'HPが かいふくした。'], i:0};
  }
  saveGame();                                     // 戦闘結果(経験値・ボックス)を保存
  if (cb) cb(over);                               // イベントの途中の戦闘なら、続きを実行する
}
