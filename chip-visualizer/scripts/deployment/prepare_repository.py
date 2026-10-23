"""Prepare an inspected LOCAL checkout. Never stage, commit, push, or deploy."""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

WEB = Path(__file__).resolve().parents[2]
DEST = WEB / '.tooling/deployment/repository'
EXPECTED = '9480eff2aa8ee3ad64b2c5d49570caa123741eef'
ORIGIN = 'https://github.com/nguyen-ky2910/WEB_GEMM_ASIC_SKY130'
SKIP = {'node_modules', 'dist', '.tooling', 'test-results', 'playwright-report', '__pycache__', '.git'}
TOP_DIRS = {'src', 'public', 'demo-data', 'docs', 'scripts', 'tests', 'deployment'}
TOP_FILES = {'.gitignore', 'index.html', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml',
             'eslint.config.js', 'tsconfig.json', 'vite.config.ts', 'playwright.config.ts'}
BANNED = {'.gds', '.oas', '.odb', '.def', '.lef', '.spef', '.sdf', '.lib', '.db', '.vcd', '.pem', '.key', '.zip', '.gz'}

def git(*args):
    return subprocess.check_output(['git', '-C', str(DEST), *args])

def digest(data):
    return hashlib.sha256(data).hexdigest()

def main():
    if DEST.resolve().parent != (WEB / '.tooling/deployment').resolve() or not (DEST / '.git').is_dir():
        raise RuntimeError('Unexpected checkout location')
    if git('remote', 'get-url', 'origin').decode().strip().removesuffix('.git') != ORIGIN:
        raise RuntimeError('Unexpected remote')
    if git('rev-parse', 'HEAD').decode().strip() != EXPECTED:
        raise RuntimeError('Remote checkout changed: inspect before preparing')
    tracked = git('ls-files', '-z').decode().rstrip('\0').split('\0')
    workflow = '.github/workflows/deploy.yml'
    # Git applies this checkout's line-ending filters; preserve exact working bytes too.
    changed = set(filter(None, git('diff', '--name-only', '-z', 'HEAD').decode().split('\0')))
    if changed - {workflow}:
        raise RuntimeError(f'Existing repository files modified: {sorted(changed)}')
    original_hashes = {name: digest((DEST / name).read_bytes()) for name in tracked if name != workflow}
    previous_file = WEB / '.tooling/deployment/source-manifest.json'
    previous = json.loads(previous_file.read_text()) if previous_file.exists() else {}
    selected = []
    import os
    for directory, dirs, names in os.walk(WEB):
        parent = Path(directory).relative_to(WEB)
        dirs[:] = [d for d in dirs if d not in SKIP and (parent.parts or d in TOP_DIRS)]
        for name in names:
            rel = parent / name
            file = WEB / rel
            if not parent.parts and name not in TOP_FILES and file.suffix != '.md':
                continue
            if file.suffix == '.tsbuildinfo' or name.endswith('.pyc'):
                continue
            if file.is_symlink() or file.suffix.lower() in BANNED or file.stat().st_size > 5 * 1024 * 1024:
                raise RuntimeError(f'Unsupported publication input: {rel}')
            selected.append(rel)
    manifest = {}
    for rel in selected:
        source = WEB / rel
        target = DEST / 'chip-visualizer' / rel
        key = rel.as_posix()
        if target.exists() and target.read_bytes() != source.read_bytes():
            if key not in previous or digest(target.read_bytes()) != previous[key]:
                raise RuntimeError(f'Local destination changed independently: {key}')
        manifest[key] = digest(source.read_bytes())
    # All checks complete before writing; only the new subdirectory and one workflow are touched.
    for rel in selected:
        target = DEST / 'chip-visualizer' / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(WEB / rel, target)
    canonical = WEB / 'deployment/github-pages.yml'
    (DEST / workflow).write_bytes(canonical.read_bytes())
    for name in tracked:
        if name != workflow and digest((DEST / name).read_bytes()) != original_hashes[name]:
            raise RuntimeError(f'Preservation check failed: {name}')
    # These exclusions are checkout-local metadata, never additions to the remote source.
    exclude = DEST / '.git/info/exclude'
    existing = exclude.read_text() if exclude.exists() else ''
    exclude.write_text(existing + ''.join(f'\n{p}\n' for p in ['/dist/', '/.tooling/'] if p not in existing))
    previous_file.write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    report = {'baseCommit': EXPECTED, 'existingTrackedFilesPreserved': len(tracked)-1,
              'onlyExistingFileChanged': workflow, 'newSourceFiles': len(selected),
              'newSourceBytes': sum((WEB / p).stat().st_size for p in selected),
              'files': [f'chip-visualizer/{p.as_posix()}' for p in sorted(selected)]}
    (WEB / '.tooling/deployment/preparation-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    (WEB / '.tooling/deployment/workflow.diff').write_bytes(git('diff', '--', workflow))
    print(json.dumps({k: v for k, v in report.items() if k != 'files'}, indent=2))

if __name__ == '__main__':
    main()
