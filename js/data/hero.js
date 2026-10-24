// 主人公のデータ(ステータス・デッキ・ボックス・クラス)
// ---- 主人公・敵 ----
const hero = {name:'いこあん', lv:1, exp:0, hp:30, maxHp:30, atk:0, def:3, deck:START_DECK.slice(), box:START_BOX.slice(), fights:0, rewards:0,
              cls:'basic', classExp:{gladiator:0, macho:0, doctor:0}, mastered:{}, granted:{}, flags:{},
              quests:{gladiator:{state:'none', count:0}, macho:{state:'none', count:0}, doctor:{state:'none', count:0}}, unlocked:{},
              money:0, images:{}, items:{}};   // おかね(円) / カードの がぞうデータ{カードid:数} / どうぐ{id:数}
const expNeed = lv => lv*10 + (lv-1)*5;          // 次のレベルまでに必要な経験値
