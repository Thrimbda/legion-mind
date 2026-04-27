import { pathToFileURL } from 'node:url'; import path from 'node:path';
function fail(r){console.error(r);process.exit(1)}
const mod=await import(pathToFileURL(path.join(process.env.VBH_WORKSPACE_DIR,'src','engine.mjs')));
let s=mod.createGame(42); s=mod.move(s,'left'); if(!s.board||s.board.length!==4) fail('bad board shape');
const exp=mod.exportReplay(s); const imp=mod.importReplay(exp); if(JSON.stringify(imp.board)!==JSON.stringify(s.board)) fail('replay smoke mismatch');
console.log(JSON.stringify({verdict:'PASS', reason:'2048 visible move/replay smoke passed'}));
