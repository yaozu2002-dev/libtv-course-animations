import fs from 'node:fs';
import assert from 'node:assert/strict';
const root=import.meta.dirname;
// 独立依据飞书口播核对，不从待测 scenes 数组生成期望。
const expected={
'01-02':['创意','脚本','分镜','素材准备','图片生成','视频生成','声音','剪辑','成片'],
'3-1':['Prompt · 指令','文字','图片','标注'],
'3-2':['提示词','模板','技巧'],
'3-3':['任务','画面描述','参考','约束'],
'3-4':['构图','光影','风格','参考资料','风格模板'],
'3-5':['表达需求','修改图片','选择模型','前后操作'],
'3-6':['场景','人物','设计','道具'],
'4-1':['人物','场景','生成模式','模型对比','提示词','快捷工具','声音生成'],
'4-2':['主体','风格','动作','限制','声音'],
'5-1':['告诉它目标','Agent','组织操作'],
'6-1':['角色更鲜明','镜头更有感觉','动作更精准','角色造型室','导演执导','3D-BOX'],
'8-1':['送药','送药 · 误判','装瞎揭晓','被识破','史书','圣旨','留下悬念']
};
let count=0;for(const [id,want] of Object.entries(expected)){const file=`${root}/checks/${id}/timing.json`;if(!fs.existsSync(file)){console.log(id+' pending');continue;}const got=JSON.parse(fs.readFileSync(file));assert.deepEqual(got.order.map(i=>i.label),want,id);assert.equal(got.bad.length,0,id);console.log(id+' order/safe-area passed');count++;}console.log(count+' checked');
