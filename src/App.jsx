import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import MapView from "./MapView";
import {
  Search, Menu, MapPin, Bookmark, Clock, MessageSquare,
  ArrowDownUp, ChevronDown, SlidersHorizontal, Navigation,
  Star, Heart, History, LogIn, LogOut, ChevronLeft, X,
  PlusCircle, Pencil, CheckCircle,
} from "lucide-react";
import { cn } from "./lib/utils";

/* ─── 定数 ────────────────────────────────────────────────── */
const ACCENT  = "#FF8C00";
const BLUE    = "#0066CC";
const FONT    = "'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif";

const CATEGORIES = [
  { id: "all",       label: "すべて",       emoji: "🎁" },
  { id: "wagashi",   label: "和菓子",       emoji: "🍡" },
  { id: "cake",      label: "ケーキ",       emoji: "🎂" },
  { id: "chocolate", label: "チョコ",       emoji: "🍫" },
  { id: "donut",     label: "ドーナツ",     emoji: "🍩" },
  { id: "cookie",    label: "クッキー",     emoji: "🍪" },
  { id: "icecream",  label: "アイス",       emoji: "🍦" },
  { id: "pudding",   label: "プリン",       emoji: "🍮" },
  { id: "macaron",   label: "マカロン",     emoji: "🧁" },
  { id: "tart",      label: "タルト",       emoji: "🥧" },
  { id: "gift",      label: "手土産",       emoji: "🎀" },
];

const SORT_OPTIONS = [
  { id: "ranking",  label: "ランキング順" },
  { id: "rating",   label: "評価の高い順" },
  { id: "distance", label: "距離が近い順" },
  { id: "newest",   label: "新着順" },
];

// 写真プレースホルダー用カラーセット（スイーツ系）
const PHOTO_SETS = [
  [["#FFF3E0","#FFCC80"], ["#FFF8E1","#FFE082"], ["#FFF9C4","#FFF176"]],
  [["#FCE4EC","#F48FB1"], ["#FFDDE1","#F8A5C2"], ["#FFF0F5","#FFB3C6"]],
  [["#F3E5F5","#CE93D8"], ["#EDE7F6","#B39DDB"], ["#F8F0FF","#C9A6FF"]],
  [["#E8F5E9","#A5D6A7"], ["#F1F8E9","#C5E1A5"], ["#E0F2F1","#80CBC4"]],
  [["#FFF3CD","#FFD27F"], ["#FAECD8","#F8C471"], ["#FDF0D5","#F7C948"]],
];

/* ─── ヘルパー ─────────────────────────────────────────────── */
function StarRow({ score, size = 12 }) {
  const filled = Math.round(parseFloat(score) || 0);
  return (
    <span className="inline-flex gap-px">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={size}
          fill={i < filled ? ACCENT : "#E0E0E0"}
          color={i < filled ? ACCENT : "#E0E0E0"} />
      ))}
    </span>
  );
}

function RankBadge({ rank }) {
  if (rank === 1) return (
    <div className="flex-shrink-0 w-7 h-7 rounded-md flex flex-col items-center justify-center text-white text-[10px] font-black leading-none"
      style={{ background: "linear-gradient(135deg,#FFD700,#FFA000)" }}>
      <span style={{ fontSize: 9 }}>👑</span>
      <span>{rank}</span>
    </div>
  );
  if (rank === 2) return (
    <div className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-black"
      style={{ background: "linear-gradient(135deg,#D0D0D0,#A0A0A0)" }}>{rank}</div>
  );
  if (rank === 3) return (
    <div className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-black"
      style={{ background: "linear-gradient(135deg,#E8A87C,#C87941)" }}>{rank}</div>
  );
  return (
    <div className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-gray-500 text-xs font-bold bg-gray-100">
      {rank}
    </div>
  );
}

