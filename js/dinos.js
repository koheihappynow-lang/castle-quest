// ダイナソークエスト：恐竜・えさ・すみか・かざりのデータ
// お金は キャッスルクエストとは 別の おさいふ。通貨の しくみ（円→ドル・ユーロ・ポンド・元）は 同じ

// ---------- 育ち方 ----------
// 段階（growth は 0〜100）。たまご → あかちゃん → こども → わかもの → おとな
export const STAGES = [
  { id: 'baby', name: 'あかちゃん', en: 'baby', from: 0 },
  { id: 'child', name: 'こども', en: 'child', from: 25 },
  { id: 'young', name: 'わかもの', en: 'young', from: 55 },
  { id: 'adult', name: 'おとな', en: 'adult', from: 85 },
];
export const MAX_GROWTH = 100;
// 見た目の変化（0 = あかちゃん、1 = おとな の あいだを 少しずつ）
// fluff：産毛の量（1 = 全身、0 = なし）、hue：色の こさ（0 = 明るい、1 = こい）、spots：斑点の こさ
export const LOOK_BY_STAGE = {
  baby: { fluff: 1.0, dark: 0.0, spots: 1.0 },
  child: { fluff: 0.6, dark: 0.35, spots: 0.5 },
  young: { fluff: 0.25, dark: 0.7, spots: 0.15 },
  adult: { fluff: 0.08, dark: 1.0, spots: 0.0 },
};

// ---------- えさ ----------
// grow：あげると 育つ量。price：1こ の ねだん（円）。1ぴき おとなまで 約300問になるように 決めている
// （正解1問 ≒ 1,200円、えさ1こ 6,000円 ≒ 5問ぶん で grow 2 → 50こ で おとな ≒ 250問 ＋ すみか づくり）
export const FOOD_PRICE_YEN = 6000;
export const FOODS = {
  meat: { name: 'おにく', en: 'meat', icon: '🍖', grow: 2 },
  fish: { name: 'おさかな', en: 'fish', icon: '🐟', grow: 2 },
  fern: { name: 'シダの はっぱ', en: 'fern', icon: '🌿', grow: 2 },
  leaves: { name: 'たかい きの はっぱ', en: 'leaves', icon: '🍃', grow: 2 },
  cycad: { name: 'ソテツの み', en: 'cycad seeds', icon: '🌰', grow: 2 },
  feast: { name: 'とくべつな ごちそう', en: 'feast', icon: '🎂', grow: 6, priceMul: 2.5 },
};

// ---------- すみか（30パーツ＝10だんかい × 3） ----------
export const HOME_PARTS_PER_DINO = 30;
export const HOME_PART_PRICE = { yen: 6000, dollar: 40, euro: 35, pound: 30, yuan: 250 };
export const HOME_STAGES = [
  'じめんを ならす', 'さく', 'みずのみば', 'ねどこ', 'きと シダ',
  'いわと ほらあな', 'ひよけの やね', 'えさば', 'あそびば', 'かんばんと ライト',
];

// ---------- かざり ----------
export const ACCESSORIES = [
  { id: 'ribbon', name: 'リボン', en: 'ribbon', icon: '🎀', price: 8000, at: 'head' },
  { id: 'scarf', name: 'マフラー', en: 'scarf', icon: '🧣', price: 10000, at: 'neck' },
  { id: 'bell', name: 'すずの くびわ', en: 'bell collar', icon: '🔔', price: 10000, at: 'neck' },
  { id: 'cap', name: 'ぼうし', en: 'cap', icon: '🧢', price: 12000, at: 'head' },
  { id: 'flower', name: 'はなかんむり', en: 'flower crown', icon: '🌼', price: 12000, at: 'head' },
  { id: 'glasses', name: 'サングラス', en: 'sunglasses', icon: '🕶️', price: 15000, at: 'eyes' },
  { id: 'cape', name: 'マント', en: 'cape', icon: '🦸', price: 20000, at: 'back' },
  { id: 'crown', name: 'おうかん', en: 'crown', icon: '👑', price: 40000, at: 'head' },
];

