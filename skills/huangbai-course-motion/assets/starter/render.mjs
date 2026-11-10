import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,access,mkdir,writeFile} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {resolve,dirname,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
const root=dirname(fileURLToPath(import.meta.url));
const args=process.argv.slice(2), at=args.indexOf('--out'),durationAt=args.indexOf('--duration');
if(at<0||!args[at+1])throw Error('用法：node render.mjs --out /绝对路径/新文件.mp4 [--duration 2]');
const output=resolve(args[at+1]), config=JSON.parse(await readFile(resolve(root,'composition.json'),'utf8'));
const duration=durationAt>=0?Number(args[durationAt+1]):config.duration;
if(!Number.isFinite(duration)||duration<=0||duration>config.duration)throw Error('试导出时长须大于0且不超过composition.json中的时长。');
if(config.audio?.mode!=='silent-demo')throw Error('此起步导出器只处理明确无声的设计演示；有声课程请回到能保留原音轨的正式合成流程。');
try{await access(output);throw Error('输出文件已存在，请换新文件名。')}catch(e){if(e.code!=='ENOENT')throw e}
const ffmpeg=process.env.COURSE_FFMPEG||'ffmpeg';
if(spawnSync(ffmpeg,['-version'],{stdio:'ignore'}).status!==0)throw Error('找不到FFmpeg，请安装后重试，或用COURSE_FFMPEG指定其可执行文件。');
await mkdir(dirname(output),{recursive:true});
const mime={'.html':'text/html','.json':'application/json','.png':'image/png','.woff2':'font/woff2','.ttf':'font/ttf','.otf':'font/otf'};
const server=createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+sep)){res.writeHead(403).end();return}await access(file);res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');createReadStream(file).pipe(res)}catch{res.writeHead(404).end()}});
let browser,ff;
try{
 server.listen(0,'127.0.0.1');await once(server,'listening');const port=server.address().port;
 browser=await chromium.launch({headless:true,...(process.env.COURSE_BROWSER?{executablePath:process.env.COURSE_BROWSER}:{})});
 const page=await browser.newPage({viewport:{width:config.width,height:config.height},deviceScaleFactor:1});
 await page.goto(`http://127.0.0.1:${port}/`);await page.waitForFunction(()=>window.courseReady||window.courseError);const error=await page.evaluate(()=>window.courseError||null);if(error)throw Error(error);
 const frames=Math.round(duration*config.fps),shots=[0,Math.floor(frames/2),frames-1];
 ff=spawn(ffmpeg,['-hide_banner','-loglevel','error','-n','-f','image2pipe','-vcodec','mjpeg','-r',String(config.fps),'-i','pipe:0','-an','-vf','scale=in_range=full:out_range=tv','-color_range','tv','-c:v','libx264','-crf','18','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',output],{stdio:['pipe','inherit','inherit']});
 let processError=null;ff.once('error',e=>{processError=e});ff.stdin.on('error',e=>{processError=e});const closed=once(ff,'close');
 for(let i=0;i<frames;i++){if(processError)throw processError;await page.evaluate(t=>window.setFrame(t),i/config.fps);if(shots.includes(i))await page.screenshot({path:output+`.frame-${i}.png`});const bytes=await page.screenshot({type:'jpeg',quality:95});if(!ff.stdin.write(bytes))await Promise.race([once(ff.stdin,'drain'),closed.then(()=>{throw Error('FFmpeg提前退出')})]);if(i%120===0)console.log(`已渲染 ${i}/${frames} 帧`)}
 ff.stdin.end();const [code]=await closed;if(code!==0||processError)throw processError||Error('FFmpeg导出失败：'+code);
 await writeFile(output+'.json',JSON.stringify({duration:frames/config.fps,width:config.width,height:config.height,fps:config.fps,audio:false,mode:'silent-design-demo',status:'rendered-needs-playback-review'},null,2));console.log('已导出：'+output);
}finally{if(ff&&ff.exitCode===null)ff.kill();if(browser)await browser.close();server.close()}
