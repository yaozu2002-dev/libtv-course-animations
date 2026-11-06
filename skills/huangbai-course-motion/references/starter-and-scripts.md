# 起步工程与素材脚本的使用

这份说明解决“别人拿到整包能否独立运行”。不需要作者电脑的缓存路径、飞书登录或其它已安装技能。先用自己的工程副本运行，不直接在技能目录里积累导出文件。

## 文件作用与依赖

|文件|作用|依赖|
|---|---|---|
|`scripts/extract_white_icons.py`|按人工框将深底纯白面型拆为透明PNG，记录来源坐标|Python 3、Pillow|
|`scripts/icon_contact_sheet.py`|深浅底、原画布与有效范围对照|Python 3、Pillow|
|`assets/approved-icon-boxes.json`|仅对应包内认可整图的已测量坐标|与原图尺寸核对|
|`assets/white-icons/`|认可稿拆出的三枚图标与提取记录|可直接复制|
|`assets/starter/`|三媒介示例：分件、真实中文、可定位时间、可逐帧导出|Node.js 20+、Playwright 1.62.1、Chromium、FFmpeg及所需字体|

示例使用依赖的固定版本以便复现，不声称它是最新版本。可使用已有兼容依赖；升级后需重新试导出。

## 1. 准备Python环境

在自己的工程中创建虚拟环境，不修改系统Python：

```bash
python3 -m venv .venv
```

macOS/Linux：`.venv/bin/python -m pip install Pillow`；Windows：`.venv\Scripts\python.exe -m pip install Pillow`。后续示例的 `python3` 可替换为该环境解释器绝对路径。已有Pillow环境可以直接用。

## 2. 拆出认可整图的三枚图标

下面把路径换成自己解压后的技能目录与工程目录；不依赖固定用户名：

```bash
python3 "/技能目录/scripts/extract_white_icons.py" --image "/技能目录/references/images/approved-imagegen-layout.png" --boxes "/技能目录/assets/approved-icon-boxes.json" --out-dir "/自己的工程/新分件目录"
python3 "/技能目录/scripts/icon_contact_sheet.py" "/自己的工程/新分件目录/text.png" "/自己的工程/新分件目录/image.png" "/自己的工程/新分件目录/video.png" --output "/自己的工程/检查/图标对照"
```

输出目录必须不存在。脚本先完整校验输入，再写PNG与 `extraction.json`，不覆盖原图。`box=[左,上,右,下]`，右/下不包含，坐标基于原图实际像素；`source_size` 必须完全匹配。换一张生图后重新人工测框，不复用旧框。脚本没有自动视觉识别，不会知道框里是图标还是文字。

白底抠法只适用于白面型深底：用RGB最低通道估计白色覆盖率，以 `dark-floor` 和 `white-level` 控制抗锯齿。默认是此样例的可用起点，不保证适合其它图。背景若较亮、图标含彩色/灰阶材质、局部颜色接近背景或出现复杂透明，停止使用阈值法，改用蒙版或真正透明输出。先查看源图，不批量盲抠。

## 3. 复制可运行示例

将整个 `assets/starter/` 文件夹复制到新的工程位置，保留其内部相对路径。里面已经带有背景和三枚图标，不需要再从作者工作区找素材。

在复制后的工程目录运行：

```bash
npm ci
npx playwright install chromium
```

需要安装FFmpeg，并能在终端运行 `ffmpeg -version`。字体为苹方；包内没有分发字体。macOS可使用已安装苹方，示例用 `font.localName=PingFangSC-Medium` 解析本机字体；浏览器未暴露本机字体或在其它系统时，需自行准备有授权的对应字体，在 `composition.json` 中配置字体的完整名称 `font.localName`，或放入工程后填写相对的 `font.file`。没有苹方时明确告知用户并确认替代字体，不能默默换字体冒充同稿。

若使用项目已有浏览器或FFmpeg，可设置 `COURSE_BROWSER`、`COURSE_FFMPEG` 为其可执行文件绝对路径。这是可选兼容入口，不要求机器上存在作者的缓存目录。不要把这些本机路径写入分享包。

## 4. 预览与定位时间

在示例目录用Python静态服务启动（Python标准库）：

```bash
python3 -m http.server 8890 --bind 127.0.0.1
```

在浏览器打开 `http://127.0.0.1:8890/`。空格播放/暂停；控制台调用 `window.setFrame(10)` 可跳到10秒稳定帧。最终画面只包含背景、分件与短标签，不叠加调试文字。字体或图片失败应先解决，不在缺素材状态下交付。

导出前先通过实际浏览器检查稳定画面。模板坐标来自认可稿测量，不能把它当生图前的硬布局，也不能将三媒介直接替换成所有内容的万能三等分模板。新概念需要回到imagegen设计。

## 5. 试导出与完整导出

首次可导出2秒检查字体、边缘和流程，再导出13秒完整示例：

```bash
node render.mjs --out "/自己的工程/outputs/试导出.mp4" --duration 2
node render.mjs --out "/自己的工程/outputs/三媒介.mp4"
```

输出文件不能已存在。脚本使用当前工程的相对素材、浏览器逐帧截图和FFmpeg编码，不调用AI视频接口，不消耗AI视频积分。它是最小可复现示例，长片可换用当前可用的高效渲染框架。

示例明确为**无声设计演示**，导出器只在 `audio.mode=silent-demo` 时运行。带口播的正式课程不能被该无声导出器替代：在剪辑工程/合成框架保留源音轨、对齐口播并输出有声成片。不要为导出方便把有声项目改成silent-demo。

除MP4外，导出器会保存首、中、末的PNG和参数JSON。另用FFprobe检查实际文件，而不是只信JSON：

```bash
ffprobe -v error -show_streams -show_format -of json "/自己的工程/outputs/三媒介.mp4"
ffmpeg -v error -i "/自己的工程/outputs/三媒介.mp4" -f null -
```

第一个命令核实分辨率/时长/帧率/音轨，第二个完整解码检查错误；然后实际播放。截图不是播放检查的替代。

## 6. 改为自己的片段

`composition.json` 的画布、帧率和时长对应交付参数；`referenceWidth/referenceHeight` 对应自己已通过的设计稿实际尺寸；`layers` 分别记录分件或真实文本的框、入场时间、时长与轻位移。它使用独立时间函数，无随机数和依赖真实时钟的动画，拖动或导出任意帧结果一致。

先设计，再写对应分件和测量数据；不要只换三行文字就声称新内容已设计。文字按实际字体基线核对，图标按有效形状比较，不仅比较PNG画布。与真人合成、透明视频、原音轨剪辑和复杂遮罩请使用对应正式工程；这个起点不承诺包办所有剪辑功能。

## 检查技能包是否完整

解压后可直接执行：

```bash
python3 "/技能目录/scripts/verify_assets.py"
```

它按 `assets/manifest.json` 核对清单中的所有文件路径、大小与SHA-256，不安装依赖、不修改内容。若缺图、缺脚本或文件被截断，会逐项报告。它只证明包完整；图标是否有层级问题、画面是否只剩文字，仍按验收清单实际看图。运行脚本产生的临时缓存和自己的导出文件不属于发布包。
