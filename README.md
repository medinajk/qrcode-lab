# Lab Check-in — Sistema de Registro de Acesso

Sistema de registro de entrada e saída de alunos no laboratório via QR Code.

## Deploy online

Para publicar o sistema no Render com QR Codes fixos separados para entrada e
saida, consulte [`DEPLOY_ONLINE.md`](DEPLOY_ONLINE.md).

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
node src/generate-qrcode.js http://192.168.1.100:3000
```

## Como usar

### 1. Descobrir o IP da máquina
- **Windows:** `ipconfig` no terminal → procure "Endereço IPv4"
- **Linux/Mac:** `ip a` ou `ifconfig` → procure o IP da interface de rede

### 2. Gerar e imprimir o QR Code
```bash
node src/generate-qrcode.js http://192.168.1.100:3000
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

Por padrão, os registros ficam em `src/data/registros.json`. Se o Firebase estiver configurado, os registros passam a ficar no **Cloud Firestore**, usando as coleções `registros` e `ativos`.

Essa evolução permite relacionar o projeto com dois pilares da Indústria 4.0:

- **Big Data:** histórico de entradas, saídas e tempo de permanência para análise de uso do laboratório.
- **Armazenamento em nuvem:** persistência dos registros no Firebase/Firestore, com menor dependência do computador local.

Formato dos registros:

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
| `firebase-admin` | ^12.7.0 | Integração com Firebase Cloud Firestore |
| `qrcode` | ^1.5.3 | Geração do QR Code em PNG |

## Armazenamento em nuvem com Firebase

Para ativar o pilar de armazenamento em nuvem:

1. No Firebase Console, crie ou abra o projeto.
2. Ative o **Cloud Firestore**.
3. Em **Configurações do projeto > Contas de serviço**, gere uma nova chave privada JSON.
4. Salve esse arquivo fora do repositório, por exemplo:
   `C:\firebase\qrcode-lab-service-account.json`
5. Crie um arquivo `.env` na raiz do projeto, ao lado de `package.json`:

```text
D:\wamp64\www\QRCODE\.env
```

Conteúdo do `.env`:

```env
PORT=3000
FIREBASE_SERVICE_ACCOUNT=C:\firebase\qrcode-lab-service-account.json
```

Depois inicie o servidor:

```powershell
npm start
```

Alternativa sem `.env`: configure a variável de ambiente direto no terminal.

No PowerShell:

```powershell
$env:FIREBASE_SERVICE_ACCOUNT="C:\firebase\qrcode-lab-service-account.json"
npm start
```

No Prompt de Comando:

```bat
set FIREBASE_SERVICE_ACCOUNT=C:\firebase\qrcode-lab-service-account.json
npm start
```

Quando o Firebase estiver ativo, o painel administrativo mostrará **Armazenamento: Nuvem**. Sem Firebase, o sistema continua funcionando em modo local com JSON.

> Nunca envie o arquivo de credenciais JSON para o GitHub, Drive público ou AVA.
