// 戦闘の描画: 背景・ステータス枠・カード・メニュー
// ---- 描画 ----

function drawStatusBox(x,y,w,h,title,hp,maxHp,showNum){
  panel(x,y,w,h);
  g.fillStyle='#fff'; g.font='bold 14px sans-serif'; g.textBaseline='top'; g.textAlign='left'; g.fillText(title, x+10, y+7);
  const r = Math.max(0, hp/maxHp), gx = x+34, gy = y+28, gw = w-48;   // HPゲージ(割合で色が変わる)
  g.fillStyle='#ffd966'; g.font='bold 11px sans-serif'; g.fillText('HP', x+10, gy-1);
  g.fillStyle='#333'; g.fillRect(gx,gy,gw,9);
  g.fillStyle = r>0.5 ? '#4ccf5a' : r>0.2 ? '#f0c030' : '#e04848';
  g.fillRect(gx,gy,gw*r,9);
  if (showNum) { g.fillStyle='#fff'; g.font='11px sans-serif'; g.textAlign='right'; g.fillText(`${Math.ceil(hp)}/${maxHp}`, x+w-8, y+7); g.textAlign='left'; }
}

// カード1枚を描く。o: {sel:選択中, tag:左上の小ラベル}
function drawCard(x,y,w,h,c,o={}){
  const T = TYPE[c.type];
  const art = (!c.fused && c.id) ? Assets.get(`cards/${c.id}.png`) : null;   // カードの絵(あれば全面の背景になる)
  if (art) drawCover(art, x, y, w, h); else { g.fillStyle='#fdf6e3'; g.fillRect(x,y,w,h); }
  g.fillStyle=T.c; g.fillRect(x,y,w,19);
  g.fillStyle='#fff'; g.textBaseline='middle'; g.textAlign='left';
  g.font='bold 11px sans-serif';
  g.fillText((c.fused ? (c.same?'★ぞうふく ':'★') : '') + T.label, x+6, y+9);
  const right = o.tag || c.clsLabel || (CLASSES[c.cls] ? CLASSES[c.cls].short : '');   // 右上: ①②のしるし or クラス名
  if (right) { g.textAlign='right'; g.fillText(right, x+w-6, y+9); g.textAlign='left'; }
  g.font='11px sans-serif';
  const rows = c.desc ? wrapRows(c.desc, w-14).slice(0,4) : wrapTokens(effectTokens(c,false), w-14).slice(0,4);   // desc: 特別なカードの説明文
  if (art) g.fillStyle='rgba(253,246,227,.88)', g.fillRect(x+3, y+21, w-6, 18);          // 絵の上でも読めるよう、名前に下地
  g.fillStyle='#222'; fitFont(c.name, w-12, 14, true); g.fillText(c.name, x+6, y+30);
  if (art) g.fillStyle='rgba(15,15,40,.78)', g.fillRect(x+3, y+h-6-rows.length*13, w-6, rows.length*13+3);   // 効果にも下地
  g.fillStyle = art ? '#fff' : '#333';
  g.font='11px sans-serif';
  rows.forEach((t,i)=>{ fitFont(t, w-12, 11, false); g.fillText(t, x+7, art ? y+h-6-(rows.length-1-i)*13-5 : y+47+i*13); });
  if (c.special) { g.strokeStyle = RAINBOW[Math.floor(performance.now()/120) % 7]; g.lineWidth = 3; g.strokeRect(x-2, y-2, w+4, h+4); }   // 光の剣: 七色にかがやく わく
  g.strokeStyle = o.sel ? '#ffd966' : '#222'; g.lineWidth = o.sel ? 4 : 2;
  g.strokeRect(x+(o.sel?2:1), y+(o.sel?2:1), w-(o.sel?4:2), h-(o.sel?4:2));
}


// 敵の当たり判定(タップ・ドラッグ先の判定に使う)
function enemyRect(e){ const k = battle.enemies.length > 1 ? 0.8 : 1; return {x:e.x-54*k, y:22, w:108*k, h:100}; }
function enemyAtPoint(p){ const i = battle.enemies.findIndex(e => e.hp > 0 && inRect(p, enemyRect(e))); return i; }
function nearestEnemy(p){                                   // 横の位置が いちばん近い生きた敵
  let best = -1, bd = 1e9;
  battle.enemies.forEach((e, i) => { if (e.hp > 0 && Math.abs(e.x - p.x) < bd) { bd = Math.abs(e.x - p.x); best = i; } });
  return best;
}

