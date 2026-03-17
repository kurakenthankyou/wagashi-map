/**
 * seed-shops.js
 * 渋谷・東京・品川駅周辺の手土産・スイーツ店データを Supabase に登録するスクリプト
 * 使い方: node scripts/seed-shops.js
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://eptqpsrctxufvaqioyws.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_IdSBDstUZx9-M1ml84YpuQ_UD4Y0NxX";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SHOPS = [
  // ─── 品川駅 (エキュート品川・エキュート品川サウス) ────────────────────────
  {
    name: "マーロウ エキュート品川店",
    station: "品川", walk_minutes: 1, lat: 35.6286, lng: 139.7392,
    category: ["pudding", "gift"], tags: ["プリン", "手土産", "改札内"],
    emoji: "🍮", hours: "8:00〜22:00", price_range: "¥500〜¥3,000",
    description: "ビーカーに入ったクリームブリュレが看板商品。手土産の定番として人気。",
    is_inside_gate: true, closed_days: [], payment_methods: ["現金", "カード", "交通系IC"],
  },
  {
    name: "HARBS エキュート品川店",
    station: "品川", walk_minutes: 1, lat: 35.6285, lng: 139.7390,
    category: ["cake", "gift"], tags: ["ケーキ", "フルーツタルト", "手土産"],
    emoji: "🎂", hours: "8:00〜22:00", price_range: "¥500〜¥3,000",
    description: "大きなホールケーキとタルトが有名。季節のフルーツを使ったケーキが絶品。",
    is_inside_gate: true, closed_days: [], payment_methods: ["現金", "カード"],
  },
  {
    name: "アンリ・シャルパンティエ エキュート品川店",
    station: "品川", walk_minutes: 1, lat: 35.6284, lng: 139.7389,
    category: ["cake", "gift", "cookie"], tags: ["ケーキ", "フィナンシェ", "手土産", "改札内"],
    emoji: "🎂", hours: "8:00〜22:00", price_range: "¥500〜¥3,000",
    description: "フィナンシェとマドレーヌが定番。上品な手土産として全国的に人気の洋菓子店。",
    is_inside_gate: true, closed_days: [], payment_methods: ["現金", "カード", "交通系IC"],
  },
  {
    name: "ねんりん家 エキュート品川店",
    station: "品川", walk_minutes: 1, lat: 35.6283, lng: 139.7391,
    category: ["baum", "gift"], tags: ["バウムクーヘン", "手土産", "改札内"],
    emoji: "🍰", hours: "8:00〜22:00", price_range: "¥500〜¥2,500",
    description: "しっとりとしたバウムクーヘン専門店。まっすぐバウムが有名な人気手土産店。",
    is_inside_gate: true, closed_days: [], payment_methods: ["現金", "カード", "交通系IC"],
  },
  {
    name: "鎌倉紅谷 エキュート品川店",
    station: "品川", walk_minutes: 1, lat: 35.6285, lng: 139.7393,
    category: ["wagashi", "gift"], tags: ["和菓子", "クルミッ子", "手土産"],
    emoji: "🍡", hours: "8:00〜22:00", price_range: "¥500〜¥2,000",
    description: "鎌倉発の和洋菓子店。リスがデザインされたクルミッ子は手土産の人気No.1。",
    is_inside_gate: true, closed_days: [], payment_methods: ["現金", "カード"],
  },
  {
    name: "グラマシーニューヨーク エキュート品川店",
    station: "品川", walk_minutes: 1, lat: 35.6282, lng: 139.7390,
    category: ["cake", "gift"], tags: ["ケーキ", "チーズケーキ", "手土産"],
    emoji: "🎂", hours: "8:00〜22:00", price_range: "¥1,000〜¥4,000",
    description: "NYスタイルのチーズケーキとマンハッタンロールが定番。高級感ある手土産に最適。",
    is_inside_gate: true, closed_days: [], payment_methods: ["現金", "カード"],
  },
  {
    name: "ゴンチャロフ 品川エキュート店",
    station: "品川", walk_minutes: 1, lat: 35.6287, lng: 139.7388,
    category: ["chocolate", "gift"], tags: ["チョコレート", "手土産", "ギフト"],
    emoji: "🍫", hours: "8:00〜22:00", price_range: "¥500〜¥5,000",
    description: "神戸発の老舗チョコレートブランド。季節限定のチョコも充実。",
    is_inside_gate: true, closed_days: [], payment_methods: ["現金", "カード"],
  },
  {
    name: "崎陽軒 品川駅店",
    station: "品川", walk_minutes: 0, lat: 35.6283, lng: 139.7385,
    category: ["gift"], tags: ["シウマイ", "手土産", "横浜"],
    emoji: "🎁", hours: "6:30〜23:00", price_range: "〜¥1,500",
    description: "横浜名物シウマイ弁当の崎陽軒。品川駅の定番手土産。",
    is_inside_gate: false, closed_days: [], payment_methods: ["現金", "カード", "交通系IC"],
  },
  {
    name: "エキュート品川サウス シャトレーゼ",
    station: "品川", walk_minutes: 1, lat: 35.6289, lng: 139.7395,
    category: ["cake", "cookie", "icecream"], tags: ["ケーキ", "アイス", "コスパ"],
    emoji: "🎂", hours: "8:00〜22:00", price_range: "〜¥1,000",
    description: "良質素材で手頃な価格のスイーツ。アイスやケーキが揃う。",
    is_inside_gate: true, closed_days: [], payment_methods: ["現金", "カード"],
  },

  // ─── 東京駅 (グランスタ東京・改札内) ──────────────────────────────────────
  {
    name: "東京ミルクチーズ工場 グランスタ東京店",
    station: "東京", walk_minutes: 1, lat: 35.6816, lng: 139.7680,
    category: ["cookie", "gift"], tags: ["クッキー", "チーズ", "手土産", "改札内"],
    emoji: "🍪", hours: "8:00〜22:00", price_range: "¥500〜¥2,500",
    description: "ミルクとチーズの風味豊かなクッキーが大人気。東京土産の定番中の定番。",
    is_inside_gate: true, closed_days: [], payment_methods: ["現金", "カード", "交通系IC", "PayPay"],
  },
  {
    name: "PRESS BUTTER SAND グランスタ東京店",
    station: "東京", walk_minutes: 1, lat: 35.6815, lng: 139.7682,
    category: ["baked", "gift"], tags: ["バターサンド", "焼き菓子", "手土産", "改札内"],
    emoji: "🥐", hours: "8:00〜22:00", price_range: "¥500〜¥2,500",
    description: "濃厚バタークリームをサクサクのビスケットで挟んだバターサンドの専門店。",
    is_inside_gate: true, closed_days: [], payment_methods: ["現金", "カード", "交通系IC"],
  },
  {
    name: "シュガーバターの木 グランスタ東京店",
    station: "東京", walk_minutes: 1, lat: 35.6817, lng: 139.7681,
    category: ["baked", "gift"], tags: ["焼き菓子", "シリアル", "手土産", "改札内"],
    emoji: "🥐", hours: "8:00〜22:00", price_range: "¥500〜¥2,000",
    description: "シリアルシュガーバターが絶妙なシュガーバタートリーがメイン商品。",
    is_inside_gate: true, closed_days: [], payment_methods: ["現金", "カード", "交通系IC"],
  },
  {
    name: "ねんりん家 グランスタ東京店",
    station: "東京", walk_minutes: 1, lat: 35.6814, lng: 139.7679,
    category: ["baum", "gift"], tags: ["バウムクーヘン", "手土産", "改札内"],
    emoji: "🍰", hours: "8:00〜22:00", price_range: "¥500〜¥3,000",
    description: "まっすぐバウムが有名な人気バウムクーヘン専門店。プレーンとメープルが定番。",
    is_inside_gate: true, closed_days: [], payment_methods: ["現金", "カード", "交通系IC"],
  },
  {
    name: "東京ばな奈ワールド グランスタ東京店",
    station: "東京", walk_minutes: 1, lat: 35.6813, lng: 139.7683,
    category: ["gift"], tags: ["東京土産", "バナナ", "スポンジケーキ", "改札内"],
    emoji: "🎁", hours: "8:00〜22:00", price_range: "¥500〜¥2,000",
    description: "バナナカスタードクリームのスポンジケーキ。東京土産の王道として20年以上愛される。",
    is_inside_gate: true, closed_days: [], payment_methods: ["現金", "カード", "交通系IC"],
  },
  {
    name: "ヒトツブカノウカ グランスタ東京店",
    station: "東京", walk_minutes: 1, lat: 35.6818, lng: 139.7677,
    category: ["gift", "baked"], tags: ["東京土産", "ぶどうの木", "手土産", "改札内"],
    emoji: "🎀", hours: "8:00〜22:00", price_range: "¥500〜¥3,000",
    description: "葡萄の木グループのブランド。一粒の葡萄をモチーフにしたスイーツが並ぶ。",
    is_inside_gate: true, closed_days: [], payment_methods: ["現金", "カード"],
  },
  {
    name: "ザ・メープルマニア グランスタ東京店",
    station: "東京", walk_minutes: 1, lat: 35.6812, lng: 139.7678,
    category: ["cookie", "gift"], tags: ["クッキー", "メープル", "手土産", "改札内"],
    emoji: "🍪", hours: "8:00〜22:00", price_range: "¥500〜¥2,000",
    description: "カナダ産メープルシロップを使ったクッキーの専門店。サクサク食感が人気。",
    is_inside_gate: true, closed_days: [], payment_methods: ["現金", "カード", "交通系IC"],
  },
  {
    name: "虎屋菓寮 グランスタ東京店",
    station: "東京", walk_minutes: 1, lat: 35.6819, lng: 139.7675,
    category: ["wagashi", "gift"], tags: ["和菓子", "羊羹", "手土産", "改札内"],
    emoji: "🍡", hours: "8:00〜21:30", price_range: "¥500〜¥10,000",
    description: "室町時代から続く老舗和菓子店。羊羹は贈り物の定番として広く親しまれている。",
    is_inside_gate: true, closed_days: [], payment_methods: ["現金", "カード"],
  },
  {
    name: "資生堂パーラー グランスタ東京店",
    station: "東京", walk_minutes: 1, lat: 35.6820, lng: 139.7674,
    category: ["cake", "cookie", "gift"], tags: ["焼き菓子", "チーズケーキ", "手土産", "改札内"],
    emoji: "🎂", hours: "8:00〜22:00", price_range: "¥1,000〜¥5,000",
    description: "銀座の老舗・資生堂パーラーの焼き菓子。チーズケーキとロールケーキが人気。",
    is_inside_gate: true, closed_days: [], payment_methods: ["現金", "カード"],
  },
  {
    name: "ガトーフェスタ ハラダ グランスタ東京店",
    station: "東京", walk_minutes: 1, lat: 35.6811, lng: 139.7685,
    category: ["baked", "gift"], tags: ["グーテ・デ・ロワ", "ラスク", "手土産", "改札内"],
    emoji: "🥐", hours: "8:00〜22:00", price_range: "¥500〜¥3,000",
    description: "群馬の老舗洋菓子店。バターラスク「グーテ・デ・ロワ」は全国的人気商品。",
    is_inside_gate: true, closed_days: [], payment_methods: ["現金", "カード", "交通系IC"],
  },
  {
    name: "キャラメル ゴースト ランチ グランスタ東京店",
    station: "東京", walk_minutes: 1, lat: 35.6810, lng: 139.7686,
    category: ["baked", "gift"], tags: ["キャラメル", "焼き菓子", "手土産", "改札内"],
    emoji: "🥐", hours: "8:00〜22:00", price_range: "¥500〜¥2,500",
    description: "キャラメルスイーツに特化した専門店。キャラメルサンドやシュークリームが人気。",
    is_inside_gate: true, closed_days: [], payment_methods: ["現金", "カード"],
  },
  {
    name: "モロゾフ グランスタ東京店",
    station: "東京", walk_minutes: 1, lat: 35.6809, lng: 139.7687,
    category: ["chocolate", "pudding", "gift"], tags: ["チョコレート", "プリン", "手土産", "改札内"],
    emoji: "🍫", hours: "8:00〜22:00", price_range: "¥500〜¥5,000",
    description: "神戸発の老舗洋菓子店。チョコレートとプリンが定番。バレンタインに人気。",
    is_inside_gate: true, closed_days: [], payment_methods: ["現金", "カード"],
  },
  {
    name: "銀の鈴ラウンジ近傍 大丸東京",
    station: "東京", walk_minutes: 2, lat: 35.6790, lng: 139.7686,
    category: ["gift", "wagashi", "cake"], tags: ["百貨店", "手土産", "各種菓子"],
    emoji: "🎁", hours: "10:00〜20:00", price_range: "¥500〜",
    description: "東京駅直結の大丸東京デパ地下。多数のスイーツブランドが集結する手土産の宝庫。",
    is_inside_gate: false, closed_days: [], payment_methods: ["現金", "カード", "交通系IC"],
  },

  // ─── 渋谷駅 (渋谷ヒカリエ・スクランブルスクエア・マークシティ) ─────────
  {
    name: "ピエール・エルメ・パリ 渋谷ヒカリエ店",
    station: "渋谷", walk_minutes: 1, lat: 35.6595, lng: 139.7038,
    category: ["macaron", "cake", "chocolate"], tags: ["マカロン", "ケーキ", "フランス菓子"],
    emoji: "🧁", hours: "11:00〜21:00", price_range: "¥800〜¥5,000",
    description: "世界的パティシエのパリ発ブランド。マカロンとイスパハンが代名詞。手土産の最高峰。",
    is_inside_gate: false, closed_days: [], payment_methods: ["現金", "カード"],
  },
  {
    name: "ジャン=ポール・エヴァン 渋谷ヒカリエ店",
    station: "渋谷", walk_minutes: 1, lat: 35.6596, lng: 139.7040,
    category: ["chocolate", "macaron"], tags: ["チョコレート", "マカロン", "フランス菓子"],
    emoji: "🍫", hours: "11:00〜21:00", price_range: "¥800〜¥6,000",
    description: "フランス最高位のショコラティエ。アート感あるチョコレートは贈り物に最適。",
    is_inside_gate: false, closed_days: [], payment_methods: ["現金", "カード"],
  },
  {
    name: "銀座ウエスト 渋谷ヒカリエ店",
    station: "渋谷", walk_minutes: 1, lat: 35.6594, lng: 139.7037,
    category: ["cookie", "cake"], tags: ["クッキー", "ケーキ", "ドライケーキ"],
    emoji: "🍪", hours: "11:00〜21:00", price_range: "¥500〜¥3,000",
    description: "銀座の老舗洋菓子店。ドライケーキは半世紀以上愛される定番手土産。",
    is_inside_gate: false, closed_days: [], payment_methods: ["現金", "カード"],
  },
  {
    name: "鎌倉紅谷 渋谷ヒカリエ店",
    station: "渋谷", walk_minutes: 1, lat: 35.6597, lng: 139.7039,
    category: ["wagashi", "gift"], tags: ["和菓子", "クルミッ子", "手土産"],
    emoji: "🍡", hours: "11:00〜21:00", price_range: "¥500〜¥3,000",
    description: "鎌倉発の和洋菓子店。クルミッ子は手土産として高い人気を誇る。",
    is_inside_gate: false, closed_days: [], payment_methods: ["現金", "カード"],
  },
  {
    name: "カファレル 渋谷ヒカリエ店",
    station: "渋谷", walk_minutes: 1, lat: 35.6598, lng: 139.7041,
    category: ["chocolate", "gift"], tags: ["チョコレート", "イタリア菓子", "手土産"],
    emoji: "🍫", hours: "11:00〜21:00", price_range: "¥500〜¥4,000",
    description: "イタリアの老舗チョコブランド。きのこ形チョコ「ジャンドゥーヤ」が定番。",
    is_inside_gate: false, closed_days: [], payment_methods: ["現金", "カード"],
  },
  {
    name: "ゴディバ 渋谷スクランブルスクエア店",
    station: "渋谷", walk_minutes: 2, lat: 35.6580, lng: 139.7025,
    category: ["chocolate", "gift"], tags: ["チョコレート", "ベルギー", "ギフト"],
    emoji: "🍫", hours: "11:00〜21:00", price_range: "¥500〜¥10,000",
    description: "ベルギー王室御用達のチョコブランド。ギフトボックスは贈り物として世界中で人気。",
    is_inside_gate: false, closed_days: [], payment_methods: ["現金", "カード", "交通系IC"],
  },
  {
    name: "シャトレーゼ 渋谷スクランブルスクエア店",
    station: "渋谷", walk_minutes: 2, lat: 35.6581, lng: 139.7026,
    category: ["cake", "icecream", "cookie"], tags: ["ケーキ", "アイス", "コスパ"],
    emoji: "🎂", hours: "11:00〜21:00", price_range: "〜¥1,000",
    description: "素材にこだわりながらリーズナブル。アイスとショートケーキが人気。",
    is_inside_gate: false, closed_days: [], payment_methods: ["現金", "カード"],
  },
  {
    name: "ル・ショコラ・アラン・デュカス 渋谷ヒカリエ店",
    station: "渋谷", walk_minutes: 1, lat: 35.6593, lng: 139.7036,
    category: ["chocolate"], tags: ["チョコレート", "ビーントゥバー", "高級"],
    emoji: "🍫", hours: "11:00〜21:00", price_range: "¥800〜¥10,000",
    description: "世界3ツ星シェフのアラン・デュカスによるチョコ専門店。カカオ豆から手作り。",
    is_inside_gate: false, closed_days: [], payment_methods: ["現金", "カード"],
  },
  {
    name: "福砂屋 渋谷ヒカリエ店",
    station: "渋谷", walk_minutes: 1, lat: 35.6599, lng: 139.7042,
    category: ["wagashi", "gift"], tags: ["カステラ", "和菓子", "長崎", "手土産"],
    emoji: "🍡", hours: "11:00〜21:00", price_range: "¥1,000〜¥5,000",
    description: "1624年創業・長崎の老舗カステラ店。手土産の王道として全国で愛される。",
    is_inside_gate: false, closed_days: [], payment_methods: ["現金", "カード"],
  },
  {
    name: "ル・パン・コティディアン 渋谷スクランブルスクエア店",
    station: "渋谷", walk_minutes: 2, lat: 35.6582, lng: 139.7027,
    category: ["baked", "cake"], tags: ["タルト", "ケーキ", "ベルギー"],
    emoji: "🥧", hours: "11:00〜21:00", price_range: "¥500〜¥3,000",
    description: "ベルギー発のベーカリーカフェ。有機パンとスイーツが揃う。",
    is_inside_gate: false, closed_days: [], payment_methods: ["現金", "カード"],
  },
  {
    name: "俺のECLAIR 渋谷",
    station: "渋谷", walk_minutes: 3, lat: 35.6560, lng: 139.7010,
    category: ["cake", "baked"], tags: ["エクレア", "ケーキ", "フランス菓子"],
    emoji: "🎂", hours: "12:00〜20:00", price_range: "¥500〜¥2,000",
    description: "エクレアに特化した専門店。種類豊富なエクレアがショーケースに並ぶ。",
    is_inside_gate: false, closed_days: ["月曜日"], payment_methods: ["現金", "カード"],
  },
];

async function main() {
  console.log("🍡 手土産店シードデータ挿入開始");
  console.log(`  対象: ${SHOPS.length}件\n`);

  // 既存の店名一覧を取得して重複を防ぐ
  const { data: existing } = await supabase.from("shops").select("name, station");
  const existingKeys = new Set((existing || []).map(s => `${s.name}|${s.station}`));
  console.log(`  既存店舗: ${existingKeys.size}件\n`);

  const toInsert = SHOPS
    .filter(s => !existingKeys.has(`${s.name}|${s.station}`))
    .map(({ is_inside_gate, closed_days, payment_methods, lat, lng, ...s }) => ({ ...s }));

  console.log(`  新規追加対象: ${toInsert.length}件`);
  if (toInsert.length === 0) { console.log("追加対象なし（全件既存）"); return; }

  const { data, error } = await supabase.from("shops").insert(toInsert).select("id, name");
  if (error) {
    console.error("❌ 挿入エラー:", error.message);
    return;
  }
  console.log(`\n🎉 完了: ${data.length}件追加しました`);
  data.forEach(s => console.log(`  ✅ ${s.name}`));
}

main().catch(e => { console.error("❌", e); process.exit(1); });
