// 一枚絵の場面(カットイン・回想・エンディング): 全面の絵 + 下に文章。マップのイベントでも、戦闘の途中でも使う。
// =====================================================================
//  openScene({art, fx, name, lines, keep, chain}, 終わったときの関数)
//    art   : assets/ 以下の絵のパス(例 'cutin/maou_crack.png')。絵が無ければ fx の図形で代用する
//    fx    : 図形で代用するときの名前(下の SCENE_FX)
//    name  : 話している人の名前(''ならナレーション)  lines: 文章(2行ずつ自動でページ分け)
//    keep  : true なら暗転せず、前の場面から続けて文章だけ切り替える
//    chain : 同じ名前の場面をまとめて Xキーで飛ばせる(回想など。2回目以降に便利)
//  Z/Enter/タップ で送る。Xキーで chain の場面を飛ばす。
// =====================================================================
let sceneBox = null, skipChain = null;

function openScene(def, done){
  if (def.chain && skipChain === def.chain) { if (done) done(); return; }
  sceneBox = {...def, lines:(def.lines || []).slice(), i:0, t: def.keep ? 600 : 0, done, pages:null};
}
function scenePages(){ const s = sceneBox; return s.lines.length ? dialogPages(s) : []; }
function sceneAdvance(){
  const s = sceneBox; if (!s || s.t < 250) return;
  const n = scenePages().length;
  if (s.i < n-1) s.i++;
  else if (s.onLast) s.onLast();                                       // 選択肢を場面の上に出す(精霊の問い)など
  else endScene();
}
function sceneSkip(){ const s = sceneBox; if (s && s.chain && s.t > 250) { skipChain = s.chain; endScene(); } }
function endScene(){ const d = sceneBox.done; sceneBox = null; if (d) d(); }

function preloadFinalArt(){ FINAL_ART.forEach(([p]) => Assets.get(p)); ['enemies/maou_unmasked.png','enemies/serika_rage.png'].forEach(p => Assets.get(p)); }

