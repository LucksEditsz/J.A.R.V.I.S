const menuButton = document.getElementById('menuButton');
const menu = document.getElementById('menu');
const closeMenuButton = document.getElementById('closeMenu');
const scrim = document.getElementById('scrim');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const toast = document.getElementById('toast');
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}
function toggleMenu(force) {
  const open = typeof force === 'boolean' ? force : !menu.classList.contains('open');
  menu.classList.toggle('open', open); scrim.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-hidden', String(!open));
}
function openModal(title, html) {
  modalTitle.textContent = title; modalBody.innerHTML = html;
  modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); toggleMenu(false);
}
function closeModal() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

menuButton.addEventListener('click', () => toggleMenu());
closeMenuButton.addEventListener('click', () => toggleMenu(false));
scrim.addEventListener('click', () => toggleMenu(false));
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { toggleMenu(false); closeModal(); } });

document.querySelectorAll('.menu-item').forEach(button => button.addEventListener('click', () => {
  const action = button.dataset.action; if (actions[action]) actions[action]();
}));


/* ================= HORÁRIO E DATA LOCAIS ================= */
function updateLocalDateTime() {
  const now = new Date();
  const clock = document.getElementById('clock');
  const date = document.getElementById('date');
  const ageDisplay = document.getElementById('ageDisplay');

  if (clock) {
    clock.textContent = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  if (date) {
    date.textContent = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  if (ageDisplay) {
    const birth = new Date(2013, 0, 14);
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      const previousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += previousMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    ageDisplay.textContent = `${years} ANOS, ${months} MESES E ${days} DIAS`;
  }
}
updateLocalDateTime();
setInterval(updateLocalDateTime, 1000);

/* ================= ALARME ================= */
let alarmTimer = null;
function showAlarm() {
  openModal('ALARME', `<p class="empty">Defina um horário. O alarme funciona enquanto esta página estiver aberta.</p>
    <div class="field"><label for="alarmTime">Horário</label><input id="alarmTime" type="time"></div>
    <button class="action-button" id="setAlarm">⏰ Ativar alarme</button>
    <button class="action-button" id="cancelAlarm">■ Cancelar</button>
    <div id="alarmStatus" class="note"></div>`);
  const status = document.getElementById('alarmStatus');
  document.getElementById('setAlarm').onclick = () => {
    const value = document.getElementById('alarmTime').value;
    if (!value) return showToast('Escolha um horário.');
    clearTimeout(alarmTimer);
    const [h,m] = value.split(':').map(Number); const now = new Date(); const target = new Date();
    target.setHours(h,m,0,0); if (target <= now) target.setDate(target.getDate()+1);
    alarmTimer = setTimeout(() => { alert('J.A.R.V.I.S. — ALARME'); showToast('Alarme disparado.'); }, target-now);
    status.textContent = `Alarme programado para ${value}.`;
  };
  document.getElementById('cancelAlarm').onclick = () => { clearTimeout(alarmTimer); status.textContent='Alarme cancelado.'; };
}

/* ================= BLOCO DE NOTAS ================= */
const NOTES_KEY = 'jarvis_notes_v1';
function showNotes() {
  const saved = localStorage.getItem(NOTES_KEY) || '';
  openModal('BLOCO DE NOTAS', `<textarea class="notes-area" id="notesArea" placeholder="Digite suas anotações...">${escapeHtml(saved)}</textarea>
    <button class="action-button" id="saveNotes">💾 Salvar</button><button class="action-button" id="clearNotes">Limpar</button>`);
  document.getElementById('saveNotes').onclick = () => { localStorage.setItem(NOTES_KEY, document.getElementById('notesArea').value); showToast('Anotações salvas.'); };
  document.getElementById('clearNotes').onclick = () => { document.getElementById('notesArea').value=''; localStorage.removeItem(NOTES_KEY); showToast('Bloco de notas limpo.'); };
}

/* ================= CALCULADORA ================= */
function showCalculator() {
  openModal('CALCULADORA', `<input class="calc-display" id="calcDisplay" value="0" readonly><div class="calc" id="calcKeys">${['C','⌫','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','±','0','.','='].map(k => `<button type="button" data-key="${k}">${k}</button>`).join('')}</div>`);
  const display=document.getElementById('calcDisplay'); let expression='';
  document.getElementById('calcKeys').onclick=e=>{ const key=e.target.dataset.key;if(!key)return;
    if(key==='C'){expression='';display.value='0';return} if(key==='⌫'){expression=expression.slice(0,-1);display.value=expression||'0';return}
    if(key==='='){try{const n=expression.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/%/g,'/100');if(!/^[0-9+\-*/().\s]+$/.test(n)||!n.trim())throw 0;const r=Function(`"use strict";return (${n})`)();if(!Number.isFinite(r))throw 0;expression=String(Number(r.toPrecision(12)));display.value=expression}catch{display.value='ERRO';expression=''}return}
    if(key==='±'){expression=expression.startsWith('-')?expression.slice(1):'-'+expression;display.value=expression||'0';return} expression+=key;display.value=expression;
  };
}

/* ================= CALENDÁRIO ================= */
const MEETINGS_KEY='jarvis_meetings_v2';
function getMeetings(){try{return JSON.parse(localStorage.getItem(MEETINGS_KEY)||'[]')}catch{return[]}}
function saveMeetings(x){localStorage.setItem(MEETINGS_KEY,JSON.stringify(x))}
function formatDate(v){if(!v)return'';const [y,m,d]=v.split('-');return `${d}/${m}/${y}`}
function showMeetingForm(existing=null){
  openModal(existing?'EDITAR REUNIÃO':'MARCAR REUNIÃO', `<form id="meetingForm">
  <div class="field"><label>Título</label><input id="meetingName" required maxlength="90" value="${escapeHtml(existing?.name||'')}" placeholder="Ex.: Reunião de projeto"></div>
  <div class="field"><label>Data</label><input id="meetingDate" type="date" required value="${existing?.date||''}"></div>
  <div class="field"><label>Horário</label><input id="meetingTime" type="time" required value="${existing?.time||''}"></div>
  <div class="field"><label>Observações</label><textarea id="meetingNotes" rows="3">${escapeHtml(existing?.notes||'')}</textarea></div>
  <button class="action-button" type="submit">＋ Salvar reunião</button><button class="action-button" type="button" id="backCalendar">Voltar</button></form>`);
  document.getElementById('backCalendar').onclick=showCalendar;
  document.getElementById('meetingForm').onsubmit=e=>{e.preventDefault();const item={id:existing?.id||Date.now().toString(),name:document.getElementById('meetingName').value.trim(),date:document.getElementById('meetingDate').value,time:document.getElementById('meetingTime').value,notes:document.getElementById('meetingNotes').value.trim()};const list=getMeetings();const i=list.findIndex(x=>x.id===item.id);if(i>=0)list[i]=item;else list.push(item);list.sort((a,b)=>`${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));saveMeetings(list);showCalendar();showToast('Reunião salva.');};
}
function showCalendar(){const list=getMeetings();const rows=list.length?list.map(x=>`<div class="event-row"><div><strong>${escapeHtml(x.name)}</strong><small>${formatDate(x.date)} • ${escapeHtml(x.time)}${x.notes?'<br>'+escapeHtml(x.notes):''}</small></div><div><button data-edit="${x.id}">Editar</button><button data-del="${x.id}">×</button></div></div>`).join(''):'<p class="empty">Nenhuma reunião cadastrada.</p>';openModal('CALENDÁRIO',`<button class="action-button" id="addMeeting">＋ Adicionar reunião</button><div class="events">${rows}</div>`);document.getElementById('addMeeting').onclick=()=>showMeetingForm();modalBody.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>showMeetingForm(getMeetings().find(x=>x.id===b.dataset.edit)));modalBody.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{saveMeetings(getMeetings().filter(x=>x.id!==b.dataset.del));showCalendar()})}

/* ================= CÂMERA ================= */
let cameraStream=null;
function showCamera(){openModal('CÂMERA', `<video id="cameraVideo" class="camera-video" autoplay playsinline></video><div><button class="action-button" id="startCamera">▶ Iniciar câmera</button><button class="action-button" id="stopCamera">■ Parar</button></div><p class="note">O navegador pedirá permissão para usar a câmera.</p>`);document.getElementById('startCamera').onclick=async()=>{try{cameraStream=await navigator.mediaDevices.getUserMedia({video:true,audio:false});document.getElementById('cameraVideo').srcObject=cameraStream}catch(e){showToast('Não foi possível acessar a câmera.')};};document.getElementById('stopCamera').onclick=stopCamera;}
function stopCamera(){if(cameraStream){cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null}const v=document.getElementById('cameraVideo');if(v)v.srcObject=null}

/* ================= CLIMA ================= */
function showWeather(){openModal('CLIMA', `<p class="empty">O J.A.R.V.I.S. pode consultar o clima usando a localização autorizada pelo seu navegador.</p><button class="action-button" id="getWeather">☁ Consultar clima</button><div id="weatherResult" class="weather-result"></div>`);document.getElementById('getWeather').onclick=loadWeather}
async function loadWeather(){const box=document.getElementById('weatherResult');box.textContent='Obtendo localização...';if(!navigator.geolocation)return box.textContent='Geolocalização não disponível neste navegador.';navigator.geolocation.getCurrentPosition(async pos=>{try{const {latitude,longitude}=pos.coords;const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`);const d=await r.json();const c=d.current;box.innerHTML=`<div class="stat-card"><b>${c.temperature_2m}°C</b><span>Temperatura</span></div><div class="stat-card"><b>${c.relative_humidity_2m}%</b><span>Umidade</span></div><div class="stat-card"><b>${c.wind_speed_10m} km/h</b><span>Vento</span></div><p class="note">Dados meteorológicos obtidos online. Código do tempo: ${c.weather_code}.</p>`}catch{box.textContent='Não foi possível consultar o clima agora.'}},()=>box.textContent='Permissão de localização negada ou indisponível.')}

