import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ─── Google Fonts + Global styles ────────────────────────────────────────── */
const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    background: #05060f;
    color: #e2e4f0;
    font-family: 'DM Sans', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  ::selection { background: rgba(99,102,241,0.35); color: #fff; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: #05060f; }
  ::-webkit-scrollbar-thumb { background: #1e2040; border-radius: 3px; }

  @keyframes fadeUp   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes gradShift{ 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes marquee  { from{transform:translateX(0)} to{transform:translateX(-50%)} }

  .anim-fadeup { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) both; }
  .anim-fadein { animation: fadeIn 0.6s ease both; }
  .anim-float  { animation: float 5s ease-in-out infinite; }

  .nav-link {
    position:relative; color:#94a0c4; text-decoration:none;
    font-size:14px; font-weight:500; transition:color 0.2s; cursor:pointer;
  }
  .nav-link::after {
    content:''; position:absolute; bottom:-2px; left:0;
    width:0; height:1px; background:#6366f1;
    transition:width 0.25s cubic-bezier(.22,1,.36,1);
  }
  .nav-link:hover { color:#e2e4f0; }
  .nav-link:hover::after { width:100%; }

  .feat-card {
    transition: transform 0.3s cubic-bezier(.22,1,.36,1),
                border-color 0.25s, box-shadow 0.3s;
  }
  .feat-card:hover {
    transform:translateY(-4px);
    border-color:rgba(99,102,241,0.45)!important;
    box-shadow:0 20px 60px rgba(99,102,241,0.1)!important;
  }

  .btn-primary {
    display:inline-flex; align-items:center; gap:8px;
    padding:13px 28px; background:#6366f1; color:#fff;
    font-weight:600; font-size:15px; border:none; border-radius:10px;
    cursor:pointer; font-family:'DM Sans',sans-serif;
    box-shadow:0 0 0 0 rgba(99,102,241,0.5);
    transition:background 0.2s,transform 0.15s,box-shadow 0.2s;
  }
  .btn-primary:hover { background:#4f46e5; transform:translateY(-1px); box-shadow:0 8px 32px rgba(99,102,241,0.4); }

  .btn-ghost {
    display:inline-flex; align-items:center; gap:8px;
    padding:13px 28px; background:transparent; color:#94a0c4;
    font-weight:500; font-size:15px; border:1px solid #1e2240; border-radius:10px;
    cursor:pointer; font-family:'DM Sans',sans-serif;
    transition:border-color 0.2s,color 0.2s,transform 0.15s;
  }
  .btn-ghost:hover { border-color:#6366f1; color:#e2e4f0; transform:translateY(-1px); }

  .step-card { transition:transform 0.3s cubic-bezier(.22,1,.36,1); }
  .step-card:hover { transform:translateY(-3px); }

  .footer-link { color:#525878; font-size:13px; text-decoration:none; transition:color 0.2s; cursor:pointer; display:block; }
  .footer-link:hover { color:#94a0c4; }
`;

/* ─── Fake syntax-highlighted code ─────────────────────────────────────────── */
const CODE = [
  [[["#c792ea","import "],["#e2e4f0","{ useState } "],["#c792ea","from "],["#c3e88d","'react'"]]],
  [[]],
  [[["#82aaff","function "],["#ffcb6b","Counter"],["#e2e4f0","() {"]]],
  [[["#c792ea","  const "],["#e2e4f0","[count, setCount]"],["#89ddff"," = "],["#82aaff","useState"],["#e2e4f0","("],["#f78c6c","0"],["#e2e4f0",");"]]],
  [[]],
  [[["#c792ea","  return "],["#e2e4f0","("]]],
  [[["#e2e4f0","    <div "],["#82aaff","className"],["#89ddff","="],["#c3e88d",'"app"'],["#e2e4f0",">"]]],
  [[["#e2e4f0","      <h1>⚡ GemChat</h1>"]]],
  [[["#e2e4f0","      <button "],["#82aaff","onClick"],["#89ddff","={"],["#e2e4f0","()"],["#c792ea"," => "],["#ffcb6b","setCount"],["#e2e4f0","(c"],["#89ddff"," + "],["#f78c6c","1"],["#e2e4f0",")}>"]]], 
  [[["#e2e4f0","        Count: "],["#82aaff","{count}"]]],
  [[["#e2e4f0","      </button>"]]],
  [[["#e2e4f0","    </div>"]]],
  [[["#e2e4f0","  );"]]],
  [[["#e2e4f0","}"]]]
];

const CodePreview = () => (
  <div className="anim-float" style={{width:"100%",maxWidth:500,borderRadius:14,background:"#0c0e1a",border:"1px solid #1e2240",boxShadow:"0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.08)",overflow:"hidden",fontFamily:"'JetBrains Mono',monospace"}}>
    {/* Chrome */}
    <div style={{display:"flex",alignItems:"center",gap:6,padding:"12px 16px",borderBottom:"1px solid #1a1c2e",background:"#090b16"}}>
      <div style={{width:10,height:10,borderRadius:"50%",background:"#ff5f56"}}/>
      <div style={{width:10,height:10,borderRadius:"50%",background:"#ffbd2e"}}/>
      <div style={{width:10,height:10,borderRadius:"50%",background:"#27c93f"}}/>
      <span style={{marginLeft:10,fontSize:11,color:"#3a3f5c",letterSpacing:"0.06em"}}>Counter.jsx</span>
      <div style={{flex:1}}/>
      <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(39,201,63,0.1)",border:"1px solid rgba(39,201,63,0.25)",borderRadius:20,padding:"2px 8px"}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:"#27c93f",animation:"blink 1.4s step-end infinite"}}/>
        <span style={{fontSize:10,color:"#27c93f",fontWeight:600}}>LIVE</span>
      </div>
    </div>
    {/* Code */}
    <div style={{padding:"14px 0",fontSize:12,lineHeight:1.7}}>
      {CODE.map((line,i)=>(
        <div key={i} style={{display:"flex",paddingRight:20}}>
          <span style={{width:38,textAlign:"right",paddingRight:14,color:"#1e2240",userSelect:"none",flexShrink:0}}>{i+1}</span>
          <span>{line[0].length===0?"\u00A0":line[0].map(([c,t],j)=><span key={j} style={{color:c}}>{t}</span>)}</span>
        </div>
      ))}
    </div>
    {/* Status bar */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 16px",background:"#6366f1",fontSize:10,color:"rgba(255,255,255,0.8)"}}>
      <span>⑂ main</span>
      <span style={{display:"flex",gap:16}}><span>JSX</span><span>Ln 9</span><span>UTF-8</span></span>
    </div>
  </div>
);

/* ─── Data ──────────────────────────────────────────────────────────────────── */
const MARQUEE_ITEMS = ["Monaco Editor","WebContainer API","Socket.IO","Gemini 2.5 Flash","React 19","Vite 7","MongoDB Atlas","JWT Auth","Redis","Real-time HMR"];

const FEATURES = [
  { tag:"Live Preview", title:"React in your browser, instantly", desc:"One click creates a full React + Vite dev server inside WebContainer. Edit any file and the preview hot-reloads in under 100 ms — no page refresh, no re-click.", wide:true,
    icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  { tag:"Collaboration", title:"Live cursors & instant sync", desc:"Every keystroke syncs across all collaborators in real time via WebSockets. Shared cursors, file tree, and built-in chat.", wide:false,
    icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="19" cy="7" r="3"/><path d="M23 21v-1a3 3 0 0 0-3-3h-1"/></svg> },
  { tag:"Gemini AI", title:"@ai generates your code", desc:"Ask the AI to build components, debug errors, refactor functions, or explain any line of code — right inside the project chat.", wide:false,
    icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
  { tag:"Persistence", title:"Files saved automatically, always", desc:"Every file you create or edit is persisted to MongoDB Atlas in real time. Refresh the page — your entire project is exactly where you left it.", wide:true,
    icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg> },
];

const STEPS = [
  {n:"01",title:"Create a workspace",desc:"Sign up free and create a new project. Share the invite code with any teammate — they join instantly."},
  {n:"02",title:"Write code together",desc:"Open the Monaco editor, create files, and code. All changes sync live across every connected collaborator."},
  {n:"03",title:"Preview & ship",desc:"Hit Run for an instant live preview. Export your code or deploy to Vercel or Netlify in one command."},
];

/* ═══════════════════════════════════════════════════════════════════════════════
   Component
═══════════════════════════════════════════════════════════════════════════════ */
export default function Landing() {
  const nav = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <style>{FONTS}</style>
      <div style={{ minHeight:"100vh", background:"#05060f" }}>

        {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
        <nav style={{
          position:"fixed",top:0,left:0,right:0,zIndex:100,
          display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"0 clamp(20px,4vw,56px)", height:64,
          background: scrolled ? "rgba(5,6,15,0.9)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(20,22,48,0.8)" : "1px solid transparent",
          transition:"all 0.35s cubic-bezier(.22,1,.36,1)",
        }}>
          <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>window.scrollTo(0,0)}>
            <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,boxShadow:"0 0 20px rgba(99,102,241,0.4)"}}>💎</div>
            <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:17,color:"#e2e4f0",letterSpacing:"-0.02em"}}>GemChat</span>
          </div>

          <div style={{display:"flex",gap:34,alignItems:"center"}}>
            {["Features","How it works","Pricing"].map(l=><span key={l} className="nav-link">{l}</span>)}
          </div>

          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <button className="btn-ghost" style={{padding:"8px 18px",fontSize:13}} onClick={()=>nav("/login")}>Sign in</button>
            <button className="btn-primary" style={{padding:"8px 18px",fontSize:13}} onClick={()=>nav("/register")}>Start free</button>
          </div>
        </nav>

        {/* ── HERO ───────────────────────────────────────────────────────────── */}
        <section style={{position:"relative",minHeight:"100vh",display:"flex",alignItems:"center",padding:"120px clamp(20px,4vw,56px) 80px",overflow:"hidden"}}>
          {/* BG layers */}
          <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
            <div style={{position:"absolute",width:700,height:700,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)",top:"5%",left:"-12%"}}/>
            <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(139,92,246,0.07) 0%,transparent 70%)",top:"15%",right:"-5%"}}/>
            <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(20,22,48,0.14) 1px,transparent 1px),linear-gradient(90deg,rgba(20,22,48,0.14) 1px,transparent 1px)",backgroundSize:"60px 60px"}}/>
            <div style={{position:"absolute",bottom:0,left:0,right:0,height:220,background:"linear-gradient(to bottom,transparent,#05060f)"}}/>
          </div>

          <div style={{maxWidth:1200,margin:"0 auto",width:"100%",display:"flex",alignItems:"center",gap:"clamp(40px,6vw,100px)",position:"relative",flexWrap:"wrap"}}>
            {/* Copy */}
            <div style={{flex:"0 0 min(480px,100%)",minWidth:280}}>
              <div className="anim-fadeup" style={{animationDelay:"0ms",display:"inline-flex",alignItems:"center",gap:8,background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.22)",borderRadius:100,padding:"5px 14px",marginBottom:26}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:"#6366f1",boxShadow:"0 0 8px #6366f1"}}/>
                <span style={{fontSize:11,fontWeight:700,color:"#818cf8",letterSpacing:"0.07em",textTransform:"uppercase"}}>Now with Gemini 2.5 Flash</span>
              </div>

              <h1 className="anim-fadeup" style={{animationDelay:"80ms",fontFamily:"'Syne',sans-serif",fontSize:"clamp(36px,4.5vw,58px)",fontWeight:800,lineHeight:1.1,letterSpacing:"-0.04em",color:"#e8eaf4",marginBottom:22}}>
                Code together,
                <br/>
                <span style={{background:"linear-gradient(90deg,#818cf8 0%,#c084fc 50%,#818cf8 100%)",backgroundSize:"200% 100%",animation:"gradShift 4s ease infinite",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                  ship faster.
                </span>
              </h1>

              <p className="anim-fadeup" style={{animationDelay:"160ms",fontSize:17,color:"#6670a0",lineHeight:1.78,marginBottom:36,maxWidth:420}}>
                An AI-powered collaborative coding IDE. Real-time editing, live React preview, and Gemini AI — all running in your browser.
              </p>

              <div className="anim-fadeup" style={{animationDelay:"240ms",display:"flex",gap:12,flexWrap:"wrap"}}>
                <button className="btn-primary" onClick={()=>nav("/register")}>
                  Start building free
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
                <button className="btn-ghost" onClick={()=>nav("/login")}>Sign in</button>
              </div>

              {/* Social proof */}
              <div className="anim-fadeup" style={{animationDelay:"320ms",display:"flex",alignItems:"center",gap:14,marginTop:34}}>
                <div style={{display:"flex"}}>
                  {["#6366f1","#8b5cf6","#06b6d4","#10b981","#f59e0b"].map((c,i)=>(
                    <div key={i} style={{width:28,height:28,borderRadius:"50%",background:c,border:"2px solid #05060f",marginLeft:i?-8:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff"}}>
                      {["A","J","S","M","R"][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{display:"flex",gap:2,marginBottom:2}}>{[1,2,3,4,5].map(s=><span key={s} style={{color:"#f59e0b",fontSize:12}}>★</span>)}</div>
                  <span style={{fontSize:12,color:"#3a3f5c"}}>Loved by 1,000+ developers</span>
                </div>
              </div>
            </div>

            {/* Code preview */}
            <div className="anim-fadein" style={{animationDelay:"180ms",flex:1,display:"flex",justifyContent:"center",minWidth:280}}>
              <CodePreview/>
            </div>
          </div>
        </section>

        {/* ── MARQUEE ─────────────────────────────────────────────────────────── */}
        <div style={{borderTop:"1px solid #0a0b18",borderBottom:"1px solid #0a0b18",background:"#06070f",overflow:"hidden",padding:"16px 0"}}>
          <div style={{display:"flex",animation:"marquee 30s linear infinite",width:"max-content"}}>
            {[...MARQUEE_ITEMS,...MARQUEE_ITEMS].map((item,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:16,padding:"0 28px",whiteSpace:"nowrap"}}>
                <div style={{width:4,height:4,borderRadius:"50%",background:"#6366f1"}}/>
                <span style={{fontSize:13,color:"#2a2f48",fontWeight:500,letterSpacing:"0.04em"}}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── STATS ───────────────────────────────────────────────────────────── */}
        <section style={{padding:"80px clamp(20px,4vw,56px)"}}>
          <div style={{maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,background:"#0a0b18",borderRadius:16,overflow:"hidden",border:"1px solid #0a0b18"}}>
            {[["< 100ms","Hot reload latency"],["∞","Files per project"],["20+","Languages supported"],["Free","No credit card"]].map(([stat,label])=>(
              <div key={label} style={{background:"#06070f",padding:"36px 28px",textAlign:"center"}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:34,fontWeight:800,color:"#e2e4f0",letterSpacing:"-0.03em",marginBottom:6}}>{stat}</div>
                <div style={{fontSize:13,color:"#525878"}}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES BENTO ──────────────────────────────────────────────────── */}
        <section style={{padding:"0 clamp(20px,4vw,56px) 100px"}}>
          <div style={{maxWidth:1200,margin:"0 auto"}}>
            <div style={{textAlign:"center",marginBottom:52}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(99,102,241,0.07)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:100,padding:"5px 14px",marginBottom:18}}>
                <span style={{fontSize:11,fontWeight:700,color:"#6366f1",letterSpacing:"0.08em",textTransform:"uppercase"}}>Features</span>
              </div>
              <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(26px,3.5vw,44px)",fontWeight:800,color:"#e2e4f0",letterSpacing:"-0.03em",lineHeight:1.15,marginBottom:14}}>
                Everything you need to build, <br/>together.
              </h2>
              <p style={{fontSize:16,color:"#525878",maxWidth:460,margin:"0 auto",lineHeight:1.72}}>
                A complete collaborative IDE running entirely in your browser, powered by WebContainer API.
              </p>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
              {FEATURES.map((f,i)=>(
                <div key={i} className="feat-card" style={{gridColumn:f.wide?"span 2":"span 1",background:"#06070f",border:"1px solid #0e1020",borderRadius:16,padding:"30px 28px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,0.05) 0%,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:42,height:42,borderRadius:10,background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.14)",marginBottom:18}}>{f.icon}</div>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6366f1",marginBottom:10}}>{f.tag}</div>
                  <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700,color:"#e2e4f0",marginBottom:10,letterSpacing:"-0.02em"}}>{f.title}</h3>
                  <p style={{fontSize:14,color:"#525878",lineHeight:1.75,maxWidth:380}}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
        <section style={{padding:"0 clamp(20px,4vw,56px) 100px"}}>
          <div style={{maxWidth:1200,margin:"0 auto"}}>
            <div style={{textAlign:"center",marginBottom:52}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(99,102,241,0.07)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:100,padding:"5px 14px",marginBottom:18}}>
                <span style={{fontSize:11,fontWeight:700,color:"#6366f1",letterSpacing:"0.08em",textTransform:"uppercase"}}>How it works</span>
              </div>
              <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(26px,3.5vw,44px)",fontWeight:800,color:"#e2e4f0",letterSpacing:"-0.03em"}}>
                From zero to live in three steps.
              </h2>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
              {STEPS.map((s,i)=>(
                <div key={i} className="step-card" style={{background:"#06070f",border:"1px solid #0e1020",borderRadius:16,padding:"36px 28px"}}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:52,fontWeight:800,color:"#0e1020",marginBottom:18,letterSpacing:"-0.05em",userSelect:"none"}}>{s.n}</div>
                  <div style={{width:32,height:2,background:"#6366f1",borderRadius:2,marginBottom:18}}/>
                  <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:700,color:"#e2e4f0",marginBottom:10,letterSpacing:"-0.02em"}}>{s.title}</h3>
                  <p style={{fontSize:14,color:"#525878",lineHeight:1.75}}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIAL ─────────────────────────────────────────────────────── */}
        <section style={{padding:"0 clamp(20px,4vw,56px) 100px"}}>
          <div style={{maxWidth:1200,margin:"0 auto"}}>
            <div style={{background:"#06070f",border:"1px solid #0e1020",borderRadius:20,padding:"clamp(30px,5vw,56px)",display:"flex",alignItems:"center",gap:"clamp(30px,5vw,60px)",flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:260}}>
                <div style={{fontSize:44,color:"#6366f1",lineHeight:1,marginBottom:14,fontFamily:"Georgia,serif"}}>"</div>
                <blockquote style={{fontSize:18,color:"#94a0c4",lineHeight:1.78,fontStyle:"italic",marginBottom:22}}>
                  GemChat replaced three separate tools for us. The live preview and AI code generation save our team hours every sprint.
                </blockquote>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:"#fff"}}>A</div>
                  <div>
                    <div style={{fontSize:14,fontWeight:600,color:"#e2e4f0"}}>Aryan Singh</div>
                    <div style={{fontSize:12,color:"#525878"}}>Lead Developer, TechCo</div>
                  </div>
                </div>
              </div>
              <div style={{width:1,height:110,background:"#0e1020",flexShrink:0}}/>
              <div style={{display:"flex",flexDirection:"column",gap:26,flexShrink:0}}>
                {[["3×","Faster code reviews"],["80%","Less context switching"],["Free","For individuals, forever"]].map(([n,l])=>(
                  <div key={l}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:"#6366f1",letterSpacing:"-0.03em"}}>{n}</div>
                    <div style={{fontSize:13,color:"#525878"}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────────────── */}
        <section style={{padding:"0 clamp(20px,4vw,56px) 120px"}}>
          <div style={{maxWidth:1200,margin:"0 auto"}}>
            <div style={{position:"relative",overflow:"hidden",borderRadius:24,background:"linear-gradient(135deg,#0c0e28 0%,#080a1a 100%)",border:"1px solid rgba(99,102,241,0.18)",padding:"clamp(48px,8vw,88px) clamp(24px,6vw,64px)",textAlign:"center"}}>
              <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,0.13) 0%,transparent 70%)",top:"-180px",left:"50%",transform:"translateX(-50%)",pointerEvents:"none"}}/>
              <div style={{position:"relative"}}>
                <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(28px,4vw,52px)",fontWeight:800,color:"#e2e4f0",letterSpacing:"-0.04em",marginBottom:16,lineHeight:1.1}}>
                  Start building with your team<br/>today — it's free.
                </h2>
                <p style={{fontSize:16,color:"#525878",marginBottom:38,maxWidth:420,margin:"0 auto 38px",lineHeight:1.72}}>
                  No credit card. No install. Open your browser and start coding in seconds.
                </p>
                <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                  <button className="btn-primary" style={{padding:"14px 34px",fontSize:15}} onClick={()=>nav("/register")}>
                    Create free account
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                  <button className="btn-ghost" style={{padding:"14px 34px",fontSize:15}} onClick={()=>nav("/login")}>
                    Sign in to existing account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
        <footer style={{borderTop:"1px solid #0a0b18",padding:"48px clamp(20px,4vw,56px)",background:"#05060f"}}>
          <div style={{maxWidth:1200,margin:"0 auto"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:40,flexWrap:"wrap",marginBottom:48}}>
              <div style={{maxWidth:230}}>
                <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:14}}>
                  <div style={{width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>💎</div>
                  <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,color:"#e2e4f0"}}>GemChat</span>
                </div>
                <p style={{fontSize:13,color:"#525878",lineHeight:1.72}}>AI-powered collaborative coding platform for modern development teams.</p>
              </div>
              {[
                {title:"Product", links:["Features","How it works","Pricing","Changelog"]},
                {title:"Company", links:["About","Blog","Careers","Contact"]},
                {title:"Legal",   links:["Privacy","Terms","Security","Cookies"]},
              ].map(col=>(
                <div key={col.title}>
                  <div style={{fontSize:11,fontWeight:700,color:"#e2e4f0",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:16}}>{col.title}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {col.links.map(l=><span key={l} className="footer-link">{l}</span>)}
                  </div>
                </div>
              ))}
            </div>
            <div style={{borderTop:"1px solid #0a0b18",paddingTop:26,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:14}}>
              <span style={{fontSize:12,color:"#1e2240"}}>© {new Date().getFullYear()} GemChat. Built with React, MongoDB, Socket.IO & Gemini AI.</span>
              <div style={{display:"flex",gap:20}}>
                {["Twitter","GitHub","Discord"].map(s=><span key={s} className="footer-link">{s}</span>)}
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}