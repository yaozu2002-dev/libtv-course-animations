#!/usr/bin/env python3
"""Read PNG/icon inputs and write a dark/light contact sheet plus geometry report.
Requires Pillow. Does not edit source assets or judge visual-family consistency.
"""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageDraw


def build(inputs, prefix):
    prefix = Path(prefix)
    png, report = prefix.with_suffix('.png'), prefix.with_suffix('.json')
    if png.exists() or report.exists():
        raise FileExistsError('Output exists; choose a new output prefix.')
    images, metrics = [], []
    for value in inputs:
        path = Path(value)
        with Image.open(path) as source:
            has_alpha = 'A' in source.getbands() or 'transparency' in source.info
            im = source.convert('RGBA')
        alpha = im.getchannel('A')
        # Ignore very faint outer glow only for measurement; preserve it in displayed assets.
        bbox = alpha.point(lambda x: 255 if x >= 32 else 0).getbbox()
        if bbox is None:
            raise ValueError(f'No visible pixels: {path.name}')
        x0, y0, x1, y1 = bbox
        metrics.append({'file':str(path), 'size':[im.width, im.height],
                        'has_alpha':has_alpha, 'alpha_range':list(alpha.getextrema()),
                        'visible_bbox':list(bbox),
                        'bbox_fraction':[round((x1-x0)/im.width,4), round((y1-y0)/im.height,4)],
                        'bbox_center_fraction':[round((x0+x1)/2/im.width,4),round((y0+y1)/2/im.height,4)]})
        images.append((im, bbox))
    cell, pad, top = 300, 24, 32
    cols = len(images)
    sheet = Image.new('RGB', (cols*cell+2*pad, 3*cell+top+2*pad), '#111320')
    draw = ImageDraw.Draw(sheet)
    # Row 1 uses full source canvas; rows 2/3 use measured ink bounds.
    for row, bg in enumerate(['#080b17','#080b17','#f4f1ff']):
        for col, (im, bbox) in enumerate(images):
            left, upper = pad+col*cell, top+pad+row*cell
            draw.rectangle((left, upper, left+cell-8, upper+cell-8), fill=bg)
            thumb = im.copy() if row == 0 else im.crop(bbox)
            thumb.thumbnail((cell-56,cell-64), Image.Resampling.LANCZOS)
            at = (left+(cell-8-thumb.width)//2, upper+(cell-8-thumb.height)//2)
            sheet.paste(thumb, at, thumb)
            draw.text((left+12,upper+12), f'{col+1:02d}', fill='#8a7bac')
    draw.text((pad,12),'01 full canvas / 02 ink bounds / 03 light background', fill='#ded8f3')
    prefix.parent.mkdir(parents=True,exist_ok=True)
    sheet.save(png)
    report.write_text(json.dumps({'rows':['full-canvas-dark','ink-bounds-dark','ink-bounds-light'],
        'measurement_alpha_threshold':32,'visual_family_pass':None,'items':metrics},ensure_ascii=False,indent=2))
    return png, report


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('inputs',nargs='+',type=Path)
    p.add_argument('--output',required=True,type=Path,help='New output prefix; writes .png and .json')
    a=p.parse_args()
    if len(a.inputs)<2:
        p.error('Provide at least two icons for comparison.')
    try:
        result=build(a.inputs,a.output)
    except (OSError,ValueError) as exc:
        p.exit(1,f'{exc}\n')
    print('\n'.join(str(x) for x in result))

if __name__=='__main__':
    main()
