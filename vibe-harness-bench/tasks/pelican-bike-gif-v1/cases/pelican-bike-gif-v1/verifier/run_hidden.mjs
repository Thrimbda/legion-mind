import fs from 'node:fs';
import path from 'node:path';
function fail(reason){ console.error(JSON.stringify({verdict:'FAIL_HIDDEN', reason})); process.exit(1); }
const root = process.env.VBH_WORKSPACE_DIR;
const art = path.join(root, 'artifacts');
if (fs.existsSync(path.join(root, 'make.mjs'))) await import('file://' + path.join(root, 'make.mjs'));
for (const file of ['scene_manifest.json', 'pelican.anim.json']) {
  if (!fs.existsSync(path.join(art, file))) fail('missing ' + file);
}
const m = JSON.parse(fs.readFileSync(path.join(art, 'scene_manifest.json'), 'utf8'));
const a = JSON.parse(fs.readFileSync(path.join(art, 'pelican.anim.json'), 'utf8'));
if (m.width !== 512 || m.height !== 512 || m.fps !== 24 || m.frame_count !== 96 || a.width !== 512 || a.height !== 512 || a.fps !== 24) fail('dimensions/fps/frame_count mismatch');
if (Number(m.seed) !== Number(process.env.VBH_TASK_SEED)) fail('seed mismatch');
if (!Array.isArray(a.frames) || a.frames.length !== 96) fail('missing 96 frames');
const by = new Map(a.frames.map(f => [f.frame, f]));
for (const k of [0,24,48,72,95]) if (!by.has(k)) fail('missing keyframe '+k);
let wheelMoves=0, syncMax=0;
for (let i=1;i<a.frames.length;i++) { const prev=a.frames[i-1], cur=a.frames[i]; const delta=(cur.wheel_deg-prev.wheel_deg+360)%360; if (delta <= 0 || delta > 60) fail('wheel not monotonic/wrapped at frame '+i); wheelMoves += delta; syncMax=Math.max(syncMax, Math.abs(((cur.pedal_deg-cur.wheel_deg+540)%360)-180)); }
if (wheelMoves < 500) fail('wheel variation too small');
if (syncMax > 3) fail('pedal/wheel desync');
const ys=a.frames.map(f=>f.body_y), heads=a.frames.map(f=>f.head_deg);
const ampY=Math.max(...ys)-Math.min(...ys), ampH=Math.max(...heads)-Math.min(...heads);
if (ampY < 4 || ampY > 30) fail('body bob amplitude out of bounds');
if (ampH < 3 || ampH > 25) fail('head secondary motion amplitude out of bounds');
let samePhase=0; for (let i=0;i<a.frames.length;i++) if (Math.sign(ys[i]) === Math.sign(heads[i])) samePhase++;
if (samePhase > 82) fail('head motion lacks secondary phase');
const first=a.frames[0], last=a.frames[95]; const nextWheel=(last.wheel_deg + ((a.frames[1].wheel_deg-a.frames[0].wheel_deg+360)%360))%360;
if (Math.abs(nextWheel-first.wheel_deg)>3) fail('wheel loop continuity failed');
if (Math.abs(last.body_y-first.body_y)>2.5 || Math.abs(last.head_deg-first.head_deg)>2.5) fail('body/head loop continuity failed');
console.log(JSON.stringify({verdict:'PASS', reason:'pelican hidden motion semantics passed'}));
