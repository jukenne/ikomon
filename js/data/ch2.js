// 第2章のデータ: カードの街・カードショップ・デュエル道場・ほらあな(シュレッダー)・うみ
// マップのタイル配列は gen_ch2.py で作って貼ってある(手で直してもよい)。台本の書き方は maps.js 冒頭を参照。
// 流れ: 街に着く → 町長に話を聞く → ほらあなのシュレッダーを倒す → 町長が船をくれる → うみへ
// ※街の名前は仮(ストーリー側が未決)。マップの name を変えれば表示も変わる。

const RESPAWN_TOWN = {map:'town', x:2, y:9, dir:'right', label:'まち'};

// ---- 町長 ----
const MAYOR_FIRST = [
  {say:'ちょうちょう', lines:[
    'おお、よく きてくれた。わしは この まちの ちょうちょうじゃ。',
    'この まちは むかしから カードの けんきゅうで さかえてきた。',
    'ところが さいきん、まちの よこの ほらあなに「シュレッダー」という ぶきみな ものが すみついての…',
    'まちの カードが つぎつぎと こなごなに されて おるのじゃ。']},
  {say:'いこあん', lines:['カードを…こなごなに！？ …そんなこと、ゆるせない。']},
  {say:'ちょうちょう', lines:[
    'おお、たのもしい！ ほらあなは まちの ひがしがわじゃ。どうか、たのむ。',
    'そうそう、まちには「デュエルどうじょう」も ある。クラスチェンジの しゅぎょうを したいなら、のぞいてみると よい。']},
  {set:'talked_mayor'},
];
const MAYOR_AFTER = [
  {face:'player', dir:'up'},
  {say:'ちょうちょう', lines:[
    'シュレッダーを たおして くれたのか…！ まちの カードたちも きっと よろこんで おる。',
    'おれいに、みなとに ふねを よういした。これで うみを こえて いくと よい。']},
  {say:'いこあん', lines:['ふね…！ ありがとう、ちょうちょう！']},
  {say:'ちょうちょう', lines:[
    'みなとは まちの みなみがわじゃ。うみの うえなら どこへでも いけるぞ。',
    'ひがしの うみの はてに「マオウ・アイランド」が あると いううわさじゃ。まおうと その なかまは、そこに おるらしい。','あの「ボス」とやらの ことは、わしらも しらべておこう。たびの ぶじを いのっておる。']},
  {set:'has_ship'},
  {say:'', lines:['ふねを てにいれた！ みなとから うみへ でられるように なった！','ひがしの うみの はてを めざそう！']},
];

// ---- シュレッダー戦 ----
const CH2_SHREDDER = [
  {face:'player', dir:'right'},
  // ベーシックのままだと ダメージが ほとんど通らない。クラスチェンジしてから いどむよう すすめる
  {gen:() => hero.cls !== 'basic' ? [] : [
    {say:'いこあん', lines:['…あの きかい、ボディが とても かたそうだ。','カードオタクの ままだと、ダメージが ほとんど とおらないかも…。']},
    {choice:{prompt:'どうする？', options:[
      {label:'このまま いどむ', run:[]},
      {label:'どうじょうで じゅんびを する', cancel:true, run:[{move:'player', path:[[19,7]]}, {end:true}]},
    ]}},
  ]},
  {say:'', lines:['ほらあなの おくに、おおきな きかいが ひかっている…。','カードの かみくずが やまのように つもっている！']},
  {say:'シュレッダー', lines:['ガガガ…。カード…ミツケタ…。','ヒトツ…ノコラズ…ケス…。 ガガガ…！']},
  {say:'いこあん', lines:['まちの カードは…ぼくが まもる！']},
  {battle:'shredder', onLose:[
    {say:'', lines:['いこあんは まちの いりぐちで めを さました…','おくから ガガガ…と ぶきみな おとが ひびいている。']},
  ]},
  {say:'シュレッダー', lines:['ガ…ガガ…。ナゼ…カードノ チカラ ヲ…','ワレラ ハ…ヒトツ ジャ ナイ…。','マオウサマ…ノ ノゾミ…ハ…']},
  {npc:'shredder', show:false},
  {say:'', lines:['シュレッダーは ガシャン、と とまり、うごかなくなった。']},
  {say:'？？？', lines:['（…たすかった。カードたちが よろこんでる…。）','（でも…「われらは ひとつじゃない」…。つぎの てきが ちかづいてる。）']},
  {set:'ch2_clear'},
  {heal:true},
  {chapter:'だい2しょう', sub:'カードの まち  おわり'},
  {warp:{map:'town', x:14, y:9, dir:'up'}},
  ...MAYOR_AFTER,
];

