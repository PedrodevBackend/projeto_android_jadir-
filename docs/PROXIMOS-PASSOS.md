# Próximos passos

O que já está pronto e o que falta para o EsgotoZero sair da demonstração e funcionar com pessoas de verdade, cada uma no seu celular.

## Onde o projeto está (versão 2.1, 12/11/2026)

**Pronto:** toda a interface (mapa nacional, registro em 3 etapas, meus relatos, painel de gestão, página do ODS 6), temas claro e escuro, uso no celular, modo offline, instalação como app, acessibilidade revisada e verificação automática no GitHub.

**Falta:** hoje os dados ficam no `localStorage` de cada navegador. Ninguém vê o que outra pessoa registrou, e o perfil de gestor é só um botão. Para virar um sistema de verdade, é preciso:

1. um banco de dados compartilhado;
2. login;
3. regras de quem pode ver e alterar o quê;
4. as fotos guardadas num lugar privado.

A proposta é usar o **[Supabase](https://supabase.com)** (gratuito para projetos pequenos), que entrega os quatro de uma vez. O banco já está desenhado e testado em [supabase/schema.sql](supabase/schema.sql).

## Tarefas

Cada tarefa pode virar uma branch e um pull request (veja o [CONTRIBUTING.md](../CONTRIBUTING.md)). A ordem importa: a 1 vem antes de todas.

### 1. Criar o projeto no Supabase · _1 pessoa · ~30 min_
- Criar a conta e um projeto (região: São Paulo).
- SQL Editor → colar e rodar o `docs/supabase/schema.sql`.
- Em *Project Settings → API*, copiar a **Project URL** e a chave **anon public**.
- Criar `js/config.js` com essas duas informações (a chave `anon` pode ir para o GitHub; a `service_role` **nunca**):
  ```js
  window.EZ_CONFIG = { supabaseUrl: 'https://xxxx.supabase.co', supabaseAnonKey: 'eyJ...' };
  ```
- **Pronto quando:** as tabelas `profiles`, `reports`, `report_events` e `confirmations` e o bucket `fotos` aparecem no painel.

### 2. Login · _1 pessoa_
- Carregar o cliente do Supabase no `index.html`, antes de `js/data.js`:
  ```html
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="js/config.js"></script>
  ```
- Criar `js/auth.js` com `supabase.auth.signInWithOtp({ email })` (link mágico por e-mail, sem senha) e `signOut()`.
- Trocar o seletor Cidadão/Gestor (`EZ.setRole` em `js/ui.js`) pelo papel que vem da tabela `profiles`. `EZ.ME` passa a ser o `user.id`.
- Quem não fez login continua vendo o mapa público; ao clicar em "Registrar ocorrência", pede o login.
- **Pronto quando:** dá para entrar com o e-mail, o nome aparece no topo e um gestor promovido pelo SQL vê o painel de gestão.

### 3. Trocar o armazenamento local pelo banco · _1 ou 2 pessoas · a maior tarefa_
Quase tudo passa por `EZ.store` em `js/core.js`. A ideia é manter o mesmo formato de relato que a interface já usa (descrito em [ARQUITETURA.md](ARQUITETURA.md)) e converter na entrada e na saída:

| Hoje (`js/core.js`) | Com Supabase |
|---|---|
| `store.load()` lê o `localStorage` | `select` em `reports` + `report_events` e converte com `fromDb()` |
| `store.commit()` ao criar relato (`js/register.js`, `submit()`) | `insert` em `reports` |
| `EZ.saveManage()` (`js/ui.js`) | `update` em `reports` + `insert` em `report_events` |
| `EZ.toggleConfirm()` (`js/ui.js`) | `insert`/`delete` em `confirmations` |
| evento `storage` entre abas (`js/app.js`) | `supabase.channel(...)` (Realtime), opcional |

Exemplo de conversão:
```js
const fromDb = (row, events) => ({
  id: row.protocol, dbId: row.id, title: row.title, category: row.category, signs: row.signs,
  severity: row.severity, water: row.water, waterName: row.water_name, place: row.place,
  city: row.city, uf: row.uf, lat: row.lat, lng: row.lng, description: row.description,
  observed: row.observed, ongoing: row.ongoing, status: row.status, published: row.published,
  photo: row.photo_path, photoConsent: row.photo_consent, photoReviewed: row.photo_reviewed,
  author: row.author_id, confirmations: row.confirmations, closeReason: row.close_reason || '',
  duplicateOf: row.duplicate_of || '', createdAt: row.created_at, updatedAt: row.updated_at,
  history: events.map(e => ({ status: e.status, title: e.title, date: e.created_at, note: e.note,
    by: 'Equipe EsgotoZero', recipient: e.recipient, external: e.external_protocol }))
});
```
Atenção: as funções do banco são assíncronas (`await`). As funções que hoje devolvem `true/false` na hora vão precisar mostrar um "Salvando…" e tratar erro com `EZ.ui.toast(..., { type: 'error' })`.
- **Pronto quando:** um relato criado no celular de uma pessoa aparece no painel de gestão em outro computador e, depois de publicado, no mapa de todo mundo.

### 4. Fotos no Storage · _1 pessoa · depende da 3_
- Em `EZ.handlePhoto` (`js/register.js`) a foto já é reduzida para 1280 px. No envio, converter o `dataURL` em `Blob` e mandar para `fotos/<id do usuário>/<id aleatório>.jpg` com `supabase.storage.from('fotos').upload(...)`.
- Guardar só o caminho em `reports.photo_path`.
- Para mostrar, gerar um link temporário com `createSignedUrl(caminho, 3600)`. As regras do bucket já garantem que só o autor, a equipe e, depois da revisão, o público consigam abrir.
- **Pronto quando:** a foto aparece para o autor e para o gestor, e só aparece no mapa público depois de marcada "Exibir a foto".

### 5. Retirar o que é só da demonstração · _1 pessoa_
- Tirar os relatos fictícios (`EZ.makeSeed`) da versão real, ou deixá-los só num modo "demonstração".
- Trocar os textos "demonstração" e "simulado" (procure por essas palavras no código).
- Remover "Reiniciar dados".

### 6. Página de privacidade (LGPD) · _1 pessoa_
- Explicar que dados são coletados (e-mail, localização do ponto, foto), para quê e por quanto tempo, e como pedir a exclusão.
- Linkar no rodapé e no passo 3 do registro.

### 7. Testes automáticos (opcional, conta pontos) · _1 pessoa_
- Testes de ponta a ponta com [Playwright](https://playwright.dev): registrar um relato, revisar como gestor e verificar que aparece no mapa.
- Rodar no GitHub Actions, junto da verificação que já existe (`.github/workflows/verificar.yml`).

## Sugestão de divisão

| Pessoa | Tarefas |
|---|---|
| A | 1 e 2 (Supabase e login) |
| B | 3 (banco no lugar do localStorage) |
| C | 4 e 5 (fotos e limpeza da demonstração) |
| D | 6 e 7 (privacidade e testes) e revisão dos pull requests |

## Ideias para depois

- Notificação por e-mail quando o andamento mudar (Supabase Edge Functions).
- Encaminhamento real ao órgão com um modelo de e-mail pronto.
- Página pública de cada órgão com quantos relatos recebeu e quantos respondeu.
- Exportar os dados públicos em formato aberto (CSV/GeoJSON) para pesquisa.
