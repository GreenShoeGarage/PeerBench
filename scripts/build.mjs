import {build} from 'esbuild';
await build({entryPoints:['src/app.js'],outfile:'app.js',bundle:true,minify:true,format:'iife',target:['es2022'],legalComments:'eof'});
await build({entryPoints:['server/server.mjs'],outfile:'server/peerbench.mjs',bundle:true,minify:false,platform:'node',format:'esm',target:['node24'],external:['bufferutil','utf-8-validate'],banner:{js:"import {createRequire as __createRequire} from 'node:module'; const require=__createRequire(import.meta.url);"},legalComments:'eof'});
console.log('Built static app.js and standalone server/peerbench.mjs. No installation or build is needed to run the release.');
