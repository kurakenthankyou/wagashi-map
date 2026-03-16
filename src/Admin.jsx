import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const CATEGORIES = [
  { id: "wagashi", label: "和菓子" },
  { id: "cake", label: "ケーキ・洋菓子" },
  { id: "chocolate", label: "チョコレート" },
  { id: "cookie", label: "クッキー" },
  { id: "candy", label: "キャンディ・飴" },
  { id: "gift", label: "手土産向け" },
];

const EMPTY_FORM = {
  name: "",
  station: "",
  walk_minutes: "",
  description: "",
  hours: "",
  price_range: "",
  emoji: "🍡",
  tags: "",
  category: [],
};

export default function Admin() {
  const [user, setUser] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    fetchShops();
  }, []);

  async function fetchShops() {
    setLoading(true);
    const { data } = await supabase.from("shops").select("*").order("created_at", { ascending: false });
    if (data) setShops(data);
    setLoading(false);
  }

  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.href },
    });
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  function startNew() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(shop) {
    setForm({
      name: shop.name || "",
      station: shop.station || "",
      walk_minutes: shop.walk_minutes || "",
      description: shop.description || "",
      hours: shop.hours || "",
      price_range: shop.price_range || "",
      emoji: shop.emoji || "🍡",
      tags: shop.tags?.join("、") || "",
      category: shop.category || [],
    });
    setEditingId(shop.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveShop() {
    if (!form.name || !form.station) {
      alert("店舗名と最寄り駅は必須です");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      station: form.station,
      walk_minutes: parseInt(form.walk_minutes) || 0,
      description: form.description,
      hours: form.hours,
      price_range: form.price_range,
      emoji: form.emoji,
      tags: form.tags ? form.tags.split(/[、,，]/).map(t => t.trim()).filter(Boolean) : [],
      category: form.category,
    };
    if (editingId) {
      await supabase.from("shops").update(payload).eq("id", editingId);
    } else {
      await supabase.from("shops").insert(payload);
    }
    await fetchShops();
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSaving(false);
  }

  async function deleteShop(id) {
    await supabase.from("shops").delete().eq("id", id);
    setDeleteConfirm(null);
    await fetchShops();
  }

  function toggleCategory(id) {
    setForm(f => ({
      ...f,
      category: f.category.includes(id)
        ? f.category.filter(c => c !== id)
        : [...f.category, id],
    }));
  }

  const filtered = shops.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.station?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const s = { 
    wrap: { fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto", padding: "0 16px 40px", background: "#fdf8f3", minHeight: "100vh" },
    header: { background: "white", borderBottom: "0.5px solid #eee", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
    title: { fontSize: 18, fontWeight: 500 },
    btn: (color) => ({ background: color, color: "white", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13 }),
    input: { width: "100%", padding: "9px 12px", border: "0.5px solid #ddd", borderRadius: 8, fontSize: 13, fontFamily: "sans-serif", boxSizing: "border-box" },
    label: { fontSize: 12, color: "#888", marginBottom: 4, display: "block" },
    card: { background: "white", borderRadius: 12, border: "0.5px solid #eee", padding: "14px 16px", marginBottom: 10 },
    row: { display: "flex", alignItems: "center", gap: 10 },
  };

  if (!user) {
    return (
      <div style={{ ...s.wrap, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🍡</div>
          <div style={{ fontSize: 20, fontWeight: 500, marginBottom: 8 }}>管理画面</div>
          <div style={{ fontSize: 14, color: "#999", marginBottom: 24 }}>Googleアカウントでログインしてください</div>
          <button onClick={loginWithGoogle} style={s.btn("#4285f4")}>Googleでログイン</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.title}>🍡 管理画面 <span style={{ fontSize: 13, color: "#c2536a", fontWeight: 400 }}>({filtered.length}件)</span></div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#999" }}>{user.user_metadata?.full_name?.split(" ")[0]}さん</span>
          <button onClick={startNew} style={s.btn("#c2536a")}>＋ 新規追加</button>
          <button onClick={logout} style={{ ...s.btn("white"), color: "#999", border: "0.5px solid #ddd" }}>ログアウト</button>
        </div>
      </div>

      <div style={{ padding: "16px 0" }}>
        {showForm && (
          <div style={{ ...s.card, marginBottom: 20, border: "1.5px solid #c2536a" }}>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16, color: "#c2536a" }}>
              {editingId ? "✏️ 店舗を編集" : "＋ 新しいお店を追加"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={s.label}>店舗名 *</label>
                <input style={s.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="例：とらや 新宿店" />
              </div>
              <div>
                <label style={s.label}>最寄り駅 *</label>
                <input style={s.input} value={form.station} onChange={e => setForm(f => ({ ...f, station: e.target.value }))} placeholder="例：新宿駅" />
              </div>
              <div>
                <label style={s.label}>徒歩（分）</label>
                <input style={s.input} type="number" value={form.walk_minutes} onChange={e => setForm(f => ({ ...f, walk_minutes: e.target.value }))} placeholder="例：3" />
              </div>
              <div>
                <label style={s.label}>価格帯</label>
                <input style={s.input} value={form.price_range} onChange={e => setForm(f => ({ ...f, price_range: e.target.value }))} placeholder="例：¥800〜¥5,000" />
              </div>
              <div>
                <label style={s.label}>営業時間</label>
                <input style={s.input} value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} placeholder="例：10:00〜20:00" />
              </div>
              <div>
                <label style={s.label}>絵文字</label>
                <input style={s.input} value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} placeholder="例：🍡" />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={s.label}>説明</label>
              <textarea style={{ ...s.input, minHeight: 70, resize: "vertical" }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="お店の説明を入力..." />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={s.label}>タグ（読点・カンマ区切り）</label>
              <input style={s.input} value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="例：和菓子、羊羹、手土産向け" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>カテゴリ</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {CATEGORIES.map(c => (
                  <div key={c.id} onClick={() => toggleCategory(c.id)}
                    style={{ padding: "5px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer", border: "0.5px solid", borderColor: form.category.includes(c.id) ? "#c2536a" : "#ddd", background: form.category.includes(c.id) ? "#c2536a" : "white", color: form.category.includes(c.id) ? "white" : "#666" }}>
                    {c.label}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={saveShop} disabled={saving} style={s.btn("#c2536a")}>{saving ? "保存中..." : editingId ? "更新する" : "追加する"}</button>
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }} style={{ ...s.btn("white"), color: "#666", border: "0.5px solid #ddd" }}>キャンセル</button>
            </div>
          </div>
        )}

        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="店舗名・駅名で検索..."
          style={{ ...s.input, marginBottom: 16, background: "white" }} />

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#bbb" }}>読み込み中...</div>
        ) : (
          <>
            {paged.map(shop => (
              <div key={shop.id} style={s.card}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ fontSize: 32, lineHeight: 1 }}>{shop.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{shop.name}</div>
                    <div style={{ fontSize: 12, color: "#999", margin: "2px 0" }}>📍 {shop.station} 徒歩{shop.walk_minutes}分　💴 {shop.price_range}</div>
                    <div style={{ fontSize: 12, color: "#bbb" }}>{shop.description?.slice(0, 60)}{shop.description?.length > 60 ? "..." : ""}</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                      {shop.tags?.map(t => (
                        <span key={t} style={{ background: "#f5f0ea", color: "#888", fontSize: 11, padding: "2px 8px", borderRadius: 10 }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => startEdit(shop)} style={{ ...s.btn("#4285f4"), padding: "6px 12px" }}>編集</button>
                    <button onClick={() => setDeleteConfirm(shop.id)} style={{ ...s.btn("#e74c3c"), padding: "6px 12px" }}>削除</button>
                  </div>
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ ...s.btn(page === 1 ? "#eee" : "#c2536a"), color: page === 1 ? "#bbb" : "white" }}>← 前</button>
                <span style={{ padding: "8px 16px", fontSize: 13, color: "#666" }}>{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ ...s.btn(page === totalPages ? "#eee" : "#c2536a"), color: page === totalPages ? "#bbb" : "white" }}>次 →</button>
              </div>
            )}
          </>
        )}
      </div>

      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "white", borderRadius: 12, padding: 24, maxWidth: 320, width: "90%", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>本当に削除しますか？</div>
            <div style={{ fontSize: 13, color: "#999", marginBottom: 20 }}>この操作は取り消せません</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button onClick={() => deleteShop(deleteConfirm)} style={s.btn("#e74c3c")}>削除する</button>
              <button onClick={() => setDeleteConfirm(null)} style={{ ...s.btn("white"), color: "#666", border: "0.5px solid #ddd" }}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
