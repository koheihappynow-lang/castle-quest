// 文章問題・しつもん・はんたいことば・アルファベットのデータ

// カテゴリごとの例文（___ に単語が入る）
export const TEMPLATES = {
  animal: ['I see the ___.', 'Look at the ___!'],
  food: ['I want the ___.', 'This is my ___.'],
  vehicle: ['Look at the ___!', 'I ride the ___.'],
  home: ['This is my ___.'],
  clothes: ['This is my ___.'],
  play: ['Look at my ___!'],
  nature: ['Look at the ___!'],
  weather: ['Look at the ___!'],
  town: ["Let's go to the ___."],
  place: ["Let's go to the ___."],
  school: ['This is my ___.'],
  body: ['This is my ___.'],
  people: ['This is my ___.'],
  fantasy: ['Look at the ___!'],
  color: ['It is ___.'],
  feeling: ['I am ___.'],
  action: ['I can ___.'],
  describe: ['It is ___.'],
  season: ['I like ___.'],
  shape: ['Draw a ___.'],
};
// 例文の日本語（画面の説明用）
export const TEMPLATE_JA = {
  'I see the ___.': '〜が みえるよ', 'Look at the ___!': '〜を みて！', 'I want the ___.': '〜が ほしい', 'This is my ___.': 'これは わたしの 〜',
  'I ride the ___.': '〜に のるよ', 'Look at my ___!': 'わたしの 〜を みて！', "Let's go to the ___.": '〜へ いこう', 'It is ___.': 'それは 〜',
  'I am ___.': 'わたしは 〜', 'I can ___.': 'わたしは 〜できる', 'I like ___.': '〜が すき', 'Draw a ___.': '〜を かいて',
};

