import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
let running = 0;
/** Isolated temp tree, no shell escape, no user-controlled filenames, hard budgets. */
export async function compileShotlist(source: string): Promise<Buffer> {
  if (running >= 2) throw Error('PDF service is busy. Try again shortly.');
  running++;
  let dir: string | undefined;
  try {
    dir = await mkdtemp(join(tmpdir(), 'whiteout-shot-pdf-'));
    await writeFile(join(dir, 'report.tex'), source, 'utf8');
    for (let pass = 0; pass < 2; pass++)
      await new Promise<void>((resolve, reject) => {
        const child = spawn(
          process.env.SHOTLIST_XELATEX_PATH || 'xelatex',
          [
            '-no-shell-escape',
            '-halt-on-error',
            '-interaction=nonstopmode',
            'report.tex',
          ],
          {
            cwd: dir,
            env: { ...process.env, openin_any: 'p', openout_any: 'p' },
            stdio: ['ignore', 'pipe', 'pipe'],
          },
        );
        let size = 0,
          settled = false;
        const finish = (error?: Error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          error ? reject(error) : resolve();
        };
        const timer = setTimeout(() => {
          child.kill('SIGKILL');
          finish(Error('PDF generation timed out. Select fewer scenes.'));
        }, 25000);
        const output = (chunk: Buffer) => {
          size += chunk.length;
          if (size > 2 * 1024 * 1024) {
            child.kill('SIGKILL');
            finish(Error('PDF output exceeded its safety limit.'));
          }
        };
        child.stdout.on('data', output);
        child.stderr.on('data', output);
        child.on('error', () => finish(Error('PDF compiler is unavailable.')));
        child.on('exit', (code) =>
          finish(
            code === 0
              ? undefined
              : Error(
                  'PDF could not be typeset. Review the report selection or contact production support.',
                ),
          ),
        );
      });
    const log = await readFile(join(dir, 'report.log'), 'utf8');
    if (/Missing character:/.test(log))
      throw Error(
        'A selected field contains characters unavailable in the PDF font. Adjust the selection or contact production support.',
      );
    const result = await readFile(join(dir, 'report.pdf'));
    if (result.length > 20 * 1024 * 1024)
      throw Error('PDF exceeds the download limit.');
    return result;
  } finally {
    running--;
    if (dir) await rm(dir, { recursive: true, force: true });
  }
}
