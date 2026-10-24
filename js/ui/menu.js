// メニュー画面(Tabキー / 右上の表示をタップ): デッキ編集・クラスチェンジ・クエスト・どうぐ・セーブ
// 各画面は、閉じるとこのメニューに戻る(メニューは menuScreen が残っているので、下に見えている)。
let menuScreen = null, questScreen = null;

const MENU_ITEMS = [
  {label:'デッキへんしゅう', run:() => openDeckEdit()},
  {label:'クラスチェンジ',   run:() => openClassScreen('menu')},
  {label:'クエスト',         run:() => openQuestScreen()},
  {label:'どうぐ',           run:() => openItemScreen()},
  {label:'セーブ',           run:() => { saveGame(); menuScreen.note = 'セーブしました！'; }},
  {label:'とじる',           run:() => closeMainMenu()},
];
const MENU_ROW = i => ({x:20, y:44+i*38, w:160, h:34});

function openMainMenu(){
  menuScreen = {cursor:0, note:''};
  Object.keys(keys).forEach(k => keys[k] = false);
}
function closeMainMenu(){ menuScreen = null; }
function menuInput(k){
  const m = menuScreen, n = MENU_ITEMS.length;
  if (k === 'up') m.cursor = (m.cursor+n-1) % n;
  else if (k === 'down') m.cursor = (m.cursor+1) % n;
  else if (k === 'cancel') closeMainMenu();
  else if (k === 'ok') { m.note = ''; MENU_ITEMS[m.cursor].run(); }
}
function menuPointerDown(e){
  const p = canvasPos(e);
  for (let i=0; i<MENU_ITEMS.length; i++) if (inRect(p, MENU_ROW(i))) { menuScreen.cursor = i; menuScreen.note = ''; MENU_ITEMS[i].run(); return; }
}

function drawMainMenu(){
  drawMap();                                                  // 後ろにマップを見せる
  const m = menuScreen, W = SCREEN_W, H = SCREEN_H;
  g.fillStyle = 'rgba(8,8,24,.72)'; g.fillRect(0, 0, W, H);
  panel(12, 12, 178, 296);
  g.fillStyle = '#fff'; g.font = 'bold 15px sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillText('メニュー', 24, 28);
  MENU_ITEMS.forEach((it, i) => {
    const r = MENU_ROW(i), sel = i === m.cursor;
    if (sel) { g.fillStyle = 'rgba(255,217,102,.18)'; g.fillRect(r.x, r.y, r.w, r.h); }
    g.fillStyle = sel ? '#ffd966' : '#fff'; g.font = '16px sans-serif';
    g.fillText((sel ? '▶ ' : '   ') + it.label, r.x+6, r.y+r.h/2);
  });
  if (m.note) { g.fillStyle = '#9f9'; g.font = '13px sans-serif'; g.fillText(m.note, 24, 288); }

  // 右: いまの状態と目的
  panel(200, 12, 268, 296);
  const pt = Assets.get('portraits/ikoan.png');
  if (pt) { const ph = 96, pw = imgW(pt)*ph/imgH(pt); g.drawImage(pt, 214, 24, pw, ph); }
  const cl = CLASSES[hero.cls];
  g.textBaseline = 'top'; g.textAlign = 'left';
  g.fillStyle = '#fff'; g.font = 'bold 17px sans-serif'; g.fillText(`${hero.name}  Lv${hero.lv}`, 274, 28);
  g.font = '13px sans-serif'; g.fillStyle = cl.color; g.fillText(cl.name, 274, 54);
  g.fillStyle = '#fff'; g.fillText(`HP ${hero.hp} / ${hero.maxHp}`, 274, 76);
  g.fillStyle = '#bfe'; g.fillText(`つぎの レベルまで ${expNeed(hero.lv) - hero.exp}`, 274, 96);
  g.fillStyle = '#fff'; g.fillText(`デッキ ${hero.deck.length}まい / ボックス ${hero.box.length}まい`, 214, 126);
  g.fillStyle = '#ffd966'; g.fillText(`おかね ${hero.money}えん`, 214, 144);
  g.fillStyle = '#ffd966'; g.font = 'bold 13px sans-serif'; g.fillText('いまの もくてき', 214, 170);
  g.fillStyle = '#fff'; g.font = '14px sans-serif';
  wrapRows(currentObjective(), 240).slice(0, 4).forEach((r, i) => g.fillText(r, 214, 192 + i*22));
  g.fillStyle = '#99a'; g.font = '11px sans-serif'; g.fillText('↑↓ えらぶ / Z けってい / Tab・X とじる', 214, 288);
}

