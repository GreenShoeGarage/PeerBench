import pathlib,zipfile,hashlib,json
root=pathlib.Path(__file__).resolve().parent.parent
version=json.loads((root/'package.json').read_text())['version']
files=sorted(p for p in root.rglob('*') if p.is_file() and not any(x in p.relative_to(root).parts for x in ['node_modules','data','out','.git']) and p.name not in ['FILE-MANIFEST.txt','smoke.cjs'])
(root/'FILE-MANIFEST.txt').write_text('\n'.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+str(p.relative_to(root)) for p in files)+'\n')
files.append(root/'FILE-MANIFEST.txt')
out=root.parent/f'PEERBENCH-v{version}-github-ready.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for p in files:z.write(p,p.relative_to(root))
print(out, len(files), out.stat().st_size, hashlib.sha256(out.read_bytes()).hexdigest())
