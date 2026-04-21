"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileLatexToPdf = compileLatexToPdf;
const promises_1 = require("fs/promises");
const os_1 = require("os");
const path_1 = require("path");
const child_process_1 = require("child_process");
function runPdflatex(texPath, cwd) {
    return new Promise((resolve, reject) => {
        const proc = (0, child_process_1.spawn)('pdflatex', [
            '-interaction=nonstopmode',
            '-halt-on-error',
            '-output-directory',
            cwd,
            texPath,
        ], { cwd });
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
async function compileLatexToPdf(texSource) {
    const workDir = await (0, promises_1.mkdtemp)((0, path_1.join)((0, os_1.tmpdir)(), 'vw-callsheet-'));
    const texPath = (0, path_1.join)(workDir, 'callsheet.tex');
    const pdfPath = (0, path_1.join)(workDir, 'callsheet.pdf');
    try {
        await (0, promises_1.writeFile)(texPath, texSource, 'utf8');
        await runPdflatex(texPath, workDir);
        const pdf = await (0, promises_1.readFile)(pdfPath);
        return pdf;
    }
    finally {
        await (0, promises_1.rm)(workDir, { recursive: true, force: true });
    }
}
//# sourceMappingURL=compile-latex-to-pdf.js.map