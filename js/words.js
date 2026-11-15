// キャッスルクエスト 単語データ
import { PHOTOS } from './photos.js';
import { LETTER_JA } from './sentences.js';
// 形式: [英語, ひらがな/カタカナ, 絵(絵文字 or 数字), レベル(1-3)]
// レベル 1=かんたん(4歳) 2=ふつう(5歳) 3=むずかしい(6-7歳)

export const CATS = {
  animal: 'どうぶつ', food: 'たべもの', color: 'いろ', number: 'かず', body: 'からだ',
  clothes: 'ふく', vehicle: 'のりもの', people: 'ひと', fantasy: 'ふしぎ', weather: 'てんき',
  nature: 'しぜん', home: 'おうち', play: 'あそび', school: 'がっこう', job: 'しごと',
  shape: 'かたち', feeling: 'きもち', action: 'うごき', season: 'きせつ', town: 'まち', money: 'おかね・くに',
  phrase: 'あいさつ・ことば', time: 'とき', place: 'ばしょ', describe: 'ようす', letter: 'アルファベット',
};

// 絵が似ていて混ざると不公平なカテゴリの組み合わせ（選択肢に一緒に出さない）
export const EXCLUDE = [
  ['color', 'shape'], ['feeling', 'action'], ['season', 'nature'], ['season', 'weather'],
];

