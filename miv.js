/* =====================================
   SELO MIV – FRONTEND CORE
===================================== */

const API = "COLE_AQUI_URL_DO_WEB_APP";
let SESSION = null;
let PLAY_TIMER = null;

async function api(action, payload={}) {
  const r = await fetch(API, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ action, ...payload })
  });
  return r.json();
}

/* LOGIN */
async function login(email, senha) {
  const r = await api("login",{ email, password:senha });
  if (r.success) SESSION = r.data;
  return r;
}

/* PLAYER – 30s */
function startPlay(musicId) {
  clearTimeout(PLAY_TIMER);
  PLAY_TIMER = setTimeout(()=>{
    api("register_play",{ music_id:musicId, user_id:SESSION?.user.id });
  },30000);
}

/* DASHBOARD */
async function dashboard() {
  return api("get_dashboard",{ user_id:SESSION.user.id });
}

/* COMPRA */
async function comprar(musicId, valor) {
  return api("buy",{ user_id:SESSION.user.id, music_id:musicId, valor_total:valor });
}
