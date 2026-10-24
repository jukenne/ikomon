// 敵のグラフィック(今は図形。のちにドット絵へ差し替える)
// ---- 敵のグラフィック(今は図形。のちにドット絵へ差し替える) 原点=足もと中央 ----
function drawSlime(t){
  const s = 1 + Math.sin(t/260)*0.05;
  g.save(); g.scale(1/s, s);
  g.fillStyle='#4aa8f0'; g.beginPath(); g.moveTo(-50,0); g.quadraticCurveTo(-50,-90,0,-90); g.quadraticCurveTo(50,-90,50,0); g.closePath(); g.fill();
  g.fillStyle='#8cd0ff'; g.beginPath(); g.ellipse(-20,-62,12,8,-0.5,0,7); g.fill();
  g.fillStyle='#fff'; g.fillRect(-24,-46,12,14); g.fillRect(10,-46,12,14);
  g.fillStyle='#222'; g.fillRect(-20,-42,6,9); g.fillRect(14,-42,6,9);
  g.restore();
}
function drawBat(t){
  const y = -60 + Math.sin(t/220)*8, f = Math.sin(t/90)*18;
  g.fillStyle='#6a3d9a';
  g.beginPath(); g.moveTo(-14,y); g.lineTo(-70,y-30+f); g.lineTo(-52,y+6); g.lineTo(-34,y-4); g.lineTo(-20,y+14); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(14,y); g.lineTo(70,y-30+f); g.lineTo(52,y+6); g.lineTo(34,y-4); g.lineTo(20,y+14); g.closePath(); g.fill();
  g.fillStyle='#4a2870'; g.beginPath(); g.ellipse(0,y,24,26,0,0,7); g.fill();
  g.beginPath(); g.moveTo(-18,y-18); g.lineTo(-12,y-40); g.lineTo(-4,y-22); g.fill();
  g.beginPath(); g.moveTo(18,y-18); g.lineTo(12,y-40); g.lineTo(4,y-22); g.fill();
  g.fillStyle='#ff5050'; g.fillRect(-12,y-6,6,6); g.fillRect(6,y-6,6,6);
  g.fillStyle='#fff'; g.fillRect(-7,y+8,4,6); g.fillRect(3,y+8,4,6);
}
function drawShroom(t){
  const b = Math.sin(t/300)*3;
  g.fillStyle='#f0e6d0'; g.fillRect(-18,-42+b,36,42-b);
  g.fillStyle='#222'; g.fillRect(-11,-26+b,6,10); g.fillRect(5,-26+b,6,10);
  g.fillStyle='#d8484e'; g.beginPath(); g.ellipse(0,-52+b,56,40,0,Math.PI,0); g.fill();
  g.fillRect(-56,-52+b,112,8);
  g.fillStyle='#fff'; g.beginPath(); g.arc(-26,-68+b,8,0,7); g.fill(); g.beginPath(); g.arc(14,-80+b,9,0,7); g.fill(); g.beginPath(); g.arc(34,-62+b,6,0,7); g.fill();
}

// ボス フリテン: 大きな筋肉質の男(ハチマキ・タンクトップ)
function drawFuriten(t){
  const br = Math.sin(t/300)*2;
  g.fillStyle='#3a3a5a'; g.fillRect(-26,-30,18,30); g.fillRect(8,-30,18,30);          // ズボン
  g.fillStyle='#222';    g.fillRect(-28,-6,22,6);  g.fillRect(6,-6,22,6);              // くつ
  g.fillStyle='#c0502a'; g.fillRect(-36,-82+br,72,54);                                  // タンクトップ
  g.fillStyle='#e0b080'; g.fillRect(-12,-82+br,24,14);                                  // むね
  g.fillStyle='#e0b080'; g.fillRect(-58,-82+br,22,44); g.fillRect(36,-82+br,22,44);    // うで
  g.fillStyle='#d09a6a'; g.beginPath(); g.arc(-47,-36+br,13,0,7); g.fill(); g.beginPath(); g.arc(47,-36+br,13,0,7); g.fill(); // こぶし
  g.fillStyle='#e0b080'; g.fillRect(-16,-108+br,32,28);                                 // かお
  g.fillStyle='#5a2a1a'; g.fillRect(-18,-116+br,36,10); g.fillRect(-14,-122+br,8,8); g.fillRect(2,-122+br,8,8);  // かみ
  g.fillStyle='#f0e060'; g.fillRect(-17,-102+br,34,6);                                  // ハチマキ
  g.fillStyle='#222';    g.fillRect(-10,-93+br,6,4); g.fillRect(4,-93+br,6,4);          // め
  g.fillRect(-12,-98+br,10,2); g.fillRect(2,-98+br,10,2);                               // まゆ
  g.fillRect(-6,-84+br,12,3);                                                           // くち
}

