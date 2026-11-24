// 🌑 かげ あて の なかま（やく 110しゅるい）
// id：絵の ファイル名（cards/shadow/<id>.png があれば 絵、なければ 絵文字）、e：絵文字、n：よびかた、m：うごきかた
// m：hop＝はねる、stomp＝のしのし、drive＝はしっていく、fly＝とんでいく、swim＝およぐ、spin＝くるっと まわる
export const SHADOW_CATS = { animal: 'どうぶつ', bird: 'とり', bug: 'むし', sea: 'うみの いきもの', ride: 'のりもの', dino: 'きょうりゅう', food: 'たべもの', thing: 'もの' };
const T = (cat, m, rows) => rows.map(([id, e, n]) => ({ id, e, n, cat, m }));
export const SHADOW_ITEMS = [
  ...T('animal', 'stomp', [
    ['dog', '🐕', 'いぬ'], ['cat', '🐈', 'ねこ'], ['elephant', '🐘', 'ぞう'], ['giraffe', '🦒', 'きりん'], ['horse', '🐎', 'うま'],
    ['cow', '🐄', 'うし'], ['pig', '🐖', 'ぶた'], ['sheep', '🐑', 'ひつじ'], ['goat', '🐐', 'やぎ'], ['camel', '🐪', 'らくだ'],
    ['monkey', '🐒', 'さる'], ['gorilla', '🦍', 'ゴリラ'], ['zebra', '🦓', 'しまうま'], ['rhino', '🦏', 'サイ'], ['hippo', '🦛', 'カバ'],
    ['crocodile', '🐊', 'ワニ'], ['turtle', '🐢', 'かめ'], ['lizard', '🦎', 'とかげ'], ['snake', '🐍', 'へび'], ['deer', '🦌', 'しか'],
    ['mouse', '🐁', 'ねずみ'], ['sloth', '🦥', 'なまけもの'], ['otter', '🦦', 'カワウソ'], ['leopard', '🐆', 'ひょう'], ['tiger', '🐅', 'とら'],
    ['llama', '🦙', 'アルパカ'], ['bison', '🦬', 'バイソン'], ['poodle', '🐩', 'プードル'], ['hedgehog', '🦔', 'はりねずみ'], ['skunk', '🦨', 'スカンク'],
    ['lion', '🦁', 'ライオン'], ['bear', '🐻', 'くま'], ['panda', '🐼', 'パンダ'], ['koala', '🐨', 'コアラ'], ['fox', '🦊', 'きつね'],
  ]),
  ...T('animal', 'hop', [['rabbit', '🐇', 'うさぎ'], ['kangaroo', '🦘', 'カンガルー'], ['squirrel', '🐿️', 'りす'], ['frog', '🐸', 'かえる'], ['chicken', '🐓', 'にわとり']]),
  ...T('bird', 'fly', [
    ['eagle', '🦅', 'わし'], ['duck', '🦆', 'あひる'], ['owl', '🦉', 'ふくろう'], ['dove', '🕊️', 'はと'], ['swan', '🦢', 'はくちょう'],
    ['parrot', '🦜', 'オウム'], ['peacock', '🦚', 'くじゃく'], ['bird', '🐦', 'ことり'], ['bat', '🦇', 'こうもり'],
  ]),
  ...T('bird', 'hop', [['penguin', '🐧', 'ペンギン'], ['flamingo', '🦩', 'フラミンゴ'], ['chick', '🐤', 'ひよこ']]),
  ...T('bug', 'fly', [['butterfly', '🦋', 'ちょうちょ'], ['bee', '🐝', 'はち'], ['ladybug', '🐞', 'てんとうむし'], ['fly', '🪰', 'はえ']]),
  ...T('bug', 'stomp', [['ant', '🐜', 'あり'], ['snail', '🐌', 'かたつむり'], ['cricket', '🦗', 'こおろぎ'], ['spider', '🕷️', 'くも'], ['scorpion', '🦂', 'さそり'], ['caterpillar', '🐛', 'いもむし'], ['beetle', '🪲', 'かぶとむし']]),
  ...T('sea', 'swim', [
    ['whale', '🐳', 'くじら'], ['dolphin', '🐬', 'いるか'], ['shark', '🦈', 'さめ'], ['octopus', '🐙', 'たこ'], ['squid', '🦑', 'いか'],
    ['crab', '🦀', 'かに'], ['lobster', '🦞', 'えび'], ['fish', '🐠', 'さかな'], ['blowfish', '🐡', 'ふぐ'], ['seal', '🦭', 'あざらし'],
    ['jellyfish', '🪼', 'くらげ'], ['shrimp', '🦐', 'こえび'],
  ]),
  ...T('ride', 'drive', [
    ['car', '🚗', 'くるま'], ['taxi', '🚕', 'タクシー'], ['bus', '🚌', 'バス'], ['firetruck', '🚒', 'しょうぼうしゃ'], ['ambulance', '🚑', 'きゅうきゅうしゃ'],
    ['police', '🚓', 'パトカー'], ['truck', '🚚', 'トラック'], ['tractor', '🚜', 'トラクター'], ['racecar', '🏎️', 'レーシングカー'], ['motorbike', '🏍️', 'バイク'],
    ['bicycle', '🚲', 'じてんしゃ'], ['scooter', '🛴', 'キックボード'], ['train', '🚂', 'きしゃ'], ['shinkansen', '🚄', 'しんかんせん'], ['tram', '🚋', 'ろめんでんしゃ'],
  ]),
  ...T('ride', 'fly', [['helicopter', '🚁', 'ヘリコプター'], ['airplane', '✈️', 'ひこうき'], ['rocket', '🚀', 'ロケット'], ['ufo', '🛸', 'ユーフォー'], ['balloon', '🎈', 'ふうせん']]),
  ...T('ride', 'swim', [['sailboat', '⛵', 'ヨット'], ['ship', '🚢', 'ふね'], ['canoe', '🛶', 'カヌー'], ['speedboat', '🚤', 'ボート']]),
  ...T('dino', 'stomp', [['trex', '🦖', 'ティラノサウルス'], ['sauropod', '🦕', 'くびながりゅう']]),
  ...T('food', 'spin', [
    ['apple', '🍎', 'りんご'], ['banana', '🍌', 'バナナ'], ['grapes', '🍇', 'ぶどう'], ['strawberry', '🍓', 'いちご'], ['watermelon', '🍉', 'すいか'],
    ['pear', '🍐', 'なし'], ['pineapple', '🍍', 'パイナップル'], ['carrot', '🥕', 'にんじん'], ['corn', '🌽', 'とうもろこし'], ['mushroom', '🍄', 'きのこ'],
    ['icecream', '🍦', 'ソフトクリーム'], ['donut', '🍩', 'ドーナツ'], ['riceball', '🍙', 'おにぎり'], ['cupcake', '🧁', 'カップケーキ'], ['pizza', '🍕', 'ピザ'],
    ['cherries', '🍒', 'さくらんぼ'], ['broccoli', '🥦', 'ブロッコリー'], ['eggplant', '🍆', 'なす'],
  ]),
  ...T('thing', 'spin', [
    ['scissors', '✂️', 'はさみ'], ['key', '🔑', 'かぎ'], ['umbrella', '☂️', 'かさ'], ['guitar', '🎸', 'ギター'], ['trumpet', '🎺', 'ラッパ'],
    ['house', '🏠', 'おうち'], ['kite', '🪁', 'たこあげの たこ'], ['clock', '⏰', 'めざましどけい'], ['glasses', '👓', 'めがね'], ['shoe', '👟', 'くつ'],
    ['teddy', '🧸', 'くまの ぬいぐるみ'], ['tophat', '🎩', 'ぼうし'], ['cactus', '🌵', 'サボテン'], ['sunflower', '🌻', 'ひまわり'], ['tree', '🌳', 'き'],
    ['star', '⭐', 'ほし'], ['moon', '🌙', 'おつきさま'], ['hammer', '🔨', 'かなづち'], ['bell', '🔔', 'すず'], ['crown', '👑', 'おうかん'],
  ]),
];
// 絵（cards/shadow/<id>.png）が ある もの。絵が とどいたら ここに id を ふやす
export const SHADOW_IMAGES = new Set(['airplane', 'ambulance', 'ant', 'apple', 'balloon', 'banana', 'bat', 'bear', 'bee', 'beetle', 'bell', 'bicycle', 'bird', 'bison', 'blowfish', 'broccoli', 'bus', 'butterfly', 'cactus', 'camel', 'canoe', 'car', 'carrot', 'cat', 'caterpillar', 'cherries', 'chick', 'chicken', 'clock', 'corn', 'cow', 'crab', 'cricket', 'crocodile', 'crown', 'cupcake', 'deer', 'dog', 'dolphin', 'donut', 'dove', 'duck', 'eagle', 'eggplant', 'elephant', 'firetruck', 'fish', 'flamingo', 'fly', 'fox', 'frog', 'giraffe', 'glasses', 'goat', 'gorilla', 'grapes', 'guitar', 'hammer', 'hedgehog', 'helicopter', 'hippo', 'horse', 'house', 'icecream', 'jellyfish', 'kangaroo', 'key', 'kite', 'koala', 'ladybug', 'leopard', 'lion', 'lizard', 'llama', 'lobster', 'monkey', 'moon', 'motorbike', 'mouse', 'mushroom', 'octopus', 'otter', 'owl', 'panda', 'parrot', 'peacock', 'pear', 'penguin', 'pig', 'pineapple', 'pizza', 'police', 'poodle', 'rabbit', 'racecar', 'rhino', 'riceball', 'rocket', 'sailboat', 'sauropod', 'scissors', 'scooter', 'scorpion', 'seal', 'shark', 'sheep', 'shinkansen', 'ship', 'shoe', 'shrimp', 'skunk', 'sloth', 'snail', 'snake', 'speedboat', 'spider', 'squid', 'squirrel', 'star', 'strawberry', 'sunflower', 'swan', 'taxi', 'teddy', 'tiger', 'tophat', 'tractor', 'train', 'tram', 'tree', 'trex', 'truck', 'trumpet', 'turtle', 'ufo', 'umbrella', 'watermelon', 'whale', 'zebra']);
