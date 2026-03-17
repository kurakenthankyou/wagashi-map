/**
 * fetch-places.js
 * Places API (New) で東京主要駅周辺のスイーツ・手土産店を取得し Supabase に登録するスクリプト
 * Text Search API (New) を使用: https://places.googleapis.com/v1/places:searchText
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const GOOGLE_API_KEY = process.env.VITE_GOOGLE_MAPS_KEY;
const SUPABASE_URL   = process.env.VITE_SUPABASE_URL   || "https://eptqpsrctxufvaqioyws.supabase.co";
const SUPABASE_KEY   = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_IdSBDstUZx9-M1ml84YpuQ_UD4Y0NxX";

if (!GOOGLE_API_KEY) {
  console.error("❌ .env に VITE_GOOGLE_MAPS_KEY を設定してください");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const STATIONS = [
  { name: "新宿",   lat: 35.6896, lng: 139.7006 },
  { name: "渋谷",   lat: 35.6580, lng: 139.7016 },
  { name: "池袋",   lat: 35.7295, lng: 139.7109 },
  { name: "銀座",   lat: 35.6717, lng: 139.7650 },
  { name: "浅草",   lat: 35.7147, lng: 139.7966 },
  { name: "東京",   lat: 35.6812, lng: 139.7671 },
  { name: "上野",   lat: 35.7141, lng: 139.7774 },
  { name: "原宿",   lat: 35.6702, lng: 139.7027 },
  { name: "恵比寿", lat: 35.6469, lng: 139.7101 },
  { name: "表参道", lat: 35.6651, lng: 139.7126 },
  { name: "六本木", lat: 35.6628, lng: 139.7314 },
  { name: "秋葉原", lat: 35.7022, lng: 139.7742 },
];

const KEYWORDS = [
  "スイーツ",
  "和菓子",
  "ケーキ屋",
  "ドーナツ",
  "チョコレート専門店",
  "アイスクリーム",
  "プリン",
  "マカロン",
  "タルト",
  "クッキー",
];

// Places API (New) Text Search
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.rating",
  "places.types",
  "places.location",
  "places.priceLevel",
  "places.editorialSummary",
  "places.regularOpeningHours",
].join(",");

async function searchText(stationName, lat, lng, keyword) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_API_KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: `${stationName}駅 ${keyword}`,
      languageCode: "ja",
      maxResultCount: 20,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 800.0,
        },
      },
    }),
  });

  const data = await res.json();
  if (data.error) {
    console.warn(`  ⚠ ${data.error.status} — ${data.error.message}`);
    return [];
  }
  return data.places || [];
}

function guessCategory(name, types) {
  const n = name.toLowerCase();
  if (n.includes("和菓子") || n.includes("もち") || n.includes("だんご") || n.includes("まんじゅう") || n.includes("せんべい")) return "wagashi";
  if (n.includes("ケーキ") || n.includes("パティスリー") || types.includes("bakery")) return "cake";
  if (n.includes("チョコ") || n.includes("chocolat")) return "chocolate";
  if (n.includes("ドーナツ") || n.includes("donut") || n.includes("doughnut")) return "donut";
  if (n.includes("クッキー") || n.includes("cookie")) return "cookie";
  if (n.includes("アイス") || n.includes("gelato") || n.includes("ジェラート") || n.includes("ソフトクリーム")) return "icecream";
  if (n.includes("プリン") || n.includes("pudding")) return "pudding";
  if (n.includes("マカロン") || n.includes("macaron")) return "macaron";
  if (n.includes("タルト") || n.includes("tarte")) return "tart";
  return "gift";
}

function guessEmoji(category) {
  const map = { wagashi: "🍡", cake: "🎂", chocolate: "🍫", donut: "🍩", cookie: "🍪", icecream: "🍦", pudding: "🍮", macaron: "🧁", tart: "🥧", gift: "🎁" };
  return map[category] || "🍡";
}

function buildTags(name, types, category) {
  const tags = [];
  if (category === "wagashi")   tags.push("和菓子");
  if (category === "cake")      tags.push("ケーキ");
  if (category === "chocolate") tags.push("チョコレート");
  if (category === "donut")     tags.push("ドーナツ");
  if (category === "cookie")    tags.push("クッキー");
  if (category === "icecream")  tags.push("アイス");
  if (category === "pudding")   tags.push("プリン");
  if (category === "macaron")   tags.push("マカロン");
  if (category === "tart")      tags.push("タルト");
  if (types.includes("cafe"))   tags.push("カフェ");
  if (types.includes("bakery")) tags.push("ベーカリー");
  if (tags.length === 0)        tags.push("スイーツ");
  return tags;
}

function parsePriceLevel(level) {
  const map = { PRICE_LEVEL_FREE: "無料", PRICE_LEVEL_INEXPENSIVE: "〜¥500", PRICE_LEVEL_MODERATE: "¥500〜¥1,500", PRICE_LEVEL_EXPENSIVE: "¥1,500〜¥3,000", PRICE_LEVEL_VERY_EXPENSIVE: "¥3,000〜" };
  return map[level] || "—";
}

function formatHours(openingHours) {
  if (!openingHours?.weekdayDescriptions?.length) return null;
  const day = new Date().getDay();
  const text = openingHours.weekdayDescriptions[day === 0 ? 6 : day - 1];
  return text?.replace(/^[^:]+:\s*/, "") || null;
}

