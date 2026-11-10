#!/usr/bin/env python3
"""核对技能包内清单路径、文件大小与SHA-256；不修改文件，不代替审美检查。"""
import argparse,hashlib,json
from pathlib import Path
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1])
a=p.parse_args();root=a.root.resolve();manifest=json.loads((root/'assets/manifest.json').read_text(encoding='utf-8'));errors=[];seen=set()
for item in manifest['items']:
    relative=item['path'];f=(root/relative).resolve()
    if relative in seen or not f.is_relative_to(root):
        errors.append('重复或越界路径：'+relative);continue
    seen.add(relative)
    if not f.is_file():
        errors.append('缺少文件：'+relative);continue
    data=f.read_bytes()
    if len(data)!=item['bytes'] or hashlib.sha256(data).hexdigest()!=item['sha256']:
        errors.append('大小或校验值不一致：'+relative)
print(json.dumps({'ok':not errors,'checked':len(seen),'errors':errors},ensure_ascii=False,indent=2))
raise SystemExit(1 if errors else 0)
