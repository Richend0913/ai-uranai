/* ============================================
   AI占い師 — Fortune Generation Engine
   Deterministic algorithms based on name + birthday + blood type
   ============================================ */

// ====== Stroke count data (simplified kanji stroke lookup) ======
const STROKE_MAP = {
  // Common hiragana
  'あ':3,'い':2,'う':2,'え':2,'お':3,'か':3,'き':4,'く':1,'け':4,'こ':2,
  'さ':3,'し':1,'す':2,'せ':3,'そ':1,'た':4,'ち':2,'つ':1,'て':1,'と':2,
  'な':4,'に':3,'ぬ':2,'ね':2,'の':1,'は':3,'ひ':1,'ふ':4,'へ':1,'ほ':4,
  'ま':3,'み':2,'む':3,'め':2,'も':3,'や':3,'ゆ':2,'よ':2,
  'ら':2,'り':2,'る':1,'れ':2,'ろ':1,'わ':2,'を':3,'ん':1,
  // Common katakana
  'ア':2,'イ':2,'ウ':3,'エ':3,'オ':3,'カ':2,'キ':3,'ク':2,'ケ':3,'コ':2,
  'サ':3,'シ':3,'ス':2,'セ':3,'ソ':2,'タ':3,'チ':3,'ツ':3,'テ':3,'ト':2,
  'ナ':2,'ニ':2,'ヌ':2,'ネ':4,'ノ':1,'ハ':2,'ヒ':2,'フ':1,'ヘ':1,'ホ':4,
  'マ':2,'ミ':3,'ム':2,'メ':2,'モ':3,'ヤ':2,'ユ':2,'ヨ':3,
  'ラ':2,'リ':2,'ル':2,'レ':1,'ロ':3,'ワ':2,'ヲ':3,'ン':2,
  // Common kanji (extended set)
  '山':3,'田':5,'中':4,'大':3,'小':3,'川':3,'上':3,'下':3,'木':4,'林':8,
  '森':12,'村':7,'花':8,'月':4,'日':4,'年':6,'人':2,'子':3,'女':3,'男':7,
  '太':4,'郎':10,'一':1,'二':2,'三':3,'四':5,'五':4,'六':4,'七':2,'八':2,
  '九':2,'十':2,'百':6,'千':3,'万':3,'美':9,'愛':13,'幸':8,'恵':10,'真':10,
  '優':17,'翔':12,'空':8,'海':9,'光':6,'明':8,'和':8,'健':11,'康':11,'正':5,
  '勇':9,'義':13,'信':9,'誠':14,'友':4,'智':12,'知':8,'理':11,'哲':10,'学':8,
  '秀':7,'英':8,'雄':12,'伸':7,'直':8,'清':11,'道':13,'春':9,'夏':10,'秋':9,
  '冬':5,'東':8,'西':6,'南':9,'北':5,'高':10,'橋':16,'藤':18,'佐':7,'伊':6,
  '加':5,'井':4,'石':5,'岡':8,'松':8,'竹':6,'梅':10,'桜':10,'鈴':13,'渡':12,
  '辺':6,'斎':11,'斉':8,'吉':6,'福':14,'長':8,'野':11,'島':10,'宮':10,'本':5,
  '安':6,'平':5,'成':7,'令':5,'新':13,'古':5,'青':8,'白':5,'赤':7,'黒':11,
  '金':8,'銀':14,'星':9,'雨':8,'雪':11,'風':9,'雲':12,'龍':16,'虎':8,'鶴':21,
  '亀':11,'鳳':14,'凛':15,'蓮':13,'陽':12,'結':12,'咲':9,'彩':11,'香':9,'菜':11,
  '奈':8,'葵':12,'紗':10,'莉':10,'栞':10,'凪':6,'湊':12,'蒼':13,'樹':16,'悠':11,
  '颯':14,'朝':12,'昼':9,'夜':8,'天':4,'地':6,'火':4,'水':4,'土':3,'気':6,
};

