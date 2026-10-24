// カード/クラス/融合のデータとルール
// ---- カード定義 ----
// type: atk(こうげき) / buff(きょうか=攻撃力アップ・ガード) / heal(かいふく)
// pre/suf: 融合したときの名前を作る部品  名前 = 1枚目の pre + 2枚目の suf
const CARDS = {
  punch:   {name:'いこパンチ',       pre:'いこ',     suf:'パンチ',   type:'atk',  dmg:6},
  kick:    {name:'とびげり',         pre:'とび',     suf:'げり',     type:'atk',  dmg:7},
  swallow: {name:'つばめがえし',     pre:'つばめ',   suf:'がえし',   type:'atk',  dmg:8},
  fire:    {name:'ファイアボール',   pre:'ファイア', suf:'ボール',   type:'atk',  dmg:9},
  thunder: {name:'サンダーボルト',   pre:'サンダー', suf:'ボルト',   type:'atk',  dmg:11},
  meteor:  {name:'ミニメテオ',       pre:'ミニ',     suf:'メテオ',   type:'atk',  dmg:14},
  power:   {name:'パワーチャージ',   pre:'パワー',   suf:'チャージ', type:'buff', atkUp:3},
  guard:   {name:'ガードアップ',     pre:'ガード',   suf:'アップ',   type:'buff', guard:5},
  focus:   {name:'きあいだめ',       pre:'きあい',   suf:'だめ',     type:'buff', atkUp:2, guard:2},
  wall:    {name:'てっぺき',         pre:'てっ',     suf:'ぺき',     type:'buff', guard:9},
  roar:    {name:'いかりのたけび',   pre:'いかり',   suf:'たけび',   type:'buff', atkUp:5},
  heal:    {name:'ヒーリング',       pre:'ヒー',     suf:'リング',   type:'heal', heal:8},
  potion:  {name:'ポーション',       pre:'ポー',     suf:'ション',   type:'heal', heal:6},
  onigiri: {name:'おいしいおにぎり', pre:'おいしい', suf:'おにぎり', type:'heal', heal:12},
  prayer:  {name:'せいなるいのり',   pre:'せいなる', suf:'いのり',   type:'heal', heal:16},

  // ---- クラスカード: グラディエーター(強力な こうげき) ----
  gl_gladius: {cls:'gladiator', name:'グラディウス',       pre:'グラ',       suf:'ディウス',     type:'atk', dmg:13},
  gl_chain:   {cls:'gladiator', name:'れんぞくぎり',       pre:'れんぞく',   suf:'ぎり',         type:'atk', dmg:8, hits:2},
  gl_lance:   {cls:'gladiator', name:'けっとうのやり',     pre:'けっとう',   suf:'やり',         type:'atk', dmg:18, selfDmg:3},
  gl_cheer:   {cls:'gladiator', name:'かっさいのちから',   pre:'かっさい',   suf:'ちから',       type:'atk', dmg:7, atkUp:4},
  gl_triple:  {cls:'gladiator', name:'トリプルスラッシュ', pre:'トリプル',   suf:'スラッシュ',   type:'atk', dmg:6, hits:3},
  gl_rage:    {cls:'gladiator', name:'ブラッディレイジ',   pre:'ブラッディ', suf:'レイジ',       type:'atk', dmg:26, selfDmg:7},
  // ---- クラスカード: マッショ(強力な きょうか。ためて ドカン！) ----
  mc_protein: {cls:'macho', name:'プロテイン',         pre:'プロ',     suf:'テイン',       type:'buff', atkUp:5},
  mc_biceps:  {cls:'macho', name:'ダブルバイセップス', pre:'ダブル',   suf:'バイセップス', type:'buff', atkUp:4, guard:4},
  mc_hard:    {cls:'macho', name:'ハードボディ',       pre:'ハード',   suf:'ボディ',       type:'buff', guard:14},
  mc_counter: {cls:'macho', name:'マッスルカウンター', pre:'マッスル', suf:'カウンター',   type:'buff', guard:5, thorn:14},
  mc_burst:   {cls:'macho', name:'マッスルバースト',   pre:'マッスル', suf:'バースト',     type:'buff', dmgPerAtk:3},
  mc_press:   {cls:'macho', name:'ボディプレス',       pre:'ボディ',   suf:'プレス',       type:'buff', guard:6, dmgPerGuard:2},
  mc_pump:    {cls:'macho', name:'フルパンプ',         pre:'フル',     suf:'パンプ',       type:'buff', atkUp:6, guard:6},
  // ---- クラスカード: ドクトル(強力な かいふく。どく・きゅうけつで しとめる) ----
  dc_elixir:  {cls:'doctor', name:'ドクトルのくすり',   pre:'ドクトル', suf:'くすり',       type:'heal', heal:15},
  dc_odd:     {cls:'doctor', name:'あやしいくすり',     pre:'あやしい', suf:'くすり',       type:'heal', heal:8, poison:4},
  dc_light:   {cls:'doctor', name:'せいなるひかり',     pre:'せいなる', suf:'ひかり',       type:'heal', heal:12, dmgFromHeal:1},
  dc_scalpel: {cls:'doctor', name:'きゅうけつメス',     pre:'きゅうけつ', suf:'メス',       type:'atk',  dmg:9, drain:100},
  dc_regen:   {cls:'doctor', name:'リジェネちゅうしゃ', pre:'リジェネ', suf:'ちゅうしゃ',   type:'heal', heal:4, regen:4},
  dc_full:    {cls:'doctor', name:'まんたんのいやし',   pre:'まんたん', suf:'いやし',       type:'heal', heal:24},
  dc_venom:   {cls:'doctor', name:'どくのメス',         pre:'どく',     suf:'メス',         type:'atk',  dmg:3, poison:6},
};
Object.values(CARDS).forEach(c => { c.cls = c.cls || 'basic'; });   // クラスの指定がないカード = ベーシックカード

