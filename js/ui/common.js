// UI共通部品: ポインター座標・枠・ボタン・文字フィット
function canvasPos(e){
  const r = cv.getBoundingClientRect();
  return {x:(e.clientX-r.left-cv.clientLeft)*SCREEN_W/cv.clientWidth, y:(e.clientY-r.top-cv.clientTop)*SCREEN_H/cv.clientHeight};
}
const inRect = (p,r) => p.x>=r.x && p.x<=r.x+r.w && p.y>=r.y && p.y<=r.y+r.h;

function panel(x,y,w,h){
  g.fillStyle='rgba(15,15,40,.92)'; g.fillRect(x,y,w,h);
  g.strokeStyle='#fff'; g.lineWidth=3; g.strokeRect(x+1.5,y+1.5,w-3,h-3);
}
function fitFont(text, maxW, size, bold){
  for (; size>8; size--) { g.font=(bold?'bold ':'')+size+'px sans-serif'; if (g.measureText(text).width<=maxW) break; }
}

function button(x,y,w,h,label,sel){
  g.fillStyle='rgba(15,15,40,.95)'; g.fillRect(x,y,w,h);
  g.strokeStyle = sel ? '#ffd966' : '#aaa'; g.lineWidth = sel ? 3 : 2; g.strokeRect(x+1,y+1,w-2,h-2);
  g.fillStyle = sel ? '#ffd966' : '#fff'; fitFont(label, w-8, 12, false); g.textAlign='center'; g.textBaseline='middle';
  g.fillText(label, x+w/2, y+h/2+1); g.textAlign='left';
}

function wrapChars(str, n){ const out=[]; for (let i=0; i<str.length; i+=n) out.push(str.slice(i,i+n)); return out; }

// ---- 文章の折り返し ----
// 日本語は1文字ずつ幅を測って行に詰める。「、。！？」などは行頭に来ないよう、行末にぶら下げる。
// 使う前に g.font を設定しておくこと。
const NO_LINE_START = '、。，．！？!?」』）)…ー・,.';
function wrapRows(str, maxW){
  const rows = []; let cur = '';
  for (const ch of str) {
    if (cur && g.measureText(cur+ch).width > maxW && !NO_LINE_START.includes(ch)) {
      // 単語の途中で切らないよう、直前のスペースで折り返す(スペースが無ければ その場で)
      const sp = cur.lastIndexOf(' ');
      if (sp > 0) { rows.push(cur.slice(0, sp)); cur = cur.slice(sp+1); }
      else { rows.push(cur); cur = ''; }
    }
    cur += ch;
  }
  if (cur) rows.push(cur);
  return rows.length ? rows : [''];
}
// 会話ウィンドウ用: 1つのセリフを折り返し、2行ずつの「ページ」に分ける(長いセリフは自動で次のページへ)
function dialogPages(d){
  if (d.pages) return d.pages;
  g.font = '16px sans-serif';
  const maxW = SCREEN_W - 24 - 28 - 30;               // 枠の幅 - 左右の余白 - ▼の分
  d.pages = [];
  for (const line of d.lines) { const rows = wrapRows(line, maxW); for (let i=0; i<rows.length; i+=2) d.pages.push(rows.slice(i, i+2)); }
  return d.pages;
}