// ====== Zodiac signs ======
const ZODIAC = [
  { name: '山羊座', symbol: '\u2651', element: '地', start: [1,1], end: [1,19] },
  { name: '水瓶座', symbol: '\u2652', element: '風', start: [1,20], end: [2,18] },
  { name: '魚座', symbol: '\u2653', element: '水', start: [2,19], end: [3,20] },
  { name: '牡羊座', symbol: '\u2648', element: '火', start: [3,21], end: [4,19] },
  { name: '牡牛座', symbol: '\u2649', element: '地', start: [4,20], end: [5,20] },
  { name: '双子座', symbol: '\u264A', element: '風', start: [5,21], end: [6,21] },
  { name: '蟹座', symbol: '\u264B', element: '水', start: [6,22], end: [7,22] },
  { name: '獅子座', symbol: '\u264C', element: '火', start: [7,23], end: [8,22] },
  { name: '乙女座', symbol: '\u264D', element: '地', start: [8,23], end: [9,22] },
  { name: '天秤座', symbol: '\u264E', element: '風', start: [9,23], end: [10,23] },
  { name: '蠍座', symbol: '\u264F', element: '水', start: [10,24], end: [11,22] },
  { name: '射手座', symbol: '\u2650', element: '火', start: [11,23], end: [12,21] },
  { name: '山羊座', symbol: '\u2651', element: '地', start: [12,22], end: [12,31] },
];

// ====== Blood type personality traits ======
const BLOOD_TRAITS = {
  'A': {
    personality: '几帳面で真面目、繊細な心の持ち主',
    strengths: ['責任感が強い', '思いやりがある', '計画的に行動できる', '芸術的なセンスがある'],
    weaknesses: ['心配性な面がある', '自分を追い込みがち', '人の目を気にしすぎる'],
    love: '一途で誠実な恋愛をする傾向があります。相手を深く理解しようとし、長期的な関係を大切にします。',
    work: '緻密な作業が得意で、チームの中で信頼される存在。クリエイティブな分野でも力を発揮します。',
    compatibility: ['A', 'O'],
    lucky_element: '水'
  },
  'B': {
    personality: '自由奔放でマイペース、独創的な発想の持ち主',
    strengths: ['創造力が豊か', '好奇心旺盛', '決断力がある', '柔軟な発想ができる'],
    weaknesses: ['飽きやすい面がある', '自分のペースを崩されるのが苦手', '集団行動が苦手なことも'],
    love: '情熱的で刺激的な恋愛を求める傾向があります。束縛を嫌い、お互いの個性を尊重する関係を好みます。',
    work: '独創的なアイデアで道を切り開く開拓者タイプ。自由度の高い環境で最大の力を発揮します。',
    compatibility: ['B', 'AB'],
    lucky_element: '火'
  },
  'O': {
    personality: 'おおらかでリーダーシップがある、情熱的な行動派',
    strengths: ['リーダーシップがある', '大胆な行動力', '仲間思い', '目標達成能力が高い'],
    weaknesses: ['大雑把になりがち', '頑固な面がある', '自己主張が強くなることも'],
    love: '情に厚く、愛する人を全力で守ろうとします。ロマンチストで、ドラマチックな恋愛を好む傾向があります。',
    work: 'チームを率いる力があり、大きなプロジェクトで力を発揮。目標に向かって粘り強く取り組めます。',
    compatibility: ['O', 'A'],
    lucky_element: '地'
  },
  'AB': {
    personality: '理知的で二面性を持つ、天才肌のバランサー',
    strengths: ['知的好奇心が強い', '冷静な判断力', '多才', 'バランス感覚に優れる'],
    weaknesses: ['気分の波がある', '本心が読まれにくい', '二面性を感じさせることも'],
    love: '知的な会話を楽しめる相手を求めます。精神的なつながりを重視し、洗練された大人の恋愛を好みます。',
    work: '分析力と創造力を兼ね備えた万能タイプ。複雑な問題を解決する力に長けています。',
    compatibility: ['AB', 'B'],
    lucky_element: '風'
  }
};

