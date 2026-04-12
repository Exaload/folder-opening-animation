# standard libraries
import hashlib
import json
import subprocess
import sys
from pathlib import Path
from typing import List


def load_version(root: Path) -> str:
    data = json.loads((root / 'package.json').read_text(encoding='utf-8'))
    return data['version']


def _node_bin(root: Path, name: str) -> List[str]:
    bin_dir = root / 'node_modules' / '.bin'
    binary = bin_dir / (f'{name}.cmd' if sys.platform == 'win32' else name)
    if not binary.exists():
        raise FileNotFoundError(f'{name} not found at {binary} — run: npm install')
    return [str(binary)]


def minify_js(code: str, root: Path) -> str:
    cmd = _node_bin(root, 'terser') + ['--compress', '--mangle', '--comments', 'false']
    result = subprocess.run(cmd, input=code, capture_output=True, text=True, encoding='utf-8', cwd=root)
    if result.returncode != 0:
        raise RuntimeError(f'terser failed:\n{result.stderr.strip()}')
    return result.stdout


def minify_css(code: str, root: Path) -> str:
    cmd = _node_bin(root, 'cleancss') + ['-O', '1']
    result = subprocess.run(cmd, input=code, capture_output=True, text=True, encoding='utf-8', cwd=root)
    if result.returncode != 0:
        raise RuntimeError(f'clean-css failed:\n{result.stderr.strip()}')
    return result.stdout


def build() -> None:
    strict = '--strict' in sys.argv
    root = Path(__file__).parent
    version = load_version(root)
    src = root / 'src'
    dist = root / 'dist'
    dist.mkdir(exist_ok=True)

    print(f'[INFO] folder-opening-animation v{version}')

    # JS
    js_src = src / 'folder-animation.js'
    if not js_src.exists():
        print(f'[FATAL] missing: {js_src}', file=sys.stderr)
        sys.exit(1)

    js_raw = js_src.read_text(encoding='utf-8')

    js_out = dist / 'folder-animation.js'
    js_out.write_text(f'/* folder-animation v{version} */\n' + js_raw, encoding='utf-8')
    print(f'[OK] {js_out} ({js_out.stat().st_size / 1024:.1f} KB)')

    js_min_out = dist / 'folder-animation.min.js'
    banner = f'/* folder-animation v{version} | https://github.com/exaload/folder-opening-animation */\n'
    js_min_out.write_text(banner + minify_js(js_raw, root), encoding='utf-8')
    saved = (1 - js_min_out.stat().st_size / js_out.stat().st_size) * 100
    print(f'[OK] {js_min_out} ({js_min_out.stat().st_size / 1024:.1f} KB, -{saved:.0f}%)')

    check = subprocess.run(['node', '--check', str(js_min_out)], capture_output=True, text=True)
    if check.returncode != 0:
        raise RuntimeError(f'syntax check failed:\n{check.stderr.strip()}')
    print('[OK] syntax check passed')

    # CSS
    css_src = src / 'folder-animation.css'
    if not css_src.exists():
        print(f'[FATAL] missing: {css_src}', file=sys.stderr)
        sys.exit(1)

    css_raw = css_src.read_text(encoding='utf-8')

    css_out = dist / 'folder-animation.css'
    css_out.write_text(f'/* folder-animation v{version} */\n' + css_raw, encoding='utf-8')
    print(f'[OK] {css_out} ({css_out.stat().st_size / 1024:.1f} KB)')

    css_min_out = dist / 'folder-animation.min.css'
    css_banner = f'/* folder-animation v{version} | https://github.com/exaload/folder-opening-animation */\n'
    css_min_out.write_text(css_banner + minify_css(css_raw, root), encoding='utf-8')
    saved_css = (1 - css_min_out.stat().st_size / css_out.stat().st_size) * 100
    print(f'[OK] {css_min_out} ({css_min_out.stat().st_size / 1024:.1f} KB, -{saved_css:.0f}%)')

    manifest = {}
    for f in dist.glob('folder-animation*'):
        h = hashlib.md5(f.read_bytes()).hexdigest()[:10]
        manifest[f.name] = f'{f.stem}.{h}{f.suffix}'
    (dist / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print(f'[OK] manifest.json ({len(manifest)} entries)')

    print(f'\nBuild v{version} done.')


if __name__ == '__main__':
    build()
