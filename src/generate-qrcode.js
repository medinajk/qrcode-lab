/**
 * generateQR.js
 * Gera o QR Code do laboratório e salva como imagem PNG em src/data/qrcode.png
 *
 * Uso: node src/generateQR.js [URL]
 * Exemplo: node src/generateQR.js http://192.168.1.10:3000
 *
 * Se nenhuma URL for passada, usa http://localhost:3000 por padrão.
 */

const QRCode = require("qrcode");
const path   = require("path");
const fs     = require("fs");

const DATA_DIR = path.join(__dirname, "data");
const QR_FILE  = path.join(DATA_DIR, "qrcode.png");

// URL do servidor — pode ser passada como argumento ou definida manualmente
const url = process.argv[2] || "http://localhost:3000";

async function gerarQRCode() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  try {
    await QRCode.toFile(QR_FILE, url, {
      type:           "png",
      width:          400,
      margin:         2,
      color: {
        dark:  "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H", // Alta correção de erros (ideal para impressão)
    });

    console.log("✅ QR Code gerado com sucesso!");
    console.log(`📁 Arquivo: ${QR_FILE}`);
    console.log(`🔗 URL codificada: ${url}`);
    console.log("\n📌 Instruções:");
    console.log("   1. Abra o arquivo src/data/qrcode.png");
    console.log("   2. Imprima e fixe na entrada do laboratório");
    console.log("   3. Os alunos escaneiam para registrar entrada/saída\n");
  } catch (err) {
    console.error("❌ Erro ao gerar QR Code:", err.message);
    process.exit(1);
  }
}

gerarQRCode();