import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import "./App.css";

export default function App() {
  const [shops, setShops] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("list");
  const [selectedShop, setSelectedShop] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [pendingRating, setPendingRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchShops();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchFavorites(session.user.id);
    });
  }, []);

  useEffect(() => {
    if (user) fetchFavorites(user.id);
  }, [user]);

  useEffect(() => {
    if (selectedShop) fetchReviews(selectedShop.id);
  }, [selectedShop]);

  async function fetchShops() {
    const { data } = await supabase.from("shops").select("*");
    if (data) setShops(data);
  }

  async function fetchReviews(shopId) {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });
    if (data) setReviews(data);
  }

  async function fetchFavorites(userId) {
    const { data } = await supabase
      .from("favorites")
      .select("shop_id")
      .eq("user_id", userId);
    if (data) setFavorites(new Set(data.map((f) => f.shop_id)));
  }

  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.href },
    });
  }

  async function logout() {
    await supabase.auth.signOut();
    setFavorites(new Set());
  }

  async function toggleFavorite(shopId) {
    if (!user) { loginWithGoogle(); return; }
    if (favorites.has(shopId)) {
      await supabase.from("favorites").delete()
        .eq("shop_id", shopId).eq("user_id", user.id);
      setFavorites((prev) => { const s = new Set(prev); s.delete(shopId); return s; });
    } else {
      await supabase.from("favorites").insert({ shop_id: shopId, user_id: user.id });
      setFavorites((prev) => new Set([...prev, shopId]));
    }
  }

  async function submitReview() {
    if (!user) { loginWithGoogle(); return; }
    if (!pendingRating) { alert("星評価を選んでください"); return; }
    if (!reviewText.trim()) { alert("コメントを入力してください"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      shop_id: selectedShop.id,
      user_id: user.id,
      user_name: user.user_metadata?.full_name || "ユーザー",
      rating: pendingRating,
      comment: reviewText.trim(),
    });
    if (!error) {
      setPendingRating(0);
      setReviewText("");
      fetchReviews(selectedShop.id);
    }
    setSubmitting(false);
  }

  const stations = [...new Set(shops.map((s) => s.station))];

  const filteredShops = shops.filter((s) => {
    if (categoryFilter !== "all" && !s.category?.includes(categoryFilter)) return false;
    if (stationFilter && s.station !== stationFilter) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !s.tags?.join("").toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const favoriteShops = shops.filter((s) => favorites.has(s.id));

  function renderStars(score, size = 14) {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < score ? "#e88c30" : "#ddd", fontSize: size }}>{i < score ? "★" : "☆"}</span>
    ));
  }

  function avgRating(shopId) {
    const r = reviews.filter((r) => r.shop_id === shopId);
    if (!r.length) return null;
    return (r.reduce((a, b) => a + b.rating, 0) / r.length).toFixed(1);
  }

  function ShopCard({ shop }) {
    const isFav = favorites.has(shop.id);
    return (
      <div onClick={() => { setSelectedShop(shop); setTab("detail"); }}
        style={{ background: "var(--card-bg)", border: "0.5px solid var(--border)", borderRadius: 12, overflow: "hidden", cursor: "pointer" }}>
        <div style={{ height: 110, background: "#f8ede0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52 }}>
          {shop.emoji}
        </div>
        <div style={{ padding: "12px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontWeight: 500, fontSize: 14, flex: 1 }}>{shop.name}</div>
            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(shop.id); }}
              style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: isFav ? "#e05a7a" : "#ccc", padding: 0 }}>
              {isFav ? "♥" : "♡"}
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "4px 0" }}>
            {renderStars(Math.round(parseFloat(avgRating(shop.id) || 0)))}
            <span style={{ fontSize: 13, fontWeight: 500 }}>{avgRating(shop.id) || "-"}</span>
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
            {shop.tags?.map((t) => (
              <span key={t} style={{ background: "#f5f0ea", color: "#888", fontSize: 11, padding: "2px 8px", borderRadius: 10 }}>{t}</span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "#999" }}>📍 {shop.station} 徒歩{shop.walk_minutes}分</div>
        </div>
      </div>
    );
  }

  function DetailView() {
    const s = selectedShop;
    const shopReviews = reviews.filter((r) => r.shop_id === s.id);
    return (
      <div>
        <div style={{ height: 150, background: "linear-gradient(135deg,#f8e8d0,#f5d5c0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, position: "relative" }}>
          <button onClick={() => { setSelectedShop(null); setTab("list"); }}
            style={{ position: "absolute", top: 12, left: 12, background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13 }}>
            ← 戻る
          </button>
          {s.emoji}
        </div>
        <div style={{ padding: "20px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 500 }}>{s.name}</div>
              <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>{s.description}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 30, fontWeight: 500, color: "#c2536a" }}>{avgRating(s.id) || "-"}</div>
              <div>{renderStars(Math.round(parseFloat(avgRating(s.id) || 0)), 14)}</div>
              <div style={{ fontSize: 12, color: "#999" }}>{shopReviews.length}件</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
            {[["最寄り駅", `📍 ${s.station} 徒歩${s.walk_minutes}分`],
              ["営業時間", `🕐 ${s.hours}`],
              ["価格帯", `💴 ${s.price_range}`],
              ["カテゴリ", s.tags?.join(" / ")]].map(([label, value]) => (
              <div key={label} style={{ background: "#f8f5f0", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 11, color: "#999", marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#f8f5f0", borderRadius: 10, padding: 16, marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 10 }}>口コミを投稿する</div>
            {!user ? (
              <button onClick={loginWithGoogle}
                style={{ background: "#4285f4", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 14, width: "100%" }}>
                Googleでログインして投稿する
              </button>
            ) : (
              <>
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button key={i} onClick={() => setPendingRating(i)}
                      style={{ background: "none", border: "none", fontSize: 26, cursor: "pointer", color: i <= pendingRating ? "#e88c30" : "#ddd", padding: 0 }}>★</button>
                  ))}
                </div>
                <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                  placeholder="このお店の感想を書いてください..."
                  style={{ width: "100%", padding: "10px 12px", border: "0.5px solid #ddd", borderRadius: 8, fontSize: 13, fontFamily: "inherit", resize: "vertical", minHeight: 80, marginBottom: 8, boxSizing: "border-box" }} />
                <button onClick={submitReview} disabled={submitting}
                  style={{ background: "#c2536a", color: "white", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 13 }}>
                  {submitting ? "投稿中..." : "投稿する"}
                </button>
              </>
            )}
          </div>

          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, paddingBottom: 8, borderBottom: "0.5px solid #eee" }}>
            口コミ一覧（{shopReviews.length}件）
          </div>
          {shopReviews.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#999", fontSize: 14 }}>まだ口コミがありません。最初の投稿者になりましょう！</div>
          ) : shopReviews.map((r) => (
            <div key={r.id} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: "0.5px solid #f0f0f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#e8f0fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, color: "#4285f4" }}>
                  {(r.user_name || "?")[0]}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{r.user_name || "ユーザー"}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#bbb" }}>{new Date(r.created_at).toLocaleDateString("ja-JP")}</span>
              </div>
              <div style={{ marginBottom: 4 }}>{renderStars(r.rating, 13)}</div>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>{r.comment}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", fontFamily: "sans-serif", background: "#fdf8f3", minHeight: "100vh" }}>
      <div style={{ background: "white", borderBottom: "0.5px solid #eee", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ fontSize: 18, fontWeight: 500, whiteSpace: "nowrap" }}>和菓子<span style={{ color: "#c2536a" }}>マップ</span></div>
        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="お店・スイーツを検索..." 
          style={{ flex: 1, padding: "7px 12px", border: "0.5px solid #ddd", borderRadius: 8, fontSize: 13 }} />
        <select value={stationFilter} onChange={(e) => setStationFilter(e.target.value)}
          style={{ padding: "7px 10px", border: "0.5px solid #ddd", borderRadius: 8, fontSize: 13 }}>
          <option value="">すべての駅</option>
          {stations.map((s) => <option key={s}>{s}</option>)}
        </select>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#999", whiteSpace: "nowrap" }}>{user.user_metadata?.full_name?.split(" ")[0]}さん</span>
            <button onClick={logout} style={{ fontSize: 12, padding: "5px 10px", border: "0.5px solid #ddd", borderRadius: 6, cursor: "pointer", background: "white" }}>ログアウト</button>
          </div>
        ) : (
          <button onClick={loginWithGoogle}
            style={{ background: "#4285f4", color: "white", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>
            Googleでログイン
          </button>
        )}
      </div>

      <div style={{ display: "flex", background: "white", borderBottom: "0.5px solid #eee", padding: "0 16px" }}>
        {[["list", "一覧"], ["favorites", "お気に入り"]].map(([id, label]) => (
          <div key={id} onClick={() => { setTab(id); setSelectedShop(null); }}
            style={{ padding: "12px 16px", fontSize: 14, cursor: "pointer", borderBottom: tab === id ? "2px solid #c2536a" : "2px solid transparent", color: tab === id ? "#c2536a" : "#999", fontWeight: tab === id ? 500 : 400 }}>
            {label}
          </div>
        ))}
      </div>

      <div style={{ padding: "0 16px 16px" }}>
        {tab === "detail" && selectedShop ? <DetailView /> : (
          <>
            {tab === "list" && (
              <div style={{ display: "flex", gap: 8, padding: "14px 0", flexWrap: "wrap" }}>
                {[["all", "すべて"], ["wagashi", "和菓子"], ["chocolate", "チョコレート"], ["cake", "ケーキ"], ["cookie", "クッキー"], ["gift", "手土産向け"]].map(([id, label]) => (
                  <div key={id} onClick={() => setCategoryFilter(id)}
                    style={{ padding: "6px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer", border: "0.5px solid", borderColor: categoryFilter === id ? "#c2536a" : "#ddd", background: categoryFilter === id ? "#c2536a" : "white", color: categoryFilter === id ? "white" : "#666" }}>
                    {label}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
              {(tab === "list" ? filteredShops : favoriteShops).map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
              {(tab === "list" ? filteredShops : favoriteShops).length === 0 && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px 0", color: "#bbb", fontSize: 14 }}>
                  {tab === "favorites" ? "♡ まだお気に入りがありません" : "条件に合うお店が見つかりませんでした"}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}