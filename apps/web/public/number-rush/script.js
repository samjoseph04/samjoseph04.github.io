const $=id=>document.getElementById(id);

const startScreen=$("startScreen"),gameScreen=$("gameScreen"),grid=$("numberGrid");
const modal=$("gameOver"),startBtn=$("startBtn"),restartBtn=$("restartBtn"),soundBtn=$("soundBtn");
const nextEl=$("next"),scoreEl=$("score"),timeEl=$("time"),bestEl=$("best");
const levelLabel=$("levelLabel"),instruction=$("instruction"),progress=$("progress");
const streakEl=$("streak"),missesEl=$("mistakes"),gridInfo=$("gridInfo"),flash=$("flash");

const BEST_KEY="numberRushBest";
const SOUND_KEY="numberRushSound";

let best=Number(localStorage.getItem(BEST_KEY)||0);
let soundOn=localStorage.getItem(SOUND_KEY)!=="off";
let audio=null, running=false, level=1, score=0, nextNumber=1;
let totalNumbers=9, gridSize=3, streak=0, misses=0, startTime=0, elapsed=0;
let timer=null, roundStart=0, roundLimit=0;

bestEl.textContent=best;
soundBtn.textContent=soundOn?"🔊":"🔇";

function initAudio(){
  if(!soundOn)return;
  try{audio ||= new(window.AudioContext||window.webkitAudioContext)(); if(audio.state==="suspended")audio.resume()}catch{}
}
function beep(freq=600,d=.05,type="sine",vol=.025){
  if(!soundOn)return;
  try{
    initAudio();
    const o=audio.createOscillator(),g=audio.createGain();
    o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,audio.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);
    o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+d);
  }catch{}
}
function flashScreen(type){
  flash.className="";void flash.offsetWidth;flash.className=type;
}
function getGridSize(){
  if(level<3)return 3;
  if(level<6)return 4;
  if(level<10)return 5;
  if(level<15)return 6;
  return 7;
}
function getTimeLimit(){return Math.max(7,18-(level-1)*.45)}
function updateHud(){
  nextEl.textContent=nextNumber;scoreEl.textContent=score;timeEl.textContent=elapsed.toFixed(2);bestEl.textContent=best;
  levelLabel.textContent=`ROUND ${String(level).padStart(2,"0")}`;
  streakEl.textContent=`STREAK ${streak}`;missesEl.textContent=`MISSES ${misses}`;
  gridInfo.textContent=`GRID ${gridSize}×${gridSize}`;
}
function shuffle(a){
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a;
}
function buildRound(){
  gridSize=getGridSize();totalNumbers=gridSize*gridSize;nextNumber=1;
  roundLimit=getTimeLimit();roundStart=performance.now();
  grid.style.setProperty("--cols",gridSize);grid.innerHTML="";
  shuffle(Array.from({length:totalNumbers},(_,i)=>i+1)).forEach(number=>{
    const btn=document.createElement("button");
    btn.className="number";btn.textContent=number;btn.dataset.number=number;
    btn.setAttribute("aria-label",`Number ${number}`);
    btn.addEventListener("pointerdown",handleNumber);grid.appendChild(btn);
  });
  instruction.textContent=`Find number ${nextNumber}`;progress.style.width="0%";updateHud();
}
function updateRoundProgress(){
  if(!running)return;
  progress.style.width=`${Math.min(100,((performance.now()-roundStart)/1000/roundLimit)*100)}%`;
}
function startGame(){
  initAudio();clearInterval(timer);running=true;level=1;score=0;streak=0;misses=0;elapsed=0;
  modal.classList.remove("show");startScreen.classList.add("hidden");gameScreen.classList.remove("hidden");
  buildRound();startTime=performance.now();beep(440,.08,"square",.03);
  timer=setInterval(()=>{
    if(!running)return;
    elapsed=(performance.now()-startTime)/1000;timeEl.textContent=elapsed.toFixed(2);updateRoundProgress();
    if((performance.now()-roundStart)/1000>=roundLimit)endGame("TIME'S UP");
  },16);
}
function handleNumber(event){
  if(!running)return;event.preventDefault();
  const btn=event.currentTarget,value=Number(btn.dataset.number);
  if(value!==nextNumber){
    misses++;streak=0;score=Math.max(0,score-25);
    btn.classList.remove("wrong");void btn.offsetWidth;btn.classList.add("wrong");
    flashScreen("bad");beep(110,.1,"square",.03);updateHud();
    setTimeout(()=>btn.classList.remove("wrong"),230);return;
  }
  btn.classList.add("correct","done");streak++;
  const speed=(performance.now()-roundStart)/1000;
  const points=10+Math.min(50,streak*3)+Math.max(0,Math.round((roundLimit-speed)*5));
  score+=points;nextNumber++;beep(500+Math.min(streak,20)*22,.045,"sine",.025);flashScreen("good");
  if(nextNumber>totalNumbers)finishRound();
  else{instruction.textContent=`Find number ${nextNumber}`;updateHud()}
}
function finishRound(){
  const roundTime=(performance.now()-roundStart)/1000;score+=level*20;
  if(score>best){best=score;localStorage.setItem(BEST_KEY,String(best))}
  level++;beep(850,.08,"sine",.035);setTimeout(()=>beep(1150,.08,"triangle",.025),75);
  instruction.textContent=`CLEAR! ${roundTime.toFixed(2)}s`;updateHud();
  setTimeout(()=>{if(running)buildRound()},500);
}
function endGame(reason="TIME'S UP"){
  if(!running)return;running=false;clearInterval(timer);
  const oldBest=Number(localStorage.getItem(BEST_KEY)||0),isNew=score>oldBest;
  if(score>best){best=score;localStorage.setItem(BEST_KEY,String(best))}
  $("resultTitle").textContent=reason;$("newBest").textContent=isNew?"★ NEW BEST SCORE ★":"";
  $("finalScore").textContent=score;$("finalTime").textContent=`${elapsed.toFixed(2)}s`;
  $("finalBest").textContent=best;$("finalMisses").textContent=misses;
  modal.classList.add("show");flashScreen("bad");beep(120,.18,"sawtooth",.03);
}
startBtn.addEventListener("click",startGame);restartBtn.addEventListener("click",startGame);
soundBtn.addEventListener("click",()=>{soundOn=!soundOn;localStorage.setItem(SOUND_KEY,soundOn?"on":"off");soundBtn.textContent=soundOn?"🔊":"🔇";if(soundOn)beep(650,.06)});
document.addEventListener("keydown",e=>{
  if((e.code==="Space"||e.code==="Enter")&&!running){e.preventDefault();startGame()}
  if(e.code==="Escape"&&running)endGame("GAME ENDED");
});
window.addEventListener("blur",()=>{if(running)endGame("FOCUS LOST")});
updateHud();
