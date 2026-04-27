import fs from 'node:fs';
import path from 'node:path';
const seed = Number(process.env.VBH_TASK_SEED || 11); const out=path.join(path.dirname(new URL(import.meta.url).pathname),'artifacts'); fs.mkdirSync(out,{recursive:true});
const frames=[]; for(let i=0;i<96;i++){ const t=i/96, wheel=(i*15)%360; frames.push({frame:i,wheel_deg:wheel,pedal_deg:wheel,body_y:8*Math.sin(2*Math.PI*t),head_deg:7*Math.sin(2*Math.PI*t+Math.PI/2),keypoints:{body:[256,250+8*Math.sin(2*Math.PI*t)],head:[300,210+3*Math.sin(2*Math.PI*t+Math.PI/2)]},summary:`${i}-${Math.round(wheel)}-${Math.round(8*Math.sin(2*Math.PI*t))}`}); }
const manifest={seed,width:512,height:512,fps:24,duration_sec:4,frame_count:96,loop:true,objects:['sky','sea','road','bicycle','wheels','pedals','pelican-body','pelican-head']};
fs.writeFileSync(path.join(out,'scene_manifest.json'), JSON.stringify(manifest,null,2));
fs.writeFileSync(path.join(out,'pelican.anim.json'), JSON.stringify({...manifest,frames},null,2));
