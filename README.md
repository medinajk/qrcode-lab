# Lab Check-in — Sistema de Registro de Acesso

Sistema de registro de entrada e saída de alunos no laboratório via QR Code.

## Instalação

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 16 ou superior

### Passos

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar o servidor
npm start

# 3. Em outro terminal, gerar o QR Code
#    Substitua pelo IP real da máquina na rede local
node src/generateQR.js http://192.168.1.100:3000
```

## Como usar

### 1. Descobrir o IP da máquina
- **Windows:** `ipconfig` no terminal → procure "Endereço IPv4"
- **Linux/Mac:** `ip a` ou `ifconfig` → procure o IP da interface de rede

### 2. Gerar e imprimir o QR Code
```bash
node src/generateQR.js http://192.168.1.100:3000
```
O arquivo `src/data/qrcode.png` será criado. Imprima e fixe na entrada do laboratório.

### 3. Fluxo do aluno
1. Aluno escaneia o QR Code com o celular
2. Abre a página de check-in no navegador
3. Digita o RA de 6 dígitos
4. **Primeiro escaneamento** → registra a **entrada**
5. **Segundo escaneamento** → registra a **saída** e calcula o tempo de permanência

### 4. Painel administrativo
Acesse pelo navegador:
```
http://localhost:3000/admin
```
Ou pela rede:
```
http://192.168.1.100:3000/admin
```

## Dados armazenados

Os registros ficam em `src/data/registros.json` com o seguinte formato:

```json
{
  "registros": [
    {
      "id": "1718123456789_210001",
      "ra": "210001",
      "entrada": "2024-06-11T08:30:00.000Z",
      "saida": "2024-06-11T10:15:00.000Z",
      "duracao_ms": 6300000,
      "duracao_fmt": "1h 45min"
    }
  ],
  "ativos": {}
}
```

## Portas e configurações

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3000` | Porta do servidor |

Para usar outra porta:
```bash
PORT=8080 npm start
```

## Dependências

| Pacote | Versão | Uso |
|---|---|---|
| `express` | ^4.18.2 | Servidor web e roteamento |
| `qrcode` | ^1.5.3 | Geração do QR Code em PNG |