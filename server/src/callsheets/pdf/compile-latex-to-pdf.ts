import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawn } from 'child_process';

function runPdflatex(texPath: string, cwd: string) {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn(
      'pdflatex',
      [
        '-interaction=nonstopmode',
        '-halt-on-error',
        '-output-directory',
        cwd,
        texPath,
      ],
      { cwd }
    );

    let stderr = '';
    let stdout = '';

    proc.stdout.on('data', (d) => {
      stdout += String(d);
    });

    proc.stderr.on('data', (d) => {
      stderr += String(d);
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`pdflatex failed (${code})\n${stdout}\n${stderr}`));
    });
  });
}

export async function compileLatexToPdf(texSource: string) {
  const workDir = await mkdtemp(join(tmpdir(), 'vw-callsheet-'));
  const texPath = join(workDir, 'callsheet.tex');
  const pdfPath = join(workDir, 'callsheet.pdf');

  try {
    await writeFile(texPath, texSource, 'utf8');
    await runPdflatex(texPath, workDir);
    const pdf = await readFile(pdfPath);
    return pdf;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
