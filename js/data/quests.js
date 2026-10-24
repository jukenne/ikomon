// クエスト(デュエル道場のクラス解放クエスト)と、章の目的の案内
// クエストの状態(hero.quests[id].state): none(未受注) → active(挑戦中) → done(達成・未報告) → cleared(報告ずみ=クラス解放)
const QUESTS = {
  gladiator: {id:'gladiator', type:'atk',  need:10, title:'グラディエーターの しれん'},
  macho:     {id:'macho',     type:'buff', need:10, title:'マッショの しれん'},
  doctor:    {id:'doctor',    type:'heal', need:10, title:'ドクトルの しれん'},
};
const QUEST_IDS = ['gladiator', 'macho', 'doctor'];
const questText = q => `${TYPE[q.type].label}カードを るいけい ${q.need}かい つかう`;
const classUnlocked = id => id === 'basic' || !!hero.unlocked[id];

function questAccept(id){ const q = hero.quests[id]; if (q.state === 'none') { q.state = 'active'; q.count = 0; } }
function questReport(id){
  const q = hero.quests[id];
  if (q.state !== 'done') return false;
  q.state = 'cleared'; hero.unlocked[id] = true; return true;
}

// カードを使うたびに呼ぶ。融合したときは、元の2枚それぞれのタイプで数える。達成したクエストのメッセージを返す
function recordCardUse(cards){
  const msgs = [];
  for (const c of cards) for (const id of QUEST_IDS) {
    const q = hero.quests[id], d = QUESTS[id];
    if (q.state === 'active' && c.type === d.type) {
      q.count++;
      if (q.count >= d.need) { q.count = d.need; q.state = 'done'; msgs.push(`クエスト「${d.title}」を たっせい！ どうじょうで ほうこくしよう！`); }
    }
  }
  return msgs;
}

// 道場の師範の台本を、いまの状況に合わせて作る(イベントの {gen: dojoScript} から呼ばれる)
function dojoScript(){
  const opts = [];
  for (const id of QUEST_IDS) {
    const q = hero.quests[id], d = QUESTS[id], cl = CLASSES[id].name;
    if (q.state === 'none') {
      opts.push({label:`${cl}の クエストを うける`, run:[
        {do:() => questAccept(id)},
        {say:'しはん', lines:[`よし。${cl}を めざすか。`, `しれんは「${questText(d)}」ことだ。`, 'ここで うけた ときから かぞえはじめる。しんちょくは メニューの「クエスト」で みられるぞ。']},
      ]});
    } else if (q.state === 'active') {
      opts.push({label:`${cl}の クエスト (${q.count}/${d.need})`, run:[
        {say:'しはん', lines:[`まだ たりんな。いまは ${q.count}/${d.need}かいだ。`, 'せんとうで カードを つかいこめ。']},
      ]});
    } else if (q.state === 'done') {
      opts.push({label:`${cl}の クエストを ほうこくする`, run:[
        {do:() => questReport(id)},
        {say:'しはん', lines:['みごとだ！ おまえの カードさばき、たしかに みとどけた。', `${cl}の クラスチェンジを みとめよう！`]},
        {say:'', lines:[`「${cl}」に クラスチェンジできるように なった！ (メニューの「クラスチェンジ」から)`]},
      ]});
    }
  }
  opts.push({label:'どうじょうについて きく', run:[
    {say:'しはん', lines:['ここは デュエルどうじょう。カードの みちを きわめる ものが あつまる ばしょだ。', 'クラスチェンジを したければ、クエストを クリアして、わしに みとめられねば ならん。', 'クエストは「あるタイプの カードを るいけい 10かい つかう」ことだ。']},
  ]});
  opts.push({label:'もどる', cancel:true, run:[]});
  return [{choice:{prompt:'しはん「なにを しに きた？」', options:opts}}];
}

// いまの目的(メニューの「クエスト」に出す)
function currentObjective(){
  const f = flagOn;
  if (!f('ch1_clear'))  return 'むらの ひとたちと はなして、ひがしの でぐちへ いこう';
  if (!f('ch2_start'))  return 'ひがしの みちを すすんで、まちを めざそう';
  if (!f('talked_mayor')) return 'まちの ちょうちょうに はなしを きこう';
  if (!f('ch2_clear'))  return 'まちの よこの ほらあなに いる シュレッダーを たおそう';
  if (!f('ch3_start'))  return 'ふねで ひがしの うみの はてへ…マオウ・アイランドを めざそう';
  if (!f('ch3_clear'))  return 'まおうじょうの もんの まえへ すすもう';
  if (!f('ch4_clear'))  return 'まおうじょうの おくへ。ぎょくざの まで 魔王が まっている';
  return 'いこモンの ものがたりは おしまい！ カードを あつめて、クラスを きわめよう';
}
