import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
import {chromium} from 'playwright';
const root=import.meta.dirname,dest=(process.env.OUTPUT_DIR || path.resolve(root,'../../renders')),ffmpeg=(process.env.FFMPEG_PATH || 'ffmpeg');
const map=JSON.parse(fs.readFileSync(root+'/mapping.json'));
const only=process.argv.find(s=>s.startsWith('--ids='))?.slice(6).split(',');
const preview=process.argv.includes('--preview');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {}),args:['--allow-file-access-from-files']});
try{const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
for(const entry of map.filter(e=>!only||only.includes(e.id))){
 const {id,lesson,kind}=entry;await page.goto('file://'+root+'/index.html?id='+id);await page.evaluate(()=>window.ready);
 const scene=await page.evaluate(()=>window.scene),checks=`${root}/checks/${id}`;fs.mkdirSync(checks,{recursive:true});
 const observed=await page.evaluate(()=>{let order=[],bad=[];for(let n=0;n<300;n++){window.seek(n/30);for(const i of window.visible){if(i.alpha>.1&&!order.some(x=>x.label===i.label))order.push({label:i.label,time:n/30});if(i.bottom>=810)bad.push(i)}}return {order,bad}});
 if(observed.bad.length)throw Error(id+' safe area');fs.writeFileSync(checks+'/timing.json',JSON.stringify(observed,null,2));
 for(const t of [0,1/30,1,2,3,4,5,6,7,8,9,299/30]){await page.evaluate(t=>window.seek(t),t);await page.screenshot({path:checks+'/'+t.toFixed(3)+'.png'});}
 if(preview){console.log(id+' preview');continue;}
 const folder=path.join(dest,String(lesson).padStart(2,'0')+'_第'+lesson+'节',kind+id);fs.mkdirSync(folder,{recursive:true});
 const output=path.join(folder,`${kind}${id}_${scene.title}_10秒_1080P.mp4`);
 if(fs.existsSync(output)){console.log(id+' existing; skip');continue;}
 const ff=spawn(ffmpeg,['-v','error','-f','image2pipe','-vcodec','mjpeg','-r','30','-i','pipe:0','-an','-c:v','libx264','-crf','17','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart','-n',output],{stdio:['pipe','inherit','inherit']});
 for(let n=0;n<300;n++){await page.evaluate(t=>window.seek(t),n/30);const b=await page.screenshot({type:'jpeg',quality:97});if(!ff.stdin.write(b))await once(ff.stdin,'drain');}
 ff.stdin.end();const [code]=await once(ff,'close');if(code)throw Error('render '+id);
 const check=spawnSync(ffmpeg,['-hide_banner','-i',output,'-f','null','-'],{encoding:'utf8'});fs.writeFileSync(checks+'/decode.log',check.stderr);if(check.status)throw Error('decode '+id);
 for(const [name,filter] of [['contact','fps=2,scale=384:216,tile=5x4'],['boundary','select=eq(n\\,0)+eq(n\\,1)+eq(n\\,298)+eq(n\\,299),scale=480:270,tile=4x1']]){const r=spawnSync(ffmpeg,['-v','error','-i',output,'-vf',filter,'-frames:v','1','-y',`${checks}/${name}.png`],{encoding:'utf8'});if(r.status)throw Error(r.stderr);}
 fs.copyFileSync(checks+'/8.000.png',folder+'/预览.png');
 fs.writeFileSync(checks+'/manifest.json',JSON.stringify({...entry,title:scene.title,output,sha256:crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex'),decode:'passed',visual:'pending'},null,2));console.log(id+' rendered decoded');
}
}finally{await browser.close()}