// ボス シュレッダー: 事務用のシュレッダーに赤い目と歯がついた機械の化身
function drawShredder(t){
  const sh = Math.sin(t/70)*1.2;                       // きかいの ふるえ
  g.fillStyle='#e8e4d8';                               // かみくず
  for (let i=0; i<9; i++) g.fillRect(-52+i*13+((i*7)%5), -8-((i*11)%9), 5, 11);
  g.fillStyle='#3a3e48'; g.fillRect(-44,-14,18,12); g.fillRect(26,-14,18,12);                  // あし
  g.fillStyle='#6a7080'; g.fillRect(-48+sh,-104,96,92);                                        // ほんたい
  g.fillStyle='#2a2e38'; g.fillRect(-38+sh,-114,76,14);                                        // とうにゅうぐち
  g.fillStyle='#8a90a0'; g.fillRect(-42+sh,-92,84,64);                                         // パネル
  g.fillStyle='#ff3030'; g.fillRect(-28+sh,-80,18,11); g.fillRect(10+sh,-80,18,11);            // あかい め
  g.fillStyle='#222';    g.fillRect(-30+sh,-86,22,3); g.fillRect(8+sh,-86,22,3);               // まゆ
  g.fillStyle='#14161c'; g.fillRect(-36+sh,-56,72,22);                                         // くち
  g.fillStyle='#e8e8f0'; for (let i=0; i<8; i++) g.fillRect(-34+i*9+sh, -56, 6, 11);          // は
  g.fillStyle='#d8d4c8'; for (let i=0; i<6; i++) g.fillRect(-28+i*11+sh, -34, 4, 20+((i*5)%9)); // くちから たれる かみ
}