// ---- クラス ----
// ベーシック: どのクラスでも使える / クラスカード: そのクラス専用。クラスを(経験値MAXで)マスターすると、
// そのクラスカードは別クラスでも使えるようになる(ただし別クラスでは デッキに合計5枚まで)。
const CLASSES = {
  basic:     {name:'カードオタク',     short:'',     color:'#8a8fa0', desc:'ベーシックカードだけを つかう はじまりの クラス。'},
  gladiator: {name:'グラディエーター', short:'グラ', color:'#d8484e', desc:'つよい こうげきカードが たくさん。れんぞくぎり・ひっさつ！'},
  macho:     {name:'マッショ',         short:'マッ', color:'#e08a20', desc:'きょうかと ガードで ためて、バーストや はんげきで ドカン！'},
  doctor:    {name:'ドクトル',         short:'ドク', color:'#3fa860', desc:'かいふく・どく・きゅうけつ。たおれずに じわじわ しとめる。'},
};
const CLASS_ORDER = ['basic','gladiator','macho','doctor'];
const CLASS_MAX = 60;       // クラス経験値がこれに達するとマスター
const FOREIGN_MAX = 5;      // 別クラスのマスターカードをデッキに入れられる上限(合計)
const STARTER = {           // はじめてクラスチェンジしたときに ボックスへ入るカード
  gladiator:['gl_gladius','gl_chain','gl_lance','gl_cheer'],
  macho:    ['mc_protein','mc_burst','mc_hard','mc_counter'],
  doctor:   ['dc_elixir','dc_light','dc_scalpel','dc_odd'],
};
const DECK_SIZE = 15;   // デッキは常に15枚(入れ替えのみ)
const START_DECK = ['punch','punch','punch','kick','kick','swallow','fire',
                    'power','guard','guard','focus','heal','potion','potion','onigiri'];
