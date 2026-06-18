"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";

const CAT_COLORS = {
  "Comedy": "#E8A13A",
  "Food & Recipes": "#3FAE6A",
  "Art & Illustration": "#D8607A",
  "Fitness & Wellness": "#2BA39B",
  "Relationships & Life": "#E8745B",
  "News & Commentary": "#5B7DB1",
  "Untagged": "#9AA0A6",
};
const catColor = (c) => CAT_COLORS[c] || "#9AA0A6";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Hanken+Grotesk:wght@400;500;600;700&display=swap');

.stash-root { --ink:#20232E; --muted:#6B7280; --canvas:#F3F2F7; --card:#FFFFFF;
  --line:#E7E6EE; --violet:#5B3FD6; --violet-soft:#ECE8FE;
  background:var(--canvas); color:var(--ink); min-height:100vh;
  font-family:'Hanken Grotesk', ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing:antialiased; }
.stash-wrap { max-width:1080px; margin:0 auto; padding:28px 20px 80px; }
.stash-brandrow { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.stash-brand { font-family:'Bricolage Grotesque', sans-serif; font-weight:800; font-size:34px; letter-spacing:-0.02em; line-height:1; margin:0; display:flex; align-items:center; gap:10px; }
.stash-mark { width:26px; height:30px; }
.stash-tag { color:var(--muted); font-size:15px; margin:8px 0 0; }
.stash-tag b { color:var(--ink); font-weight:700; }
.stash-ws { font-size:13px; color:var(--muted); margin:6px 0 0; }
.stash-ws b { color:var(--ink); font-weight:700; }
.stash-lock { font-family:inherit; font-size:13px; font-weight:700; color:var(--violet); background:none; border:none; cursor:pointer; padding:0; }
.stash-lock:hover { text-decoration:underline; }
.stash-add { font-family:inherit; font-weight:700; font-size:15px; background:var(--violet); color:#fff; border:none; border-radius:999px; padding:11px 20px; cursor:pointer; transition:transform .12s, box-shadow .12s; box-shadow:0 2px 0 rgba(91,63,214,.25); }
.stash-add:hover { transform:translateY(-1px); box-shadow:0 5px 16px rgba(91,63,214,.3); }
.stash-add:focus-visible { outline:3px solid var(--violet-soft); outline-offset:2px; }
.stash-controls { margin-top:26px; }
.stash-search { width:100%; box-sizing:border-box; font-family:inherit; font-size:17px; padding:15px 18px 15px 46px; border:1.5px solid var(--line); border-radius:14px; background:var(--card) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.2' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m21 21-4.3-4.3'/%3E%3C/svg%3E") no-repeat 16px center; color:var(--ink); transition:border-color .12s, box-shadow .12s; }
.stash-search::placeholder { color:#9AA0A6; }
.stash-search:focus { outline:none; border-color:var(--violet); box-shadow:0 0 0 4px var(--violet-soft); }
.stash-pills { display:flex; flex-wrap:wrap; gap:8px; margin-top:16px; }
.stash-pill { font-family:inherit; font-size:14px; font-weight:600; cursor:pointer; padding:7px 14px; border-radius:999px; border:1.5px solid var(--line); background:var(--card); color:var(--ink); display:flex; align-items:center; gap:7px; transition:border-color .12s, background .12s; }
.stash-pill:hover { border-color:#cfcde0; }
.stash-pill:focus-visible { outline:3px solid var(--violet-soft); outline-offset:1px; }
.stash-dot { width:9px; height:9px; border-radius:50%; flex:none; }
.stash-pill[data-active="true"] { color:#fff; border-color:transparent; }
.stash-meta { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:22px; flex-wrap:wrap; }
.stash-count { font-size:14px; color:var(--muted); }
.stash-count b { color:var(--ink); font-weight:700; }
.stash-sort { display:flex; gap:4px; background:#EAE9F1; padding:3px; border-radius:10px; }
.stash-sortbtn { font-family:inherit; font-size:13px; font-weight:600; border:none; background:transparent; color:var(--muted); padding:6px 12px; border-radius:8px; cursor:pointer; }
.stash-sortbtn[data-active="true"] { background:var(--card); color:var(--ink); box-shadow:0 1px 3px rgba(0,0,0,.08); }
.stash-tagrow { display:flex; align-items:center; gap:8px; margin-top:14px; flex-wrap:wrap; }
.stash-taglabel { font-size:12.5px; color:var(--muted); font-weight:600; text-transform:uppercase; letter-spacing:.04em; }
.stash-qtag { font-family:inherit; font-size:13px; cursor:pointer; border:none; background:var(--violet-soft); color:#4226c4; padding:5px 11px; border-radius:8px; font-weight:600; transition:background .12s; }
.stash-qtag:hover { background:#ddd5fd; }
.stash-qtag[data-active="true"] { background:var(--violet); color:#fff; }
.stash-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(300px,1fr)); gap:16px; margin-top:22px; align-items:start; }
.stash-card { background:var(--card); border:1px solid var(--line); border-radius:16px; overflow:hidden; display:flex; transition:transform .14s, box-shadow .14s; }
.stash-card:hover { transform:translateY(-3px); box-shadow:0 12px 28px rgba(32,35,46,.10); }
.stash-card[data-editing="true"] { transform:none; box-shadow:0 12px 28px rgba(91,63,214,.16); border-color:#cdbffb; }
.stash-spine { width:7px; flex:none; }
.stash-body { padding:16px 18px 16px 15px; display:flex; flex-direction:column; gap:9px; min-width:0; flex:1; }
.stash-cardtop { display:flex; align-items:center; justify-content:space-between; gap:10px; }
.stash-owner { font-weight:700; font-size:14.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.stash-type { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; padding:3px 8px; border-radius:6px; flex:none; }
.stash-summary { font-size:15.5px; font-weight:600; line-height:1.32; margin:0; }
.stash-caption { font-size:13.5px; line-height:1.45; color:var(--muted); margin:0; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
.stash-chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:2px; }
.stash-chip { font-family:inherit; font-size:12px; cursor:pointer; border:1px solid var(--line); background:#FAFAFC; color:#4b5060; padding:3px 9px; border-radius:7px; font-weight:500; transition:background .1s,border-color .1s; }
.stash-chip:hover { background:var(--violet-soft); border-color:transparent; color:#4226c4; }
.stash-cardfoot { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:4px; }
.stash-date { font-size:12.5px; color:#9AA0A6; }
.stash-edited { color:var(--violet); font-weight:600; }
.stash-footright { display:flex; align-items:center; gap:14px; }
.stash-editbtn { font-family:inherit; font-size:13px; font-weight:700; color:var(--muted); background:none; border:none; cursor:pointer; padding:0; display:inline-flex; align-items:center; gap:4px; }
.stash-editbtn:hover { color:var(--ink); }
.stash-link { font-size:13px; font-weight:700; color:var(--violet); text-decoration:none; display:inline-flex; align-items:center; gap:4px; }
.stash-link:hover { text-decoration:underline; }
.stash-editbox { display:flex; flex-direction:column; gap:12px; margin-top:4px; }
.stash-flabel { font-size:11.5px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--muted); margin-bottom:5px; display:block; }
.stash-etext { width:100%; box-sizing:border-box; font-family:inherit; font-size:14.5px; line-height:1.4; padding:10px 12px; border:1.5px solid var(--line); border-radius:10px; color:var(--ink); min-height:62px; resize:vertical; }
.stash-etext:focus { outline:none; border-color:var(--violet); box-shadow:0 0 0 3px var(--violet-soft); }
.stash-etags { display:flex; flex-wrap:wrap; gap:6px; }
.stash-etag { font-size:12px; background:var(--violet-soft); color:#4226c4; padding:3px 4px 3px 9px; border-radius:7px; font-weight:600; display:inline-flex; align-items:center; gap:4px; }
.stash-etag button { border:none; background:none; cursor:pointer; color:#7a63d6; font-size:15px; line-height:1; padding:0 2px; }
.stash-etag button:hover { color:#4226c4; }
.stash-addtag { font-family:inherit; font-size:13px; padding:7px 10px; border:1.5px dashed var(--line); border-radius:8px; color:var(--ink); width:130px; }
.stash-addtag:focus { outline:none; border-color:var(--violet); border-style:solid; }
.stash-orig { background:#FAFAFC; border:1px solid var(--line); border-radius:10px; padding:10px 12px; }
.stash-origtext { font-size:13px; line-height:1.45; color:var(--muted); margin:4px 0 0; max-height:96px; overflow:auto; }
.stash-editrow { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:2px; }
.stash-retag { font-family:inherit; font-size:13.5px; font-weight:700; color:var(--violet); background:var(--violet-soft); border:none; border-radius:999px; padding:9px 14px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; }
.stash-retag:hover { background:#ddd5fd; }
.stash-retag:disabled { opacity:.6; cursor:default; }
.stash-spacer { flex:1; }
.stash-cancel2 { font-family:inherit; font-size:13.5px; font-weight:700; color:var(--muted); background:none; border:none; cursor:pointer; padding:9px 10px; }
.stash-save2 { font-family:inherit; font-size:13.5px; font-weight:700; color:#fff; background:var(--violet); border:none; border-radius:999px; padding:9px 18px; cursor:pointer; }
.stash-save2:disabled { opacity:.6; cursor:default; }
.stash-empty { text-align:center; padding:64px 20px; color:var(--muted); }
.stash-empty h3 { font-family:'Bricolage Grotesque',sans-serif; font-size:21px; color:var(--ink); margin:0 0 6px; }
.stash-clear { font-family:inherit; margin-top:14px; background:none; border:1.5px solid var(--violet); color:var(--violet); font-weight:700; font-size:14px; padding:9px 18px; border-radius:999px; cursor:pointer; }
.stash-overlay { position:fixed; inset:0; background:rgba(32,35,46,.45); display:flex; align-items:center; justify-content:center; padding:20px; z-index:50; }
.stash-modal { background:var(--card); border-radius:20px; width:100%; max-width:460px; padding:26px; box-shadow:0 24px 60px rgba(0,0,0,.3); }
.stash-modal h2 { font-family:'Bricolage Grotesque',sans-serif; font-size:23px; margin:0 0 4px; }
.stash-modal p.sub { color:var(--muted); font-size:14px; margin:0 0 18px; }
.stash-label { font-size:13px; font-weight:700; display:block; margin:14px 0 6px; }
.stash-input, .stash-textarea { width:100%; box-sizing:border-box; font-family:inherit; font-size:15px; padding:11px 13px; border:1.5px solid var(--line); border-radius:11px; color:var(--ink); }
.stash-input:focus, .stash-textarea:focus { outline:none; border-color:var(--violet); box-shadow:0 0 0 3px var(--violet-soft); }
.stash-textarea { min-height:74px; resize:vertical; }
.stash-modalrow { display:flex; gap:10px; margin-top:22px; }
.stash-cancel { flex:1; font-family:inherit; font-weight:700; font-size:15px; background:#EFEEF4; color:var(--ink); border:none; border-radius:999px; padding:12px; cursor:pointer; }
.stash-save { flex:2; font-family:inherit; font-weight:700; font-size:15px; background:var(--violet); color:#fff; border:none; border-radius:999px; padding:12px; cursor:pointer; }
.stash-save:disabled { opacity:.5; cursor:not-allowed; }
.stash-note { font-size:12.5px; color:var(--muted); margin:16px 0 0; line-height:1.4; background:#FAFAFC; border:1px solid var(--line); border-radius:10px; padding:10px 12px; }
.stash-err { font-size:13px; color:#B42318; background:#FEF3F2; border:1px solid #FDA29B; border-radius:9px; padding:9px 12px; margin:0; }
.stash-center { max-width:380px; margin:14vh auto 0; text-align:center; }
.stash-center h1 { font-family:'Bricolage Grotesque',sans-serif; font-size:30px; margin:0 0 8px; display:flex; align-items:center; justify-content:center; gap:10px; }
.stash-center p { color:var(--muted); margin:0 0 18px; }
.stash-spinner { width:34px; height:34px; border:3px solid var(--violet-soft); border-top-color:var(--violet); border-radius:50%; animation:stash-spin .8s linear infinite; margin:18vh auto 0; }
@keyframes stash-spin { to { transform:rotate(360deg); } }
.stash-attrib { font-size:13px; color:var(--muted); font-weight:500; margin:6px 0 0; }
.stash-footright { flex-wrap:wrap; gap:12px; }
.stash-delbtn { font-family:inherit; font-size:13px; font-weight:700; color:var(--muted); background:none; border:none; cursor:pointer; padding:0; }
.stash-delbtn:hover { color:#B42318; }
.stash-del-confirm { flex:2; font-family:inherit; font-weight:700; font-size:15px; background:#B42318; color:#fff; border:none; border-radius:999px; padding:12px; cursor:pointer; }
.stash-del-confirm:disabled { opacity:.6; cursor:default; }
.stash-toast { position:fixed; left:50%; bottom:24px; transform:translateX(-50%); z-index:60; background:#20232E; color:#fff; padding:12px 14px 12px 18px; border-radius:12px; display:flex; align-items:center; gap:16px; box-shadow:0 12px 30px rgba(0,0,0,.28); font-size:14px; animation:stash-rise .18s ease-out; }
.stash-toast button { font-family:inherit; font-weight:800; font-size:14px; color:#C9BBFF; background:none; border:none; cursor:pointer; padding:4px 6px; }
.stash-toast button:hover { color:#fff; }
@keyframes stash-rise { from { opacity:0; transform:translate(-50%, 10px); } to { opacity:1; transform:translate(-50%, 0); } }
@media (max-width:520px){ .stash-brand{font-size:28px;} .stash-grid{grid-template-columns:1fr;} }
@media (prefers-reduced-motion:reduce){ .stash-card,.stash-add{transition:none;} .stash-spinner{animation-duration:2s;} .stash-toast{animation:none;} }
`;

function getKey() { try { return localStorage.getItem("stash-key"); } catch { return null; } }
async function api(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  const k = getKey();
  if (k) headers["x-stash-key"] = k;
  return fetch(path, { ...opts, headers });
}

function Mark() {
  return (
    <svg className="stash-mark" viewBox="0 0 26 30" fill="none" aria-hidden="true">
      <path d="M3 2.5h20a1 1 0 0 1 1 1v23.4a1 1 0 0 1-1.6.8L13 24.2l-9.4 6.5A1 1 0 0 1 2 29.9V3.5a1 1 0 0 1 1-1Z" fill="#5B3FD6"/>
    </svg>
  );
}

export default function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gate, setGate] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [workspace, setWorkspace] = useState(null);
  const [handle, setHandle] = useState(null);

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [activeTag, setActiveTag] = useState(null);
  const [sort, setSort] = useState("newest");
  const [adding, setAdding] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  async function load() {
    setLoading(true); setError("");
    try {
      const res = await api("/api/posts");
      if (res.status === 401) { setGate(true); setLoading(false); return; }
      if (!res.ok) { setError("Couldn't load your posts. Try refreshing."); setLoading(false); return; }
      const body = await res.json(); setPosts(body.posts || []); setWorkspace(body.workspace || null); setHandle(body.handle || null); setGate(false);
    } catch { setError("Couldn't reach the server. Check your connection and refresh."); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function submitKey() {
    try { localStorage.setItem("stash-key", keyInput.trim()); } catch {}
    setKeyInput(""); load();
  }
  function lock() {
    try { localStorage.removeItem("stash-key"); } catch {}
    setWorkspace(null); setHandle(null); setPosts([]); setGate(true);
  }

  async function savePost({ id, summary, tags }) {
    const res = await api("/api/update", { method: "POST", body: JSON.stringify({ id, summary, tags }) });
    if (!res.ok) return false;
    const row = await res.json();
    setPosts((prev) => prev.map((p) => (p.id === row.id ? row : p)));
    return true;
  }
  async function retagPost({ id, text }) {
    const res = await api("/api/retag", { method: "POST", body: JSON.stringify({ id, text }) });
    if (!res.ok) return null;
    const row = await res.json();
    setPosts((prev) => prev.map((p) => (p.id === row.id ? row : p)));
    return row;
  }
  async function addPost({ url, caption }) {
    const res = await api("/api/add", { method: "POST", body: JSON.stringify({ url, caption }) });
    if (!res.ok) { const e = await res.json().catch(() => ({})); return { error: e.error || "Add failed." }; }
    const row = await res.json();
    setPosts((prev) => [row, ...prev.filter((p) => p.id !== row.id)]);
    return { ok: true };
  }
  // Deferred delete: the card disappears right away, but the row isn't actually
  // removed from the database until the 5s undo window closes.
  const delTimer = useRef(null);
  const pendingRef = useRef(null);
  const [toast, setToast] = useState(null);

  function commitDelete(id) {
    api("/api/delete", { method: "POST", body: JSON.stringify({ id }) }).catch(() => {});
  }
  function requestDelete(post) {
    // If another delete is still in its undo window, finalize it now.
    if (pendingRef.current && pendingRef.current.id !== post.id) {
      if (delTimer.current) clearTimeout(delTimer.current);
      commitDelete(pendingRef.current.id);
    }
    pendingRef.current = post;
    setToast(post);
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    delTimer.current = setTimeout(() => {
      commitDelete(post.id);
      pendingRef.current = null;
      delTimer.current = null;
      setToast(null);
    }, 5000);
  }
  function undoDelete() {
    if (delTimer.current) { clearTimeout(delTimer.current); delTimer.current = null; }
    const p = pendingRef.current;
    pendingRef.current = null;
    if (p) setPosts((prev) => [p, ...prev]);
    setToast(null);
  }
  useEffect(() => () => { if (delTimer.current) clearTimeout(delTimer.current); }, []);

  const categories = useMemo(() => {
    const c = {}; posts.forEach((p) => { c[p.category] = (c[p.category] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([x]) => x);
  }, [posts]);
  const popularTags = useMemo(() => {
    const c = {}; posts.forEach((p) => (p.tags || []).forEach((t) => { c[t] = (c[t] || 0) + 1; }));
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t);
  }, [posts]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = posts.filter((p) => {
      if (cat !== "All" && p.category !== cat) return false;
      if (activeTag && !(p.tags || []).includes(activeTag)) return false;
      if (q) {
        const hay = [p.caption, p.summary, p.owner_name, p.owner_username, p.content_type, (p.tags || []).join(" ")].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    out = [...out].sort((a, b) => sort === "newest"
      ? (b.saved_date || "").localeCompare(a.saved_date || "")
      : (a.saved_date || "").localeCompare(b.saved_date || ""));
    return out;
  }, [posts, query, cat, activeTag, sort]);

  const clearAll = () => { setQuery(""); setCat("All"); setActiveTag(null); };

  if (gate) {
    return (
      <div className="stash-root"><style>{CSS}</style>
        <div className="stash-center">
          <h1><Mark/>Instagrouper</h1>
          <p className="stash-attrib" style={{ marginBottom: 14 }}>by Jay Nargundkar (2026)</p>
          <p>Enter your passphrase to open your workspace.</p>
          <input className="stash-input" type="password" value={keyInput} autoFocus
            placeholder="Passphrase" onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submitKey(); }} />
          <div style={{ marginTop: 12 }}>
            <button className="stash-save" style={{ width: "100%" }} onClick={submitKey}>Open</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stash-root"><style>{CSS}</style>
      <div className="stash-wrap">
        <div className="stash-brandrow">
          <div>
            <h1 className="stash-brand"><Mark/>Instagrouper</h1>
            <p className="stash-attrib">by Jay Nargundkar (2026)</p>
            <p className="stash-tag"><b>{posts.length} saved posts.</b> Find the one you were looking for.</p>
            {workspace && <p className="stash-ws">{handle ? <>Account: <b>@{handle}</b></> : <>Workspace: <b>{workspace}</b></>} · <button className="stash-lock" onClick={lock}>Lock</button></p>}
          </div>
          <button className="stash-add" onClick={() => setAdding(true)}>+ Add a post</button>
        </div>

        {loading ? <div className="stash-spinner" aria-label="Loading" /> : error ? (
          <p className="stash-err" style={{ marginTop: 24 }}>{error}</p>
        ) : (
          <>
            <div className="stash-controls">
              <input className="stash-search" placeholder="Search captions, creators, tags…"
                value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search saved posts" />
              <div className="stash-pills" role="group" aria-label="Filter by category">
                <button className="stash-pill" data-active={cat === "All"} style={cat === "All" ? { background: "#20232E" } : {}} onClick={() => setCat("All")}>All</button>
                {categories.map((c) => (
                  <button key={c} className="stash-pill" data-active={cat === c} style={cat === c ? { background: catColor(c) } : {}} onClick={() => setCat(cat === c ? "All" : c)}>
                    <span className="stash-dot" style={{ background: cat === c ? "#fff" : catColor(c) }} />{c}
                  </button>
                ))}
              </div>
              <div className="stash-tagrow">
                <span className="stash-taglabel">Popular tags</span>
                {popularTags.map((t) => (
                  <button key={t} className="stash-qtag" data-active={activeTag === t} onClick={() => setActiveTag(activeTag === t ? null : t)}>#{t}</button>
                ))}
              </div>
            </div>

            <div className="stash-meta">
              <span className="stash-count">Showing <b>{filtered.length}</b> of {posts.length}
                {cat !== "All" && <> in <b>{cat}</b></>}{activeTag && <> tagged <b>#{activeTag}</b></>}</span>
              <div className="stash-sort" role="group" aria-label="Sort order">
                <button className="stash-sortbtn" data-active={sort === "newest"} onClick={() => setSort("newest")}>Newest</button>
                <button className="stash-sortbtn" data-active={sort === "oldest"} onClick={() => setSort("oldest")}>Oldest</button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="stash-empty">
                <h3>Nothing here yet</h3>
                <p>{posts.length === 0 ? "Add your first post, or run the bulk import to load your library." : "No saved posts match that. Try a different word or loosen the filters."}</p>
                {posts.length > 0 && <button className="stash-clear" onClick={clearAll}>Clear filters</button>}
              </div>
            ) : (
              <div className="stash-grid">
                {filtered.map((p) => (
                  <PostCard key={p.id} post={p} onSave={savePost} onRetag={retagPost} onAskDelete={setConfirmDel} onTag={setActiveTag} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {adding && <AddModal onClose={() => setAdding(false)} onAdd={addPost} />}
      {confirmDel && <DeleteModal post={confirmDel} onClose={() => setConfirmDel(null)} onConfirm={requestDelete} />}
      {toast && (
        <div className="stash-toast" role="status">
          <span>Deleted{toast.owner_username ? " @" + toast.owner_username : ""}.</span>
          <button onClick={undoDelete}>Undo</button>
        </div>
      )}
    </div>
  );
}

function PostCard({ post, onSave, onRetag, onAskDelete, onTag }) {
  const [editing, setEditing] = useState(false);
  const [summary, setSummary] = useState(post.summary || "");
  const [tags, setTags] = useState(post.tags || []);
  const [newTag, setNewTag] = useState("");
  const [busy, setBusy] = useState("");
  const color = catColor(post.category);

  const open = () => { setSummary(post.summary || ""); setTags(post.tags || []); setEditing(true); };
  const addTag = () => { const t = newTag.trim().toLowerCase().replace(/^#/, ""); if (t && !tags.includes(t)) setTags([...tags, t]); setNewTag(""); };
  const removeTag = (t) => setTags(tags.filter((x) => x !== t));

  async function doSave() {
    setBusy("save");
    const ok = await onSave({ id: post.id, summary: summary.trim(), tags });
    setBusy(""); if (ok) setEditing(false);
  }
  async function doRetag() {
    setBusy("retag");
    const row = await onRetag({ id: post.id, text: summary.trim() || post.caption || "" });
    setBusy("");
    if (row) { setSummary(row.summary || ""); setTags(row.tags || []); }
  }

  return (
    <article className="stash-card" data-editing={editing}>
      <div className="stash-spine" style={{ background: color }} />
      <div className="stash-body">
        <div className="stash-cardtop">
          <span className="stash-owner">@{post.owner_username || "unknown"}</span>
          {post.content_type && <span className="stash-type" style={{ background: color + "22", color }}>{post.content_type}</span>}
        </div>

        {!editing ? (
          <>
            {post.summary && <p className="stash-summary">{post.summary}</p>}
            {post.caption && <p className="stash-caption">{post.caption}</p>}
            <div className="stash-chips">
              {(post.tags || []).slice(0, 5).map((t) => (<button className="stash-chip" key={t} onClick={() => onTag(t)}>#{t}</button>))}
            </div>
            <div className="stash-cardfoot">
              <span className="stash-date">Saved {fmtDate(post.saved_date)}{post.edited && <span className="stash-edited"> · edited</span>}</span>
              <div className="stash-footright">
                <button className="stash-editbtn" onClick={open}>✎ Edit</button>
                <button className="stash-delbtn" onClick={() => onAskDelete(post)}>Delete</button>
                {post.url && <a className="stash-link" href={post.url} target="_blank" rel="noreferrer">View ↗</a>}
              </div>
            </div>
          </>
        ) : (
          <div className="stash-editbox">
            <div>
              <label className="stash-flabel">Summary (what this post is about)</label>
              <textarea className="stash-etext" value={summary} autoFocus onChange={(e) => setSummary(e.target.value)}
                placeholder="e.g. Bargatze bit about forgetting why he walked into a room" />
            </div>
            <div>
              <label className="stash-flabel">Tags</label>
              <div className="stash-etags">
                {tags.map((t) => (<span className="stash-etag" key={t}>#{t}<button onClick={() => removeTag(t)} aria-label={"Remove " + t}>×</button></span>))}
                <input className="stash-addtag" value={newTag} placeholder="add tag…" onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }} />
              </div>
            </div>
            <div className="stash-orig">
              <label className="stash-flabel" style={{ marginBottom: 0 }}>Original caption (kept for reference)</label>
              <p className="stash-origtext">{post.caption ? post.caption : "(no caption in the original post)"}</p>
            </div>
            <div className="stash-editrow">
              <button className="stash-retag" onClick={doRetag} disabled={!!busy}>{busy === "retag" ? "Tagging…" : "↻ Re-tag with AI"}</button>
              <span className="stash-spacer" />
              <button className="stash-cancel2" onClick={() => setEditing(false)} disabled={!!busy}>Cancel</button>
              <button className="stash-save2" onClick={doSave} disabled={!!busy}>{busy === "save" ? "Saving…" : "Save"}</button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function fmtDate(d) {
  if (!d) return "";
  const x = new Date(d + "T00:00:00");
  return x.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function DeleteModal({ post, onClose, onConfirm }) {
  return (
    <div className="stash-overlay" onClick={onClose}>
      <div className="stash-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <h2>Delete this post?</h2>
        <p className="sub">It's removed from Instagrouper only — your Instagram bookmark stays exactly where it is. You'll have a few seconds to undo.</p>
        <div className="stash-modalrow">
          <button className="stash-cancel" onClick={onClose}>Cancel</button>
          <button className="stash-del-confirm" onClick={() => { onConfirm(post); onClose(); }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function AddModal({ onClose, onAdd }) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const valid = /instagram\.com\/(p|reel|tv)\//.test(url);

  async function submit() {
    if (!valid || busy) return;
    setBusy(true); setErr("");
    const r = await onAdd({ url, caption: caption.trim() });
    setBusy(false);
    if (r && r.ok) onClose(); else setErr((r && r.error) || "Something went wrong.");
  }

  return (
    <div className="stash-overlay" onClick={onClose}>
      <div className="stash-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add a post</h2>
        <p className="sub">Paste an Instagram link and Stash will tag it for you.</p>
        <label className="stash-label" htmlFor="u">Instagram URL</label>
        <input id="u" className="stash-input" placeholder="https://www.instagram.com/reel/…" value={url} onChange={(e) => setUrl(e.target.value)} autoFocus />
        <label className="stash-label" htmlFor="c">Caption or note <span style={{ fontWeight: 400, color: "#9AA0A6" }}>(optional, improves tagging)</span></label>
        <textarea id="c" className="stash-textarea" placeholder="Paste the caption — or describe the bit yourself — so it tags accurately…" value={caption} onChange={(e) => setCaption(e.target.value)} />
        {err && <p className="stash-err" style={{ marginTop: 14 }}>{err}</p>}
        <div className="stash-modalrow">
          <button className="stash-cancel" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="stash-save" onClick={submit} disabled={!valid || busy}>{busy ? "Tagging…" : "Add to stash"}</button>
        </div>
      </div>
    </div>
  );
}