// ボス セリカ: 眼鏡の男の魔導士。激昂すると 筋肉ムキムキになって ローブがはじけ飛ぶ(e.enraged で姿が変わる)
function drawGlasses(x, y){
  g.strokeStyle='#111'; g.lineWidth=2;
  g.strokeRect(x-14, y, 12, 9); g.strokeRect(x+2, y, 12, 9);
  g.beginPath(); g.moveTo(x-2, y+3); g.lineTo(x+2, y+3); g.moveTo(x-14, y+3); g.lineTo(x-19, y+1); g.moveTo(x+14, y+3); g.lineTo(x+19, y+1); g.stroke();
}
function drawSerika(t, e){
  if (e && e.rageForm) { drawSerikaRaged(t); return; }       // 変身の演出(フラッシュ)が起きたあとから ムキムキの姿
  const br = Math.sin(t/320)*2;
  g.fillStyle='#2f3a6a'; g.beginPath(); g.moveTo(-34,0); g.lineTo(34,0); g.lineTo(23,-64+br); g.lineTo(-23,-64+br); g.closePath(); g.fill();   // ローブ
  g.fillStyle='#c8a040'; g.fillRect(-25,-46+br,50,6);                                                     // おび
  g.fillStyle='#2f3a6a'; g.fillRect(-42,-72+br,16,42); g.fillRect(26,-72+br,16,42);                       // そで
  g.fillStyle='#f0d2b8'; g.beginPath(); g.arc(-34,-28+br,6,0,7); g.fill(); g.beginPath(); g.arc(34,-28+br,6,0,7); g.fill();   // て
  g.fillStyle='#4a5aa0'; g.fillRect(-26,-74+br,52,12);                                                    // えり
  g.fillStyle='#f0d2b8'; g.fillRect(-14,-102+br,28,30);                                                   // かお
  g.fillStyle='#2a2440'; g.fillRect(-16,-106+br,32,10); g.fillRect(-16,-100+br,4,10); g.fillRect(12,-100+br,4,10);   // かみ
  g.fillStyle='#3a4a8a'; g.beginPath(); g.moveTo(-28,-104+br); g.lineTo(0,-140+br); g.lineTo(28,-104+br); g.closePath(); g.fill(); g.fillRect(-34,-106+br,68,5);   // ぼうし
  drawGlasses(0, -94+br);                                                                                 // めがね
  g.fillStyle='#222'; g.fillRect(-9,-91+br,3,4); g.fillRect(6,-91+br,3,4);                                // め
  g.fillStyle='#b8705a'; g.fillRect(-4,-80+br,8,2);                                                       // くち
  g.fillStyle='#8a6a3a'; g.fillRect(48,-96+br,4,96);                                                      // つえ
  g.fillStyle='#80c0ff'; g.beginPath(); g.arc(50,-102+br,9,0,7); g.fill();
  g.fillStyle='rgba(180,220,255,.45)'; g.beginPath(); g.arc(50,-102+br,14,0,7); g.fill();
}
function drawSerikaRaged(t){
  const sh = Math.sin(t/55)*1.6, skin = '#e8b890', shade = '#c89870';
  g.fillStyle='#7a2a2a'; g.fillRect(-60,-2,120,3);                                                         // あつい いきの もや(足もと)
  g.fillStyle='#2f3a6a'; g.fillRect(-26,-38,22,38); g.fillRect(4,-38,22,38);                              // ズボンの のこり
  g.fillStyle='#2f3a6a'; g.beginPath(); g.moveTo(-30,-34); g.lineTo(-18,-20); g.lineTo(-8,-34); g.lineTo(2,-18); g.lineTo(14,-34); g.lineTo(30,-24); g.lineTo(30,-40); g.lineTo(-30,-40); g.closePath(); g.fill();  // やぶけた ふく
  g.fillStyle=skin; g.beginPath(); g.moveTo(-46,-100+sh); g.lineTo(46,-100+sh); g.lineTo(30,-38); g.lineTo(-30,-38); g.closePath(); g.fill();   // きょうきん(はだか)
  g.strokeStyle=shade; g.lineWidth=2;
  g.beginPath(); g.moveTo(0,-96+sh); g.lineTo(0,-40); g.moveTo(-26,-70+sh); g.lineTo(26,-70+sh); g.moveTo(-24,-56+sh); g.lineTo(24,-56+sh); g.moveTo(-22,-46+sh); g.lineTo(22,-46+sh); g.stroke();   // むねとはらの きんにく
  g.fillStyle=shade; g.beginPath(); g.ellipse(-20,-86+sh,16,9,0,0,7); g.fill(); g.beginPath(); g.ellipse(20,-86+sh,16,9,0,0,7); g.fill();       // だいきょうきん
  g.fillStyle=skin; g.beginPath(); g.arc(-52,-92+sh,18,0,7); g.fill(); g.beginPath(); g.arc(52,-92+sh,18,0,7); g.fill();                         // かた
  g.fillRect(-72,-84+sh,22,44); g.fillRect(50,-84+sh,22,44);                                                                                       // うで
  g.beginPath(); g.arc(-62,-40+sh,15,0,7); g.fill(); g.beginPath(); g.arc(62,-40+sh,15,0,7); g.fill();                                           // こぶし
  g.strokeStyle=shade; g.beginPath(); g.arc(-52,-92+sh,18,0.4,2.4); g.stroke(); g.beginPath(); g.arc(52,-92+sh,18,0.7,2.7); g.stroke();
  g.fillStyle=skin; g.fillRect(-16,-126+sh,32,28);                                                         // かお
  g.fillStyle='#2a2440'; g.fillRect(-18,-134+sh,36,10); g.fillRect(-14,-142+sh,6,10); g.fillRect(-2,-146+sh,6,12); g.fillRect(10,-142+sh,6,10);   // かみ(さかだつ)
  drawGlasses(0, -118+sh);                                                                                 // めがね(そのまま)
  g.fillStyle='#8a1a1a'; g.fillRect(-12,-124+sh,3,10); g.fillRect(8,-124+sh,3,10);                        // ひたいの すじ
  g.strokeStyle='#111'; g.lineWidth=3; g.beginPath(); g.moveTo(-15,-120+sh); g.lineTo(-3,-116+sh); g.moveTo(15,-120+sh); g.lineTo(3,-116+sh); g.stroke();   // おこりまゆ
  g.fillStyle='#4a1010'; g.fillRect(-9,-104+sh,18,7); g.fillStyle='#fff'; g.fillRect(-7,-104+sh,14,2);   // さけぶ くち
  g.fillStyle='#4a5aa0'; for (let i=0;i<5;i++) g.fillRect(-70+i*30+((i*7)%9), -14-((i*5)%9)+Math.sin(t/200+i)*2, 8, 4);   // ちらばった ローブの きれはし
}

