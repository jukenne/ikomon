// 効果音: 音声ファイルは使わず、ブラウザの WebAudio で その場で合成する(配布ZIPに音ファイルが要らない)。
// 使い方: sfx('名前')。Mキーで ON/OFF(設定はこのブラウザに保存)。
// 音を足すときは SOUNDS に1つ足すだけ。tone(開始Hz, 終了Hz, 長さ秒, 波形, 音量, 開始までの遅れ秒) を重ねて作る。
let audioCtx = null, soundOn = true;
try { soundOn = localStorage.getItem('ikomon-sound') !== 'off'; } catch (e) {}
const SFX_VOLUME = 0.5;                                        // 全体の音量(0〜1)

function getAudio(){
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();      // ブラウザは最初の操作があるまで音を止める
  return audioCtx;
}
function tone(f0, f1, dur, type, vol, delay){
  const a = getAudio(); if (!a) return;
  const t0 = a.currentTime + (delay || 0);
  const o = a.createOscillator(), gn = a.createGain();
  o.type = type || 'square';
  o.frequency.setValueAtTime(f0, t0);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  gn.gain.setValueAtTime(0.0001, t0);
  gn.gain.exponentialRampToValueAtTime((vol || 0.2) * SFX_VOLUME, t0 + 0.008);
  gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(gn); gn.connect(a.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
function noise(dur, vol, delay, hp){                           // シャッという ノイズ(攻撃・ヒット用)
  const a = getAudio(); if (!a) return;
  const t0 = a.currentTime + (delay || 0), n = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
  for (let i=0; i<n; i++) d[i] = Math.random()*2-1;
  const s = a.createBufferSource(), f = a.createBiquadFilter(), gn = a.createGain();
  s.buffer = buf; f.type = 'highpass'; f.frequency.value = hp || 1200;
  gn.gain.setValueAtTime((vol || 0.2) * SFX_VOLUME, t0);
  gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f); f.connect(gn); gn.connect(a.destination);
  s.start(t0);
}

const SOUNDS = {
  // --- 会話 ---
  talk:   () => tone(660, 740, 0.05, 'square', 0.10),                          // ポッ: 会話の開始・ページ送り
  talkLow:() => tone(440, 490, 0.06, 'square', 0.10),                          // ナレーション(名前なし)用
  // --- カード ---
  card:   () => { tone(520, 1040, 0.09, 'triangle', 0.2); tone(1040, 1560, 0.10, 'triangle', 0.15, 0.07); },   // シュッ→キラッ: カードを使った
  fuse:   () => { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.14, 'triangle', 0.18, i*0.07)); },   // 融合: 上がっていく音
  hit:    () => { noise(0.14, 0.28, 0, 1800); tone(220, 70, 0.16, 'sawtooth', 0.22); },                       // ザシュッ: 敵に当たった
  heal:   () => { [523, 659, 784].forEach((f, i) => tone(f, f, 0.16, 'sine', 0.2, i*0.08)); },                 // ピロリン: 回復
  buff:   () => { tone(330, 660, 0.18, 'square', 0.12); tone(495, 990, 0.18, 'square', 0.10, 0.1); },         // 強化・まもり・はんげき・リジェネ
  poison: () => { tone(200, 90, 0.35, 'sawtooth', 0.14); tone(150, 80, 0.35, 'square', 0.08, 0.05); },        // ブクブク: どく
  hurt:   () => { tone(180, 60, 0.18, 'square', 0.2); noise(0.08, 0.12, 0, 800); },                            // 反動で自分がダメージ
};
function sfx(name){
  if (!soundOn || !SOUNDS[name]) return;
  try { SOUNDS[name](); } catch (e) {}                         // 音で ゲームを止めない
}
addEventListener('keydown', e => {
  if ((e.key === 'm' || e.key === 'M') && !e.repeat) {
    soundOn = !soundOn;
    try { localStorage.setItem('ikomon-sound', soundOn ? 'on' : 'off'); } catch (err) {}
    if (soundOn) { sfx('card'); }
  }
});
