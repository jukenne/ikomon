// 入力: キーボード/十字ボタン/ポインター(画面ごとに振り分け)
// 画面の優先順位(上にあるほど手前): クラスチェンジ > デッキ編集 > コピー機 > どうぐ > クエスト > メニュー > 選択肢 > 戦闘 > マップ
const KEYMAP = {ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',W:'up',S:'down',A:'left',D:'right'};
const BATTLE_KEYS = {ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',W:'up',S:'down',A:'left',D:'right',
  z:'ok',Z:'ok',Enter:'ok',' ':'ok',x:'cancel',X:'cancel',Escape:'cancel',Backspace:'cancel'};
const isMenuKey = k => k==='Tab';                       // メニューを開く/閉じるキー
const canOpenMenu = () => !battle && !dialog && !player.moving && !ev && !choiceBox;
addEventListener('keydown', e=>{
  if (e.key === 'Tab') e.preventDefault();                // Tabで ブラウザのフォーカスが動かないように
  const m = BATTLE_KEYS[e.key];
  if (sceneBox && !choiceBox) { // 一枚絵の場面(カットイン・回想): Zで送る / Xで飛ばす(飛ばせる場面のみ)。選択肢が出ているときは選択肢が先
    if (m) { e.preventDefault(); if (!e.repeat) { if (m === 'ok') sceneAdvance(); else if (m === 'cancel') sceneSkip(); } }
    return;
  }
  if (classScreen) { // クラスチェンジ画面
    if (m || e.key==='c' || e.key==='C') { e.preventDefault(); if (!e.repeat) classInput(m || 'cancel'); }
    return;
  }
  if (deckEdit) { // デッキ編集中
    if (e.key==='c' || e.key==='C') { e.preventDefault(); openClassScreen('deck'); return; }
    if (m || isMenuKey(e.key)) { e.preventDefault(); if (!e.repeat) deckInput(m || 'cancel'); }
    return;
  }
  if (copierScreen) { // コピー機
    if (m || isMenuKey(e.key)) { e.preventDefault(); if (!e.repeat) copierInput(m || 'cancel'); }
    return;
  }
  if (itemScreen) { // どうぐ
    if (m || isMenuKey(e.key)) { e.preventDefault(); if (!e.repeat) itemInput(m || 'cancel'); }
    return;
  }
  if (questScreen) { // クエスト確認
    if (m || isMenuKey(e.key)) { e.preventDefault(); if (!e.repeat) questInput(m || 'cancel'); }
    return;
  }
  if (menuScreen) { // メニュー
    if (m || isMenuKey(e.key)) { e.preventDefault(); if (!e.repeat) menuInput(m || 'cancel'); }
    return;
  }
  if (choiceBox) { // 選択肢
    if (m) { e.preventDefault(); if (!e.repeat) choiceInput(m); }
    return;
  }
  if (canOpenMenu()) {
    if (isMenuKey(e.key) || e.key==='Escape') { e.preventDefault(); openMainMenu(); return; }
    if (e.key==='c' || e.key==='C') { e.preventDefault(); openClassScreen('map'); return; }
  }
  if (battle) { // 戦闘中は戦闘側の入力だけ受ける
    if (m) { e.preventDefault(); if (!e.repeat) battleInput(m); }
    return;
  }
  if (KEYMAP[e.key]) { keys[KEYMAP[e.key]] = true; e.preventDefault(); }
  if (e.key==='Shift') shiftHeld = true;
  if (!e.repeat && (e.key==='z'||e.key==='Z'||e.key==='Enter'||e.key===' ')) { e.preventDefault(); onAction(); }
});
addEventListener('keyup', e=>{
  if (KEYMAP[e.key]) keys[KEYMAP[e.key]] = false;
  if (e.key==='Shift') shiftHeld = false;
});

// タッチ用の十字ボタン(戻る/決定つき)。画面ごとに振り分ける。k: up/down/left/right/ok/cancel
function padInput(k){
  if (sceneBox && !choiceBox) { if (k === 'ok') sceneAdvance(); else if (k === 'cancel') sceneSkip(); }
  else if (classScreen) classInput(k);
  else if (deckEdit) deckInput(k);
  else if (copierScreen) copierInput(k);
  else if (itemScreen) itemInput(k);
  else if (questScreen) questInput(k);
  else if (menuScreen) menuInput(k);
  else if (choiceBox) choiceInput(k);
  else if (battle) battleInput(k);
  else if (k === 'ok') onAction();
  else if (k === 'cancel') { if (canOpenMenu()) openMainMenu(); }
  else keys[k] = true;                                // 方向キー: 押している間だけ歩く
}
document.querySelectorAll('#pad button').forEach(b=>{
  const d=b.dataset.d, a=b.dataset.a;
  const on=e=>{ e.preventDefault(); padInput(a || d); };
  const off=e=>{ e.preventDefault(); if (d) keys[d]=false; };
  b.addEventListener('pointerdown',on); b.addEventListener('pointerup',off);
  b.addEventListener('pointerleave',off); b.addEventListener('pointercancel',off);
});

cv.addEventListener('pointerdown', e=>{
  if (sceneBox && !choiceBox) sceneAdvance();
  else if (classScreen) classPointerDown(e);
  else if (deckEdit) deckPointerDown(e);
  else if (copierScreen) copierPointerDown(e);
  else if (itemScreen) itemPointerDown(e);
  else if (questScreen) questPointerDown(e);
  else if (menuScreen) menuPointerDown(e);
  else if (choiceBox) choicePointerDown(e);
  else if (battle) battlePointerDown(e);
  else if (canOpenMenu() && inRect(canvasPos(e), HUD_RECT())) openMainMenu();   // 右上の表示をタップ
  else onAction();
});
cv.addEventListener('pointermove', e=>{
  if (deckEdit && deckEdit.drag) deckPointerMove(e);
  else if (battle && battle.drag) battlePointerMove(e);
});
cv.addEventListener('pointerup', e=>{
  if (deckEdit && deckEdit.drag) deckPointerUp(e);
  else if (battle && battle.drag) battlePointerUp(e);
});
cv.addEventListener('pointercancel', ()=>{ if (battle) battle.drag = null; if (deckEdit) deckEdit.drag = null; });
