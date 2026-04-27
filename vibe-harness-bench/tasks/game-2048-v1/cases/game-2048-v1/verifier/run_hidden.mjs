import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
function fail(reason){ console.error(JSON.stringify({verdict:'FAIL_HIDDEN', reason})); process.exit(1); }
const root=process.env.VBH_WORKSPACE_DIR; const mod=await import(pathToFileURL(path.join(root,'src','engine.mjs')));
function eq(a,b){return JSON.stringify(a)===JSON.stringify(b)}
let s=mod.createGame(42, [[2,2,2,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]], false); let m=mod.move(s,'left'); if(!eq(m.board[0],[4,2,0,0])) fail('double merge rule failed'); if(m.score!==4) fail('score merge failed');
s=mod.createGame(42, [[2,4,0,0],[8,16,0,0],[32,64,0,0],[128,256,0,0]], false); m=mod.move(s,'left'); if(!eq(m.board,s.board)||m.score!==s.score||m.rng!==s.rng) fail('noop move spawned tile or advanced state');
let a=mod.createGame(42); for (const d of ['left','up','right','down','left']) a=mod.move(a,d); let b=mod.createGame(42); for (const d of ['left','up','right','down','left']) b=mod.move(b,d); if(!eq(a.board,b.board)||a.score!==b.score) fail('deterministic replay failed');
const round=mod.importReplay(mod.exportReplay(a)); if(!eq(round.board,a.board)||round.score!==a.score) fail('replay import/export mismatch');
const before=mod.createGame(42); const after=mod.move(before,'left'); const undone=mod.undo(after); if(!eq(undone.board,before.board)||undone.score!==before.score||undone.rng!==before.rng) fail('undo does not restore board/score/rng');
const saved=mod.loadState(mod.saveState(a)); if(!eq(saved.board,a.board)||saved.score!==a.score||saved.rng!==a.rng) fail('persistence mismatch');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'); for (const id of ['board','score-value','btn-up','btn-down','btn-left','btn-right','btn-new','btn-undo','btn-export','input-import','overlay-win','overlay-gameover','cell-0-0','cell-3-3']) if(!html.includes(`data-testid="${id}"`)) fail('missing data-testid '+id);
console.log(JSON.stringify({verdict:'PASS', reason:'2048 hidden semantics passed'}));