// ====== Phrase Libraries ======
const PERSONALITY_PHRASES = [
  'あなたは周囲の人を自然と惹きつけるカリスマ性を秘めています。',
  '内に秘めた情熱が、人生の大きな転機を生み出す力となるでしょう。',
  '繊細な感性と力強い意志を兼ね備えた、稀有な魂の持ち主です。',
  '直感力に優れ、本質を見抜く力が人並み外れています。',
  '温かい心と冷静な判断力のバランスが取れた、理想的な性格です。',
  '創造性に富み、新しいことに挑戦する勇気を持っています。',
  '人の痛みがわかる共感力と、それを行動に移す実行力があります。',
  '粘り強さと柔軟性を持ち合わせ、困難を乗り越える力があります。',
  '知的好奇心が旺盛で、常に成長し続ける向上心の持ち主です。',
  '周囲に安心感を与える包容力と、確かな芯の強さを持っています。',
  '独自の世界観を持ち、それを表現する才能に恵まれています。',
  '先見の明があり、時代の流れを読む力に長けています。',
];

const FORTUNE_GENERAL = [
  '今期は大きな転換期を迎えています。これまでの努力が実を結び、新たなステージへと進むことになるでしょう。特に{month}月は重要な出来事が起こりやすい時期です。自分の直感を信じて行動することで、想像以上の成果を得られるはずです。',
  '運気は上昇傾向にあります。特に人間関係において良い変化が訪れるでしょう。新しい出会いがあなたの人生に大きなプラスをもたらします。{month}月以降は特に社交運が高まり、重要な人脈が広がる時期です。',
  '今は基盤を固める時期です。焦らず着実に進むことで、後に大きな飛躍が待っています。{month}月頃に転機が訪れ、そこでの選択が今後の運命を大きく左右します。慎重さと大胆さのバランスが鍵となるでしょう。',
  '創造的なエネルギーに満ちた時期です。新しいプロジェクトや趣味を始めるのに最適なタイミング。{month}月には思いがけないチャンスが巡ってきます。それを逃さないよう、常にアンテナを張っておきましょう。',
  '精神的な成長が著しい時期。自分自身と向き合うことで、新たな才能や可能性に気づくことができるでしょう。{month}月は内省の時間を大切にしてください。そこから得られる気づきが、今後の人生の指針となります。',
  '行動力が高まる時期です。やりたいと思っていたことに積極的に挑戦することで、運気が一気に開けていきます。{month}月は特に勝負運が強く、ここぞという場面で底力を発揮できるでしょう。',
];

const FORTUNE_LOVE = [
  '恋愛運は非常に良好な流れにあります。{status}あなたの魅力が最大限に輝く時期で、異性からの注目度が高まっています。特にあなたの{trait}な一面が、相手の心を強く惹きつけるでしょう。素直な気持ちを表現することを恐れないでください。',
  '恋愛においては大きな変化の波が押し寄せています。{status}あなたの{trait}な性格が、運命の出会いや関係の深化を引き寄せています。心を開いて新しい可能性を受け入れることで、想像以上の幸せが待っています。',
  '穏やかだけれど確かな恋愛運の上昇が見られます。{status}あなたの{trait}な魅力が、じわじわと相手の心に浸透していく時期です。急がず、自然体でいることが最も良い結果を生むでしょう。',
  '情熱的なエネルギーに満ちた恋愛期に入っています。{status}あなたの{trait}な部分に強く惹かれる人が現れそうです。思い切った行動が幸運を呼び込みます。自分の気持ちに正直になることが大切です。',
];

const LOVE_STATUS_SINGLE = [
  '現在フリーの方は、日常のふとした場面に出会いのチャンスが隠れています。',
  'パートナーを探している方には、友人の紹介や趣味の集まりに良縁の兆しがあります。',
  '恋人がいない方も心配いりません。あなたにふさわしい相手が近づいています。',
];

