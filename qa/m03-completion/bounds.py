"""Check actual text bounds in the final direct-renderer PDFs (requires Poppler)."""
import json
import pathlib
import subprocess
import xml.etree.ElementTree as ET

root = pathlib.Path('client/qa/m032/artifacts')
files = sorted(root.glob('completion-*.pdf')) + sorted((root / 'final').glob('completion-workbook-*.pdf')) + sorted((root / 'final').glob('paper-*.pdf'))
assert files, 'Generate the acceptance PDFs first.'
results = []
for file in files:
    doc = ET.fromstring(subprocess.check_output(['pdftotext', '-bbox', str(file), '-']))
    pages = doc.findall('.//{*}page')
    assert pages, file
    for page in pages:
        w, h = float(page.attrib['width']), float(page.attrib['height'])
        for word in page.findall('.//{*}word'):
            x0, y0, x1, y1 = (float(word.attrib[k]) for k in ['xMin', 'yMin', 'xMax', 'yMax'])
            assert 10 <= x0 <= x1 <= w - 10 and 10 <= y0 <= y1 <= h - 10, (file, word.attrib, word.text)
    results.append({'file': str(file.relative_to(root)), 'pages': len(pages), 'physicalBounds': True})
output = root / 'completion' / 'bounds.json'
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(results, indent=2) + '\n')
print(f'PASS physical text bounds: {len(results)} PDFs / {sum(r["pages"] for r in results)} pages')