const START_BOX = ['thunder','roar','wall'];   // カードボックスの初期カード
const TYPE = {
  atk:  {label:'こうげき', c:'#d8484e'},
  buff: {label:'きょうか', c:'#e08a20'},
  heal: {label:'かいふく', c:'#3fa860'},
  mix:  {label:'ゆうごう', c:'#9a5ad8'},
};
let cardUid = 0;
const mkCard = id => ({...CARDS[id], id, uid:++cardUid});

// ---- 融合 ----
// 同タイプ: 効果を足して×1.5(増幅)  /  別タイプ: 両方の効果が出るが×0.8(少し弱まる)
const AMT = ['heal','atkUp','guard','thorn','poison','regen','selfDmg'];  // 足して×k する効果(ダメージは別処理)
const RATIO = ['dmgPerAtk','dmgPerGuard','dmgFromHeal','drain'];            // 足すだけ(倍率なし)の効果
function fuseCards(a, b){
  const same = a.type === b.type;
  const k = same ? 1.5 : 0.8;
  const out = {name:a.pre+b.suf, type: same ? a.type : 'mix', fused:true, same, cls:'fused'};
  AMT.forEach(key => { const v = (a[key]||0)+(b[key]||0); out[key] = v ? Math.max(1, Math.round(v*k)) : 0; });
  // ダメージは「1発 × 回数」の合計で融合し、回数は多い方に合わせる(連続攻撃が極端に強くならないように)
  const ha = a.hits||1, hb = b.hits||1, total = (a.dmg||0)*ha + (b.dmg||0)*hb;
  out.hits = Math.max(ha, hb);
  out.dmg = total ? Math.max(1, Math.round(total*k/out.hits)) : 0;
  RATIO.forEach(key => { const v = (a[key]||0)+(b[key]||0); out[key] = key==='drain' ? Math.min(100, v) : v; });
  return out;
}
// 効果の文字列。short=true は小さなカード用の省略形
function effectTokens(c, short){
  const t = [], S = short, h = c.hits>1 ? '×'+c.hits : '';
  if (c.dmg)          t.push(S ? `ダメ${c.dmg}${h}` : `ダメージ ${c.dmg}${h}`);
  if (c.dmgPerAtk)    t.push(S ? `攻×${c.dmgPerAtk}` : `こうげきUP×${c.dmgPerAtk}の ダメージ`);
  if (c.dmgPerGuard)  t.push(S ? `ガ×${c.dmgPerGuard}` : `ガード×${c.dmgPerGuard}の ダメージ`);
  if (c.dmgFromHeal)  t.push(S ? '回=ダメ' : 'かいふくりょうぶん ダメージ');
  if (c.drain)        t.push(S ? `吸${c.drain}%` : `ダメージの ${c.drain}% きゅうしゅう`);
  if (c.poison)       t.push(S ? `毒${c.poison}` : `どく ${c.poison}`);
  if (c.atkUp)        t.push(S ? `攻+${c.atkUp}` : `こうげき +${c.atkUp}`);
  if (c.guard)        t.push(S ? `ガ${c.guard}` : `ガード ${c.guard}`);
  if (c.thorn)        t.push(S ? `反${c.thorn}` : `はんげき ${c.thorn}`);
  if (c.regen)        t.push(S ? `再${c.regen}` : `リジェネ ${c.regen}`);
  if (c.heal)         t.push(S ? `回${c.heal}` : `かいふく ${c.heal}`);
  if (c.selfDmg)      t.push(S ? `自-${c.selfDmg}` : `じぶんに ${c.selfDmg}ダメージ`);
  return t;
}
function wrapTokens(tokens, maxW){                    // 幅に収まるよう「 / 」でつないで折り返す
  const rows = []; let cur = '';
  for (const t of tokens) {
    const nxt = cur ? cur+' / '+t : t;
    if (cur && g.measureText(nxt).width > maxW) { rows.push(cur); cur = t; } else cur = nxt;
  }
  if (cur) rows.push(cur);
  return rows;
}