// ---------- 恐竜 ----------
// size：おとなの 全長（m）。era：生きていた 時代（万年前）。facts は 図鑑に のせる みじかい まめちしき
export const DINOS = [
  {
    id: 'trex', name: 'ティラノサウルス', en: 'Tyrannosaurus', nick: 'T. rex', country: 'アメリカ・カナダ', flag: '🇺🇸',
    food: 'meat', size: 12, era: [6800, 6600], dino: true,
    desc: 'ティラノサウルスは「あばれんぼうの とかげの おうさま」という いみの なまえだよ。あたまが とても おおきくて、かむ ちからは どうぶつの なかでも トップクラス。バナナより おおきな はが ならんでいたんだ。うでは ちいさくて、ゆびは 2ほん。おおきな からだで、やく 6600まんねん まえまで くらしていたよ。',
    say: 'ティラノサウルスは、暴れん坊のトカゲの王様という意味の名前だよ。頭がとても大きくて、かむ力は動物の中でもトップクラス。バナナより大きな歯が並んでいたんだ。腕は小さくて、指は二本。大きな体で、およそ六千六百万年前まで暮らしていたよ。',
    line: 'This is Tyrannosaurus rex.',
  },
  {
    id: 'triceratops', name: 'トリケラトプス', en: 'Triceratops', country: 'アメリカ・カナダ', flag: '🇺🇸',
    food: 'fern', size: 9, era: [6800, 6600], dino: true,
    desc: 'トリケラトプスは「3ぼんの ツノが ある かお」という いみだよ。はなの うえに 1ぽん、めの うえに ながい ツノが 2ほん。あたまの うしろには「フリル」という おおきな えりかざりが あるよ。くちばしで しょくぶつを むしゃむしゃ たべていたんだ。ティラノサウルスと おなじ じだいに くらしていたよ。',
    say: 'トリケラトプスは、三本の角がある顔という意味だよ。鼻の上に一本、目の上に長い角が二本。頭の後ろには、フリルという大きな襟飾りがあるよ。くちばしで植物をむしゃむしゃ食べていたんだ。ティラノサウルスと同じ時代に暮らしていたよ。',
    line: 'This is Triceratops.',
  },
  {
    id: 'stegosaurus', name: 'ステゴサウルス', en: 'Stegosaurus', country: 'アメリカ・ポルトガル', flag: '🇺🇸',
    food: 'fern', size: 9, era: [15500, 15000], dino: true,
    desc: 'ステゴサウルスは、せなかに ならんだ おおきな「いた」が めじるしだよ。しっぽの さきには するどい トゲが 4ほん あって、みを まもるのに つかっていたんだ。からだは おおきいのに、あたまは とても ちいさいよ。ティラノサウルスより ずっと むかし、やく 1おく5000まんねん まえに くらしていたんだ。',
    say: 'ステゴサウルスは、背中に並んだ大きな板が目印だよ。しっぽの先には鋭いトゲが四本あって、身を守るのに使っていたんだ。体は大きいのに、頭はとても小さいよ。ティラノサウルスよりずっと昔、およそ一億五千万年前に暮らしていたんだ。',
    line: 'This is Stegosaurus.',
  },
  {
    id: 'brachiosaurus', name: 'ブラキオサウルス', en: 'Brachiosaurus', country: 'アメリカ', flag: '🇺🇸',
    food: 'leaves', size: 22, era: [15400, 15300], dino: true,
    desc: 'ブラキオサウルスは、くびが とても ながい おおきな きょうりゅうだよ。まえあしが うしろあしより ながいから、キリンみたいに あたまを たかく あげて、たかい きの はっぱを たべていたんだ。あたまの たかさは 4かいだての たてもの くらい。なまえは「うでの とかげ」という いみだよ。',
    say: 'ブラキオサウルスは、首がとても長い大きな恐竜だよ。前足が後ろ足より長いから、キリンみたいに頭を高く上げて、高い木の葉っぱを食べていたんだ。頭の高さは四階建ての建物くらい。名前は、腕のトカゲという意味だよ。',
    line: 'This is Brachiosaurus.',
  },
  {
    id: 'velociraptor', name: 'ヴェロキラプトル', en: 'Velociraptor', country: 'モンゴル', flag: '🇲🇳',
    food: 'meat', size: 2, era: [7500, 7100], dino: true,
    desc: 'ヴェロキラプトルは「すばやい どろぼう」という いみの なまえだよ。からだは おおきな いぬ くらいで、はしるのが とても はやかったんだ。うしろあしには かぎの ような おおきな ツメが あるよ。うでの ほねに はねが ついていた あとが みつかっていて、はねが はえた きょうりゅうだったと わかっているんだ。',
    say: 'ヴェロキラプトルは、すばやい泥棒という意味の名前だよ。体は大きな犬くらいで、走るのがとても速かったんだ。後ろ足には、かぎのような大きな爪があるよ。腕の骨に羽がついていた跡が見つかっていて、羽が生えた恐竜だったとわかっているんだ。',
    line: 'This is Velociraptor.',
  },
  {
    id: 'spinosaurus', name: 'スピノサウルス', en: 'Spinosaurus', country: 'エジプト・モロッコ', flag: '🇪🇬',
    food: 'fish', size: 15, era: [9900, 9300], dino: true,
    desc: 'スピノサウルスは、せなかに おおきな「ほ」が ある きょうりゅうだよ。ワニの ように ほそながい くちで、さかなを つかまえて たべていたんだ。みずの なかで くらすのが とくいだったと かんがえられているよ。からだの ながさは ティラノサウルスより ながかったと いわれているんだ。',
    say: 'スピノサウルスは、背中に大きな帆がある恐竜だよ。ワニのように細長い口で、魚を捕まえて食べていたんだ。水の中で暮らすのが得意だったと考えられているよ。体の長さは、ティラノサウルスより長かったと言われているんだ。',
    line: 'This is Spinosaurus.',
  },
  {
    id: 'ankylosaurus', name: 'アンキロサウルス', en: 'Ankylosaurus', country: 'カナダ・アメリカ', flag: '🇨🇦',
    food: 'fern', size: 7, era: [6800, 6600], dino: true,
    desc: 'アンキロサウルスは、からだじゅうが かたい「よろい」で おおわれた きょうりゅうだよ。しっぽの さきには ほねの かたまりの「ハンマー」が あって、ぶんぶん ふって みを まもったんだ。あしは みじかくて、ひくい ところの しょくぶつを たべていたよ。うごく せんしゃ みたいだね。',
    say: 'アンキロサウルスは、体じゅうが硬い鎧で覆われた恐竜だよ。しっぽの先には骨のかたまりのハンマーがあって、ぶんぶん振って身を守ったんだ。足は短くて、低いところの植物を食べていたよ。動く戦車みたいだね。',
    line: 'This is Ankylosaurus.',
  },
  {
    id: 'iguanodon', name: 'イグアノドン', en: 'Iguanodon', country: 'ベルギー・イギリス', flag: '🇧🇪',
    food: 'fern', size: 10, era: [12600, 12500], dino: true,
    desc: 'イグアノドンは、せかいで 2ばんめに なまえが ついた きょうりゅうだよ。はが イグアナという とかげの はに にていたから、この なまえに なったんだ。てには とがった おやゆびの トゲが あるよ。ベルギーの たんこうでは、30とう いじょうが まとめて みつかったんだ。',
    say: 'イグアノドンは、世界で二番目に名前がついた恐竜だよ。歯がイグアナというトカゲの歯に似ていたから、この名前になったんだ。手にはとがった親指のトゲがあるよ。ベルギーの炭鉱では、三十頭以上がまとめて見つかったんだ。',
    line: 'This is Iguanodon.',
  },
  {
    id: 'parasaurolophus', name: 'パラサウロロフス', en: 'Parasaurolophus', country: 'カナダ・アメリカ', flag: '🇨🇦',
    food: 'leaves', size: 9, era: [7600, 7300], dino: true,
    desc: 'パラサウロロフスは、あたまの うしろに ながい「トサカ」が ある きょうりゅうだよ。トサカの なかは くだのように なっていて、ラッパの ように「ぶおー」と おとを だして なかまと はなしていたと かんがえられているんだ。くちは カモの くちばしに にているよ。',
    say: 'パラサウロロフスは、頭の後ろに長いトサカがある恐竜だよ。トサカの中は管のようになっていて、ラッパのようにぶおーと音を出して、仲間と話していたと考えられているんだ。口はカモのくちばしに似ているよ。',
    line: 'This is Parasaurolophus.',
  },
  {
    id: 'pteranodon', name: 'プテラノドン', en: 'Pteranodon', country: 'アメリカ', flag: '🇺🇸',
    food: 'fish', size: 7, sizeNote: 'つばさを ひろげた はば', era: [8600, 8400], dino: false,
    desc: 'プテラノドンは、そらを とぶ「よくりゅう」だよ。きょうりゅうと おなじ じだいに いた なかまだけど、じつは きょうりゅうでは ないんだ。つばさを ひろげると 7メートルくらい。なまえは「はのない つばさ」という いみで、くちに はが なかったよ。うみの うえを とんで、さかなを たべていたんだ。',
    say: 'プテラノドンは、空を飛ぶ翼竜だよ。恐竜と同じ時代にいた仲間だけど、実は恐竜ではないんだ。翼を広げると七メートルくらい。名前は、歯のない翼という意味で、口に歯がなかったよ。海の上を飛んで、魚を食べていたんだ。',
    line: 'This is Pteranodon.',
  },
  {
    id: 'fukuiraptor', name: 'フクイラプトル', en: 'Fukuiraptor', country: 'にほん（ふくいけん）', flag: '🇯🇵', rare: true,
    food: 'meat', size: 4, era: [12000, 12000], dino: true,
    desc: 'フクイラプトルは、にほんの ふくいけんで みつかった にくしょくの きょうりゅうだよ。なまえは「ふくいの どろぼう」という いみ。てには おおきな かぎづめが あって、すばやく はしって えものを つかまえていたんだ。ふくいけんは きょうりゅうの かせきが たくさん みつかる「きょうりゅうの まち」なんだよ。',
    say: 'フクイラプトルは、日本の福井県で見つかった肉食の恐竜だよ。名前は、福井の泥棒という意味。手には大きなかぎ爪があって、すばやく走って獲物を捕まえていたんだ。福井県は恐竜の化石がたくさん見つかる、恐竜の町なんだよ。',
    line: 'This is Fukuiraptor.',
  },
];
export const DINO_BY_ID = Object.fromEntries(DINOS.map(d => [d.id, d]));
export const NORMAL_DINOS = DINOS.filter(d => !d.rare);

export function stageOf(growth) {
  let s = STAGES[0];
  for (const st of STAGES) if (growth >= st.from) s = st;
  return s;
}
// 段階の あいだを なめらかに つないだ 見た目
export function lookFor(growth) {
  const g = Math.max(0, Math.min(MAX_GROWTH, growth));
  const idx = STAGES.findIndex((s, i) => g < (STAGES[i + 1]?.from ?? Infinity));
  const a = STAGES[idx], b = STAGES[idx + 1];
  const la = LOOK_BY_STAGE[a.id];
  if (!b) return { ...la };
  const lb = LOOK_BY_STAGE[b.id];
  const t = (g - a.from) / (b.from - a.from);
  const mix = k => la[k] + (lb[k] - la[k]) * t;
  return { fluff: mix('fluff'), dark: mix('dark'), spots: mix('spots') };
}
