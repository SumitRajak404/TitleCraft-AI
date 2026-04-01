import { useState, useRef } from "react";

const API_URL = "https://api.anthropic.com/v1/messages";

async function callClaude(prompt) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();
  const text = data.content?.map((c) => c.text || "").join("") || "";
  return text.replace(/```json|```/g, "").trim();
}

const TONES = ["🔥 Viral", "💡 Educational", "😱 Shocking", "😂 Funny", "💰 Money-focused", "⚡ Urgent", "🎯 Beginner-friendly"];
const EMOJIS = ["💰", "🚀", "🎮", "🧠", "⚡", "🔥", "🌍"];
const NICHES = ["", "Tech & AI", "Finance & Money", "Fitness & Health", "Gaming", "Travel & Lifestyle", "Education", "Entertainment", "Food & Cooking", "Business & Marketing", "Personal Development"];
const STYLES = ["", "How-To Guide", "Listicle (Top 10...)", "Curiosity / Mystery", "Emotional Story", "Controversial", "Tutorial", "Review / Comparison"];
const THUMB_STYLES = ["Bold & Simple", "Question-based", "Number-led", "Before/After", "Shocking Reveal"];

function Badge({ label, type }) {
  const colors = {
    SEO: { bg: "rgba(255,209,102,0.13)", color: "#FFD166" },
    Viral: { bg: "rgba(192,132,252,0.13)", color: "#c084fc" },
    CTR: { bg: "rgba(6,214,160,0.13)", color: "#06D6A0" },
    Hook: { bg: "rgba(255,61,61,0.13)", color: "#ff7070" },
    High: { bg: "rgba(255,61,61,0.13)", color: "#ff7070" },
    Medium: { bg: "rgba(255,209,102,0.13)", color: "#FFD166" },
    default: { bg: "rgba(255,255,255,0.06)", color: "#888" },
  };
  const c = colors[type] || colors.default;
  return (
    <span style={{ background: c.bg, color: c.color, fontSize: "0.7rem", padding: "2px 8px", borderRadius: 5, fontWeight: 500, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function ResultCard({ item, index, onClick, showThumb }) {
  const [copied, setCopied] = useState(false);
  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.title);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div onClick={() => onClick(item.title)} style={{ background: "#1C1C1C", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1rem 1.1rem", marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", transition: "border-color 0.2s", animation: `slideIn 0.3s ease ${index * 0.07}s both` }}>
      <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: "0.72rem", color: "#555", minWidth: 20, paddingTop: 2 }}>{String(index + 1).padStart(2, "0")}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.97rem", fontWeight: 500, lineHeight: 1.4, marginBottom: 6 }}>{item.title}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {item.badges.map((b, i) => <Badge key={i} label={b.label} type={b.type} />)}
          <Badge label={`${item.title.length} chars`} type="default" />
        </div>
      </div>
      <button onClick={copy} style={{ background: "none", border: "1px solid rgba(255,255,255,0.12)", color: copied ? "#06D6A0" : "#777", padding: "5px 10px", borderRadius: 7, fontSize: "0.78rem", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
        {copied ? "✓ Copied" : "Copy"}
      </button>
    </div>
  );
}

function ThumbnailPreview({ text, emoji }) {
  const words = text.split(" ");
  const highlight = words.slice(0, Math.ceil(words.length / 2)).join(" ");
  const rest = words.slice(Math.ceil(words.length / 2)).join(" ");
  return (
    <div style={{ background: "#000", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", marginTop: 16, aspectRatio: "16/9", position: "relative", display: "flex", alignItems: "flex-end" }}>
      {/* BG */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "5rem", opacity: 0.35 }}>{emoji}</div>
      {/* GRADIENT */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "75%", background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 100%)" }} />
      {/* TEXT */}
      <div style={{ position: "relative", zIndex: 2, padding: "1rem 1.3rem", fontFamily: "'Clash Display', sans-serif", fontSize: "clamp(1rem, 3vw, 1.6rem)", fontWeight: 700, lineHeight: 1.15, textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}>
        <span style={{ color: "#FF3D3D" }}>{highlight}</span>
        {rest && <span style={{ color: "#fff" }}> {rest}</span>}
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("title");
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("");
  const [style, setStyle] = useState("");
  const [tones, setTones] = useState([]);
  const [thumbTopic, setThumbTopic] = useState("");
  const [thumbStyle, setThumbStyle] = useState("Bold & Simple");
  const [thumbWords, setThumbWords] = useState("5");
  const [thumbEmoji, setThumbEmoji] = useState("💰");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const resultsRef = useRef();

  const toggleTone = (t) => setTones((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const handleResultClick = (title) => {
    navigator.clipboard.writeText(title);
    if (tab === "thumbnail") setPreviewText(title);
  };

  async function generateTitles() {
    if (!topic.trim()) { setError("Please enter your video topic!"); return; }
    setError(""); setLoading(true); setResults([]);
    const prompt = `You are an expert YouTube SEO strategist. Generate exactly 6 high-CTR YouTube video titles.

Topic: ${topic}
${niche ? `Niche: ${niche}` : ""}
${style ? `Style: ${style}` : ""}
${tones.length ? `Tones: ${tones.join(", ")}` : ""}

Rules:
- Each title: 45–70 characters
- Include the keyword naturally
- Mix: curiosity gap, numbers, how-to, emotional, controversial
- Each must be completely distinct

Respond ONLY with a JSON array, no other text:
[
  {"title": "...", "type": "SEO"},
  {"title": "...", "type": "Viral"},
  {"title": "...", "type": "CTR"},
  {"title": "...", "type": "Hook"},
  {"title": "...", "type": "SEO"},
  {"title": "...", "type": "Viral"}
]`;
    try {
      const raw = await callClaude(prompt);
      const parsed = JSON.parse(raw);
      setResults(parsed.map((r) => ({ title: r.title, badges: [{ label: r.type, type: r.type }] })));
      setShowPreview(false);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
    } catch (e) {
      setError("Generation failed. Please try again.");
    }
    setLoading(false);
  }

  async function generateThumbnailTitles() {
    if (!thumbTopic.trim()) { setError("Please enter your video topic!"); return; }
    setError(""); setLoading(true); setResults([]); setPreviewText("");
    const prompt = `You are a YouTube thumbnail design expert. Generate exactly 6 short punchy thumbnail text overlays.

Topic: ${thumbTopic}
Style: ${thumbStyle}
Max words: ${thumbWords}

Rules:
- MAXIMUM ${thumbWords} words each
- ALL CAPS or punchy mixed case
- Must be readable on a small thumbnail in 0.5 seconds
- Use power words, numbers, emotional triggers
- Every one must feel visually distinct

Respond ONLY with a JSON array, no other text:
[
  {"text": "STOP WASTING TIME", "impact": "High", "style": "Bold"},
  {"text": "THIS CHANGES EVERYTHING", "impact": "High", "style": "Shock"},
  {"text": "EARN $500/DAY", "impact": "High", "style": "Number"},
  {"text": "WHY YOU'RE BROKE", "impact": "High", "style": "Question"},
  {"text": "THE SECRET REVEALED", "impact": "Medium", "style": "Curiosity"},
  {"text": "BEFORE vs AFTER", "impact": "Medium", "style": "Compare"}
]`;
    try {
      const raw = await callClaude(prompt);
      const parsed = JSON.parse(raw);
      setResults(parsed.map((r) => ({ title: r.text, badges: [{ label: r.impact + " Impact", type: r.impact }, { label: r.style, type: "CTR" }] })));
      setShowPreview(true);
      if (parsed[0]) setPreviewText(parsed[0].text);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
    } catch (e) {
      setError("Generation failed. Please try again.");
    }
    setLoading(false);
  }

  const inputStyle = { width: "100%", background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "#F0F0F0", fontFamily: "DM Sans, sans-serif", fontSize: "0.97rem", padding: "11px 14px", outline: "none" };
  const selectStyle = { ...inputStyle, cursor: "pointer" };
  const labelStyle = { display: "block", fontSize: "0.78rem", color: "#777", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 };

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", color: "#F0F0F0", fontFamily: "DM Sans, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.5;transform:scale(0.8);} }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { background: #0A0A0A !important; }
        select option { background: #1C1C1C; }
        input:focus, select:focus, textarea:focus { border-color: #FF3D3D !important; box-shadow: 0 0 0 3px rgba(255,61,61,0.1) !important; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #111; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>

      {/* NAV */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 clamp(1rem,5vw,3rem)", height: 60, background: "rgba(10,10,10,0.9)", borderBottom: "1px solid rgba(255,255,255,0.07)", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)" }}>
        <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: "1.2rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 9, height: 9, background: "#FF3D3D", borderRadius: "50%", boxShadow: "0 0 8px #FF3D3D", animation: "pulse 2s ease infinite" }} />
          TitleCraft<span style={{ color: "#FF3D3D" }}>AI</span>
        </div>
        <span style={{ background: "#FF3D3D", color: "white", fontSize: "0.72rem", padding: "3px 11px", borderRadius: 100, fontWeight: 500 }}>Free</span>
      </nav>

      {/* HERO */}
      <div style={{ textAlign: "center", padding: "clamp(3rem,8vw,6rem) 1rem 2rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid rgba(255,61,61,0.3)", background: "rgba(255,61,61,0.07)", color: "#FF3D3D", fontSize: "0.75rem", fontWeight: 500, padding: "4px 13px", borderRadius: 100, marginBottom: "1.2rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          ✦ AI-Powered for YouTubers
        </div>
        <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: "clamp(2.2rem,6vw,4.5rem)", fontWeight: 700, lineHeight: 1.07, letterSpacing: "-0.02em", maxWidth: 750, margin: "0 auto 1rem" }}>
          Generate <span style={{ color: "#FF3D3D" }}>Viral Titles</span><br />That Actually Get Clicked
        </h1>
        <p style={{ color: "#777", fontSize: "1.05rem", maxWidth: 500, margin: "0 auto 2rem", fontWeight: 300 }}>
          AI-powered YouTube title &amp; thumbnail text generator. Craft SEO-optimized, high-CTR titles in seconds — free, forever.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "2.5rem", flexWrap: "wrap" }}>
          {[["10M+", "Titles Generated"], ["3.2×", "Avg CTR Boost"], ["100%", "Free Forever"]].map(([num, lbl]) => (
            <div key={lbl} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: "1.7rem", fontWeight: 600 }}>{num}</div>
              <div style={{ fontSize: "0.78rem", color: "#555" }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TOOL */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 clamp(1rem,4vw,2rem) 4rem" }}>
        {/* TABS */}
        <div style={{ display: "flex", background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px 14px 0 0", overflow: "hidden" }}>
          {[["title", "📝 YouTube Title"], ["thumbnail", "🖼️ Thumbnail Text"]].map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); setResults([]); setError(""); }} style={{ flex: 1, padding: "13px 16px", background: tab === id ? "#1C1C1C" : "none", border: "none", borderBottom: tab === id ? "2px solid #FF3D3D" : "2px solid transparent", color: tab === id ? "#F0F0F0" : "#777", fontFamily: "DM Sans, sans-serif", fontSize: "0.88rem", cursor: "pointer", fontWeight: tab === id ? 500 : 400, transition: "all 0.2s" }}>
              {label}
            </button>
          ))}
        </div>

        {/* CARD */}
        <div style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderTop: "none", borderRadius: "0 0 18px 18px", padding: "clamp(1.2rem,4vw,2.2rem)" }}>

          {tab === "title" ? (
            <div>
              <div style={{ marginBottom: "1.1rem" }}>
                <label style={labelStyle}>Video Topic *</label>
                <input style={inputStyle} type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. How to make money with AI in 2025" maxLength={200} />
                <div style={{ fontSize: "0.72rem", color: "#555", textAlign: "right", marginTop: 4 }}>{topic.length}/200</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.1rem" }}>
                <div>
                  <label style={labelStyle}>Niche</label>
                  <select style={selectStyle} value={niche} onChange={e => setNiche(e.target.value)}>
                    {NICHES.map(n => <option key={n} value={n}>{n || "Select niche"}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Title Style</label>
                  <select style={selectStyle} value={style} onChange={e => setStyle(e.target.value)}>
                    {STYLES.map(s => <option key={s} value={s}>{s || "Any style"}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: "1.3rem" }}>
                <label style={labelStyle}>Tone Tags</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {TONES.map(t => (
                    <span key={t} onClick={() => toggleTone(t)} style={{ background: tones.includes(t) ? "rgba(255,61,61,0.1)" : "#1C1C1C", border: `1px solid ${tones.includes(t) ? "#FF3D3D" : "rgba(255,255,255,0.1)"}`, color: tones.includes(t) ? "#FF3D3D" : "#777", fontSize: "0.78rem", padding: "4px 10px", borderRadius: 6, cursor: "pointer", userSelect: "none", transition: "all 0.15s" }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={generateTitles} disabled={loading} style={{ width: "100%", padding: 14, background: loading ? "#333" : "#FF3D3D", color: "white", border: "none", borderRadius: 12, fontFamily: "DM Sans, sans-serif", fontSize: "1rem", fontWeight: 500, cursor: loading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }}>
                {loading ? (<><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Generating...</>) : "⚡ Generate YouTube Titles"}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: "1.1rem" }}>
                <label style={labelStyle}>Video Topic *</label>
                <input style={inputStyle} type="text" value={thumbTopic} onChange={e => setThumbTopic(e.target.value)} placeholder="e.g. 10x your productivity with AI tools" maxLength={200} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.1rem" }}>
                <div>
                  <label style={labelStyle}>Thumbnail Style</label>
                  <select style={selectStyle} value={thumbStyle} onChange={e => setThumbStyle(e.target.value)}>
                    {THUMB_STYLES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Max Words</label>
                  <select style={selectStyle} value={thumbWords} onChange={e => setThumbWords(e.target.value)}>
                    <option value="3">1–3 words</option>
                    <option value="5">4–5 words</option>
                    <option value="7">6–7 words</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: "1.3rem" }}>
                <label style={labelStyle}>Background Theme</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {EMOJIS.map(e => (
                    <span key={e} onClick={() => setThumbEmoji(e)} style={{ background: thumbEmoji === e ? "rgba(255,61,61,0.1)" : "#1C1C1C", border: `1px solid ${thumbEmoji === e ? "#FF3D3D" : "rgba(255,255,255,0.1)"}`, color: thumbEmoji === e ? "#FF3D3D" : "#999", fontSize: "1rem", padding: "5px 12px", borderRadius: 6, cursor: "pointer", userSelect: "none", transition: "all 0.15s" }}>
                      {e}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={generateThumbnailTitles} disabled={loading} style={{ width: "100%", padding: 14, background: loading ? "#333" : "#FF3D3D", color: "white", border: "none", borderRadius: 12, fontFamily: "DM Sans, sans-serif", fontSize: "1rem", fontWeight: 500, cursor: loading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }}>
                {loading ? (<><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Generating...</>) : "🖼️ Generate Thumbnail Text"}
              </button>
            </div>
          )}

          {error && <div style={{ marginTop: 12, background: "rgba(255,61,61,0.1)", border: "1px solid rgba(255,61,61,0.3)", color: "#ff7070", padding: "10px 14px", borderRadius: 8, fontSize: "0.85rem" }}>{error}</div>}

          {/* RESULTS */}
          {results.length > 0 && (
            <div ref={resultsRef} style={{ marginTop: "1.8rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.9rem" }}>
                <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: "0.95rem", fontWeight: 600 }}>{tab === "title" ? "Generated Titles" : "Thumbnail Text Options"}</span>
                <span style={{ fontSize: "0.78rem", color: "#555" }}>{results.length} options — click any to copy</span>
              </div>
              {results.map((item, i) => (
                <ResultCard key={i} item={item} index={i} onClick={handleResultClick} showThumb={tab === "thumbnail"} />
              ))}
              {tab === "thumbnail" && previewText && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: "0.78rem", color: "#555", marginBottom: 6, textAlign: "center" }}>Live Thumbnail Preview</div>
                  <ThumbnailPreview text={previewText} emoji={thumbEmoji} />
                  <p style={{ textAlign: "center", fontSize: "0.72rem", color: "#444", marginTop: 8 }}>Click any result above to change the preview</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* HOW IT WORKS */}
        <div style={{ marginTop: "4rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: "clamp(1.6rem,3.5vw,2.4rem)", fontWeight: 700, marginBottom: "0.5rem" }}>How It Works</h2>
            <p style={{ color: "#666", fontSize: "0.9rem" }}>Three steps to titles that make viewers stop scrolling</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
            {[
              ["01", "✍️", "Describe Your Video", "Enter your topic, niche, and pick the vibe you're going for."],
              ["02", "⚡", "AI Generates Options", "Our AI creates 6 high-CTR title variations instantly."],
              ["03", "📋", "Copy & Publish", "Pick your favorite, copy it, paste into YouTube Studio."],
              ["04", "📈", "Watch CTR Grow", "SEO-optimized titles lead to more clicks and views."],
            ].map(([num, icon, title, desc]) => (
              <div key={num} style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderTop: "2px solid #FF3D3D", borderRadius: 14, padding: "1.3rem" }}>
                <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: "2rem", fontWeight: 700, color: "rgba(255,255,255,0.05)", lineHeight: 1, marginBottom: 8 }}>{num}</div>
                <div style={{ fontSize: "1.3rem", marginBottom: 8 }}>{icon}</div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: "0.82rem", color: "#666", lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: "4rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: "clamp(1.6rem,3.5vw,2.4rem)", fontWeight: 700, marginBottom: "0.5rem" }}>FAQ</h2>
            <p style={{ color: "#666", fontSize: "0.9rem" }}>Everything you need to know</p>
          </div>
          {[
            ["What is a YouTube title generator?", "An AI tool that creates optimized, high-CTR titles for your YouTube videos. It analyzes your topic and generates multiple options designed to rank in search and entice viewers to click."],
            ["What's the difference between a YouTube title and a thumbnail title?", "Your YouTube title is the full SEO title (60–70 chars) that appears in search results. Your thumbnail title is the short 3–7 word text overlaid on your thumbnail image — designed for visual impact at a glance."],
            ["Is TitleCraft AI free?", "Yes — completely free. Generate as many titles as you need with no sign-up required."],
            ["How do I write a good YouTube title for SEO?", "Include your main keyword near the beginning, keep it 50–70 characters, create curiosity or promise clear value. TitleCraft AI handles all of this automatically."],
          ].map(([q, a]) => <FaqItem key={q} q={q} a={a} />)}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "2rem clamp(1rem,5vw,3rem)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <p style={{ fontSize: "0.8rem", color: "#444" }}>© 2025 TitleCraft AI — Free YouTube Title Generator</p>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          {["Privacy", "Terms", "Contact"].map(l => <a key={l} href="#" style={{ fontSize: "0.8rem", color: "#444", textDecoration: "none" }}>{l}</a>)}
        </div>
      </div>
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "0.9rem 1.1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", fontWeight: 500, fontSize: "0.93rem", userSelect: "none" }}>
        {q}
        <span style={{ fontSize: "1rem", color: "#555", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.25s", flexShrink: 0 }}>▾</span>
      </div>
      {open && <div style={{ padding: "0 1.1rem 0.9rem", fontSize: "0.88rem", color: "#777", lineHeight: 1.7 }}>{a}</div>}
    </div>
  );
}
