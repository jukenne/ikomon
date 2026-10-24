// コンビニのコピー機画面と、メニューの「どうぐ」画面
let copierScreen = null, itemScreen = null;

// ===================================================================== コピー機
// がぞうデータを選んで Z → 10えん と データ1つで プロキシ(カード)が1まい カードボックスへ
const COPIER_ROWS = 6, COPIER_ROW_H = 38;
const COPIER_ROW = k => ({x:10, y:56+k*COPIER_ROW_H, w:SCREEN_W-20, h:COPIER_ROW_H-4});
const COPIER_CLOSE = () => ({x:SCREEN_W-78, y:4, w:70, h:18});
const copierList = () => Object.keys(CARDS).filter(id => hero.images[id] > 0);

function openCopierScreen(){ copierScreen = {cursor:0, scroll:0, note:''}; Object.keys(keys).forEach(k => keys[k] = false); }
function closeCopierScreen(){ copierScreen = null; }
function copierPrint(id){
  const c = copierScreen;
  if (hero.money < PROXY_PRICE) { c.note = 'おかねが たりない！'; return; }
  hero.money -= PROXY_PRICE; hero.images[id]--; if (hero.images[id] <= 0) delete hero.images[id];
  hero.box.push(id);
  c.note = `「${CARDS[id].name}」の プロキシを つくった！ (カードボックス ${hero.box.length}まい)`;
  const n = copierList().length; c.cursor = Math.min(c.cursor, Math.max(0, n-1));
  saveGame();
}
function copierInput(k){
  const c = copierScreen, list = copierList(), n = list.length;
  if (k === 'cancel') { closeCopierScreen(); return; }
  if (!n) return;
  if (k === 'up') c.cursor = (c.cursor+n-1) % n;
  else if (k === 'down') c.cursor = (c.cursor+1) % n;
  else if (k === 'ok') copierPrint(list[c.cursor]);
  if (c.cursor < c.scroll) c.scroll = c.cursor;
  if (c.cursor >= c.scroll + COPIER_ROWS) c.scroll = c.cursor - COPIER_ROWS + 1;
}
function copierPointerDown(e){
  const c = copierScreen, p = canvasPos(e), list = copierList();
  if (inRect(p, COPIER_CLOSE())) { closeCopierScreen(); return; }
  for (let k=0; k<COPIER_ROWS; k++) {
    const i = c.scroll + k;
    if (i < list.length && inRect(p, COPIER_ROW(k))) { c.cursor = i; copierPrint(list[i]); return; }
  }
}
function drawCopierScreen(){
  const c = copierScreen, W = SCREEN_W, H = SCREEN_H, list = copierList();
  g.fillStyle = '#14142a'; g.fillRect(0, 0, W, H);
  g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillStyle = '#fff'; g.font = 'bold 14px sans-serif'; g.fillText('コピーき', 10, 14);
  button(COPIER_CLOSE().x, COPIER_CLOSE().y, COPIER_CLOSE().w, COPIER_CLOSE().h, 'とじる(X)', false);
  panel(10, 28, W-20, 24);
  g.font = '13px sans-serif'; g.fillStyle = '#ffd966'; g.fillText(`しょじきん ${hero.money}えん`, 24, 41);
  g.fillStyle = '#bfe'; g.textAlign = 'right'; g.fillText(`プロキシ 1まい ${PROXY_PRICE}えん (がぞうデータを 1つ つかう)`, W-24, 41); g.textAlign = 'left';
  if (!list.length) {
    g.fillStyle = '#aab'; g.font = '14px sans-serif';
    g.fillText('がぞうデータが ない。てきを たおすと たまに ひろえるよ。', 24, 120);
  }
  for (let k=0; k<COPIER_ROWS; k++) {
    const i = c.scroll + k; if (i >= list.length) break;
    const id = list[i], card = CARDS[id], r = COPIER_ROW(k), sel = i === c.cursor, T = TYPE[card.type];
    g.fillStyle = 'rgba(30,30,62,.95)'; g.fillRect(r.x, r.y, r.w, r.h);
    g.fillStyle = T.c; g.fillRect(r.x, r.y, 8, r.h);
    g.strokeStyle = sel ? '#ffd966' : '#555'; g.lineWidth = sel ? 3 : 1.5; g.strokeRect(r.x+1, r.y+1, r.w-2, r.h-2);
    g.fillStyle = '#fff'; g.font = 'bold 14px sans-serif'; g.fillText(card.name, r.x+18, r.y+11);
    g.font = '11px sans-serif'; g.fillStyle = '#cde'; g.fillText(effectTokens(card, false).join(' / '), r.x+18, r.y+25);
    g.textAlign = 'right'; g.fillStyle = '#ffd966'; g.font = 'bold 14px sans-serif'; g.fillText(`データ ×${hero.images[id]}`, r.x+r.w-12, r.y+r.h/2); g.textAlign = 'left';
  }
  g.fillStyle = c.note ? '#9f9' : '#99a'; g.font = '12px sans-serif';
  g.fillText(c.note || '↑↓ えらぶ / Z プロキシを つくる / X とじる', 14, 300);
}