const LOVE_STATUS_COUPLED = [
  'パートナーがいる方は、二人の絆がより深まる出来事が起こるでしょう。',
  '恋人がいる方は、互いの理解が深まり、次のステップに進む時期です。',
  '交際中の方は、相手の新たな魅力に気づく場面が増えるでしょう。',
];

const FORTUNE_WORK = [
  '仕事運は力強い上昇気流の中にあります。あなたの{strength}が高く評価される時期です。特にチームワークが求められる場面であなたの存在感が際立ちます。新しいプロジェクトへの参加やスキルアップの機会を積極的に掴みましょう。昇進や異動など、キャリアにおける重要な動きも期待できます。',
  'キャリアにおいて実り多い時期を迎えています。あなたの{strength}を活かせる場面が増え、周囲からの信頼も厚くなっています。独創的なアイデアが採用されやすい時期なので、提案を恐れないでください。長期的な視点でキャリアプランを見直すのにも良いタイミングです。',
  '仕事においては着実な成長の時期です。目の前の課題に真摯に向き合うことで、{strength}がさらに磨かれていきます。焦らず一歩一歩前進することが大切です。年の後半には、その積み重ねが大きな成果として現れるでしょう。',
  '変化とチャンスに恵まれた仕事運です。あなたの{strength}を求める声が増え、活躍の場が広がります。新しい分野への挑戦も吉。転職や独立を考えている方には、追い風が吹く時期です。ただし準備は怠らないようにしましょう。',
];

const FORTUNE_MONEY = [
  '金運は安定した上昇傾向にあります。計画的な資金管理を心がけることで、着実に資産を増やしていけるでしょう。思わぬ臨時収入の可能性もあります。投資に興味がある方は、少額から始めてみるのも良いでしょう。ただし、衝動的な大きな出費には注意が必要です。',
  '金運は好転の兆しを見せています。これまでの堅実な姿勢が報われる時期。副収入やボーナスなど、プラスの変化が期待できます。自己投資にお金を使うことで、将来的なリターンが得られそうです。貯蓄と投資のバランスを意識してください。',
  '財運は穏やかに推移しています。大きな浪費さえ避ければ、安定した生活を維持できます。特に知識やスキルへの投資が将来の収入アップにつながります。節約と自己投資のメリハリをつけることが大切です。',
  '金運に勢いがある時期です。新しい収入源の開拓や、投資のチャンスが巡ってきそうです。ただし、うまい話には慎重になること。確実性のあるものに集中して取り組むことで、着実に財を築いていけるでしょう。',
];

const FORTUNE_HEALTH = [
  'エネルギーに満ちた時期ですが、無理のしすぎには注意が必要です。特に{season}は体調を崩しやすい傾向があります。規則正しい睡眠と、バランスの取れた食事を心がけてください。ストレス解消には自然の中での散歩や、瞑想が効果的です。適度な運動を習慣にすることで、心身ともに充実した日々を過ごせるでしょう。',
  '全体的に良好な健康運です。特に精神面での安定が期待できます。{season}は少し気を緩めがちになるので、生活リズムを整えることを意識してください。ヨガやストレッチなど、体をほぐす習慣が運気をさらに高めてくれます。',
  '心と体のバランスを意識することが大切な時期です。{season}に向けて体力をつけておくと良いでしょう。十分な休養と栄養摂取を心がけ、自分のペースを大切にしてください。リラクゼーションの時間を確保することで、自然治癒力が高まります。',
];

