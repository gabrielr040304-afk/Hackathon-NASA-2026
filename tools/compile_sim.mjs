// Node 24's built-in type erasure: no dependency install or browser build required.
import { stripTypeScriptTypes } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
for (const name of ['model', 'main']) {
  const source = readFileSync(`js/sim/${name}.ts`, 'utf8');
  writeFileSync(`js/sim/${name}.js`, '// Generated from TypeScript by tools/compile_sim.mjs\n' + stripTypeScriptTypes(source));
}
