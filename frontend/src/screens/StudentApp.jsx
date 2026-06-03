// ============================================================================
//  TAS-HEEL REVISION — Madrasah Revision App (student experience)
//  Syllabus: Tas-heel Series (Jamiatul Ulama Taalimi Board, South Africa)
//  Data source: PostgreSQL via the Express API. Nothing is hardcoded here —
//    • Syllabus (grades -> subjects -> lessons -> questions) is loaded at boot
//      from GET /api/syllabus/tree/:gradeId  (see applySyllabus()).
//    • Student progress is loaded/saved via /api/progress/me (no localStorage).
//    • Finished quizzes are logged via /api/progress for analytics.
//  NOTE: Islamic content is managed/reviewed by admins in the Content manager.
// ============================================================================
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Home, BookOpen, Layers, Calendar, User, ChevronRight, ChevronLeft, Check, X,
  Flame, Lock, RotateCcw, Sparkles, GraduationCap, ArrowRight, Trophy, Target,
  Clock, Brain, ListChecks, CheckCircle2, XCircle, BarChart3, BookMarked, LogOut,
} from "lucide-react";
import { logout, getSyllabusTree, getProgress, saveProgress, logQuizSession, logFlashcardReviews, logActivity } from "../lib/api";
import logoLandscape from "@assets/tathbit_footer_trans.png";

const T = {
  paper:"#FBF7EE", paper2:"#F3ECDD", card:"#FFFFFF", ink:"#2B3A33", ink2:"#5C6B62",
  faint:"#8A968D", line:"#E8E0CF", green:"#1E7A57", greenSoft:"#E4F1E9", gold:"#C99A2E",
};
const SUBJECT_THEME = {
  aqaaid:{ c:"#1E7A57", soft:"#E2F0E8", name:"Aqaa-id" },
  akhlaaq:{ c:"#3E6CA6", soft:"#E5ECF6", name:"Akhlaaq" },
  fiqh:{ c:"#C76A3A", soft:"#F8E9DF", name:"Fiqh" },
  hadeeth:{ c:"#B08400", soft:"#F6EFD6", name:"Hadeeth" },
  tareekh:{ c:"#2E8C8C", soft:"#DEF0F0", name:"Tareekh" },
};
const PROPHET = "\uFDFA"; // peace be upon him glyph
const RA = "\u0631\u0636\u064A \u0627\u0644\u0644\u0647 \u0639\u0646\u0647";
const AS = "\u0639\u0644\u064A\u0647 \u0627\u0644\u0633\u0644\u0627\u0645";

// ----------------------------------------------------------------------------
//  Syllabus is loaded at boot from GET /api/syllabus/tree/:gradeId — no longer
//  hardcoded. applySyllabus() populates GRADE / SUBJECTS and merges colour
//  themes (keyed by the real DB subject id) onto SUBJECT_THEME.
// ----------------------------------------------------------------------------
const BASE_THEME = {
  aqaaid:{ c:"#1E7A57", soft:"#E2F0E8", name:"Aqaa-id" },
  akhlaaq:{ c:"#3E6CA6", soft:"#E5ECF6", name:"Akhlaaq" },
  fiqh:{ c:"#C76A3A", soft:"#F8E9DF", name:"Fiqh" },
  hadeeth:{ c:"#B08400", soft:"#F6EFD6", name:"Hadeeth" },
  tareekh:{ c:"#2E8C8C", soft:"#DEF0F0", name:"Tareekh" },
  duas:{ c:"#7A5CA6", soft:"#ECE6F5", name:"Du'as" },
  sunnah:{ c:"#A6537A", soft:"#F5E6EE", name:"Sunnah" },
  "islamic-history":{ c:"#8A6B3A", soft:"#F1EADD", name:"Islamic History" },
};
const FALLBACK_THEME = { c:"#1E7A57", soft:"#E4F1E9", name:"Subject" };

let SYLLABUS_NAME = "Tas-heel Series";
let GRADE = null;
let SUBJECTS = [];

// Map the API tree onto module state and ensure every subject has a theme,
// keyed by its real DB id (e.g. "g5-aqaaid"). Falls back gracefully so a new
// or unknown subject never crashes the UI.
function applySyllabus(tree, gradeId){
  GRADE = (tree && tree.grade) || { id: gradeId, name: "" };
  SUBJECTS = (tree && tree.subjects) || [];
  const prefix = gradeId ? gradeId + "-" : "";
  for (const s of SUBJECTS){
    const slug = (prefix && s.id.startsWith(prefix)) ? s.id.slice(prefix.length) : s.id;
    const base = BASE_THEME[slug] || FALLBACK_THEME;
    SUBJECT_THEME[s.id] = { c: base.c, soft: base.soft, name: s.name || base.name };
  }
}

const subjectById = (id) => SUBJECTS.find((s) => s.id === id);
const lessonById = (id) => { for (const s of SUBJECTS){ const l=s.lessons.find(x=>x.id===id); if(l) return {lesson:l, subject:s}; } return null; };
const lessonsWithContent = (s) => s.lessons.filter((l)=>!l.needsContent && l.questions && l.questions.length);
const allBankQuestions = () => { const out=[]; for(const s of SUBJECTS) for(const l of s.lessons) (l.questions||[]).forEach(qq=>out.push({...qq, subjectId:s.id, lessonId:l.id, lessonTitle:l.title, status:"active"})); return out; };

/* ---------------- logic helpers (would live in /lib) ---------------- */
const normalise = (s) => String(s==null?"":s).toLowerCase().trim().replace(/[\u2018\u2019']/g,"").replace(/[.,!?;:"()]/g,"").replace(/\s+/g," ");
function checkAnswer(question, answer){
  switch(question.type){
    case "multiple-choice":
    case "fill-blank": { const accepted=[question.correctAnswer,...(question.acceptedAnswers||[])]; return accepted.some(a=>normalise(a)===normalise(answer)); }
    case "short-answer": { const a=normalise(answer); return (question.acceptedAnswers||[]).some(x=>{const n=normalise(x); return a===n || (a.length>3 && a.includes(n)) || (n.length>3 && n.includes(a));}); }
    case "true-false": return Boolean(answer)===Boolean(question.correctAnswer);
    case "match": return question.pairs.every(p=>normalise(answer && answer[p.left])===normalise(p.right));
    default: return false;
  }
}
const SR_DAYS=[0,1,2,4,8,16];
function scheduleCard(card, result){
  let strength=card.strength==null?0:card.strength;
  if(result==="known") strength=Math.min(5,strength+1);
  else if(result==="learning") strength=Math.max(1,strength);
  else strength=0;
  return {...card, strength, dueAt:Date.now()+SR_DAYS[strength]*86400000, lastReviewed:Date.now()};
}
const todayKey=()=>new Date().toISOString().slice(0,10);
const daysBetween=(a,b)=>Math.ceil((new Date(b)-new Date(a))/86400000);
const shuffle=(arr)=>{const x=[...arr]; for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];} return x;};

/* ---------------- storage (server-backed via /api/progress/me) ----------------
   Student progress lives in PostgreSQL, not localStorage. get() loads the saved
   state blob for the signed-in student; set() persists the whole blob
   (last-write-wins). In-memory mem{} is only a within-session safety net if a
   save request fails, so the UI never loses the current session.            */
const KEY="tasheel:v1"; const mem={};
const store={
  async get(k){ try{ const r=await getProgress(); if(r!=null){ mem[k]=r; return r; } }catch(e){} return mem[k]==null?null:mem[k]; },
  async set(k,v){ mem[k]=v; try{ await saveProgress(v); }catch(e){} },
};
const blankState=()=>({ profile:null, examDate:null, completedLessons:[], attempts:[], wrongQuestionIds:[], cards:{}, customQuestions:[], sessionsByDay:{}, streak:{current:0,best:0,lastStudied:null}, best:{} });
const cloneState=(o)=> (typeof structuredClone==="function"?structuredClone(o):JSON.parse(JSON.stringify(o)));

/* ---------------- analytics + selection helpers ---------------- */
function subjectProgress(state){
  const out={};
  for(const s of SUBJECTS){
    const ready=s.lessons.filter(l=>!l.needsContent && l.questions && l.questions.length);
    const done=s.lessons.filter(l=>state.completedLessons.includes(l.id)).length;
    const readyDone=ready.filter(l=>state.completedLessons.includes(l.id)).length;
    let attempted=0, correct=0;
    for(const a of state.attempts) for(const ans of a.answers){ if(ans.subjectId===s.id){ attempted++; if(ans.isCorrect) correct++; } }
    out[s.id]={ done, total:s.lessons.length, attempted, correct,
      accuracy: attempted?Math.round((correct/attempted)*100):0,
      pct: ready.length?Math.round((readyDone/ready.length)*100):0 };
  }
  return out;
}
function weakTopics(state){
  const miss={};
  for(const a of state.attempts) for(const ans of a.answers){
    if(!ans.isCorrect && ans.lessonId){ miss[ans.lessonId]=miss[ans.lessonId]||{missed:0,subjectId:ans.subjectId}; miss[ans.lessonId].missed++; }
  }
  return Object.keys(miss).map(id=>{ const f=lessonById(id); return f?{lessonId:id, subjectId:miss[id].subjectId, title:f.lesson.title, missed:miss[id].missed}:null; })
    .filter(Boolean).sort((a,b)=>b.missed-a.missed).slice(0,5);
}
function pickQuestions(filter,n){
  let pool=[];
  for(const s of SUBJECTS){
    if(filter.subjectId && s.id!==filter.subjectId) continue;
    for(const l of s.lessons){
      if(l.needsContent||!l.questions) continue;
      for(const qq of l.questions){
        if(filter.difficulty && filter.difficulty!=="mixed" && qq.difficulty!==filter.difficulty) continue;
        pool.push({...qq, subjectId:s.id, lessonId:l.id});
      }
    }
  }
  return shuffle(pool).slice(0,n);
}
function planForDay(state,d){
  const subs=SUBJECTS.slice(0,5).map(s=>({
    subjectId:s.id,
    label:(SUBJECT_THEME[s.id]?.name||s.name)+" revision",
    detail:s.tagline||"Revise this subject",
  }));
  const r=[
    ...subs,
    {subjectId:null, label:"Mixed exam practice", detail:"Questions across all subjects"},
    {subjectId:null, label:"Flashcard review", detail:"Clear your due cards"},
  ];
  return r[d % r.length];
}
const offsetDayKey=(d)=>{ const x=new Date(); x.setDate(x.getDate()+d); return x.toISOString().slice(0,10); };
function buildInsight(state,prog,weak){
  const name=state.profile.name;
  const attempted=SUBJECTS.filter(s=>prog[s.id].attempted>0);
  if(attempted.length===0) return name+" hasn't taken any quizzes yet. A good start is one short lesson quiz a day across the five subjects.";
  const strong=[...attempted].sort((a,b)=>prog[b.id].accuracy-prog[a.id].accuracy)[0];
  const weakS=[...attempted].sort((a,b)=>prog[a.id].accuracy-prog[b.id].accuracy)[0];
  let s=name+" is strongest in "+strong.name+" ("+prog[strong.id].accuracy+"%)";
  if(weakS && weakS.id!==strong.id) s+=" and needs more revision in "+weakS.name+" ("+prog[weakS.id].accuracy+"%)";
  s+=".";
  if(weak.length) s+=" Focus next on \u201C"+weak[0].title+"\u201D — "+weak[0].missed+" question"+(weak[0].missed>1?"s":"")+" missed.";
  return s;
}
function makeCardFromQuestion(a){
  let front=a.prompt, back;
  if(a.type==="true-false") back=(a.correctAnswer?"True":"False")+(a.explanation?" — "+a.explanation:"");
  else if(a.type==="match"){ front="Match: "+a.prompt; back=a.pairsText||a.explanation||""; }
  else back=(Array.isArray(a.correctAnswer)?a.correctAnswer.join(", "):a.correctAnswer)+(a.explanation?" — "+a.explanation:"");
  return { id:"card-"+a.questionId, front, back, subjectId:a.subjectId, lessonId:a.lessonId, strength:0, dueAt:Date.now() };
}

