// デッキ編集画面(15枚固定・カードボックスと入れ替え)
// =====================================================================
// ===== デッキ編集 =====
// デッキは常に15枚。カードボックスのカードとデッキのカードを「入れ替え」て編成する。
// 操作: ドラッグ(ボックス⇔デッキのカードの上へ離す) / キー(Zで1枚目→もう片方で2枚目) / タップ2回
// =====================================================================
let deckEdit = null;
const HUD_RECT = () => ({x:SCREEN_W-178, y:8, w:170, h:58});
const CLOSE_BTN = () => ({x:SCREEN_W-78, y:4, w:70, h:18});
const RESET_BTN = () => ({x:SCREEN_W-170, y:4, w:86, h:18});
const CLASS_BTN = () => ({x:SCREEN_W-248, y:4, w:72, h:18});
const BOX_VIEW = 5;                                    // ボックスに一度に見える枚数
const deckRect = i => ({x:10+(i%5)*92, y:30+Math.floor(i/5)*42, w:88, h:38});
const boxRect  = k => ({x:10+k*92, y:176, w:88, h:38});

function openDeckEdit(){
  deckEdit = {zone:'deck', i:0, sel:null, scroll:0, drag:null, note:''};
  Object.keys(keys).forEach(k=>keys[k]=false);
}
function closeDeckEdit(){ deckEdit = null; saveGame(); }
function deckHit(p){
  for (let i=0; i<hero.deck.length; i++) if (inRect(p, deckRect(i))) return {zone:'deck', i};
  for (let k=0; k<BOX_VIEW; k++) { const j = deckEdit.scroll+k; if (j<hero.box.length && inRect(p, boxRect(k))) return {zone:'box', i:j}; }
  return null;
}
function boxScroll(d){ d.scroll = Math.max(0, Math.min(d.scroll, Math.max(0, hero.box.length-BOX_VIEW))); }
function equipBlock(id, di){                          // デッキに入れられない理由(入れられるなら null)
  if (!usable(id)) return 'そのカードは いまの クラスでは つかえない';
  const t = hero.deck.slice(); t[di] = id;
  if (foreignCount(t) > FOREIGN_MAX) return `マスターカードは デッキに ${FOREIGN_MAX}まいまで`;
  return null;
}
function trySwap(di, bi){
  const id = hero.box[bi], why = equipBlock(id, di);
  if (why) { deckEdit.note = why; return false; }
  const a = hero.deck[di]; hero.deck[di] = id; hero.box[bi] = a;
  deckEdit.note = `「${CARDS[id].name}」を デッキに いれた！`;
  return true;
}
function pickTile(zone, i){                            // 1枚目を選ぶ → もう片方のゾーンで2枚目を選ぶと入れ替え
  const d = deckEdit;
  if (!d.sel) { d.sel = {zone, i}; return; }
  if (d.sel.zone === zone) { d.sel = d.sel.i===i ? null : {zone, i}; return; }
  trySwap(zone==='deck' ? i : d.sel.i, zone==='box' ? i : d.sel.i);
  d.sel = null;
}
function deckInput(k){
  const d = deckEdit, nb = hero.box.length;
  if (k==='cancel') { if (d.sel) d.sel = null; else closeDeckEdit(); return; }
  if (k==='ok') { if (d.zone==='deck' || nb>0) pickTile(d.zone, d.i); return; }
  if (d.zone==='deck') {
    if (k==='left' && d.i%5>0) d.i--;
    else if (k==='right' && d.i%5<4) d.i++;
    else if (k==='up' && d.i>=5) d.i -= 5;
    else if (k==='down') {
      if (d.i<10) d.i += 5;
      else if (nb>0) { d.zone='box'; d.i = Math.min(nb-1, d.scroll + d.i%5); }
    }
  } else {
    if (k==='left' && d.i>0) d.i--;
    else if (k==='right' && d.i<nb-1) d.i++;
    else if (k==='up') { d.zone='deck'; d.i = 10 + Math.max(0, Math.min(4, d.i-d.scroll)); }
    if (d.i < d.scroll) d.scroll = d.i;
    if (d.i >= d.scroll+BOX_VIEW) d.scroll = d.i-BOX_VIEW+1;
  }
}
function deckPointerDown(e){
  const d = deckEdit, p = canvasPos(e), W = SCREEN_W;
  if (inRect(p, CLOSE_BTN())) { closeDeckEdit(); return; }
  if (inRect(p, RESET_BTN())) { resetGame(); return; }
  if (inRect(p, CLASS_BTN())) { openClassScreen('deck'); return; }
  if (inRect(p, {x:W-96,y:154,w:40,h:18})) { d.scroll--; boxScroll(d); return; }
  if (inRect(p, {x:W-50,y:154,w:40,h:18})) { d.scroll++; boxScroll(d); return; }
  const t = deckHit(p);
  if (!t) return;
  d.zone = t.zone; d.i = t.i;
  const r = t.zone==='deck' ? deckRect(t.i) : boxRect(t.i-d.scroll);
  d.drag = {...t, ox:p.x-r.x, oy:p.y-r.y, x:p.x, y:p.y, sx:p.x, sy:p.y, moved:false, over:null};
  cv.setPointerCapture(e.pointerId);
}
function deckPointerMove(e){
  const dr = deckEdit.drag, p = canvasPos(e);
  dr.x = p.x; dr.y = p.y;
  if (!dr.moved && Math.hypot(p.x-dr.sx, p.y-dr.sy) > 8) dr.moved = true;
  const t = dr.moved ? deckHit(p) : null;
  dr.over = t && t.zone!==dr.zone ? t : null;          // 入れ替えられるのは反対側のゾーンだけ
}
function deckPointerUp(e){
  const d = deckEdit, dr = d.drag; d.drag = null;
  if (!dr.moved) { pickTile(dr.zone, dr.i); return; }   // タップ
  if (dr.over) {
    trySwap(dr.zone==='deck' ? dr.i : dr.over.i, dr.zone==='box' ? dr.i : dr.over.i);
    d.sel = null;
  }
}

