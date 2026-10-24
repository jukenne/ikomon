// イベント実行係: フラグと「台本(命令のリスト)」の解釈
// 台本は maps.js に書く。ここでは命令を1つずつ実行し、会話・移動・戦闘などの「待ち」が終わったら続きを実行する。

// ===== フラグ =====
// 「ボスを倒した」などの記憶。hero.flags に入り、セーブされる。
const flagOn = f => !!hero.flags[f];
// 条件: 'ch1_clear'(立っている) / '!ch1_clear'(立っていない) / それらの配列(すべて満たす)
function condOk(c){
  if (c == null) return true;
  if (Array.isArray(c)) return c.every(condOk);
  return c[0] === '!' ? !flagOn(c.slice(1)) : flagOn(c);
}

// ===== 実行 =====
let ev = null;   // 実行中のイベント。null のときは自由に操作できる
const entity = id => id === 'player' ? player : NPCS.find(n => n.id === id);

function runEvent(script, done){
  if (ev || !script || !script.length) return;
  ev = {stack:[{cmds:script, i:0}], wait:null, done, move:null, card:null, t:0};
  Object.keys(keys).forEach(k => keys[k] = false);
  stepEvent();
}

// 待ちが無い限り、次の命令を実行し続ける
function stepEvent(){
  while (ev) {
    if (ev.wait) return;
    const top = ev.stack[ev.stack.length-1];
    if (!top) { const d = ev.done; ev = null; saveGame(); if (d) d(); return; }
    if (top.i >= top.cmds.length) { ev.stack.pop(); continue; }
    execCmd(top.cmds[top.i++]);
  }
}

function execCmd(c){
  if (c.say !== undefined) {                       // 会話: Zキーで送り、閉じると続きへ
    dialog = {name:c.say, as:c.as, lines:c.lines.slice(), i:0}; ev.wait = 'dialog'; sfx(c.say ? 'talk' : 'talkLow');
  } else if (c.set) {                              // フラグを立てる(value:false で下ろす)
    hero.flags[c.set] = c.value === undefined ? true : c.value;
  } else if (c.if !== undefined) {                 // 条件分岐
    ev.stack.push({cmds: condOk(c.if) ? (c.then||[]) : (c.else||[]), i:0});
  } else if (c.warp) {                             // マップ移動(行き先の onEnter があればすぐ実行)
    loadMap(c.warp.map, c.warp.x, c.warp.y, c.warp.dir || 'down'); fadeIn = 400;
    const en = enterEvent(); if (en) ev.stack.push({cmds:en, i:0});
  } else if (c.npc) {                              // NPCの登場・退場・瞬間移動
    const n = entity(c.npc);
    if (n) {
      if (c.show !== undefined) n.visible = c.show;
      if (c.x !== undefined) { n.x = n.px = c.x; n.y = n.py = c.y; }
      if (c.dir) n.dir = c.dir;
    }
  } else if (c.face) {                             // 向きを変える
    const e = entity(c.face); if (e) e.dir = c.dir;
  } else if (c.move) {                             // 歩かせる(終わるまで待つ)
    const e = entity(c.move);
    if (e && c.path && c.path.length) {
      if (e.px === undefined) { e.px = e.x; e.py = e.y; }
      ev.move = {e, path:c.path.map(p=>p.slice()), t:0, ms:c.speed || STEP_MS, from:[e.x, e.y]};
      if (e === player) player.scripted = true; else e.walking = true;
      ev.wait = 'move';
    }
  } else if (c.wait) {
    ev.wait = 'timer'; ev.t = c.wait;
  } else if (c.battle) {                           // 固定ボス戦。勝てば続き、負ければ onLose を実行して終了
    ev.wait = 'battle';
    startBattle(c.battle, {onEnd: over => {
      ev.wait = null;
      if (over !== 'win') ev.stack = [{cmds:c.onLose || [], i:0}];
      stepEvent();
    }});
  } else if (c.chapter) {                          // 章タイトルの表示
    ev.card = {title:c.chapter, sub:c.sub || '', t:0}; ev.wait = 'card';
  } else if (c.scene) {                            // 一枚絵の場面(カットイン・回想)。Zで送り、終わると続きへ
    ev.wait = 'scene';
    openScene(c.scene, () => { if (ev && ev.wait === 'scene') { ev.wait = null; stepEvent(); } });
  } else if (c.heal) {
    hero.hp = hero.maxHp;
  } else if (c.end) {                              // この台本をここで終わらせる(選択肢で「やめる」を選んだとき など)
    ev.stack = [];
  } else if (c.do) {                               // 関数をその場で実行(クエストの受注など)
    c.do();
  } else if (c.gen) {                              // 実行時に台本を作る(いまの状況で内容が変わる道場の会話など)
    ev.stack.push({cmds:c.gen(), i:0});
  } else if (c.choice) {                           // 選択肢を出して、選んだものの台本を実行
    openChoice(c.choice); ev.wait = 'choice';
  }
}

// 毎フレーム(マップ画面のとき)呼ぶ: 待ち時間・移動・章タイトルを進める
function updateEvent(dt){
  if (!ev) return;
  if (ev.wait === 'timer') {
    ev.t -= dt; if (ev.t <= 0) { ev.wait = null; stepEvent(); }
  } else if (ev.wait === 'move') {
    const m = ev.move, e = m.e, to = m.path[0];
    m.t += dt;
    const p = Math.min(m.t / m.ms, 1), dx = to[0]-m.from[0], dy = to[1]-m.from[1];
    e.px = m.from[0] + dx*p; e.py = m.from[1] + dy*p;
    if (dx || dy) e.dir = dx<0 ? 'left' : dx>0 ? 'right' : dy<0 ? 'up' : 'down';
    e.anim = (e.anim||0) + dt;
    if (p >= 1) {
      e.x = to[0]; e.y = to[1]; e.px = e.x; e.py = e.y;
      m.path.shift(); m.from = [e.x, e.y]; m.t = 0;
      if (!m.path.length) {
        if (e === player) { player.scripted = false; player.fromX = e.x; player.fromY = e.y; } else e.walking = false;
        ev.move = null; ev.wait = null; stepEvent();
      }
    }
  } else if (ev.wait === 'card') {
    ev.card.t += dt;
    if (ev.card.t > 3500) { ev.card = null; ev.wait = null; stepEvent(); }
  }
}
