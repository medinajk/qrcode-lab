/**
 * Gera os QR Codes fixos de entrada e saida.
 *
 * Uso:
 *   npm run generate-qr -- https://seu-projeto.onrender.com
 */

const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");

const DATA_DIR = path.join(__dirname, "data");
const baseUrl = (
  process.argv[2] ||
  process.env.PUBLIC_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

const qrcodes = [
  { tipo: "entrada", url: `${baseUrl}/entrada` },
  { tipo: "saida", url: `${baseUrl}/saida` },
];

async function gerarQRCode({ tipo, url }) {
  const arquivo = path.join(DATA_DIR, `qrcode-${tipo}.png`);

  await QRCode.toFile(arquivo, url, {
    type: "png",
    width: 500,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "H",
  });

  console.log(`QR Code de ${tipo} gerado: ${arquivo}`);
  console.log(`URL: ${url}`);
}

async function main() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  await Promise.all(qrcodes.map(gerarQRCode));
  console.log("\nImprima cada imagem e fixe no local correspondente.");
}

main().catch(err => {
  console.error("Erro ao gerar QR Codes:", err.message);
  process.exit(1);
});