const MONTHLY_ADVICE = [
  '今月は「始まり」のエネルギーに満ちています。新しいことを始めるなら今がベストタイミング。小さな一歩でも構いません。その一歩が、大きな変化の始まりとなるでしょう。迷ったときは、心が躍る方を選んでください。',
  '今月は「つながり」がテーマです。大切な人との時間を優先し、感謝の気持ちを言葉にして伝えましょう。新しい出会いにも恵まれやすい時期です。積極的に人と関わることで、運気が大きく開けていきます。',
  '今月は「内省」の時期です。忙しさから少し離れて、自分自身と向き合う時間を作ってください。心の声に耳を傾けることで、これからの進むべき道が明確になるでしょう。読書や芸術鑑賞もおすすめです。',
  '今月は「挑戦」のエネルギーが高まっています。これまでためらっていたことに挑戦する勇気が与えられています。失敗を恐れず、自分の可能性を信じて前に進んでください。周囲のサポートも得られやすい時期です。',
  '今月は「調和」がキーワードです。人間関係において、バランスを取ることが重要になります。自分の意見をしっかり伝えつつも、相手の立場を理解する姿勢を忘れないでください。穏やかな心で過ごすことが幸運を引き寄せます。',
  '今月は「変容」の時期です。古い習慣や考え方を手放し、新しい自分に生まれ変わるチャンスです。変化を恐れず、流れに身を任せてみてください。想像以上にスムーズな変化が訪れるでしょう。',
];

const LUCKY_ITEMS = [
  'シルバーのアクセサリー', '青い花', '古書', 'ハーブティー', '天然石のブレスレット',
  'レザーの小物', 'ラベンダーの香り', '手書きの手紙', 'キャンドル', '月のモチーフ',
  '星形のアクセサリー', 'オーガニックコスメ', '観葉植物', 'ヴィンテージの時計', 'シルクのスカーフ',
  '琥珀色の飲み物', '手作りのお菓子', 'アロマオイル', '金色の小物', 'クリスタル',
  '紫のハンカチ', '木の素材のアイテム', '水色のペン', 'お守り', 'フォトフレーム',
  '真珠のアクセサリー', '白檀の香り', '陶器のカップ', 'ドライフラワー', '革の手帳',
];

const LUCKY_COLORS = [
  'ロイヤルブルー', 'エメラルドグリーン', 'ラベンダー', 'ゴールド', 'コーラルピンク',
  'ミッドナイトネイビー', 'サーモンピンク', 'アイボリー', 'ターコイズ', 'バーガンディ',
  'シャンパンゴールド', 'モスグリーン', 'ローズピンク', 'インディゴ', 'アンバー',
];

const LUCKY_SPOTS = [
  '水辺のカフェ', '高台のある公園', '古い街並みの路地', '神社やお寺', '美術館',
  '夜景の見える場所', '図書館', '植物園', '温泉地', '海沿いの道',
  '森の中の小道', '歴史ある建物', '天文台', '小さな雑貨店', '音楽が流れるバー',
];

const COMPATIBLE_ZODIAC = {
  '牡羊座': ['獅子座', '射手座', '水瓶座'],
  '牡牛座': ['乙女座', '山羊座', '蟹座'],
  '双子座': ['天秤座', '水瓶座', '獅子座'],
  '蟹座': ['蠍座', '魚座', '牡牛座'],
  '獅子座': ['牡羊座', '射手座', '双子座'],
  '乙女座': ['牡牛座', '山羊座', '蠍座'],
  '天秤座': ['双子座', '水瓶座', '獅子座'],
  '蠍座': ['蟹座', '魚座', '乙女座'],
  '射手座': ['牡羊座', '獅子座', '水瓶座'],
  '山羊座': ['牡牛座', '乙女座', '蠍座'],
  '水瓶座': ['双子座', '天秤座', '射手座'],
  '魚座': ['蟹座', '蠍座', '牡牛座'],
};

// ====== Core Algorithms ======

/**
 * Simple deterministic hash function
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Seeded pseudo-random number generator
 */
function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/**
 * Calculate total stroke count for a name
 */
function calcStrokes(name) {
  let total = 0;
  for (const char of name) {
    total += STROKE_MAP[char] || (char.charCodeAt(0) % 15 + 3);
  }
  return total;
}