/* ================= CRONÔMETRO ================= */
let stopwatchInterval=null, stopwatchStart=0, stopwatchElapsed=0;
function showStopwatch(){openModal('CRONÔMETRO', `<div class="stopwatch" id="stopwatchDisplay">00:00:00.00</div><button class="action-button" id="swStart">▶ Iniciar</button><button class="action-button" id="swPause">Ⅱ Pausar</button><button class="action-button" id="swReset">↺ Zerar</button>`);const display=document.getElementById('stopwatchDisplay');const render=()=>{const ms=stopwatchElapsed+(stopwatchInterval?Date.now()-stopwatchStart:0);const h=Math.floor(ms/3600000),m=Math.floor(ms/60000)%60,s=Math.floor(ms/1000)%60,cs=Math.floor(ms/10)%100;display.textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`};document.getElementById('swStart').onclick=()=>{if(stopwatchInterval)return;stopwatchStart=Date.now();stopwatchInterval=setInterval(render,30)};document.getElementById('swPause').onclick=()=>{if(!stopwatchInterval)return;stopwatchElapsed+=Date.now()-stopwatchStart;clearInterval(stopwatchInterval);stopwatchInterval=null;render()};document.getElementById('swReset').onclick=()=>{clearInterval(stopwatchInterval);stopwatchInterval=null;stopwatchElapsed=0;render()};render()}

/* ================= JOGOS ================= */
async function iniciarJogoWindows(id) {
  if (!window.jarvis || typeof window.jarvis.launchGame !== 'function') {
    showToast('Os jogos .EXE precisam da versão Windows do J.A.R.V.I.S.');
    return;
  }
  const resultado = await window.jarvis.launchGame(id);
  if (resultado && resultado.ok) {
    showToast('Jogo iniciado.');
    closeModal();
  } else {
    showToast(resultado?.message || 'Não foi possível iniciar o jogo.');
  }
}

function showGames(){
  openModal('JOGOS', `
    <div class="game-grid">
      <div class="game-card"><div class="game-icon">🎮</div><b>GTA San Andreas</b><small>Windows • GTA_San_Andreas.exe</small><button class="game-start" data-game="gta_sa">▶ INICIAR</button></div>
      <div class="game-card"><div class="game-icon">🏎️</div><b>F1 2016</b><small>Windows • F1_2016.exe</small><button class="game-start" data-game="f1_2016">▶ INICIAR</button></div>
      <div class="game-card"><div class="game-icon">⚽</div><b>PES 6</b><small>Windows • PES_6.exe</small><button class="game-start" data-game="pes6">▶ INICIAR</button></div>
      <div class="game-card"><div class="game-icon">🚗</div><b>GTA Vice City</b><small>Windows • GTA_Vice_City.exe</small><button class="game-start" data-game="gta_vc">▶ INICIAR</button></div>
      <div class="game-card"><div class="game-icon">⚽</div><b>PES 2018</b><small>Windows • PES_2018.exe</small><button class="game-start" data-game="pes2018">▶ INICIAR</button></div>
      <div class="game-card"><div class="game-icon">⚽</div><b>FIFA 15</b><small>Windows • FIFA_15.exe</small><button class="game-start" data-game="fifa15">▶ INICIAR</button></div>
    </div>
    <div class="game-result">Selecione um jogo e pressione <b>INICIAR</b> para abrir o .EXE no Windows.</div>
  `);
  modalBody.querySelectorAll('.game-start').forEach(button => {
    button.onclick = () => iniciarJogoWindows(button.dataset.game);
  });
}

/* ================= MENSAGENS ================= */
function showMessages(){openModal('LER MENSAGENS', `<p class="empty">O navegador não consegue ler mensagens privadas de Instagram, WhatsApp ou outros aplicativos sem uma integração oficial e autorização.</p><div class="message-links"><a class="action-button" href="https://www.instagram.com/direct/inbox/" target="_blank" rel="noopener">Instagram Direct</a><a class="action-button" href="https://web.whatsapp.com/" target="_blank" rel="noopener">WhatsApp Web</a></div><p class="note">Esses botões abrem as mensagens para você visualizar diretamente no serviço.</p>`)}

/* ================= LIGAÇÕES ================= */
function showCall(){openModal('LIGAÇÕES', `<p class="empty">Digite um número para abrir o aplicativo de telefone do dispositivo.</p><form id="callForm"><div class="field"><label>Número</label><input id="phoneNumber" type="tel" placeholder="+55 (DDD) número" required></div><button class="action-button">☎ Ligar</button></form>`);document.getElementById('callForm').onsubmit=e=>{e.preventDefault();const n=document.getElementById('phoneNumber').value.replace(/[^\d+]/g,'');if(n)location.href=`tel:${n}`}}

/* ================= ÁGUA ================= */
const WATER_KEY='jarvis_water_v1';
function showWater(){const today=new Date().toISOString().slice(0,10);let data;try{data=JSON.parse(localStorage.getItem(WATER_KEY)||'{}')}catch{data={}};if(data.date!==today)data={date:today,ml:0};openModal('MONITOR DE INGESTÃO DE ÁGUA', `<div class="water-total"><b id="waterTotal">${data.ml}</b><span>ml registrados hoje</span></div><div class="water-actions"><button class="action-button" data-ml="200">+200 ml</button><button class="action-button" data-ml="300">+300 ml</button><button class="action-button" data-ml="500">+500 ml</button><button class="action-button" id="waterReset">Zerar</button></div><p class="note">Registro simples para acompanhar sua hidratação; não é uma orientação médica.</p>`);const update=()=>{document.getElementById('waterTotal').textContent=data.ml;localStorage.setItem(WATER_KEY,JSON.stringify(data))};modalBody.querySelectorAll('[data-ml]').forEach(b=>b.onclick=()=>{data.ml+=Number(b.dataset.ml);update()});document.getElementById('waterReset').onclick=()=>{data.ml=0;update()}}

/* ================= MÚSICA ================= */
let currentAudio=null;
function showMusic(){openModal('MÚSICA', `<p class="empty">Pause ou troque a música. Se os arquivos estiverem na pasta do projeto, selecione uma faixa abaixo.</p><div class="field"><label>Faixa</label><select id="trackSelect"><option value="musica-entrada.mp3">Música de entrada</option><option value="musica-2.mp3">Música 2</option></select></div><button class="action-button" id="musicPlay">▶ Tocar / trocar</button><button class="action-button" id="musicPause">Ⅱ Pausar</button><div class="field"><label>Ou escolha um arquivo de áudio do computador</label><input id="musicFile" type="file" accept="audio/*"></div>`);const select=document.getElementById('trackSelect');const file=document.getElementById('musicFile');document.getElementById('musicPlay').onclick=()=>playAudio(select.value);document.getElementById('musicPause').onclick=()=>{if(currentAudio){currentAudio.pause();showToast('Música pausada.')}};file.onchange=()=>{if(file.files[0])playAudio(URL.createObjectURL(file.files[0]))}}
function playAudio(src){if(currentAudio){currentAudio.pause();currentAudio=null}currentAudio=new Audio(src);currentAudio.loop=true;currentAudio.play().then(()=>showToast('Música reproduzindo.')).catch(()=>showToast('Não foi possível tocar. Confira o arquivo.'))}

/* ================= PROBABILIDADE E ESTATÍSTICAS ================= */
function showStats(){openModal('PROBABILIDADE E ESTATÍSTICAS', `<div class="field"><label>Probabilidade — casos favoráveis</label><input id="fav" type="number" min="0" value="1"></div><div class="field"><label>Casos possíveis</label><input id="possible" type="number" min="1" value="2"></div><button class="action-button" id="probCalc">Calcular probabilidade</button><hr class="separator"><div class="field"><label>Valores para estatística (separe por vírgula)</label><textarea id="statsValues" rows="3" placeholder="10, 12, 15, 20"></textarea></div><button class="action-button" id="statsCalc">Calcular média, mediana e desvio</button><div id="statsResult" class="stats-result"></div>`);document.getElementById('probCalc').onclick=()=>{const a=Number(document.getElementById('fav').value),b=Number(document.getElementById('possible').value);document.getElementById('statsResult').innerHTML=`Probabilidade: <strong>${b>0?(a/b*100).toFixed(2):0}%</strong>`};document.getElementById('statsCalc').onclick=()=>{const v=document.getElementById('statsValues').value.split(',').map(Number).filter(Number.isFinite);if(!v.length)return document.getElementById('statsResult').textContent='Digite pelo menos um valor.';v.sort((a,b)=>a-b);const mean=v.reduce((a,b)=>a+b,0)/v.length;const med=v.length%2?v[(v.length-1)/2]:(v[v.length/2-1]+v[v.length/2])/2;const variance=v.reduce((s,x)=>s+(x-mean)**2,0)/v.length;document.getElementById('statsResult').innerHTML=`Quantidade: <strong>${v.length}</strong><br>Média: <strong>${mean.toFixed(2)}</strong><br>Mediana: <strong>${med.toFixed(2)}</strong><br>Desvio padrão: <strong>${Math.sqrt(variance).toFixed(2)}</strong>`}}

/* ================= TABELAS ESPORTIVAS ================= */
function showGPS(){
  openModal('GPS / LOCALIZAÇÃO', `
    <div class="gps-status" id="gpsStatus">Aguardando localização...</div>
    <div class="gps-grid">
      <div><span>LATITUDE</span><strong id="gpsLat">--</strong></div>
      <div><span>LONGITUDE</span><strong id="gpsLon">--</strong></div>
      <div><span>PRECISÃO</span><strong id="gpsAccuracy">--</strong></div>
    </div>
    <button class="action-button" id="gpsUpdate">📍 Atualizar localização</button>
    <p class="note">O J.A.R.V.I.S. usa a permissão de localização do dispositivo. A localização não é enviada para o Google.</p>
  `);
  const status=document.getElementById('gpsStatus');
  const lat=document.getElementById('gpsLat');
  const lon=document.getElementById('gpsLon');
  const accuracy=document.getElementById('gpsAccuracy');
  const atualizar=()=>{
    if(!navigator.geolocation){status.textContent='GPS não disponível neste dispositivo.';return;}
    status.textContent='Obtendo localização...';
    navigator.geolocation.getCurrentPosition(pos=>{
      lat.textContent=pos.coords.latitude.toFixed(6);
      lon.textContent=pos.coords.longitude.toFixed(6);
      accuracy.textContent=Math.round(pos.coords.accuracy)+' m';
      status.textContent='LOCALIZAÇÃO OBTIDA • GPS ONLINE';
    },err=>{
      const msg={1:'Permissão de localização negada.',2:'Localização indisponível.',3:'Tempo esgotado ao obter localização.'}[err.code]||'Não foi possível obter a localização.';
      status.textContent=msg;
    },{enableHighAccuracy:true,timeout:15000,maximumAge:0});
  };
  document.getElementById('gpsUpdate').onclick=atualizar;
  atualizar();
}

function showSports(){
  const competitions=[
    ['🇧🇷 Brasileirão Série A','brasileirao serie a 2026'],
    ['🇧🇷 Brasileirão Série B','brasileirao serie b 2026'],
    ['🏆 Champions League','champions league 2026 2027'],
    ['🏆 Europa League','europa league 2026 2027'],
    ['🌍 Nations League','uefa nations league 2026'],
    ['🏎️ F1 — Construtores','formula 1 2026 construtores classificacao'],
    ['🏎️ F1 — Pilotos','formula 1 2026 pilotos classificacao'],
    ['🏴 Premier League','premier league 2026 2027'],
    ['🇮🇹 Serie A Italiana','serie a italiana 2026 2027'],
    ['🇩🇪 Bundesliga','bundesliga 2026 2027'],
    ['🇪🇸 LaLiga','laliga 2026 2027'],
    ['🌎 Libertadores','libertadores 2026'],
    ['🌎 Sul-Americana','sul americana 2026']
  ];
  const cards=competitions.map(([name,q])=>{
    const base=encodeURIComponent(q);
    const table=`https://www.google.com/search?q=${encodeURIComponent('tabela classificação '+q)}`;
    const games=`https://www.google.com/search?q=${encodeURIComponent('jogos próximos '+q)}`;
    const results=`https://www.google.com/search?q=${encodeURIComponent('resultados '+q)}`;
    return `<div class="sports-card sports-card-large"><strong>${name}</strong><small>Classificação • jogos • resultados</small><div class="sports-actions"><a href="${table}" target="_blank" rel="noopener">CLASSIFICAÇÃO</a><a href="${games}" target="_blank" rel="noopener">JOGOS</a><a href="${results}" target="_blank" rel="noopener">RESULTADOS</a></div></div>`;
  }).join('');
  openModal('TABELAS ESPORTIVAS', `<div class="sports-grid">${cards}</div><p class="note">Escolha uma competição e consulte classificação, próximos jogos ou resultados. Os dados são consultados online.</p>`);
}

