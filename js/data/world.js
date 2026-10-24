// 世界のデータ: 画面設定・タイル定義・調べたときのセリフ (マップ本体は maps.js)
// ===== 設定 =====
const TILE = 32;            // 1マスのピクセル数
const VIEW_W = 15, VIEW_H = 10; // 画面に映るマス数
const STEP_MS = 160;        // 1マス歩く時間(ms)
const DASH_MS = 90;
// 画面の大きさ(論理座標。コードはこの座標で描く)と、内部の解像度の倍率(2倍にすると絵・文字がくっきりする)
const SCREEN_W = VIEW_W*TILE, SCREEN_H = VIEW_H*TILE, HIRES = 2;

// ===== タイル定義 =====
// 1文字 = 1マス。マップ(maps.js)は このタイル文字を並べて作る。
const T = {
  '.': {c:'#5fb55a', walk:true,  name:'grass'},
  ',': {c:'#4ea04b', walk:true,  name:'tallgrass', encounter:true}, // 草むら: 歩くと戦闘になることがある
  'T': {c:'#2f7a3a', walk:false, name:'tree'},
  '~': {c:'#3b7fd4', walk:false, name:'water'},
  '=': {c:'#d8b87a', walk:true,  name:'path'},
  'H': {c:'#b5523b', walk:false, name:'house'},
  'D': {c:'#6b3a22', walk:true,  name:'door'},
  'P': {c:'#e0568f', walk:false, name:'shopbldg'},     // カードショップの 建物(ピンク)
  'J': {c:'#3d4b5c', walk:false, name:'dojobldg'},     // デュエルどうじょうの 建物(和風)
  'K': {c:'#14a05a', walk:false, name:'conbinibldg'},  // コンビニの 建物(緑の看板)
  '#': {c:'#777b86', walk:false, name:'rock'},
  'F': {c:'#5fb55a', walk:true,  name:'flower'},
  // --- 室内 ---
  'f': {c:'#c8a070', walk:true,  name:'floor'},
  'w': {c:'#5a4a5e', walk:false, name:'wall'},
  'b': {c:'#a04050', walk:false, name:'bed'},
  'k': {c:'#7a5230', walk:false, name:'shelf'},
  't': {c:'#9a6a3a', walk:false, name:'table'},
  'r': {c:'#d8606a', walk:true,  name:'rug'},
  'x': {c:'#8a6a4a', walk:true,  name:'mat'},        // 出入口のマット
  'q': {c:'#aab0bc', walk:false, name:'copier'},     // コピー機(コンビニ)
  // --- マオウ・アイランド ---
  'm': {c:'#4a3f5a', walk:true,  name:'darkground'},   // くらい 地面
  'W': {c:'#3a3548', walk:false, name:'castlewall'},   // まおうじょうの かべ
  'g': {c:'#1a1424', walk:true,  name:'castlegate'},   // まおうじょうの もん
  'Y': {c:'#4a3f5a', walk:false, name:'deadtree'},     // かれき
  // --- 魔王城の なか(だい4しょう) ---
  'a': {c:'#2e2840', walk:true,  name:'castlefloor'},  // 城の ゆか
  'A': {c:'#6a1f3a', walk:true,  name:'carpet'},        // あかい じゅうたん
  'i': {c:'#4a4560', walk:false, name:'pillar'},        // はしら
  'e': {c:'#2a1030', walk:false, name:'throne'},        // ぎょくざ
  'N': {c:'#3a3050', walk:false, name:'mural'},         // へきが(額に入った絵)
  'l': {c:'#3a3050', walk:false, name:'lightaltar'},    // ひかりの カードの だい(HP回復)
  'B': {c:'#2f6fc0', walk:false, name:'beacon'},       // ひかる とう(うみの いりぐちの めじるし)
  // --- 街・ほらあな・うみ ---
  's': {c:'#5fb55a', walk:false, name:'sign'},       // 看板
  'C': {c:'#777b86', walk:true,  name:'cavemouth'},  // ほらあなの入口
  'p': {c:'#a88a56', walk:true,  name:'dock'},       // 桟橋
  'o': {c:'#2f6fc0', walk:true,  name:'sea'},        // うみ(ふねで進む)
  'R': {c:'#3a3540', walk:false, name:'cavewall'},
  'c': {c:'#7a7284', walk:true,  name:'cavefloor'},
  'v': {c:'#6e6678', walk:true,  name:'cavedust', encounter:true},   // ほらあなの ゆか(敵が出る)
};

// 通れないタイルを「調べた(Zキー)」ときのセリフ
const TALK_TILES = {
  'H': ['だれかの いえ だ。','かぎが かかっている…'],
  'P': ['カードショップの かべだ。'], 'J': ['どうじょうの かべだ。'], 'K': ['コンビニの かべだ。'],
  'k': ['たなには ぎっしり カードが ならんでいる…！'],
  'b': ['いこあんの ベッド。','カードに かこまれて ねるのが いちばん おちつく。'],
  't': ['つくえの うえも カードの やまだ。','デッキこうちくの メモが のこっている。'],
};