/**
 * Get zodiac sign from birthday
 */
function getZodiac(month, day) {
  for (const z of ZODIAC) {
    const [sm, sd] = z.start;
    const [em, ed] = z.end;
    if (sm === em) {
      if (month === sm && day >= sd && day <= ed) return z;
    } else {
      if ((month === sm && day >= sd) || (month === em && day <= ed)) return z;
    }
  }
  return ZODIAC[0]; // fallback
}

/**
 * Get 姓名判断 interpretation
 */
function getNameFortune(strokes) {
  const mod = strokes % 10;
  const meanings = [
    { luck: '大吉', desc: '天賦の才能と強運に恵まれた格数です。何をやっても成功する星の下に生まれています。' },
    { luck: '吉',   desc: 'リーダーシップと独立心に溢れた格数。自分の力で道を切り開いていく運命です。' },
    { luck: '中吉', desc: '協調性と感受性に優れた格数。人との縁が幸運を呼び込みます。' },
    { luck: '大吉', desc: '表現力と創造性に恵まれた格数。芸術的な才能が開花する運命です。' },
    { luck: '吉',   desc: '安定感と実直さを示す格数。着実な努力が大きな成果を生みます。' },
    { luck: '大吉', desc: '変化と自由を愛する格数。多彩な経験が人生を豊かに彩ります。' },
    { luck: '吉',   desc: '愛情深く責任感のある格数。家庭や組織の柱として力を発揮します。' },
    { luck: '中吉', desc: '分析力と探究心に優れた格数。知識の深さが武器となります。' },
    { luck: '大吉', desc: 'パワフルで野心的な格数。大きな目標を達成する力を持っています。' },
    { luck: '吉',   desc: '博愛精神と奉仕の心を持つ格数。人のために尽くすことで自身も輝きます。' },
  ];
  return meanings[mod];
}

/**
 * Generate the free basic reading
 */
function generateBasicReading(name, year, month, day, gender, blood) {
  const strokes = calcStrokes(name);
  const zodiac = getZodiac(month, day);
  const nameFortune = getNameFortune(strokes);
  const bloodInfo = BLOOD_TRAITS[blood];
  const seed = hashCode(name + year + month + day + blood);
  const rng = seededRandom(seed);

  // Personality summary
  const personalityIdx = Math.floor(rng() * PERSONALITY_PHRASES.length);
  const personality = PERSONALITY_PHRASES[personalityIdx];

  // Lucky number from seed
  const luckyNumber = (seed % 9) + 1;

  // Lucky color
  const colorIdx = Math.floor(rng() * LUCKY_COLORS.length);
  const luckyColor = LUCKY_COLORS[colorIdx];

  // Today's advice
  const today = new Date();
  const todaySeed = hashCode(name + today.getFullYear() + (today.getMonth()+1) + today.getDate());
  const todayRng = seededRandom(todaySeed);
  const adviceIdx = Math.floor(todayRng() * MONTHLY_ADVICE.length);

  return {
    name,
    zodiac,
    blood,
    bloodInfo,
    strokes,
    nameFortune,
    personality,
    luckyNumber,
    luckyColor,
    todayAdvice: MONTHLY_ADVICE[adviceIdx],
    gender,
    year, month, day
  };
}

/**
 * Generate the full detailed premium reading
 */
