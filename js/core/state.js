// 共通の状態: キャンバス・プレイヤー・キー入力の状態
// ===== 状態 =====
const cv = document.getElementById('c'), g = cv.getContext('2d');
cv.width = SCREEN_W*HIRES; cv.height = SCREEN_H*HIRES;          // 内部は2倍の解像度。毎フレーム g.setTransform で論理座標に戻す
g.imageSmoothingEnabled = ART.smooth; g.imageSmoothingQuality = 'high';

const player = {x:4, y:5, px:4, py:5, dir:'down', moving:false, t:0, fromX:4, fromY:5, ms:STEP_MS, anim:0};
let dialog = null; // {name, lines, i}
const keys = {};
let shiftHeld = false;
