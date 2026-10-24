// クラス: 使用可否・自動デッキ調整・クラスチェンジ画面
// =====================================================================
// ===== クラス =====
// 使えるカード: ベーシック / いまのクラスのカード / マスターしたクラスのカード
// マスターした「別クラスのカード」はデッキに合計5枚まで。クラスチェンジするとデッキを自動で整える。
// =====================================================================
const usable = id => { const c = CARDS[id]; return c.cls==='basic' || c.cls===hero.cls || !!hero.mastered[c.cls]; };
const foreignMastered = id => { const c = CARDS[id]; return c.cls!=='basic' && c.cls!==hero.cls; };
const foreignCount = list => list.filter(foreignMastered).length;
const cardPower = id => { const c = CARDS[id];                    // 「弱いカードから入れ替える」ための目安
  return (c.dmg||0)*(c.hits||1) + (c.heal||0) + (c.atkUp||0)*2 + (c.guard||0) + (c.thorn||0) + (c.poison||0)*3 + (c.regen||0)*3 + (c.dmgPerAtk||0)*8; };

function autoFixDeck(){
  let supplied = 0;
  // 1) 使えない/上限超えのカードをボックスへ送り、使えるカード(できればベーシック)で穴埋め
  for (let di=0; di<DECK_SIZE; di++) {
    const id = hero.deck[di];
    const over = foreignMastered(id) && foreignCount(hero.deck.slice(0, di+1)) > FOREIGN_MAX;
    if (usable(id) && !over) continue;
    let j = hero.box.findIndex(x => CARDS[x].cls==='basic');
    if (j < 0) j = hero.box.findIndex(x => usable(x) && !foreignMastered(x));
    if (j < 0) { hero.box.push('punch'); j = hero.box.length-1; supplied++; }   // どうしても足りなければ支給
    const t = hero.deck[di]; hero.deck[di] = hero.box[j]; hero.box[j] = t;
  }
  // 2) いまのクラスのカードが少なければ、デッキの いちばん弱い ほかのカードと入れ替えて 8枚まで入れる
  if (hero.cls !== 'basic') {
    let n = hero.deck.filter(x => CARDS[x].cls===hero.cls).length;
    while (n < 8) {
      const j = hero.box.findIndex(x => CARDS[x].cls===hero.cls); if (j < 0) break;
      let di = -1, best = 1e9;
      hero.deck.forEach((x,i)=>{ if (CARDS[x].cls!==hero.cls && cardPower(x)<best) { best = cardPower(x); di = i; } });
      if (di < 0) break;
      const t = hero.deck[di]; hero.deck[di] = hero.box[j]; hero.box[j] = t; n++;
    }
  }
  return supplied;
}
function changeClass(id){
  hero.cls = id;
  let msg = `${CLASSES[id].name}に クラスチェンジ！`;
  if (id !== 'basic' && !hero.granted[id]) { hero.granted[id] = true; hero.box.push(...STARTER[id]); msg += ' スターターカードを ゲット！'; }
  autoFixDeck(); saveGame();
  return msg;
}

