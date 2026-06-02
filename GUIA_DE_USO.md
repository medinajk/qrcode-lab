# Guia de uso local - Controle de entrada do laboratorio por QR Code

> Para publicar o sistema na internet e usar QR Codes fixos separados para
> entrada e saida, consulte [`DEPLOY_ONLINE.md`](DEPLOY_ONLINE.md).

## 1. Visao geral

Este projeto registra a entrada e a saida dos alunos no laboratorio.

O aluno escaneia um QR Code com o celular, abre uma pagina no navegador e
informa seu RA de 6 digitos.

- No primeiro envio do RA, o sistema registra a **entrada**.
- No segundo envio do mesmo RA, o sistema registra a **saida**.
- Ao registrar a saida, o sistema calcula o tempo de permanencia no laboratorio.
- Os dados ficam armazenados na nuvem usando o **Cloud Firestore** do Firebase.

O projeto representa dois pilares da Industria 4.0:

- **Big Data:** armazenamento do historico de acessos para analise.
- **Armazenamento em nuvem:** registros salvos no Firebase Cloud Firestore.

## 2. Configuracao atual do Firebase

O arquivo `.env` ja esta configurado nesta maquina. Ele aponta para a credencial
JSON da conta de servico e para o banco Firestore correto:

```env
PORT=3000
FIREBASE_SERVICE_ACCOUNT=C:\caminho\para\firebase-service-account.json
FIREBASE_DATABASE_ID=qrcodelab
```

## 3. Preparacao inicial

Esta etapa so precisa ser executada uma vez, ou quando o projeto for instalado
em outra maquina.

Abra o PowerShell na pasta do projeto:

```powershell
cd "C:\wamp64\www\QR CODE"
```

Instale as dependencias:

```powershell
npm install
```

## 4. Como iniciar o sistema

Sempre que for utilizar o sistema, abra o PowerShell na pasta do projeto:

```powershell
cd "C:\wamp64\www\QR CODE"
```

Inicie o servidor:

```powershell
npm start
```

Mantenha esse terminal aberto enquanto o sistema estiver sendo utilizado.

No computador, a pagina de check-in fica disponivel em:

```text
http://localhost:3000
```

O painel administrativo fica disponivel em:

```text
http://localhost:3000/admin
```

## 5. Como gerar o QR Code para os alunos

O celular precisa acessar o computador pela rede local. Portanto, o computador
e os celulares devem estar conectados na mesma rede Wi-Fi.

### 5.1 Descobrir o IP do computador

Abra outro PowerShell e execute:

```powershell
ipconfig
```

Procure o campo `Endereco IPv4`. Um exemplo de IP seria:

```text
192.168.1.100
```

### 5.2 Gerar a imagem do QR Code

Ainda na pasta do projeto, execute o comando abaixo substituindo o IP do exemplo
pelo IP real do computador:

```powershell
npm run generate-qr -- http://192.168.1.100:3000
```

Tambem e possivel usar diretamente:

```powershell
node src/generate-qrcode.js http://192.168.1.100:3000
```

A imagem sera criada em:

```text
src\data\qrcode.png
```

Essa imagem pode ser aberta, exibida na tela ou impressa para ficar na entrada
do laboratorio.

Importante: se o IP do computador mudar, gere um novo QR Code com o IP atualizado.

## 6. Fluxo do aluno

1. O aluno escaneia o QR Code com a camera do celular.
2. O navegador abre a pagina de check-in.
3. O aluno informa seu RA com exatamente 6 digitos.
4. O aluno envia o formulario.
5. Se o aluno ainda nao estiver no laboratorio, o sistema registra a entrada.
6. Quando o aluno escanear o QR Code novamente e informar o mesmo RA, o sistema
   registra a saida e calcula o tempo de permanencia.

Exemplo:

```text
08:00 - RA 210001 enviado pela primeira vez  -> entrada
10:15 - RA 210001 enviado novamente          -> saida
Tempo de permanencia                          -> 2h 15min
```

## 7. Painel administrativo

Para visualizar os registros no computador que esta executando o servidor,
abra:

```text
http://localhost:3000/admin
```

Para abrir o painel a partir de outro dispositivo conectado na mesma rede,
utilize o IP do computador:

```text
http://192.168.1.100:3000/admin
```

O painel exibe os alunos presentes, o total de registros e o historico de
entradas e saidas. Quando o Firebase estiver funcionando, o painel indica:

```text
Armazenamento: Nuvem
```

## 8. Onde os dados aparecem no Firebase

Os registros ficam no **Cloud Firestore**, dentro do projeto Firebase
`qrcode-cf24b` e do banco `qrcodelab`.

Para acessar:

1. Entre no [Firebase Console](https://console.firebase.google.com/).
2. Abra o projeto `qrcode-cf24b`.
3. No menu lateral, acesse **Firestore Database**.
4. Se necessario, selecione o banco `qrcodelab`.
5. Abra a aba **Dados**.

O sistema utiliza duas colecoes:

### Colecao `registros`

Armazena o historico completo de acessos. Cada entrada cria um documento nessa
colecao. Quando o aluno registra a saida, o mesmo documento e atualizado.

Exemplo:

```json
{
  "id": "1718123456789_210001",
  "ra": "210001",
  "entrada": "2026-06-02T11:00:00.000Z",
  "saida": "2026-06-02T13:15:00.000Z",
  "duracao_ms": 8100000,
  "duracao_fmt": "2h 15min",
  "storage": "firebase-firestore"
}
```

### Colecao `ativos`

Armazena temporariamente os alunos que ainda estao dentro do laboratorio.

- Quando um aluno registra entrada, um documento com seu RA aparece em `ativos`.
- Quando esse aluno registra saida, o documento e removido de `ativos`.
- O historico continua preservado na colecao `registros`.

Exemplo de documento enquanto o aluno esta no laboratorio:

```json
{
  "id": "1718123456789_210001",
  "entrada_ts": 1718123456789,
  "entrada": "2026-06-02T11:00:00.000Z"
}
```

## 9. Resumo rapido para demonstracao

1. Abra a pasta do projeto no PowerShell.
2. Execute `npm start`.
3. Em outro PowerShell, descubra o IP usando `ipconfig`.
4. Gere o QR Code usando `npm run generate-qr -- http://IP_DO_COMPUTADOR:3000`.
5. Abra a imagem `src\data\qrcode.png`.
6. Escaneie o QR Code com um celular conectado na mesma rede Wi-Fi.
7. Informe um RA de 6 digitos para registrar entrada.
8. Acesse `http://localhost:3000/admin` para conferir o registro.
9. No Firebase Console, abra **Firestore Database > qrcodelab > Dados**.
10. Envie o mesmo RA novamente para registrar a saida.

## 10. Solucao de problemas

### O celular nao abre a pagina

- Confirme que o computador e o celular estao na mesma rede Wi-Fi.
- Confirme que o terminal com `npm start` continua aberto.
- Confira se o IP usado no QR Code ainda e o IP atual do computador.
- Caso o Windows solicite permissao para o Node.js acessar a rede, permita o
  acesso em redes privadas.

### O painel mostra armazenamento local

O painel deve indicar `Armazenamento: Nuvem`. Se indicar armazenamento local,
confira se o arquivo `.env` existe na raiz do projeto e se o caminho da
credencial JSON continua correto.

### Os dados nao aparecem imediatamente no Firebase

Atualize a aba **Dados** do Cloud Firestore. A colecao `registros` e criada
automaticamente no primeiro check-in. A colecao `ativos` aparece enquanto
existir pelo menos um aluno dentro do laboratorio.