// ボス 魔王(ラスボス): 第一形態=フードと仮面(髪は見えない) / 第二形態=仮面が半分壊れ、白く長い髪・赤い目・眼鏡の素顔
// e.aura = クラスチェンジしたときの オーラの色('r,g,b')
function drawMaou(t, e){
  const f2 = !!(e && e.form === 2), br = Math.sin(t/380)*2, aura = (e && e.aura) || '150,90,230';
  const gr = g.createRadialGradient(0,-70,10,0,-70,110); gr.addColorStop(0,`rgba(${aura},.42)`); gr.addColorStop(1,`rgba(${aura},0)`);
  g.fillStyle = gr; g.fillRect(-120,-190,240,230);                                                       // オーラ
  g.fillStyle='#1c1830'; g.beginPath(); g.moveTo(-44,0); g.lineTo(44,0); g.lineTo(30,-74+br); g.lineTo(-30,-74+br); g.closePath(); g.fill();   // マント
  g.fillStyle='#3a2a58'; g.fillRect(-44,-3,88,3); g.fillRect(-4,-70+br,8,70);
  g.fillStyle='#2a2244'; g.beginPath(); g.moveTo(-34,-74+br); g.lineTo(-52,-30); g.lineTo(-30,-34); g.closePath(); g.fill(); g.beginPath(); g.moveTo(34,-74+br); g.lineTo(52,-30); g.lineTo(30,-34); g.closePath(); g.fill();   // かた
  g.fillStyle='#e8d0b8'; g.beginPath(); g.arc(-40,-28,6,0,7); g.fill(); g.beginPath(); g.arc(40,-28,6,0,7); g.fill();   // て
  if (!f2) {                                                                                             // フード + 仮面
    g.fillStyle='#14101e'; g.beginPath(); g.moveTo(-30,-72+br); g.quadraticCurveTo(-34,-134+br,0,-142+br); g.quadraticCurveTo(34,-134+br,30,-72+br); g.closePath(); g.fill();
    g.fillStyle='#0a0810'; g.beginPath(); g.ellipse(0,-100+br,19,26,0,0,7); g.fill();
    g.fillStyle='#f4f0e8'; g.beginPath(); g.ellipse(0,-100+br,15,21,0,0,7); g.fill();
    g.fillStyle='#2a2a38'; g.fillRect(-10,-104+br,8,3); g.fillRect(2,-104+br,8,3);
    g.strokeStyle='#d8a838'; g.lineWidth=1.5; g.beginPath(); g.moveTo(0,-120+br); g.lineTo(0,-108+br); g.stroke();
  } else {                                                                                               // 素顔 + 白く長い髪
    g.fillStyle='#e8e8f4'; g.beginPath(); g.moveTo(-22,-104+br); g.quadraticCurveTo(-26,-142+br,0,-146+br); g.quadraticCurveTo(26,-142+br,22,-104+br);
    g.lineTo(30,-24+br*0.4); g.lineTo(18,-58); g.lineTo(10,-18); g.lineTo(-10,-18); g.lineTo(-18,-58); g.lineTo(-30,-24+br*0.4); g.closePath(); g.fill();
    g.fillStyle='#f0d2b8'; g.beginPath(); g.ellipse(0,-100+br,15,21,0,0,7); g.fill();
    g.fillStyle='#111'; g.fillRect(3,-104+br,8,3);                                                    // 赤い目
    g.strokeStyle='#111'; g.lineWidth=1.6; g.strokeRect(1,-108+br,12,8); g.strokeRect(-13,-108+br,12,8);  // 眼鏡
    g.beginPath(); g.moveTo(-1,-105+br); g.lineTo(1,-105+br); g.stroke();
    g.fillStyle='#f4f0e8'; g.beginPath(); g.moveTo(-15,-110+br); g.lineTo(0,-120+br); g.lineTo(-2,-102+br); g.lineTo(2,-90+br); g.lineTo(-4,-84+br); g.lineTo(-11,-82+br); g.lineTo(-15,-92+br); g.closePath(); g.fill();   // のこった 仮面
    g.fillStyle='#2a2a38'; g.fillRect(-11,-103+br,5,2);
    g.fillStyle='#a05050'; g.fillRect(-3,-89+br,6,1.5);
  }
}