// ---- カードショップの店員(選択肢) ----
const CLERK_TALK = [
  {say:'てんいん', lines:['いらっしゃいませ！ カードショップへ ようこそ！','きょうは しんぱつの パックが はいってますよ！']},
  {choice:{prompt:'どうする？', options:[
    {label:'パックを かう', run:[
      {say:'いこあん', lines:['…ごめんなさい。ぼくは カードに おかねは はらわない ことに してるんだ。']},
      {say:'てんいん', lines:['えぇっ！？ カードショップで それは いきなり こまります！','…じゃあ、どうやって カードを てにいれるんですか？']},
      {say:'いこあん', lines:['カードの がぞうデータを さがして、コンビニの コピーきで プロキシを つくるんだ。','それが ぼくの スタイル。']},
      {say:'てんいん', lines:['（それ、うちの ししょうが きいたら ひっくりかえるな…）','あの…ひやかしは ごえんりょください…。']},
    ]},
    {label:'みているだけ', run:[{say:'てんいん', lines:['ごゆっくり どうぞ！','（…ぜったい かわない オーラが すごい）']}]},
    {label:'でていく', cancel:true, run:[]},
  ]}},
];

// 建物の かべ(4×3マス・ドアは1マス)を調べたときのセリフ
const wallSpots = (x0, y0, doorX, lines) => {
  const out = [];
  for (let dy=0; dy<3; dy++) for (let dx=0; dx<4; dx++) {
    const x = x0+dx, y = y0+dy;
    if (y === y0+2 && x === doorX) continue;
    out.push({x, y, run:[{say:'', lines}]});
  }
  return out;
};