function generateDetailedReading(name, year, month, day, gender, blood) {
  const strokes = calcStrokes(name);
  const zodiac = getZodiac(month, day);
  const bloodInfo = BLOOD_TRAITS[blood];
  const seed = hashCode(name + year + month + day + blood + 'premium');
  const rng = seededRandom(seed);

  // Helper to pick from array
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];

  // Key month
  const keyMonth = Math.floor(rng() * 12) + 1;

  // General fortune
  const generalTemplate = pick(FORTUNE_GENERAL);
  const general = generalTemplate.replace('{month}', keyMonth);

  // Love fortune
  const loveTemplate = pick(FORTUNE_LOVE);
  const loveStatus = pick(Math.floor(rng() * 2) === 0 ? LOVE_STATUS_SINGLE : LOVE_STATUS_COUPLED);
  const loveTrait = pick(bloodInfo.strengths);
  const love = loveTemplate.replace('{status}', loveStatus + ' ').replace('{trait}', loveTrait);

  // Work fortune
  const workTemplate = pick(FORTUNE_WORK);
  const workStrength = pick(bloodInfo.strengths);
  const work = workTemplate.replace('{strength}', workStrength);

  // Money fortune
  const money = pick(FORTUNE_MONEY);

  // Health fortune
  const seasons = ['春先', '梅雨時期', '夏場', '秋口', '冬場'];
  const healthTemplate = pick(FORTUNE_HEALTH);
  const health = healthTemplate.replace('{season}', pick(seasons));

  // Monthly advice
  const monthlyAdvice = pick(MONTHLY_ADVICE);

  // Lucky items
  const luckyItem = pick(LUCKY_ITEMS);
  const luckyItem2 = pick(LUCKY_ITEMS.filter(i => i !== luckyItem));
  const luckyColor = pick(LUCKY_COLORS);
  const luckySpot = pick(LUCKY_SPOTS);
  const luckyNumber = (seed % 99) + 1;
  const luckyDay = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日'][seed % 7];

  // Compatibility
  const compatZodiac = COMPATIBLE_ZODIAC[zodiac.name] || ['牡羊座', '蟹座', '天秤座'];
  const compatBlood = bloodInfo.compatibility;

  // Score generation (out of 100)
  const baseScore = (strokes * 7 + seed) % 30 + 65; // 65-94 range
  const scores = {
    general: Math.min(99, Math.max(60, baseScore + Math.floor(rng() * 15 - 5))),
    love: Math.min(99, Math.max(55, baseScore + Math.floor(rng() * 20 - 10))),
    work: Math.min(99, Math.max(60, baseScore + Math.floor(rng() * 15 - 5))),
    money: Math.min(99, Math.max(50, baseScore + Math.floor(rng() * 20 - 8))),
    health: Math.min(99, Math.max(65, baseScore + Math.floor(rng() * 10 - 3))),
  };

  // Extended personality reading using name strokes + zodiac + blood
  const extPersonality = `${name}さんは${zodiac.name}の「${zodiac.element}」のエレメントと、${blood}型特有の${bloodInfo.personality}という資質が融合した、非常にユニークな魂の持ち主です。\n\n姓名の画数${strokes}画は「${getNameFortune(strokes).desc}」を示しており、${getNameFortune(strokes).luck}の運勢です。\n\nあなたの本質的な強みは${bloodInfo.strengths.join('、')}です。一方で、${bloodInfo.weaknesses.join('、')}という面もありますが、これは裏を返せば繊細さや深い思考力の表れでもあります。\n\n${zodiac.element}のエレメントがあなたに与えているのは、${zodiac.element === '火' ? '情熱と行動力、そして周囲を照らすカリスマ性' : zodiac.element === '地' ? '安定感と信頼性、そして物事を着実に進める力' : zodiac.element === '風' ? '知性とコミュニケーション能力、そして自由な発想力' : '直感力と共感性、そして深い感受性'}です。`;

  return {
    scores,
    extPersonality,
    general,
    love,
    work,
    money,
    health,
    monthlyAdvice,
    luckyItems: [luckyItem, luckyItem2],
    luckyColor,
    luckySpot,
    luckyNumber,
    luckyDay,
    compatZodiac,
    compatBlood,
    zodiac,
    bloodInfo
  };
}

// ====== Expose globally ======
window.FortuneEngine = {
  generateBasicReading,
  generateDetailedReading,
  calcStrokes,
  getZodiac,
  hashCode
};
