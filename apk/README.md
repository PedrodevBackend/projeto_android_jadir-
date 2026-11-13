# EsgotoZero · app Android

Projeto Android (Capacitor 8) com o site do EsgotoZero dentro.

- **Gerar o APK:** abra a pasta `android/` no Android Studio e use **Build → Build APK(s)**.
- **Depois de mudar o site:** `npm install` (uma vez) e `npm run sync`, aqui nesta pasta.

Passo a passo completo, APK assinado e alternativa sem Android Studio: [../docs/APK.md](../docs/APK.md).

| Arquivo | Para quê |
|---|---|
| `capacitor.config.json` | nome, ID do pacote (`br.com.esgotozero.app`) e barras do sistema |
| `copiar-site.mjs` | copia o site (pasta acima) para `www/` |
| `android/` | o projeto do Android Studio (ícones, tela de abertura e permissões já configurados) |
