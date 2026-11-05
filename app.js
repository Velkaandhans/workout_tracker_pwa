const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
let plan = {};
let activeDay = DAYS[(new Date().getDay()+6)%7];
let deferredInstall = null;
const DB_NAME = "workout-tracker-local", DB_VERSION = 1;
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains("sessions"))db.createObjectStore("sessions",{keyPath:"id",autoIncrement:true});if(!db.objectStoreNames.contains("weights"))db.createObjectStore("weights",{keyPath:"date"});if(!db.objectStoreNames.contains("settings"))db.createObjectStore("settings",{keyPath:"key"});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function store(name,mode="readonly"){const db=await openDB();return db.transaction(name,mode).objectStore(name);}
async function getAll(name){const s=await store(name);return new Promise((res,rej)=>{const r=s.getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function put(name,obj){const s=await store(name,"readwrite");return new Promise((res,rej)=>{const r=s.put(obj);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function delAll(name){const s=await store(name,"readwrite");return new Promise((res,rej)=>{const r=s.clear();r.onsuccess=()=>res();r.onerror=()=>rej(r.error);});}
const today=()=>new Date().toISOString().slice(0,10);
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function tabRender(){document.getElementById("dayTabs").innerHTML=DAYS.map(d=>`<button class="daybtn ${d===activeDay?'active':''}" data-day="${d}">${d.slice(0,3)}</button>`).join("");document.querySelectorAll("[data-day]").forEach(b=>b.onclick=()=>{activeDay=b.dataset.day;tabRender();renderWorkout();});}
function workoutDateKey(day){return `${today()}|${day}`;}
async function renderWorkout(){
 const d=plan[activeDay];const sessions=await getAll("sessions");const prior=sessions.filter(s=>s.day===activeDay).sort((a,b)=>b.timestamp-a.timestamp)[0];
 let html=`<section class="card"><div class="exhead"><div><h2>${activeDay} — ${esc(d.focus)}</h2><p>${esc(d.mode)}</p></div><span class="pill">${activeDay==="Monday"||activeDay==="Tuesday"||activeDay==="Wednesday"?"STRENGTH":"HYPERTROPHY"}</span></div>
 <div class="notice" style="margin-top:12px"><strong>Warm-up:</strong> ${esc(d.warmup)}</div>
 <p class="muted">Enter load and completed reps for each working set. Save the session when finished.</p>`;
 d.exercises.forEach((ex,i)=>{
   const [name,sets,reps,cue]=ex;
   const prev=prior?.entries?.[i];
   html+=`<div class="exercise"><div class="exhead"><h3>${esc(name)}</h3><span class="pres">${sets} × ${esc(reps)}</span></div><div class="cue">${esc(cue)}${prev?` · Previous: ${esc(prev.sets.map(x=>`${x.load||"—"} kg × ${x.reps||"—"}`).join(" / "))}`:""}</div><div class="sethead"><span>SET</span><span>LOAD (kg)</span><span>REPS</span><span>RIR</span></div>`;
   for(let n=1;n<=sets;n++)html+=`<div class="setrow"><span class="setno">${n}</span><div class="field"><input inputmode="decimal" type="number" min="0" step="0.5" placeholder="kg" data-ex="${i}" data-set="${n}" data-field="load"></div><div class="field"><input inputmode="numeric" type="number" min="0" step="1" placeholder="reps" data-ex="${i}" data-set="${n}" data-field="reps"></div><div class="field"><input inputmode="numeric" type="number" min="0" max="10" step="1" placeholder="RIR" data-ex="${i}" data-set="${n}" data-field="rir"></div></div>`;
   html+=`</div>`;
 });
 html+=`<label for="sessionNotes">Session notes / symptoms</label><textarea id="sessionNotes" rows="2" style="width:100%;border:1px solid var(--line);border-radius:9px;padding:10px" placeholder="Technique, energy, pain or modifications..."></textarea><div class="actions"><button id="saveSession">Save workout</button><button class="secondary" id="clearInputs">Clear entries</button></div></section>`;
 document.getElementById("workoutView").innerHTML=html;
 document.getElementById("saveSession").onclick=saveSession;
 document.getElementById("clearInputs").onclick=()=>{document.querySelectorAll("#workoutView input").forEach(x=>x.value="");document.getElementById("sessionNotes").value="";};
}
async function saveSession(){
 const d=plan[activeDay], entries=d.exercises.map((ex,i)=>({exercise:ex[0],sets:[...document.querySelectorAll(`[data-ex="${i}"][data-field="load"]`)].map((el,j)=>({load:el.value,reps:document.querySelector(`[data-ex="${i}"][data-set="${j+1}"][data-field="reps"]`).value,rir:document.querySelector(`[data-ex="${i}"][data-set="${j+1}"][data-field="rir"]`).value}))}));
 const any=entries.some(e=>e.sets.some(s=>s.load!==""||s.reps!==""));
 if(!any){alert("Enter at least one set before saving.");return;}
 await put("sessions",{day:activeDay,date:today(),timestamp:Date.now(),entries,notes:document.getElementById("sessionNotes").value});
 alert("Workout saved on this device.");await renderWorkout();await renderHistory();
}
async function renderHistory(){
 const ss=(await getAll("sessions")).sort((a,b)=>b.timestamp-a.timestamp).slice(0,12);
 document.getElementById("history").innerHTML=ss.length?ss.map(s=>`<div class="historyitem"><strong>${esc(s.day)} · ${esc(s.date)}</strong><div class="muted">${s.entries.filter(e=>e.sets.some(x=>x.load||x.reps)).map(e=>`${esc(e.exercise)}: ${e.sets.filter(x=>x.load||x.reps).map(x=>`${esc(x.load||"—")}kg × ${esc(x.reps||"—")}`).join(", ")}`).join("<br>")}</div>${s.notes?`<div class="muted">Notes: ${esc(s.notes)}</div>`:""}</div>`).join(""):'<div class="empty">No workouts saved yet.</div>';
}
async function renderWeights(){
 const ws=(await getAll("weights")).sort((a,b)=>a.date.localeCompare(b.date));
 const latest=ws.at(-1)?.weight??98, loss=Math.max(0,Math.min(6,98-latest));
 document.getElementById("currentWeight").textContent=Number(latest).toFixed(1);
 document.getElementById("weightProgress").style.width=(loss/6*100)+"%";
 document.getElementById("weightRemaining").textContent=`${Math.max(0,92-latest).toFixed(1)} kg to target · ${loss.toFixed(1)} kg of 6 kg progress`;
 document.getElementById("weightHistory").innerHTML=ws.length?ws.slice().reverse().slice(0,8).map(w=>`<div class="historyitem">${esc(w.date)} <strong style="float:right">${Number(w.weight).toFixed(1)} kg</strong></div>`).join(""):'<div class="empty">No weight entries yet.</div>';
}
async function exportBackup(){
 const data={version:1,exportedAt:new Date().toISOString(),sessions:await getAll("sessions"),weights:await getAll("weights")};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`workout-backup-${today()}.json`;a.click();URL.revokeObjectURL(a.href);
}
async function importBackup(file){
 try{const data=JSON.parse(await file.text());if(!data||!Array.isArray(data.sessions)||!Array.isArray(data.weights))throw new Error("Invalid backup file");for(const x of data.sessions){delete x.id;await put("sessions",x);}for(const x of data.weights)await put("weights",x);await renderHistory();await renderWeights();alert("Backup imported.");}catch(e){alert("Could not import this backup: "+e.message);}
}
async function init(){
 plan=await fetch("workouts.json").then(r=>r.json());tabRender();await renderWorkout();await renderHistory();await renderWeights();
 document.getElementById("weightDate").value=today();
 document.getElementById("saveWeight").onclick=async()=>{const date=document.getElementById("weightDate").value,weight=Number(document.getElementById("weightInput").value);if(!date||!weight||weight<30||weight>300){alert("Enter a valid date and weight.");return;}await put("weights",{date,weight});document.getElementById("weightInput").value="";await renderWeights();};
 document.getElementById("exportBtn").onclick=exportBackup;
 document.getElementById("importFile").onchange=e=>{if(e.target.files[0])importBackup(e.target.files[0]);e.target.value="";};
 document.getElementById("clearBtn").onclick=async()=>{if(confirm("Permanently delete all workout sessions and weight records stored in this browser? Export a backup first if needed.")){await delAll("sessions");await delAll("weights");await renderHistory();await renderWeights();await renderWorkout();}};
 if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;const b=document.getElementById("installBtn");b.hidden=false;b.onclick=async()=>{deferredInstall.prompt();deferredInstall=null;b.hidden=true;};});
init().catch(e=>{document.getElementById("workoutView").innerHTML=`<div class="card">Unable to load workout plan. Refresh while online. ${esc(e.message)}</div>`;});
