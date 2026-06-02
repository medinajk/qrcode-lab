/**
 * Servidor principal da aplicacao.
 *
 * Rotas publicas:
 *   GET  /entrada          -> formulario para registrar entrada
 *   GET  /saida            -> formulario para registrar saida
 *   POST /checkin/entrada  -> registra entrada
 *   POST /checkin/saida    -> registra saida
 *   GET  /health           -> verificacao usada pela hospedagem
 *
 * Rotas administrativas:
 *   GET  /admin
 *   GET  /admin/dados
 *   POST /admin/limpar
 */

const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

function validarRa(ra) {
  return typeof ra === "string" && /^\d{6}$/.test(ra);
}

async function registrarAcesso(req, res, tipo) {
  try {
    const { ra } = req.body;

    if (!validarRa(ra)) {
      return res.status(400).json({
        ok: false,
        mensagem: "RA invalido. Informe exatamente 6 digitos.",
      });
    }

    const resultado = tipo === "entrada"
      ? await db.registrarEntrada(ra)
      : await db.registrarSaida(ra);

    return res.status(resultado.ok ? 200 : 409).json(resultado);
  } catch (err) {
    console.error(`Erro ao registrar ${tipo}:`, err);
    return res.status(500).json({
      ok: false,
      mensagem: `Erro ao registrar ${tipo}.`,
    });
  }
}

function protegerAdmin(req, res, next) {
  const senhaEsperada = process.env.ADMIN_PASSWORD;
  if (!senhaEsperada) return next();

  const auth = req.headers.authorization || "";
  const [tipo, credencial] = auth.split(" ");

  if (tipo === "Basic" && credencial) {
    const [usuario, senha] = Buffer.from(credencial, "base64").toString("utf8").split(":");
    if (usuario === "admin" && senha === senhaEsperada) return next();
  }

  res.set("WWW-Authenticate", 'Basic realm="Painel administrativo"');
  return res.status(401).send("Autenticacao necessaria.");
}

app.get("/", (req, res) => {
  res.redirect("/entrada");
});

app.get(["/entrada", "/saida"], (req, res) => {
  res.sendFile(path.join(__dirname, "checkin.html"));
});

app.get("/health", (req, res) => {
  res.json({ ok: true, storage: db.storageMode() });
});

app.post("/checkin/entrada", (req, res) => registrarAcesso(req, res, "entrada"));
app.post("/checkin/saida", (req, res) => registrarAcesso(req, res, "saida"));

// Mantem compatibilidade com o QR Code antigo, que alternava entrada e saida.
app.post("/checkin", async (req, res) => {
  try {
    const { ra } = req.body;

    if (!validarRa(ra)) {
      return res.status(400).json({
        ok: false,
        mensagem: "RA invalido. Informe exatamente 6 digitos.",
      });
    }

    const ativos = await db.listarAtivos();
    return registrarAcesso(req, res, ativos[ra] ? "saida" : "entrada");
  } catch (err) {
    console.error("Erro no check-in automatico:", err);
    return res.status(500).json({ ok: false, mensagem: "Erro ao registrar acesso." });
  }
});

app.use("/admin", protegerAdmin);

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/admin/dados", async (req, res) => {
  try {
    res.json({
      registros: await db.listarRegistros(),
      ativos: await db.listarAtivos(),
      storage: db.storageMode(),
    });
  } catch (err) {
    console.error("Erro ao carregar dados:", err);
    res.status(500).json({
      registros: [],
      ativos: {},
      storage: db.storageMode(),
      erro: true,
      mensagem: "Erro ao consultar o Firestore. Verifique as variaveis do Firebase no Render.",
    });
  }
});

app.post("/admin/limpar", async (req, res) => {
  try {
    await db.limparTudo();
    res.json({ ok: true, mensagem: "Todos os registros foram apagados." });
  } catch (err) {
    console.error("Erro ao limpar dados:", err);
    res.status(500).json({ ok: false, mensagem: "Erro ao limpar registros." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Entrada: http://localhost:${PORT}/entrada`);
  console.log(`Saida:   http://localhost:${PORT}/saida`);
  console.log(`Admin:   http://localhost:${PORT}/admin`);
});
