"""Audit and preserve the user's existing games from an immutable public revision.
Read-only network access. Never evaluates downloaded JavaScript or pushes Git.
"""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import re
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / 'docs' / 'audit'
REVISION = 'ebe62ed0b9d51656a1fb72277c1f1d1188c0ec7b'
REPO = 'samjoseph04/samjoseph04.github.io'

def get(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'SamJoseph-Portfolio-Audit'})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read(), response.status, response.geturl()

def main():
    AUDIT.mkdir(parents=True, exist_ok=True)
    tree_bytes, _, _ = get(f'https://api.github.com/repos/{REPO}/git/trees/{REVISION}?recursive=1')
    tree = json.loads(tree_bytes)
    if tree.get('truncated'):
        raise RuntimeError('Source tree is truncated')
    (AUDIT / 'repository-tree.json').write_bytes(tree_bytes)
    raw, _, _ = get(f'https://raw.githubusercontent.com/{REPO}/{REVISION}/games-data.js')
    games = []
    for block in re.findall(r'\{([^{}]+)\}', raw.decode('utf-8-sig')):
        def field(name):
            match = re.search(r'\b' + name + r'\s*:\s*"([^"]*)"', block)
            return match.group(1) if match else ''
        if field('id'):
            tags = re.search(r'\btags\s*:\s*\[([^\]]*)\]', block)
            games.append(dict(id=field('id'), name=field('name'), description=field('description'), category=field('category'), tags=re.findall(r'"([^"]*)"', tags.group(1)), destination='/' + field('folder') + '/'))
    slugs = {g['id'] for g in games}
    entries = [e for e in tree['tree'] if e['type'] == 'blob' and e['path'].split('/')[0] in slugs]
    def preserve(entry):
        path = entry['path']
        data, _, _ = get(f'https://raw.githubusercontent.com/{REPO}/{REVISION}/{path}')
        git_sha = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
        if git_sha != entry['sha']:
            raise RuntimeError(f'Git blob hash mismatch: {path}')
        destination = ROOT / 'apps' / 'web' / 'public' / path
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(data)
        live, status, url = get('https://samjoseph.me/' + path)
        return dict(path=path, sourceGitSha=git_sha, sha256=hashlib.sha256(data).hexdigest(), bytes=len(data), liveStatus=status, liveMatchesSource=live == data, liveUrl=url)
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        files = list(pool.map(preserve, entries))
    def check_game(game):
        html, status, url = get('https://samjoseph.me' + game['destination'])
        title = re.search(r'<title[^>]*>(.*?)</title>', html.decode('utf-8-sig'), re.S)
        return dict(**game, httpStatus=status, checkedUrl=url, documentTitle=title.group(1) if title else '')
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        checked = list(pool.map(check_game, games))
    (AUDIT / 'games.json').write_text(json.dumps(dict(auditDate='2026-11-12', sourceRepository=REPO, sourceRevision=REVISION, verification='HTTP reachability and byte integrity; not a complete gameplay test', games=checked, files=files), indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps(dict(games=len(games), files=len(files), allLiveFilesMatch=all(f['liveMatchesSource'] for f in files))))

if __name__ == '__main__':
    main()
