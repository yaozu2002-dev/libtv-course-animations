#!/usr/bin/env python3
"""从已认可的深底纯白面型图中按人工测量框拆出透明分件。需要Pillow。"""
import argparse, hashlib, json, re
from pathlib import Path
from PIL import Image

def extract(image_path, spec_path, output, dark_floor=60, white_level=250):
    source_path, spec_path, output = Path(image_path), Path(spec_path), Path(output)
    if output.exists():
        raise FileExistsError('输出目录已存在，请使用新目录，避免覆盖。')
    if not 0 <= dark_floor < white_level <= 255:
        raise ValueError('阈值须满足 0 <= dark-floor < white-level <= 255。')
    with Image.open(source_path) as source:
        im = source.convert('RGB')
    spec = json.loads(spec_path.read_text(encoding='utf-8'))
    if spec.get('source_size') != list(im.size):
        raise ValueError('source_size须与实际原图宽高完全一致，不能套用别的图的坐标。')
    if not spec.get('icons'):
        raise ValueError('没有图标框。')
    prepared, names = [], set()
    for item in spec['icons']:
        name, box = item['name'], item['box']
        if not re.fullmatch(r'[a-z0-9][a-z0-9_-]*', name) or name in names:
            raise ValueError('图标名须唯一，且仅含小写字母、数字、短横线或下划线。')
        names.add(name)
        if len(box) != 4 or any(type(v) is not int for v in box):
            raise ValueError('box须为四个整数：[左,上,右,下]，右下不包含。')
        x0, y0, x1, y1 = box
        if not (0 <= x0 < x1 <= im.width and 0 <= y0 < y1 <= im.height):
            raise ValueError(f'框越界或为空：{name}')
        crop = im.crop(tuple(box))
        alpha = Image.new('L', crop.size)
        alpha.putdata([max(0, min(255, round((min(rgb)-dark_floor)*255/(white_level-dark_floor)))) for rgb in (crop.get_flattened_data() if hasattr(crop, "get_flattened_data") else crop.getdata())])
        if alpha.getextrema()[1] < 200:
            raise ValueError(f'{name}未检测到足够的白色面型，请检查框或改用蒙版。')
        out = Image.new('RGBA', crop.size, (255,255,255,0))
        out.putalpha(alpha)
        prepared.append((name, box, out))
    # 所有输入通过检查后才创建目录；不会改源图，也不会代替视觉审查。
    output.mkdir(parents=True)
    records = []
    for name, box, out in prepared:
        filename = name + '.png'
        out.save(output/filename)
        records.append({'name':name,'file':filename,'box':box,'size':list(out.size),
                        'alpha_range':list(out.getchannel('A').getextrema())})
    report = {'source_image':source_path.name,'source_sha256':hashlib.sha256(source_path.read_bytes()).hexdigest(),
              'source_size':list(im.size),'method':'white-on-dark-only',
              'dark_floor':dark_floor,'white_level':white_level,
              'status':'extracted-needs-visual-review','icons':records}
    (output/'extraction.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return report

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--image',required=True,type=Path)
    p.add_argument('--boxes',required=True,type=Path)
    p.add_argument('--out-dir',required=True,type=Path)
    p.add_argument('--dark-floor',default=60,type=int)
    p.add_argument('--white-level',default=250,type=int)
    a=p.parse_args()
    try:
        report=extract(a.image,a.boxes,a.out_dir,a.dark_floor,a.white_level)
    except (OSError,ValueError,KeyError,TypeError) as exc:
        p.exit(1,f'{exc}\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__':
    main()
