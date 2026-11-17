const $=id=>document.getElementById(id);
const start=$("start"),game=$("game"),board=$("board"),modal=$("modal");
const levelEl=$("level"),scoreEl=$("score"),bestEl=$("best"),livesEl=$("lives");
const phase=$("phase"),instruction=$("instruction"),progress=$("progress");
const mistakesEl=$("mistakes"),patternInfo=$("patternInfo"),soundBtn=$("sound");
const BEST_KEY="memoryGridBest",SOUND_KEY="memoryGridSound";
let level=1,score=0,lives=3,mistakes=0,grid=3,pattern=[],picked=[];
let state="idle",timer=null,progressTimer=null;
let best=Number(localStorage.getItem(BEST_KEY)||0);
let soundOn=localStorage.getItem(SOUND_KEY)!=="off",audio=null;
bestEl.textContent=best;soundBtn.textContent=soundOn?"🔊":"🔇";

function audioInit(){if(!soundOn)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==="suspended")audio.resume()}catch{}}
function beep(f=600,d=.06,type="sine",v=.025){if(!soundOn)return;try{audioInit();let o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(v,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+d)}catch{}}
function hud(){levelEl.textContent=level;scoreEl.textContent=score;bestEl.textContent=best;livesEl.textContent=lives;mistakesEl.textContent=`Mistakes: ${mistakes} / 3`;patternInfo.textContent=`Pattern: ${pattern.length} tiles`}
function flash(c){$("flash").className="";void $("flash").offsetWidth;$("flash").className=c}
function gridSize(){return level<4?3:level<8?4:level<13?5:level<19?6:7}
function patternLength(){return Math.min(3+level,Math.floor(grid*grid*.55))}
function showTime(){return Math.max(700,1250-level*35)}
function gap(){return Math.max(130,250-level*6)}
function build(){grid=gridSize();board.style.setProperty("--cols",grid);board.innerHTML="";for(let i=0;i<grid*grid;i++){let b=document.createElement("button");b.className="tile";b.dataset.i=i;b.setAttribute("aria-label",`Tile ${i+1}`);b.addEventListener("pointerdown",pick);board.appendChild(b)}}
function makePattern(){let a=[];while(a.length<patternLength()){let n=Math.floor(Math.random()*grid*grid);if(!a.includes(n))a.push(n)}return a}
function progressBar(ms){clearInterval(progressTimer);let t=performance.now();progressTimer=setInterval(()=>{let p=Math.min(100,(performance.now()-t)/ms*100);progress.style.width=p+"%";if(p>=100)clearInterval(progressTimer)},16)}
function clear(){board.querySelectorAll(".highlight").forEach(x=>x.classList.remove("highlight"))}
function memorize(){state="memorize";pattern=makePattern();picked=[];phase.textContent="MEMORIZE";instruction.textContent="Remember the glowing tiles...";progress.style.width="0%";hud();clear();pattern.forEach(i=>board.children[i].classList.add("highlight"));beep(500+level*15,.08,"triangle");let ms=showTime()+pattern.length*gap();progressBar(ms);clearTimeout(timer);timer=setTimeout(recall,ms)}
function recall(){clear();state="recall";picked=[];mistakes=0;phase.textContent="RECALL";instruction.textContent="Tap the tiles you remember.";progress.style.width="0%";hud();beep(780,.07)}
function pick(e){if(state!=="recall")return;let tile=e.currentTarget,i=+tile.dataset.i;if(picked.includes(i))return;if(pattern.includes(i)){picked.push(i);tile.classList.add("selected");beep(650+picked.length*35,.05);if(picked.length===pattern.length)correct()}else{mistakes++;lives--;tile.classList.add("wrong");flash("bad");beep(110,.12,"square",.035);hud();setTimeout(()=>tile.classList.remove("wrong"),240);if(lives<=0)end(false)}}
function correct(){state="success";let points=100+level*25+Math.max(0,40-mistakes*8);score+=points;level++;if(score>best){best=score;localStorage.setItem(BEST_KEY,best)}hud();flash("good");beep(900+level*20,.1);setTimeout(()=>beep(1200+level*20,.08,"triangle"),70);phase.textContent="CORRECT";instruction.textContent=`+${points} points • Next pattern`;clearTimeout(timer);timer=setTimeout(()=>{build();memorize()},650)}
function end(won=false){if(state==="gameover")return;state="gameover";clearTimeout(timer);clearInterval(progressTimer);clear();$("resultTitle").textContent=won?"GRID CLEARED":"MEMORY LOST";$("newBest").textContent=score>0&&score>=best?"★ NEW BEST ★":"";$("finalScore").textContent=score;$("finalLevel").textContent=level;$("finalBest").textContent=best;$("finalTiles").textContent=pattern.length;modal.classList.add("show");flash("bad");beep(120,.2,"sawtooth",.03)}
function startGame(){audioInit();clearTimeout(timer);clearInterval(progressTimer);level=1;score=0;lives=3;mistakes=0;pattern=[];picked=[];state="starting";modal.classList.remove("show");start.classList.add("hidden");game.classList.remove("hidden");build();hud();phase.textContent="GET READY";instruction.textContent="The first pattern is coming...";beep(420,.08,"square");timer=setTimeout(memorize,700)}
$("startBtn").addEventListener("click",startGame);$("restartBtn").addEventListener("click",startGame);
soundBtn.addEventListener("click",()=>{soundOn=!soundOn;localStorage.setItem(SOUND_KEY,soundOn?"on":"off");soundBtn.textContent=soundOn?"🔊":"🔇";if(soundOn)beep(650)});
document.addEventListener("keydown",e=>{if((e.code==="Space"||e.code==="Enter")&&state==="idle"){e.preventDefault();startGame()}if(e.code==="Escape"&&state!=="idle"&&state!=="gameover")end()});
window.addEventListener("blur",()=>{if(state!=="idle"&&state!=="gameover")end()});
hud();
