// 第4章のデータ: 魔王城の中(城門ホール → 回廊 → 玉座の間)と、ラスボス戦のイベント
// 流れ: 島の城門から入る → ホール(だれもいない) → 回廊(壁画・光の台でHP回復) → 玉座の間
//       → 魔王が逆さの城を呼ぶ → 魔王戦(js/battle/final.js) → エンディング → 村にもどる
// ラスボス戦のセリフは data/final.js の FINAL_TEXT。ここでは実行時(gen)に読み出す(ファイルの読み込み順の都合)。
// ※フリテンとセリカは3章の戦闘で倒れた(死んだ)ことにして、城の中には配置しない。ゲーム内で説明はしない(プレイヤーが察する)。

const RESPAWN_THRONE = {map:'castle_throne', x:7, y:10, dir:'up', label:'ぎょくざの まの いりぐち', wake:'いこあんは ぎょくざの まの いりぐちで めを さました…'};

// ---- 玉座の間: 魔王が逆さの城を呼び、戦いが始まる ----
const CH4_THRONE = [
  {gen: () => {
    const T = FINAL_TEXT, first = !flagOn('ch4_throne_seen');
    const intro = first
      ? [{say:'', lines:['ぎょくざの まえに、ひとつの かげが たっている。','フードを ふかく かぶり、しろい かめんで かおを かくしている。']},
         {move:'player', path:[[7,6],[7,5]]},
         {say:'魔王', lines:T.summon[0].lines}]
      : [{move:'player', path:[[7,6],[7,5]]},
         {say:'魔王', lines:['…また きたか。いいだろう。','もういちど、わたしの ちからを みせてやる。']}];
    return [
      ...intro,
      ...(first ? [{scene:{art:'scenes/abyss_zenith.png', fx:'abyss', name:'魔王', lines:[...T.summon[1].lines, ...T.summon[2].lines, ...T.summon[3].lines]}}] : []),
      {set:'ch4_throne_seen'},
      {battle:'maou', onLose:[
        {say:'', lines:['いこあんは ぎょくざの まえで たおれた…。','さかさまの しろは、すこしずつ おちてくる。']},
      ]},
      // ---- 勝利: エンディング ----
      {set:'ch4_clear'},
      ...T.endingMaou.map(s => ({scene:s})),
      {npc:'maou', show:false},
      {heal:true},
      ...T.endingIkoan.map(s => ({scene:s})),
      {chapter:'いこモン', sub:'おしまい — あそんでくれて ありがとう！'},
      {warp:{map:'village', x:4, y:5, dir:'down'}},
      {say:'', lines:['ひかりに みちた そらの した、いこあんは むらに もどってきた。','(これで「いこモン」は おしまい。あつめた カードで、これからも あそびつづけよう！)']},
    ];
  }},
];

// ---- 回廊の壁画(カードと人の昔話) ----
const mural = (x, y, title, lines) => ({x, y, run:[{say:'', lines:[`へきが「${title}」`, ...lines]}]});
const LIGHT_ALTAR = [{say:'', lines:['ひかりの カードが、やさしく かがやいている。','あたたかい ひかりに つつまれて、HPが ぜんかいふくした！']}, {heal:true}, {save:true}];

