# Arquitetura do EsgotoZero

Visão técnica para quem vai mexer no código.

## Princípios

- **Sem build e sem framework.** HTML, CSS e JavaScript puro. Cada arquivo de `js/` é carregado por uma tag `<script>` no `index.html`, nesta ordem: `icons → data → core → map → charts → ui → pages → register → app`. Um arquivo só pode usar o que foi carregado antes dele.
- **Um objeto global, `window.EZ`.** Cada arquivo acrescenta funções a ele (ex.: `EZ.store`, `EZ.openDetail`, `EZ.pages`). Fora isso, o código fica dentro de funções `(function () { ... })()` para não vazar variáveis.
- **Página única com rotas por `#`.** `#mapa`, `#ocorrencias`, `#meus-relatos`, `#gestao`, `#ods`. `#relato-EZ-1024` abre a ficha de um relato (é o link de compartilhar).
- **Dados no navegador.** Tudo fica no `localStorage`. É isso que a versão com Supabase vai substituir (veja [PROXIMOS-PASSOS.md](PROXIMOS-PASSOS.md)).

## Módulos

| Arquivo | Responsabilidade | Principais funções |
|---|---|---|
| `js/data.js` | Dados fixos: andamentos, categorias, sinais, gravidade, tipos de água, motivos de encerramento, órgãos, estados, números do ODS 6 e os 45 relatos fictícios | `EZ.STATUS`, `EZ.CATEGORIES`, `EZ.UFS`, `EZ.ODS`, `EZ.makeSeed()` |
| `js/core.js` | Utilitários (datas, distância, escape de HTML), armazenamento, permissões da demonstração, filtros, municípios, geolocalização, diálogos, avisos e o botão "voltar" fechando janelas | `EZ.u`, `EZ.store`, `EZ.filterReports`, `EZ.mun`, `EZ.ui.modal`, `EZ.ui.drawer`, `EZ.ui.toast`, `EZ.ui.layerOpened` |
| `js/map.js` | Mapas Leaflet com troca automática de provedor quando um falha, pinos, grupos, mapa de calor, seletor de ponto e mini mapa | `EZ.createMap`, `EZ.createPicker`, `EZ.createMini` |
| `js/charts.js` | Gráficos em SVG puro e dicas (tooltips) | `EZ.charts.spark`, `weeklyStacked`, `hbars`, `groupedPct` |
| `js/ui.js` | Componentes: selo de andamento, cartões, ficha do relato, formulário da equipe, notificações, perfil, filtros, busca rápida | `EZ.openDetail`, `EZ.saveManage`, `EZ.toggleConfirm`, `EZ.palette` |
| `js/pages.js` | As cinco telas. Cada uma tem `render()` (devolve o HTML), `mount()` (liga mapa e eventos), `refresh()` (atualiza) e `unmount()` | `EZ.pages.mapa`, `.ocorrencias`, `['meus-relatos']`, `.gestao`, `.ods` |
| `js/register.js` | Registro em 3 etapas, rascunho automático, detecção da cidade, busca de endereço, aviso de relato parecido, foto reduzida no aparelho | `EZ.startRegister`, `EZ.wzNext` |
| `js/app.js` | Rotas, cliques (via `data-action`), teclado, formulários, sincronização entre abas, modo offline | `EZ.go`, `EZ.refreshChrome` |
| `sw.js` | Service worker: rede primeiro, cópia local quando não há internet | — |
| `apk/` | App Android (Capacitor). `apk/copiar-site.mjs` copia o site para `apk/www`, e `npx cap sync android` leva para `apk/android/app/src/main/assets/public`. No app, `EZ.applyTheme` também ajusta a cor dos ícones da barra de status | — |

### Como os cliques funcionam

Os botões não têm `onclick`. Eles têm atributos `data-*`, e um único ouvinte em `js/app.js` decide o que fazer:

```html
<button data-action="register">Registrar</button>   <!-- chama actions.register() -->
<button data-open="EZ-1024">Ver</button>             <!-- abre a ficha do relato -->
```

Para criar uma ação nova, acrescente uma entrada no objeto `actions` de `js/app.js`.

### Como os dados fluem

```
ação da pessoa → EZ.store.commit()/update() → salva no localStorage
                                            → EZ.store.emit()
                                            → EZ.refreshChrome() + página atual .refresh()
```

