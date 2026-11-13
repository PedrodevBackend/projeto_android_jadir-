# Como contribuir com o EsgotoZero

Guia para quem do grupo vai continuar o projeto. Leva uns 10 minutos para ler e evita a maior parte dos problemas de trabalho em grupo com Git.

## 1. Preparar o computador (uma vez só)

1. Instale o [Git](https://git-scm.com/downloads), o [VS Code](https://code.visualstudio.com/) e o [Node.js](https://nodejs.org/) (versão LTS; serve para rodar a verificação do projeto).
2. No VS Code, instale as extensões **Live Server** e **EditorConfig**.
3. Configure seu nome e e-mail no Git (o mesmo e-mail da sua conta do GitHub):
   ```bash
   git config --global user.name "Seu Nome"
   git config --global user.email "seu-email@exemplo.com"
   ```
4. Aceite o convite de colaborador que chegou no seu e-mail (enviado pelo dono do repositório).

## 2. Baixar o projeto

```bash
git clone https://github.com/Gustavo-Mota-Dev/esgotozero.git
cd esgotozero
code .
```

Abra o `index.html` com o **Live Server** ("Go Live", no canto inferior direito do VS Code).

> Se o endereço do repositório for outro, copie o certo no botão verde **Code** da página do repositório.

## 3. O jeito de trabalhar: uma branch por tarefa

Ninguém altera a `main` direto. A `main` é sempre a versão que funciona.

```bash
git switch main
git pull                                  # pega o que os colegas já enviaram
git switch -c feature/login-supabase      # cria a sua branch (use um nome que diga a tarefa)
```

Trabalhe normalmente. Quando terminar uma parte:

```bash
npm run check                             # ou: node scripts/check.mjs
git add .
git commit -m "Adiciona tela de login com Supabase"
git push -u origin feature/login-supabase
```

Depois, no GitHub, clique em **Compare & pull request**, descreva o que mudou e peça a revisão de um colega. Quando for aprovado, clique em **Merge pull request**.

Nomes de branch sugeridos: `feature/...` (algo novo), `fix/...` (correção), `docs/...` (documentação).

### Mensagens de commit

Em português, no imperativo, dizendo o que o commit faz: "Corrige filtro por estado", "Adiciona foto no Supabase Storage". Evite "ajustes" ou "update".

### Conflitos

Se o Git avisar de conflito ao fazer `git pull` ou no pull request, abra o arquivo no VS Code: ele mostra as duas versões lado a lado com os botões *Accept Current*, *Accept Incoming* ou *Accept Both*. Escolha, salve, e faça `git add` e `git commit` de novo. Na dúvida, chame quem escreveu a outra parte.

## 4. Antes de abrir o pull request

- [ ] `npm run check` passou sem erro.
- [ ] Testei no navegador do computador **e** no modo celular (F12 → ícone de celular): num celular pequeno ("iPhone SE", 375 px ou menos), num grande e com a tela **deitada**.
- [ ] No celular, o botão "voltar" fecha a janela que eu abri.
- [ ] Testei nos temas claro e escuro.
- [ ] Testei como **Cidadão** e como **Gestor** (seletor no menu lateral).
- [ ] Não há chave, senha ou token no código (veja a seção 6).
- [ ] Se criei um arquivo novo em `js/`, coloquei ele no `index.html` e na lista `SHELL` do `sw.js`, e mudei a versão em `CACHE`.

## 5. Onde mexer para cada coisa

| Quero… | Arquivo |
|---|---|
| mudar cores, espaçamentos, tema escuro | `css/styles.css` (variáveis no começo do arquivo) |
| mudar textos de uma tela | `js/pages.js` |
| mudar o formulário de registro | `js/register.js` |
| mudar a ficha do relato ou o formulário da equipe | `js/ui.js` |
| mudar categorias, sinais, órgãos, dados do ODS 6 ou relatos de exemplo | `js/data.js` |
| mudar como os dados são salvos (ex.: trocar por Supabase) | `js/core.js` → objeto `EZ.store` |
| usar um ícone novo | copie o SVG de [lucide.dev](https://lucide.dev) para `js/icons.js` |
| gerar o APK / mudar o app Android | `apk/` (veja [docs/APK.md](docs/APK.md)); depois de mudar o site, rode `npm run sync` dentro de `apk/` |

Mais detalhes em [docs/ARQUITETURA.md](docs/ARQUITETURA.md).

## 6. Regras do projeto

- **Nunca suba chaves ou senhas para o GitHub.** A chave `anon` do Supabase pode ficar no código do site (ela foi feita para isso, e quem protege os dados são as regras de acesso do banco). A chave `service_role` **nunca**: ela ignora todas as regras.
- Os relatos de exemplo são fictícios e precisam continuar assim. Não coloque nomes de pessoas, empresas ou endereços de casas.
- Mantenha o texto da interface em português, curto e direto.
- Acessibilidade: todo botão com só um ícone precisa de `aria-label`, e o contraste do texto precisa continuar legível nos dois temas.