function drawBattleScene(){
  const b = battle, W = SCREEN_W, multi = b.enemies.length > 1, k = multi ? 0.8 : 1;
  const bgArt = b.bgList ? Assets.first(b.bgList) : Assets.get(b.bg || 'bg/battle.png');   // 背景の絵があれば全面に(bgList は先に書いた方を優先)、無ければ 空と草原の図形
  if (bgArt) drawCover(bgArt, 0, 0, W, SCREEN_H);
  else if (b.final) drawFinalBg(b);
  else {
    const sky = g.createLinearGradient(0,0,0,130); sky.addColorStop(0,'#8ed0ff'); sky.addColorStop(1,'#d8f0ff');
    g.fillStyle = sky; g.fillRect(0,0,W,130);
    g.fillStyle = '#6cbf5f'; g.fillRect(0,118,W,202);
    g.fillStyle = '#5aa94f'; for (let i=0;i<14;i++) g.fillRect((i*83)%W, 130+(i*37)%50, 24, 4);
  }
  g.fillStyle='rgba(0,0,0,.18)';
  g.beginPath(); g.ellipse(118,172,40,9,0,0,7); g.fill();

  // 敵(2体のときは横にならべる)
  const dragging = b.drag && b.drag.moved && b.drag.zone;
  b.enemies.forEach((e, i) => {
    if (e.alpha <= 0.02) return;
    g.save(); g.globalAlpha = e.alpha;
    g.fillStyle='rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(e.x,120,62*k,12,0,0,7); g.fill();
    if (multi && e.hp > 0) {                                  // ねらいの輪(いまの ターゲットが 黄色)
      const hot = dragging ? b.drag.tIdx === i : b.tIdx === i;
      g.strokeStyle = hot ? '#ffd966' : 'rgba(255,255,255,.4)'; g.lineWidth = hot ? 3 : 1.5;
      g.beginPath(); g.ellipse(e.x,120,68*k,14,0,0,7); g.stroke();
    }
    const shakeX = e.shake>0 ? Math.sin(e.shake/18)*6 : 0;
    const lungeX = e.lunge>0 ? -Math.sin(e.lunge/300*Math.PI)*24 : 0;
    const lungeY = e.lunge>0 ?  Math.sin(e.lunge/300*Math.PI)*12 : 0;
    g.translate(e.x+shakeX+lungeX, 118+lungeY);
    // 敵の絵があれば絵を、無ければ図形を描く。激昂後(e.rageForm)は enemies/{id}_rage.png があればそれを使う。第二形態などは artId で別の絵
    const artKey = e.artId || e.id, eArt = artKey && ((e.rageForm && Assets.get(`enemies/${artKey}_rage.png`)) || Assets.get(`enemies/${artKey}.png`));
    if (eArt) drawSprite(eArt, 0, 0, (ART.enemyH[artKey] || ART.enemyH.default) * k);
    else { g.scale((e.scale || 1) * k, (e.scale || 1) * k); e.draw(performance.now(), e); }   // 第2引数=敵の状態(激昂後の姿に変える用)
    g.restore();
  });

  // いこあん(後ろ姿・2倍)
  const hx = b.heroShake>0 ? Math.sin(b.heroShake/18)*6 : 0;
  const hl = b.heroLunge>0 ? Math.sin(b.heroLunge/300*Math.PI)*30 : 0;
  const dArt = b.duelist && Assets.get('battle/player_duelist.png');            // ザ・デュエリスト(ラスボス戦の復活後)
  const hArt = dArt || Assets.get('battle/player.png');
  if (b.duelist) sceneGlow(118+hx+hl, 130, 70, '255,255,255', 0.35 + 0.15*Math.sin(performance.now()/200));
  if (hArt) drawSprite(b.duelist && !dArt ? duelistSprite(hArt) : hArt, 118+hx+hl, 172-hl*0.3, ART.battlePlayerH);
  else { g.save(); g.translate(86+hx+hl, 106-hl*0.3); g.scale(2,2);
    drawChar(0,0, b.duelist ? g.createPattern(rainbowStripeCanvas(), 'repeat') : '#3a7bd5','up',0); g.restore(); }

  // ダメージ数字
  g.textAlign='center'; g.textBaseline='middle'; g.font='bold 22px sans-serif';
  for (const p of b.pops) {
    g.fillStyle='#000'; g.fillText(p.text, p.x+1, p.y-p.t*0.05+1);
    g.fillStyle=p.color; g.fillText(p.text, p.x, p.y-p.t*0.05);
  }
  g.textAlign='left';

  // 敵のステータス枠(左上に縦ならび)
  b.enemies.forEach((e, i) => {
    const y = multi ? 4 + i*44 : 10, bh = multi ? 40 : 46;
    drawStatusBox(10, y, 200, bh, (e.title || e.name) + (e.tag || '') + (e.hp<=0 ? '  (たおした)' : ''), e.dispHp, e.maxHp, false);
    if (multi && b.tIdx === i && e.hp > 0) { g.strokeStyle='#ffd966'; g.lineWidth=2; g.strokeRect(9, y-1, 202, bh+2); }
    if (e.poison > 0) {                                      // 敵の どく
      g.font='bold 11px sans-serif'; g.textBaseline='top'; g.textAlign='right'; g.fillStyle='#d9a0ff';
      g.fillText(`どく ${e.poison}`, 204, y+7); g.textAlign='left';
    }
  });
  drawStatusBox(W-214, 112, 204, 74, b.duelist ? 'ザ・デュエリスト' : hero.name+'  Lv'+hero.lv, b.dispHp, hero.maxHp, true);
  g.fillStyle='#bfe'; g.font='11px sans-serif'; g.textBaseline='top'; g.textAlign='left';
  const sl = statusLines(); g.fillText(sl[0], W-204, 112+44); g.fillStyle='#ffd966'; g.fillText(sl[1], W-204, 112+58);
}

