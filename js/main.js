// 画面の切り替え(draw)とメインループ
function draw(){
  if (sceneBox) { drawScene(); drawChoice(); return; }   // 一枚絵の場面(全面)。選択肢があれば その上に
  if (classScreen) drawClassScreen();
  else if (deckEdit) drawDeckEdit();
  else if (copierScreen) drawCopierScreen();
  else if (itemScreen) drawItemScreen();
  else if (questScreen) drawQuestScreen();
  else if (menuScreen) drawMainMenu();
  else if (battle && battle.state!=='trans') drawBattle();
  else if (battle) drawTrans();
  else drawMap();
  drawChoice();                                       // 選択肢(あれば。マップでも戦闘でも一番手前)
}

// ===== メインループ =====
let last = performance.now();
function loop(now){
  const dt = Math.min(now-last, 50); last = now;
  update(dt);
  g.setTransform(HIRES,0,0,HIRES,0,0);          // 論理座標(480x320)で描けるようにする
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
