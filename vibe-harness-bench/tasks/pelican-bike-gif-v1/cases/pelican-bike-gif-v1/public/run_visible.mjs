import fs from 'node:fs';
import path from 'node:path';
const root = process.env.VBH_WORKSPACE_DIR;
const art = path.join(root, 'artifacts');
function fail(reason){ console.error(reason); process.exit(1); }
const manifestPath = path.join(art, 'scene_manifest.json');
const animPath = path.join(art, 'pelican.anim.json');
if (!fs.existsSync(manifestPath)) fail('missing scene_manifest.json');
if (!fs.existsSync(animPath)) fail('missing pelican.anim.json');
const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const a = JSON.parse(fs.readFileSync(animPath, 'utf8'));
if (m.width !== 512 || m.height !== 512 || m.fps !== 24 || m.frame_count !== 96) fail('bad manifest dimensions/fps/frame_count');
if (!Array.isArray(a.frames) || a.frames.length !== 96) fail('bad animation frames');
const unique = new Set(a.frames.map(f => JSON.stringify([Math.round(f.wheel_deg), Math.round(f.pedal_deg), Math.round((f.body_y||0)*10), Math.round((f.head_deg||0)*10)])));
if (unique.size < 20) fail('not enough visible frame variation');
console.log(JSON.stringify({verdict:'PASS', reason:'pelican visible schema and variation passed'}));