// ---- クラスチェンジ画面 ----
let classScreen = null;
const CL_ROW   = i => ({x:10, y:30+i*66, w:460, h:60});
const CL_CLOSE = () => ({x:SCREEN_W-78, y:4, w:70, h:18});
const CL_YES   = () => ({x:120, y:190, w:110, h:28});
const CL_NO    = () => ({x:250, y:190, w:110, h:28});
function openClassScreen(from){
  classScreen = {cursor:CLASS_ORDER.indexOf(hero.cls), ui:'list', yes:0, note:'', from};
  Object.keys(keys).forEach(k=>keys[k]=false);
}
function closeClassScreen(){ classScreen = null; }
function classSelect(){
  const c = classScreen, id = CLASS_ORDER[c.cursor];
  if (id === hero.cls) { c.note = 'いま その クラスだよ'; return; }
  if (!classUnlocked(id)) { c.note = 'デュエルどうじょうの クエストを クリアすると えらべるよ'; return; }
  c.ui = 'confirm'; c.yes = 0; c.note = '';
}
function doClassChange(){
  const msg = changeClass(CLASS_ORDER[classScreen.cursor]);
  classScreen = null;
  if (!deckEdit) openDeckEdit();                      // チェンジ後はデッキ編集で仕上げられるように
  deckEdit.note = msg;
}
function classInput(k){
  const c = classScreen, n = CLASS_ORDER.length;
  if (c.ui === 'list') {
    if (k==='up') c.cursor = (c.cursor+n-1)%n;
    else if (k==='down') c.cursor = (c.cursor+1)%n;
    else if (k==='cancel') closeClassScreen();
    else if (k==='ok') classSelect();
  } else {
    if (k==='left' || k==='right' || k==='up' || k==='down') c.yes ^= 1;
    else if (k==='cancel') c.ui = 'list';
    else if (k==='ok') { if (c.yes===0) doClassChange(); else c.ui = 'list'; }
  }
}
function classPointerDown(e){
  const c = classScreen, p = canvasPos(e);
  if (c.ui === 'confirm') {
    if (inRect(p, CL_YES())) doClassChange();
    else if (inRect(p, CL_NO())) c.ui = 'list';
    return;
  }
  if (inRect(p, CL_CLOSE())) { closeClassScreen(); return; }
  for (let i=0; i<CLASS_ORDER.length; i++) if (inRect(p, CL_ROW(i))) { c.cursor = i; classSelect(); return; }
}
function drawClassScreen(){
  const c = classScreen, W = SCREEN_W, H = SCREEN_H;
  g.fillStyle='#14142a'; g.fillRect(0,0,W,H);
  g.textBaseline='middle'; g.textAlign='left';
  g.fillStyle='#fff'; g.font='bold 14px sans-serif'; g.fillText('クラスチェンジ', 10, 14);
  button(CL_CLOSE().x, CL_CLOSE().y, CL_CLOSE().w, CL_CLOSE().h, 'とじる(X)', false);
  CLASS_ORDER.forEach((id,i)=>{
    const r = CL_ROW(i), CL = CLASSES[id], cur = id===hero.cls, sel = i===c.cursor;
    g.fillStyle='rgba(30,30,62,.95)'; g.fillRect(r.x,r.y,r.w,r.h);
    g.fillStyle=CL.color; g.fillRect(r.x,r.y,8,r.h);
    g.strokeStyle = sel ? '#ffd966' : '#555'; g.lineWidth = sel ? 3 : 1.5; g.strokeRect(r.x+1,r.y+1,r.w-2,r.h-2);
    g.fillStyle='#fff'; g.font='bold 16px sans-serif'; g.textAlign='left'; g.fillText(CL.name, r.x+20, r.y+14);
    g.font='bold 11px sans-serif'; g.textAlign='right';
    if (cur) { g.fillStyle='#ffd966'; g.fillText('◆ いまの クラス', r.x+r.w-10, r.y+14); }
    else if (hero.mastered[id]) { g.fillStyle='#9f9'; g.fillText('★ マスターずみ', r.x+r.w-10, r.y+14); }
    else if (!classUnlocked(id)) { g.fillStyle='#ff9a9a'; g.fillText('ロックちゅう', r.x+r.w-10, r.y+14); }
    g.textAlign='left'; g.font='12px sans-serif'; g.fillStyle='#cde'; g.fillText(CL.desc, r.x+20, r.y+32);
    if (!classUnlocked(id)) {                         // まだ使えないクラス: クエストの進み具合を出す
      const q = hero.quests[id], d = QUESTS[id];
      const t = q.state === 'none' ? 'デュエルどうじょうで クエストを うけよう' : q.state === 'active' ? `クエスト しんこうちゅう ${q.count}/${d.need}` : 'クエスト たっせい！ どうじょうで ほうこくしよう';
      g.fillStyle='#d99'; g.font='11px sans-serif'; g.fillText(t, r.x+20, r.y+48);
    } else if (id === 'basic') {
      g.fillStyle='#99a'; g.font='11px sans-serif'; g.fillText('クラスカードは ないよ。ベーシックカードが ぜんぶ つかえる。', r.x+20, r.y+48);
    } else {
      const exp = hero.classExp[id]||0, ratio = exp/CLASS_MAX, owned = hero.deck.concat(hero.box).filter(x=>CARDS[x].cls===id).length;
      g.fillStyle='#333'; g.fillRect(r.x+20, r.y+43, 140, 9);
      g.fillStyle = hero.mastered[id] ? '#9f9' : CL.color; g.fillRect(r.x+20, r.y+43, 140*ratio, 9);
      g.fillStyle='#fff'; g.font='11px sans-serif'; g.textBaseline='middle';
      g.fillText(hero.mastered[id] ? 'クラスEXP MAX！' : `クラスEXP ${exp}/${CLASS_MAX}`, r.x+170, r.y+48);
      g.fillStyle='#bfe'; g.textAlign='right'; g.fillText(`クラスカード ${owned}まい`, r.x+r.w-10, r.y+48); g.textAlign='left';
    }
  });
  g.fillStyle='#ffd966'; g.font='11px sans-serif'; g.textAlign='left'; g.textBaseline='middle';
  g.fillText(c.note || '↑↓で えらぶ / Z で クラスチェンジ / X で もどる (クラスEXPは たたかうたびに たまる)', 10, 307);

  if (c.ui === 'confirm') {
    const CL = CLASSES[CLASS_ORDER[c.cursor]];
    g.fillStyle='rgba(0,0,0,.55)'; g.fillRect(0,0,W,H);
    panel(40, 84, 400, 146);
    g.fillStyle='#fff'; g.font='bold 15px sans-serif'; g.textAlign='center'; g.fillText(`${CL.name}に クラスチェンジする？`, W/2, 108);
    g.font='12px sans-serif'; g.fillStyle='#cde';
    g.fillText('・つかえなくなった カードは ボックスに もどるよ', W/2, 136);
    g.fillText('・クラスカードを じどうで デッキに いれるよ', W/2, 156);
    g.fillText('・いつでも もとの クラスに もどれるよ', W/2, 176);
    button(CL_YES().x, CL_YES().y, CL_YES().w, CL_YES().h, 'はい', c.yes===0);
    button(CL_NO().x, CL_NO().y, CL_NO().w, CL_NO().h, 'いいえ', c.yes===1);
    g.textAlign='left';
  }
}
