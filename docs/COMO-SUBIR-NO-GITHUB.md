# Como subir o EsgotoZero no GitHub

Em uns 15 minutos o EsgotoZero fica em **github.com/Gustavo-Mota-Dev/esgotozero**, com os colegas do grupo convidados. Tudo sai do arquivo **EsgotoZero-completo.zip**, que já vem pronto para virar repositório.

| O que vem no ZIP | Para quê |
| --- | --- |
| O site (versão nacional 2.1) | `index.html`, `css/`, `js/`, `assets/`, `vendor/`, `sw.js`, `manifest.webmanifest` |
| `apk/` | App Android pronto (Capacitor): abra `apk/android` no Android Studio e gere o APK |
| `README.md` | Página inicial do repositório, com imagens, como rodar e créditos |
| `CONTRIBUTING.md` | Como o grupo trabalha: clonar, branch, commit, pull request |
| `docs/` | Arquitetura, próximos passos, banco do Supabase (`schema.sql`), guia do APK e este guia |
| `scripts/check.mjs` e `.github/` | Verificação automática a cada envio (aba Actions) |
| `netlify.toml` | Configuração pronta para publicar no Netlify |

Você só precisa fazer duas coisas: **criar o repositório** (opção A ou B abaixo) e **convidar o grupo**.

## Antes de começar

1. Entre na sua conta pessoal do GitHub, **Gustavo-Mota-Dev**. É um projeto da faculdade, então não use a organização da empresa.
2. Instale o **GitHub Desktop** (desktop.github.com). É o caminho mais simples e não precisa de comandos. Se preferir o terminal, instale o Git (git-scm.com) e use a opção B.
3. Descompacte o ZIP: botão direito em **EsgotoZero-completo.zip → Extrair tudo**. Sugestão de lugar: `Documentos\GitHub\`.
4. Confira se a pasta `esgotozero` tem o `index.html`, o `README.md` e a pasta `.github`. Se a `.github` estiver lá, está tudo certo.
5. Decida se o repositório será **público** ou **privado**:
    - **Público:** o professor vê sem convite, dá para usar o GitHub Pages e proteger a branch `main` de graça.
    - **Privado:** só você e os colegas convidados veem. A proteção da `main` exige o GitHub Pro, que sai de graça pelo GitHub Student Developer Pack (education.github.com/pack).

O ZIP não tem chaves nem senhas, então pode ser público sem risco.

## Opção A · GitHub Desktop (recomendada)

1. Abra o GitHub Desktop e entre com a conta: **File → Options → Accounts → Sign in** e autorize no navegador.
2. **File → Add local repository → Choose…** e escolha a pasta `esgotozero`.
3. Ele vai avisar que a pasta ainda não é um repositório. Clique no link **create a repository**.
4. Na janela que abre, deixe o nome `esgotozero`. Em **Git ignore** e **License**, escolha **None** (o projeto já tem o `.gitignore`). Não marque "Initialize with a README". Clique em **Create repository**.
5. Na coluna da esquerda aparecem os arquivos. Em **Summary**, escreva `Primeira versão do EsgotoZero (v2.1)` e clique em **Commit to main**.
6. Clique em **Publish repository**. Confira o nome `esgotozero`, escreva uma descrição (ex.: "Mapa colaborativo de ocorrências de esgoto · ODS 6") e marque ou desmarque **Keep this code private** conforme a decisão acima. Clique em **Publish repository**.
7. Para ver no site: **Repository → View on GitHub**.

Daqui para frente, cada alteração é: escrever o Summary, **Commit to main** (ou na sua branch) e **Push origin**.

## Opção B · Terminal (git)

1. No GitHub, crie um repositório **vazio** em github.com/new: nome `esgotozero`, público ou privado, e **sem** README, .gitignore ou licença.
2. No terminal (PowerShell ou Git Bash), dentro da pasta do projeto:

```bash
cd "C:\Users\SEU-USUARIO\Documents\GitHub\esgotozero"
git init -b main
git add .
git commit -m "Primeira versão do EsgotoZero (v2.1)"
git remote add origin https://github.com/Gustavo-Mota-Dev/esgotozero.git
git push -u origin main
```

No primeiro `push`, o Git abre o navegador para você entrar no GitHub. A senha da conta não funciona no terminal: o login é sempre pelo navegador.

## Conferir se subiu certo

- [ ] A página do repositório mostra o README com o banner do EsgotoZero.
- [ ] Na lista de arquivos aparecem `.github`, `apk`, `docs`, `js` e `netlify.toml`.
- [ ] Na aba **Actions**, a verificação **Verificar projeto** termina com um ✓ verde (leva uns 30 segundos).

Se aparecer um X vermelho, clique nele: a mensagem diz qual arquivo ou ícone está faltando.

Alguns arquivos não sobem de propósito (a cópia do site dentro do app Android e as dependências). Eles são recriados com `npm install` e `npm run sync` dentro de `apk/`.

## Convidar o grupo e proteger a main

**Convidar os colegas**

1. No repositório: **Settings → Collaborators → Add people**.
2. Digite o usuário ou o e-mail do GitHub de cada colega e envie.
3. Cada um aceita o convite pelo e-mail ou em github.com/notifications.

**Proteger a branch main** (público, ou privado com GitHub Pro)

1. **Settings → Branches → Add classic branch protection rule**.
2. Em **Branch name pattern**, escreva `main`.
3. Marque **Require a pull request before merging** e, dentro dele, **Require approvals** (1 aprovação).
4. Marque **Require status checks to pass before merging** e escolha a verificação **verificar**. Ela só aparece na lista depois de rodar uma vez.
5. Clique em **Create**.

Com isso, ninguém altera a `main` direto: toda mudança entra por pull request revisado e com a verificação verde. Sem o Pro num repositório privado, o combinado do `CONTRIBUTING.md` faz esse papel.

## Mensagem para o grupo

Pronta para colar no WhatsApp depois de enviar os convites:

```text
Pessoal, o EsgotoZero está no GitHub: https://github.com/Gustavo-Mota-Dev/esgotozero

