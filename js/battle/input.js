// 戦闘の入力: ドラッグ&ドロップ/キー操作
// ---- ドラッグ&ドロップ操作 ----
// 札を つかんで: 上(場)へ離す=使用 / 別の札の上へ離す=融合 / それ以外=元に戻る
const BTN_FLEE = () => ({x:SCREEN_W-88, y:TRAY_Y+2, w:80, h:18});

function cardAt(p, list, skip){
  const n = list.length;
  for (let i=n-1; i>=0; i--) {
    if (i===skip) continue;
    if (inRect(p, {x:cardX(i,n), y:CARD_Y-6, w:CARD_W, h:CARD_H+6})) return i;
  }
  return -1;
}
function battlePointerDown(e){
  const b = battle, p = canvasPos(e);
  if (b.state==='menu' && b.ui==='pick') {
    if (inRect(p, BTN_FLEE())) { doFlee(); return; }
    const ei = b.enemies.length > 1 ? enemyAtPoint(p) : -1;      // 敵をタップ → ねらいを切りかえ
    if (ei >= 0) { setTarget(ei); return; }
    const i = cardAt(p, b.hand, -1);
    if (i>=0) {
      b.cursor = i;
      b.drag = {i, ox:p.x-cardX(i,b.hand.length), oy:p.y-CARD_Y, x:p.x, y:p.y, sx:p.x, sy:p.y, moved:false, over:-1, zone:false, tIdx:b.tIdx};
      cv.setPointerCapture(e.pointerId);
    }
    return;
  }
  onAction();                                     // メッセージ送りなど
}
function battlePointerMove(e){
  const b = battle, d = b.drag, p = canvasPos(e);
  d.x = p.x; d.y = p.y;
  if (!d.moved && Math.hypot(p.x-d.sx, p.y-d.sy) > 8) d.moved = true;
  d.over = d.moved ? cardAt(p, b.hand, d.i) : -1;
  d.zone = d.moved && d.over<0 && p.y < TRAY_Y-2;
  if (d.zone && b.enemies.length > 1) { const ei = enemyAtPoint(p); d.tIdx = ei >= 0 ? ei : nearestEnemy(p); }   // 離した先に いちばん近い敵
}
function battlePointerUp(e){
  const b = battle, d = b.drag; b.drag = null;
  if (!d.moved) { b.src = d.i; b.ui = 'action'; b.ac = 0; b.note = ''; return; }   // タップ: 従来のメニュー
  if (d.over >= 0) {
    const a = b.hand[d.i], c = b.hand[d.over];
    useCards([a, c], fuseCards(a, c));
  } else if (d.zone) useCards([b.hand[d.i]], undefined, d.tIdx);
}

// ---- 入力 ----
const others = src => battle.hand.map((_,i)=>i).filter(i=>i!==src);
function battleInput(k){
  const b = battle;
  if (!b || b.state==='trans' || b.state==='out') return;
  if (b.state==='msg') {
    if (k!=='ok') return;
    if (b.chars < b.msg.length) b.chars = b.msg.length; // 表示途中なら全文表示
    else nextMsg();
    return;
  }
  if (b.state!=='menu') return;
  const n = b.hand.length;
  if (b.ui==='pick') {
    if (k==='left' && b.cursor>0 && b.cursor<n) b.cursor--;
    else if (k==='right' && b.cursor<n-1) b.cursor++;
    else if (k==='down') b.cursor = n;                // n番目 = にげる
    else if (k==='up' && b.cursor===n) b.cursor = 0;
    else if (k==='cancel') { if (b.enemies.length > 1) cycleTarget(); }   // ねらう あいてを きりかえる
    else if (k==='ok') {
      if (b.cursor===n) doFlee();
      else { b.src = b.cursor; b.ui = 'action'; b.ac = 0; b.note = ''; }
    }
  } else if (b.ui==='action') {                        // つかう / ゆうごうする / やめる
    if (k==='up') b.ac = (b.ac+2)%3;
    else if (k==='down') b.ac = (b.ac+1)%3;
    else if (k==='cancel') b.ui = 'pick';
    else if (k==='ok') {
      if (b.ac===0) useCards([b.hand[b.src]]);
      else if (b.ac===1) {
        if (n<2) b.note = 'ゆうごうには カードが 2まい ひつようだよ';
        else { b.partner = others(b.src)[0]; b.ui = 'partner'; }
      } else b.ui = 'pick';
    }
  } else if (b.ui==='partner') {                       // ゆうごう あいてをえらぶ
    const o = others(b.src), i = o.indexOf(b.partner);
    if (k==='left') b.partner = o[(i+o.length-1)%o.length];
    else if (k==='right') b.partner = o[(i+1)%o.length];
    else if (k==='cancel') b.ui = 'action';
    else if (k==='ok') { b.fused = fuseCards(b.hand[b.src], b.hand[b.partner]); b.ui = 'preview'; b.pc = 0; }
  } else if (b.ui==='preview') {                       // できあがるカードを確認してから実行
    if (k==='up' || k==='down') b.pc ^= 1;
    else if (k==='cancel') b.ui = 'partner';
    else if (k==='ok') {
      if (b.pc===0) useCards([b.hand[b.src], b.hand[b.partner]], b.fused);
      else b.ui = 'partner';
    }
  }
}
