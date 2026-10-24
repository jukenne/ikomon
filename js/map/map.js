// マップ: 歩行・会話・エンカウント・マップ描画
// ===== 現在のマップ =====
// マップのデータは data/maps.js。ここでは「いま表示しているマップ」を持ち、loadMap で切り替える。
let curMapId = null, curMap = null, MAP = null, MAP_W = 0, MAP_H = 0, NPCS = [];
function loadMap(id, x, y, dir){
  curMapId = id; curMap = MAPS[id];
  if (id === 'island' || id.startsWith('castle_')) preloadFinalArt();     // ラスボス戦の絵を先に読み込んでおく(出た瞬間に図形→絵に切り替わらないように)
  MAP = curMap.tiles; MAP_W = MAP[0].length; MAP_H = MAP.length;
  // NPCは読み込みのたびに初期状態へ(登場/退場の変化はイベントがその場で行う)
  NPCS = (curMap.npcs || []).map(n => {
    const o = {dir:'down', visible:true, ...n, px:n.x, py:n.y};
    if (n.showWhen) o.visible = condOk(n.showWhen);          // フラグで 居る/居ない が変わるNPC
    return o;
  });
  player.x = player.px = player.fromX = x; player.y = player.py = player.fromY = y;
  player.dir = dir || 'down'; player.moving = false; player.scripted = false;
}
// マップに入ったときに自動で始まるイベント(最初に条件が合ったもの)
function enterEvent(){
  const en = (curMap.onEnter || []).find(o => condOk(o.when));
  return en ? en.run : null;
}

