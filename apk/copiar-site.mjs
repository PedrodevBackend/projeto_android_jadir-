/* Copia os arquivos do site (pasta acima) para apk/www, que é o que vai dentro do app.
   Rode sempre que o site mudar:  npm run sync   (copia e atualiza o projeto Android) */
import { rm, mkdir, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const aqui = dirname(fileURLToPath(import.meta.url));
const site = join(aqui, '..');
const www = join(aqui, 'www');
const itens = ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'assets', 'vendor'];

await rm(www, { recursive: true, force: true });
await mkdir(www, { recursive: true });
for (const item of itens) {
  if (!existsSync(join(site, item))) { console.error(`Faltou "${item}" na pasta do site.`); process.exit(1); }
  await cp(join(site, item), join(www, item), { recursive: true });
}
console.log(`Site copiado para apk/www (${itens.length} itens). Agora: npx cap sync android`);
