/**
 * server.js
 * Servidor principal da aplicação.
 * Serve a página de check-in, o painel admin e expõe a API REST.
 *
 * Rotas:
 *   GET  /            → página de check-in (escaneada pelo QR Code)
 *   POST /checkin     → registra entrada ou saída do aluno
 *   GET  /admin       → painel administrativo
 *   GET  /admin/dados → retorna JSON com todos os registros
 *   POST /admin/limpar → apaga todos os registros
 */

const express = require("express");
const path    = require("path");
const db      = require("./database");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve arquivos estáticos (CSS/JS/etc.).
// Os arquivos HTML estão em src/, mas o CSS está na raiz do projeto.
// Por isso servimos também a pasta pai (raiz do projeto).
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, "..")));

// ─── Página de check-in ─────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "checkin.html"));
});

// ─── API de check-in ─────────────────────────────────────────────────────────

app.post("/checkin", (req, res) => {
  const { ra } = req.body;

  // Validação
  if (!ra || !/^\d{6}$/.test(ra)) {
    return res.status(400).json({ ok: false, mensagem: "RA inválido. Informe exatamente 6 dígitos." });
  }

  // Verifica se já está no laboratório (saída) ou não (entrada)
  const ativos = db.listarAtivos();

  if (ativos[ra]) {
    const resultado = db.registrarSaida(ra);
    return res.json(resultado);
  } else {
    const resultado = db.registrarEntrada(ra);
    return res.json(resultado);
  }
});

// ─── Painel admin ────────────────────────────────────────────────────────────

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/admin/dados", (req, res) => {
  res.json({
    registros: db.listarRegistros(),
    ativos:    db.listarAtivos(),
  });
});

app.post("/admin/limpar", (req, res) => {
  db.limparTudo();
  res.json({ ok: true, mensagem: "Todos os registros foram apagados." });
});

// ─── Inicia servidor ─────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log("╔════════════════════════════════════════╗");
  console.log("║   Laboratório — Sistema de Check-in    ║");
  console.log("╚════════════════════════════════════════╝");
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`\n📋 Rotas disponíveis:`);
  console.log(`   Check-in  →  http://localhost:${PORT}/`);
  console.log(`   Admin     →  http://localhost:${PORT}/admin`);
  console.log(`\n📌 Para gerar o QR Code, execute:`);
  console.log(`   node src/generateQR.js http://<IP_DA_MAQUINA>:${PORT}`);
  console.log(`\n💾 Dados salvos em: src/data/registros.json\n`);
});