// ---- 描画 ----
function drawMiniCard(r, id, o={}){
  const c = CARDS[id], T = TYPE[c.type], CL = CLASSES[c.cls];
  g.fillStyle='#fdf6e3'; g.fillRect(r.x,r.y,r.w,r.h);
  g.fillStyle=T.c; g.fillRect(r.x,r.y,r.w,7);
  const badge = CL.short ? 26 : 0;                    // クラスカードは名前の右にクラス名の札
  g.fillStyle='#222'; g.textBaseline='middle'; g.textAlign='left';
  fitFont(c.name, r.w-8-badge, 12, true); g.fillText(c.name, r.x+4, r.y+17);
  if (badge) {
    g.fillStyle=CL.color; g.fillRect(r.x+r.w-badge-1, r.y+10, badge-2, 14);
    g.fillStyle='#fff'; g.font='bold 9px sans-serif'; g.textAlign='center'; g.fillText(CL.short, r.x+r.w-badge/2-1, r.y+17); g.textAlign='left';
  }
  g.fillStyle='#555'; fitFont(effectTokens(c,true).join(' '), r.w-8, 10, false); g.fillText(effectTokens(c,true).join(' '), r.x+4, r.y+30);
  g.strokeStyle = o.sel ? '#ffd966' : o.cursor ? '#5cf' : '#222'; g.lineWidth = o.sel||o.cursor ? 3 : 1.5;
  g.strokeRect(r.x+1,r.y+1,r.w-2,r.h-2);
  if (o.ghost) { g.fillStyle='rgba(20,20,42,.7)'; g.fillRect(r.x,r.y,r.w,r.h); }
  if (!usable(id)) {                                  // いまのクラスでは使えないカード
    g.fillStyle='rgba(20,20,42,.72)'; g.fillRect(r.x,r.y,r.w,r.h);
    g.fillStyle='#fff'; g.font='bold 10px sans-serif'; g.textAlign='center'; g.fillText('つかえない', r.x+r.w/2, r.y+r.h-8); g.textAlign='left';
  }
}