// ---- 図形で代用する絵 ----
const RAINBOW = ['#ff4a4a','#ff9a3a','#ffe14a','#4ad86a','#4ab8ff','#6a5aff','#c05aff'];
function sceneSky(a, b){ const gr = g.createLinearGradient(0,0,0,SCREEN_H); gr.addColorStop(0,a); gr.addColorStop(1,b); g.fillStyle = gr; g.fillRect(0,0,SCREEN_W,SCREEN_H); }
function sceneGlow(x, y, r, rgb, a){ const gr = g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,`rgba(${rgb},${a})`); gr.addColorStop(1,`rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x-r,y-r,r*2,r*2); }
function sceneEllipse(x, y, rx, ry, fill){ g.fillStyle = fill; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,7); g.fill(); }
// 逆さの城(上から さかさまに ぶら下がる)
function drawUpsideCastle(cx, topY, w, h, rgb){
  g.fillStyle = `rgb(${rgb})`;
  g.beginPath(); g.moveTo(cx-w/2, topY); g.lineTo(cx+w/2, topY); g.lineTo(cx+w*0.36, topY+h*0.55); g.lineTo(cx-w*0.36, topY+h*0.55); g.closePath(); g.fill();
  for (let i=-2; i<=2; i++) {                                          // したに のびる とう
    const tx = cx + i*w*0.17, th = h*(i===0 ? 1 : 0.8 - Math.abs(i)*0.1);
    g.beginPath(); g.moveTo(tx-w*0.06, topY+h*0.5); g.lineTo(tx+w*0.06, topY+h*0.5); g.lineTo(tx, topY+th); g.closePath(); g.fill();
  }
  g.fillStyle = 'rgba(255,200,90,.8)'; for (let i=0; i<9; i++) g.fillRect(cx-w*0.4 + i*w*0.1, topY+h*0.18 + (i%3)*h*0.09, 3, 5);
}
function maouFace(cx, cy, s, half, t){
  if (half) {                                                          // 白く長い かみ
    g.fillStyle = '#e8e8f4'; g.beginPath(); g.moveTo(cx-1.0*s, cy-0.1*s); g.quadraticCurveTo(cx-1.25*s, cy-1.3*s, cx, cy-1.35*s); g.quadraticCurveTo(cx+1.25*s, cy-1.3*s, cx+1.0*s, cy-0.1*s);
    g.lineTo(cx+1.25*s, cy+1.9*s); g.lineTo(cx+0.85*s, cy+1.0*s); g.lineTo(cx+0.6*s, cy+2.0*s); g.lineTo(cx-0.6*s, cy+2.0*s); g.lineTo(cx-0.85*s, cy+1.0*s); g.lineTo(cx-1.25*s, cy+1.9*s); g.closePath(); g.fill();
  } else sceneEllipse(cx, cy-0.1*s, 1.3*s, 1.55*s, '#14101e');        // フード
  sceneEllipse(cx, cy, 0.8*s, 1.0*s, half ? '#f0d2b8' : '#0a0810');
  if (half) {
    g.fillStyle = '#111'; g.fillRect(cx+0.15*s, cy-0.18*s, 0.42*s, 0.16*s);                      // 赤い目
    g.strokeStyle = '#111'; g.lineWidth = Math.max(2, s*0.05);                                      // 眼鏡
    g.strokeRect(cx+0.08*s, cy-0.3*s, 0.56*s, 0.4*s); g.strokeRect(cx-0.64*s, cy-0.3*s, 0.56*s, 0.4*s);
    g.beginPath(); g.moveTo(cx-0.08*s, cy-0.18*s); g.lineTo(cx+0.08*s, cy-0.18*s); g.stroke();
    g.fillStyle = '#a05050'; g.fillRect(cx-0.2*s, cy+0.5*s, 0.4*s, 0.06*s);
    g.fillStyle = '#f4f0e8'; g.beginPath(); g.moveTo(cx-0.8*s, cy-0.5*s); g.lineTo(cx+0.02*s, cy-0.95*s); g.lineTo(cx-0.05*s, cy-0.1*s); g.lineTo(cx+0.1*s, cy+0.4*s);
    g.lineTo(cx-0.12*s, cy+0.7*s); g.lineTo(cx-0.5*s, cy+0.9*s); g.lineTo(cx-0.8*s, cy+0.5*s); g.closePath(); g.fill();                         // のこった 仮面の はんぶん
    g.fillStyle = '#2a2a38'; g.fillRect(cx-0.5*s, cy-0.18*s, 0.3*s, 0.1*s);
  } else {
    sceneEllipse(cx, cy, 0.72*s, 0.92*s, '#f4f0e8');                                                // 仮面
    g.fillStyle = '#2a2a38'; g.fillRect(cx-0.5*s, cy-0.2*s, 0.34*s, 0.1*s); g.fillRect(cx+0.16*s, cy-0.2*s, 0.34*s, 0.1*s);
    g.strokeStyle = '#d8a838'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy-0.9*s); g.lineTo(cx, cy-0.3*s); g.stroke();
  }
}
function crackLines(cx, cy, s, n){
  g.strokeStyle = '#201020'; g.lineWidth = Math.max(2, s*0.04); g.beginPath();
  g.moveTo(cx+0.05*s, cy-0.9*s); g.lineTo(cx-0.1*s, cy-0.5*s); g.lineTo(cx+0.12*s, cy-0.2*s); g.lineTo(cx-0.05*s, cy+0.2*s); if (n > 1) { g.moveTo(cx-0.1*s, cy-0.5*s); g.lineTo(cx-0.4*s, cy-0.3*s); g.moveTo(cx+0.12*s, cy-0.2*s); g.lineTo(cx+0.45*s, cy-0.05*s); }
  g.stroke();
}
function sceneFigure(x, y, h, body, hair){                              // 小さな人影(うしろ姿)
  sceneEllipse(x, y-h*0.8, h*0.12, h*0.14, hair || '#222'); g.fillStyle = body; g.beginPath();
  g.moveTo(x-h*0.14, y-h*0.64); g.lineTo(x+h*0.14, y-h*0.64); g.lineTo(x+h*0.18, y); g.lineTo(x-h*0.18, y); g.closePath(); g.fill();
}

const SCENE_FX = {
  crack:(t) => { sceneSky('#1a0a1e', '#3a1020'); sceneGlow(240, 140, 220, '200,40,60', 0.35); maouFace(240, 150, 120, false, t); crackLines(240, 150, 120, 1); },
  half:(t) => { sceneSky('#220a14', '#52121e'); sceneGlow(240, 140, 240, '255,60,60', 0.4); maouFace(240, 150, 120, true, t); },
  last:(t) => { sceneSky('#08040e', '#240a38'); sceneGlow(240, 160, 200, '160,60,255', 0.5); g.save(); g.translate(240, 160); g.rotate(-0.6);
                g.fillStyle = '#1a0a28'; g.fillRect(-12, -150, 24, 230); g.fillStyle = '#7a30d8'; g.fillRect(-4, -150, 8, 230); g.fillStyle = '#3a2058'; g.fillRect(-40, 70, 80, 10); g.restore(); },
  spirit:(t) => { sceneSky('#f6f0ff', '#cdb8ff'); sceneGlow(240, 140, 260, '255,255,255', 0.9); const b = Math.sin(t/500)*4;
                  g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.moveTo(240, 40+b); g.quadraticCurveTo(300, 120, 270, 250); g.lineTo(210, 250); g.quadraticCurveTo(180, 120, 240, 40+b); g.fill();
                  for (let i=0; i<22; i++) { const a = i*0.9+t/1500; sceneEllipse(240+Math.cos(a)*(60+i*5), 150+Math.sin(a*1.3)*(50+i*2), 2, 2, 'rgba(255,240,170,.8)'); } },
  awaken:(t) => { sceneSky('#120a2a', '#241048'); g.save(); g.translate(240, 150); g.rotate(t/1800);
                  for (let i=0; i<14; i++) { g.fillStyle = RAINBOW[i%7]; g.globalAlpha = 0.55; g.beginPath(); g.moveTo(0,0); g.lineTo(Math.cos(i*Math.PI/7)*400, Math.sin(i*Math.PI/7)*400); g.lineTo(Math.cos((i+1)*Math.PI/7)*400, Math.sin((i+1)*Math.PI/7)*400); g.closePath(); g.fill(); }
                  g.restore(); g.globalAlpha = 1; sceneGlow(240, 150, 140, '255,255,255', 0.9);
                  sceneFigure(240, 250, 160, g.createPattern(rainbowStripeCanvas(), 'repeat'), '#4a2f1a'); },
  clash:(t) => { sceneSky('#1a0a2a', '#fff4d0'); sceneGlow(240, 150, 260, '255,255,255', 0.9); sceneGlow(120, 160, 160, '90,30,160', 0.6);
                 g.save(); g.translate(240, 150); g.rotate(0.55); g.fillStyle = '#2a1040'; g.fillRect(-170, -7, 170, 14); g.fillStyle = '#7a30d8'; g.fillRect(-170, -2, 170, 4); g.restore();       // 闇の剣
                 g.save(); g.translate(240, 150); g.rotate(-0.55); g.fillStyle = '#fff6c0'; g.fillRect(0, -7, 170, 14); g.fillStyle = '#ffffff'; g.fillRect(0, -2, 170, 4);
                 RAINBOW.forEach((col, i) => { g.fillStyle = col; g.globalAlpha = 0.5; g.fillRect(10+i*22, -16, 12, 5); }); g.restore(); g.globalAlpha = 1;                                    // 光の剣(七色)
                 sceneGlow(240, 150, 90 + Math.sin(t/90)*14, '255,255,255', 1);
                 for (let i=0; i<26; i++) { const a = i*2.4 + t/700, r = 40 + (i*37 + t/6) % 150; sceneEllipse(240+Math.cos(a)*r, 150+Math.sin(a)*r*0.7, 2.5, 2.5, RAINBOW[i%7]); } },
  abyss:(t) => { sceneSky('#0c0618', '#3a1450'); sceneGlow(240, 60, 240, '180,60,200', 0.4);
                 drawUpsideCastle(240, -10 + Math.sin(t/1200)*3, 400, 200, '36,24,56'); g.fillStyle = '#1a1226'; g.fillRect(0, 270, SCREEN_W, 50);
                 for (let i=0; i<12; i++) { g.fillStyle = '#2e2440'; g.fillRect(20+i*38, 250-(i*7)%16, 18, 24); g.fillStyle = '#ffd966'; g.fillRect(25+i*38, 256-(i*7)%16, 3, 3); } },
  memory1:(t) => { sceneSky('#10161e', '#3a4658'); for (let i=0; i<18; i++) { g.save(); g.translate((i*97+t/40)%520-20, 40+(i*53)%160); g.rotate(i+t/900); g.fillStyle = RAINBOW[i%7]; g.fillRect(-12,-17,24,34); g.fillStyle = '#fff'; g.fillRect(-8,-12,16,10); g.restore(); }
                   g.fillStyle = '#1c2230'; for (let i=0; i<10; i++) g.fillRect(i*50, 230-(i*37)%50, 38, 90); },
  memory2:(t) => { sceneSky('#2a0c0c', '#5a1a14'); sceneGlow(240, 300, 300, '255,120,40', 0.5); g.fillStyle = '#1a0a0a'; for (let i=0; i<8; i++) g.fillRect(i*64, 200-(i*41)%60, 40, 140);
                   sceneFigure(240, 290, 150, '#2a2a40', '#e8e8f4'); for (let i=0; i<8; i++) { g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(40+i*55, 280+(i*13)%20, 14, 9); } },
  memory3:(t) => { sceneSky('#242030', '#58506a'); g.fillStyle = '#1a1620'; g.fillRect(0, 260, SCREEN_W, 60);
                   sceneFigure(160, 270, 120, '#7a3a2a', '#222'); sceneFigure(240, 270, 150, '#2a2a40', '#e8e8f4'); sceneFigure(320, 270, 130, '#2f3a6a', '#2a2440'); sceneGlow(240, 120, 160, '255,255,255', 0.15); },
  memory4:(t) => { sceneSky('#08101e', '#1a2848'); g.save(); g.translate(240, 120); for (let i=0; i<9; i++) { g.strokeStyle = `rgba(${120+i*14},${180+i*7},255,${0.8-i*0.07})`; g.lineWidth = 4; g.beginPath(); g.ellipse(0,0,24+i*17,34+i*21,t/2000+i*0.2,0,7); g.stroke(); } g.restore();
                   sceneGlow(240, 120, 90, '200,230,255', 0.8); sceneFigure(240, 300, 110, '#1a1a2a', '#e8e8f4'); },
  ending_maou:(t) => { sceneSky('#f8d8a0', '#d88a70'); sceneGlow(240, 140, 220, '255,255,220', 0.8); sceneFigure(240, 280, 170, 'rgba(40,20,60,.55)', 'rgba(232,232,244,.6)');
                       for (let i=0; i<30; i++) { const k = (t/4000 + i*0.037) % 1; sceneEllipse(200+(i*29)%80+Math.sin(i+t/500)*10, 260-k*240, 2.5, 2.5, `rgba(255,250,200,${1-k})`); } },
  ending_ikoan:(t) => { sceneSky('#9ad8ff', '#ffe8c0'); sceneGlow(380, 90, 160, '255,240,180', 0.8); g.fillStyle = '#6cbf5f'; g.fillRect(0, 230, SCREEN_W, 90);
                        g.fillStyle = '#d8b87a'; g.beginPath(); g.moveTo(200, 320); g.lineTo(280, 320); g.lineTo(250, 230); g.lineTo(230, 230); g.closePath(); g.fill();
                        sceneFigure(240, 280, 120, g.createPattern(rainbowStripeCanvas(), 'repeat'), '#4a2f1a'); },
};
let _rbCanvas = null;
function rainbowStripeCanvas(){                                        // 七色ボーダーの模様(ザ・デュエリストの服)
  if (_rbCanvas) return _rbCanvas;
  const c = document.createElement('canvas'); c.width = 4; c.height = 14; const x = c.getContext('2d');
  RAINBOW.forEach((col, i) => { x.fillStyle = col; x.fillRect(0, i*2, 4, 2); });
  return _rbCanvas = c;
}

function drawScene(){
  const s = sceneBox, W = SCREEN_W, H = SCREEN_H;
  const art = s.art && Assets.get(s.art);
  g.save();
  if (art) drawCover(art, 0, 0, W, H);
  else {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    (SCENE_FX[s.fx] || SCENE_FX.last)(s.t);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.font = '10px sans-serif'; g.textBaseline = 'top'; g.textAlign = 'left';
    g.fillText(`(かりの え: ${s.art || s.fx})`, 8, 6);
  }
  g.restore();
  if (s.t < 400 && !s.keep) { g.fillStyle = `rgba(0,0,0,${1 - s.t/400})`; g.fillRect(0, 0, W, H); }
  const pages = scenePages();
  if (pages.length && !choiceBox) {                                     // 選択肢が出ている間は文章の枠を隠す
    const w = W-24, h = 84, x = 12, y = H-h-10;
    g.fillStyle = 'rgba(10,8,30,.84)'; g.fillRect(x, y, w, h);
    g.strokeStyle = '#fff'; g.lineWidth = 3; g.strokeRect(x+1.5, y+1.5, w-3, h-3);
    g.textBaseline = 'top'; g.textAlign = 'left';
    if (s.name) { g.fillStyle = '#ffd966'; g.font = 'bold 14px sans-serif'; g.fillText(s.name, x+14, y+10); }
    g.fillStyle = '#fff'; g.font = '16px sans-serif';
    pages[s.i].forEach((row, k) => g.fillText(row, x+14, y+(s.name ? 34 : 20)+k*24));
    if (Math.floor(performance.now()/400)%2) g.fillText('▼', x+w-28, y+h-26);
  }
  if (s.chain) { g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '11px sans-serif'; g.textAlign = 'right'; g.textBaseline = 'top'; g.fillText('X: とばす', W-10, 6); g.textAlign = 'left'; }
}
