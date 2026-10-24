// セーブ(localStorage)とロード
// =====================================================================
// ===== セーブ(ブラウザのlocalStorageに自動保存) =====
// 保存: デッキ・ボックス・レベル等・位置  / 戦闘の途中経過は保存しない(戦闘前の状態に戻る)
// =====================================================================
// テスト用スタート(?start=ch3_gate など。presets.js)のときは、ふだんのセーブとは別の場所に保存する
const URL_Q = new URLSearchParams(location.search);
const PRESET_NAME = PRESETS[URL_Q.get('start')] ? URL_Q.get('start') : null;
const PRESET_CLS = CLASSES[URL_Q.get('cls')] ? URL_Q.get('cls') : null;
const SAVE_KEY = PRESET_NAME ? `ikomon-save-test-${PRESET_NAME}-${PRESET_CLS || 'default'}` : 'ikomon-save-v1';
let saveDisabled = false;
function saveGame(){
  if (saveDisabled || ev) return;                 // イベント中は保存しない(中途半端な状態を残さない)
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({v:1,
      hero:{lv:hero.lv, exp:hero.exp, hp:hero.hp, maxHp:hero.maxHp, atk:hero.atk, def:hero.def,
            deck:hero.deck, box:hero.box, fights:hero.fights, rewards:hero.rewards,
            cls:hero.cls, classExp:hero.classExp, mastered:hero.mastered, granted:hero.granted, flags:hero.flags,
            quests:hero.quests, unlocked:hero.unlocked,
            money:hero.money, images:hero.images, items:hero.items},
      player:{map:curMapId, x:player.x, y:player.y, dir:player.dir}}));
  } catch (e) { /* 保存できない環境(プライベートモード等)では黙って続行 */ }
}
function loadGame(){
  try {
    const raw = localStorage.getItem(SAVE_KEY); if (!raw) return false;
    const d = JSON.parse(raw), h = d.hero, p = d.player;
    const num = (v, def) => Number.isFinite(v) ? v : def;
    const okCard = id => typeof id==='string' && CARDS[id];
    // デッキが15枚で全カードが実在しない場合は壊れたデータとして捨てる
    if (!Array.isArray(h.deck) || h.deck.length!==DECK_SIZE || !h.deck.every(okCard)) return false;
    hero.deck = h.deck.slice();
    hero.box  = Array.isArray(h.box) ? h.box.filter(okCard) : [];
    hero.lv = num(h.lv,1); hero.exp = num(h.exp,0); hero.maxHp = num(h.maxHp,30);
    hero.hp = Math.min(num(h.hp,hero.maxHp), hero.maxHp); hero.atk = num(h.atk,0); hero.def = num(h.def,3);
    hero.fights = num(h.fights,0); hero.rewards = num(h.rewards,0);
    hero.money = Math.max(0, Math.floor(num(h.money, 0)));
    hero.images = {}; hero.items = {};
    Object.keys(h.images || {}).forEach(k => { if (CARDS[k] && h.images[k] > 0) hero.images[k] = Math.floor(h.images[k]); });
    Object.keys(h.items || {}).forEach(k => { if (ITEMS[k] && h.items[k] > 0) hero.items[k] = Math.floor(h.items[k]); });
    // クラス関連(古いセーブには無いので既定値で補う)
    hero.cls = CLASSES[h.cls] ? h.cls : 'basic';
    ['gladiator','macho','doctor'].forEach(k => { hero.classExp[k] = Math.min(CLASS_MAX, Math.max(0, num((h.classExp||{})[k], 0))); });
    hero.mastered = {}; hero.granted = {};
    ['gladiator','macho','doctor'].forEach(k => { hero.mastered[k] = !!(h.mastered||{})[k]; hero.granted[k] = !!(h.granted||{})[k]; });
    // クエストとクラス解放(古いセーブには無いので、すでに使ったクラスは解放ずみにする)
    QUEST_IDS.forEach(k => {
      const sq = (h.quests || {})[k] || {};
      hero.quests[k] = {state: ['none','active','done','cleared'].includes(sq.state) ? sq.state : 'none',
                        count: Math.max(0, Math.min(QUESTS[k].need, num(sq.count, 0)))};
    });
    hero.unlocked = {};
    QUEST_IDS.forEach(k => { hero.unlocked[k] = h.unlocked ? !!h.unlocked[k] : (!!hero.granted[k] || hero.cls === k); });
    QUEST_IDS.forEach(k => { if (hero.unlocked[k]) hero.quests[k].state = 'cleared'; });
    if (!classUnlocked(hero.cls)) hero.cls = 'basic';
    if (!hero.deck.every(usable) || foreignCount(hero.deck) > FOREIGN_MAX) autoFixDeck();   // 使えないカードが入っていたら直す
    hero.flags = {};
    Object.keys(h.flags || {}).forEach(k => { if (h.flags[k] === true) hero.flags[k] = true; });   // 物語のフラグ
    // いたマップ(古いセーブは村)に復元。歩けない場所なら開始位置へ
    const mid = MAPS[p.map] ? p.map : 'village';
    loadMap(mid, p.x, p.y, DIRS[p.dir] ? p.dir : 'down');
    if (!T[tileAt(p.x, p.y)].walk) loadMap(START.map, START.x, START.y, START.dir);
    return true;
  } catch (e) { return false; }
}
function resetGame(){
  if (!confirm('セーブデータを消して、さいしょから はじめる？(デッキ・ボックス・レベルが もとに もどります)')) return;
  saveDisabled = true;
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  location.reload();
}
addEventListener('beforeunload', ()=>{ if (!battle) saveGame(); });
// 起動: まず開始位置にマップを読み込み、セーブがあれば その続きから。なければ オープニング(家のイベント)から
loadMap(START.map, START.x, START.y, START.dir);
const USE_SAVE = !PRESET_NAME || !!URL_Q.get('continue');           // テスト用スタートは 開くたびに最初から(&continue=1 で つづきから)
if (USE_SAVE && loadGame()) dialog = {name:'', lines:['セーブデータを よみこんだ！ (つづきから)'], i:0};
else if (PRESET_NAME) {                                           // テスト用スタート: その地点のデータを用意して、保存する
  const label = applyPreset(PRESET_NAME, PRESET_CLS);
  saveGame();
  dialog = {name:'', lines:[label, 'ふだんの セーブには えいきょうしないよ。(このURLを ひらきなおせば、いつでも ここから やりなおせる)'], i:0};
}
else { const en = enterEvent(); if (en) runEvent(en); }