// 手札トレイ: 下部に札を並べる領域 (y=188〜)
const TRAY_Y = 188, CARD_Y = 212, CARD_W = 148, CARD_H = 102;
function cardX(i, n){ return Math.round((SCREEN_W - (n*(CARD_W+10)-10))/2) + i*(CARD_W+10); }

function drawTray(header){
  const b = battle, W = SCREEN_W, H = SCREEN_H;
  g.fillStyle='rgba(15,15,40,.9)'; g.fillRect(0,TRAY_Y,W,H-TRAY_Y);
  g.fillStyle='#ffd966'; g.font='12px sans-serif'; g.textBaseline='middle'; g.textAlign='left';
  g.fillText(header, 10, TRAY_Y+10);
}
function statusLines(){
  const b = battle, buf = [];
  if (b.atkUp) buf.push(`ATK+${b.atkUp}`);
  if (b.guard) buf.push(`ガード${b.guard}`);
  if (b.thorn) buf.push(`はんげき${b.thorn}`);
  if (b.regen) buf.push(`リジェネ${b.regen}`);
  if (b.heroPoison) buf.push(`どく${b.heroPoison}`);
  return [b.duelist ? 'ひかりの つるぎ' : `のこり ${b.pile.length + b.hand.length}まい`, buf.join(' ')];
}
function statusText(){ return statusLines().filter(Boolean).join('  '); }

