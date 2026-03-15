/**
 * database.js
 * Responsável por armazenar e recuperar os registros de acesso.
 * Os dados são salvos em src/data/registros.json
 */

const fs   = require("fs");
const path = require("path");

const DATA_DIR  = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "registros.json");

// Garante que o diretório e o arquivo existam
function init() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ registros: [], ativos: {} }, null, 2));
  }
}

// Lê todos os dados do arquivo
function lerDados() {
  init();
  try {
    const conteudo = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(conteudo);
  } catch {
    return { registros: [], ativos: {} };
  }
}

// Salva todos os dados no arquivo
function salvarDados(dados) {
  init();
  fs.writeFileSync(DATA_FILE, JSON.stringify(dados, null, 2));
}

/**
 * Registra a ENTRADA de um aluno.
 * @param {string} ra - RA de 6 dígitos do aluno
 * @returns {{ ok: boolean, mensagem: string, registro?: object }}
 */
function registrarEntrada(ra) {
  const dados = lerDados();

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

  salvarDados(dados);

  return { ok: true, tipo: "entrada", mensagem: "Entrada registrada com sucesso.", registro };
}

/**
 * Registra a SAÍDA de um aluno.
 * @param {string} ra - RA de 6 dígitos do aluno
 * @returns {{ ok: boolean, mensagem: string, registro?: object }}
 */
function registrarSaida(ra) {
  const dados = lerDados();

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
  salvarDados(dados);

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
function listarRegistros() {
  const dados = lerDados();
  return [...dados.registros].reverse();
}

/**
 * Retorna apenas os alunos atualmente no laboratório.
 */
function listarAtivos() {
  const dados = lerDados();
  return dados.ativos;
}

/**
 * Remove todos os registros e limpa os ativos.
 */
function limparTudo() {
  salvarDados({ registros: [], ativos: {} });
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

module.exports = {
  registrarEntrada,
  registrarSaida,
  listarRegistros,
  listarAtivos,
  limparTudo,
};