1. Aceitem o convite de colaborador que chegou no e-mail de vocês.
2. Leiam o CONTRIBUTING.md (10 min): explica como baixar, criar uma branch e mandar as alterações por pull request.
3. As tarefas que faltam estão em docs/PROXIMOS-PASSOS.md, com uma sugestão de divisão (pessoas A, B, C e D). Digam qual cada um pega.
4. O banco do Supabase já está pronto em docs/supabase/schema.sql e o passo a passo do APK em docs/APK.md.

Regra de ouro: ninguém mexe direto na main, e nunca subam chaves ou senhas.
```

## Depois: atualizar o site e gerar o APK

A versão 2.1 já está publicada em comforting-kheer-a0c28d.netlify.app (12/11/2026). Para as próximas atualizações do site, escolha um caminho:

| Caminho | Como | Depois disso |
| --- | --- | --- |
| Netlify Drop (mais rápido) | No painel do Netlify, abra o projeto **comforting-kheer-a0c28d → Deploys** e arraste a pasta do site (ou o `EsgotoZero-netlify-deploy.zip`) na área "Drag and drop" | O endereço continua o mesmo. Cada atualização é um novo arraste |
| Netlify ligado ao GitHub (recomendado para o grupo) | No mesmo projeto: **Project configuration → Build & deploy → Link repository** e escolha `esgotozero`. As configurações vêm do `netlify.toml` | Cada envio para a `main` publica sozinho, depois da verificação |
| GitHub Pages | No repositório: **Settings → Pages**, branch `main`, pasta `/ (root)` | Endereço novo: gustavo-mota-dev.github.io/esgotozero |

Não use o projeto `whimsical-sunburst-703330` do Netlify: ele é o site Nimbo, e o envio apagaria esse site.

**APK:** o projeto Android já vem pronto em `apk/android`. Abra essa pasta no Android Studio e use **Build → Build App Bundle(s) / APK(s) → Build APK(s)**. O passo a passo completo está em `docs/APK.md`. Quem clonar do GitHub precisa rodar `npm install` e `npm run sync` dentro de `apk/` antes da primeira compilação.

## Problemas comuns

| Problema | Solução |
| --- | --- |
| A pasta `.github` não apareceu no repositório | Acontece quando se arrasta os arquivos pelo site do GitHub. Use o GitHub Desktop ou o terminal |
| `push` recusado com "fetch first" ou "rejected" | O repositório foi criado com README. Rode `git pull origin main --allow-unrelated-histories` e depois `git push`, ou apague e crie de novo vazio |
| O terminal pede usuário e senha | A senha da conta não serve. Use o GitHub Desktop ou entre pelo navegador quando o Git abrir a janela |
| Aviso "CRLF will be replaced by LF" | Normal no Windows. O `.gitattributes` padroniza as quebras de linha |
| X vermelho na aba Actions | Clique na execução: a mensagem diz o arquivo ou ícone que falta. Rode `npm run check` no computador para ver antes de enviar |
| O site publicado mostra a versão antiga | Recarregue com Ctrl + Shift + R. O app sempre busca a versão nova quando há internet |
| Erro no Android Studio ao abrir `apk/android` | Confira se abriu a pasta `android` (não a `esgotozero`) e deixe o Gradle terminar de baixar tudo. Se pedir para instalar SDK ou atualizar o Gradle, aceite |
