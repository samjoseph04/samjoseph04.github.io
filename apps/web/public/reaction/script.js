(() => {
"use strict";

const BEST_KEY="react-best-ms", HISTORY_KEY="react-history", MAX=20;
const colors=["#32e875","#2fc7ff","#ffcf3f","#ff5e87","#a987ff","#ff914d"];
const $=id=>document.getElementById(id);
const game=$("game"), label=$("label"), main=$("main"), sub=$("sub"), bar=$("bar");
const bestEl=$("best"), avgEl=$("avg"), streakEl=$("streak"), attemptsEl=$("attempts"), feedback=$("feedback");

const state={phase:"ready",timer:null,targetAt:0,token:0,attempts:0,streak:0,best:loadBest(),history:loadHistory()};

function loadBest(){const n=Number(localStorage.getItem(BEST_KEY));return n>0&&Number.isFinite(n)?n:null}
function loadHistory(){try{const a=JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]");return Array.isArray(a)?a.filter(n=>n>0&&Number.isFinite(n)).slice(-MAX):[]}catch{return[]}}
function save(){if(state.best)localStorage.setItem(BEST_KEY,state.best);localStorage.setItem(HISTORY_KEY,JSON.stringify(state.history))}
function fmt(ms){return ms==null?"—":`${Math.round(ms)} ms`}
function average(){return state.history.length?state.history.reduce((a,b)=>a+b,0)/state.history.length:null}
function stats(){bestEl.textContent=fmt(state.best);avgEl.textContent=fmt(average());streakEl.textContent=state.streak;attemptsEl.textContent=`${state.attempts} ${state.attempts===1?"attempt":"attempts"}`}
function phase(p,title,subtitle){
  state.phase=p;game.className=`game ${p}`;label.textContent=p==="target"?"NOW!":p==="waiting"?"WAIT FOR IT":p==="soon"?"FALSE START":p==="success"?"REACTION TIME":"READY?";
  main.textContent=title;sub.textContent=subtitle;game.setAttribute("aria-label",subtitle)
}
function delay(){
  const level=Math.min(state.streak,8);
  const min=Math.max(.7,1-level*.04), max=Math.max(2.2,5-level*.25);
  return min+Math.random()*(max-min)
}
function start(){
  if(state.phase==="waiting"||state.phase==="target")return;
  clearTimeout(state.timer);state.token++;const token=state.token,d=delay();
  game.style.setProperty("--delay",`${d}s`);bar.style.animation="none";void bar.offsetWidth;bar.style.animation="";
  phase("waiting","WAIT…","Don't click until the color changes");
  game.style.background="#151922";game.style.color="var(--text)";
  state.timer=setTimeout(()=>{
    if(token!==state.token||state.phase!=="waiting")return;
    game.style.background=colors[Math.floor(Math.random()*colors.length)];
    game.style.color="#07110a";state.targetAt=performance.now();phase("target","CLICK!","As fast as you can");
  },d*1000)
}
function input(e){
  if(e.type==="keydown"){if(![" ","Enter"].includes(e.key))return;e.preventDefault()}
  if(state.phase==="ready"||state.phase==="success"||state.phase==="soon"){start();return}
  if(state.phase==="waiting"){
    clearTimeout(state.timer);state.token++;state.attempts++;state.streak=0;
    phase("soon","TOO SOON!","Wait for the color, then react.");game.style.background="#241117";
    game.style.color="var(--text)";feedback.textContent="False start — reset your focus and go again.";stats();return
  }
  if(state.phase==="target"){
    const ms=performance.now()-state.targetAt;state.attempts++;state.streak++;
    const newBest=!state.best||ms<state.best;if(newBest)state.best=ms;
    state.history.push(ms);if(state.history.length>MAX)state.history.shift();save();
    phase("success",fmt(ms),newBest?"NEW PERSONAL BEST!":"Tap to try again");
    game.style.background="#101c15";game.style.color="var(--text)";
    feedback.textContent=newBest?"🏆 New best! Can you go even faster?":reactionText(ms);stats()
  }
}
function reactionText(ms){if(ms<180)return"Lightning fast.";if(ms<230)return"Excellent reaction.";if(ms<300)return"Very sharp.";if(ms<400)return"Nice reflexes.";if(ms<500)return"Good one. Try to beat it.";return"Solid. Stay ready."}
$("reset").addEventListener("click",e=>{e.stopPropagation();localStorage.removeItem(BEST_KEY);localStorage.removeItem(HISTORY_KEY);state.best=null;state.history=[];state.attempts=0;state.streak=0;state.token++;clearTimeout(state.timer);phase("ready","TAP TO START","Wait for the color to change");game.style.background="#11151c";game.style.color="var(--text)";feedback.textContent="Your best is waiting.";stats()});
game.addEventListener("click",input);
document.addEventListener("keydown",input);
stats();phase("ready","TAP TO START","Wait for the color to change");
})();