function drawMenu(){
  const b = battle, W = SCREEN_W, n = b.hand.length;
  if (b.ui==='pick') {
    const d = b.drag;
    drawTray(b.enemies.length > 1 ? 'ドラッグ: てきへ=つかう / カードへ=ゆうごう   X: ねらいを かえる' : 'ドラッグ: うえへ=つかう / ほかのカードへ=ゆうごう');
    button(W-88, TRAY_Y+2, 80, 18, b.noFlee ? 'にげられない' : 'にげる', b.cursor===n && !d);
    b.hand.forEach((c,i)=>{
      if (d && d.moved && i===d.i) { g.globalAlpha=.25; drawCard(cardX(i,n), CARD_Y, CARD_W, CARD_H, c); g.globalAlpha=1; return; }
      const target = d && d.over===i;
      drawCard(cardX(i,n), CARD_Y - (target || (!d && b.cursor===i) ? 6 : 0), CARD_W, CARD_H, c,
               {sel: target || (!d && b.cursor===i), tag: target ? 'ゆうごう！' : ''});
    });
  } else if (b.ui==='action') {
    drawTray('どうする？    ' + statusText());
    drawCard(8, CARD_Y-4, CARD_W, CARD_H, b.hand[b.src], {sel:true});
    panel(166, CARD_Y-4, 306, CARD_H);
    const opts = ['つかう', 'ゆうごうする', 'やめる'];
    g.font='16px sans-serif'; g.textBaseline='top';
    opts.forEach((t,i)=>{
      const dim = i===1 && n<2;
      g.fillStyle = dim ? '#888' : '#fff'; g.fillText(t, 204, CARD_Y+4+i*26);
      if (i===b.ac) { g.fillStyle='#ffd966'; g.fillText('▶', 182, CARD_Y+4+i*26); }
    });
    const help = [['この カード 1まいを つかう。'],
                  ['ほかの 1まいと ゆうごう！ おなじタイプ=パワーアップ','ちがうタイプ=りょうほうの こうか (すこし よわい)'],
                  ['もどる']][b.ac];
    g.font='11px sans-serif'; g.fillStyle='#bfe';
    help.forEach((t,i)=> g.fillText(t, 182, CARD_Y+84-(help.length-1-i)*14));
    if (b.note) { g.fillStyle='#ff9090'; g.fillText(b.note, 182, CARD_Y+66); }
  } else if (b.ui==='partner') {
    drawTray('ゆうごうの あいてを えらぼう    (X で もどる)');
    b.hand.forEach((c,i)=>{
      const isSrc = i===b.src, isP = i===b.partner;
      drawCard(cardX(i,n), CARD_Y - (isP?6:0), CARD_W, CARD_H, c, {sel:isP, tag: isSrc?'①':(isP?'②':'')});
    });
  } else if (b.ui==='preview') {
    drawTray('ゆうごうの けっか！    ' + statusText());
    const a = b.hand[b.src], c = b.hand[b.partner], f = b.fused;
    drawCard(6, CARD_Y+4, 104, 94, a, {tag:'①'});
    drawCard(130, CARD_Y+4, 104, 94, c, {tag:'②'});
    g.fillStyle='#fff'; g.font='bold 20px sans-serif'; g.textAlign='center'; g.textBaseline='middle';
    g.fillText('＋', 120, CARD_Y+51); g.fillText('＝', 244, CARD_Y+51); g.textAlign='left';
    drawCard(256, CARD_Y-2, 130, 106, f, {sel:true});
    button(W-86, CARD_Y+22, 80, 26, 'ゆうごう！', b.pc===0);
    button(W-86, CARD_Y+60, 80, 26, 'やめる', b.pc===1);
  }
}


function drawDrag(){
  const b = battle, d = b.drag, W = SCREEN_W;
  if (!d || !d.moved) return;
  if (d.zone) {                                   // 使用ゾーン
    g.fillStyle='rgba(255,230,120,.22)'; g.fillRect(8,40,W-16,TRAY_Y-48);
    g.strokeStyle='#ffd966'; g.lineWidth=3; g.setLineDash([10,6]); g.strokeRect(9.5,41.5,W-19,TRAY_Y-51); g.setLineDash([]);
    g.fillStyle='#fff'; g.font='bold 18px sans-serif'; g.textAlign='center'; g.textBaseline='middle';
    const tt = b.enemies.length > 1 ? `はなして つかう！ → ${b.enemies[d.tIdx].name}` : 'はなして つかう！';
    g.strokeStyle='#000'; g.lineWidth=4; g.strokeText(tt, W/2, 100); g.fillText(tt, W/2, 100);
    g.textAlign='left';
  }
  if (d.over >= 0) {                              // 融合プレビュー(離す前に結果が見える)
    const f = fuseCards(b.hand[d.i], b.hand[d.over]);
    panel(W/2-92, 30, 184, 128);
    g.fillStyle='#ffd966'; g.font='bold 12px sans-serif'; g.textAlign='center'; g.textBaseline='top';
    g.fillText('ゆうごうすると…', W/2, 36); g.textAlign='left';
    drawCard(W/2-70, 52, 140, 100, f, {sel:true});
  }
  const x = d.x - d.ox, y = d.y - d.oy;           // つかんでいる札
  g.save(); g.shadowColor='rgba(0,0,0,.5)'; g.shadowBlur=12; g.shadowOffsetY=6;
  g.translate(x+CARD_W/2, y+CARD_H/2); g.rotate(0.04); g.scale(1.06,1.06); g.translate(-CARD_W/2, -CARD_H/2);
  drawCard(0, 0, CARD_W, CARD_H, b.hand[d.i], {sel:true});
  g.restore();
}