Object.assign(MAPS, {
  // ------------------------------------------------------------------ カードの街
  town: {
    name:'カードの まち',
    respawn: RESPAWN_TOWN,
    tiles: [
      "TTTTTTTTTTTTTTTTTTTTTTTTTT",
      "T........................T",
      "T..PPPP...JJJJ...KKKK...FT",
      "TF.PPPP...JJJJ...KKKK.F..T",
      "T..PDPP...JDJJ...KDKK....T",
      "T..s=.....s=.....s=......T",
      "T.T.=......=......=....###",
      "T...=.T....=......=..T.###",
      "T...=......=....F.=....###",
      "=========================C",
      "T...........=F.F.......###",
      "T.......F...=.......F..###",
      "TFF....F.T..=.T........###",
      "T...........=............T",
      "T~~~~~~~~~~~p~~~~~~~~~~~~T",
      "T~~~~~~~~~~~p~~~~~~~~~~~~T",
      "T~~~~~~~~~~~p~~~~~~~~~~~~T",
      "T~~~~~~~~~~~~~~~~~~~~~~~~T"
],
    npcs:[
      {id:'mayor', x:14, y:8, color:'#8a5ac0', name:'ちょうちょう',
       lines:['…'],
       talk:[
         {when:'has_ship', lines:['ふねは みなとに とめて あるぞ。','まおうの しまは ひがしの うみの はてじゃ。きを つけて いっておいで。']},
         {when:'talked_mayor', lines:['ほらあなの シュレッダーを どうか よろしく たのむ…！','ほらあなは まちの ひがしの はずれじゃ。','あやつは とても かたい。どうじょうで うでを みがいてから いくと よいぞ。']},
         {run:MAYOR_FIRST},
       ]},
      {id:'proxyman', x:7, y:10, color:'#d08040', name:'まちの ひと',
       lines:['さっき コンビニの コピーきで プロキシを つくってきたんだ！','がぞうデータは ネットで ひろうんだぜ。ほんものは たかいからね…。','…あ、ないしょだよ？']},
      {id:'guard', x:22, y:8, color:'#4080a0', name:'もんばん',
       lines:['この さきが まちの よこの ほらあなだ。','さいきん ガガガ…と ぶきみな おとが ひびいてくる。','ちょうちょうに はなしは きいたかい？','シュレッダーは ボディが かたいらしい。デュエルどうじょうで クラスチェンジしてから いどむのが おすすめだぞ。']},
    ],
    spots:[
      // 建物の かべ(店や どうじょうの ようすを しらべたときのセリフ)
      ...wallSpots(3, 2, 4,  ['カードショップの かべだ。ショーウィンドウに レアカードが かざってある…。']),
      ...wallSpots(10, 2, 11, ['デュエルどうじょうの かべだ。なかから きあいの こえが きこえる…！']),
      ...wallSpots(17, 2, 18, ['コンビニの かべだ。のぼりが ゆれている。「プロキシ つくれます」と かいてある。']),
      // 看板
      {x:3, y:5, run:[{say:'', lines:['「カードショップ」と かいてある。']}]},
      {x:10, y:5, run:[{say:'', lines:['「デュエルどうじょう  きたれ、カードの みちを ゆく ものよ」と かいてある。']}]},
      {x:17, y:5, run:[{say:'', lines:['「コンビニ」と かいてある。','「プロキシ 1まい 10えん」「モンエナ あります」の はりがみが ある。']}]},
    ],
    triggers:[
      {x:0,  y:9, run:[{warp:{map:'field', x:22, y:8, dir:'left'}}]},
      {x:4,  y:4, run:[{warp:{map:'shop', x:5, y:6, dir:'up'}}]},
      {x:11, y:4, run:[{warp:{map:'dojo', x:5, y:6, dir:'up'}}]},
      {x:18, y:4, run:[{warp:{map:'conbini', x:5, y:6, dir:'up'}}]},
      {x:25, y:9, run:[
        {if:'talked_mayor',
         then:[{warp:{map:'cave', x:1, y:7, dir:'right'}}],
         else:[{say:'', lines:['ここが ほらあなの いりぐちか…。','いく まえに、まちの ちょうちょうに はなしを きいてみよう。']}, {move:'player', path:[[24,9]]}]},
      ]},
      {x:12, y:16, run:[
        {if:'has_ship',
         then:[{warp:{map:'sea', x:3, y:8, dir:'right'}}],
         else:[{say:'', lines:['ひろい うみだ。ふねが なければ わたれない…。']}, {move:'player', path:[[12,15]]}]},
      ]},
    ],
    // はじめて街に着いたとき
    onEnter:[
      {when:'!ch2_start', run:[
        {say:'', lines:['ひがしの みちを ぬけると、おおきな まちが みえてきた。']},
        {say:'いこあん', lines:['ここが…カードの まち！','カードの はってんに おおきく こうけんした まちだって、ゆうめいな ばしょだ。']},
        {say:'？？？', lines:['（…カードたちの こえが、たくさん きこえる…。みんな うれしそう…）']},
        {say:'', lines:['まずは まちの ひとたちに はなしを きいてみよう。','ヒント: メニュー(Tabキー)で「クエスト」を ひらくと、いまの もくてきが わかるよ。']},
        {set:'ch2_start'},
      ]},
    ],
  },

  // ------------------------------------------------------------------ カードショップ
  shop: {
    name:'カードショップ',
    respawn: RESPAWN_TOWN,
    tiles: [
      "wwwwwwwwww",
      "wkkkkkkkkw",
      "wffffffffw",
      "wtttftttfw",
      "wffffffffw",
      "wffffffffw",
      "wffffffffw",
      "wwwwwxwwww"
],
    npcs:[
      {id:'clerk', x:4, y:3, color:'#40a0a0', name:'てんいん', lines:['…'], talk:[{run:CLERK_TALK}]},
    ],
    triggers:[{x:5, y:7, run:[{warp:{map:'town', x:4, y:5, dir:'down'}}]}],
  },

  // ------------------------------------------------------------------ デュエル道場
  dojo: {
    name:'デュエルどうじょう',
    respawn: RESPAWN_TOWN,
    tiles: [
      "wwwwwwwwww",
      "wkffffffkw",
      "wffffffffw",
      "wfrrrrrrfw",
      "wfrrrrrrfw",
      "wffffffffw",
      "wffffffffw",
      "wwwwwxwwww"
],
    npcs:[
      {id:'sensei', x:5, y:2, color:'#a04030', name:'しはん', lines:['…'],
       talk:[
         {when:'!dojo_met', run:[
           {say:'しはん', lines:['ほう…あたらしい カードづかいか。わしは ここの しはんだ。', 'ここでは クエストを クリアした ものだけが、あたらしい クラスを なのれる。']},
           {set:'dojo_met'},
           {gen:()=>dojoScript()},
         ]},
         {run:[{gen:()=>dojoScript()}]},
       ]},
      {id:'student1', x:2, y:5, color:'#c0a040', name:'もんか', lines:['カードは つかいこむほど てに なじむ…って しはんが いってた。','おれは まだ ベーシックしか つかえないけど。']},
      {id:'student2', x:8, y:5, color:'#60a060', name:'もんか', lines:['クエストは せんとうで カードを つかうだけで すすむぞ。','…はやく クラスチェンジ したいなあ。']},
    ],
    triggers:[{x:5, y:7, run:[{warp:{map:'town', x:11, y:5, dir:'down'}}]}],
  },

  // ------------------------------------------------------------------ コンビニ
  // レジで モンエナ(HP回復)を買う / コピー機で がぞうデータ → プロキシ(カード)を作る
  conbini: {
    name:'コンビニ',
    respawn: RESPAWN_TOWN,
    tiles: [
      "wwwwwwwwww",
      "wkkkkffqfw",
      "wffffffffw",
      "wtttftttfw",
      "wffffffffw",
      "wkkffffkkw",
      "wffffffffw",
      "wwwwwxwwww"
],
    npcs:[
      {id:'cashier', x:4, y:3, color:'#e06080', name:'てんいん', lines:['…'], talk:[{run:[{gen:()=>conbiniScript()}]}]},
    ],
    spots:[
      {x:7, y:1, run:[{say:'', lines:['コピーきだ。カードの がぞうデータから プロキシを つくれる。(1まい 10えん)']}, {do:()=>openCopierScreen()}]},
    ],
    triggers:[{x:5, y:7, run:[{warp:{map:'town', x:18, y:5, dir:'down'}}]}],
  },

  // ------------------------------------------------------------------ ほらあな
  cave: {
    name:'ほらあな',
    respawn: RESPAWN_TOWN,
    encounters:['bat', 'shroom'],
    tiles: [
      "RRRRRRRRRRRRRRRRRRRRRRRR",
      "RRRRRRRRRRRRRccRRRRRRRRR",
      "RRRRRRRRRRRRRccRRRRRRRRR",
      "RRRRRRRRRRRvvvvvvRRRRRRR",
      "RRRRRRRRRRRvvvvvvRRRcccR",
      "RccccccRRRRvvvvvvRRRcccR",
      "RccccccRRRRvvvvvvRRRcccR",
      "cccccccccccvvvvvvccccccR",
      "RccccccRRRRvvvvvvRRRcccR",
      "RccccccRRRRvvvvvvRRRcccR",
      "RRRRRRRRRRRvvvvvvRRRcccR",
      "RRRRRRRRRRRvvvvvvRRRRRRR",
      "RRRRRRRRRRRRRRRRRRRRRRRR",
      "RRRRRRRRRRRRRRRRRRRRRRRR"
],
    npcs:[
      {id:'shredder', x:22, y:7, color:'#6a7080', name:'シュレッダー', scale:1.5, dir:'left', showWhen:'!ch2_clear', lines:['ガガガ…']},
    ],
    triggers:[
      {x:0, y:7, run:[{warp:{map:'town', x:24, y:9, dir:'left'}}]},
      {x:20, y:7, when:'!ch2_clear', run:CH2_SHREDDER},
    ],
    onEnter:[
      {when:'!ch2_cave_seen', run:[
        {say:'', lines:['くらい ほらあなだ。','おくの ほうから、ガガガ…と きかいの おとが ひびいてくる。']},
        {set:'ch2_cave_seen'},
      ]},
    ],
  },

  // ------------------------------------------------------------------ うみ(ふねで移動)
  sea: {
    name:'うみ',
    ship:true, noEncounter:true,
    respawn: RESPAWN_TOWN,
    tiles: [
      "oooooooooooooooooooooooo",
      "oooooooooooooooooooooooo",
      "oooooooooooooooooooooooo",
      "oooooooo###ooooooooooooo",
      "oooooooo###ooooooooooooo",
      "oooooooo###oooooooooo###",
      "ooooooooooooooooooooo###",
      "oooooooooooooooooooooBF#",
      "oppoooooooooooooooopppF#",
      "oooooooooooooooooooooBF#",
      "oooooooooooooo####ooo###",
      "oooooooooooooo####ooo###",
      "oooooooooooooo####oooooo",
      "oooooooooooooooooooooooo",
      "oooooooooooooooooooooooo",
      "oooooooooooooooooooooooo"
],
    npcs:[],
    triggers:[
      {x:1, y:8, run:[{warp:{map:'town', x:12, y:15, dir:'up'}}]},
      {x:21, y:8, run:[{warp:{map:'island', x:3, y:8, dir:'right'}}]},      // ひがしの はての しま(マオウ・アイランド・3章)。さんばしの りょうわきに ひかる とう(B)を おいて、いりぐちが わかるように
    ],
    onEnter:[
      {when:'!sea_seen', run:[
        {say:'', lines:['ふねに のって、うみに でた！','うみの うえを じゆうに すすめるように なった。']},
        {say:'？？？', lines:['（…ひがしの はての うみに、ふたつの あかるい ひかりが みえる。あれが しまの いりぐち…）']},
        {set:'sea_seen'},
      ]},
    ],
  },
});