function PhotoGrid({ shop }) {
  // UUID文字列・数値どちらのIDにも対応
  const idNum = typeof shop.id === "number"
    ? shop.id
    : String(shop.id).split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const set = PHOTO_SETS[Math.abs(idNum) % PHOTO_SETS.length];
  return (
    <div className="flex gap-px w-full" style={{ height: 112 }}>
      {set.map(([from, to], i) => (
        <div key={i} className="flex-1 flex items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
          {i === 1 && (
            <span style={{ fontSize: 36, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))" }}>
              {shop.emoji || "🍡"}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── メインコンポーネント ─────────────────────────────────── */
export default function App() {
  const [shops, setShops]               = useState([]);
  const [allReviews, setAllReviews]     = useState([]);
  const [reviews, setReviews]           = useState([]);
  const [timeline, setTimeline]         = useState([]);
  const [favorites, setFavorites]       = useState(new Set());
  const [history, setHistory]           = useState([]);
  const [user, setUser]                 = useState(null);
  const [view, setView]                 = useState("explore");
  const [selectedShop, setSelectedShop] = useState(null);
  const [searchQuery, setSearchQuery]   = useState("");
  const [stationFilter, setStationFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy]             = useState("ranking");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showMenu, setShowMenu]         = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEditModal, setShowEditModal]         = useState(false);
  const [pendingRating, setPendingRating] = useState(0);
  const [reviewText, setReviewText]     = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [routeFilterIds, setRouteFilterIds] = useState(null);
  const [loading, setLoading]           = useState(true);

  /* ── データ取得 ──────────────────────────────────────────── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchFavorites(session.user.id);
      fetchShops();
      fetchAllReviews();
      fetchTimeline();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchFavorites(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (user) fetchFavorites(user.id); }, [user]);
  useEffect(() => { if (selectedShop) fetchReviews(selectedShop.id); }, [selectedShop]);

  async function fetchShops() {
    // status=approved または未設定（旧データ互換）のみ表示
    let { data, error } = await supabase.from("shops").select("*")
      .or("status.eq.approved,status.is.null");
    // statusカラム未作成の場合は全件取得にフォールバック
    if (error?.message?.includes("status") || error?.code === "42703") {
      const res = await supabase.from("shops").select("*");
      data = res.data; error = res.error;
    }
    if (error) {
      if (error.code === "PGRST301" || error.message?.includes("JWT")) {
        await supabase.auth.signOut();
        const { data: r } = await supabase.from("shops").select("*");
        if (r) setShops(r);
      }
      setLoading(false); return;
    }
    if (data) setShops(data);
    setLoading(false);
  }

  async function fetchAllReviews() {
    const { data } = await supabase.from("reviews").select("shop_id, rating");
    if (data) setAllReviews(data);
  }

  async function fetchReviews(shopId) {
    const { data } = await supabase.from("reviews").select("*")
      .eq("shop_id", shopId).order("created_at", { ascending: false });
    if (data) setReviews(data);
  }

  async function fetchFavorites(userId) {
    const { data } = await supabase.from("favorites").select("shop_id").eq("user_id", userId);
    if (data) setFavorites(new Set(data.map((f) => f.shop_id)));
  }

  async function fetchTimeline() {
    const { data } = await supabase.from("reviews").select("*, shops(name, emoji)")
      .order("created_at", { ascending: false }).limit(50);
    if (data) setTimeline(data);
  }

  /* ── 認証 ────────────────────────────────────────────────── */
  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.href } });
  }
  async function logout() { await supabase.auth.signOut(); setFavorites(new Set()); }

  /* ── お気に入り ──────────────────────────────────────────── */
  async function toggleFavorite(e, shopId) {
    e?.stopPropagation();
    if (!user) { loginWithGoogle(); return; }
    if (favorites.has(shopId)) {
      await supabase.from("favorites").delete().eq("shop_id", shopId).eq("user_id", user.id);
      setFavorites(prev => { const s = new Set(prev); s.delete(shopId); return s; });
    } else {
      await supabase.from("favorites").insert({ shop_id: shopId, user_id: user.id });
      setFavorites(prev => new Set([...prev, shopId]));
    }
  }

  /* ── 口コミ投稿 ──────────────────────────────────────────── */
  async function submitReview() {
    if (!user) { loginWithGoogle(); return; }
    if (!pendingRating) { alert("星評価を選んでください"); return; }
    if (!reviewText.trim()) { alert("コメントを入力してください"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      shop_id: selectedShop.id, user_id: user.id,
      user_name: user.user_metadata?.full_name || "ユーザー",
      rating: pendingRating, comment: reviewText.trim(),
    });
    if (!error) {
      setPendingRating(0); setReviewText("");
      fetchReviews(selectedShop.id); fetchAllReviews(); fetchTimeline();
    }
    setSubmitting(false);
  }

  /* ── ユーティリティ ──────────────────────────────────────── */
  function avgRating(shopId) {
    const r = allReviews.filter(r => r.shop_id === shopId);
    if (!r.length) return null;
    return (r.reduce((a, b) => a + b.rating, 0) / r.length).toFixed(1);
  }
  function reviewCount(shopId) { return allReviews.filter(r => r.shop_id === shopId).length; }

  function openDetail(shop) {
    setSelectedShop(shop);
    setView("detail");
    setHistory(prev => [shop, ...prev.filter(h => h.id !== shop.id)].slice(0, 30));
  }

  const stations = ["all", ...new Set(shops.map(s => s.station))];

  /* ── フィルタリング & ソート ─────────────────────────────── */
  const filteredShops = shops.filter(s => {
    if (routeFilterIds !== null && !routeFilterIds.has(s.id)) return false;
    if (categoryFilter !== "all" && !s.category?.includes(categoryFilter)) return false;
    if (stationFilter !== "all" && s.station !== stationFilter) return false;
    if (searchQuery &&
      !s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !s.tags?.join("").toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const sortedShops = [...filteredShops].sort((a, b) => {
    if (sortBy === "ranking" || sortBy === "rating") {
      return parseFloat(avgRating(b.id) || 0) - parseFloat(avgRating(a.id) || 0);
    }
    if (sortBy === "distance") return a.walk_minutes - b.walk_minutes;
    if (sortBy === "newest") return String(b.id) > String(a.id) ? 1 : -1;
    return 0;
  });

  /* ── タブ定義 ────────────────────────────────────────────── */
  const TABS = [
    { id: "explore",   label: "探す",       Icon: Search,        badge: 0 },
    { id: "favorites", label: "お気に入り", Icon: Bookmark,      badge: favorites.size },
    { id: "timeline",  label: "タイムライン", Icon: MessageSquare, badge: 0 },
    { id: "history",   label: "閲覧履歴",   Icon: History,       badge: history.length },
  ];

  /* ════════════════════════════════════════════════════════════
     サブビュー
  ════════════════════════════════════════════════════════════ */

  /* ── ショップカード（リスト用） ─────────────────────────── */
  function ShopCard({ shop, rank }) {
    const isFav = favorites.has(shop.id);
    const avg   = avgRating(shop.id);
    const cnt   = reviewCount(shop.id);

    return (
      <div
        onClick={() => openDetail(shop)}
        className="bg-white border-b border-gray-100 cursor-pointer active:bg-gray-50"
      >
        {/* ヘッダー行 */}
        <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2">
          <RankBadge rank={rank} />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[15px] text-gray-900 truncate">{shop.name}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Navigation size={10} className="text-gray-400" />
              {shop.station.replace(/駅$/, "")}駅 徒歩{shop.walk_minutes}分
              <span className="text-gray-300">|</span>
              <span>{shop.tags?.[0] || "スイーツ"}</span>
            </div>
          </div>
          {/* 評価 */}
          {avg && (
            <div className="flex flex-col items-end flex-shrink-0">
              <span className="text-base font-black" style={{ color: ACCENT }}>{avg}</span>
              <span className="text-[10px] text-gray-400">{cnt}件</span>
            </div>
          )}
          {/* ボタン群 */}
          <div className="flex items-center gap-2 ml-1 flex-shrink-0">
            <MapPin size={18} className="text-gray-300" />
            <button
              onClick={(e) => toggleFavorite(e, shop.id)}
              className="flex items-center justify-center"
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
            >
              <Bookmark size={18}
                fill={isFav ? ACCENT : "none"}
                color={isFav ? ACCENT : "#D1D5DB"} />
            </button>
          </div>
        </div>

        {/* 3枚写真 */}
        <PhotoGrid shop={shop} />

        {/* キャッチコピー */}
        <div className="px-4 py-2.5 text-sm text-gray-600 leading-relaxed">
          {shop.description
            ? shop.description.slice(0, 60) + (shop.description.length > 60 ? "…" : "")
            : `${shop.name}こだわりのスイーツをぜひお試しください。`}
        </div>
      </div>
    );
  }

  /* ── 詳細ページ ──────────────────────────────────────────── */
  function DetailView() {
    const s         = selectedShop;
    const shopRevs  = reviews.filter(r => r.shop_id === s.id);
    const avg       = avgRating(s.id);
    const isFav     = favorites.has(s.id);

    return (
      <div className="max-w-2xl mx-auto pb-10" style={{ fontFamily: FONT }}>
        {/* ヒーロー写真 */}
        <div className="relative" style={{ height: 200 }}>
          <PhotoGrid shop={s} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span style={{ fontSize: 64, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.2))" }}>
              {s.emoji || "🍡"}
            </span>
          </div>
          <button
            onClick={() => { setSelectedShop(null); setView("explore"); }}
            className="absolute top-3 left-3 bg-white/90 rounded-full w-9 h-9 flex items-center justify-center shadow cursor-pointer border-none"
          >
            <ChevronLeft size={18} className="text-gray-700" />
          </button>
          <button
            onClick={(e) => toggleFavorite(e, s.id)}
            className="absolute top-3 right-3 bg-white/90 rounded-full w-9 h-9 flex items-center justify-center shadow cursor-pointer border-none"
          >
            <Bookmark size={18} fill={isFav ? ACCENT : "none"} color={isFav ? ACCENT : "#666"} />
          </button>
        </div>

        {/* 店名・評価 */}
        <div className="bg-white px-5 py-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-black text-gray-900 mb-1.5">{s.name}</h1>
            {/* オーナーのみ編集ボタン表示 */}
            {user && s.submitted_by === user.id && (
              <button
                onClick={() => setShowEditModal(true)}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 bg-white cursor-pointer"
              >
                <Pencil size={12} />編集
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <StarRow score={parseFloat(avg || 0)} size={16} />
            {avg ? (
              <>
                <span className="text-2xl font-black" style={{ color: ACCENT }}>{avg}</span>
                <span className="text-xs text-gray-400">（{shopRevs.length}件）</span>
              </>
            ) : <span className="text-sm text-gray-400">まだ評価なし</span>}
          </div>
          <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
            <Navigation size={12} className="text-gray-400" />
            {s.station.replace(/駅$/, "")}駅 徒歩{s.walk_minutes}分
            {s.price_range && <><span className="text-gray-300 mx-1">|</span>{s.price_range}</>}
          </div>
        </div>

        {/* 基本情報 */}
        <div className="bg-white px-5 py-4 mt-2 border-b border-gray-100">
          <div className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">基本情報</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["最寄り駅", `${s.station.replace(/駅$/, "")}駅 徒歩${s.walk_minutes}分`],
              ["営業時間", s.hours || "—"],
              ["価格帯",   s.price_range || "—"],
              ["カテゴリ", s.tags?.join(" / ") || "—"],
            ].map(([label, value]) => (
              <div key={label} className="bg-gray-50 rounded-lg p-2.5">
                <div className="text-[10px] text-gray-400 mb-0.5">{label}</div>
                <div className="text-xs font-medium text-gray-700">{value}</div>
              </div>
            ))}
          </div>
          {s.description && (
            <p className="text-sm text-gray-600 leading-relaxed mt-3">{s.description}</p>
          )}
        </div>

        {/* 地図 */}
        <div className="bg-white mt-2 border-b border-gray-100">
          <div className="text-sm font-bold text-gray-800 px-5 pt-4 pb-2">地図</div>
          <MapView shops={[s]} onSelectShop={null} hideRoutePanel />
        </div>

        {/* 口コミ投稿 */}
        <div className="bg-white mt-2 px-5 py-4 border-b border-gray-100">
          <div className="text-sm font-bold text-gray-800 mb-3">口コミを投稿する</div>
          {!user ? (
            <button onClick={loginWithGoogle}
              className="w-full py-3 rounded-xl text-white text-sm font-semibold border-none cursor-pointer"
              style={{ background: "#4285F4" }}>
              Googleでログインして投稿する
            </button>
          ) : (
            <>
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(i => (
                  <button key={i} onClick={() => setPendingRating(i)}
                    className="text-3xl bg-transparent border-none cursor-pointer p-0 leading-none"
                    style={{ color: i <= pendingRating ? ACCENT : "#DDD" }}>★</button>
                ))}
              </div>
              <textarea value={reviewText} onChange={e => setReviewText(e.target.value)}
                placeholder="このお店の感想を書いてください..."
                className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-y min-h-20 mb-2 outline-none box-border"
                style={{ fontFamily: FONT }} />
              <button onClick={submitReview} disabled={submitting}
                className="py-2 px-6 rounded-lg text-white text-sm font-semibold border-none cursor-pointer"
                style={{ background: ACCENT, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "投稿中..." : "投稿する"}
              </button>
            </>
          )}
        </div>

        {/* 口コミ一覧 */}
        <div className="bg-white mt-2 px-5 py-4">
          <div className="text-sm font-bold text-gray-800 mb-3">口コミ（{shopRevs.length}件）</div>
          {shopRevs.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              まだ口コミがありません
            </div>
          ) : shopRevs.map((r, idx) => (
            <div key={r.id} className={cn("py-3", idx < shopRevs.length - 1 && "border-b border-gray-100")}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-500">
                  {(r.user_name || "?")[0]}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">{r.user_name || "ユーザー"}</div>
                  <div className="text-[10px] text-gray-400">{new Date(r.created_at).toLocaleDateString("ja-JP")}</div>
                </div>
                <StarRow score={r.rating} size={11} />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── タイムラインビュー ──────────────────────────────────── */
  function TimelineView() {
    if (timeline.length === 0) return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <MessageSquare size={40} className="mb-3 opacity-30" />
        <p className="text-sm">まだ投稿がありません</p>
      </div>
    );
    return (
      <div className="bg-white divide-y divide-gray-100">
        {timeline.map(r => (
          <div key={r.id} className="px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-500 flex-shrink-0">
                {(r.user_name || "?")[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-800">{r.user_name || "ユーザー"}</span>
                  <span className="text-[10px] text-gray-400">{new Date(r.created_at).toLocaleDateString("ja-JP")}</span>
                </div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-base">{r.shops?.emoji || "🍡"}</span>
                  <span className="text-sm font-bold text-gray-900">{r.shops?.name}</span>
                  <StarRow score={r.rating} size={10} />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* ── お気に入りビュー ────────────────────────────────────── */
  function FavoritesView() {
    const favShops = shops.filter(s => favorites.has(s.id));
    if (favShops.length === 0) return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Bookmark size={40} className="mb-3 opacity-30" />
        <p className="text-sm">お気に入りがありません</p>
        <p className="text-xs mt-1">🔖 をタップして追加しましょう</p>
      </div>
    );
    return (
      <div className="bg-white divide-y divide-gray-100">
        {favShops.map((shop, i) => <ShopCard key={shop.id} shop={shop} rank={i + 1} />)}
      </div>
    );
  }

  /* ── 閲覧履歴ビュー ──────────────────────────────────────── */
  function HistoryView() {
    if (history.length === 0) return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <History size={40} className="mb-3 opacity-30" />
        <p className="text-sm">閲覧履歴がありません</p>
        <p className="text-xs mt-1">お店を開くと履歴に追加されます</p>
      </div>
    );
    return (
      <div className="bg-white divide-y divide-gray-100">
        {history.map((shop, i) => <ShopCard key={shop.id} shop={shop} rank={i + 1} />)}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     メインレンダリング
  ════════════════════════════════════════════════════════════ */
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100" style={{ fontFamily: FONT }}>

      {/* ════ ヘッダー ════════════════════════════════════════ */}
      <header className="bg-white flex-shrink-0 z-[200]" style={{ boxShadow: "0 1px 0 #E8E8E8" }}>

        {/* 1段目: 検索バー + ハンバーガー */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-3.5 py-2">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="お店を検索"
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400 min-w-0"
              style={{ fontFamily: FONT }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}
                className="bg-transparent border-none cursor-pointer p-0 text-gray-400">
                <X size={14} />
              </button>
            )}
          </div>

          {/* ハンバーガーメニュー */}
          <button
            onClick={() => setShowMenu(o => !o)}
            className="relative w-9 h-9 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer hover:bg-gray-100"
          >
            <Menu size={22} className="text-gray-700" />
            {/* バッジ */}
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={{ background: "#E8392A" }} />
          </button>
        </div>

        {/* 2段目: 駅名チップ（横スクロール） */}
        <div className="flex overflow-x-auto no-scrollbar px-4 pb-2.5 gap-0">
          {stations.map((s, i) => (
            <button
              key={s}
              onClick={() => setStationFilter(s)}
              className={cn(
                "flex-shrink-0 text-sm px-0 bg-transparent border-none cursor-pointer whitespace-nowrap",
                s === stationFilter ? "font-bold" : "font-normal"
              )}
              style={{
                color: s === stationFilter ? ACCENT : BLUE,
                paddingRight: i < stations.length - 1 ? 16 : 0,
                textDecoration: s !== stationFilter ? "underline" : "none",
                textDecorationColor: s !== stationFilter ? BLUE : "transparent",
              }}
            >
              {s === "all" ? "全国" : `${s.replace(/駅$/, "")}駅`}
            </button>
          ))}
        </div>
      </header>

      {/* ════ メインエリア ════════════════════════════════════ */}
      {view === "detail" ? (
        /* 詳細ページ */
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <DetailView />
        </div>

      ) : view !== "explore" ? (
        /* お気に入り / タイムライン / 閲覧履歴 */
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {view === "favorites" ? <FavoritesView />
           : view === "timeline" ? <TimelineView />
           : <HistoryView />}
        </div>

      ) : (
        /* 探すビュー */
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* ── 地図エリア（約42%） ─────────────────────────── */}
          <div className="flex-shrink-0 relative" style={{ height: "42vh" }}>
            {/* Google Map */}
            <MapView
              shops={filteredShops}
              onSelectShop={openDetail}
              onRouteShopsChange={setRouteFilterIds}
              mapHeight="100%"
              noRadius
              hideRoutePanel
            />

            {/* カテゴリチップ（地図上に浮かせる） */}
            <div className="absolute top-2.5 left-0 right-0 px-2.5 flex gap-1.5 overflow-x-auto no-scrollbar pointer-events-none z-10">
              {CATEGORIES.map(({ id, label, emoji }) => (
                <button
                  key={id}
                  onClick={() => setCategoryFilter(id)}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-1 pl-2 pr-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border-none pointer-events-auto transition-all",
                    categoryFilter === id
                      ? "text-white shadow-lg"
                      : "bg-white text-gray-700 shadow-md hover:shadow-lg"
                  )}
                  style={categoryFilter === id
                    ? { background: ACCENT, boxShadow: `0 2px 8px ${ACCENT}55` }
                    : {}}
                >
                  <span>{emoji}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* ドラッグハンドル */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-9 h-1 bg-white/70 rounded-full" />

            {/* ルート検索中バナー */}
            {routeFilterIds && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full px-4 py-1.5 shadow-lg flex items-center gap-2 text-xs font-semibold"
                style={{ color: ACCENT }}>
                🗺️ ルート沿い {routeFilterIds.size}件
                <button onClick={() => setRouteFilterIds(null)}
                  className="bg-transparent border-none cursor-pointer p-0 ml-1">
                  <X size={12} className="text-gray-400" />
                </button>
              </div>
            )}
          </div>

          {/* ── フィルターバー ───────────────────────────────── */}
          <div className="flex-shrink-0 bg-white border-b border-gray-100 overflow-x-auto no-scrollbar"
            style={{ boxShadow: "0 1px 0 #F0F0F0" }}>
            <div className="flex items-center gap-2 px-4 py-2">
              <button className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white">
                <SlidersHorizontal size={14} className="text-gray-600" />
              </button>
              {[
                { label: "今から行ける", hasChevron: true },
                { label: "価格帯",       hasChevron: true },
                { label: "手作り",       hasChevron: false },
                { label: "テイクアウト", hasChevron: false },
                { label: "贈り物向け",   hasChevron: false },
              ].map(({ label, hasChevron }) => (
                <button key={label}
                  className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 bg-white border border-gray-200 cursor-pointer whitespace-nowrap hover:border-gray-400">
                  {label}
                  {hasChevron && <ChevronDown size={11} className="text-gray-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* ── 件数 + ソートボタン ──────────────────────────── */}
          <div className="flex-shrink-0 bg-white flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <div>
              {routeFilterIds
                ? <span className="text-sm font-bold text-gray-900" style={{ color: ACCENT }}>ルート沿い</span>
                : <span className="text-sm font-bold text-gray-900">
                    {stationFilter !== "all" ? `${stationFilter.replace(/駅$/, "")}駅` : "現在地"}
                  </span>}
              <span className="text-sm text-gray-500 ml-1">{sortedShops.length}件</span>
            </div>
            {/* ソートボタン */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(o => !o)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 cursor-pointer"
              >
                <ArrowDownUp size={12} className="text-gray-500" />
                {SORT_OPTIONS.find(o => o.id === sortBy)?.label}
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 w-40 overflow-hidden">
                  {SORT_OPTIONS.map(opt => (
                    <button key={opt.id}
                      onClick={() => { setSortBy(opt.id); setShowSortMenu(false); }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm cursor-pointer border-none bg-transparent hover:bg-gray-50",
                        sortBy === opt.id ? "font-bold" : "text-gray-700"
                      )}
                      style={sortBy === opt.id ? { color: ACCENT } : {}}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── ショップリスト（スクロール） ─────────────────── */}
          <div className="flex-1 overflow-y-auto bg-white" onClick={() => setShowSortMenu(false)}>
            {loading ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                読み込み中...
              </div>
            ) : sortedShops.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <span className="text-4xl mb-3">🔍</span>
                <p className="text-sm">条件に合うお店が見つかりませんでした</p>
              </div>
            ) : sortedShops.map((shop, i) => (
              <ShopCard key={shop.id} shop={shop} rank={i + 1} />
            ))}
            {/* 下部余白 */}
            <div className="h-4" />
          </div>
        </div>
      )}

      {/* ════ 下部タブバー ════════════════════════════════════ */}
      {view !== "detail" && (
        <nav
          className="flex-shrink-0 bg-white flex items-stretch z-[200]"
          style={{ boxShadow: "0 -1px 0 #E8E8E8", paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {TABS.map(({ id, label, Icon, badge }) => {
            const active = view === id;
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                className="flex-1 flex flex-col items-center justify-center py-2 bg-transparent border-none cursor-pointer min-h-[56px]"
              >
                {/* アクティブ: pill背景 */}
                <div className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition-all duration-150",
                  active ? "bg-orange-50" : ""
                )}>
                  <div className="relative">
                    <Icon
                      size={22}
                      fill={active ? ACCENT : "none"}
                      color={active ? ACCENT : "#9CA3AF"}
                      strokeWidth={active ? 2.5 : 2}
                    />
                    {badge > 0 && (
                      <span
                        className="absolute -top-1.5 -right-2 text-[8px] font-black text-white rounded-full flex items-center justify-center"
                        style={{
                          background: "#E8392A",
                          minWidth: 14,
                          height: 14,
                          padding: "0 3px",
                        }}
                      >
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </div>
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: active ? ACCENT : "#9CA3AF" }}
                  >
                    {label}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      )}

      {/* ── ハンバーガーメニューモーダル ─────────────────────── */}
      {showMenu && (
        <div className="fixed inset-0 z-[300]" onClick={() => setShowMenu(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute top-0 right-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* メニューヘッダー */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="text-lg font-black">
                <span style={{ color: ACCENT }}>テミ</span>
                <span className="text-gray-900">ヤゲ</span>
              </div>
              <button onClick={() => setShowMenu(false)}
                className="bg-transparent border-none cursor-pointer p-1 rounded-full hover:bg-gray-100">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* ログイン状態 */}
            <div className="px-5 py-4 border-b border-gray-100">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-500">
                    {(user.user_metadata?.full_name || "U")[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-900 truncate">
                      {user.user_metadata?.full_name || "ユーザー"}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                  </div>
                </div>
              ) : (
                <button onClick={() => { loginWithGoogle(); setShowMenu(false); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer"
                  style={{ background: "#4285F4" }}>
                  <LogIn size={16} />Googleでログイン
                </button>
              )}
            </div>

            {/* メニュー項目 */}
            <div className="flex-1 px-2 py-2">
              {[
                { icon: Search,      label: "お店を探す",     action: () => { setView("explore"); setShowMenu(false); } },
                { icon: Bookmark,    label: "お気に入り",     action: () => { setView("favorites"); setShowMenu(false); } },
                { icon: MessageSquare, label: "タイムライン", action: () => { setView("timeline"); setShowMenu(false); } },
                { icon: History,     label: "閲覧履歴",       action: () => { setView("history"); setShowMenu(false); } },
                { icon: PlusCircle,  label: "お店を登録する", action: () => { setShowRegisterModal(true); setShowMenu(false); } },
              ].map(({ icon: Icon, label, action }) => (
                <button key={label} onClick={action}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-700 text-left bg-transparent border-none cursor-pointer hover:bg-gray-50">
                  <Icon size={18} className="text-gray-500" />
                  {label}
                </button>
              ))}
            </div>

            {/* ログアウト */}
            {user && (
              <div className="px-5 py-4 border-t border-gray-100">
                <button onClick={() => { logout(); setShowMenu(false); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-gray-600 border border-gray-200 bg-transparent cursor-pointer">
                  <LogOut size={14} />ログアウト
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── お店登録モーダル ──────────────────────────────────── */}
      {showRegisterModal && (
        <RegisterModal
          user={user}
          loginWithGoogle={loginWithGoogle}
          onClose={() => setShowRegisterModal(false)}
          onSuccess={() => { setShowRegisterModal(false); }}
        />
      )}

      {/* ── オーナー編集モーダル ──────────────────────────────── */}
      {showEditModal && selectedShop && (
        <OwnerEditModal
          shop={selectedShop}
          onClose={() => setShowEditModal(false)}
          onSave={(updated) => {
            setSelectedShop(s => ({ ...s, ...updated }));
            setShops(prev => prev.map(s => s.id === selectedShop.id ? { ...s, ...updated } : s));
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   お店登録モーダル（一般ユーザー用）
════════════════════════════════════════════════════════════ */
const CAT_OPTIONS = [
  { id: "wagashi",   label: "和菓子",   emoji: "🍡" },
  { id: "cake",      label: "ケーキ",   emoji: "🎂" },
  { id: "chocolate", label: "チョコ",   emoji: "🍫" },
  { id: "donut",     label: "ドーナツ", emoji: "🍩" },
  { id: "cookie",    label: "クッキー", emoji: "🍪" },
  { id: "icecream",  label: "アイス",   emoji: "🍦" },
  { id: "pudding",   label: "プリン",   emoji: "🍮" },
  { id: "macaron",   label: "マカロン", emoji: "🧁" },
  { id: "tart",      label: "タルト",   emoji: "🥧" },
  { id: "gift",      label: "手土産",   emoji: "🎀" },
];
const EMPTY_FORM = {
  name: "", station: "", walk_minutes: "", description: "",
  hours: "", price_range: "", emoji: "🍡", tags: "", category: [],
};
const INPUT_CLS = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white box-border";
const LABEL_CLS = "block text-xs text-gray-500 mb-1";

function RegisterModal({ user, loginWithGoogle, onClose, onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const font = "'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif";

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }
  function toggleCat(id) {
    setForm(f => ({
      ...f,
      category: f.category.includes(id)
        ? f.category.filter(c => c !== id)
        : [...f.category, id],
    }));
  }

  async function submit() {
    if (!form.name.trim() || !form.station.trim()) {
      alert("店舗名と最寄り駅は必須です"); return;
    }
    setSaving(true);
    const { error } = await supabase.from("shops").insert({
      name:         form.name.trim(),
      station:      form.station.trim(),
      walk_minutes: parseInt(form.walk_minutes) || 0,
      description:  form.description.trim(),
      hours:        form.hours.trim(),
      price_range:  form.price_range.trim(),
      emoji:        form.emoji || "🍡",
      tags:         form.tags ? form.tags.split(/[、,，\s]+/).map(t => t.trim()).filter(Boolean) : [],
      category:     form.category,
      status:       "pending",
      submitted_by: user.id,
    });
    setSaving(false);
    if (error) { alert("登録に失敗しました: " + error.message); return; }
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-[400]" style={{ fontFamily: font }}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl flex flex-col"
        style={{ maxHeight: "92vh" }}>
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="text-base font-bold text-gray-900">
            <PlusCircle size={16} className="inline mr-2 text-orange-500" />
            お店を登録する
          </div>
          <button onClick={onClose}
            className="bg-transparent border-none cursor-pointer p-1 rounded-full hover:bg-gray-100">
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {done ? (
          /* 完了画面 */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <CheckCircle size={56} className="text-green-500 mb-4" />
            <div className="text-lg font-bold text-gray-900 mb-2">登録申請を受け付けました</div>
            <div className="text-sm text-gray-500 mb-6 leading-relaxed">
              管理者が確認後、地図に掲載されます。<br />
              通常1〜2営業日以内に審査いたします。
            </div>
            <button onClick={onClose}
              className="px-8 py-3 rounded-xl text-white text-sm font-semibold border-none cursor-pointer"
              style={{ background: "#FF8C00" }}>
              閉じる
            </button>
          </div>
        ) : !user ? (
          /* 未ログイン */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="text-4xl mb-4">🔐</div>
            <div className="text-base font-bold text-gray-900 mb-2">ログインが必要です</div>
            <div className="text-sm text-gray-500 mb-6">Googleアカウントでログインしてください</div>
            <button onClick={loginWithGoogle}
              className="px-8 py-3 rounded-xl text-white text-sm font-semibold border-none cursor-pointer"
              style={{ background: "#4285F4" }}>
              Googleでログイン
            </button>
          </div>
        ) : (
          /* フォーム */
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* 店舗名 */}
            <div>
              <label className={LABEL_CLS}>店舗名 <span className="text-red-400">*</span></label>
              <input className={INPUT_CLS} value={form.name}
                onChange={e => set("name", e.target.value)}
                placeholder="例：とらや 新宿店" />
            </div>

            {/* 最寄り駅 + 徒歩 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>最寄り駅 <span className="text-red-400">*</span></label>
                <input className={INPUT_CLS} value={form.station}
                  onChange={e => set("station", e.target.value)}
                  placeholder="例：新宿" />
              </div>
              <div>
                <label className={LABEL_CLS}>徒歩（分）</label>
                <input className={INPUT_CLS} type="number" min="0" value={form.walk_minutes}
                  onChange={e => set("walk_minutes", e.target.value)}
                  placeholder="例：3" />
              </div>
            </div>

            {/* 営業時間 + 価格帯 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>営業時間</label>
                <input className={INPUT_CLS} value={form.hours}
                  onChange={e => set("hours", e.target.value)}
                  placeholder="10:00〜20:00" />
              </div>
              <div>
                <label className={LABEL_CLS}>価格帯</label>
                <input className={INPUT_CLS} value={form.price_range}
                  onChange={e => set("price_range", e.target.value)}
                  placeholder="¥500〜¥3,000" />
              </div>
            </div>

            {/* カテゴリ */}
            <div>
              <label className={LABEL_CLS}>カテゴリ</label>
              <div className="flex flex-wrap gap-2">
                {CAT_OPTIONS.map(({ id, label, emoji }) => (
                  <button key={id} type="button"
                    onClick={() => toggleCat(id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors"
                    style={form.category.includes(id)
                      ? { background: "#FF8C00", borderColor: "#FF8C00", color: "white" }
                      : { background: "white", borderColor: "#E5E7EB", color: "#555" }}>
                    {emoji} {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 絵文字 */}
            <div>
              <label className={LABEL_CLS}>絵文字アイコン</label>
              <input className={INPUT_CLS} value={form.emoji}
                onChange={e => set("emoji", e.target.value)}
                placeholder="🍡" style={{ fontSize: 20, width: 80 }} />
            </div>

            {/* タグ */}
            <div>
              <label className={LABEL_CLS}>タグ（カンマ区切り）</label>
              <input className={INPUT_CLS} value={form.tags}
                onChange={e => set("tags", e.target.value)}
                placeholder="例：和菓子、羊羹、手土産向け" />
            </div>

            {/* 説明 */}
            <div>
              <label className={LABEL_CLS}>お店の説明</label>
              <textarea className={INPUT_CLS} value={form.description}
                onChange={e => set("description", e.target.value)}
                rows={3} style={{ resize: "vertical" }}
                placeholder="お店の特徴や名物スイーツを教えてください..." />
            </div>

            <div className="pb-2">
              <p className="text-xs text-gray-400 mb-3">
                ※ 登録後は管理者の承認後に地図へ掲載されます
              </p>
              <button onClick={submit} disabled={saving}
                className="w-full py-3 rounded-xl text-white text-sm font-bold border-none cursor-pointer"
                style={{ background: saving ? "#ccc" : "#FF8C00" }}>
                {saving ? "送信中..." : "申請する"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   オーナー編集モーダル
════════════════════════════════════════════════════════════ */
function OwnerEditModal({ shop, onClose, onSave }) {
  const [hours,       setHours]       = useState(shop.hours       || "");
  const [description, setDescription] = useState(shop.description || "");
  const [price_range, setPriceRange]  = useState(shop.price_range || "");
  const [saving, setSaving]           = useState(false);
  const font = "'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif";

  async function save() {
    setSaving(true);
    const payload = { hours, description, price_range };
    const { error } = await supabase.from("shops").update(payload).eq("id", shop.id);
    setSaving(false);
    if (error) { alert("更新に失敗しました: " + error.message); return; }
    onSave(payload);
  }

  return (
    <div className="fixed inset-0 z-[400]" style={{ fontFamily: font }}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl" style={{ maxHeight: "80vh" }}>
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Pencil size={16} className="text-orange-500" />
            お店情報を編集
          </div>
          <button onClick={onClose}
            className="bg-transparent border-none cursor-pointer p-1 rounded-full hover:bg-gray-100">
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4">
          <div className="bg-orange-50 rounded-lg px-4 py-3 text-xs text-orange-700">
            📍 <span className="font-semibold">{shop.name}</span> の情報を編集できます
          </div>

          <div>
            <label className={LABEL_CLS}>営業時間</label>
            <input className={INPUT_CLS} value={hours}
              onChange={e => setHours(e.target.value)}
              placeholder="例：10:00〜20:00（月曜定休）" />
          </div>

          <div>
            <label className={LABEL_CLS}>価格帯</label>
            <input className={INPUT_CLS} value={price_range}
              onChange={e => setPriceRange(e.target.value)}
              placeholder="例：¥500〜¥3,000" />
          </div>

          <div>
            <label className={LABEL_CLS}>お店の説明</label>
            <textarea className={INPUT_CLS} value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4} style={{ resize: "vertical" }}
              placeholder="最新情報やおすすめ商品を更新してください..." />
          </div>

          <div className="pb-4">
            <button onClick={save} disabled={saving}
              className="w-full py-3 rounded-xl text-white text-sm font-bold border-none cursor-pointer"
              style={{ background: saving ? "#ccc" : "#FF8C00" }}>
              {saving ? "更新中..." : "更新する"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

