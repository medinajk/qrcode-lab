# Deploy online - QR Code fixo para entrada e saida

## Objetivo

Depois do deploy, o sistema fica disponivel pela internet. O computador e os
celulares nao precisam estar na mesma rede Wi-Fi.

O projeto passa a ter tres enderecos principais:

```text
https://SEU-SITE.onrender.com/entrada
https://SEU-SITE.onrender.com/saida
https://SEU-SITE.onrender.com/admin
```

- O QR Code fixado na entrada abre `/entrada`.
- O QR Code fixado na saida abre `/saida`.
- O professor acessa `/admin` no computador para visualizar os registros.
- Os dados continuam armazenados no Firebase Cloud Firestore.

## Hospedagem recomendada

Para este projeto, use um Web Service Node.js no
[Render](https://render.com/). O arquivo `render.yaml` incluido no repositorio
ja descreve o servico.

O plano gratuito do Render hiberna o servidor apos um periodo sem acessos.
Antes da apresentacao, abra o site e aguarde ele carregar. Durante o uso, os
acessos mantem o servidor ativo. Os dados nao sao perdidos porque ficam no
Firebase, nao no disco temporario da hospedagem.

## 1. Enviar o projeto atualizado para o GitHub

Confirme que o `.env` e o JSON do Firebase nao foram adicionados ao commit.
Esses arquivos contem dados secretos.

Depois envie os arquivos atualizados do projeto para o repositorio GitHub.

## 2. Gerar o segredo Firebase em Base64

O Render nao possui acesso ao arquivo JSON salvo no seu computador. Portanto,
a credencial precisa ser cadastrada como uma variavel secreta em Base64.

No PowerShell, execute:

```powershell
$arquivo = "C:\caminho\para\firebase-service-account.json"
$base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($arquivo))
Set-Clipboard $base64
```

O valor fica copiado para a area de transferencia. Nao envie esse texto para o
GitHub, mensagens, documentos ou capturas de tela.

## 3. Criar o servico no Render

1. Acesse [Render Dashboard](https://dashboard.render.com/).
2. Entre com sua conta GitHub.
3. Clique em **New > Blueprint**.
4. Conecte o repositorio `medinajk/qrcode-lab`.
5. O Render detectara o arquivo `render.yaml`.
6. Preencha as variaveis solicitadas:

| Variavel | Valor |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Cole o texto Base64 gerado no PowerShell |
| `ADMIN_PASSWORD` | Crie uma senha forte para proteger o painel |

O ID do banco ja esta definido no arquivo:

```text
FIREBASE_DATABASE_ID=qrcodelab
```

Finalize a criacao e aguarde o deploy.

## 4. Testar o site publicado

Quando o Render concluir o deploy, ele mostrara uma URL parecida com:

```text
https://qrcode-lab.onrender.com
```

Abra:

```text
https://qrcode-lab.onrender.com/health
```

O resultado esperado e:

```json
{
  "ok": true,
  "storage": "firebase-firestore"
}
```

Depois abra o painel:

```text
https://qrcode-lab.onrender.com/admin
```

O navegador solicitara usuario e senha:

```text
Usuario: admin
Senha: valor definido em ADMIN_PASSWORD
```

## 5. Gerar os dois QR Codes definitivos

Na pasta do projeto local, execute o comando abaixo usando a URL real fornecida
pelo Render:

```powershell
npm run generate-qr -- https://qrcode-lab.onrender.com
```

O sistema criara duas imagens:

```text
src\data\qrcode-entrada.png
src\data\qrcode-saida.png
```

Imprima ou exiba cada arquivo no local correspondente:

| Arquivo | Local | Link codificado |
|---|---|---|
| `qrcode-entrada.png` | Entrada do laboratorio | `/entrada` |
| `qrcode-saida.png` | Saida do laboratorio | `/saida` |

Como a URL publicada e fixa, os QR Codes continuam funcionando mesmo quando o
IP do computador ou a rede Wi-Fi mudarem.

## 6. Fluxo da apresentacao

1. Antes de apresentar, abra `/health` e `/admin` para despertar o servidor.
2. Mostre o QR Code de entrada.
3. O aluno escaneia, acessa `/entrada`, informa seu RA e registra a entrada.
4. O painel `/admin` mostra o aluno presente no laboratorio.
5. Mostre o QR Code de saida.
6. O aluno escaneia, acessa `/saida`, informa seu RA e registra a saida.
7. O painel mostra o horario de saida e o tempo de permanencia.

## 7. Onde visualizar os dados no Firebase

No [Firebase Console](https://console.firebase.google.com/):

```text
Projeto qrcode-cf24b
> Firestore Database
> banco qrcodelab
> aba Dados
```

O sistema usa duas colecoes:

| Colecao | Conteudo |
|---|---|
| `registros` | Historico completo de entradas e saidas |
| `ativos` | Alunos que ainda estao dentro do laboratorio |

Quando um aluno registra a entrada, ele aparece nas duas colecoes. Quando
registra a saida, seu documento e removido de `ativos`, mas o historico
permanece em `registros`.

## 8. Teste local opcional

O modo local continua funcionando:

```powershell
npm start
```

Abra:

```text
http://localhost:3000/entrada
http://localhost:3000/saida
http://localhost:3000/admin
```
