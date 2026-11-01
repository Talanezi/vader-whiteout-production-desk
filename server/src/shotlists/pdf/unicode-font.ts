import * as fontkit from '@pdf-lib/fontkit';
// bidi-js has no bundled declarations; this adapter confines its dynamic API.
const bidi = require('bidi-js')() as {
  getEmbeddingLevels(text: string): { levels: Uint8Array };
  getReorderedIndices(text: string, levels: unknown): number[];
  getMirroredCharactersMap(text: string, levels: unknown): Map<number, string>;
};
type Shape = (
  text: string,
  features?: unknown,
  script?: undefined,
  language?: undefined,
  direction?: string,
) => fontkit.GlyphRun;
/** Shape directional runs before pdf-lib measures or encodes glyphs. */
export const unicodeFontkit = {
  ...fontkit,
  create(data: Uint8Array) {
    const font = fontkit.create(data);
    const shape = font.layout.bind(font) as Shape;
    font.layout = (text, features) => {
      if (!/[\u0590-\u08ff]/u.test(text)) return shape(text, features);
      const embedding = bidi.getEmbeddingLevels(text);
      const order = bidi.getReorderedIndices(text, embedding);
      const mirrored = bidi.getMirroredCharactersMap(text, embedding);
      const runs: { first: number; last: number; level: number }[] = [];
      for (const index of order) {
        const level = embedding.levels[index],
          last = runs[runs.length - 1];
        if (
          last &&
          level === last.level &&
          index === last.last + (level % 2 ? -1 : 1)
        )
          last.last = index;
        else runs.push({ first: index, last: index, level });
      }
      const shaped = runs.map((run) => {
        const start = Math.min(run.first, run.last),
          end = Math.max(run.first, run.last);
        let value = '';
        for (let i = start; i <= end; i++) value += mirrored.get(i) || text[i];
        return shape(
          value,
          features,
          undefined,
          undefined,
          run.level % 2 ? 'rtl' : 'ltr',
        );
      });
      return Object.assign(shape(text, features), {
        glyphs: shaped.flatMap((run) => run.glyphs),
        positions: shaped.flatMap((run) => run.positions),
      });
    };
    return font;
  },
};