const RAW = {
  animal: [
    ['dog', 'いぬ', '🐶', 1], ['cat', 'ねこ', '🐱', 1], ['bird', 'とり', '🐦', 1], ['fish', 'さかな', '🐟', 1],
    ['rabbit', 'うさぎ', '🐰', 1], ['bear', 'くま', '🐻', 1], ['lion', 'ライオン', '🦁', 1], ['elephant', 'ぞう', '🐘', 1],
    ['monkey', 'さる', '🐵', 1], ['pig', 'ぶた', '🐷', 1], ['cow', 'うし', '🐮', 1], ['horse', 'うま', '🐴', 1],
    ['sheep', 'ひつじ', '🐑', 1], ['chicken', 'にわとり', '🐔', 1], ['duck', 'あひる', '🦆', 1], ['frog', 'かえる', '🐸', 1],
    ['mouse', 'ねずみ', '🐭', 1], ['tiger', 'とら', '🐯', 1], ['panda', 'パンダ', '🐼', 1], ['giraffe', 'きりん', '🦒', 1],
    ['zebra', 'しまうま', '🦓', 2], ['penguin', 'ペンギン', '🐧', 2], ['owl', 'ふくろう', '🦉', 2], ['turtle', 'かめ', '🐢', 2],
    ['snake', 'へび', '🐍', 2], ['whale', 'くじら', '🐳', 2], ['dolphin', 'いるか', '🐬', 2], ['shark', 'さめ', '🦈', 2],
    ['octopus', 'たこ', '🐙', 2], ['crab', 'かに', '🦀', 2], ['fox', 'きつね', '🦊', 2], ['wolf', 'おおかみ', '🐺', 2],
    ['koala', 'コアラ', '🐨', 2], ['gorilla', 'ゴリラ', '🦍', 2], ['kangaroo', 'カンガルー', '🦘', 2], ['deer', 'しか', '🦌', 2],
    ['bee', 'みつばち', '🐝', 2], ['butterfly', 'ちょうちょ', '🦋', 2], ['ant', 'あり', '🐜', 2], ['snail', 'かたつむり', '🐌', 2],
    ['hamster', 'ハムスター', '🐹', 2], ['squirrel', 'りす', '🐿️', 2], ['hedgehog', 'はりねずみ', '🦔', 2], ['ladybug', 'てんとうむし', '🐞', 2],
    ['camel', 'らくだ', '🐫', 3], ['hippo', 'かば', '🦛', 3], ['rhino', 'さい', '🦏', 3], ['crocodile', 'わに', '🐊', 3],
    ['flamingo', 'フラミンゴ', '🦩', 3], ['peacock', 'くじゃく', '🦚', 3], ['parrot', 'オウム', '🦜', 3], ['eagle', 'わし', '🦅', 3],
    ['bat', 'こうもり', '🦇', 3], ['swan', 'はくちょう', '🦢', 3], ['seal', 'あざらし', '🦭', 3], ['jellyfish', 'くらげ', '🪼', 3],
    ['lobster', 'ロブスター', '🦞', 3], ['beaver', 'ビーバー', '🦫', 3], ['sloth', 'なまけもの', '🦥', 3], ['otter', 'かわうそ', '🦦', 3],
    ['mosquito', 'か', '🦟', 3], ['worm', 'みみず', '🪱', 3], ['dinosaur', 'きょうりゅう', '🦕', 3], ['leopard', 'ひょう', '🐆', 3],
    ['goat', 'やぎ', '🐐', 3], ['turkey', 'しちめんちょう', '🦃', 3], ['raccoon', 'アライグマ', '🦝', 3], ['skunk', 'スカンク', '🦨', 3],
  ],
  food: [
    ['apple', 'りんご', '🍎', 1], ['banana', 'バナナ', '🍌', 1], ['orange', 'オレンジ', '🍊', 1], ['grapes', 'ぶどう', '🍇', 1],
    ['strawberry', 'いちご', '🍓', 1], ['melon', 'メロン', '🍈', 1], ['peach', 'もも', '🍑', 1], ['cake', 'ケーキ', '🍰', 1],
    ['bread', 'パン', '🍞', 1], ['milk', 'ぎゅうにゅう', '🥛', 1], ['egg', 'たまご', '🥚', 1], ['rice', 'ごはん', '🍚', 1],
    ['ice cream', 'アイスクリーム', '🍦', 1], ['candy', 'キャンディ', '🍬', 1], ['cookie', 'クッキー', '🍪', 1], ['watermelon', 'すいか', '🍉', 1],
    ['juice', 'ジュース', '🧃', 1],
    ['carrot', 'にんじん', '🥕', 2], ['tomato', 'トマト', '🍅', 2], ['potato', 'じゃがいも', '🥔', 2], ['corn', 'とうもろこし', '🌽', 2],
    ['onion', 'たまねぎ', '🧅', 2], ['mushroom', 'きのこ', '🍄', 2], ['cherry', 'さくらんぼ', '🍒', 2], ['lemon', 'レモン', '🍋', 2],
    ['pineapple', 'パイナップル', '🍍', 2], ['pizza', 'ピザ', '🍕', 2], ['hamburger', 'ハンバーガー', '🍔', 2], ['sandwich', 'サンドイッチ', '🥪', 2],
    ['cheese', 'チーズ', '🧀', 2], ['chocolate', 'チョコレート', '🍫', 2], ['donut', 'ドーナツ', '🍩', 2], ['tea', 'おちゃ', '🍵', 2],
    ['water', 'みず', '💧', 2], ['noodles', 'めん', '🍜', 2], ['sushi', 'すし', '🍣', 2], ['rice ball', 'おにぎり', '🍙', 2],
    ['salad', 'サラダ', '🥗', 2], ['pumpkin', 'かぼちゃ', '🎃', 2], ['cucumber', 'きゅうり', '🥒', 2], ['broccoli', 'ブロッコリー', '🥦', 2],
    ['popcorn', 'ポップコーン', '🍿', 2], ['meat', 'にく', '🥩', 2],
    ['peanut', 'ピーナッツ', '🥜', 3], ['avocado', 'アボカド', '🥑', 3], ['kiwi', 'キウイ', '🥝', 3], ['coconut', 'ココナッツ', '🥥', 3],
    ['mango', 'マンゴー', '🥭', 3], ['eggplant', 'なす', '🍆', 3], ['garlic', 'にんにく', '🧄', 3], ['green pepper', 'ピーマン', '🫑', 3],
    ['pancake', 'ホットケーキ', '🥞', 3], ['honey', 'はちみつ', '🍯', 3], ['butter', 'バター', '🧈', 3], ['salt', 'しお', '🧂', 3],
    ['spaghetti', 'スパゲッティ', '🍝', 3], ['bacon', 'ベーコン', '🥓', 3], ['pear', 'ようなし', '🍐', 3], ['blueberry', 'ブルーベリー', '🫐', 3],
    ['lollipop', 'ぺろぺろキャンディ', '🍭', 3], ['pretzel', 'プレッツェル', '🥨', 3], ['dumpling', 'ぎょうざ', '🥟', 3], ['shrimp', 'えび', '🦐', 3],
  ],
  color: [
    ['red', 'あか', '🔴', 1], ['blue', 'あお', '🔵', 1], ['yellow', 'きいろ', '🟡', 1], ['green', 'みどり', '🟢', 1],
    ['black', 'くろ', '⚫', 1], ['white', 'しろ', '⚪', 1], ['orange', 'オレンジいろ', '🟠', 1], ['purple', 'むらさき', '🟣', 1],
    ['brown', 'ちゃいろ', '🟤', 1], ['pink', 'ピンク', '🩷', 1],
    ['gray', 'はいいろ', '🩶', 2], ['light blue', 'みずいろ', '🩵', 2],
  ],
  number: [
    ['zero', 'ゼロ', '0', 2], ['one', 'いち', '1', 1], ['two', 'に', '2', 1], ['three', 'さん', '3', 1], ['four', 'よん', '4', 1],
    ['five', 'ご', '5', 1], ['six', 'ろく', '6', 1], ['seven', 'なな', '7', 1], ['eight', 'はち', '8', 1],
    ['nine', 'きゅう', '9', 1], ['ten', 'じゅう', '10', 1],
    ['eleven', 'じゅういち', '11', 2], ['twelve', 'じゅうに', '12', 2], ['thirteen', 'じゅうさん', '13', 2], ['fourteen', 'じゅうよん', '14', 2],
    ['fifteen', 'じゅうご', '15', 2], ['sixteen', 'じゅうろく', '16', 2], ['seventeen', 'じゅうなな', '17', 2], ['eighteen', 'じゅうはち', '18', 2],
    ['nineteen', 'じゅうきゅう', '19', 2], ['twenty', 'にじゅう', '20', 2],
    ['thirty', 'さんじゅう', '30', 3], ['forty', 'よんじゅう', '40', 3], ['fifty', 'ごじゅう', '50', 3], ['sixty', 'ろくじゅう', '60', 3],
    ['seventy', 'ななじゅう', '70', 3], ['eighty', 'はちじゅう', '80', 3], ['ninety', 'きゅうじゅう', '90', 3], ['one hundred', 'ひゃく', '100', 3],
  ],
  body: [
    ['eye', 'め', '👁️', 1], ['ear', 'みみ', '👂', 1], ['nose', 'はな', '👃', 1], ['mouth', 'くち', '👄', 1],
    ['hand', 'て', '✋', 1], ['foot', 'あし', '🦶', 1],
    ['tooth', 'は', '🦷', 2], ['tongue', 'した', '👅', 2], ['finger', 'ゆび', '☝️', 2], ['arm', 'うで', '💪', 2], ['bone', 'ほね', '🦴', 2],
    ['brain', 'のう', '🧠', 3], ['lungs', 'はいぞう', '🫁', 3], ['heart', 'しんぞう', '🫀', 3], ['footprints', 'あしあと', '👣', 3],
  ],
  clothes: [
    ['hat', 'ぼうし', '👒', 1], ['shoes', 'くつ', '👟', 1], ['T-shirt', 'Tシャツ', '👕', 1],
    ['dress', 'ワンピース', '👗', 2], ['socks', 'くつした', '🧦', 2], ['gloves', 'てぶくろ', '🧤', 2], ['scarf', 'マフラー', '🧣', 2],
    ['glasses', 'めがね', '👓', 2], ['coat', 'コート', '🧥', 2], ['pants', 'ズボン', '👖', 2], ['bag', 'かばん', '🎒', 2],
    ['umbrella', 'かさ', '☂️', 2], ['crown', 'おうかん', '👑', 2], ['kimono', 'きもの', '👘', 2],
    ['ring', 'ゆびわ', '💍', 3], ['boots', 'ブーツ', '👢', 3], ['swimsuit', 'みずぎ', '🩱', 3], ['sunglasses', 'サングラス', '🕶️', 3],
    ['high heels', 'ハイヒール', '👠', 3], ['shorts', 'たんパン', '🩳', 3],
  ],
  vehicle: [
    ['car', 'くるま', '🚗', 1], ['bus', 'バス', '🚌', 1], ['train', 'でんしゃ', '🚃', 1], ['airplane', 'ひこうき', '✈️', 1],
    ['ship', 'ふね', '🚢', 1], ['bike', 'じてんしゃ', '🚲', 1], ['truck', 'トラック', '🚚', 1],
    ['taxi', 'タクシー', '🚕', 2], ['helicopter', 'ヘリコプター', '🚁', 2], ['rocket', 'ロケット', '🚀', 2], ['fire truck', 'しょうぼうしゃ', '🚒', 2],
    ['ambulance', 'きゅうきゅうしゃ', '🚑', 2], ['police car', 'パトカー', '🚓', 2], ['boat', 'ボート', '🚤', 2],
    ['tractor', 'トラクター', '🚜', 3], ['scooter', 'キックボード', '🛴', 3], ['motorcycle', 'オートバイ', '🏍️', 3], ['sled', 'そり', '🛷', 3],
    ['canoe', 'カヌー', '🛶', 3], ['bullet train', 'しんかんせん', '🚄', 3], ['parachute', 'パラシュート', '🪂', 3], ['sailboat', 'ヨット', '⛵', 3],
  ],
  people: [
    ['mother', 'おかあさん', '👩', 1], ['father', 'おとうさん', '👨', 1], ['baby', 'あかちゃん', '👶', 1],
    ['boy', 'おとこのこ', '👦', 1], ['girl', 'おんなのこ', '👧', 1],
    ['grandmother', 'おばあちゃん', '👵', 2], ['grandfather', 'おじいちゃん', '👴', 2], ['family', 'かぞく', '👪', 2],
    ['prince', 'おうじさま', '🤴', 2], ['princess', 'おひめさま', '👸', 2],
    ['ninja', 'にんじゃ', '🥷', 3],
  ],
  fantasy: [
    ['ghost', 'おばけ', '👻', 1], ['robot', 'ロボット', '🤖', 1], ['castle', 'おしろ', '🏰', 1],
    ['dragon', 'ドラゴン', '🐉', 2], ['unicorn', 'ユニコーン', '🦄', 2], ['fairy', 'ようせい', '🧚', 2],
    ['mermaid', 'にんぎょ', '🧜‍♀️', 2], ['wizard', 'まほうつかい', '🧙', 2],
    ['sword', 'けん', '🗡️', 3], ['shield', 'たて', '🛡️', 3], ['magic wand', 'まほうのつえ', '🪄', 3], ['alien', 'うちゅうじん', '👽', 3],
  ],
  weather: [
    ['sun', 'たいよう', '☀️', 1], ['moon', 'つき', '🌙', 1], ['star', 'ほし', '⭐', 1], ['rain', 'あめ', '🌧️', 1],
    ['cloud', 'くも', '☁️', 1], ['snow', 'ゆき', '❄️', 1], ['rainbow', 'にじ', '🌈', 1],
    ['wind', 'かぜ', '🌬️', 2], ['thunder', 'かみなり', '⚡', 2], ['snowman', 'ゆきだるま', '⛄', 2],
    ['tornado', 'たつまき', '🌪️', 3], ['fog', 'きり', '🌫️', 3], ['ice', 'こおり', '🧊', 3], ['comet', 'すいせい', '☄️', 3],
  ],
  nature: [
    ['flower', 'おはな', '🌷', 1], ['tree', 'き', '🌳', 1], ['sea', 'うみ', '🌊', 1], ['mountain', 'やま', '⛰️', 1], ['leaf', 'はっぱ', '🍃', 1],
    ['fire', 'ひ', '🔥', 2], ['rock', 'いわ', '🪨', 2], ['sunflower', 'ひまわり', '🌻', 2], ['rose', 'ばら', '🌹', 2],
    ['cactus', 'サボテン', '🌵', 2], ['island', 'しま', '🏝️', 2], ['forest', 'もり', '🌲', 2], ['volcano', 'かざん', '🌋', 2],
    ['earth', 'ちきゅう', '🌍', 3], ['desert', 'さばく', '🏜️', 3], ['shell', 'かいがら', '🐚', 3], ['feather', 'はね', '🪶', 3],
    ['maple leaf', 'もみじ', '🍁', 3], ['clover', 'クローバー', '🍀', 3],
  ],
  home: [
    ['house', 'いえ', '🏠', 1], ['bed', 'ベッド', '🛏️', 1], ['chair', 'いす', '🪑', 1], ['door', 'ドア', '🚪', 1],
    ['key', 'かぎ', '🔑', 1], ['clock', 'とけい', '🕐', 1], ['book', 'ほん', '📖', 1], ['cup', 'カップ', '☕', 1], ['phone', 'でんわ', '📱', 1],
    ['window', 'まど', '🪟', 2], ['TV', 'テレビ', '📺', 2], ['computer', 'パソコン', '💻', 2], ['camera', 'カメラ', '📷', 2],
    ['scissors', 'はさみ', '✂️', 2], ['pencil', 'えんぴつ', '✏️', 2], ['box', 'はこ', '📦', 2], ['candle', 'ろうそく', '🕯️', 2],
    ['toothbrush', 'はブラシ', '🪥', 2], ['soap', 'せっけん', '🧼', 2], ['bathtub', 'おふろ', '🛁', 2], ['toilet', 'トイレ', '🚽', 2],
    ['spoon', 'スプーン', '🥄', 2], ['fork', 'フォーク', '🍴', 2], ['knife', 'ナイフ', '🔪', 2], ['bell', 'ベル', '🔔', 2], ['light bulb', 'でんきゅう', '💡', 2],
    ['mirror', 'かがみ', '🪞', 3], ['ladder', 'はしご', '🪜', 3], ['broom', 'ほうき', '🧹', 3], ['bucket', 'バケツ', '🪣', 3],
    ['magnet', 'じしゃく', '🧲', 3], ['hammer', 'かなづち', '🔨', 3], ['battery', 'でんち', '🔋', 3], ['envelope', 'ふうとう', '✉️', 3],
    ['calendar', 'カレンダー', '📅', 3], ['basket', 'かご', '🧺', 3], ['teapot', 'きゅうす', '🫖', 3],
  ],
  play: [
    ['ball', 'ボール', '⚽', 1], ['balloon', 'ふうせん', '🎈', 1],
    ['drum', 'たいこ', '🥁', 2], ['guitar', 'ギター', '🎸', 2], ['piano', 'ピアノ', '🎹', 2], ['teddy bear', 'くまの ぬいぐるみ', '🧸', 2],
    ['puzzle', 'パズル', '🧩', 2], ['present', 'プレゼント', '🎁', 2], ['dice', 'サイコロ', '🎲', 2], ['yo-yo', 'ヨーヨー', '🪀', 2],
    ['trumpet', 'トランペット', '🎺', 3], ['violin', 'バイオリン', '🎻', 3], ['fireworks', 'はなび', '🎆', 3], ['tent', 'テント', '⛺', 3],
    ['skateboard', 'スケートボード', '🛹', 3], ['trophy', 'トロフィー', '🏆', 3], ['medal', 'メダル', '🏅', 3], ['ticket', 'チケット', '🎫', 3],
  ],
  school: [
    ['school', 'がっこう', '🏫', 2], ['teacher', 'せんせい', '🧑‍🏫', 2], ['crayon', 'クレヨン', '🖍️', 2], ['notebook', 'ノート', '📓', 2],
    ['ruler', 'じょうぎ', '📏', 3], ['paints', 'えのぐ', '🎨', 3], ['microscope', 'けんびきょう', '🔬', 3], ['paper clip', 'クリップ', '📎', 3],
    ['pushpin', 'がびょう', '📌', 3],
  ],
  job: [
    ['doctor', 'おいしゃさん', '🧑‍⚕️', 3], ['cook', 'コック', '🧑‍🍳', 3], ['farmer', 'のうかの ひと', '🧑‍🌾', 3],
    ['police officer', 'けいさつかん', '👮', 3], ['firefighter', 'しょうぼうし', '🧑‍🚒', 3], ['astronaut', 'うちゅうひこうし', '🧑‍🚀', 3],
    ['pilot', 'パイロット', '🧑‍✈️', 3], ['artist', 'がか', '🧑‍🎨', 3], ['singer', 'かしゅ', '🧑‍🎤', 3], ['scientist', 'かがくしゃ', '🧑‍🔬', 3],
  ],
  shape: [
    ['heart', 'ハート', '❤️', 1],
    ['circle', 'まる', '⭕', 2], ['triangle', 'さんかく', '🔺', 2], ['square', 'しかく', '🟥', 2],
    ['diamond', 'ひしがた', '🔷', 3],
  ],
  feeling: [
    ['happy', 'うれしい', '😊', 2], ['sad', 'かなしい', '😢', 2], ['angry', 'おこってる', '😠', 2], ['scared', 'こわい', '😨', 2],
    ['sleepy', 'ねむい', '😴', 2],
    ['surprised', 'びっくり', '😲', 3], ['sick', 'びょうき', '🤒', 3], ['tired', 'つかれた', '😩', 3], ['hot', 'あつい', '🥵', 3],
    ['cold', 'さむい', '🥶', 3], ['shy', 'はずかしい', '😳', 3],
  ],
  action: [
    ['run', 'はしる', '🏃', 2], ['swim', 'およぐ', '🏊', 2], ['walk', 'あるく', '🚶', 2], ['dance', 'おどる', '💃', 2],
    ['sing', 'うたう', '🎤', 2], ['sleep', 'ねる', '🛌', 2],
    ['read', 'よむ', '📚', 3], ['write', 'かく', '✍️', 3], ['climb', 'のぼる', '🧗', 3], ['ride', 'のる', '🚴', 3],
    ['cry', 'なく', '😭', 3], ['laugh', 'わらう', '😆', 3], ['clap', 'はくしゅする', '👏', 3], ['wave', 'てを ふる', null, 3],
    ['think', 'かんがえる', '🤔', 3], ['surf', 'なみのり', '🏄', 3], ['ski', 'スキー', '⛷️', 3], ['eat', 'たべる', '😋', 3],
  ],
};

