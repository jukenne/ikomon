// おかね(円)・アイテム・カードの画像データ・コンビニ
// 敵を倒すと: おかね(確定) + 確率で カードの がぞうデータ。
// がぞうデータは コンビニの コピーき(1まい 10えん・データを1つ消費)で プロキシ(=カード)にして カードボックスへ入る。
// がぞうデータは「いまのクラスのカード + ベーシックカード」からだけ ひろえる(別クラスのカードは出ない)。
const ITEMS = {
  monena: {id:'monena', name:'モンエナ', price:100, heal:30, desc:'HPを 30 かいふくする'},
};
const PROXY_PRICE = 10;
const dropPool = () => Object.keys(CARDS).filter(id => CARDS[id].cls === 'basic' || CARDS[id].cls === hero.cls);
const imageCount = () => Object.values(hero.images).reduce((a, b) => a + b, 0);

// マップ上で アイテムを使う(メニューの「どうぐ」から)。結果のメッセージを返す
function useItem(id){
  const it = ITEMS[id];
  if (!(hero.items[id] > 0)) return 'もっていない！';
  if (it.heal) {
    if (hero.hp >= hero.maxHp) return 'HPは もう まんたんだ！';
    const h = Math.min(it.heal, hero.maxHp - hero.hp);
    hero.hp += h; hero.items[id]--;
    return `${it.name}を のんだ！ HPが ${h} かいふくした！`;
  }
  return '';
}

// コンビニの店員(レジ)の台本。買い物のたびに選択肢を出し直す(「やめる」で終わり)
function conbiniScript(){
  const m = ITEMS.monena;
  return [{choice:{prompt:`いらっしゃいませー！ (しょじきん ${hero.money}えん)`, options:[
    {label:`${m.name}を かう (${m.price}えん)`, run:[{gen:() => {
      if (hero.money < m.price) return [{say:'てんいん', lines:['すみません、おかねが たりないようです…。']}, {gen:conbiniScript}];
      hero.money -= m.price; hero.items.monena = (hero.items.monena || 0) + 1;
      return [{say:'てんいん', lines:[`${m.name}、まいどありー！`]}, {say:'', lines:[`${m.name}を てにいれた！ (${hero.items.monena}こ もっている)`]}, {gen:conbiniScript}];
    }}]},
    {label:'コピーきの つかいかた', run:[
      {say:'てんいん', lines:['あそこの コピーきで、カードの がぞうデータから プロキシを つくれますよ。', '1まい 10えんで、がぞうデータを 1つ つかいます。', 'がぞうデータは、てきを たおすと たまに ひろえるみたいですね。']},
      {gen:conbiniScript},
    ]},
    {label:'やめる', cancel:true, run:[]},
  ]}}];
}
