// Downloads the instrument samples the app plays, so it works offline.
// Usage: npm run setup
//
// Piano: Salamander Grand Piano by Alexander Holm, CC BY 3.0, as hosted by the Tone.js project.
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE_URL = 'https://tonejs.github.io/audio/salamander/';

// Sampled every minor third (C, D#, F#, A) from A0 to C8; Tone.Sampler repitches the gaps.
const pianoNotes = ['A0'];
for (let octave = 1; octave <= 7; octave++) {
  for (const pc of ['C', 'Ds', 'Fs', 'A']) pianoNotes.push(`${pc}${octave}`);
}
pianoNotes.push('C8');

async function exists(path) {
  try {
    return (await stat(path)).size > 0;
  } catch {
    return false;
  }
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('audio') && !contentType.includes('octet-stream')) {
    throw new Error(`Unexpected content type "${contentType}" for ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return buf.length;
}

async function main() {
  const dir = join(root, 'public', 'samples', 'piano');
  await mkdir(dir, { recursive: true });
  let downloaded = 0;
  let bytes = 0;
  for (const note of pianoNotes) {
    const file = `${note}.mp3`;
    const dest = join(dir, file);
    if (await exists(dest)) continue;
    process.stdout.write(`piano/${file} … `);
    const size = await download(BASE_URL + file, dest);
    bytes += size;
    downloaded++;
    console.log(`${(size / 1024).toFixed(0)} KB`);
  }
  const manifest = {
    instrument: 'piano',
    source: 'Salamander Grand Piano (Alexander Holm), CC BY 3.0',
    files: pianoNotes.map((n) => ({ note: n.replace('s', '#'), file: `${n}.mp3` })),
  };
  await writeFile(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(
    downloaded === 0
      ? 'Piano samples already present.'
      : `Downloaded ${downloaded} files (${(bytes / 1024 / 1024).toFixed(1)} MB) into public/samples/piano.`,
  );
}

main().catch((err) => {
  console.error(`\nSample download failed: ${err.message}`);
  console.error('The app still runs with a built-in synth sound; re-run `npm run setup` later.');
  process.exit(1);
});