// ===== ロジック =====
const DIRS = {up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const tileAt = (x,y)=> (x<0||y<0||x>=MAP_W||y>=MAP_H) ? '#' : MAP[y][x];
const npcAt = (x,y)=> NPCS.find(n=>n.visible && n.x===x && n.y===y);
const canWalk = (x,y)=> T[tileAt(x,y)].walk && !npcAt(x,y);

function onAction(){
  if (battle) { battleInput('ok'); return; }
  if (dialog) {
    dialog.i++;
    if (dialog.i >= dialogPages(dialog).length) {
      dialog = null;
      if (ev && ev.wait === 'dialog') { ev.wait = null; stepEvent(); }   // イベントの会話なら続きへ
    } else sfx(dialog.name ? 'talk' : 'talkLow');                      // 次のページへ
    return;
  }
  if (ev) { if (ev.wait === 'card' && ev.card.t > 800) ev.card.t = 1e9; return; }   // 章タイトルは送れる
  if (player.moving) return;
  const [dx,dy] = DIRS[player.dir], fx = player.x+dx, fy = player.y+dy;
  const n = npcAt(fx, fy);
  if (n) { talkTo(n); return; }
  const sp = (curMap.spots || []).find(o => o.x===fx && o.y===fy && condOk(o.when));
  if (sp) { runEvent(sp.run); return; }
  const tt = TALK_TILES[tileAt(fx, fy)];
  if (tt) dialog = {name:'', lines:tt.slice(), i:0};
}

function talkTo(n){
  if (n.flag) hero.flags[n.flag] = true;           // 「このNPCと話した」の記録(イベントの条件に使う)
  let lines = (n.lines || []).slice();
  const v = (n.talk || []).find(t => condOk(t.when));   // 条件つきのセリフ(フラグで変わる)
  if (v) { if (v.run) { runEvent(v.run); return; } lines = v.lines.slice(); }
  if (n.heal) { // 村人は話しかけるとHPを全回復してくれる
    const hurt = hero.hp < hero.maxHp;
    hero.hp = hero.maxHp;
    if (hurt) lines.push('きずが なおったよ！ (HP かいふく)');
    saveGame();
  }
  dialog = {name:n.name, lines, i:0};
  sfx('talk');
}

function tryMove(dir){
  player.dir = dir;
  const [dx,dy] = DIRS[dir];
  const nx = player.x+dx, ny = player.y+dy;
  if (!canWalk(nx,ny)) return false; // 向きだけ変わる
  player.fromX = player.x; player.fromY = player.y;
  player.x = nx; player.y = ny;
  player.moving = true; player.t = 0;
  player.ms = shiftHeld ? DASH_MS : STEP_MS;
  return true;
}

function onArrive(){
  saveGame();                                   // 1マス歩くたびにオートセーブ
  const tr = (curMap.triggers || []).find(o => o.x===player.x && o.y===player.y && condOk(o.when));
  if (tr) { runEvent(tr.run); return; }         // ドア・出口・ストーリーイベント
  const t = tileAt(player.x, player.y);
  if (T[t].encounter && !curMap.noEncounter && Math.random() < 0.15) startBattle(); // 草むら・ほらあなの ゆかでエンカウント
}

function update(dt){
  if (sceneBox) sceneBox.t += dt;
  if (deckEdit || classScreen || menuScreen || questScreen || itemScreen || copierScreen) return;
  if (battle) { updateBattle(dt); return; }
  if (fadeIn > 0) fadeIn = Math.max(0, fadeIn - dt);
  updateEvent(dt);
  if (player.moving) {
    player.t += dt;
    const p = Math.min(player.t/player.ms, 1);
    player.px = player.fromX + (player.x-player.fromX)*p;
    player.py = player.fromY + (player.y-player.fromY)*p;
    player.anim += dt;
    if (p>=1) { player.moving=false; player.px=player.x; player.py=player.y; onArrive(); }
  }
  if (!player.moving && !dialog && !ev) {
    for (const d of ['up','down','left','right']) if (keys[d]) { tryMove(d); break; }
  }
}

// ===== 描画 =====

// ---- カードの街の3つの建物(カードショップ=ピンク / どうじょう=和風 / コンビニ=緑の看板)を、看板の文字つきで描く ----
// 建物は 横4マス×縦3マス: 上から「屋根 / 看板(文字) / 1かい(まど・とびら)」。とびら(D)は2マス目。
function bType(x, y){
  const c = tileAt(x, y);
  if (c==='P' || c==='J' || c==='K') return c;
  if (c==='D') { const u = tileAt(x, y-1); if (u==='P' || u==='J' || u==='K') return u; }
  return null;
}
const BLDG = {
  P:{label:'カードショップ',     size:14, roof:'#e0568f', roof2:'#b83a72', sign:'#fff4f8', edge:'#e0568f', text:'#c0306a', wall:'#fbe3ee', door:'#e0568f'},
  J:{label:'デュエルどうじょう', size:12, roof:'#3d4b5c', roof2:'#566678', sign:'#7a4a22', edge:'#4a2a10', text:'#fff3d0', wall:'#d8b27a', door:'#8a2a22'},
  K:{label:'コンビニ',           size:16, roof:'#f2f2f2', roof2:'#cfd4da', sign:'#14a05a', edge:'#f08a1c', text:'#ffffff', wall:'#eef4f8', door:'#9fd6ee'},
};
function drawBuildingTile(sx, sy, x, y){
  const ty = bType(x, y), B = BLDG[ty];
  let col = 0, right = 0, row = 0;
  while (bType(x-col-1, y) === ty) col++;
  while (bType(x+right+1, y) === ty) right++;
  while (bType(x, y-row-1) === ty) row++;
  const W = (col+right+1)*TILE, ox = sx - col*TILE, isDoor = tileAt(x,y)==='D', last = right===0;
  const T_ = TILE;
  if (row === 0) {                                                       // 屋根
    g.fillStyle = B.roof; g.fillRect(sx, sy, T_, T_);
    g.fillStyle = B.roof2;
    if (ty==='J') { for (let i=0; i<T_; i+=8) { g.fillRect(sx, sy+i+6, T_, 2); for (let k=(i/8%2)*4; k<T_; k+=8) g.fillRect(sx+k, sy+i, 2, 6); } }   // かわら
    else for (let i=0; i<T_; i+=8) g.fillRect(sx, sy+i+6, T_, 2);
    g.fillStyle = B.edge; g.fillRect(sx, sy+T_-4, T_, 4);                // のき
  } else if (row === 1) {                                                // 看板
    g.fillStyle = B.sign; g.fillRect(sx, sy, T_, T_);
    g.fillStyle = B.edge; g.fillRect(sx, sy, T_, 4); g.fillRect(sx, sy+T_-4, T_, 4);
    if (ty==='K') { g.fillStyle = '#2a6fd0'; g.fillRect(sx, sy+T_-4, T_, 4); g.fillStyle = '#f08a1c'; g.fillRect(sx, sy+T_-8, T_, 3); }   // コンビニ風の しましま
    if (last) {                                                          // 文字は建物の 一番右のマスで、全体に まとめて描く(あとから描くマスに消されないように)
      const ta = g.textAlign, tb = g.textBaseline;
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold ${B.size}px sans-serif`;
      g.fillStyle = B.text; g.fillText(B.label, ox + W/2, sy + T_/2);
      g.textAlign = ta; g.textBaseline = tb;
    }
  } else {                                                               // 1かい
    g.fillStyle = B.wall; g.fillRect(sx, sy, T_, T_);
    if (ty==='J') { g.fillStyle = '#b58f5a'; for (let i=0; i<T_; i+=6) g.fillRect(sx+i, sy, 1, T_); }          // 板の かべ
    if (ty==='P' || ty==='K') {                                          // ひさし(しましま)
      for (let i=0; i<T_; i+=8) { g.fillStyle = ((i/8 + col)%2===0) ? (ty==='P' ? '#e0568f' : '#14a05a') : '#ffffff'; g.fillRect(sx+i, sy, 8, 7); }
    }
    if (isDoor) {
      g.fillStyle = B.door; g.fillRect(sx+5, sy+5, T_-10, T_-5);
      if (ty==='K') { g.fillStyle = '#d8f0fa'; g.fillRect(sx+8, sy+8, T_-16, T_-8); g.fillStyle = '#8a98a4'; g.fillRect(sx+T_/2-1, sy+8, 2, T_-8); }   // ガラスの じどうドア
      else { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(sx+T_/2-1, sy+5, 2, T_-5); g.fillStyle = '#f0c040'; g.fillRect(sx+T_/2+3, sy+T_/2+3, 3, 3); }
    } else if (ty==='J' && col===2) {                                    // どうじょうの 赤いのれん
      g.fillStyle = '#c0302a'; g.fillRect(sx+7, sy, 18, 24); g.fillStyle = '#fff';
      const ta = g.textAlign, tb = g.textBaseline; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 15px sans-serif';
      g.fillText('道', sx+16, sy+12); g.textAlign = ta; g.textBaseline = tb;
    } else if (ty==='J') {                                               // しょうじ
      g.fillStyle = '#6b3a22'; g.fillRect(sx+4, sy+8, 24, 18); g.fillStyle = '#fff8e0'; g.fillRect(sx+6, sy+10, 20, 14);
      g.fillStyle = '#6b3a22'; g.fillRect(sx+15, sy+10, 2, 14); g.fillRect(sx+6, sy+16, 20, 2);
    } else if (ty==='P') {                                               // ショーウィンドウ(カードが ならぶ)
      g.fillStyle = '#b83a72'; g.fillRect(sx+3, sy+10, 26, 20); g.fillStyle = '#cfeaff'; g.fillRect(sx+5, sy+12, 22, 16);
      const cs = ['#d8484e','#f0c040','#3fa860'];
      for (let i=0; i<3; i++) { g.fillStyle = cs[(i+col)%3]; g.fillRect(sx+7+i*7, sy+16, 5, 8); g.fillStyle = '#fff'; g.fillRect(sx+8+i*7, sy+18, 3, 2); }
    } else {                                                             // コンビニの 大きなガラス(たなが見える)
      g.fillStyle = '#8a98a4'; g.fillRect(sx+2, sy+10, 28, 20); g.fillStyle = '#bde4f5'; g.fillRect(sx+4, sy+12, 24, 16);
      g.fillStyle = '#fff'; g.fillRect(sx+4, sy+19, 24, 2);
      const cs = ['#f08a1c','#d8484e','#2a6fd0','#f0c040'];
      for (let i=0; i<4; i++) { g.fillStyle = cs[(i+col)%4]; g.fillRect(sx+6+i*6, sy+14, 4, 5); g.fillRect(sx+6+i*6, sy+22, 4, 5); }
    }
  }
}
function drawTile(ch, sx, sy, x, y){
  const t = T[ch];
  const art = Assets.get('tiles/'+t.name+'.png');             // タイルの絵があれば それを敷く
  if (art) { g.drawImage(art, sx, sy, TILE, TILE); return; }
  if (bType(x, y)) { drawBuildingTile(sx, sy, x, y); return; }   // 街の3つの建物
  g.fillStyle = t.c; g.fillRect(sx,sy,TILE,TILE);
  const h = (x*73856093 ^ y*19349663) >>> 0; // 位置から決まる疑似乱数(模様用)
  if (ch==='.'||ch===',') {
    g.fillStyle = ch==='.' ? '#56a852' : '#3d8f3d';
    g.fillRect(sx+(h%20)+3, sy+((h>>5)%20)+3, 3, 3);
    if (ch===',') { g.fillRect(sx+6,sy+10,3,10); g.fillRect(sx+16,sy+6,3,12); g.fillRect(sx+24,sy+14,3,10); }
  } else if (ch==='T') {
    g.fillStyle='#5fb55a'; g.fillRect(sx,sy,TILE,TILE);
    g.fillStyle='#6b4a2a'; g.fillRect(sx+13,sy+20,6,10);
    g.fillStyle='#2f7a3a'; g.beginPath(); g.arc(sx+16,sy+14,13,0,7); g.fill();
    g.fillStyle='#3c9548'; g.beginPath(); g.arc(sx+12,sy+10,6,0,7); g.fill();
  } else if (ch==='~') {
    g.fillStyle='#5a9be6'; const o=(performance.now()/400+x)%2<1?0:4;
    g.fillRect(sx+4+o,sy+8,10,2); g.fillRect(sx+16-o,sy+20,10,2);
  } else if (ch==='=') {
    g.fillStyle='#c9a766'; g.fillRect(sx+(h%24)+2,sy+((h>>4)%24)+2,3,2);
  } else if (ch==='H') {
    g.fillStyle='#a8452f'; g.fillRect(sx,sy,TILE,10);
    g.fillStyle='#e8dcc0'; g.fillRect(sx,sy+10,TILE,TILE-10);
    if (tileAt(x,y-1)==='H') { g.fillStyle='#e8dcc0'; g.fillRect(sx,sy,TILE,TILE); g.fillStyle='#8cc8f0'; if ((x+y)%2===0) g.fillRect(sx+8,sy+8,16,14); }
    else { g.fillStyle='#a8452f'; g.fillRect(sx,sy,TILE,TILE); g.fillStyle='#8a3624'; for(let i=0;i<TILE;i+=8) g.fillRect(sx,sy+i,TILE,2); }
  } else if (ch==='D') {
    g.fillStyle='#e8dcc0'; g.fillRect(sx,sy,TILE,TILE);
    g.fillStyle='#6b3a22'; g.fillRect(sx+7,sy+4,18,TILE-4);
    g.fillStyle='#f0c040'; g.fillRect(sx+21,sy+18,3,3);
  } else if (ch==='#') {
    g.fillStyle='#5fb55a'; g.fillRect(sx,sy,TILE,TILE);
    g.fillStyle='#777b86'; g.beginPath(); g.ellipse(sx+16,sy+20,13,10,0,0,7); g.fill();
    g.fillStyle='#9a9ea8'; g.beginPath(); g.ellipse(sx+12,sy+16,5,3,0,0,7); g.fill();
  } else if (ch==='F') {
    g.fillStyle='#ff7aa8'; g.fillRect(sx+8,sy+10,4,4); g.fillRect(sx+20,sy+18,4,4);
    g.fillStyle='#ffe066'; g.fillRect(sx+9,sy+11,2,2); g.fillRect(sx+21,sy+19,2,2);
  } else if (ch==='f') {                       // 床板
    g.fillStyle='#b88e5a'; g.fillRect(sx,sy+15,TILE,2); g.fillRect(sx+(h%20),sy+((h>>4)%12),2,10);
  } else if (ch==='w') {                       // 壁
    g.fillStyle='#4a3c50'; g.fillRect(sx,sy+TILE-6,TILE,6); g.fillStyle='#6a5870'; g.fillRect(sx,sy,TILE,4);
  } else if (ch==='b') {                       // ベッド
    g.fillStyle='#c8a070'; g.fillRect(sx,sy,TILE,TILE);
    g.fillStyle='#e8e0f0'; g.fillRect(sx+2,sy+2,TILE-4,12); g.fillStyle='#a04050'; g.fillRect(sx+2,sy+14,TILE-4,TILE-16);
  } else if (ch==='k') {                       // カード棚
    g.fillStyle='#7a5230'; g.fillRect(sx,sy,TILE,TILE); g.fillStyle='#4a2f18'; g.fillRect(sx+2,sy+2,TILE-4,TILE-4);
    const cs = ['#d8484e','#e08a20','#3fa860','#5a9be6','#9a5ad8'];
    for (let i=0; i<6; i++) { g.fillStyle=cs[(i+x)%5]; g.fillRect(sx+4+i*4,sy+4,3,10); g.fillStyle=cs[(i+x+2)%5]; g.fillRect(sx+4+i*4,sy+17,3,10); }
  } else if (ch==='t') {                       // 机
    g.fillStyle='#b88e5a'; g.fillRect(sx,sy,TILE,TILE); g.fillStyle='#9a6a3a'; g.fillRect(sx+2,sy+6,TILE-4,TILE-10);
    g.fillStyle='#fdf6e3'; g.fillRect(sx+7,sy+10,8,11); g.fillStyle='#d8484e'; g.fillRect(sx+17,sy+12,8,11);
  } else if (ch==='r') {                       // ラグ
    g.fillStyle='#f0a0a8'; g.fillRect(sx+2,sy+2,TILE-4,2); g.fillRect(sx+2,sy+TILE-4,TILE-4,2);
  } else if (ch==='x') {                       // 出入口のマット
    g.fillStyle='#6a4a2a'; g.fillRect(sx+4,sy+8,TILE-8,TILE-12);
  } else if (ch==='q') {                       // コピー機
    g.fillStyle='#b88e5a'; g.fillRect(sx,sy,TILE,TILE);
    g.fillStyle='#8a90a0'; g.fillRect(sx+3,sy+6,26,24); g.fillStyle='#e8ecf4'; g.fillRect(sx+3,sy+6,26,6);
    g.fillStyle='#3a4050'; g.fillRect(sx+7,sy+16,12,8); g.fillStyle='#6fdc8c'; g.fillRect(sx+21,sy+16,5,4);
    g.fillStyle='#fdf6e3'; g.fillRect(sx+9,sy+26,14,4);
  } else if (ch==='m') {                       // 魔王の島の 地面
    g.fillStyle='#5a4f6e'; g.fillRect(sx+(h%22)+2,sy+((h>>5)%22)+2,3,2); if (h%7===0) { g.fillStyle='#3a3048'; g.fillRect(sx+10,sy+14,6,4); }
  } else if (ch==='W') {                       // 魔王城の かべ
    g.fillStyle='#4a4560'; for (let i=0; i<TILE; i+=10) g.fillRect(sx,sy+i,TILE,2);
    g.fillStyle='#2a2638'; g.fillRect(sx+(y%2?8:20),sy,2,TILE);
    if (tileAt(x,y-1)!=='W') { g.fillStyle='#5a5470'; for (let i=0; i<TILE; i+=11) g.fillRect(sx+i,sy,7,6); }   // ぎざぎざの 上
  } else if (ch==='g') {                       // 魔王城の もん
    g.fillStyle='#4a4560'; g.fillRect(sx,sy,TILE,TILE);
    g.fillStyle='#0e0a14'; g.beginPath(); g.ellipse(sx+16,sy+14,11,14,0,Math.PI,0); g.fill(); g.fillRect(sx+5,sy+14,22,18);
    g.fillStyle='#8a2a4a'; g.fillRect(sx+4,sy+2,24,3);
  } else if (ch==='Y') {                       // かれき
    g.fillStyle='#5a4f6e'; g.fillRect(sx,sy,TILE,TILE);
    g.fillStyle='#2a2030'; g.fillRect(sx+14,sy+10,5,20); g.fillRect(sx+8,sy+8,5,3); g.fillRect(sx+19,sy+14,7,3); g.fillRect(sx+10,sy+16,5,3);
  } else if (ch==='a' || ch==='A') {            // 魔王城の ゆか / あかい じゅうたん
    const carpet = ch==='A';
    g.fillStyle = carpet ? '#6a1f3a' : '#2e2840'; g.fillRect(sx,sy,TILE,TILE);
    if (carpet) { g.fillStyle='#d8a838'; g.fillRect(sx+2,sy,2,TILE); g.fillRect(sx+TILE-4,sy,2,TILE); g.fillStyle='#8a2a4c'; g.fillRect(sx+10,sy+(h%20),12,3); }
    else { g.fillStyle='#3a3350'; g.fillRect(sx,sy+TILE-1,TILE,1); g.fillRect(sx+TILE-1,sy,1,TILE); if (h%5===0) { g.fillStyle='#241e34'; g.fillRect(sx+8,sy+10,7,3); } }
  } else if (ch==='i') {                       // はしら
    g.fillStyle='#2e2840'; g.fillRect(sx,sy,TILE,TILE);
    g.fillStyle='#5a5470'; g.fillRect(sx+8,sy+2,16,TILE-2); g.fillStyle='#78729a'; g.fillRect(sx+8,sy+2,5,TILE-2);
    g.fillStyle='#8a84aa'; g.fillRect(sx+5,sy+2,22,4); g.fillRect(sx+5,sy+TILE-5,22,4);
  } else if (ch==='e') {                       // ぎょくざ
    g.fillStyle='#2e2840'; g.fillRect(sx,sy,TILE,TILE);
    g.fillStyle='#3a1848'; g.fillRect(sx+3,sy+10,26,22); g.fillStyle='#5a2870'; g.fillRect(sx+7,sy+2,18,20);
    g.fillStyle='#d8a838'; g.fillRect(sx+3,sy+10,26,3); g.fillRect(sx+7,sy+2,18,2); g.fillStyle='#d8484e'; g.fillRect(sx+14,sy+8,4,4);
  } else if (ch==='N') {                       // へきが(カードの ものがたり)
    g.fillStyle='#4a4560'; g.fillRect(sx,sy,TILE,TILE);
    g.fillStyle='#d8a838'; g.fillRect(sx+3,sy+3,TILE-6,TILE-6);
    const mc = ['#d8484e','#5a9be6','#3fa860','#9a5ad8'][(x*3+y)%4];
    g.fillStyle='#1a1428'; g.fillRect(sx+6,sy+6,TILE-12,TILE-12); g.fillStyle=mc; g.fillRect(sx+10,sy+9,12,15); g.fillStyle='#fdf6e3'; g.fillRect(sx+12,sy+11,8,5);
  } else if (ch==='l') {                       // ひかりの カードの だい
    g.fillStyle='#2e2840'; g.fillRect(sx,sy,TILE,TILE);
    const gl = 0.5 + 0.3*Math.sin(performance.now()/300);
    g.fillStyle=`rgba(255,240,170,${gl*0.5})`; g.beginPath(); g.arc(sx+16,sy+14,15,0,7); g.fill();
    g.fillStyle='#5a5470'; g.fillRect(sx+6,sy+22,20,8); g.fillStyle='#fff6c0'; g.fillRect(sx+11,sy+6,10,15); g.fillStyle='#d8a838'; g.fillRect(sx+11,sy+6,10,2);
  } else if (ch==='B') {                       // うみの いりぐちの とう(ひかる。光は drawMap で あとから重ねる)
    g.fillStyle='#2f6fc0'; g.fillRect(sx,sy,TILE,TILE);
    g.fillStyle='#777b86'; g.beginPath(); g.ellipse(sx+16,sy+24,15,9,0,0,7); g.fill();
    g.fillStyle='#e8e0d0'; g.fillRect(sx+11,sy+8,10,18); g.fillStyle='#d8484e'; g.fillRect(sx+11,sy+14,10,5);
    g.fillStyle='#fff6b0'; g.fillRect(sx+10,sy+3,12,7); g.fillStyle='#8a5e34'; g.fillRect(sx+9,sy+1,14,3);
  } else if (ch==='s') {                       // 看板
    g.fillStyle='#5fb55a'; g.fillRect(sx,sy,TILE,TILE);
    g.fillStyle='#6b4a2a'; g.fillRect(sx+14,sy+16,4,14); g.fillStyle='#c89a5a'; g.fillRect(sx+6,sy+5,20,13);
    g.fillStyle='#6b4a2a'; g.fillRect(sx+9,sy+8,14,2); g.fillRect(sx+9,sy+12,10,2);
  } else if (ch==='C') {                       // ほらあなの入口
    g.fillStyle='#777b86'; g.fillRect(sx,sy,TILE,TILE);
    g.fillStyle='#14121a'; g.beginPath(); g.ellipse(sx+16,sy+22,12,16,0,Math.PI,0); g.fill(); g.fillRect(sx+4,sy+22,24,10);
  } else if (ch==='p') {                       // 桟橋
    g.fillStyle='#7a5e34'; for (let i=0; i<TILE; i+=8) g.fillRect(sx,sy+i,TILE,2);
  } else if (ch==='o') {                       // うみ(ふねで進む)
    g.fillStyle='#4a8ae0'; const o=(performance.now()/500+x+y)%2<1?0:5; g.fillRect(sx+3+o,sy+9,12,2); g.fillRect(sx+16-o,sy+22,12,2);
  } else if (ch==='R') {                       // ほらあなの かべ
    g.fillStyle='#4e4858'; g.fillRect(sx+(h%18),sy+((h>>3)%18),10,8); g.fillStyle='#2a2630'; g.fillRect(sx,sy+TILE-4,TILE,4);
  } else if (ch==='c' || ch==='v') {           // ほらあなの ゆか
    g.fillStyle='#8a8296'; g.fillRect(sx+(h%24)+2,sy+((h>>5)%24)+2,3,2);
    if (ch==='v') { g.fillStyle='#5a5266'; g.fillRect(sx+6,sy+8,4,3); g.fillRect(sx+18,sy+20,5,3); }
  }
}

// キャラ(いこあん)は今は図形。のちにドット絵へ差し替える
function drawChar(sx, sy, body, dir, walkPhase, id){
  const bob = walkPhase ? Math.abs(Math.sin(walkPhase*0.02))*-2 : 0;
  g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(sx+16,sy+28,9,4,0,0,7); g.fill();
  // 絵があれば絵を、無ければ図形を描く。歩いている間は 歩き1 → 歩き2 を一歩ごとに交互に出す
  const art = id ? charSprite(id, dir, walkPhase ? 1 + Math.floor(walkPhase/STEP_MS) % 2 : 0) : null;
  if (art) { drawSprite(art, sx+16, sy+30+bob, charHeight(id)); return; }
  if (id==='mayor') { drawMayor(sx, sy+bob, dir); return; }     // 町長は 専用の姿
  g.fillStyle=body; g.fillRect(sx+8,sy+12+bob,16,14);          // からだ
  g.fillStyle='#ffe0bd'; g.fillRect(sx+8,sy+2+bob,16,13);      // あたま
  g.fillStyle='#4a2f1a'; g.fillRect(sx+7,sy+0+bob,18,6);       // かみ
  g.fillStyle='#222';
  if (dir==='down'){ g.fillRect(sx+11,sy+9+bob,3,3); g.fillRect(sx+18,sy+9+bob,3,3); }
  if (dir==='left'){ g.fillRect(sx+9,sy+9+bob,3,3); }
  if (dir==='right'){ g.fillRect(sx+20,sy+9+bob,3,3); }
  if (dir==='up'){ g.fillStyle='#4a2f1a'; g.fillRect(sx+8,sy+0+bob,16,10); }
}

// 町長: シルクハット・白いひげ・紫のローブに金のたすき・つえ(図形版)
function drawMayor(sx, sy, dir){
  const px = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(sx+x, sy+y, w, h); };
  const cane = (x) => { px('#6b4a2a', x, 14, 2, 14); px('#f0c040', x-1, 12, 4, 3); };
  if (dir==='left') cane(5);                                   // つえ(あとろの 手)
  px('#7a4aa8', 7, 13, 18, 14);                                // ローブ
  px('#5a3488', 7, 24, 18, 3);                                 // すそ
  if (dir!=='up') { px('#f0c040', 14, 13, 4, 14); px('#fff3b0', 15, 19, 2, 2); }   // 金のたすき・メダル
  px('#ffe0bd', 9, 3, 14, 11);                                 // あたま
  if (dir==='down') {
    px('#222', 12, 8, 2, 2); px('#222', 18, 8, 2, 2);          // め
    px('#fff', 10, 11, 12, 4); px('#e0e0e0', 13, 14, 6, 3);    // 白い ひげ
  } else if (dir==='left') { px('#222', 10, 8, 2, 2); px('#fff', 9, 11, 9, 4); px('#e0e0e0', 9, 14, 6, 3); }
  else if (dir==='right') { px('#222', 20, 8, 2, 2); px('#fff', 14, 11, 9, 4); px('#e0e0e0', 17, 14, 6, 3); }
  else px('#fff', 9, 5, 14, 9);                                // うしろ: 白い かみ
  px('#fff', 7, 6, 3, 7); px('#fff', 22, 6, 3, 7);             // 横の 白い かみ
  px('#2c2040', 8, 1, 16, 4);                                  // ぼうしの つば
  px('#3a2a5a', 10, -8, 12, 10);                               // シルクハット
  px('#f0c040', 10, -1, 12, 2);                                // ぼうしの 金の おび
  if (dir!=='left') cane(25);
}

// ふね(うみの上では、いこあんの足もとに ふねを描く)
function drawShip(sx, sy){
  g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(sx-2, sy+31, TILE+4, 2);
  g.fillStyle='#6b4a2a'; g.beginPath(); g.moveTo(sx+1,sy+21); g.lineTo(sx+31,sy+21); g.lineTo(sx+25,sy+31); g.lineTo(sx+7,sy+31); g.closePath(); g.fill();
  g.fillStyle='#8a5e34'; g.fillRect(sx+3,sy+21,26,3);
}

function drawMap(){
  // カメラ: プレイヤー中心。マップ端では端で止める
  const mw = MAP_W*TILE, mh = MAP_H*TILE;      // 画面より小さいマップ(室内)は中央に置く
  const camX = mw <= SCREEN_W  ? (mw - SCREEN_W)/2  : Math.max(0, Math.min(player.px*TILE + TILE/2 - SCREEN_W/2,  mw - SCREEN_W));
  const camY = mh <= SCREEN_H ? (mh - SCREEN_H)/2 : Math.max(0, Math.min(player.py*TILE + TILE/2 - SCREEN_H/2, mh - SCREEN_H));
  g.fillStyle='#000'; g.fillRect(0,0,SCREEN_W,SCREEN_H);
  const x0=Math.floor(camX/TILE), y0=Math.floor(camY/TILE);
  for (let y=y0; y<=y0+VIEW_H; y++) for (let x=x0; x<=x0+VIEW_W; x++) {
    if (x<0||y<0||x>=MAP_W||y>=MAP_H) continue;
    drawTile(MAP[y][x], Math.round(x*TILE-camX), Math.round(y*TILE-camY), x, y);
  }
  const pulse = 0.55 + 0.25*Math.sin(performance.now()/350);      // とう(B)の ひかり: 遠くからでも目に入るよう、大きく ひからせる
  for (let y=y0; y<=y0+VIEW_H; y++) for (let x=x0; x<=x0+VIEW_W; x++) {
    if (tileAt(x,y) !== 'B') continue;
    const bx = Math.round(x*TILE-camX)+16, by = Math.round(y*TILE-camY)+8;
    sceneGlow(bx, by, 64, '255,235,150', pulse);
  }
  for (const n of NPCS) {
    if (!n.visible) continue;
    const sx = Math.round(n.px*TILE-camX), sy = Math.round(n.py*TILE-camY), walk = n.walking ? n.anim : 0;
    if (n.scale) { g.save(); g.translate(sx+16, sy+28); g.scale(n.scale, n.scale); drawChar(-16, -28, n.color, n.dir, walk, n.id); g.restore(); }   // 大きいキャラ
    else drawChar(sx, sy, n.color, n.dir, walk, n.id);
  }
  if (curMap.ship) drawShip(Math.round(player.px*TILE-camX), Math.round(player.py*TILE-camY));   // ふねに のって いる
  drawChar(Math.round(player.px*TILE-camX), Math.round(player.py*TILE-camY), '#3a7bd5', player.dir, (player.moving||player.scripted)?player.anim:0, 'player');

  // エリア名
  g.fillStyle='rgba(0,0,0,.55)'; g.fillRect(8,8,130,24);
  g.fillStyle='#fff'; g.font='14px sans-serif'; g.textBaseline='middle'; g.fillText(curMap.name, 18, 20);
  // 簡易ステータス (右上)
  { const h=HUD_RECT(); g.fillStyle='rgba(0,0,0,.55)'; g.fillRect(h.x,h.y,h.w,h.h); }
  g.fillStyle='#fff'; g.font='13px sans-serif'; g.textAlign='left';
  g.fillText(`いこあん Lv${hero.lv}`, SCREEN_W-170, 20);
  g.fillText(`HP ${hero.hp}/${hero.maxHp}  [Tab]メニュー`, SCREEN_W-170, 38);
  g.fillStyle=CLASSES[hero.cls].color; g.font='bold 12px sans-serif'; g.fillText(`${CLASSES[hero.cls].name} [C]`, SCREEN_W-170, 56);
  if (fadeIn > 0) { g.fillStyle=`rgba(0,0,0,${fadeIn/400})`; g.fillRect(0,0,SCREEN_W,SCREEN_H); }

  // 会話ウィンドウ
  if (dialog) {
    const w=SCREEN_W-24, h=84, x=12, y=SCREEN_H-h-12;
    // 話している人の立ち絵(あれば)を、ウィンドウの上に重ねる
    const pt = PORTRAITS[dialog.as || dialog.name], pim = pt && Assets.get(`portraits/${pt.id}.png`);
    if (pim) { const ph = ART.portraitH, pw = imgW(pim)*ph/imgH(pim); g.drawImage(pim, pt.side==='left' ? x+8 : x+w-pw-8, y-ph+14, pw, ph); }
    g.fillStyle='rgba(15,15,40,.92)'; g.fillRect(x,y,w,h);
    g.strokeStyle='#fff'; g.lineWidth=3; g.strokeRect(x+1.5,y+1.5,w-3,h-3);
    g.fillStyle='#ffd966'; g.font='bold 14px sans-serif'; g.textBaseline='top';
    if (dialog.name) g.fillText(dialog.name, x+14, y+10);
    g.fillStyle='#fff'; g.font='16px sans-serif';
    dialogPages(dialog)[dialog.i].forEach((row, k) => g.fillText(row, x+14, y+(dialog.name?34:20)+k*24));   // 折り返し済みの行
    if (Math.floor(performance.now()/400)%2) g.fillText('▼', x+w-28, y+h-26);
  }
  // 章タイトル
  if (ev && ev.card) {
    const a = Math.min(1, ev.card.t/600), out = ev.card.t > 3000 ? Math.max(0, 1-(ev.card.t-3000)/500) : 1;
    g.globalAlpha = a*out;
    g.fillStyle='#000'; g.fillRect(0,0,SCREEN_W,SCREEN_H);
    g.fillStyle='#ffd966'; g.font='bold 30px sans-serif'; g.textAlign='center'; g.textBaseline='middle';
    g.fillText(ev.card.title, SCREEN_W/2, SCREEN_H/2-14);
    g.fillStyle='#fff'; g.font='16px sans-serif'; g.fillText(ev.card.sub, SCREEN_W/2, SCREEN_H/2+24);
    g.globalAlpha = 1; g.textAlign = 'left';
  }
}