// ===================================================================== どうぐ(メニュー)
const ITEM_ROW = k => ({x:20, y:54+k*40, w:SCREEN_W-40, h:36});
const ITEM_CLOSE = () => ({x:SCREEN_W-78, y:4, w:70, h:18});
const itemList = () => Object.keys(ITEMS).filter(id => hero.items[id] > 0);

function openItemScreen(){ itemScreen = {cursor:0, note:''}; }
function closeItemScreen(){ itemScreen = null; }
function itemUse(id){ itemScreen.note = useItem(id); const n = itemList().length; itemScreen.cursor = Math.min(itemScreen.cursor, Math.max(0, n-1)); saveGame(); }
function itemInput(k){
  const c = itemScreen, list = itemList(), n = list.length;
  if (k === 'cancel') { closeItemScreen(); return; }
  if (!n) return;
  if (k === 'up') c.cursor = (c.cursor+n-1) % n;
  else if (k === 'down') c.cursor = (c.cursor+1) % n;
  else if (k === 'ok') itemUse(list[c.cursor]);
}
function itemPointerDown(e){
  const p = canvasPos(e), list = itemList();
  if (inRect(p, ITEM_CLOSE())) { closeItemScreen(); return; }
  for (let k=0; k<list.length; k++) if (inRect(p, ITEM_ROW(k))) { itemScreen.cursor = k; itemUse(list[k]); return; }
}
function drawItemScreen(){
  const c = itemScreen, W = SCREEN_W, H = SCREEN_H, list = itemList();
  g.fillStyle = '#14142a'; g.fillRect(0, 0, W, H);
  g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillStyle = '#fff'; g.font = 'bold 14px sans-serif'; g.fillText('どうぐ', 10, 14);
  button(ITEM_CLOSE().x, ITEM_CLOSE().y, ITEM_CLOSE().w, ITEM_CLOSE().h, 'とじる(X)', false);
  panel(10, 28, W-20, 20);
  g.font = '12px sans-serif'; g.fillStyle = '#ffd966'; g.fillText(`しょじきん ${hero.money}えん`, 24, 38);
  g.fillStyle = '#bfe'; g.textAlign = 'right'; g.fillText(`HP ${hero.hp}/${hero.maxHp}`, W-24, 38); g.textAlign = 'left';
  if (!list.length) { g.fillStyle = '#aab'; g.font = '14px sans-serif'; g.fillText('もっている どうぐは ない。コンビニで かえるよ。', 24, 110); }
  list.forEach((id, k) => {
    const it = ITEMS[id], r = ITEM_ROW(k), sel = k === c.cursor;
    g.fillStyle = 'rgba(30,30,62,.95)'; g.fillRect(r.x, r.y, r.w, r.h);
    g.strokeStyle = sel ? '#ffd966' : '#555'; g.lineWidth = sel ? 3 : 1.5; g.strokeRect(r.x+1, r.y+1, r.w-2, r.h-2);
    g.fillStyle = sel ? '#ffd966' : '#fff'; g.font = 'bold 15px sans-serif'; g.fillText(`${sel ? '▶ ' : '   '}${it.name}`, r.x+10, r.y+r.h/2);
    g.fillStyle = '#cde'; g.font = '12px sans-serif'; g.fillText(it.desc, r.x+150, r.y+r.h/2);
    g.textAlign = 'right'; g.fillStyle = '#ffd966'; g.font = 'bold 14px sans-serif'; g.fillText(`×${hero.items[id]}`, r.x+r.w-12, r.y+r.h/2); g.textAlign = 'left';
  });
  g.fillStyle = c.note ? '#9f9' : '#99a'; g.font = '12px sans-serif';
  g.fillText(c.note || '↑↓ えらぶ / Z つかう / X とじる', 14, 300);
}