/* ===================== UI PRIMITIVES ===================== */
const Ring = ({ value=0, size=44, stroke=5, color=T.green, track=T.line, children, animated=false, fillAnimation=false }) => {
  const r=(size-stroke)/2, c=2*Math.PI*r;
  const targetValue = Math.max(0,Math.min(100,value));
  const targetOff = c-(targetValue/100)*c;
  
  return (
    <div className={animated?'hover-glow':''} style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle 
          cx={size/2} 
          cy={size/2} 
          r={r} 
          fill="none" 
          stroke={color} 
          strokeWidth={stroke} 
          strokeDasharray={c} 
          strokeDashoffset={fillAnimation && targetValue > 0 ? c : targetOff} 
          strokeLinecap="round" 
          style={{ 
            transition: fillAnimation ? "none" : "stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)",
            animation: fillAnimation && targetValue > 0 ? `fillCircle 2s ease-in-out infinite` : "none",
            "--circle-length": c + "px",
            "--target-offset": targetOff + "px"
          }} 
        />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"grid", placeItems:"center", fontSize:size*0.28, fontWeight:700, color }}>{children}</div>
    </div>
  );
};
const Bar = ({ value=0, color=T.green, h=8 }) => (
  <div style={{ background:T.line, borderRadius:99, height:h, overflow:"hidden", width:"100%" }}>
    <div style={{ width:Math.max(0,Math.min(100,value))+"%", height:"100%", background:color, borderRadius:99, transition:"width .6s cubic-bezier(.4,0,.2,1)" }} />
  </div>
);
const Btn = ({ children, onClick, kind="primary", color=T.green, disabled, style, full, animated=false }) => {
  const base={ border:"none", cursor:disabled?"default":"pointer", borderRadius:16, fontSize:16, fontWeight:600, padding:"14px 20px", fontFamily:"inherit", transition:"all .2s cubic-bezier(.4,0,.2,1)", width:full?"100%":undefined, opacity:disabled?0.5:1, display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8 };
  const kinds={ primary:{ background:color, color:"#fff" }, soft:{ background:T.greenSoft, color:T.green }, ghost:{ background:"transparent", color:T.ink2, border:"1.5px solid "+T.line } };
  return (
    <button onClick={disabled?undefined:onClick} disabled={disabled}
      className={animated?'hover-scale':''}
      onMouseDown={(e)=>!disabled&&(e.currentTarget.style.transform=animated?"scale(.95)":"scale(.97)")}
      onMouseUp={(e)=>(e.currentTarget.style.transform=animated?"scale(1.05)":"scale(1)")}
      onMouseLeave={(e)=>(e.currentTarget.style.transform="scale(1)")}
      onMouseEnter={(e)=>!disabled&&animated&&(e.currentTarget.style.boxShadow="0 4px 12px rgba(43,58,51,.2)")}
      style={{ ...base, ...kinds[kind], ...style }}>{children}</button>
  );
};
const Card = ({ children, style, onClick, accent, animated=false }) => (
  <div onClick={onClick}
    className={`${animated?'hover-lift':''} ${onClick?'hover-scale':''}`}
    style={{ background:T.card, borderRadius:22, padding:18, border:"1px solid "+T.line, boxShadow:"0 1px 2px rgba(43,58,51,.04), 0 8px 24px -16px rgba(43,58,51,.18)", cursor:onClick?"pointer":"default", transition:"all .2s cubic-bezier(.4,0,.2,1)", borderLeft:accent?"4px solid "+accent:undefined, ...style }}
    onMouseEnter={(e)=>onClick&&(e.currentTarget.style.transform="translateY(-3px)",e.currentTarget.style.boxShadow="0 4px 16px rgba(43,58,51,.12), 0 12px 32px -20px rgba(43,58,51,.24)")}
    onMouseLeave={(e)=>onClick&&(e.currentTarget.style.transform="translateY(0)",e.currentTarget.style.boxShadow="0 1px 2px rgba(43,58,51,.04), 0 8px 24px -16px rgba(43,58,51,.18)")}>{children}</div>
);
const Pill = ({ children, color=T.green, bg }) => (
  <span style={{ fontSize:12, fontWeight:700, color, background:bg||(color+"15"), padding:"4px 10px", borderRadius:99, whiteSpace:"nowrap" }}>{children}</span>
);
const Header = ({ title, onBack, right }) => (
  <div style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0 16px" }}>
    {onBack && <button onClick={onBack} style={{ border:"1px solid "+T.line, background:T.card, borderRadius:12, width:40, height:40, display:"grid", placeItems:"center", cursor:"pointer", flexShrink:0 }}><ChevronLeft size={20} color={T.ink} /></button>}
    <h1 style={{ margin:0, fontFamily:"Fraunces, serif", fontSize:24, fontWeight:600, color:T.ink, flex:1, lineHeight:1.15 }}>{title}</h1>
    {right}
  </div>
);
const SectionTitle = ({ icon, title }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8, margin:"22px 0 10px" }}>{icon}<h2 style={{ margin:0, fontFamily:"Fraunces, serif", fontSize:18 }}>{title}</h2></div>
);
const FieldLabel = ({ children }) => <p style={{ fontWeight:700, fontSize:13.5, color:T.ink2, margin:"20px 0 8px" }}>{children}</p>;
const Chips = ({ value, setValue, options, accent }) => (
  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
    {options.map(o=>{ const on=value===o.v; return <button key={String(o.v)} onClick={()=>setValue(o.v)} style={{ padding:"10px 16px", borderRadius:99, fontSize:14, fontWeight:600, cursor:"pointer", border:"1.5px solid "+(on?accent:T.line), background:on?accent:T.card, color:on?"#fff":T.ink }}>{o.l}</button>; })}
  </div>
);
const labelType = (t)=>({ "multiple-choice":"Multiple choice","short-answer":"Short answer","fill-blank":"Fill in the blank","true-false":"True or false","match":"Match the columns" }[t]||t);

/* ===================== APP ===================== */
export default function App({ user = null, onLogout = null }){
  const [state,setState]=useState(null);
  const [ready,setReady]=useState(false);
  const [tab,setTab]=useState("home");
  const [route,setRoute]=useState({ name:"home" });
  const stack=useRef([]);

  useEffect(()=>{ (async()=>{
    // 1) Load this student's syllabus (grade -> subjects -> lessons -> questions)
    //    from the database. No syllabus is hardcoded any more.
    const gradeId = (user && user.gradeId) || "g5";
    try { const tree = await getSyllabusTree(gradeId); applySyllabus(tree, gradeId); }
    catch(e){ applySyllabus({ grade:{ id:gradeId, name:"" }, subjects:[] }, gradeId); }

    // 2) Load saved progress from the API (falls back to a blank state).
    const s=await store.get(KEY);
    const initialState = s || blankState();

    // If user is provided and profile doesn't exist, set it from user data
    if (user && !initialState.profile) {
      initialState.profile = { name: user.name, createdAt: Date.now() };
      if (!initialState.examDate) {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        initialState.examDate = d.toISOString().slice(0, 10);
      }
    }

    setState(initialState);
    setReady(true);
    logActivity("login").catch(()=>{});
  })(); },[user]);
  useEffect(()=>{ if(ready && state) store.set(KEY,state); },[state,ready]);

  const update=useCallback((fn)=>setState(s=>fn(cloneState(s))),[]);
  const go=(r)=>{ stack.current.push(route); setRoute(r); window.scrollTo(0,0); };
  const back=()=>{ const p=stack.current.pop(); setRoute(p||{name:"home"}); window.scrollTo(0,0); };
  const goTab=(t)=>{ stack.current=[]; setTab(t); setRoute({name:t}); window.scrollTo(0,0); };

  const recordSession=useCallback(()=>update(s=>{
    const k=todayKey(); s.sessionsByDay[k]=(s.sessionsByDay[k]||0)+1;
    if(s.streak.lastStudied!==k){ const cont=s.streak.lastStudied && daysBetween(s.streak.lastStudied,k)===1; s.streak.current=cont?s.streak.current+1:1; s.streak.best=Math.max(s.streak.best,s.streak.current); s.streak.lastStudied=k; }
    return s;
  }),[update]);

  const recordAttempt=useCallback((attempt)=>{
    update(s=>{
      s.attempts.unshift(attempt); s.attempts=s.attempts.slice(0,60);
      const pct=Math.round((attempt.score/attempt.total)*100);
      if(attempt.subjectId) s.best[attempt.subjectId]=Math.max(s.best[attempt.subjectId]||0,pct);
      attempt.answers.forEach(a=>{ if(!a.isCorrect){ if(!s.wrongQuestionIds.includes(a.questionId)) s.wrongQuestionIds.push(a.questionId); const c=makeCardFromQuestion(a); if(c&&!s.cards[c.id]) s.cards[c.id]=c; } });
      if(attempt.lessonId && pct>=60 && !s.completedLessons.includes(attempt.lessonId)) s.completedLessons.push(attempt.lessonId);
      return s;
    });
    // Log the finished quiz as a session + one row per question, so teacher /
    // admin analytics (success rate, weakest questions, speed) are accurate.
    const durationMs = (attempt.startedAt && attempt.completedAt)
      ? Math.max(0, new Date(attempt.completedAt) - new Date(attempt.startedAt)) : null;
    logQuizSession({
      mode: attempt.mode || null,
      subjectId: attempt.subjectId || null,
      lessonId: attempt.lessonId || null,
      gradeId: (GRADE && GRADE.id) || null,
      score: attempt.score, total: attempt.total,
      durationMs, startedAt: attempt.startedAt || null,
      answers: (attempt.answers || []).map(a=>({
        questionId: a.questionId, subjectId: a.subjectId, lessonId: a.lessonId,
        type: a.type, isCorrect: !!a.isCorrect,
      })),
    }).catch(()=>{});
  },[update]);

  if(!ready || !state) return <Boot />;
  if(!state.profile) return (
    <Shell noNav>
      <Onboarding onDone={(name)=>update(s=>{ s.profile={name,createdAt:Date.now()}; if(!s.examDate){ const d=new Date(); d.setDate(d.getDate()+14); s.examDate=d.toISOString().slice(0,10); } return s; })} />
    </Shell>
  );

  const ctx={ state, update, go, back, goTab, recordSession, recordAttempt, onLogout };
  let screen;
  switch(route.name){
    case "subjects": screen=<Subjects ctx={ctx} />; break;
    case "subject": screen=<SubjectScreen ctx={ctx} subjectId={route.subjectId} />; break;
    case "lesson": screen=<LessonScreen ctx={ctx} lessonId={route.lessonId} />; break;
    case "quiz": screen=<QuizRunner ctx={ctx} config={route.config} />; break;
    case "cards": screen=<Flashcards ctx={ctx} subjectId={route.subjectId} lessonId={route.lessonId} />; break;
    case "exam": screen=<ExamSetup ctx={ctx} />; break;
    case "plan": screen=<Planner ctx={ctx} />; break;
    case "me": screen=<Progress ctx={ctx} />; break;
    case "admin": screen=<Admin ctx={ctx} />; break;
    default: screen=<Dashboard ctx={ctx} />;
  }
  return <Shell tab={tab} goTab={goTab}>{screen}</Shell>;
}

