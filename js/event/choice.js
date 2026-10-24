// 選択肢(イベントの {choice:{prompt, options:[{label, run, cancel?}]}} で表示)
// 上下で選んで Z で決定。cancel:true の選択肢は X キーでも選べる。
let choiceBox = null;
const CHOICE_ROW = 26;
function choiceRect(){
  const n = choiceBox.options.length, w = 320, h = 40 + n*CHOICE_ROW;
  return {x:SCREEN_W-w-12, y:SCREEN_H-h-12, w, h};
}
function openChoice(c){ choiceBox = {prompt:c.prompt || '', options:c.options, cursor:0}; }
function choiceSelect(i){
  const opt = choiceBox.options[i]; choiceBox = null;
  if (opt.fn) { opt.fn(); return; }                  // 戦闘の途中など、イベント台本の外で使う選択肢
  if (ev) { ev.stack.push({cmds:opt.run || [], i:0}); ev.wait = null; stepEvent(); }
}
function choiceInput(k){
  const c = choiceBox, n = c.options.length;
  if (k === 'up') c.cursor = (c.cursor+n-1) % n;
  else if (k === 'down') c.cursor = (c.cursor+1) % n;
  else if (k === 'ok') choiceSelect(c.cursor);
  else if (k === 'cancel') { const i = c.options.findIndex(o => o.cancel); if (i >= 0) choiceSelect(i); }
}
function choicePointerDown(e){
  const p = canvasPos(e), r = choiceRect();
  for (let i=0; i<choiceBox.options.length; i++) {
    if (inRect(p, {x:r.x, y:r.y+34+i*CHOICE_ROW, w:r.w, h:CHOICE_ROW})) { choiceBox.cursor = i; choiceSelect(i); return; }
  }
}
function drawChoice(){
  if (!choiceBox) return;
  const c = choiceBox, r = choiceRect();
  panel(r.x, r.y, r.w, r.h);
  g.textAlign = 'left'; g.textBaseline = 'top';
  if (c.prompt) { g.fillStyle = '#ffd966'; g.font = 'bold 14px sans-serif'; g.fillText(c.prompt, r.x+14, r.y+10); }
  g.font = '15px sans-serif';
  c.options.forEach((o, i) => {
    const y = r.y + 36 + i*CHOICE_ROW;
    g.fillStyle = i === c.cursor ? '#ffd966' : '#fff';
    g.fillText((i === c.cursor ? '▶ ' : '   ') + o.label, r.x+14, y);
  });
}