// しつもんに こたえる問題（answer と distractors は単語のID）
export const QA = [
  { q: 'What color is the sky?', ja: 'そらは なにいろ？', a: 'color:blue', d: ['color:red', 'color:green', 'color:yellow'], lv: 1 },
  { q: 'What color is a banana?', ja: 'バナナは なにいろ？', a: 'color:yellow', d: ['color:blue', 'color:purple', 'color:black'], lv: 1 },
  { q: 'What color is a leaf?', ja: 'はっぱは なにいろ？', a: 'color:green', d: ['color:blue', 'color:pink', 'color:white'], lv: 1 },
  { q: 'What color is a strawberry?', ja: 'いちごは なにいろ？', a: 'color:red', d: ['color:blue', 'color:gray', 'color:purple'], lv: 1 },
  { q: 'What color is snow?', ja: 'ゆきは なにいろ？', a: 'color:white', d: ['color:red', 'color:green', 'color:orange'], lv: 1 },
  { q: 'What color is an eggplant?', ja: 'なすは なにいろ？', a: 'color:purple', d: ['color:yellow', 'color:red', 'color:white'], lv: 2 },
  { q: 'What color is chocolate?', ja: 'チョコレートは なにいろ？', a: 'color:brown', d: ['color:blue', 'color:green', 'color:pink'], lv: 2 },
  { q: 'What color is a carrot?', ja: 'にんじんは なにいろ？', a: 'color:orange', d: ['color:blue', 'color:pink', 'color:black'], lv: 2 },
  { q: 'Which animal says "moo"?', ja: '「モー」と なく どうぶつは？', a: 'animal:cow', d: ['animal:dog', 'animal:cat', 'animal:duck'], lv: 1 },
  { q: 'Which animal says "woof"?', ja: '「ワン」と なく どうぶつは？', a: 'animal:dog', d: ['animal:cow', 'animal:pig', 'animal:sheep'], lv: 1 },
  { q: 'Which animal says "meow"?', ja: '「ニャー」と なく どうぶつは？', a: 'animal:cat', d: ['animal:cow', 'animal:duck', 'animal:horse'], lv: 1 },
  { q: 'Which animal says "oink"?', ja: '「ブーブー」と なく どうぶつは？', a: 'animal:pig', d: ['animal:cat', 'animal:dog', 'animal:bird'], lv: 1 },
  { q: 'Which animal says "quack"?', ja: '「ガーガー」と なく どうぶつは？', a: 'animal:duck', d: ['animal:cow', 'animal:pig', 'animal:cat'], lv: 1 },
  { q: 'Which animal says "baa"?', ja: '「メェー」と なく どうぶつは？', a: 'animal:sheep', d: ['animal:dog', 'animal:duck', 'animal:pig'], lv: 2 },
  { q: 'Which animal has a long neck?', ja: 'くびが ながい どうぶつは？', a: 'animal:giraffe', d: ['animal:pig', 'animal:rabbit', 'animal:frog'], lv: 1 },
  { q: 'Which animal has a long nose?', ja: 'はなが ながい どうぶつは？', a: 'animal:elephant', d: ['animal:cat', 'animal:duck', 'animal:mouse'], lv: 1 },
  { q: 'Which animal can hop and has long ears?', ja: 'ぴょんぴょん はねて、みみが ながい どうぶつは？', a: 'animal:rabbit', d: ['animal:cow', 'animal:fish', 'animal:chicken'], lv: 2 },
  { q: 'Which animal lives in the water?', ja: 'みずの なかに すむ どうぶつは？', a: 'animal:fish', d: ['animal:dog', 'animal:cow', 'animal:horse'], lv: 1 },
  { q: 'Which animal can fly?', ja: 'そらを とべる どうぶつは？', a: 'animal:bird', d: ['animal:dog', 'animal:pig', 'animal:cow'], lv: 1 },
  { q: 'What do you drink?', ja: 'のむ ものは どれ？', a: 'food:milk', d: ['food:bread', 'food:rice', 'food:cookie'], lv: 1 },
  { q: 'What do you wear on your head?', ja: 'あたまに かぶる ものは？', a: 'clothes:hat', d: ['clothes:shoes', 'clothes:T-shirt', 'clothes:gloves'], lv: 2 },
  { q: 'What do you wear on your feet?', ja: 'あしに はく ものは？', a: 'clothes:shoes', d: ['clothes:hat', 'clothes:T-shirt', 'clothes:gloves'], lv: 2 },
  { q: 'What do you use to write?', ja: 'じを かく ときに つかう ものは？', a: 'home:pencil', d: ['home:spoon', 'home:cup', 'play:ball'], lv: 2 },
  { q: 'What do you use to cut paper?', ja: 'かみを きる ときに つかう ものは？', a: 'home:scissors', d: ['home:spoon', 'home:cup', 'play:ball'], lv: 2 },
  { q: 'What do you use to eat soup?', ja: 'スープを のむ ときに つかう ものは？', a: 'home:spoon', d: ['home:scissors', 'home:key', 'home:pencil'], lv: 2 },
  { q: 'What do you read?', ja: 'よむ ものは どれ？', a: 'home:book', d: ['play:ball', 'home:cup', 'home:chair'], lv: 1 },
  { q: 'What do you sleep in?', ja: 'ねる ときに つかう ものは？', a: 'home:bed', d: ['home:chair', 'home:door', 'home:cup'], lv: 1 },
  { q: 'What tells you the time?', ja: 'じかんを おしえて くれる ものは？', a: 'home:clock', d: ['home:book', 'home:key', 'home:cup'], lv: 2 },
  { q: 'What do you use when it rains?', ja: 'あめの ひに つかう ものは？', a: 'clothes:umbrella', d: ['clothes:sunglasses', 'play:ball', 'clothes:crown'], lv: 2 },
  { q: 'What is white and falls in winter?', ja: 'ふゆに ふってくる しろい ものは？', a: 'weather:snow', d: ['weather:sun', 'weather:rainbow', 'nature:fire'], lv: 2 },
  { q: 'What is hot and in the sky in the day?', ja: 'ひるの そらに ある あつい ものは？', a: 'weather:sun', d: ['weather:moon', 'weather:star', 'weather:snow'], lv: 1 },
  { q: 'What can you see in the sky at night?', ja: 'よるの そらに みえる ものは？', a: 'weather:moon', d: ['weather:sun', 'weather:rainbow', 'nature:flower'], lv: 1 },
  { q: 'What do bees make?', ja: 'みつばちが つくる ものは？', a: 'food:honey', d: ['food:milk', 'food:bread', 'food:cheese'], lv: 3 },
  { q: 'What do cows give us?', ja: 'うしが くれる ものは？', a: 'food:milk', d: ['food:honey', 'food:egg', 'food:bread'], lv: 2 },
  { q: 'What do chickens lay?', ja: 'にわとりが うむ ものは？', a: 'food:egg', d: ['food:milk', 'food:honey', 'food:cake'], lv: 2 },
  { q: 'What goes on the water?', ja: 'みずの うえを すすむ ものは？', a: 'vehicle:ship', d: ['vehicle:car', 'vehicle:bus', 'vehicle:train'], lv: 1 },
  { q: 'What flies in the sky?', ja: 'そらを とぶ のりものは？', a: 'vehicle:airplane', d: ['vehicle:car', 'vehicle:bus', 'vehicle:ship'], lv: 1 },
  { q: 'What do you ride with pedals?', ja: 'ペダルを こいで のる ものは？', a: 'vehicle:bike', d: ['vehicle:car', 'vehicle:ship', 'vehicle:bus'], lv: 2 },
  { q: 'Where can you see many animals?', ja: 'たくさんの どうぶつを みられる ところは？', a: 'place:zoo', d: ['place:library', 'place:kitchen', 'place:station'], lv: 2 },
  { q: 'Where can you borrow books?', ja: 'ほんを かりられる ところは？', a: 'place:library', d: ['place:zoo', 'place:park', 'place:station'], lv: 3 },
  { q: 'Where do trains stop?', ja: 'でんしゃが とまる ところは？', a: 'place:station', d: ['place:zoo', 'place:library', 'place:beach'], lv: 3 },
  { q: 'Where do airplanes take off?', ja: 'ひこうきが とびたつ ところは？', a: 'place:airport', d: ['place:station', 'place:park', 'place:zoo'], lv: 3 },
  { q: 'What do you say in the morning?', ja: 'あさに いう ことばは？', a: 'phrase:good morning', d: ['phrase:good night', 'phrase:goodbye', 'phrase:sorry'], lv: 2 },
  { q: 'What do you say when you get a present?', ja: 'プレゼントを もらったら なんて いう？', a: 'phrase:thank you', d: ['phrase:sorry', 'phrase:goodbye', 'phrase:good night'], lv: 2 },
  { q: 'What do you say when you meet a friend?', ja: 'ともだちに あったら なんて いう？', a: 'phrase:hello', d: ['phrase:goodbye', 'phrase:good night', 'phrase:sorry'], lv: 2 },
  { q: 'What do you say at bedtime?', ja: 'ねる まえに いう ことばは？', a: 'phrase:good night', d: ['phrase:good morning', 'phrase:hello', 'phrase:thank you'], lv: 2 },
  { q: 'What do you say when you make a mistake?', ja: 'まちがえて しまったら なんて いう？', a: 'phrase:sorry', d: ['phrase:thank you', 'phrase:hello', 'phrase:good morning'], lv: 3 },
  { q: 'How many legs does a dog have?', ja: 'いぬの あしは なんぼん？', a: 'number:four', d: ['number:two', 'number:six', 'number:eight'], lv: 2 },
  { q: 'How many legs does a bird have?', ja: 'とりの あしは なんぼん？', a: 'number:two', d: ['number:four', 'number:six', 'number:ten'], lv: 2 },
  { q: 'How many legs does a spider have?', ja: 'くもの あしは なんぼん？', a: 'number:eight', d: ['number:four', 'number:six', 'number:ten'], lv: 3 },
  { q: 'How many days are in a week?', ja: '1しゅうかんは なんにち？', a: 'number:seven', d: ['number:five', 'number:ten', 'number:twelve'], lv: 3 },
  { q: 'What day comes after Monday?', ja: 'げつようびの つぎは なんようび？', a: 'time:Tuesday', d: ['time:Sunday', 'time:Friday', 'time:Saturday'], lv: 3 },
  { q: 'Which season is hot?', ja: 'あつい きせつは どれ？', a: 'season:summer', d: ['season:winter', 'season:spring', 'season:fall'], lv: 3 },
  { q: 'Which season has snow?', ja: 'ゆきが ふる きせつは どれ？', a: 'season:winter', d: ['season:summer', 'season:spring', 'season:fall'], lv: 3 },
];

