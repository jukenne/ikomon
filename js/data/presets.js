// テスト用のスタート地点(ボス戦の直前などから すぐ始められる)
// 使い方: http://localhost:8123/index.html?start=ch3_gate  (クラスを変えるなら &cls=macho など)
//   ・ふだんのセーブ(ikomon-save-v1)とは別の保存場所を使うので、本編のセーブは上書きされない
//   ・開くたびに、その地点から やりなおし(リロードでも同じ)。つづきから遊びたいときは &continue=1 を付ける
// start の一覧は、下の PRESETS を参照。

// 3クラスすべて解放ずみ・スターターカードを持った、そこそこ育った主人公を作る
function presetHero(lv, cls){
  hero.lv = lv; hero.exp = 0; hero.maxHp = 30 + 6*(lv-1); hero.hp = hero.maxHp; hero.atk = lv-1; hero.def = 3 + (lv-1);
  hero.fights = 10; hero.rewards = 1;                       // はじめての戦闘の説明を出さない
  hero.deck = START_DECK.slice(); hero.box = START_BOX.slice();
  QUEST_IDS.forEach(id => { hero.granted[id] = true; hero.unlocked[id] = true; hero.quests[id] = {state:'cleared', count:QUESTS[id].need}; });
  hero.box.push(...Object.keys(CARDS).filter(id => CARDS[id].cls !== 'basic'));    // 3クラスのクラスカードを ぜんぶ ボックスに入れておく(クラスを変えて試せる)
  hero.cls = CLASSES[cls] ? cls : 'gladiator';
  autoFixDeck();                                            // そのクラスのカードをデッキに入れる
  hero.money = 500; hero.items = {monena:3};
}
const flagSet = (...names) => names.forEach(n => { hero.flags[n] = true; });

const PRESETS = {
  // 村の東の出口の手前(1章クリアずみ。2章のはじまり)
  town:     {label:'第1章クリア後 / 村の東の出口', lv:3, cls:'basic',
             apply:() => { flagSet('ch1_start','ch1_furiten_seen','ch1_clear','talked_villager','talked_traveler'); loadMap('village', 22, 8, 'right'); }},
  // 洞窟のボス部屋の手前(シュレッダー戦の直前)
  shredder: {label:'第2章 洞窟の奥 / シュレッダー戦の直前', lv:4, cls:'gladiator',
             apply:() => { flagSet('ch1_start','ch1_furiten_seen','ch1_clear','talked_villager','talked_traveler','ch2_start','talked_mayor','dojo_met','ch2_cave_seen'); loadMap('cave', 19, 7, 'right'); }},
  // 魔王城の門の手前(フリテン＋セリカ戦の直前)
  ch3_gate: {label:'第3章 魔王城の門の手前 / フリテン＋セリカ戦の直前', lv:5, cls:'gladiator',
             apply:() => { flagSet('ch1_start','ch1_furiten_seen','ch1_clear','talked_villager','talked_traveler','ch2_start','talked_mayor','dojo_met','ch2_cave_seen','ch2_clear','has_ship','sea_seen','ch3_start'); loadMap('island', 18, 8, 'up'); }},
  // 第4章: 魔王城のホール(フリテン・セリカと話して回廊を通り、玉座の間へ)
  ch4_hall: {label:'第4章 魔王城のホール / ここから魔王のもとへ', lv:7, cls:'gladiator',
             apply:() => { flagSet('ch1_start','ch1_furiten_seen','ch1_clear','talked_villager','talked_traveler','ch2_start','talked_mayor','dojo_met','ch2_cave_seen','ch2_clear','has_ship','sea_seen','ch3_start','ch3_gate_seen','ch3_clear','ch4_start'); loadMap('castle_hall', 8, 10, 'up'); }},
  // 玉座の間の手前(魔王戦の直前)。&form=2 で第二形態から / &bosshp=0.06 で、魔王のHPを少なめにして始める
  ch4_throne: {label:'第4章 玉座の間 / 魔王戦の直前 (&form=2 第二形態から / &bosshp=0.06 魔王のHP少なめ)', lv:7, cls:'gladiator',
             apply:() => { flagSet('ch1_start','ch1_furiten_seen','ch1_clear','talked_villager','talked_traveler','ch2_start','talked_mayor','dojo_met','ch2_cave_seen','ch2_clear','has_ship','sea_seen','ch3_start','ch3_gate_seen','ch3_clear','ch4_start','ch4_gallery'); loadMap('castle_throne', 7, 10, 'up'); }},
};

function applyPreset(name, clsOverride){
  const p = PRESETS[name];
  presetHero(p.lv, clsOverride || p.cls);
  p.apply();
  return `テスト用データ: ${p.label} (Lv${hero.lv} / ${CLASSES[hero.cls].name})`;
}
