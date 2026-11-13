# Histórico de versões

## 2.1.0 · 12/11/2026 · preparação para o GitHub e para o APK

**App Android**
- Projeto Android pronto em `apk/` (Capacitor 8): nome, ID `br.com.esgotozero.app`, ícone adaptativo com a marca, tela de abertura, permissão de localização, tela cheia respeitando entalhe e barra de gestos, barra de status acompanhando o tema. Guia em `docs/APK.md`.
- Versão 2.1 publicada no Netlify em 12/11/2026.

**Correções**
- Ícones "Em triagem", "Baixa prioridade" e "Nada encontrado" não existiam em `js/icons.js` e apareciam como um "i". Foram adicionados.
- Formulário da equipe: salvar uma nova observação num relato já "Encaminhado" exigia escolher o órgão de novo e registrava um segundo encaminhamento. Agora os campos de encaminhamento só aparecem quando o andamento muda para "Encaminhado".
- Relatos de exemplo: entre 21h e meia-noite, a data observada podia aparecer como o dia seguinte (fuso UTC). Agora usa a data local.
- Dados recebidos de outra aba passam pela mesma validação usada ao abrir o site, e um registro inválido não quebra a tela.
- A imagem de compartilhamento (`og:image`) apontava para um arquivo que não existia. Foi criada a `assets/og-esgotozero.jpg`.
- Telefone da CETESB corrigido: o 0800 113560 era um canal antigo, só para fumaça de veículos a diesel. Agora aparece o Disque Ambiente (0800 500 1350, 24 h) e o sistema Denúncia Ambiente.

**Responsividade e preparo para o APK**
- Varredura em 10 tamanhos de tela (320 a 1920 px, em pé e deitado, tablet e computador) com 15 estados do app em cada um (telas, ficha, filtros, perfil, notificações, busca e as 3 etapas do registro). Nada sai da tela em nenhum deles.
- Celular deitado: barras mais baixas, lista ao lado do mapa (no lugar do painel que sobe), registro em duas colunas e controles que cabem na altura.
- Celular pequeno: indicadores e números de "Meus relatos" em coluna, para os rótulos não estourarem o cartão; avisos com a largura da tela.
- Registro, etapa 1: no celular em pé e no tablet, o mapa não encolhe mais por baixo dos campos.
- Toque: botões, chips, abas, seletores e campos com pelo menos 44 px nas telas de toque.
- Botão "voltar" do Android e do navegador fecha a janela aberta (ficha, filtros, perfil, registro, busca) em vez de sair da tela.
- Manifesto completo para virar app (id, orientação livre, atalhos "Registrar ocorrência" e "Meus relatos") e endereço `#registrar` que abre o registro direto.
- Sem "puxar para atualizar" acidental com o app instalado. Guia do APK em `docs/APK.md`.

**Melhorias**
- Modo offline: o app abre sem internet com a última versão guardada (`sw.js`, estratégia "rede primeiro") e avisa quando a conexão cai ou volta.
- Sem o fundo do mapa (internet fraca), os pinos continuam visíveis com um aviso discreto, em vez de uma tela cobrindo o mapa.
- Acessibilidade: contraste ajustado (texto secundário, marca "Zero" e selos do ODS) e ordem de títulos corrigida. Sem violações no axe-core nos temas claro e escuro.
- Aviso para quem estiver com o JavaScript desligado.
- Repositório: README, guia de contribuição, arquitetura, próximos passos, banco do Supabase (`docs/supabase/schema.sql`, testado num PostgreSQL 16 local), `netlify.toml`, verificação automática (`npm run check`) e GitHub Actions.
- Dados do ODS 6 conferidos com as fontes (SINISA 2024 / Instituto Trata Brasil).

## 2.0.0 · 25/09/2026 · versão nacional
- Abrangência para todo o Brasil, com 5.570 municípios, 45 relatos fictícios em todas as regiões e a página "ODS 6 no Brasil".
- Mapa com agrupamento de pinos, mapa de calor, camadas e troca automática de provedor.
- Registro em 3 etapas com pino fixo no centro, detecção da cidade, busca de endereço, aviso de relato parecido e rascunho.
- Painel de gestão com fila por prioridade, prazo de 48 h, gráficos e exportação em CSV.
- Publicada no Netlify: https://comforting-kheer-a0c28d.netlify.app

## 1.0.0 · 24/09/2026 · primeira versão
- Protótipo da Baixada Santista (SP) com um único `app.js`. Relatos criados nela são migrados automaticamente para a versão 2.