function estimateWalkMinutes(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return Math.max(1, Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) / 80));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("🍡 テミヤゲ - Google Places (New) 取得スクリプト開始");
  console.log(`  対象駅: ${STATIONS.length}駅 × ${KEYWORDS.length}キーワード\n`);

  const { data: existing } = await supabase.from("shops").select("google_place_id");
  const existingIds = new Set((existing || []).map((s) => s.google_place_id).filter(Boolean));
  console.log(`  既存店舗数: ${existingIds.size}件\n`);

  const seen = new Set(existingIds);
  const toInsert = [];

  for (const station of STATIONS) {
    console.log(`📍 ${station.name}駅 検索中...`);

    for (const keyword of KEYWORDS) {
      const places = await searchText(station.name, station.lat, station.lng, keyword);
      await sleep(300);

      for (const place of places) {
        if (seen.has(place.id)) continue;
        if (place.rating && place.rating < 3.5) continue;
        seen.add(place.id);

        const name = place.displayName?.text || "";
        const category = guessCategory(name, place.types || []);
        const tags = buildTags(name, place.types || [], category);

        toInsert.push({
          name,
          station: station.name,
          walk_minutes: estimateWalkMinutes(
            place.location.latitude, place.location.longitude,
            station.lat, station.lng
          ),
          lat: place.location.latitude,
          lng: place.location.longitude,
          category: [category],
          tags,
          emoji: guessEmoji(category),
          hours: formatHours(place.regularOpeningHours),
          price_range: parsePriceLevel(place.priceLevel),
          description: place.editorialSummary?.text || null,
          google_place_id: place.id,
          rating_google: place.rating || null,
        });
      }
    }
    console.log(`  → 累計 ${toInsert.length}件`);
  }

  console.log(`\n✅ 取得完了: ${toInsert.length}件 (新規)`);

  if (toInsert.length === 0) {
    console.log("挿入するデータがありません。");
    return;
  }

  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);
    const { error } = await supabase.from("shops").insert(batch);
    if (error) {
      console.error(`❌ 挿入エラー (batch ${i / BATCH + 1}):`, error.message);
    } else {
      inserted += batch.length;
      console.log(`  挿入済: ${inserted}/${toInsert.length}件`);
    }
  }

  console.log(`\n🎉 完了: ${inserted}件 Supabase に追加しました`);
}

main().catch((e) => { console.error("❌ エラー:", e); process.exit(1); });