function drawBattle(){
  const b = battle, W = SCREEN_W, H = SCREEN_H;
  drawBattleScene();
  if (b.state==='menu') drawMenu();
  else if (b.state!=='wait') {
    // メッセージ枠
    const mx=8, my=H-96, mw=W-16, mh=88;
    panel(mx,my,mw,mh);
    g.fillStyle='#fff'; g.font='16px sans-serif'; g.textBaseline='top'; g.textAlign='left';
    if (b.msgRowsFor !== b.msg) { b.msgRows = wrapRows(b.msg, mw-32-28); b.msgRowsFor = b.msg; }   // 長い文は折り返す
    let left = Math.floor(b.chars);                                                            // 1文字ずつ表示(行をまたいで数える)
    b.msgRows.forEach((r, i) => { const t = r.slice(0, Math.max(0, left)); left -= r.length; if (t) g.fillText(t, mx+16, my+14+i*24); });
    if (b.state==='msg' && b.chars >= b.msg.length && Math.floor(performance.now()/400)%2) g.fillText('▼', mx+mw-32, my+mh-28);
  }
  if (b.drag) drawDrag();
  // 融合のフラッシュ
  if (b.flash > 0) { g.fillStyle=`rgba(${b.flashRGB || '190,120,255'},${Math.min(.85,b.flash/700)})`; g.fillRect(0,0,W,H); }
  // 終了時のフェードアウト / 遭遇直後のバーが開く演出
  if (b.state==='out') { g.fillStyle=`rgba(0,0,0,${Math.min(1,b.t/450)})`; g.fillRect(0,0,W,H); }
  if (b.state==='msg' && b.t<350 && !b.over) {
    const k = 1 - b.t/350; g.fillStyle='#000';
    g.fillRect(0,0,W,H/2*k); g.fillRect(0,H-H/2*k,W,H/2*k);
  }
}
// 遭遇演出: マップを白黒点滅させて切り替える
function drawTrans(){
  drawMap();
  const on = Math.floor(battle.t/110)%2===0;
  g.fillStyle = on ? 'rgba(255,255,255,.75)' : 'rgba(0,0,0,.55)';
  g.fillRect(0,0,SCREEN_W,SCREEN_H);
}

// ---- ラスボス戦の背景(絵が無いときの図形): 空に さかさまの城が ゆっくり おりてくる(演出のみ。戦闘には関係しない) ----
function drawFinalBg(b){
  const W = SCREEN_W;
  sceneSky('#0c0618', '#3a1450');
  sceneGlow(W/2, 30, 260, '180,60,200', 0.35);
  const drop = Math.min(26, b.turnCount * 1.1), shake = b.turnCount > 8 ? Math.sin(performance.now()/90) * 0.6 : 0;
  drawUpsideCastle(W/2 + shake, -64 + drop, 360, 150, '30,20,48');
  g.fillStyle = '#1c1428'; g.fillRect(0, 118, W, SCREEN_H-118);
  g.fillStyle = '#2a2038'; for (let i=0; i<14; i++) g.fillRect((i*83)%W, 130+(i*37)%50, 24, 4);
}
// 七色のボーダー服にした いこあんの絵(絵が無いとき、後ろ姿の絵の胴体あたりに しましまを重ねる)
const _duelistCache = new Map();
function duelistSprite(im){
  if (_duelistCache.has(im)) return _duelistCache.get(im);
  const w = imgW(im), h = imgH(im), c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.drawImage(im, 0, 0, w, h);
  x.globalCompositeOperation = 'source-atop'; x.globalAlpha = 0.7;
  const y0 = h*0.34, y1 = h*0.84, n = 14;
  for (let i=0; i<n; i++) { x.fillStyle = RAINBOW[i%7]; x.fillRect(0, y0 + (y1-y0)*i/n, w, (y1-y0)/n + 1); }
  _duelistCache.set(im, c); return c;
}
