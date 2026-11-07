import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
import http from 'node:http';
import {chromium} from 'playwright';
const root=import.meta.dirname,dest=(process.env.OUTPUT_DIR || path.resolve(root,'../../renders')),ff=(process.env.FFMPEG_PATH || 'ffmpeg');
const map=JSON.parse(fs.readFileSync(root+'/mapping.json')),preview=process.argv.includes('--preview'),only=process.argv.find(s=>s.startsWith('--ids='))?.slice(6).split(',');
const server=http.createServer((req,res)=>{try{const p=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));res.setHeader('Content-Type',p.endsWith('.html')?'text/html; charset=utf-8':p.endsWith('.svg')?'image/svg+xml':p.endsWith('.json')?'application/json':'image/png');res.end(fs.readFileSync(p))}catch{res.writeHead(404);res.end()}});server.listen(0,'127.0.0.1');await once(server,'listening');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {}),args:['--allow-file-access-from-files']});
try{const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});for(const s of map.filter(s=>!only||only.includes(s.id))){
 await page.goto('http://127.0.0.1:'+server.address().port+'/index.html?id='+encodeURIComponent(s.id));await page.evaluate(()=>window.ready);const checks=root+'/checks/'+s.id;fs.mkdirSync(checks,{recursive:true});
 const observed=await page.evaluate(()=>{let order=[],bad=[];for(let n=0;n<window.scene.duration*30;n++){window.seek(n/30);for(const v of window.visible){if(v.alpha>.1&&!order.some(o=>o.label===v.label))order.push({...v,time:n/30});if(v.alpha>.1&&v.bottom>=810)bad.push(v)}}return {order,bad}});if(observed.bad.length)throw Error('safe area '+s.id);fs.writeFileSync(checks+'/timing.json',JSON.stringify(observed,null,2));
 if(s.type==='prompt'){const expected=s.id==='3-3'?['任务','画面描述','参考','约束']:['主体','风格','动作','限制','声音'];if(JSON.stringify(observed.order.map(x=>x.label))!==JSON.stringify(expected))throw Error('order mismatch')}
 await page.evaluate(t=>window.seek(t),s.duration-1);await page.screenshot({path:checks+'/preview.png'});if(preview){console.log(s.id+' preview checked');continue}
 const folder=path.join(dest,String(s.lesson).padStart(2,'0')+'_第'+s.lesson+'节',s.folder);fs.mkdirSync(folder,{recursive:true});const output=folder+'/'+s.title+'_'+s.duration+'秒_1080P.mp4';if(fs.existsSync(output)&&!process.argv.includes('--replace')){console.log(s.id+' exists');continue}
 const p=spawn(ff,['-v','error','-f','image2pipe','-vcodec','mjpeg','-r','30','-i','pipe:0','-an','-c:v','libx264','-crf','17','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',process.argv.includes('--replace')?'-y':'-n',output],{stdio:['pipe','inherit','inherit']});
 for(let n=0;n<s.duration*30;n++){const data=await page.evaluate(t=>{window.seek(t);return document.querySelector('canvas').toDataURL('image/jpeg',.97).split(',')[1]},n/30);if(!p.stdin.write(Buffer.from(data,'base64')))await once(p.stdin,'drain')}
 p.stdin.end();const [code]=await once(p,'close');if(code)throw Error('encode '+s.id);
 const dec=spawnSync(ff,['-hide_banner','-i',output,'-f','null','-'],{encoding:'utf8'});fs.writeFileSync(checks+'/decode.log',dec.stderr);if(dec.status)throw Error('decode');
 const events=s.times??(s.type==='modes'?[.25,.37,.49,.9,3.7,6.5]:[.3,1]);const frames=[0,1,s.duration*30-2,s.duration*30-1,...events.flatMap(t=>[-1,0,8,18,30].map(d=>Math.max(0,Math.round(t*30)+d)))];
 for(const [name,filter]of [['contact',`fps=10/${s.duration},scale=480:270,tile=5x2`],['transitions',`select=${[...new Set(frames)].sort((a,b)=>a-b).map(n=>`eq(n\\,${n})`).join('+')},scale=384:216,tile=5x7`]]){const r=spawnSync(ff,['-v','error','-i',output,'-vf',filter,'-frames:v','1','-y',checks+'/'+name+'.png'],{encoding:'utf8'});if(r.status)throw Error(r.stderr)}
 const still=spawnSync(ff,['-v','error','-ss',String(s.duration-1),'-i',output,'-frames:v','1','-y',folder+'/'+s.title+'_预览.png'],{encoding:'utf8'});if(still.status)throw Error(still.stderr);
 fs.writeFileSync(checks+'/manifest.json',JSON.stringify({...s,output,sha256:crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex'),decode:'passed',visual:'pending'},null,2));console.log(s.id+' rendered and decoded');
}}finally{await browser.close();server.close()}