// 日常会話でよく使うことば（2026-11-15 追加）。絵が null の単語は、文字の問題（ひらがな⇔えいご）だけに出る
const RAW_MORE = {
  phrase: [
    ['hello', 'こんにちは', '👋', 1], ['thank you', 'ありがとう', '🙏', 1], ['sorry', 'ごめんなさい', '🙇', 1],
    ['yes', 'はい', '🙆', 1], ['no', 'いいえ', '🙅', 1], ['good morning', 'おはよう', null, 1], ['good night', 'おやすみ', null, 1],
    ['goodbye', 'さようなら', null, 1], ['please', 'おねがい', '🥺', 2], ['excuse me', 'すみません', null, 2],
    ["you're welcome", 'どういたしまして', null, 2], ['nice to meet you', 'はじめまして', '🤝', 2], ['see you', 'またね', null, 2],
    ['I love you', 'だいすき', '🥰', 2], ['happy birthday', 'おたんじょうび おめでとう', null, 2], ['congratulations', 'おめでとう', '🎉', 2],
    ['good job', 'よくできました', null, 2], ['help', 'たすけて', '🆘', 2], ['how are you', 'げんき？', null, 3], ["I'm fine", 'げんきです', null, 3],
    ["what's your name", 'おなまえは？', null, 3], ["I'm hungry", 'おなかが すいた', '🤤', 3], ["I'm thirsty", 'のどが かわいた', null, 3],
    ['be careful', 'きをつけて', '⚠️', 3], ['wait', 'まって', null, 3], ['hurry up', 'いそいで', null, 3], ['bless you', 'おだいじに', '🤧', 3],
    ['cheers', 'かんぱい', '🥂', 3], ["let's go", 'いこう', null, 3], ['me too', 'わたしも', null, 3], ['OK', 'いいよ', '👌', 2],
    ['I see', 'なるほど', null, 3], ['welcome', 'いらっしゃい', null, 3], ['good luck', 'がんばって', null, 3],
  ],
  time: [
    ['morning', 'あさ', '🌄', 1], ['night', 'よる', '🌃', 1], ['breakfast', 'あさごはん', null, 2], ['lunch', 'ひるごはん', null, 2],
    ['dinner', 'ばんごはん', null, 2], ['today', 'きょう', null, 2], ['tomorrow', 'あした', null, 2], ['yesterday', 'きのう', null, 2],
    ['birthday', 'たんじょうび', '🎂', 1], ['week', 'しゅう', null, 3], ['weekend', 'しゅうまつ', null, 3], ['afternoon', 'ごご', null, 3],
    ['evening', 'ゆうがた', null, 3], ['year', 'とし', null, 3], ['hour', 'じかん', null, 3], ['minute', 'ふん', null, 3],
    ['Monday', 'げつようび', null, 3], ['Tuesday', 'かようび', null, 3], ['Wednesday', 'すいようび', null, 3], ['Thursday', 'もくようび', null, 3],
    ['Friday', 'きんようび', null, 3], ['Saturday', 'どようび', null, 3], ['Sunday', 'にちようび', null, 3],
    ['January', 'いちがつ', null, 3], ['February', 'にがつ', null, 3], ['March', 'さんがつ', null, 3], ['April', 'しがつ', null, 3],
    ['May', 'ごがつ', null, 3], ['June', 'ろくがつ', null, 3], ['July', 'しちがつ', null, 3], ['August', 'はちがつ', null, 3],
    ['September', 'くがつ', null, 3], ['October', 'じゅうがつ', null, 3], ['November', 'じゅういちがつ', null, 3], ['December', 'じゅうにがつ', null, 3],
  ],
  place: [
    ['park', 'こうえん', '🏞️', 1], ['zoo', 'どうぶつえん', null, 1], ['beach', 'ビーチ', null, 2], ['kitchen', 'だいどころ', null, 2],
    ['bedroom', 'しんしつ', null, 3], ['living room', 'リビング', null, 3], ['garden', 'にわ', null, 2], ['library', 'としょかん', null, 2],
    ['supermarket', 'スーパー', '🛒', 2], ['restaurant', 'レストラン', null, 2], ['station', 'えき', '🚉', 2], ['airport', 'くうこう', '🛫', 2],
    ['playground', 'あそびば', null, 2], ['swimming pool', 'プール', null, 2], ['farm', 'のうじょう', null, 2], ['city', 'まち', '🏙️', 2],
    ['road', 'みち', '🛣️', 2], ['aquarium', 'すいぞくかん', null, 3], ['museum', 'はくぶつかん', '🏛️', 3], ['shrine', 'じんじゃ', '⛩️', 3],
    ['hotel', 'ホテル', '🏨', 3], ['apartment', 'マンション', '🏢', 3], ['bus stop', 'バスてい', '🚏', 3], ['gas station', 'ガソリンスタンド', '⛽', 3],
    ['parking lot', 'ちゅうしゃじょう', '🅿️', 3], ['lighthouse', 'とうだい', null, 3], ['classroom', 'きょうしつ', null, 3], ['bakery', 'パンや', null, 3],
  ],
  describe: [
    ['big', 'おおきい', null, 2], ['small', 'ちいさい', null, 2], ['long', 'ながい', null, 2], ['short', 'みじかい', null, 2],
    ['new', 'あたらしい', null, 2], ['old', 'ふるい', null, 2], ['fast', 'はやい', null, 2], ['slow', 'おそい', null, 2],
    ['good', 'いい', null, 2], ['bad', 'わるい', null, 2], ['cute', 'かわいい', null, 2], ['pretty', 'きれい', null, 2],
    ['strong', 'つよい', null, 2], ['weak', 'よわい', null, 3], ['heavy', 'おもい', null, 3], ['light', 'かるい', null, 3],
    ['dark', 'くらい', null, 3], ['bright', 'あかるい', null, 3], ['dirty', 'きたない', null, 3], ['easy', 'かんたん', null, 3],
    ['difficult', 'むずかしい', null, 3], ['delicious', 'おいしい', null, 2], ['many', 'たくさん', null, 3], ['quiet', 'しずか', null, 3],
    ['loud', 'うるさい', null, 3], ['kind', 'やさしい', null, 3], ['funny', 'おもしろい', null, 3], ['busy', 'いそがしい', null, 3],
    ['sweet', 'あまい', null, 3], ['sour', 'すっぱい', null, 3], ['spicy', 'からい', null, 3], ['bitter', 'にがい', null, 3],
    ['soft', 'やわらかい', null, 3], ['hard', 'かたい', null, 3], ['wet', 'ぬれた', null, 3], ['high', 'たかい', null, 3],
    ['low', 'ひくい', null, 3], ['warm', 'あたたかい', null, 3], ['cool', 'すずしい', null, 3], ['empty', 'からっぽ', null, 3],
  ],
  action: [
    ['go', 'いく', null, 2], ['come', 'くる', null, 2], ['see', 'みる', null, 2], ['listen', 'きく', null, 2], ['talk', 'はなす', null, 2],
    ['open', 'あける', null, 2], ['close', 'しめる', null, 2], ['wash', 'あらう', null, 2], ['play', 'あそぶ', null, 2], ['sit', 'すわる', null, 2],
    ['stand', 'たつ', null, 2], ['smile', 'にこにこする', '🙂', 2], ['hug', 'ぎゅっとする', '🫂', 2], ['wake up', 'おきる', '⏰', 2],
    ['drink', 'のむ', null, 2], ['study', 'べんきょうする', '📝', 3], ['shout', 'さけぶ', '📣', 3], ['throw', 'なげる', null, 3],
    ['kick', 'ける', null, 3], ['push', 'おす', null, 3], ['pull', 'ひく', null, 3], ['carry', 'はこぶ', null, 3], ['draw', 'えを かく', null, 3],
    ['count', 'かぞえる', null, 3], ['help', 'てつだう', null, 3], ['give', 'あげる', null, 3], ['buy', 'かう', null, 3], ['make', 'つくる', null, 3],
    ['build', 'たてる', null, 3], ['brush', 'みがく', null, 3], ['fly', 'そらを とぶ', null, 3], ['catch', 'キャッチする', null, 3],
    ['like', 'すき', null, 2], ['want', 'ほしい', null, 3], ['know', 'しっている', null, 3], ['finish', 'おわる', null, 3], ['start', 'はじめる', null, 3],
  ],
  food: [
    ['curry', 'カレー', '🍛', 1], ['omelet', 'オムレツ', '🍳', 2], ['bento', 'おべんとう', '🍱', 2], ['French fries', 'フライドポテト', '🍟', 1],
    ['hot dog', 'ホットドッグ', '🌭', 2], ['soup', 'スープ', '🥣', 2], ['fried chicken', 'からあげ', '🍗', 2], ['pudding', 'プリン', '🍮', 1],
    ['cupcake', 'カップケーキ', '🧁', 2], ['pie', 'パイ', '🥧', 3], ['taco', 'タコス', '🌮', 3], ['bagel', 'ベーグル', '🥯', 3],
    ['croissant', 'クロワッサン', '🥐', 3], ['rice cracker', 'せんべい', '🍘', 3], ['dango', 'だんご', '🍡', 3], ['shaved ice', 'かきごおり', '🍧', 2],
    ['soda', 'ソーダ', '🥤', 2], ['yogurt', 'ヨーグルト', null, 2], ['jam', 'ジャム', null, 3], ['sugar', 'さとう', null, 3], ['tofu', 'とうふ', null, 2],
    ['toast', 'トースト', null, 2], ['sausage', 'ソーセージ', null, 2], ['coffee', 'コーヒー', null, 3], ['cereal', 'シリアル', null, 3],
    ['cabbage', 'キャベツ', '🥬', 2], ['lettuce', 'レタス', null, 3], ['sweet potato', 'さつまいも', '🍠', 2], ['ginger', 'しょうが', '🫚', 3],
    ['beans', 'まめ', '🫘', 3], ['chestnut', 'くり', '🌰', 3], ['olive', 'オリーブ', '🫒', 3], ['persimmon', 'かき', null, 3],
    ['radish', 'だいこん', null, 3], ['green onion', 'ねぎ', null, 3], ['miso soup', 'みそしる', null, 3], ['ketchup', 'ケチャップ', null, 3],
  ],
  home: [
    ['plate', 'おさら', null, 2], ['bowl', 'おわん', null, 2], ['chopsticks', 'おはし', '🥢', 1], ['glass', 'コップ', null, 2],
    ['bottle', 'ボトル', '🍼', 2], ['towel', 'タオル', null, 2], ['pillow', 'まくら', null, 2], ['blanket', 'もうふ', null, 3],
    ['sofa', 'ソファ', '🛋️', 2], ['table', 'テーブル', null, 1], ['desk', 'つくえ', null, 2], ['refrigerator', 'れいぞうこ', null, 3],
    ['washing machine', 'せんたくき', null, 3], ['shampoo', 'シャンプー', '🧴', 3], ['toilet paper', 'トイレットペーパー', '🧻', 2],
    ['trash can', 'ごみばこ', '🗑️', 2], ['picture', 'しゃしん', '🖼️', 2], ['stairs', 'かいだん', null, 3], ['roof', 'やね', null, 3],
    ['curtain', 'カーテン', null, 3], ['fan', 'せんぷうき', null, 3], ['lamp', 'ランプ', '🪔', 3],
  ],
  clothes: [
    ['cap', 'キャップ', '🧢', 1], ['jacket', 'ジャケット', null, 2], ['skirt', 'スカート', null, 2], ['sweater', 'セーター', null, 2],
    ['pajamas', 'パジャマ', null, 2], ['belt', 'ベルト', null, 3], ['button', 'ボタン', '🔘', 3], ['necktie', 'ネクタイ', '👔', 3],
    ['sandals', 'サンダル', '🩴', 2], ['apron', 'エプロン', null, 3], ['mask', 'マスク', '😷', 2], ['slippers', 'スリッパ', null, 3],
  ],
  body: [
    ['head', 'あたま', null, 1], ['hair', 'かみのけ', null, 2], ['shoulder', 'かた', null, 2], ['knee', 'ひざ', '🦵', 2],
    ['toe', 'あしのゆび', null, 3], ['stomach', 'おなか', null, 2], ['back', 'せなか', null, 3], ['neck', 'くび', null, 2],
    ['elbow', 'ひじ', null, 3], ['cheek', 'ほっぺ', null, 3], ['nail', 'つめ', '💅', 3], ['eyebrow', 'まゆげ', null, 3],
  ],
  people: [
    ['big sister', 'おねえさん', null, 2], ['little sister', 'いもうと', null, 2], ['big brother', 'おにいさん', null, 2],
    ['little brother', 'おとうと', null, 2], ['aunt', 'おばさん', null, 3], ['uncle', 'おじさん', null, 3], ['cousin', 'いとこ', null, 3],
    ['friend', 'ともだち', '🧑‍🤝‍🧑', 1], ['child', 'こども', '🧒', 2], ['king', 'おうさま', null, 2], ['queen', 'じょおう', null, 3],
  ],
  animal: [
    ['puppy', 'こいぬ', null, 1], ['kitten', 'こねこ', null, 1], ['chick', 'ひよこ', '🐤', 1], ['rooster', 'おんどり', '🐓', 2],
    ['polar bear', 'ほっきょくぐま', '🐻‍❄️', 2], ['dragonfly', 'とんぼ', null, 2], ['cricket', 'コオロギ', '🦗', 3], ['beetle', 'かぶとむし', '🪲', 2],
    ['firefly', 'ほたる', null, 3], ['caterpillar', 'けむし', '🐛', 2], ['seahorse', 'たつのおとしご', null, 3], ['starfish', 'ひとで', null, 2],
    ['squid', 'いか', null, 2], ['salmon', 'さけ', null, 3], ['walrus', 'セイウチ', null, 3], ['crow', 'カラス', null, 2],
    ['pigeon', 'はと', '🕊️', 2], ['sparrow', 'すずめ', null, 2], ['woodpecker', 'きつつき', null, 3], ['tanuki', 'たぬき', null, 2],
    ['ostrich', 'ダチョウ', null, 3], ['llama', 'ラマ', '🦙', 3], ['donkey', 'ロバ', '🫏', 3], ['moose', 'ヘラジカ', '🫎', 3], ['orangutan', 'オランウータン', '🦧', 3],
  ],
  vehicle: [
    ['subway', 'ちかてつ', '🚇', 2], ['streetcar', 'ろめんでんしゃ', '🚋', 3], ['cable car', 'ロープウェイ', '🚡', 3], ['ferry', 'フェリー', '⛴️', 3],
    ['racing car', 'レーシングカー', '🏎️', 2], ['crane', 'クレーン', '🏗️', 3], ['submarine', 'せんすいかん', null, 3],
    ['hot air balloon', 'ききゅう', null, 3], ['excavator', 'ショベルカー', null, 2], ['bulldozer', 'ブルドーザー', null, 3],
  ],
  nature: [
    ['river', 'かわ', null, 1], ['lake', 'みずうみ', null, 2], ['pond', 'いけ', null, 2], ['sky', 'そら', null, 1], ['grass', 'くさ', '🌿', 2],
    ['cave', 'どうくつ', null, 3], ['waterfall', 'たき', null, 2], ['sand', 'すな', null, 2], ['sunset', 'ゆうひ', '🌇', 2], ['sunrise', 'あさひ', '🌅', 3],
    ['planet', 'わくせい', '🪐', 3], ['space', 'うちゅう', '🌌', 3],
  ],
  weather: [
    ['typhoon', 'たいふう', '🌀', 3], ['storm', 'あらし', '⛈️', 3],
  ],
  school: [
    ['student', 'せいと', '🧑‍🎓', 2], ['blackboard', 'こくばん', null, 2], ['eraser', 'けしゴム', null, 2], ['glue', 'のり', null, 3],
    ['pencil case', 'ふでばこ', null, 3], ['textbook', 'きょうかしょ', null, 3], ['homework', 'しゅくだい', null, 3], ['test', 'テスト', null, 3],
    ['abacus', 'そろばん', '🧮', 3], ['globe', 'ちきゅうぎ', null, 3], ['calculator', 'でんたく', null, 3],
  ],
  job: [
    ['nurse', 'かんごし', null, 3], ['dentist', 'はいしゃ', null, 3], ['baker', 'パンやさん', null, 3], ['carpenter', 'だいく', null, 3],
    ['mechanic', 'せいびし', '🧑‍🔧', 3], ['judge', 'さいばんかん', '🧑‍⚖️', 3], ['vet', 'じゅうい', null, 3], ['bus driver', 'バスの うんてんしゅ', null, 3],
  ],
  play: [
    ['blocks', 'つみき', null, 1], ['swing', 'ぶらんこ', null, 1], ['slide', 'すべりだい', '🛝', 1], ['jump rope', 'なわとび', null, 2],
    ['baseball', 'やきゅう', '⚾', 2], ['basketball', 'バスケットボール', '🏀', 2], ['tennis', 'テニス', '🎾', 2], ['volleyball', 'バレーボール', '🏐', 3],
    ['bowling', 'ボウリング', '🎳', 3], ['video game', 'ゲーム', '🎮', 1], ['card', 'カード', '🃏', 2], ['chess', 'チェス', '♟️', 3],
    ['bubbles', 'シャボンだま', '🫧', 1], ['magic', 'てじな', '🎩', 3], ['music', 'おんがく', '🎵', 2], ['song', 'うた', '🎶', 2],
    ['movie', 'えいが', '🎬', 2], ['party', 'パーティー', '🥳', 2], ['picnic', 'ピクニック', null, 3], ['doll', 'にんぎょう', null, 2],
  ],
  moneyMore: [
    ['wallet', 'さいふ', '👛', 2], ['price', 'ねだん', '🏷️', 3],
  ],
  townMore: [
    ['crosswalk', 'おうだんほどう', '🚸', 3], ['fire station', 'しょうぼうしょ', null, 3], ['police station', 'けいさつしょ', null, 3],
  ],
  season: [
    ['spring', 'はる', '🌸', 3], ['summer', 'なつ', '🏖️', 3], ['fall', 'あき', '🍂', 3], ['winter', 'ふゆ', '☃️', 3],
  ],
  town: [
    ['hospital', 'びょういん', '🏥', 2], ['store', 'おみせ', '🏪', 2], ['tower', 'タワー', '🗼', 2],
    ['bank', 'ぎんこう', '🏦', 3], ['church', 'きょうかい', '⛪', 3], ['bridge', 'はし', '🌉', 3], ['fountain', 'ふんすい', '⛲', 3],
    ['factory', 'こうじょう', '🏭', 3], ['post office', 'ゆうびんきょく', '🏣', 3], ['stadium', 'スタジアム', '🏟️', 3],
    ['Ferris wheel', 'かんらんしゃ', '🎡', 3], ['roller coaster', 'ジェットコースター', '🎢', 3], ['traffic light', 'しんごう', '🚦', 3],
  ],
  money: [
    ['money', 'おかね', '💰', 2], ['coin', 'コイン', '🪙', 2], ['flag', 'はた', '🚩', 2],
    ['dollar', 'ドル', '💵', 3], ['yen', 'えん', '💴', 3], ['euro', 'ユーロ', '💶', 3], ['pound', 'ポンド', '💷', 3],
    ['map', 'ちず', '🗺️', 3], ['Japan', 'にほん', '🗾', 3], ['compass', 'コンパス', '🧭', 3],
  ],
};