function drawDeckEdit(){
  const d = deckEdit, W = SCREEN_W, H = SCREEN_H, nb = hero.box.length, dr = d.drag && d.drag.moved ? d.drag : null;
  g.fillStyle='#14142a'; g.fillRect(0,0,W,H);
  g.textBaseline='middle'; g.textAlign='left';
  g.fillStyle='#fff'; g.font='bold 14px sans-serif'; g.fillText(`デッキ ${hero.deck.length}/${DECK_SIZE}`, 10, 14);
  g.fillStyle=CLASSES[hero.cls].color; g.font='bold 12px sans-serif'; g.fillText(CLASSES[hero.cls].name, 120, 14);
  button(CLOSE_BTN().x, CLOSE_BTN().y, CLOSE_BTN().w, CLOSE_BTN().h, 'とじる(X)', false);
  button(RESET_BTN().x, RESET_BTN().y, RESET_BTN().w, RESET_BTN().h, 'さいしょから', false);
  button(CLASS_BTN().x, CLASS_BTN().y, CLASS_BTN().w, CLASS_BTN().h, 'クラス(C)', false);

  const isSel = (zone,i) => d.sel && d.sel.zone===zone && d.sel.i===i;
  const isCur = (zone,i) => !d.drag && d.zone===zone && d.i===i;
  hero.deck.forEach((id,i)=>{
    const target = dr && dr.over && dr.over.zone==='deck' && dr.over.i===i;
    drawMiniCard(deckRect(i), id, {sel:isSel('deck',i)||target, cursor:isCur('deck',i), ghost: dr && dr.zone==='deck' && dr.i===i});
  });

  g.fillStyle='#fff'; g.font='bold 14px sans-serif'; g.textAlign='left'; g.textBaseline='middle';
  g.fillText(`カードボックス  ${nb}まい`, 10, 163);
  if (nb > BOX_VIEW) {
    g.font='11px sans-serif'; g.fillStyle='#bfe'; g.textAlign='right';
    g.fillText(`${d.scroll+1}-${Math.min(nb,d.scroll+BOX_VIEW)}`, W-104, 163); g.textAlign='left';
    button(W-96,154,40,18,'◀',false); button(W-50,154,40,18,'▶',false);
  }
  if (nb === 0) { g.fillStyle='#aaa'; g.font='12px sans-serif'; g.fillText('まだ ないよ。てきを たおして カードを あつめよう！', 12, 195); }
  for (let k=0; k<BOX_VIEW; k++) {
    const j = d.scroll+k; if (j>=nb) break;
    const target = dr && dr.over && dr.over.zone==='box' && dr.over.i===j;
    drawMiniCard(boxRect(k), hero.box[j], {sel:isSel('box',j)||target, cursor:isCur('box',j), ghost: dr && dr.zone==='box' && dr.i===j});
  }

  // 下部: 注目カードの詳細 + せつめい
  const focus = d.drag ? d.drag : (d.sel || {zone:d.zone, i:d.i});
  const id = focus.zone==='deck' ? hero.deck[focus.i] : hero.box[focus.i];
  if (id) drawCard(8, 222, 148, 92, {...CARDS[id], id}, {sel:!!d.sel});
  const cnt = {atk:0,buff:0,heal:0}; hero.deck.forEach(x=>cnt[CARDS[x].type]++);
  g.font='12px sans-serif'; g.textAlign='left'; g.textBaseline='top';
  [['こうげき','atk'],['きょうか','buff'],['かいふく','heal']].forEach(([n,t],i)=>{
    g.fillStyle=TYPE[t].c; g.fillRect(170+i*104, 224, 8, 12);
    g.fillStyle='#fff'; g.fillText(`${n} ${cnt[t]}まい`, 182+i*104, 224);
  });
  g.fillStyle='#bfe'; g.font='11px sans-serif';
  ['ドラッグ: ボックスの カードを',
   'デッキの カードの うえへ → いれかえ',
   'キー: 矢印 + Z で 1まい目 → 2まい目'].forEach((t,i)=> g.fillText(t, 170, 242+i*14));
  const fc = foreignCount(hero.deck);                 // 別クラスのマスターカードの数
  g.fillStyle = fc>=FOREIGN_MAX ? '#ffb070' : '#bfe'; g.fillText(`マスターカード ${fc}/${FOREIGN_MAX}まい`, 170, 284);
  const msg = d.sel ? 'あいてを えらんでね (X で やめる)' : d.note;
  g.fillStyle = d.sel ? '#ffd966' : '#9f9';
  wrapChars(msg||'', 26).slice(0,2).forEach((t,i)=> g.fillText(t, 170, 299+i*13));

  if (dr) {                                           // つかんでいるカード
    const id2 = dr.zone==='deck' ? hero.deck[dr.i] : hero.box[dr.i];
    g.save(); g.shadowColor='rgba(0,0,0,.6)'; g.shadowBlur=10; g.shadowOffsetY=5;
    drawMiniCard({x:dr.x-dr.ox, y:dr.y-dr.oy, w:88, h:38}, id2, {sel:true});
    g.restore();
  }
}