// ---- クエスト確認 ----
const Q_CLOSE = () => ({x:SCREEN_W-78, y:4, w:70, h:18});
function openQuestScreen(){ questScreen = {}; }
function closeQuestScreen(){ questScreen = null; }
function questInput(k){ if (k === 'cancel' || k === 'ok') closeQuestScreen(); }
function questPointerDown(e){ if (inRect(canvasPos(e), Q_CLOSE())) closeQuestScreen(); }

function drawQuestScreen(){
  const W = SCREEN_W, H = SCREEN_H;
  g.fillStyle = '#14142a'; g.fillRect(0, 0, W, H);
  g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillStyle = '#fff'; g.font = 'bold 14px sans-serif'; g.fillText('クエスト', 10, 14);
  button(Q_CLOSE().x, Q_CLOSE().y, Q_CLOSE().w, Q_CLOSE().h, 'とじる(X)', false);

  // いまの もくてき
  panel(10, 30, W-20, 54);
  g.fillStyle = '#ffd966'; g.font = 'bold 12px sans-serif'; g.fillText('いまの もくてき', 24, 46);
  g.fillStyle = '#fff'; g.font = '14px sans-serif'; g.fillText(currentObjective(), 24, 68);

  g.fillStyle = '#bfe'; g.font = 'bold 13px sans-serif'; g.fillText('どうじょうの クエスト (クリアすると クラスチェンジが できる)', 10, 104);
  QUEST_IDS.forEach((id, i) => {
    const q = hero.quests[id], d = QUESTS[id], cl = CLASSES[id], y = 118 + i*62;
    g.fillStyle = 'rgba(30,30,62,.95)'; g.fillRect(10, y, W-20, 56);
    g.fillStyle = cl.color; g.fillRect(10, y, 8, 56);
    g.strokeStyle = '#555'; g.lineWidth = 1.5; g.strokeRect(11, y+1, W-22, 54);
    g.fillStyle = '#fff'; g.font = 'bold 15px sans-serif'; g.fillText(d.title, 28, y+14);
    g.font = '12px sans-serif'; g.fillStyle = '#cde'; g.fillText(questText(d), 28, y+32);
    // 状態
    let label, color;
    if (q.state === 'none')         { label = 'みじゅしん (どうじょうで うけよう)'; color = '#99a'; }
    else if (q.state === 'active')  { label = `${q.count}/${d.need}`; color = '#ffd966'; }
    else if (q.state === 'done')    { label = 'たっせい！ どうじょうで ほうこく'; color = '#9f9'; }
    else                            { label = 'クリアずみ ★'; color = '#9f9'; }
    g.textAlign = 'right'; g.fillStyle = color; g.font = 'bold 12px sans-serif'; g.fillText(label, W-24, y+14); g.textAlign = 'left';
    if (q.state === 'active' || q.state === 'done' || q.state === 'cleared') {
      const ratio = q.state === 'cleared' ? 1 : q.count/d.need;
      g.fillStyle = '#333'; g.fillRect(28, y+42, 200, 7);
      g.fillStyle = q.state === 'active' ? cl.color : '#6fdc8c'; g.fillRect(28, y+42, 200*ratio, 7);
    }
  });
}