// はんたいことば
export const OPPOSITES = [
  ['describe:big', 'describe:small'], ['describe:long', 'describe:short'], ['describe:new', 'describe:old'],
  ['describe:fast', 'describe:slow'], ['describe:good', 'describe:bad'], ['describe:strong', 'describe:weak'],
  ['describe:heavy', 'describe:light'], ['describe:dark', 'describe:bright'], ['describe:easy', 'describe:difficult'],
  ['describe:loud', 'describe:quiet'], ['describe:high', 'describe:low'], ['describe:soft', 'describe:hard'],
  ['describe:warm', 'describe:cool'], ['feeling:hot', 'feeling:cold'], ['feeling:happy', 'feeling:sad'],
  ['action:open', 'action:close'], ['action:go', 'action:come'], ['action:push', 'action:pull'],
  ['action:start', 'action:finish'], ['action:sit', 'action:stand'], ['phrase:yes', 'phrase:no'],
  ['time:morning', 'time:night'], ['phrase:hello', 'phrase:goodbye'], ['time:yesterday', 'time:tomorrow'],
  ['describe:sweet', 'describe:bitter'],
];

// アルファベット（よみかた）
export const LETTER_JA = {
  A: 'エー', B: 'ビー', C: 'シー', D: 'ディー', E: 'イー', F: 'エフ', G: 'ジー', H: 'エイチ', I: 'アイ', J: 'ジェー', K: 'ケー', L: 'エル', M: 'エム',
  N: 'エヌ', O: 'オー', P: 'ピー', Q: 'キュー', R: 'アール', S: 'エス', T: 'ティー', U: 'ユー', V: 'ブイ', W: 'ダブリュー', X: 'エックス', Y: 'ワイ', Z: 'ゼット',
};
// まちがえやすい形どうし
export const LOOKALIKE = ['bdpq', 'mnwu', 'ijlt', 'ceoa', 'gqy', 'hnr', 'vwy', 'sz', 'ft', 'kx'];

// かずの文章問題で使うもの（絵文字・単数・複数）
export const COUNT_THINGS = [
  ['🍎', 'apple', 'apples'], ['🍪', 'cookie', 'cookies'], ['🎈', 'balloon', 'balloons'], ['⭐', 'star', 'stars'],
  ['🚗', 'car', 'cars'], ['🐱', 'cat', 'cats'], ['🐶', 'dog', 'dogs'], ['🍓', 'strawberry', 'strawberries'], ['🐟', 'fish', 'fish'],
];