export const WORDS = [];
for (const raw of [RAW, RAW_MORE]) {
  for (const [key, rows] of Object.entries(raw)) {
    const cat = key.replace(/More$/, '');
    for (const [en, ja, pic, lv] of rows) {
      const id = `${cat}:${en}`;
      const photo = PHOTOS[id]?.src || null;
      WORDS.push({ id, en, ja, pic, lv, cat, isNum: /^\d+$/.test(pic || ''), photo, hasPic: !!(photo || pic) });
    }
  }
}
// アルファベット（大文字・小文字の問題用。ふつうの単語の問題には出さない）
export const LETTERS = [];
for (const L of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
  const ja = LETTER_JA[L];
  LETTERS.push({ id: `letter:${L}`, en: L, ja: `${ja}（おおもじ）`, pic: L, lv: 1, cat: 'letter', isNum: true, photo: null, hasPic: true, letter: true });
  LETTERS.push({ id: `letter:${L.toLowerCase()}`, en: L.toLowerCase(), ja: `${ja}（こもじ）`, pic: L.toLowerCase(), lv: 1, cat: 'letter', isNum: true, photo: null, hasPic: true, letter: true });
}
export const BY_ID = Object.fromEntries([...WORDS, ...LETTERS].map(w => [w.id, w]));

export function excluded(catA, catB) {
  return EXCLUDE.some(([a, b]) => (a === catA && b === catB) || (a === catB && b === catA));
}
