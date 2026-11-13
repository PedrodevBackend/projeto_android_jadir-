#!/usr/bin/env node
/* EsgotoZero · verificação rápida do projeto (não precisa instalar nada além do Node 18+).
   Uso: npm run check   (ou: node scripts/check.mjs)

   Confere:
   1. se todos os arquivos JavaScript têm sintaxe válida;
   2. se todo arquivo citado no index.html, no CSS, no manifest e no sw.js existe de verdade;
   3. se todo ícone usado no código existe em js/icons.js;
   4. se todo arquivo de js/ está na lista do sw.js (senão ele não funciona sem internet).
   Sai com código 1 se encontrar erro (é isso que faz o GitHub Actions marcar a verificação como falha). */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(root, p), 'utf8');
const errors = [], warnings = [];
const err = m => errors.push(m), warn = m => warnings.push(m);

/* 1. sintaxe */
const jsFiles = ['sw.js', ...readdirSync(join(root, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f)];
for (const f of jsFiles) {
  try { new vm.Script(read(f), { filename: f }); }
  catch (e) { err(`Sintaxe inválida em ${f}: ${e.message}`); }
}

/* 2. arquivos citados */
const local = ref => ref && !/^(https?:|data:|mailto:|tel:|#|javascript:|blob:)/.test(ref) && !ref.includes('${');
// base: arquivo a partir do qual o caminho é resolvido (no JS, os caminhos são relativos à página, index.html)
const mustExist = (ref, from, base = from) => {
  const clean = ref.split(/[?#]/)[0];
  if (!clean || clean === './') return;
  const path = normalize(join(dirname(base), clean));
  if (!existsSync(join(root, path))) err(`Arquivo não encontrado: "${ref}" (citado em ${from})`);
};
const html = read('index.html');
for (const m of html.matchAll(/(?:src|href)\s*=\s*"([^"]+)"/g)) if (local(m[1])) mustExist(m[1], 'index.html');
const css = read('css/styles.css');
for (const m of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) if (local(m[1])) mustExist(m[1], 'css/styles.css');
const manifest = JSON.parse(read('manifest.webmanifest'));
for (const ic of manifest.icons || []) mustExist(ic.src, 'manifest.webmanifest');
const sw = read('sw.js');
const shell = [...(sw.match(/const SHELL = \[([\s\S]*?)\];/) || [, ''])[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
for (const f of shell) mustExist(f, 'sw.js');
for (const f of jsFiles.filter(f => f.startsWith('js/'))) for (const m of read(f).matchAll(/'((?:assets|js|css|vendor)\/[^'$]+\.[a-z0-9]{2,5})'/g)) mustExist(m[1], f, 'index.html');

/* 3. ícones */
const sandbox = { window: {} };
vm.runInNewContext(read('js/icons.js'), sandbox);
const icons = new Set(Object.keys(sandbox.window.EZ_ICONS || {}));
const used = new Map();
const add = (name, file) => { if (!used.has(name)) used.set(name, file); };
for (const f of [...jsFiles, 'index.html']) {
  const src = read(f);
  for (const m of src.matchAll(/data-icon="([A-Za-z0-9]+)"/g)) add(m[1], f);
  for (const m of src.matchAll(/\bicon:\s*'([A-Za-z0-9]+)'/g)) add(m[1], f);
  for (const m of src.matchAll(/\bicon\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g)) for (const q of m[1].matchAll(/'([A-Z][A-Za-z0-9]+)'/g)) add(q[1], f);
}
for (const [name, file] of used) if (!icons.has(name)) err(`Ícone "${name}" usado em ${file} não existe em js/icons.js`);

/* 4. modo offline */
for (const f of jsFiles.filter(f => f.startsWith('js/'))) if (!shell.includes(f)) warn(`${f} não está na lista SHELL do sw.js (não vai abrir sem internet)`);
if (!/const CACHE = 'esgotozero-[^']+'/.test(sw)) warn('Não achei a constante CACHE no sw.js');

/* resultado */
for (const w of warnings) console.log('⚠ ' + w);
for (const e of errors) console.log('✖ ' + e);
console.log(errors.length ? `\n${errors.length} erro(s) encontrado(s).` : `\n✔ Tudo certo: ${jsFiles.length} arquivos JS, ${used.size} ícones e ${shell.length} arquivos do modo offline conferidos.`);
process.exit(errors.length ? 1 : 0);
