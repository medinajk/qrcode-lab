/**
 * database.js
 * Camada de persistência do sistema de acesso.
 *
 * Padrão: salva em JSON local, para continuar funcionando em laboratório.
 * Nuvem: se FIREBASE_SERVICE_ACCOUNT, GOOGLE_APPLICATION_CREDENTIALS ou
 * FIREBASE_SERVICE_ACCOUNT_BASE64 estiver configurado, salva no Firestore.
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "registros.json");

let firestore = null;

function firebaseAtivo() {
  return !!(
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
  );
}

function carregarServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf-8");
    return JSON.parse(json);
  }

  const servicePath = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!servicePath) return null;

  return JSON.parse(fs.readFileSync(servicePath, "utf-8"));
}

function getFirestore() {
  if (!firebaseAtivo()) return null;
  if (firestore) return firestore;

  const admin = require("firebase-admin");
  const serviceAccount = carregarServiceAccount();

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  firestore = admin.firestore();
  return firestore;
}

function storageMode() {
  return firebaseAtivo() ? "firebase-firestore" : "json-local";
}

function initLocal() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ registros: [], ativos: {} }, null, 2));
  }
}

function lerDadosLocal() {
  initLocal();
  try {
    const conteudo = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(conteudo);
  } catch {
    return { registros: [], ativos: {} };
  }
}

function salvarDadosLocal(dados) {
  initLocal();
  fs.writeFileSync(DATA_FILE, JSON.stringify(dados, null, 2));
}

/**
 * Registra a ENTRADA de um aluno.
 * @param {string} ra - RA de 6 dígitos do aluno
 * @returns {{ ok: boolean, mensagem: string, registro?: object }}
 */
async function registrarEntrada(ra) {
  const db = getFirestore();
  if (db) return registrarEntradaFirebase(db, ra);

  const dados = lerDadosLocal();

  if (dados.ativos[ra]) {
    return { ok: false, mensagem: `RA ${ra} já está no laboratório. Escaneie para registrar saída.` };
  }

  const agora = new Date();
  const id    = `${agora.getTime()}_${ra}`;

  const registro = {
    id,
    ra,
    entrada:    agora.toISOString(),
    saida:      null,
    duracao_ms: null,
    duracao_fmt: null,
  };

  dados.registros.push(registro);
  dados.ativos[ra] = { id, entrada_ts: agora.getTime() };

  salvarDadosLocal(dados);

  return { ok: true, tipo: "entrada", mensagem: "Entrada registrada com sucesso.", registro };
}

/**
 * Registra a SAÍDA de um aluno.
 * @param {string} ra - RA de 6 dígitos do aluno
 * @returns {{ ok: boolean, mensagem: string, registro?: object }}
 */
async function registrarSaida(ra) {
  const db = getFirestore();
  if (db) return registrarSaidaFirebase(db, ra);

  const dados = lerDadosLocal();

  if (!dados.ativos[ra]) {
    return { ok: false, mensagem: `RA ${ra} não possui entrada registrada. Escaneie para registrar entrada.` };
  }

  const ativo     = dados.ativos[ra];
  const agora     = new Date();
  const duracao   = agora.getTime() - ativo.entrada_ts;

  const idx = dados.registros.findIndex(r => r.id === ativo.id);
  if (idx !== -1) {
    dados.registros[idx].saida       = agora.toISOString();
    dados.registros[idx].duracao_ms  = duracao;
    dados.registros[idx].duracao_fmt = formatarDuracao(duracao);
  }

  delete dados.ativos[ra];
  salvarDadosLocal(dados);

  return {
    ok: true,
    tipo: "saida",
    mensagem: "Saída registrada com sucesso.",
    registro: dados.registros[idx],
  };
}

/**
 * Retorna todos os registros, do mais recente ao mais antigo.
 */
async function listarRegistros() {
  const db = getFirestore();
  if (db) return listarRegistrosFirebase(db);

  const dados = lerDadosLocal();
  return [...dados.registros].reverse();
}

/**
 * Retorna apenas os alunos atualmente no laboratório.
 */
async function listarAtivos() {
  const db = getFirestore();
  if (db) return listarAtivosFirebase(db);

  const dados = lerDadosLocal();
  return dados.ativos;
}

/**
 * Remove todos os registros e limpa os ativos.
 */
async function limparTudo() {
  const db = getFirestore();
  if (db) return limparTudoFirebase(db);

  salvarDadosLocal({ registros: [], ativos: {} });
}

// Utilitário: formata milissegundos em "Xh Ymin Zs"
function formatarDuracao(ms) {
  const s  = Math.floor(ms / 1000);
  const m  = Math.floor(s / 60);
  const sg = s % 60;
  if (m < 60) return `${m}min ${String(sg).padStart(2, "0")}s`;
  const h  = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${String(rm).padStart(2, "0")}min`;
}

async function registrarEntradaFirebase(db, ra) {
  const ativoRef = db.collection("ativos").doc(ra);
  const ativoSnap = await ativoRef.get();

  if (ativoSnap.exists) {
    return { ok: false, mensagem: `RA ${ra} já está no laboratório. Escaneie para registrar saída.` };
  }

  const agora = new Date();
  const id = `${agora.getTime()}_${ra}`;
  const registro = {
    id,
    ra,
    entrada: agora.toISOString(),
    saida: null,
    duracao_ms: null,
    duracao_fmt: null,
    storage: "firebase-firestore",
  };

  const batch = db.batch();
  batch.set(db.collection("registros").doc(id), registro);
  batch.set(ativoRef, { id, entrada_ts: agora.getTime(), entrada: registro.entrada });
  await batch.commit();

  return { ok: true, tipo: "entrada", mensagem: "Entrada registrada com sucesso na nuvem.", registro };
}

async function registrarSaidaFirebase(db, ra) {
  const ativoRef = db.collection("ativos").doc(ra);
  const ativoSnap = await ativoRef.get();

  if (!ativoSnap.exists) {
    return { ok: false, mensagem: `RA ${ra} não possui entrada registrada. Escaneie para registrar entrada.` };
  }

  const ativo = ativoSnap.data();
  const agora = new Date();
  const duracao = agora.getTime() - ativo.entrada_ts;
  const registroRef = db.collection("registros").doc(ativo.id);
  const registroSnap = await registroRef.get();

  const registro = {
    ...(registroSnap.exists ? registroSnap.data() : { id: ativo.id, ra }),
    saida: agora.toISOString(),
    duracao_ms: duracao,
    duracao_fmt: formatarDuracao(duracao),
    storage: "firebase-firestore",
  };

  const batch = db.batch();
  batch.set(registroRef, registro, { merge: true });
  batch.delete(ativoRef);
  await batch.commit();

  return { ok: true, tipo: "saida", mensagem: "Saída registrada com sucesso na nuvem.", registro };
}

async function listarRegistrosFirebase(db) {
  const snap = await db.collection("registros").orderBy("entrada", "desc").get();
  return snap.docs.map(doc => doc.data());
}

async function listarAtivosFirebase(db) {
  const snap = await db.collection("ativos").get();
  const ativos = {};
  snap.docs.forEach(doc => {
    ativos[doc.id] = doc.data();
  });
  return ativos;
}

async function limparTudoFirebase(db) {
  for (const collectionName of ["registros", "ativos"]) {
    const snap = await db.collection(collectionName).get();
    const batch = db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
}

module.exports = {
  registrarEntrada,
  registrarSaida,
  listarRegistros,
  listarAtivos,
  limparTudo,
  storageMode,
};
