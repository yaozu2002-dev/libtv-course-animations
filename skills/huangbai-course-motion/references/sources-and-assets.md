# 来源、状态与素材位置

## 用户确认的含义

2026-11-07的最新反馈：首批五条中的“排分镜”图标层级过多；部分段落全是文字也不好。新增两张原始截图作明确反例，不收入可用图标库。当前仅补全技能与上传，不重跑五条，不把这次文档更新说成已修复成片。新的简化分镜与图形化四要素方案尚未生成/验收。


最新反馈优先：用户先接受白色面型图标方向，但指出第一张主体太大、画面太满；随后要求把设计权交给imagegen，提供专业设计师角色与基本平面设计原则，由它自主决定构图、尺寸和间距。结果 `approved-imagegen-layout.png` 获明确认可：“这样就很好！” 这项认可覆盖该图构图、留白与白色面型方向。之后已制作首批五条试片，但不等于整批验收；2026-11-07的最新问题与反例优先。

2026-11-06，用户认可第二版的整体视觉风格，并要求建立详细技能；同时明确指出“文字、图片、视频”三个图标不像同一系列。将整体认可和局部拒绝分别记录，不把演示成片笼统标为全部通过。

主参考：[LibTv-黄白老师ai课程](https://cimvxfyr9qv.feishu.cn/wiki/YsJMw4sFhiQCoMk8ohEcJZIHnnb)。读取时正文版本311，字体要求为苹方，参考以“修改”列蓝紫方案为准；原金色列为旧设计。该版本不是永久最新，后续用户指定更新时重新读取。

阅读方法：优先飞书CLI，先确认身份并读对应技能；正文 `lark-cli docs +fetch --as user --doc <该链接>`；图片预览用 `docs +media-preview`。原文还含字体包、约1.1GB设计文件与抖音参考，本包没有下载和打包这些大附件，也未观看抖音参考，不得声称已完整分析它们。需要时按任务读取对应原始文件；不因获取参考而改动原文。

## 可用素材与参考图

|路径|状态和用途|
|---|---|
|`references/images/approved-imagegen-layout.png`|最新明确认可的整图参考，当前构图/留白/图标方向优先；不是用于生成视频的强制首帧|
|`references/images/overfull-white-icons.png`|白色面型方向可用，但主体过大、画面过满的反例，不能照搬布局|
|`assets/background.png`|已认可方向中的深蓝紫背景，可用于新工程，仍按镜头检查亮度与尺寸|
|`assets/design-tokens.json`|试排起点，可按用户当次指定调整|
|`assets/white-icons/`|从认可整图拆出的文档/照片/视频透明分件；提取已检查，不代表新图标自动通过|
|`assets/starter/`|认可稿三媒介的可运行还原示例；仅无声设计演示，不是通用布局模板|
|`references/images/rejected-nested-storyboard.png`|2026-11-07用户指出图标内部嵌套过多的反例|
|`references/images/rejected-text-only-concepts.png`|2026-11-07用户指出概念画面全是文字的反例|
|`assets/shot-spec.json`|记录真实片段、屏幕词、素材与动作的空值模板|
|`references/images/packaging-keywords.jpg`|飞书修改列花字参考；保留材质语言，按用户要求减字减装饰|
|`references/images/packaging-fullscreen.jpg`|飞书修改列全屏样式参考|
|`references/images/packaging-icons.jpg`|飞书修改列箭头/鼠标等小元素，参考配色及材质，并非已批准的通用图标库|
|`references/images/keyframe-board.png`|第二版生成关键帧；仅整体风格认可，底部图标不得视为系列标准|
|`references/images/rejected-icon-family.png`|第二版实际输出的节点画面，图标系列不一致的反例|
|`references/examples/starter-demo.mp4`|新起步工程实测13秒、1080p/30帧、无声的三媒介还原示例；只作可复现用法演示，不代表新的整批成片验收|
|`references/examples/style-demo.mp4`|27秒第二版节奏演示，无声、未对齐真人口播；最后一段含被指出的问题，不是最终课程成片|

图标原图与失败分件不放在可用assets下，避免被自动复用。需要新图标时按整组规则重做。真人参考图没有打包；涉及人像使用用户当次提供的原始素材，不从失败演示或参考人物凭空生成身份。

`assets/manifest.json`记录打包资产和来源的校验值。文件路径以技能根目录为基准，不依赖原工作目录。新任务先将实际要用的素材复制到该工程，不把机器临时路径写进成片。
