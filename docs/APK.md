# Gerar o APK para Android

O projeto Android já está pronto na pasta **`apk/android`**. Ele foi feito com o [Capacitor](https://capacitorjs.com), que coloca o site dentro de um app Android de verdade. O nome, o ícone, a tela de abertura, as permissões e a versão já estão configurados. Só falta compilar no Android Studio.

| Já configurado | Valor |
|---|---|
| Nome do app | EsgotoZero |
| ID do pacote | `br.com.esgotozero.app` (não mude depois de publicar) |
| Versão | 2.1.0 (código 1) |
| Ícone | gota da marca, com ícone adaptativo e monocromático (Android 13+) |
| Tela de abertura | logo sobre o fundo claro do app |
| Permissões | internet e localização (a foto usa o app de câmera do celular) |
| Android mínimo | 7.0 (API 24) |
| Barras do sistema | o app ocupa a tela toda e respeita entalhe e barra de gestos; os ícones da barra de status acompanham o tema claro/escuro |

## Gerar o APK (primeira vez)

Precisa só do **Android Studio** instalado e de internet (na primeira vez ele baixa as dependências do Android, algumas centenas de MB).

1. Abra o Android Studio → **Open** → escolha a pasta **`esgotozero/apk/android`** (a pasta `android`, não a `esgotozero`).
2. Espere a barra de baixo terminar o **Gradle sync** (na primeira vez leva alguns minutos). Se ele pedir para instalar algum SDK ou atualizar o Gradle, aceite.
3. Menu **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
4. Quando terminar, clique em **locate** no aviso. O arquivo é `apk/android/app/build/outputs/apk/debug/app-debug.apk`.
5. Passe o `app-debug.apk` para o celular (cabo, Drive ou WhatsApp), abra e permita **instalar apps desconhecidos**.

Para testar direto no celular pelo cabo: ative a **Depuração USB** nas opções do desenvolvedor do celular e clique no ▶ (Run) do Android Studio.

> O APK "debug" serve para testar e apresentar. Para a Google Play é preciso um APK/AAB **assinado** (seção abaixo).

## Quando o site mudar

O app leva uma cópia do site. Depois de alterar qualquer arquivo do site, atualize a cópia antes de gerar outro APK:

```bash
cd apk
npm install        # só na primeira vez (precisa do Node.js)
npm run sync       # copia o site para o app e atualiza o projeto Android
```

Depois gere o APK de novo no Android Studio. Para instalar por cima da versão anterior, aumente o `versionCode` (1 → 2 → 3…) e o `versionName` em `apk/android/app/build.gradle`.

> Quem clonar o repositório do GitHub precisa rodar esses dois comandos antes da primeira compilação: a cópia do site e alguns arquivos gerados não vão para o Git (estão no `.gitignore`).

## APK assinado (para a Google Play ou para distribuir)

1. **Build → Generate Signed App Bundle or APK** → escolha **Android App Bundle** (Play Store) ou **APK**.
2. **Create new…** para criar a chave (*keystore*). Guarde o arquivo `.jks` e as senhas num lugar seguro, **fora do GitHub** (o `.gitignore` já impede que ele suba). Sem essa chave, não dá para atualizar o app publicado.
3. Escolha **release** e conclua. O arquivo sai em `apk/android/app/release/`.

## Alternativa sem Android Studio: PWABuilder

O site publicado no Netlify também é um app instalável (PWA). Pelo https://www.pwabuilder.com dá para gerar um pacote Android a partir do endereço do site:

1. Cole `https://comforting-kheer-a0c28d.netlify.app` e clique em **Start**.
2. **Package for stores → Android → Generate package**, com o mesmo ID `br.com.esgotozero.app`.
3. Guarde a chave de assinatura que vem no ZIP, fora do GitHub.
4. Para o app abrir sem a barra de endereço, publique o `assetlinks.json` do ZIP em `.well-known/assetlinks.json` no site.

A diferença: esse app carrega o site publicado e se atualiza sozinho quando o site muda (precisa de internet na primeira abertura); o do Capacitor leva os arquivos dentro do APK e precisa de um APK novo a cada mudança.

## Teste rápido antes de gerar

- No computador: Chrome → F12 → ícone de celular. Teste "iPhone SE", "Pixel 7" e gire a tela.
- No celular: abra o site no Chrome → menu ⋮ → **Instalar app**. É bem parecido com o APK.

## O que já foi preparado no site para virar app

- Responsivo de 320 px a telas grandes, em pé e deitado (lista ao lado do mapa e registro em duas colunas quando deitado).
- Botões e campos com pelo menos 44 px nas telas de toque.
- Botão "voltar" do Android fecha a janela aberta antes de sair da tela.
- Funciona sem internet com o que já foi guardado; avisa quando a conexão cai.
- Atalhos no ícone (site instalado): "Registrar ocorrência" e "Meus relatos".