function Boot(){ return <div style={{ minHeight:"100vh", display:"grid", placeItems:"center", background:T.paper, fontFamily:"system-ui" }}><div style={{ color:T.green, fontWeight:700 }}>Loading…</div></div>; }

function Shell({ children, tab, goTab, noNav }){
  return (
    <div style={{ minHeight:"100vh", background:T.paper, fontFamily:"'Plus Jakarta Sans', system-ui, sans-serif", color:T.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{ box-sizing:border-box; -webkit-tap-highlight-color:transparent; } body{ margin:0; }
        input,textarea,select,button{ font-family:inherit; }
        
        /* Base animations */
        @keyframes fadeUp{ from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes pop{ 0%{transform:scale(.8);opacity:0} 60%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
        @keyframes float{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes rotate{ from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse{ 0%,100%{opacity:1} 50%{opacity:.6} }
        @keyframes bounce{ 0%,20%,53%,80%,100%{transform:translateY(0)} 40%,43%{transform:translateY(-8px)} }
        @keyframes glow{ 0%,100%{box-shadow:0 0 5px rgba(30,122,87,.2)} 50%{box-shadow:0 0 20px rgba(30,122,87,.4), 0 0 30px rgba(30,122,87,.2)} }
        @keyframes shimmer{ 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes slideIn{ from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes flipIn{ 0%{transform:rotateY(90deg);opacity:0} 100%{transform:rotateY(0);opacity:1} }
        @keyframes scale{ 0%{transform:scale(.95)} 50%{transform:scale(1.02)} 100%{transform:scale(1)} }
        @keyframes heartbeat{ 0%{transform:scale(1)} 14%{transform:scale(1.1)} 28%{transform:scale(1)} 42%{transform:scale(1.1)} 70%{transform:scale(1)} }
        @keyframes wiggle{ 0%,7%,14%,21%,28%,35%,42%,49%,56%,63%,70%,77%,84%,91%,98%,100%{transform:rotate(0deg)} 3.5%,10.5%,17.5%,24.5%,31.5%,38.5%,45.5%,52.5%,59.5%,66.5%,73.5%,80.5%,87.5%,94.5%{transform:rotate(-2deg)} }
        @keyframes fillCircle{ 0%{stroke-dashoffset:var(--circle-length)} 100%{stroke-dashoffset:var(--target-offset)} }
        
        /* Animation classes */
        .fade{ animation:fadeUp .4s cubic-bezier(.4,0,.2,1) both; }
        .pop{ animation:pop .5s cubic-bezier(.4,0,.2,1) both; }
        .float{ animation:float 3s ease-in-out infinite; }
        .rotate{ animation:rotate 3s linear infinite; }
        .pulse{ animation:pulse 2s ease-in-out infinite; }
        .bounce{ animation:bounce 1s ease-in-out infinite; }
        .glow{ animation:glow 2s ease-in-out infinite; }
        .shimmer{ background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent); background-size:200% 100%; animation:shimmer 2s infinite; }
        .slideIn{ animation:slideIn .4s cubic-bezier(.4,0,.2,1) both; }
        .flipIn{ animation:flipIn .6s cubic-bezier(.4,0,.2,1) both; }
        .scale{ animation:scale .3s cubic-bezier(.4,0,.2,1) both; }
        .heartbeat{ animation:heartbeat 1.5s ease-in-out infinite; }
        .wiggle{ animation:wiggle .8s ease-in-out; }
        
        /* Stagger animations */
        .stagger>*{ animation:fadeUp .45s cubic-bezier(.4,0,.2,1) both; }
        .stagger>*:nth-child(1){animation-delay:.03s}.stagger>*:nth-child(2){animation-delay:.07s}
        .stagger>*:nth-child(3){animation-delay:.11s}.stagger>*:nth-child(4){animation-delay:.15s}
        .stagger>*:nth-child(5){animation-delay:.19s}.stagger>*:nth-child(6){animation-delay:.23s}
        .stagger>*:nth-child(7){animation-delay:.27s}.stagger>*:nth-child(8){animation-delay:.31s}
        .stagger>*:nth-child(9){animation-delay:.35s}.stagger>*:nth-child(10){animation-delay:.39s}
        
        /* Hover states */
        .hover-lift{ transition:all .2s cubic-bezier(.4,0,.2,1); }
        .hover-lift:hover{ transform:translateY(-3px); box-shadow:0 4px 12px rgba(43,58,51,.15); }
        .hover-glow{ transition:all .3s ease; }
        .hover-glow:hover{ box-shadow:0 0 20px rgba(30,122,87,.3); }
        .hover-scale{ transition:transform .2s ease; }
        .hover-scale:hover{ transform:scale(1.05); }
        .hover-rotate{ transition:transform .3s ease; }
        .hover-rotate:hover{ transform:rotate(5deg); }
        
        /* Navigation icon animations */
        .nav-icon{ transition:all .3s cubic-bezier(.4,0,.2,1); }
        .nav-icon:hover{ transform:translateY(-2px) scale(1.1); }
        .nav-icon.active{ animation:bounce .6s ease-in-out; }
        
        
        /* Flashcard flip animation */
        .flashcard{ perspective:1000px; transition:all .4s cubic-bezier(.4,0,.2,1); }
        .flashcard.flipping{ animation:flipIn .6s cubic-bezier(.4,0,.2,1); }
        
        input:focus,textarea:focus,select:focus{ outline:2px solid ${T.green}40; }
      `}</style>
      <div style={{ maxWidth:540, margin:"0 auto", minHeight:"100vh", background:T.paper, backgroundImage:"radial-gradient("+T.paper2+" 1px, transparent 1px)", backgroundSize:"22px 22px", display:"flex", flexDirection:"column" }}>
        <div style={{ flex:1, padding:"20px 18px", paddingBottom:noNav?28:80 }}>{children}</div>
        {!noNav && (
          <div style={{ position:"sticky", bottom:0, background:"rgba(251,247,238,.92)", backdropFilter:"blur(10px)" }}>
            <footer style={{ textAlign:"center", padding:"12px 18px 8px", background:"rgba(251,247,238,.92)" }}>
              <img src={logoLandscape} alt="Tathbīt" style={{ height:32, width:"auto", objectFit:"contain", marginBottom:6 }} />
              {/* <p style={{ margin:0, fontSize:11, color:T.faint }}>Copyright &copy; 2026 Tathbīt</p> */}
            </footer>
            <nav style={{ borderTop:"1px solid "+T.line, display:"flex", padding:"12px 8px calc(12px + env(safe-area-inset-bottom))" }}>
              {[{k:"home",I:Home,l:"Home"},{k:"subjects",I:BookOpen,l:"Subjects"},{k:"cards",I:Layers,l:"Cards"},{k:"plan",I:Calendar,l:"Plan"},{k:"me",I:User,l:"Me"}].map(({k,I,l})=>{
                const on=tab===k;
                return <button key={k} onClick={()=>goTab(k)} className={`nav-icon ${on?'active':''}`} style={{ flex:1, border:"none", background:"transparent", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"8px 4px", color:on?T.green:T.faint, minHeight:48 }}><I size={20} strokeWidth={on?2.5:2} /><span style={{ fontSize:10, fontWeight:on?700:600 }}>{l}</span></button>;
              })}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}

function Onboarding({ onDone }){
  const [name,setName]=useState("");
  return (
    <div className="fade" style={{ minHeight:"82vh", display:"flex", flexDirection:"column", justifyContent:"center" }}>
      <div style={{ textAlign:"center", marginBottom:10 }}>
        <div style={{ width:78, height:78, borderRadius:24, background:T.greenSoft, display:"grid", placeItems:"center", margin:"0 auto 18px", animation:"float 4s ease-in-out infinite" }}><GraduationCap size={40} color={T.green} /></div>
        <h1 style={{ fontFamily:"Fraunces, serif", fontSize:32, margin:"0 0 6px", color:T.ink }}>Tas-heel Revision</h1>
        <p style={{ color:T.ink2, margin:0, fontSize:15, lineHeight:1.5 }}>Revise your Madrasah subjects — lessons, quizzes,<br/>flashcards and a plan for exam day.</p>
      </div>
      <Card style={{ marginTop:26 }}>
        <label style={{ fontSize:13, fontWeight:700, color:T.ink2 }}>What is your name?</label>
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="e.g. Muhammad" onKeyDown={(e)=>e.key==="Enter"&&name.trim()&&onDone(name.trim())} style={{ width:"100%", marginTop:8, padding:"14px 16px", borderRadius:14, border:"1.5px solid "+T.line, fontSize:17, background:T.paper }} />
        <Btn full disabled={!name.trim()} onClick={()=>onDone(name.trim())} animated style={{ marginTop:14 }}>Start revising <ArrowRight size={18} /></Btn>
      </Card>
      <p style={{ textAlign:"center", color:T.faint, fontSize:12, marginTop:18 }}>Saved on this device. No account needed.</p>
    </div>
  );
}

/* ===================== DASHBOARD ===================== */
function Dashboard({ ctx }){
  const { state, go, goTab, onLogout }=ctx;
  const name=state.profile.name;
  const days=state.examDate?Math.max(0,daysBetween(todayKey(),state.examDate)):null;
  const dueCards=Object.values(state.cards).filter(c=>(c.dueAt||0)<=Date.now());
  const prog=subjectProgress(state);
  const overallPct=Math.round(SUBJECTS.reduce((a,s)=>a+prog[s.id].pct,0)/SUBJECTS.length);
  const today=planForDay(state,0);
  return (
    <div className="stagger">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div><p style={{ margin:0, color:T.ink2, fontSize:14 }}>Assalamu alaykum,</p><h1 style={{ margin:"2px 0 0", fontFamily:"Fraunces, serif", fontSize:30, color:T.ink }}>{name}</h1></div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {onLogout && (
            <button 
              onClick={() => { logActivity("logout").catch(()=>{}); logout(); onLogout(); }} 
              className="hover-scale"
              style={{ 
                border:"1px solid "+T.line, 
                background:T.card, 
                borderRadius:14, 
                padding:"8px 12px", 
                display:"flex", 
                alignItems:"center", 
                gap:6, 
                cursor:"pointer",
                fontSize:12,
                color:T.ink,
                transition:"all .2s ease"
              }}>
              <LogOut size={16} />
              Logout
            </button>
          )}
          <button onClick={()=>goTab("me")} className="hover-scale" style={{ border:"1px solid "+T.line, background:T.card, borderRadius:14, padding:"8px 12px", display:"flex", alignItems:"center", gap:6, cursor:"pointer", transition:"all .2s ease" }}>
            <div className={state.streak.current?'heartbeat':''}><Flame size={18} color={state.streak.current?T.gold:T.faint} /></div>
            <b style={{ color:T.ink }}>{state.streak.current}</b>
          </button>
        </div>
      </div>

      <Card onClick={()=>goTab("plan")} animated style={{ marginTop:16, background:T.green, border:"none", color:"#fff", overflow:"hidden", position:"relative" }}>
        <div className="pulse" style={{ position:"absolute", right:-20, top:-20, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,.08)" }} />
        <p style={{ margin:0, opacity:.85, fontSize:13, fontWeight:600 }}>Exam countdown</p>
        <div style={{ display:"flex", alignItems:"baseline", gap:8, marginTop:4 }}>
          <span className="heartbeat" style={{ fontFamily:"Fraunces, serif", fontSize:44, fontWeight:600, lineHeight:1 }}>{days==null?"—":days}</span>
          <span style={{ fontSize:16, opacity:.9 }}>days to go</span>
        </div>
        <p style={{ margin:"10px 0 0", fontSize:13, opacity:.9, display:"flex", alignItems:"center", gap:6 }}>Today: {today.label} <ChevronRight size={15} /></p>
      </Card>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:12 }}>
        <Card animated style={{ padding:16 }}><div style={{ display:"flex", alignItems:"center", gap:12 }}><Ring value={overallPct} size={48} animated fillAnimation={overallPct>0}>{overallPct}%</Ring><div><p style={{ margin:0, fontSize:13, color:T.ink2 }}>Overall</p><b style={{ fontSize:15 }}>progress</b></div></div></Card>
        <Card onClick={()=>goTab("cards")} animated style={{ padding:16 }}><div style={{ display:"flex", alignItems:"center", gap:12 }}><div className="float" style={{ width:48, height:48, borderRadius:14, background:T.greenSoft, display:"grid", placeItems:"center" }}><Layers size={22} color={T.green} /></div><div><p style={{ margin:0, fontSize:13, color:T.ink2 }}>Flashcards</p><b style={{ fontSize:15 }}>{dueCards.length} due now</b></div></div></Card>
      </div>

      <Card onClick={()=>go({name:"exam"})} animated style={{ marginTop:12, display:"flex", alignItems:"center", gap:14 }} accent={T.gold}>
        <div className="bounce" style={{ width:44, height:44, borderRadius:14, background:T.gold+"1a", display:"grid", placeItems:"center" }}><Trophy size={22} color={T.gold} /></div>
        <div style={{ flex:1 }}><b style={{ fontSize:16 }}>Exam Practice</b><p style={{ margin:0, color:T.ink2, fontSize:13 }}>Mixed test — choose subject, length & difficulty</p></div>
        <ChevronRight color={T.faint} />
      </Card>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", margin:"22px 0 12px" }}>
        <h2 style={{ margin:0, fontFamily:"Fraunces, serif", fontSize:20 }}>Your subjects</h2>
        <button onClick={()=>goTab("subjects")} className="hover-scale" style={{ border:"none", background:"none", color:T.green, fontWeight:700, fontSize:13, cursor:"pointer", transition:"all .2s ease" }}>See all</button>
      </div>
      <div style={{ display:"grid", gap:12 }}>
        {SUBJECTS.map(s=>{ const th=SUBJECT_THEME[s.id], p=prog[s.id]; const shown=p.attempted?p.accuracy:p.pct; return (
          <Card key={s.id} accent={th.c} onClick={()=>go({name:"subject",subjectId:s.id})} animated style={{ display:"flex", alignItems:"center", gap:14 }}>
            <Ring value={shown} size={46} color={th.c} track={th.soft} animated>{shown}%</Ring>
            <div style={{ flex:1, minWidth:0 }}><b style={{ fontSize:16 }}>{s.name}</b><p style={{ margin:"2px 0 0", color:T.ink2, fontSize:12.5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.attempted?p.accuracy+"% accuracy · "+p.done+"/"+p.total+" lessons":s.tagline}</p></div>
            <ChevronRight color={T.faint} />
          </Card>
        ); })}
      </div>
    </div>
  );
}

/* ===================== SUBJECTS LIST ===================== */
function Subjects({ ctx }){
  const { state, go }=ctx; const prog=subjectProgress(state);
  return (
    <div>
      <p style={{ margin:0, color:T.ink2, fontSize:13, fontWeight:600 }}>{SYLLABUS_NAME} · {GRADE?.name}</p>
      <Header title="Choose a subject" />
      <div className="stagger" style={{ display:"grid", gap:14 }}>
        {SUBJECTS.map(s=>{ const th=SUBJECT_THEME[s.id], p=prog[s.id], ready=lessonsWithContent(s).length; return (
          <Card key={s.id} accent={th.c} onClick={()=>go({name:"subject",subjectId:s.id})} animated>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div className="hover-rotate" style={{ width:52, height:52, borderRadius:16, background:th.soft, display:"grid", placeItems:"center", flexShrink:0 }}><BookMarked size={24} color={th.c} /></div>
              <div style={{ flex:1 }}><b style={{ fontSize:17 }}>{s.name}</b><p style={{ margin:"2px 0 0", color:T.ink2, fontSize:13 }}>{s.lessons.length} lessons · {ready} ready</p></div>
              <Ring value={p.pct} size={44} color={th.c} track={th.soft} animated fillAnimation={p.pct>0}>{p.pct}%</Ring>
            </div>
          </Card>
        ); })}
      </div>
    </div>
  );
}

/* ===================== SUBJECT SCREEN ===================== */
const Stat = ({ label, value, c }) => (<div><div style={{ fontFamily:"Fraunces, serif", fontSize:22, fontWeight:600, color:c }}>{value}</div><div style={{ fontSize:11.5, color:T.ink2, marginTop:2 }}>{label}</div></div>);
function SubjectScreen({ ctx, subjectId }){
  const { state, go, back }=ctx; const s=subjectById(subjectId), th=SUBJECT_THEME[subjectId];
  const stats=subjectProgress(state)[subjectId]; const ready=lessonsWithContent(s);
  return (
    <div>
      <Header title={s.name} onBack={back} />
      <Card accent={th.c} style={{ background:th.soft, border:"none" }}>
        <p style={{ margin:0, fontSize:14, color:T.ink, lineHeight:1.5 }}>{s.tagline}</p>
        <div style={{ display:"flex", gap:18, marginTop:14 }}>
          <Stat label="Lessons done" value={stats.done+"/"+s.lessons.length} c={th.c} />
          <Stat label="Accuracy" value={stats.accuracy+"%"} c={th.c} />
          <Stat label="Best score" value={(state.best[subjectId]||0)+"%"} c={th.c} />
        </div>
      </Card>
      {ready.length>0 && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:14 }}>
          <Btn color={th.c} onClick={()=>go({name:"quiz",config:{mode:"quick-quiz",subjectId,title:s.name+" quick quiz",questions:pickQuestions({subjectId},8)}})}><Target size={18} /> Quick quiz</Btn>
          <Btn kind="soft" color={th.c} style={{ background:th.soft }} onClick={()=>go({name:"cards",subjectId})}><Layers size={18} /> Flashcards</Btn>
        </div>
      )}
      <h2 style={{ fontFamily:"Fraunces, serif", fontSize:19, margin:"22px 0 4px" }}>Lessons</h2>
      <p style={{ margin:"0 0 14px", color:T.faint, fontSize:12.5 }}>Following the order of the Tas-heel book</p>
      <div className="stagger" style={{ display:"grid", gap:10 }}>
        {s.lessons.map(l=>{ const done=state.completedLessons.includes(l.id); const hasQ=!l.needsContent && l.questions && l.questions.length; return (
          <Card key={l.id} onClick={hasQ?()=>go({name:"lesson",lessonId:l.id}):undefined} style={{ display:"flex", alignItems:"center", gap:14, opacity:hasQ?1:0.7, cursor:hasQ?"pointer":"default" }}>
            <div style={{ width:38, height:38, borderRadius:12, flexShrink:0, display:"grid", placeItems:"center", background:done?th.c:th.soft, color:done?"#fff":th.c, fontWeight:700, fontSize:14 }}>{done?<Check size={18} />:l.n}</div>
            <div style={{ flex:1, minWidth:0 }}><b style={{ fontSize:15, color:T.ink }}>{l.title}</b><p style={{ margin:"2px 0 0", color:T.faint, fontSize:12 }}>pp. {l.pages}{hasQ?" · "+l.questions.length+" questions":" · content coming soon"}</p></div>
            {hasQ?<ChevronRight color={T.faint} />:<Pill color={T.faint} bg={T.line}>soon</Pill>}
          </Card>
        ); })}
      </div>
    </div>
  );
}

/* ===================== LESSON SCREEN ===================== */
function ArabicVerse({ entry, color, soft }){
  const [open,setOpen]=useState(false);
  const hasMore = !!(entry.translit || entry.meaning);
  return (
    <div onClick={hasMore?()=>setOpen(o=>!o):undefined} style={{ background:soft, borderRadius:16, padding:"18px 16px", cursor:hasMore?"pointer":"default" }}>
      <p dir="rtl" lang="ar" style={{ margin:0, fontFamily:"'Noto Naskh Arabic', serif", fontSize:26, lineHeight:2.1, color:T.ink, textAlign:"center" }}>{entry.text}</p>
      {hasMore && open && (
        <div style={{ marginTop:12, borderTop:"1px solid "+color+"33", paddingTop:12 }}>
          {entry.translit && <p style={{ margin:"0 0 6px", fontSize:14, fontStyle:"italic", color:T.ink2, textAlign:"center" }}>{entry.translit}</p>}
          {entry.meaning && <p style={{ margin:0, fontSize:14.5, color:T.ink, textAlign:"center", lineHeight:1.5 }}>{entry.meaning}</p>}
        </div>
      )}
      {hasMore && !open && <p style={{ margin:"10px 0 0", fontSize:11.5, color, textAlign:"center", fontWeight:600 }}>tap for meaning</p>}
    </div>
  );
}

function LessonScreen({ ctx, lessonId }){
  const { go, back }=ctx; const found=lessonById(lessonId);
  useEffect(()=>{ if(found) logActivity("lesson_view",{ subjectId:found.subject.id, lessonId, meta:{ title:found.lesson.title } }).catch(()=>{}); },[lessonId]);
  if(!found) return null;
  const l=found.lesson, s=found.subject, th=SUBJECT_THEME[s.id];
  return (
    <div className="fade">
      <Header title={l.title} onBack={back} right={<Pill color={th.c}>Lesson {l.n}</Pill>} />
      {l.summary && <Card style={{ borderLeft:"4px solid "+th.c }}><p style={{ margin:0, lineHeight:1.62, fontSize:15, color:T.ink }}>{l.summary}</p></Card>}
      {l.arabic && l.arabic.length>0 && (<>
        <SectionTitle icon={<BookOpen size={16} color={th.c} />} title="Du'ā &amp; āyāt" />
        <div style={{ display:"grid", gap:10 }}>{l.arabic.map((a,i)=><ArabicVerse key={i} entry={a} color={th.c} soft={th.soft} />)}</div>
      </>)}
      {l.keyTerms && l.keyTerms.length>0 && (<>
        <SectionTitle icon={<Sparkles size={16} color={th.c} />} title="Key terms & new words" />
        <div style={{ display:"grid", gap:8 }}>
          {l.keyTerms.map(k=>(<div key={k.term} style={{ display:"flex", gap:12, alignItems:"center", background:th.soft, padding:"12px 14px", borderRadius:14 }}><b style={{ color:th.c, minWidth:92, fontSize:14 }}>{k.term}</b><span style={{ fontSize:14, color:T.ink, lineHeight:1.4, flex:1 }}>{k.meaning}</span>{k.arabic && <span dir="rtl" lang="ar" style={{ fontFamily:"'Noto Naskh Arabic', serif", fontSize:19, color:th.c, marginLeft:8 }}>{k.arabic}</span>}</div>))}
        </div>
      </>)}
      {l.points && l.points.length>0 && (<>
        <SectionTitle icon={<ListChecks size={16} color={th.c} />} title="Important points" />
        <Card><ul style={{ margin:0, paddingLeft:18, display:"grid", gap:10 }}>{l.points.map((p,i)=><li key={i} style={{ fontSize:14.5, lineHeight:1.55, color:T.ink }}>{p}</li>)}</ul></Card>
      </>)}
      {l.story && (<>
        <SectionTitle icon={<BookOpen size={16} color={th.c} />} title={"Story — "+l.story.title} />
        <Card style={{ background:T.paper2, border:"none" }}><p style={{ margin:0, fontSize:14.5, lineHeight:1.6, color:T.ink, fontStyle:"italic" }}>{l.story.text}</p></Card>
      </>)}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:22 }}>
        <Btn color={th.c} onClick={()=>go({name:"quiz",config:{mode:"lesson-practice",subjectId:s.id,lessonId:l.id,title:l.title+" quiz",questions:shuffle([...l.questions])}})}><Target size={18} /> Start quiz</Btn>
        <Btn kind="soft" color={th.c} style={{ background:th.soft }} onClick={()=>go({name:"cards",subjectId:s.id,lessonId:l.id})}><Layers size={18} /> Flashcards</Btn>
      </div>
      <p style={{ color:T.faint, fontSize:11.5, textAlign:"center", marginTop:16 }}>Source: {s.source?s.source+", ":""}pp. {l.pages}. To be checked by a parent/teacher.</p>
    </div>
  );
}

/* ===================== QUIZ ENGINE ===================== */
const hasAnswer=(qq,a)=>{ if(qq.type==="match") return a && qq.pairs.every(p=>a[p.left]); if(qq.type==="true-false") return a!==null && a!==undefined; return a!==null && a!==undefined && String(a).trim()!==""; };

function QuizRunner({ ctx, config }){
  const { back, recordAttempt, recordSession }=ctx;
  const th=SUBJECT_THEME[config.subjectId]||{ c:T.green, soft:T.greenSoft };
  const qs=config.questions;
  const [i,setI]=useState(0); const [answer,setAnswer]=useState(null);
  const [locked,setLocked]=useState(false); const [answers,setAnswers]=useState([]); const [done,setDone]=useState(false);
  const startRef=useRef(Date.now());
  if(!qs||!qs.length) return <div><Header title={config.title} onBack={back} /><Card>No questions yet for this selection.</Card></div>;
  const cur=qs[i]; const isRight=locked?checkAnswer(cur,answer):false;

  const submit=()=>{ setLocked(true); const correct=checkAnswer(cur,answer);
    setAnswers(a=>[...a,{ questionId:cur.id, type:cur.type, prompt:cur.prompt, studentAnswer:answer, correctAnswer:cur.correctAnswer!=null?cur.correctAnswer:(cur.acceptedAnswers?cur.acceptedAnswers[0]:""), isCorrect:correct, explanation:cur.explanation, subjectId:config.subjectId, lessonId:config.lessonId, pairsText:cur.type==="match"?cur.pairs.map(p=>p.left+" → "+p.right).join("; "):undefined }]);
  };
  const next=()=>{ if(i+1<qs.length){ setI(i+1); setAnswer(null); setLocked(false); }
    else { const score=answers.filter(a=>a.isCorrect).length;
      recordAttempt({ id:"att-"+Date.now(), mode:config.mode, subjectId:config.subjectId, lessonId:config.lessonId, title:config.title, startedAt:new Date(startRef.current).toISOString(), completedAt:new Date().toISOString(), score, total:qs.length, answers });
      recordSession(); setDone(true); }
  };
  if(done) return <Results answers={answers} total={qs.length} th={th} onClose={back} />;
  return (
    <div className="fade">
      <Header title={config.title} onBack={back} right={<Pill color={th.c}>{i+1}/{qs.length}</Pill>} />
      <Bar value={(i/qs.length)*100} color={th.c} />
      <div style={{ height:18 }} />
      <Pill color={th.c}>{labelType(cur.type)}{cur.difficulty?" · "+cur.difficulty:""}</Pill>
      <h2 style={{ fontFamily:"Fraunces, serif", fontSize:22, lineHeight:1.3, margin:"12px 0 18px", color:T.ink }}>{cur.prompt}</h2>
      <QuestionBody q={cur} answer={answer} setAnswer={setAnswer} locked={locked} th={th} />
      {locked && (
        <Card className="pop" style={{ marginTop:16, background:isRight?T.greenSoft:"#FBEFEC", border:"none" }}>
          <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
            <div className={isRight?"bounce":"wiggle"}>{isRight?<CheckCircle2 color={T.green} />:<XCircle color="#C0563B" />}</div>
            <div>
              <b style={{ color:isRight?T.green:"#C0563B" }}>{isRight?"Mashaa-Allah, correct!":"Good try — let's revise this one."}</b>
              {!isRight && cur.type!=="match" && <p style={{ margin:"4px 0 0", fontSize:14, color:T.ink }}>Answer: <b>{cur.type==="true-false"?(cur.correctAnswer?"True":"False"):(cur.correctAnswer!=null?cur.correctAnswer:cur.acceptedAnswers[0])}</b></p>}
              {cur.explanation && <p style={{ margin:"6px 0 0", fontSize:13.5, color:T.ink2, lineHeight:1.5 }}>{cur.explanation}</p>}
            </div>
          </div>
        </Card>
      )}
      <div style={{ height:16 }} />
      {!locked ? <Btn full color={th.c} disabled={!hasAnswer(cur,answer)} onClick={submit} animated>Check answer</Btn>
        : <Btn full color={th.c} onClick={next} animated>{i+1<qs.length?"Next question":"See results"} <ArrowRight size={18} /></Btn>}
    </div>
  );
}

function QuestionBody({ q, answer, setAnswer, locked, th }){
  if(q.type==="multiple-choice"){
    return (
      <div style={{ display:"grid", gap:10 }}>
        {q.options.map(o=>{ const sel=answer===o; const correct=locked&&normalise(o)===normalise(q.correctAnswer); const wrong=locked&&sel&&!correct; return (
          <button key={o} disabled={locked} onClick={()=>setAnswer(o)} className={!locked?"hover-lift slideIn":""} style={{ textAlign:"left", padding:"15px 16px", borderRadius:16, fontSize:15.5, cursor:locked?"default":"pointer", border:"1.5px solid "+(correct?T.green:wrong?"#C0563B":sel?th.c:T.line), background:correct?T.greenSoft:wrong?"#FBEFEC":sel?th.soft:T.card, color:T.ink, fontWeight:sel||correct?600:500, display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, transition:"all .2s ease" }}>{o}{correct&&<Check size={18} color={T.green} />}{wrong&&<X size={18} color="#C0563B" />}</button>
        ); })}
      </div>
    );
  }
  if(q.type==="fill-blank") return <TextField answer={answer} setAnswer={setAnswer} locked={locked} placeholder="Type the missing word…" />;
  if(q.type==="short-answer") return <TextField answer={answer} setAnswer={setAnswer} locked={locked} placeholder="Type your answer…" multiline />;
  if(q.type==="true-false") return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
      {[{v:true,l:"True"},{v:false,l:"False"}].map(({v,l})=>{ const sel=answer===v, correct=locked&&q.correctAnswer===v, wrong=locked&&sel&&!correct; return (
        <button key={l} disabled={locked} onClick={()=>setAnswer(v)} className={!locked?"hover-scale":""} style={{ padding:"22px 0", borderRadius:16, fontSize:17, fontWeight:700, cursor:locked?"default":"pointer", border:"1.5px solid "+(correct?T.green:wrong?"#C0563B":sel?th.c:T.line), background:correct?T.greenSoft:wrong?"#FBEFEC":sel?th.soft:T.card, color:T.ink, transition:"all .2s ease" }}>{l}</button>
      ); })}
    </div>
  );
  if(q.type==="match") return <MatchBody q={q} answer={answer} setAnswer={setAnswer} locked={locked} th={th} />;
  return null;
}
function TextField({ answer, setAnswer, locked, placeholder, multiline }){
  const P=multiline?"textarea":"input";
  return <P value={answer||""} disabled={locked} onChange={(e)=>setAnswer(e.target.value)} placeholder={placeholder} rows={multiline?3:undefined} style={{ width:"100%", padding:"15px 16px", borderRadius:16, border:"1.5px solid "+T.line, fontSize:16, background:locked?T.paper2:T.card, resize:"none", color:T.ink }} />;
}
function MatchBody({ q, answer, setAnswer, locked, th }){
  const a=answer||{};
  const rights=useMemo(()=>shuffle(q.pairs.map(p=>p.right)),[q.id]);
  const setPair=(left,right)=>{ const n={...a}; n[left]=right; setAnswer(n); };
  return (
    <div style={{ display:"grid", gap:10 }}>
      {q.pairs.map(p=>{ const chosen=a[p.left]; const correct=locked&&normalise(chosen)===normalise(p.right); return (
        <div key={p.left} style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ minWidth:96, fontWeight:700, color:th.c, fontSize:14 }}>{p.left}</div>
          <select disabled={locked} value={chosen||""} onChange={(e)=>setPair(p.left,e.target.value)} style={{ flex:1, padding:"12px 14px", borderRadius:14, fontSize:15, color:T.ink, border:"1.5px solid "+(locked?(correct?T.green:"#C0563B"):(chosen?th.c:T.line)), background:locked?(correct?T.greenSoft:"#FBEFEC"):T.card }}>
            <option value="" disabled>Choose…</option>
            {rights.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
          {locked&&(correct?<Check size={18} color={T.green} />:<X size={18} color="#C0563B" />)}
        </div>
      ); })}
      {locked && <p style={{ fontSize:13, color:T.ink2, margin:"4px 0 0" }}>Correct: {q.pairs.map(p=>p.left+" → "+p.right).join(" · ")}</p>}
    </div>
  );
}

/* ===================== RESULTS ===================== */
function Results({ answers, total, th, onClose }){
  const score=answers.filter(a=>a.isCorrect).length; const pct=Math.round((score/total)*100);
  const wrong=answers.filter(a=>!a.isCorrect);
  const msg=pct>=80?"Excellent, mashaa-Allah!":pct>=50?"Good effort — keep going!":"Keep practising, you'll get there.";
  return (
    <div className="fade">
      <Header title="Results" onBack={onClose} />
      <Card style={{ textAlign:"center", padding:28 }}>
        <div style={{ animation:"pop .5s ease both", display:"inline-block" }}><Ring value={pct} size={120} stroke={10} color={th.c} track={th.soft}><span style={{ fontSize:26 }}>{pct}%</span></Ring></div>
        <h2 style={{ fontFamily:"Fraunces, serif", margin:"14px 0 4px", fontSize:22 }}>{msg}</h2>
        <p style={{ margin:0, color:T.ink2 }}>{score} of {total} correct</p>
        {wrong.length>0 && <div style={{ marginTop:12, display:"inline-flex", alignItems:"center", gap:6, background:T.greenSoft, color:T.green, padding:"8px 14px", borderRadius:99, fontSize:13, fontWeight:700 }}><Layers size={15} /> {wrong.length} flashcard{wrong.length>1?"s":""} added for revision</div>}
      </Card>
      {wrong.length>0 && (<>
        <SectionTitle icon={<RotateCcw size={16} color={th.c} />} title="To revise" />
        <div style={{ display:"grid", gap:10 }}>
          {wrong.map((a,i)=>(<Card key={i} style={{ padding:14 }}>
            <p style={{ margin:"0 0 4px", fontSize:14, fontWeight:600 }}>{a.prompt}</p>
            <p style={{ margin:0, fontSize:13.5, color:T.green }}>Answer: <b>{a.type==="true-false"?(a.correctAnswer?"True":"False"):a.type==="match"?a.pairsText:String(a.correctAnswer)}</b></p>
            {a.explanation && <p style={{ margin:"4px 0 0", fontSize:13, color:T.ink2 }}>{a.explanation}</p>}
          </Card>))}
        </div>
      </>)}
      <div style={{ height:16 }} />
      <Btn full color={th.c} onClick={onClose}>Done</Btn>
    </div>
  );
}

/* ===================== FLASHCARDS ===================== */
function buildDeck(state, subjectId, lessonId){
  const map={};
  for(const s of SUBJECTS){ if(subjectId&&s.id!==subjectId) continue;
    for(const l of s.lessons){ if(lessonId&&l.id!==lessonId) continue;
      (l.flashcards||[]).forEach((f,i)=>{ const id="seed-"+l.id+"-"+i; map[id]={ id, front:f.front, back:f.back, subjectId:s.id, lessonId:l.id, seed:true, strength:0, dueAt:0 }; });
    }
  }
  Object.values(state.cards).filter(c=>(!subjectId||c.subjectId===subjectId)&&(!lessonId||c.lessonId===lessonId)).forEach(c=>{ map[c.id]=c; });
  return Object.values(map).sort((a,b)=>(a.dueAt||0)-(b.dueAt||0));
}
function Flashcards({ ctx, subjectId, lessonId }){
  const { state, update, back, recordSession }=ctx;
  const deck=useMemo(()=>buildDeck(state,subjectId,lessonId),[state.cards,subjectId,lessonId]);
  const th=SUBJECT_THEME[subjectId]||{ c:T.green, soft:T.greenSoft };
  const [order]=useState(()=>deck.map(c=>c.id));
  const [idx,setIdx]=useState(0); const [flipped,setFlipped]=useState(false); const [reviewed,setReviewed]=useState(0);
  const liveDeck=order.map(id=>deck.find(c=>c.id===id)).filter(Boolean);
  const card=liveDeck[idx];
  const rate=(result)=>{ update(s=>{ if(card.seed) s.cards[card.id]=scheduleCard({...card,seed:undefined},result); else if(s.cards[card.id]) s.cards[card.id]=scheduleCard(s.cards[card.id],result); else s.cards[card.id]=scheduleCard({...card},result); return s; });
    // Record what the student knows / is still learning / forgot, for teachers.
    logFlashcardReviews([{ cardId:String(card.id), subjectId:card.subjectId||null, lessonId:card.lessonId||null, gradeId:(GRADE&&GRADE.id)||null, front:card.front||null, result }]).catch(()=>{});
    setReviewed(r=>r+1); if(idx+1<liveDeck.length){ setIdx(idx+1); setFlipped(false); } else { recordSession(); setIdx(liveDeck.length); } };

  if(!liveDeck.length) return (<div><Header title="Flashcards" onBack={back} /><Card style={{ textAlign:"center", padding:30 }}><Layers size={34} color={T.faint} /><p style={{ color:T.ink2, marginTop:10 }}>No flashcards here yet. Take a quiz — any question you miss becomes a flashcard automatically.</p></Card></div>);
  if(idx>=liveDeck.length) return (<div className="fade"><Header title="Flashcards" onBack={back} /><Card style={{ textAlign:"center", padding:30 }}><div style={{ animation:"pop .5s ease both" }}><Sparkles size={40} color={th.c} /></div><h2 style={{ fontFamily:"Fraunces, serif", margin:"12px 0 4px" }}>All caught up!</h2><p style={{ color:T.ink2, margin:0 }}>You reviewed {reviewed} card{reviewed!==1?"s":""}. Cards you forgot will come back sooner.</p><Btn color={th.c} style={{ marginTop:16 }} onClick={back}>Back</Btn></Card></div>);

  return (
    <div className="fade">
      <Header title="Flashcards" onBack={back} right={<Pill color={th.c}>{idx+1}/{liveDeck.length}</Pill>} />
      <Bar value={(idx/liveDeck.length)*100} color={th.c} />
      <div onClick={()=>setFlipped(f=>!f)} className={`flashcard ${flipped?'flipping':''} hover-scale`} style={{ marginTop:18, minHeight:280, borderRadius:26, cursor:"pointer", position:"relative", background:flipped?th.c:T.card, border:"1px solid "+(flipped?th.c:T.line), boxShadow:"0 18px 40px -24px rgba(43,58,51,.35)", display:"grid", placeItems:"center", padding:28, transition:"all .3s ease", color:flipped?"#fff":T.ink }}>
        <Pill color={flipped?"#fff":th.c} bg={flipped?"rgba(255,255,255,.18)":th.soft}>{flipped?"Answer":"Question"}</Pill>
        <p style={{ fontFamily:"Fraunces, serif", fontSize:flipped?19:22, textAlign:"center", lineHeight:1.45, margin:"16px 0 0" }}>{flipped?card.back:card.front}</p>
        <span className="pulse" style={{ position:"absolute", bottom:14, fontSize:12, opacity:.6 }}>tap to flip</span>
      </div>
      {flipped ? (
        <div className="slideIn" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:16 }}>
          <Btn kind="ghost" animated style={{ background:"#FBEFEC", border:"none", color:"#C0563B", fontSize:14, padding:"14px 6px" }} onClick={()=>rate("forgot")}>I forgot</Btn>
          <Btn kind="ghost" animated style={{ background:T.paper2, border:"none", color:T.ink2, fontSize:14, padding:"14px 6px" }} onClick={()=>rate("learning")}>Still learning</Btn>
          <Btn color={th.c} animated style={{ fontSize:14, padding:"14px 6px" }} onClick={()=>rate("known")}>I knew this</Btn>
        </div>
      ) : <Btn full color={th.c} animated style={{ marginTop:16 }} onClick={()=>setFlipped(true)}>Show answer</Btn>}
    </div>
  );
}

/* ===================== EXAM SETUP ===================== */
function ExamSetup({ ctx }){
  const { go, back }=ctx;
  const [subject,setSubject]=useState("mixed"); const [count,setCount]=useState(10); const [difficulty,setDifficulty]=useState("mixed");
  const available=useMemo(()=>pickQuestions({ subjectId:subject==="mixed"?null:subject, difficulty },999).length,[subject,difficulty]);
  const n=Math.min(count,available);
  const th=subject==="mixed"?{ c:T.gold, soft:T.gold+"1a" }:SUBJECT_THEME[subject];
  const start=()=>{ const questions=pickQuestions({ subjectId:subject==="mixed"?null:subject, difficulty },count); go({ name:"quiz", config:{ mode:"exam-practice", subjectId:subject==="mixed"?null:subject, title:"Exam Practice", questions } }); };
  const countOpts=[10,20,30,available].filter((x,i,arr)=>arr.indexOf(x)===i).map(x=>({ v:x, l:x===available?"All ("+available+")":String(x) }));
  return (
    <div>
      <Header title="Exam Practice" onBack={back} />
      <Card accent={th.c} style={{ background:th.soft, border:"none", display:"flex", gap:12, alignItems:"center" }}><Trophy size={26} color={th.c} /><p style={{ margin:0, fontSize:14, color:T.ink }}>Build a mixed test from everything you've learned. Mistakes turn into flashcards.</p></Card>
      <FieldLabel>Subject</FieldLabel>
      <Chips value={subject} setValue={setSubject} accent={th.c} options={[{v:"mixed",l:"All subjects"},...SUBJECTS.map(s=>({v:s.id,l:s.name}))]} />
      <FieldLabel>Number of questions</FieldLabel>
      <Chips value={count} setValue={setCount} accent={th.c} options={countOpts} />
      <FieldLabel>Difficulty</FieldLabel>
      <Chips value={difficulty} setValue={setDifficulty} accent={th.c} options={[{v:"mixed",l:"Mixed"},{v:"easy",l:"Easy"},{v:"medium",l:"Medium"},{v:"hard",l:"Hard"}]} />
      <div style={{ height:22 }} />
      <Btn full color={th.c} disabled={n===0} onClick={start}>{n===0?"No questions for this choice":"Start test · "+n+" questions"} {n>0&&<ArrowRight size={18} />}</Btn>
    </div>
  );
}

/* ===================== PLANNER ===================== */
function Planner({ ctx }){
  const { state, update }=ctx;
  const days=state.examDate?Math.max(0,daysBetween(todayKey(),state.examDate)):0;
  return (
    <div>
      <Header title="Revision Plan" />
      <Card style={{ background:T.green, border:"none", color:"#fff" }}>
        <p style={{ margin:0, opacity:.85, fontSize:13, fontWeight:600 }}>Exam date</p>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:6 }}>
          <span style={{ fontFamily:"Fraunces, serif", fontSize:26 }}>{days} days to go</span>
          <input type="date" value={state.examDate||""} onChange={(e)=>update(s=>{ s.examDate=e.target.value; return s; })} style={{ border:"none", borderRadius:10, padding:"8px 10px", fontSize:13, background:"rgba(255,255,255,.9)", color:T.ink }} />
        </div>
        <div style={{ marginTop:12 }}><Bar value={Math.min(100,(state.streak.current/14)*100)} color="#fff" /></div>
        <p style={{ margin:"8px 0 0", fontSize:12.5, opacity:.9 }}>Streak: {state.streak.current} day{state.streak.current!==1?"s":""} · Best {state.streak.best}</p>
      </Card>
      <SectionTitle icon={<Calendar size={16} color={T.green} />} title="Daily plan" />
      <p style={{ margin:"-4px 0 12px", color:T.faint, fontSize:12.5 }}>A gentle two-week rhythm across all five subjects.</p>
      <div className="stagger" style={{ display:"grid", gap:10 }}>
        {Array.from({ length:Math.min(7,Math.max(3,days||7)) }).map((_,d)=>{ const plan=planForDay(state,d); const dk=offsetDayKey(d); const done=(state.sessionsByDay[dk]||0)>0; const th=SUBJECT_THEME[plan.subjectId]||{ c:T.green }; return (
          <Card key={d} accent={th.c} style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:44, textAlign:"center" }}><div style={{ fontSize:11, color:T.faint, fontWeight:700 }}>{d===0?"TODAY":"DAY "+(d+1)}</div></div>
            <div style={{ flex:1 }}><b style={{ fontSize:14.5 }}>{plan.label}</b><p style={{ margin:"2px 0 0", fontSize:12.5, color:T.ink2 }}>{plan.detail}</p></div>
            <div style={{ width:30, height:30, borderRadius:9, display:"grid", placeItems:"center", background:done?T.green:T.line }}>{done&&<Check size={16} color="#fff" />}</div>
          </Card>
        ); })}
      </div>
      <p style={{ color:T.faint, fontSize:12, textAlign:"center", marginTop:16 }}>Complete any quiz or flashcard session to tick off the day.</p>
    </div>
  );
}

/* ===================== PROGRESS ===================== */
const MiniStat = ({ icon, value, label }) => (<Card style={{ padding:14, textAlign:"center" }}><div style={{ display:"grid", placeItems:"center", marginBottom:4 }}>{icon}</div><div style={{ fontFamily:"Fraunces, serif", fontSize:22, fontWeight:600 }}>{value}</div><div style={{ fontSize:11, color:T.ink2 }}>{label}</div></Card>);
function Progress({ ctx }){
  const { state, update, go, onLogout }=ctx; const prog=subjectProgress(state);
  const due=Object.values(state.cards).filter(c=>(c.dueAt||0)<=Date.now()).length;
  const weak=weakTopics(state); const bestScore=Math.max(0,...Object.values(state.best),0);
  return (
    <div>
      <Header title="Your progress" />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
        <MiniStat icon={<Flame size={18} color={T.gold} />} value={state.streak.current} label="day streak" />
        <MiniStat icon={<Trophy size={18} color={T.green} />} value={bestScore+"%"} label="best score" />
        <MiniStat icon={<Layers size={18} color={T.green} />} value={due} label="cards due" />
      </div>
      <SectionTitle icon={<BarChart3 size={16} color={T.green} />} title="Accuracy by subject" />
      <Card><div style={{ display:"grid", gap:14 }}>
        {SUBJECTS.map(s=>{ const th=SUBJECT_THEME[s.id], p=prog[s.id]; return (
          <div key={s.id} onClick={()=>go({name:"subject",subjectId:s.id})} style={{ cursor:"pointer" }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:13.5, marginBottom:6 }}><b>{s.name}</b><span style={{ color:T.ink2 }}>{p.attempted?p.accuracy+"%":"—"}</span></div>
            <Bar value={p.accuracy} color={th.c} />
          </div>
        ); })}
      </div></Card>
      <SectionTitle icon={<Brain size={16} color={T.green} />} title="Weak topics" />
      {weak.length===0 ? <Card style={{ color:T.ink2, fontSize:14 }}>No weak topics yet — take a few quizzes to find what to focus on.</Card> :
        <div style={{ display:"grid", gap:8 }}>{weak.map(w=>{ const th=SUBJECT_THEME[w.subjectId]; return (
          <Card key={w.lessonId} accent={th.c} onClick={()=>go({name:"lesson",lessonId:w.lessonId})} style={{ display:"flex", alignItems:"center", gap:12 }}>
            <Target size={18} color={th.c} /><div style={{ flex:1 }}><b style={{ fontSize:14 }}>{w.title}</b><p style={{ margin:0, fontSize:12, color:T.ink2 }}>{w.missed} missed · {th.name}</p></div><ChevronRight color={T.faint} />
          </Card>
        ); })}</div>}
      <SectionTitle icon={<Clock size={16} color={T.green} />} title="Recent activity" />
      {state.attempts.length===0 ? <Card style={{ color:T.ink2, fontSize:14 }}>Nothing yet — your quizzes and tests will appear here.</Card> :
        <div style={{ display:"grid", gap:8 }}>{state.attempts.slice(0,6).map(a=>{ const pc=Math.round((a.score/a.total)*100); return (
          <Card key={a.id} style={{ display:"flex", alignItems:"center", gap:12, padding:14 }}><Ring value={pc} size={40} color={pc>=60?T.green:T.gold}>{pc}</Ring><div style={{ flex:1 }}><b style={{ fontSize:14 }}>{a.title}</b><p style={{ margin:0, fontSize:12, color:T.ink2 }}>{a.score}/{a.total} · {new Date(a.completedAt).toLocaleDateString()}</p></div></Card>
        ); })}</div>}
      <div style={{ display:"flex", gap:10, marginTop:22 }}>
        <Btn kind="ghost" style={{ flex:1 }} onClick={()=>go({name:"admin"})}><Lock size={16} /> Parent area</Btn>
      </div>
      {onLogout && (
        <div style={{ marginTop:12 }}>
          <Btn 
            kind="ghost" 
            style={{ width:"100%", color:T.green, borderColor:T.green }} 
            onClick={() => { logActivity("logout").catch(()=>{}); logout(); onLogout(); }}
          >
            <LogOut size={16} /> Logout
          </Btn>
        </div>
      )}
    </div>
  );
}

/* ===================== ADMIN ===================== */
function Admin({ ctx }){
  const { state, back, onLogout }=ctx;
  const [unlocked,setUnlocked]=useState(false); const [pin,setPin]=useState(""); const [view,setView]=useState("dash");
  if(!unlocked) return (
    <div className="fade">
      <Header title="Parent / Teacher" onBack={back} />
      <Card style={{ textAlign:"center", padding:28 }}>
        <div style={{ width:64, height:64, borderRadius:20, background:T.greenSoft, display:"grid", placeItems:"center", margin:"0 auto 14px" }}><Lock size={28} color={T.green} /></div>
        <p style={{ color:T.ink2, margin:"0 0 14px" }}>Enter the parent PIN to view progress and manage content.</p>
        <input value={pin} onChange={(e)=>setPin(e.target.value)} placeholder="• • • •" inputMode="numeric" onKeyDown={(e)=>e.key==="Enter"&&pin==="1234"&&setUnlocked(true)} style={{ width:160, textAlign:"center", letterSpacing:8, fontSize:22, padding:"12px", borderRadius:14, border:"1.5px solid "+T.line, background:T.paper }} />
        <Btn full color={T.green} style={{ marginTop:14 }} disabled={pin!=="1234"} onClick={()=>setUnlocked(true)}>Unlock</Btn>
        <p style={{ fontSize:11.5, color:T.faint, marginTop:12 }}>Demo PIN is 1234. This is not real security — replace before production.</p>
      </Card>
    </div>
  );
  return (
    <div>
      <Header title="Parent dashboard" onBack={back} />
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {[["dash","Overview"],["bank","Question bank"],["add","Add question"]].map(([k,l])=>(
          <button key={k} onClick={()=>setView(k)} style={{ flex:1, padding:"10px 6px", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer", border:"1.5px solid "+(view===k?T.green:T.line), background:view===k?T.green:T.card, color:view===k?"#fff":T.ink }}>{l}</button>
        ))}
      </div>
      {view==="dash" && <AdminDash state={state} onLogout={onLogout} />}
      {view==="bank" && <AdminBank state={state} />}
      {view==="add" && <AdminAdd ctx={ctx} />}
    </div>
  );
}
function SimpleBars({ data }){
  return (<div style={{ display:"grid", gap:12, padding:8 }}>{data.map(d=>(
    <div key={d.name}><div style={{ display:"flex", justifyContent:"space-between", fontSize:12.5, marginBottom:5 }}><b>{d.name}</b><span style={{ color:T.ink2 }}>{d.acc}%</span></div>
    <div style={{ background:T.line, borderRadius:99, height:12, overflow:"hidden" }}><div style={{ width:d.acc+"%", height:"100%", background:d.fill, borderRadius:99, transition:"width .6s" }} /></div></div>
  ))}</div>);
}
function AdminDash({ state, onLogout }){
  const prog=subjectProgress(state); const days=state.examDate?Math.max(0,daysBetween(todayKey(),state.examDate)):0;
  const weak=weakTopics(state); const chartData=SUBJECTS.map(s=>({ name:SUBJECT_THEME[s.id].name, acc:prog[s.id].accuracy, fill:SUBJECT_THEME[s.id].c }));
  const insight=buildInsight(state,prog,weak);
  return (
    <div>
      <Card style={{ background:T.green, border:"none", color:"#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ margin:0, opacity:.85, fontSize:13 }}>Student</p>
            <h2 style={{ margin:"2px 0 10px", fontFamily:"Fraunces, serif" }}>{state.profile.name}</h2>
          </div>
          {onLogout && (
            <button
              onClick={() => { logActivity("logout").catch(()=>{}); logout(); onLogout(); }}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "#fff",
                borderRadius: "6px",
                padding: "6px 8px",
                cursor: "pointer",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <LogOut size={14} />
              Logout
            </button>
          )}
        </div>
        <div style={{ display:"flex", gap:18 }}>
          <div><div style={{ fontSize:22, fontFamily:"Fraunces, serif" }}>{days}</div><div style={{ fontSize:11, opacity:.85 }}>days to exam</div></div>
          <div><div style={{ fontSize:22, fontFamily:"Fraunces, serif" }}>{state.completedLessons.length}</div><div style={{ fontSize:11, opacity:.85 }}>lessons done</div></div>
          <div><div style={{ fontSize:22, fontFamily:"Fraunces, serif" }}>{state.attempts.length}</div><div style={{ fontSize:11, opacity:.85 }}>quizzes taken</div></div>
        </div>
      </Card>
      <Card style={{ marginTop:12, background:"#FFFBF0", border:"1px solid "+T.line }}><div style={{ display:"flex", gap:10 }}><Sparkles size={18} color={T.gold} style={{ flexShrink:0, marginTop:2 }} /><p style={{ margin:0, fontSize:14, lineHeight:1.55, color:T.ink }}>{insight}</p></div></Card>
      <SectionTitle icon={<BarChart3 size={16} color={T.green} />} title="Accuracy by subject" />
      <Card style={{ padding:10 }}><SimpleBars data={chartData} /></Card>
      <SectionTitle icon={<Brain size={16} color={T.green} />} title="Weak topics" />
      {weak.length===0 ? <Card style={{ color:T.ink2, fontSize:14 }}>No weak areas detected yet.</Card> :
        <div style={{ display:"grid", gap:8 }}>{weak.map(w=>(
          <Card key={w.lessonId} accent={SUBJECT_THEME[w.subjectId].c} style={{ display:"flex", justifyContent:"space-between", padding:14 }}>
            <div><b style={{ fontSize:14 }}>{w.title}</b><p style={{ margin:0, fontSize:12, color:T.ink2 }}>{SUBJECT_THEME[w.subjectId].name}</p></div><Pill color="#C0563B">{w.missed} missed</Pill>
          </Card>))}
        </div>}
    </div>
  );
}
function BankRow({ q }){
  const [open,setOpen]=useState(false); const th=SUBJECT_THEME[q.subjectId]||{ c:T.green };
  const ans=q.type==="true-false"?(q.correctAnswer?"True":"False"):q.type==="match"?q.pairs.map(p=>p.left+" → "+p.right).join("; "):(q.correctAnswer!=null?q.correctAnswer:(q.acceptedAnswers?q.acceptedAnswers[0]:"—"));
  return (
    <Card onClick={()=>setOpen(!open)} accent={th.c} style={{ padding:14 }}>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}><Pill color={th.c}>{(SUBJECT_THEME[q.subjectId]||{}).name||q.subjectId}</Pill><Pill color={T.faint} bg={T.line}>{labelType(q.type)}</Pill>{q.status&&q.status!=="active"&&<Pill color={T.gold}>{q.status}</Pill>}</div>
      <p style={{ margin:"8px 0 0", fontSize:14, fontWeight:600 }}>{q.prompt}</p>
      {open && <p style={{ margin:"6px 0 0", fontSize:13.5, color:T.green }}>Answer: <b>{ans}</b></p>}
    </Card>
  );
}
function AdminBank({ state }){
  const [subj,setSubj]=useState("all"); const [type,setType]=useState("all");
  const bank=useMemo(()=>[...allBankQuestions(),...(state.customQuestions||[])],[state.customQuestions]);
  const filtered=bank.filter(qq=>(subj==="all"||qq.subjectId===subj)&&(type==="all"||qq.type===type));
  return (
    <div>
      <Card style={{ background:T.paper2, border:"none", fontSize:13, color:T.ink2 }}>{bank.length} questions across {SUBJECTS.length} subjects. Filter, then tap a question to read its answer.</Card>
      <FieldLabel>Subject</FieldLabel>
      <Chips value={subj} setValue={setSubj} accent={T.green} options={[{v:"all",l:"All"},...SUBJECTS.map(s=>({v:s.id,l:s.name}))]} />
      <FieldLabel>Type</FieldLabel>
      <Chips value={type} setValue={setType} accent={T.green} options={[{v:"all",l:"All"},{v:"multiple-choice",l:"MCQ"},{v:"short-answer",l:"Short"},{v:"fill-blank",l:"Fill"},{v:"true-false",l:"T/F"},{v:"match",l:"Match"}]} />
      <div style={{ height:14 }} />
      <div style={{ display:"grid", gap:8 }}>{filtered.map(qq=><BankRow key={qq.id} q={qq} />)}{filtered.length===0&&<Card style={{ color:T.ink2 }}>No questions match.</Card>}</div>
    </div>
  );
}
function AdminAdd({ ctx }){
  const { update }=ctx;
  const [subjectId,setSubjectId]=useState(SUBJECTS[0]?.id); const [type,setType]=useState("multiple-choice");
  const [prompt,setPrompt]=useState(""); const [options,setOptions]=useState(["","","",""]); const [correct,setCorrect]=useState("");
  const [explanation,setExplanation]=useState(""); const [saved,setSaved]=useState(false);
  const canSave=prompt.trim()&&correct.trim()&&(type!=="multiple-choice"||options.filter(o=>o.trim()).length>=2);
  const inp={ width:"100%", padding:"12px 14px", borderRadius:12, border:"1.5px solid "+T.line, fontSize:15, marginTop:6, background:T.card, color:T.ink };
  const save=()=>{ const item={ id:"custom-"+Date.now(), type, subjectId, lessonId:null, difficulty:"medium", prompt:prompt.trim(), explanation:explanation.trim()||undefined, status:"draft", createdBy:"parent" };
    if(type==="multiple-choice"){ item.options=options.map(o=>o.trim()).filter(Boolean); item.correctAnswer=correct.trim(); }
    else if(type==="true-false") item.correctAnswer=/^t|^y|true|yes/i.test(correct.trim());
    else if(type==="fill-blank") item.correctAnswer=correct.trim();
    else item.acceptedAnswers=correct.split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
    update(s=>{ s.customQuestions=[item,...(s.customQuestions||[])]; return s; });
    setSaved(true); setPrompt(""); setOptions(["","","",""]); setCorrect(""); setExplanation(""); setTimeout(()=>setSaved(false),1800);
  };
  return (
    <div>
      <Card style={{ background:T.paper2, border:"none", fontSize:13, color:T.ink2 }}>Add a question to the local bank. It's saved as a <b>draft</b> for review — Islamic content should always be checked by a parent or teacher.</Card>
      <FieldLabel>Subject</FieldLabel>
      <Chips value={subjectId} setValue={setSubjectId} accent={T.green} options={SUBJECTS.map(s=>({v:s.id,l:s.name}))} />
      <FieldLabel>Question type</FieldLabel>
      <Chips value={type} setValue={setType} accent={T.green} options={[{v:"multiple-choice",l:"MCQ"},{v:"true-false",l:"T/F"},{v:"fill-blank",l:"Fill"},{v:"short-answer",l:"Short"}]} />
      <FieldLabel>Question</FieldLabel>
      <textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} rows={2} placeholder="Type the question…" style={inp} />
      {type==="multiple-choice" && (<>
        <FieldLabel>Options (the correct one must match the answer below)</FieldLabel>
        {options.map((o,i)=>(<input key={i} value={o} onChange={(e)=>{ const n=[...options]; n[i]=e.target.value; setOptions(n); }} placeholder={"Option "+(i+1)} style={{ ...inp, marginTop:8 }} />))}
      </>)}
      <FieldLabel>{type==="true-false"?"Correct answer (type true or false)":type==="short-answer"?"Accepted answers (comma separated)":"Correct answer"}</FieldLabel>
      <input value={correct} onChange={(e)=>setCorrect(e.target.value)} placeholder={type==="true-false"?"true":"Type the answer…"} style={inp} />
      <FieldLabel>Explanation (optional)</FieldLabel>
      <textarea value={explanation} onChange={(e)=>setExplanation(e.target.value)} rows={2} placeholder="Shown after answering…" style={inp} />
      <div style={{ height:18 }} />
      <Btn full color={T.green} disabled={!canSave} onClick={save}>{saved?"Saved ✓":"Save question (draft)"}</Btn>
      {saved && <p style={{ textAlign:"center", color:T.green, fontSize:13, marginTop:10 }}>Added to the question bank as a draft for review.</p>}
    </div>
  );
}