const actions={alarm:showAlarm,notes:showNotes,calculator:showCalculator,calendar:showCalendar,camera:showCamera,weather:showWeather,stopwatch:showStopwatch,games:showGames,messages:showMessages,call:showCall,water:showWater,music:showMusic,stats:showStats,sports:showSports,gps:showGPS};
window.addEventListener('beforeunload',stopCamera);

/* ================= VOZ + IDADE ================= */
(function(){
  const input=document.getElementById('userInput');
  const send=document.getElementById('sendButton');
  const mic=document.getElementById('micButton');
  const chat=document.getElementById('chat');
  const status=document.getElementById('voiceStatus');
  const age=document.getElementById('ageDisplay');

  function addMessage(text, type='user'){
    const box=document.createElement('div'); box.className='message '+(type==='jarvis'?'jarvis-message':'user-message');
    box.innerHTML='<span>'+ (type==='jarvis'?'J.A.R.V.I.S.':'LUCAS SILVA') +'</span><p>'+escapeHtml(text)+'</p>';
    chat.appendChild(box); chat.scrollTop=chat.scrollHeight;
  }
  function processCommand(text){
    const t=text.toLowerCase();
    if(t.includes('hora')) return new Date().toLocaleTimeString('pt-BR');
    if(t.includes('data')) return new Date().toLocaleDateString('pt-BR');
    if(t.includes('instagram')) { window.open('https://www.instagram.com/lucassilva._14/','_blank'); return 'Abrindo seu Instagram.'; }
    if(t.includes('mensagem')) { window.open('https://www.instagram.com/direct/inbox/','_blank'); return 'Abrindo suas mensagens do Instagram.'; }
    if(t.includes('youtube')) { window.open('https://www.youtube.com/','_blank'); return 'Abrindo o YouTube.'; }
    if(t.includes('google')) { window.open('https://www.google.com/','_blank'); return 'Abrindo o Google.'; }
    return 'Comando recebido. Estou pronto para executar essa função pelo menu.';
  }
  function enviar(){const text=input.value.trim();if(!text)return;addMessage(text,'user');input.value='';setTimeout(()=>addMessage(processCommand(text),'jarvis'),250)}
  send.addEventListener('click',enviar); input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();enviar()}});

  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(SR){
    const rec=new SR(); rec.lang='pt-BR'; rec.interimResults=false; rec.continuous=false;
    rec.onstart=()=>{status.textContent='VOICE ONLINE • OUVINDO...';mic.classList.add('active')};
    rec.onend=()=>{status.textContent='VOICE ONLINE • READY';mic.classList.remove('active')};
    rec.onerror=()=>{status.textContent='VOICE ONLINE • ERRO NO MICROFONE';mic.classList.remove('active')};
    rec.onresult=e=>{input.value=e.results[0][0].transcript;enviar()};
    mic.addEventListener('click',()=>{try{rec.start()}catch{}});
  }else{mic.addEventListener('click',()=>showToast('Reconhecimento de voz não é suportado neste navegador.'))}

  function calcAge(){
    const birth=new Date(2013,0,14); const now=new Date(); let y=now.getFullYear()-birth.getFullYear(); let m=now.getMonth()-birth.getMonth(); let d=now.getDate()-birth.getDate();
    if(d<0){m--; d+=new Date(now.getFullYear(),now.getMonth(),0).getDate();} if(m<0){y--;m+=12;}
    if(age) age.textContent=`${y} ANOS, ${m} MESES E ${d} DIAS`;
  }
  calcAge();
})();
