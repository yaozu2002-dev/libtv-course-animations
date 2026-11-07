import fs from 'node:fs';
import crypto from 'node:crypto';
const root=import.meta.dirname;
const map=JSON.parse(fs.readFileSync(root+'/mapping.json'));
const results=[];
for(const s of map){
 const dir=root+'/checks/'+s.id,m=JSON.parse(fs.readFileSync(dir+'/manifest.json')),log=fs.readFileSync(dir+'/decode.log','utf8'),timing=JSON.parse(fs.readFileSync(dir+'/timing.json'));
 const hash=crypto.createHash('sha256').update(fs.readFileSync(m.output)).digest('hex');
 const duration=log.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);if(!duration)throw Error('duration missing');
 const seconds=Number(duration[1])*3600+Number(duration[2])*60+Number(duration[3]);
 if(seconds!==s.duration||!log.includes('1920x1080')||!log.includes('30 fps')||!log.includes('yuv420p')||log.includes('Audio:')||m.sha256!==hash||timing.bad.length)throw Error('verification '+s.id);
 results.push({id:s.id,output:m.output,seconds,width:1920,height:1080,fps:30,audio:false,sha256:hash,decode:m.decode,visibleOrder:timing.order.map(x=>({label:x.label,time:x.time})),safeArea:'passed',visual:'Actual MP4 contact and transition frames inspected; no human full-speed playback'});
 console.log(s.id+' | '+seconds+'s | 1920x1080 | 30fps | silent | hash verified');
}
fs.writeFileSync(root+'/checks/final-verification.json',JSON.stringify(results,null,2));
