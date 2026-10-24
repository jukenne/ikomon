// 絵の読み込み: 画像を非同期で読み込み、まだ無い/見つからないときは null を返す(→ 呼び出し側が図形で代用する)
const Assets = {
  cache: {},
  entry(path){
    let e = this.cache[path];
    if (e) return e;
    e = this.cache[path] = {img:null, state:'loading'};
    const im = new Image();
    im.onload  = () => { e.img = im; e.state = 'ok'; };
    im.onerror = () => { e.state = 'missing'; };           // ファイルが無いだけ。404はコンソールに出るが問題なし
    im.src = ASSET_ROOT + path;
    return e;
  },
  get(path){ const e = this.entry(path); return e.state === 'ok' ? e.img : null; },
  // 候補のうち、先に書いたものを優先して、読み込めたものを返す(全部の読み込みを始める)
  first(paths){ let found = null; for (const p of paths) { const im = this.get(p); if (im && !found) found = im; } return found; },
  set(path, img){ this.cache[path] = {img, state:'ok'}; },  // テスト用: 画像を直接登録する
};

// ---- 描画の補助 ----
const imgW = im => im.naturalWidth || im.width, imgH = im => im.naturalHeight || im.height;
// 足もと中央(cx, footY)を基準に、高さ h で描く(幅は縦横比のまま)
function drawSprite(im, cx, footY, h){
  const w = imgW(im) * h / imgH(im);
  g.drawImage(im, cx - w/2, footY - h, w, h);
}
// 枠(x,y,w,h)をはみ出さず全面に敷きつめる(中央を切り抜く)
function drawCover(im, x, y, w, h){
  const iw = imgW(im), ih = imgH(im), s = Math.max(w/iw, h/ih), sw = w/s, sh = h/s;
  g.drawImage(im, (iw-sw)/2, (ih-sh)/2, sw, sh, x, y, w, h);
}
// マップのキャラの絵を選ぶ。
//   立ち姿:  chars/{id}_{dir}.png → 無ければ chars/{id}.png
//   歩き姿:  chars/{id}_{dir}_walk1.png / _walk2.png(足を交互に出す2コマ) → 無ければ立ち姿で代用
// frame: 0=立ち, 1=歩き1, 2=歩き2
function charSprite(id, dir, frame){
  const stand = [`chars/${id}_${dir}.png`, `chars/${id}.png`];
  return Assets.first(frame ? [`chars/${id}_${dir}_walk${frame}.png`, ...stand] : stand);
}
const charHeight = id => ART.charH[id] || ART.charH.default;
