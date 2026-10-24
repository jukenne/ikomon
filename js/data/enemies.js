// 敵のデータ(ステータス・描画関数)
const ENEMIES = [
  {id:'slime', name:'スライム',     hp:30, atk:6, def:0, exp:6,  money:30, draw:drawSlime},
  {id:'bat', name:'コウモリ',     hp:26, atk:7, def:0, exp:7,  money:36, draw:drawBat},
  {id:'shroom', name:'おばけきのこ', hp:46, atk:8, def:2, exp:10, money:52, draw:drawShroom},
];

// ===== ボス(固定戦闘) =====
// pattern: 行動の繰り返し。mult=攻撃力の倍率 / charge=ためるターン(攻撃しない) / name=技名
// phases: HPの割合がそれ以下になったとき一度だけ起きる演出(lines=セリフ, fn=強化など)。のちの魔王の仮面割れにも使う
const BOSSES = {
  furiten: {id:'furiten', name:'フリテン', hp:56, atk:6, def:1, exp:30, money:200, dropRate:1, draw:drawFuriten, scale:0.8, noFlee:true,
    intro:'フリテンが しょうぶを しかけてきた！',
    pattern:[{}, {charge:true, text:'フリテンは ちからを ためている…！'}, {mult:1.8, name:'ぜんりょくパンチ'}],
    phases:[{hp:0.5, lines:['ぐおおっ！ やるじゃねぇか！','ここからは ほんきだぜぇ！'], fn:e=>{ e.atk += 1; }}],
  },
};

// ボス シュレッダー(2章): 体力と防御力が高く、攻撃は弱いが、山札のカードを じわじわ こなごなにして
// 山札切れ(=敗北)を狙ってくる。ちいさなダメージは ほとんど通らない(防御×0.5ぶん引かれる)ので、
// 融合や きょうか(こうげきUP)・クラスカードで 大きなダメージを出して、山札が尽きる前に倒す。
BOSSES.shredder = {id:'shredder', name:'シュレッダー', hp:90, atk:4, def:8, exp:45, money:400, dropRate:1, draw:drawShredder, scale:0.85, noFlee:true,
  intro:'シュレッダーが ガガガ…と うごきだした！',
  pattern:[
    {name:'シュレッド',   mult:0.5, shred:1},
    {name:'かみくずだん', mult:1.0},
    {name:'ざつだんさい', mult:0,   shred:1},
  ],
  phases:[{hp:0.5, lines:['ガガガ…！ ヒトツ ノコラズ…ケス…！','シュレッダーの かいてんが はやくなった！'],
           fn:e=>{ e.pattern.forEach(p => { if (p.shred) p.shred += 1; }); }}],
};

// ===== 3章: 魔王城の門の前 — フリテン と セリカ を同時に相手にする =====
// 1ターンに それぞれが 1回ずつ行動する。どちらか一方を倒すと、のこった方が 激昂(enrage)して強くなる。
BOSSES.furiten_g = {id:'furiten', name:'フリテン', hp:72, atk:8, def:2, exp:60, money:300, dropRate:1, draw:drawFuriten, scale:0.8,
  pattern:[{name:'なぐる', mult:1.0}, {name:'ぶんなぐる', mult:1.2}, {name:'ぜんりょくパンチ', mult:1.6}],
  enrage:{lines:['セリカ…！？ てめぇら…ぜってぇ ゆるさねぇ！！'], after:['フリテンは いかりで ちからが あふれている！'],
          fn:e=>{ e.atk += 3; e.pattern = [{name:'ぜんりょくパンチ', mult:1.5}, {name:'ぶんなぐる', mult:1.3}]; }},
};
// セリカ: 眼鏡をかけた男の魔導士(参謀)。魔法が得意で、いつも「やれやれ」。丁寧語。
// 激昂(フリテンが倒れる / 自分のHPが半分): 筋肉がムキムキになって魔導士の服がはじけ飛び、物理攻撃が中心になる(口調も荒くなる)。
BOSSES.serika = {id:'serika', name:'セリカ', hp:50, atk:8, def:0, exp:60, money:300, dropRate:1, draw:drawSerika, scale:0.8,
  pattern:[{name:'マジックミサイル', mult:1.0}, {name:'サンダー', mult:1.3}, {name:'いやしの ひかり', mult:0, healAlly:14}],
  enrageHp:0.5,
  enrage:{
    lines:['…フリテン…？ …よくも…よくも フリテンを…！', 'ふざけんじゃ ねぇ…！ てめぇだけは ぶっころして やる！！'],
    linesSelf:['…ッ！ ここまで やるとは…！', 'もう いい…！ ぜんぶ ぶっこわして やる！！'],
    after:['セリカは ムキムキに なった！'],
    fn:e=>{ pop(e.x, 56, 'バリバリッ！', '#ffd966'); e.atk += 3; e.def += 2; e.pattern = [{name:'ぶっとびパンチ', mult:1.4}, {name:'ぼうりょくの ラリアット', mult:1.2}, {name:'きんにくバスター', mult:1.7}]; },
  },
};
// 複数の敵と同時に戦う組み合わせ。startBattle('castle_gate') のように呼ぶ
const BOSS_GROUPS = {
  castle_gate: {members:['furiten_g', 'serika'], noFlee:true,
    intro:'フリテンと セリカが ゆくてを ふさいだ！'},
};