Object.assign(MAPS, {
  castle_hall: {
    name:'まおうじょう  ホール',
    noEncounter:true,
    respawn: RESPAWN_THRONE,
    tiles: [
      "WWWWWWWWAWWWWWWWW",
      "WaaaaaaaAaaaaaaaW",
      "WaiaaaaaAaaaaaiaW",
      "WaaaaaaaAaaaaaaaW",
      "WaiaaaaaAaaaaaiaW",
      "WaaaaaaaAaaaaaaaW",
      "WaiaaaaaAaaaaaiaW",
      "WaaaaaaaAaaaaaaaW",
      "WaiaaaaaAaaaaaiaW",
      "WaaaaaaaAaaaaaaaW",
      "WaaaaaaaAaaaaaaaW",
      "WWWWWWWWAWWWWWWWW"
    ],
    npcs:[],
    spots:[],
    triggers:[
      {x:8, y:11, run:[{warp:{map:'island', x:18, y:6, dir:'down'}}]},
      {x:8, y:0,  run:[{warp:{map:'castle_gallery', x:6, y:11, dir:'up'}}]},
    ],
    onEnter:[
      {when:'!ch4_start', run:[
        {chapter:'だい4しょう', sub:'さかさまの しろ'},
        {say:'', lines:['まおうじょうの なかは、しずまりかえっている。','たかい てんじょうから、つめたい ひかりが さしこんでいた。']},
        {say:'？？？', lines:['（…この さきに、あの こえの もちぬしが いる…）','（ぎゅっと カードを にぎって。…だいじょうぶ、わたしが ついています）','（おくの かいろうに、ひかりの だいが あるはず。たたかいの まえに よって いきましょう）']},
        {set:'ch4_start'},
      ]},
    ],
  },

  castle_gallery: {
    name:'まおうじょう  かいろう',
    noEncounter:true,
    respawn: RESPAWN_THRONE,
    tiles: [
      "WWWWWWAWWWWWW",
      "WalaaaAaaalaW",
      "WaaaaaAaaaaaW",
      "NaiaaaAaaaiaN",
      "WaaaaaAaaaaaW",
      "WaaaaaAaaaaaW",
      "NaiaaaAaaaiaN",
      "WaaaaaAaaaaaW",
      "WaaaaaAaaaaaW",
      "NaiaaaAaaaiaN",
      "WaaaaaAaaaaaW",
      "WaaaaaAaaaaaW",
      "WWWWWWAWWWWWW"
    ],
    npcs:[],
    spots:[
      {x:2,  y:1, run:LIGHT_ALTAR},
      {x:10, y:1, run:LIGHT_ALTAR},
      mural(0, 3,  'はじまりの ひ', ['むかし、カードは ただの かみきれだった。','ひとは カードで あそび、わらい、ときには けんかを した。']),
      mural(12, 3, 'せいれいの たんじょう', ['ひとの おもいが カードに やどる とき、カードの なかに ちいさな せいれいが うまれた。']),
      mural(0, 6,  'ふたつの ともだち', ['せいれいは ひとの こえを きき、ひとは せいれいの こえを きいた。','ふたつは ずっと ともだち だった。']),
      mural(12, 6, 'くらい ひ', ['そのあとの えは、くろく ぬりつぶされている。','…ぬりつぶした ひとの、ふるえる ゆびあとが のこっている。']),
      mural(0, 9,  'めがねの ひと', ['ひとりの ひとが、ひざを ついて ないている。','めがねの おくの ひとみは、あかく はれている…。']),
      mural(12, 9, 'さいごの いちまい', ['さいごの いちまいだけ、なにも かかれて いない。','わくだけが、しずかに ひかっている。']),
    ],
    triggers:[
      {x:6, y:12, run:[{warp:{map:'castle_hall', x:8, y:1, dir:'down'}}]},
      {x:6, y:0,  run:[{warp:{map:'castle_throne', x:7, y:10, dir:'up'}}]},
      {x:6, y:6, when:'!ch4_gallery', run:[
        {say:'？？？', lines:['（…ここから さきは、あなたの こえを わたしが きいています）','（どんな けつまつが まっていても…カードを しんじて）']},
        {set:'ch4_gallery'},
      ]},
    ],
  },

  castle_throne: {
    name:'まおうじょう  ぎょくざの ま',
    noEncounter:true,
    respawn: RESPAWN_THRONE,
    tiles: [
      "WWWWWWWWWWWWWWW",
      "WaaaaaaeaaaaaaW",
      "WaiaaaaAaaaaiaW",
      "WaaaaaaAaaaaaaW",
      "WaaaaaaAaaaaaaW",
      "WaiaaaaAaaaaiaW",
      "WaaaaaaAaaaaaaW",
      "WaaaaaaAaaaaaaW",
      "WaiaaaaAaaaaiaW",
      "WaaaaaaAaaaaaaW",
      "WaaaaaaAaaaaaaW",
      "WWWWWWWAWWWWWWW"
    ],
    npcs:[
      {id:'maou', x:7, y:3, color:'#2a2244', name:'魔王', scale:1.3, dir:'down', lines:['…']},
    ],
    spots:[],
    triggers:[
      {x:7, y:11, run:[{warp:{map:'castle_gallery', x:6, y:1, dir:'down'}}]},
      {x:7, y:7, when:'!ch4_clear', run:CH4_THRONE},
    ],
  },
});
