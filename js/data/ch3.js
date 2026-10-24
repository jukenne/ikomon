// 第3章のデータ: マオウ・アイランド(魔王城の前)で、フリテンとセリカの2人と同時に戦う
// 流れ: 船で海を東へ → 島に上陸 → 魔王城の門の前でフリテンとセリカが立ちはだかる → 同時に戦闘 → 勝てば章クリア
// ※マオウ城の中は未実装(4章)。タイル配列は gen_ch3.py で作って貼ってある。

const RESPAWN_ISLAND = {map:'island', x:3, y:8, dir:'right', label:'しまの はまべ', wake:'いこあんは しまの はまべで めを さました…'};

// ---- 門の前の戦い ----
const CH3_GATE = [
  {face:'player', dir:'up'},
  {say:'', lines:['まおうじょうの もんの まえに、ふたつの かげが たちはだかっている…！']},
  {npc:'furiten', show:true, x:17, y:6, dir:'right'},
  {npc:'serika',  show:true, x:19, y:6, dir:'left'},
  {if:'!ch3_gate_seen',
   then:[
     {say:'フリテン', lines:['ようやく きやがったな、カードづかい！','ここから さきは、おれたちが ぜったいに とおさねぇ！']},
     {say:'セリカ', lines:['やれやれ…。まさか ほんとうに ここまで たどりつくとは おもいませんでした。','まおうさまの もとへは、だれ ひとり とおしません。']},
     {say:'フリテン', lines:['セリカ、めんどくせぇ！ ぜんぶ ぶっつぶせば いいだろ！']},
     {say:'セリカ', lines:['フリテン、あなたは すこし だまって いてください。…やれやれ、てがかかります。']},
     {say:'いこあん', lines:['どいて もらう…！ ぼくは、まおうに あわなくちゃ いけないんだ！']},
     {say:'？？？', lines:['（…ふたりの カードの こえが きこえる…。まっすぐで…とても かなしい こえ…）']},
     {set:'ch3_gate_seen'},
   ],
   else:[
     {say:'セリカ', lines:['また きたのですね。やれやれ…こりない かたです。']},
     {say:'フリテン', lines:['こんどこそ ぶっつぶす！']},
   ]},
  {battle:'castle_gate', onLose:[
    {say:'', lines:['いこあんは しまの はまべで めを さました…','しろの ほうから、ふたりの こえが きこえる。「…もういちど こい」']},
  ]},
  // ---- 勝利 ----
  {say:'セリカ', lines:['…そんな…。わたくしたちが…まけるなんて…。']},
  {say:'フリテン', lines:['ぐ…ぐぬぬ…。ボス…すまねぇ…。']},
  {npc:'furiten', show:false},
  {npc:'serika',  show:false},
  {say:'', lines:['ゴゴゴゴ…と おもい おとを たてて、まおうじょうの もんが ゆっくりと ひらいていく。']},
  {say:'まおう', lines:['…よく ここまで きたな。','まっているぞ。しろの おくで。']},
  {say:'いこあん', lines:['（この こえ…どこかで…？）']},
  {set:'ch3_clear'},
  {heal:true},
  {chapter:'だい3しょう', sub:'マオウ・アイランド  おわり'},
  {say:'', lines:['まおうじょうの もんが ひらいた！','(もんの おくへ すすもう。たたかいの じゅんびは いいかな？)']},
];

Object.assign(MAPS, {
  island: {
    name:'マオウ・アイランド',
    noEncounter:true,
    respawn: RESPAWN_ISLAND,
    tiles: [
      "~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~mmmmmmmmmmWWWWWWWWWm~~",
      "~~~mmmmmmYmmmmWWWWWWWWWm~~",
      "~~mmmYmmmmmmmmWWWWWWWWWmm~",
      "~~mmmmmmmmmmmmWWWWWWWWWmm~",
      "~~mmmmmmmmYmmmWWWWgWWWWmm~",
      "~~mmmmYmmmmmmmmmmm=mmmmmm~",
      "~~mmmmmmmmmmmmmmmm=mmmmmm~",
      "~pp================mmmYmm~",
      "~~mmmmmmmmmmmmYmmmmmmmmmm~",
      "~~mmmmmmmmmmmmmmmmmmYmmmm~",
      "~~mmYmmmmmmmYmmmmmmmmmmmm~",
      "~~mmmmmYmmmmmmmmYmmmmYmmm~",
      "~~mmmmmmmmmmmmmmmmmmmmmm~~",
      "~~~mmmmmmmmmmmmmmmmmmmm~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~"
],
    npcs:[
      {id:'furiten', x:17, y:6, color:'#c0502a', name:'フリテン', visible:false, scale:1.4, dir:'right', lines:['…']},
      {id:'serika',  x:19, y:6, color:'#7a4ab0', name:'セリカ',   visible:false, dir:'left',  lines:['…']},
    ],
    spots:[
      {x:18, y:5, run:[{say:'', lines:['まおうじょうの もんだ。…', 'もんの おくは まだ くらい。']}]},
    ],
    triggers:[
      // はまべ(さんばし)から ふねで うみへ もどる
      {x:1, y:8, run:[{warp:{map:'sea', x:19, y:8, dir:'left'}}]},
      // もんの まえで フリテンと セリカが たちはだかる
      {x:18, y:7, when:'!ch3_clear', run:CH3_GATE},
      // もんの なか(だい4しょう: data/ch4.js)
      {x:18, y:5, when:['ch3_clear','!ch4_clear'], run:[{warp:{map:'castle_hall', x:8, y:10, dir:'up'}}]},
      {x:18, y:5, when:'ch4_clear', run:[
        {say:'', lines:['あの さかさまの しろは、あとかたもなく きえている。','そらは、どこまでも すんでいた。']},
        {move:'player', path:[[18,6]]},
      ]},
    ],
    onEnter:[
      {when:'!ch3_start', run:[
        {say:'', lines:['ふねは ついに「マオウ・アイランド」に たどりついた。','そらは くらく、ふきつな くうきが ただよっている。']},
        {say:'いこあん', lines:['ここが…まおうの しま。','おくに そびえている あれが…まおうじょうか。']},
        {say:'？？？', lines:['（…きをつけて。とても つよい カードの けはいが する…！）']},
        {set:'ch3_start'},
      ]},
    ],
  },
});