Outra aba aberta recebe o evento `storage` do navegador e também atualiza (depois de conferir os dados com `EZ.store.isValid`).

## Formato de um relato

```js
{
  id: 'EZ-1024',                 // protocolo
  title: 'Líquido escuro saindo de tubulação no canal',
  category: 'despejo',           // despejo | rede | aspecto | residuos | mortandade | outro
  signs: ['tubulacao', 'odor'],  // chaves de EZ.SIGNS
  severity: 'alta',              // baixa | media | alta
  water: 'canal',                // rio | corrego | canal | praia | lagoa | mangue | rua | outro
  waterName: 'Canal 1',
  place: 'Av. Pinheiro Machado, perto da ponte',
  city: 'Santos', uf: 'SP',
  lat: -23.9515, lng: -46.3503,
  description: '…',
  observed: '2026-11-10',        // data local (AAAA-MM-DD)
  ongoing: true,                 // "acontecendo agora"
  status: 'triagem',             // recebido | triagem | encaminhado | encerrado
  published: true,               // aparece no mapa público
  photo: 'data:image/jpeg…' | 'seed:rio-1' | null,
  photoConsent: true, photoReviewed: true,
  author: 'cidadao-demo',        // na demonstração, "cidadao-demo" é você
  confirmations: 14, confirmedByMe: false,
  closeReason: '', duplicateOf: '',
  createdAt: '2026-11-10T13:20:00.000Z', updatedAt: '…',
  history: [{ status, title, date, note, by, recipient?, external? }],
  seed: true                     // relato de exemplo
}
```

No banco (Supabase), o mesmo relato vira as tabelas `reports`, `report_events` (o `history`) e `confirmations`. Veja [supabase/schema.sql](supabase/schema.sql).

## Chaves no localStorage

| Chave | Conteúdo |
|---|---|
| `esgotozero.v2` | `{ version: 2, savedAt, reports: [...] }` |
| `esgotozero.prefs.v2` | nome, papel (cidadão/gestor), tema, mapa de fundo, menu recolhido, notificações lidas |
| `esgotozero.draft.v2` | rascunho do registro em andamento |
| `esgotozero.demo.v1` | dados da primeira versão (Baixada Santista); relatos criados nela são migrados ao abrir |

Para começar do zero no seu navegador: **Seu perfil → Reiniciar dados**, ou no console `localStorage.clear()`.

## Serviços externos

| Serviço | Para quê | Se falhar |
|---|---|---|
| Esri (ArcGIS Online) | imagens de satélite, ruas e nomes | troca para outro provedor; sem nenhum, os pinos continuam visíveis com um aviso |
| OpenStreetMap | mapa de ruas reserva | idem |
| Photon (Komoot) | busca de endereço no registro | a busca por cidade continua funcionando (lista local) |

Todos são gratuitos e não usam chave de API.

## Botão "voltar" (Android e navegador)

Quando uma janela abre (`#dlg`, `#drawer` ou `#palette`), o `core.js` acrescenta uma entrada "guarda" no histórico. Apertar "voltar" consome essa entrada e fecha a janela de cima, sem trocar de tela. Se a janela for fechada pelo X ou pelo Esc, a guarda é retirada com `history.back()`. Ao navegar para outra tela com a janela aberta, `EZ.ui.dropGuard()` abandona a guarda para não desfazer a navegação. Uma janela nova deve ser aberta por `EZ.ui.modal.open`, `EZ.ui.drawer.open` ou `EZ.palette.open` para entrar nesse controle.

## Responsividade

- Celular: até 767 px de largura. Tablet: 768 a 1023 px. Computador: 1024 px ou mais (menu lateral recolhido até 1279 px).
- Celular deitado (`orientation: landscape` e altura até 500 px): barras menores, lista ao lado do mapa e registro em duas colunas. Em JavaScript, `EZ.isSheet()` diz se o painel inferior arrastável está ativo.
- Telas de toque (`pointer: coarse`): alvos de pelo menos 44 px.
- As regras finas estão no fim de `css/styles.css`, na seção "Responsividade fina e uso como app".

## Acessibilidade

- Diálogos usam `<dialog>` (foco preso, Esc fecha, fundo inerte).
- Todo controle tem rótulo; botões só com ícone têm `aria-label`.
- Contraste verificado com o axe-core nos temas claro e escuro (sem violações na revisão de 12/11/2026).
- Respeita "reduzir movimento" do sistema (`prefers-reduced-motion`).
