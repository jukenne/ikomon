// 絵(画像)の取り決め: 置き場所・名前・大きさ。
// 画像ファイルが無いものは、これまでの図形で表示される(絵ができた分から順に差し替えられる)。
// 詳しい手順は assets/README.md、用意状況は assets-check.html で確認できる。
const ASSET_ROOT = 'assets/';

const ART = {
  smooth: true,                               // 拡大縮小をなめらかに(イラスト向け。ドット絵なら false)
  charH:  {default:40, furiten:50, serika:46, maou:46},           // マップのキャラの高さ(px。1マス=32)。足もと中央を基準に描く
  enemyH: {default:110, furiten:128, serika:132, serika_rage:132, maou:112, maou_unmasked:112},         // 戦闘の敵の高さ(px)
  battlePlayerH: 84,                          // 戦闘画面の いこあん(後ろ姿)の高さ
  portraitH: 118,                             // 会話の立ち絵の高さ
};

// 会話の立ち絵: セリフの話者名 → ファイル名(assets/portraits/{id}.png)と、表示する側
const PORTRAITS = {
  'いこあん': {id:'ikoan',   side:'left'},
  'フリテン': {id:'furiten', side:'right'},
  'セリカ':   {id:'serika',  side:'right'},
  '魔王':     {id:'maou',    side:'right'},
  // 「？？？」(精霊の声)には立ち絵を出さない: 姿はラスト(アルカ)まで見せない(ユーザー確定)
  'アルカ':   {id:'spirit',  side:'right'},     // カードの精霊(名前が明かされたあと)
  'まおう':   {id:'maou',    side:'right'},     // 3章の台本の表記ゆれ
};

// ---- 第4章(ラスボス戦)で使う全面の絵。無ければ図形で代用する。詳しくは docs/追加絵リスト.md ----
// spoiler:true は ネタバレ系(assets-check.html では別グループに出す)
const FINAL_ART = [
  ['cutin/maou_crack.png',   '魔王: 仮面にヒビ(カットイン)'],
  ['cutin/maou_half.png',    '魔王: 仮面が半分割れた素顔(カットイン)'],
  ['cutin/maou_form2.png',   '魔王: 第二形態に入る(あれば)'],
  ['cutin/maou_last.png',    '魔王: 闇の剣を構える(あれば)', true],
  ['scenes/abyss_zenith.png','逆さの城アビス・ゼニスの召喚'],
  ['cutin/blades_clash.png', '光の剣といこあん vs 闇の剣と魔王(刃を交える)', true],
  ['scenes/memory_1.png',    '回想1: カードが人間を支配'],
  ['scenes/memory_2.png',    '回想2: 大切な人たちを失う'],
  ['scenes/memory_3.png',    '回想3: 生き残った三人'],
  ['scenes/memory_4.png',    '回想4: 過去へ遡る決意'],
  ['scenes/ending_maou.png', 'エンディング: 魔王が散る', true],
  ['scenes/ending_ikoan.png','エンディング: 歩き出すいこあん', true],
  ['bg/final.png',           'ラスボス戦の背景'],
  ['bg/final_2.png',         'ラスボス戦の背景(第二形態。無ければ final.png)'],
  ['enemies/serika_rage.png','セリカの激昂後(ムキムキ)'],
  ['portraits/serika_rage.png','セリカの激昂後の立ち絵(いまは使う場面なし)'],
  ['enemies/maou_unmasked.png','魔王(第二形態・素顔)'],
  ['portraits/maou_unmasked.png','魔王の立ち絵(素顔)'],
  ['cutin/spirit_call.png',  '精霊アルカの呼びかけ', true],
  ['cutin/duelist_awaken.png','ザ・デュエリストの復活', true],
  ['portraits/ikoan_duelist.png','ザ・デュエリストの立ち絵', true],
  ['battle/player_duelist.png','ザ・デュエリストの後ろ姿', true],
  ['cards/oblivion_edge.png','闇の剣 オブリビオン・エッジ', true],
  ['cards/genesis_edge.png', '光の剣 ジェネシス・エッジ', true],
];

// ---- 用意する絵の一覧(assets-check.html が使う。ゲーム本体では呼ばれない) ----
function assetSpecs(){
  const S = [];
  const add = (group, path, label, hint) => S.push({group, path, label, hint});
  const npcIds = new Set(['player']);
  Object.values(MAPS).forEach(m => (m.npcs||[]).forEach(n => npcIds.add(n.id)));
  npcIds.forEach(id => {
    if (id === 'player') {                    // いこあんは 4方向 × (立ち・歩き1・歩き2)
      ['down','up','left','right'].forEach(d => ['', '_walk1', '_walk2'].forEach(f =>
        add('マップのキャラ', `chars/player_${d}${f}.png`, `player ${d}${f ? ' ' + f.slice(1) : '(立ち)'}`, '背景透過・足もとが下端')));
    } else add('マップのキャラ', `chars/${id}.png`, id, '正面向き1枚でOK・背景透過。向きごとは '+id+'_down|up|left|right.png、歩きは _walk1|_walk2');
  });
  const seen = new Set();                                   // 同じ敵(フリテンの1章版/3章版など)は1つにまとめる
  [...ENEMIES, ...Object.values(BOSSES)].forEach(e => { if (seen.has(e.id)) return; seen.add(e.id); add('戦闘の敵', `enemies/${e.id}.png`, e.name, '背景透過。足もとが下端'); });
  FINAL_ART.forEach(([p, label, spoiler]) => add(spoiler ? '第4章ラスボス戦 (ネタバレ注意)' : '第4章ラスボス戦', p, label, 'docs/追加絵リスト.md を参照'));
  add('戦闘の背景', 'bg/battle.png', '戦闘の背景', '横長(480×320の比率)。全面に表示');
  add('戦闘の背景', 'battle/player.png', 'いこあんの後ろ姿', '背景透過。戦闘画面の左下に表示');
  Object.values(PORTRAITS).forEach(p => add('会話の立ち絵', `portraits/${p.id}.png`, p.id, '背景透過。バストアップ〜全身'));
  Object.keys(CARDS).forEach(id => add('カード', `cards/${id}.png`, CARDS[id].name, '縦横 3:2 くらい。カード全面の背景になる'));
  new Set(Object.values(T).map(t => t.name)).forEach(n => add('マップのタイル', `tiles/${n}.png`, n, '32×32(または正方形)。1マスぶん'));
  return S;
}
