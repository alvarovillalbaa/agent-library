import assert from 'node:assert/strict';
import test from 'node:test';
import { LIMITS, normalizeUploadFiles, validateSubmission } from '../lib/catalog.mjs';

const skill = {
  path: 'SKILL.md',
  content: '---\nname: audit-notes\ndescription: Prepare clear audit notes from supplied evidence.\n---\nReview the supplied evidence and cite its sources.\n',
};
const metadata = {
  kind: 'skill', title: 'Audit notes', summary: 'Prepare clear audit notes from supplied evidence.',
  area: 'Engineering', owner: 'example', repository: 'https://github.com/example/audit-notes', license: 'MIT',
};
const placeholder = 'API_KEY=your_api_key_here\nCLIENT_SECRET=${CLIENT_SECRET}\n';
const submission = files => validateSubmission({ ...metadata, files: [skill, ...files] });

test('directory uploads preserve license, notice and example environment files', () => {
  const files = [skill,
    { path: 'LICENSE', content: 'MIT License\nCopyright Example\n' },
    { path: 'NOTICE', content: 'Attribution for bundled text.\n' },
    { path: '.env.example', content: placeholder },
    { path: 'config/.env.example', content: placeholder },
    { path: 'LICENSE.txt', content: 'Plain text license.\n' },
    { path: 'docs/LICENSE.md', content: '# License\nMIT\n' },
  ];
  const uploaded = files.map(file => ({ ...file, path: `audit-notes/${file.path}` }));
  const normalized = normalizeUploadFiles(uploaded);
  assert.deepEqual(normalized, files);
  const result = validateSubmission({ ...metadata, files: normalized });
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.deepEqual(result.submission.files, files);
});

test('extensionless license and notice basenames work at safe relative locations', () => {
  for (const path of ['LICENSE', 'NOTICE', 'license', 'third-party/NOTICE', 'docs/LICENSE']) {
    const result = submission([{ path, content: 'License and attribution text.\n' }]);
    assert.equal(result.ok, true, `${path}: ${result.errors.join('\n')}`);
  }
});

test('hidden paths, private environment files and traversal stay rejected', () => {
  for (const path of [
    '.env', 'config/.env', '.env.local', '.env.example.local', '.git/config', '.private/NOTICE',
    '.env.example/notes.txt', 'config/.env.example/notes.txt', '../LICENSE', 'docs/../NOTICE',
    '/LICENSE', 'C:/LICENSE', 'docs\\LICENSE', 'docs//NOTICE', './LICENSE', 'bad\u0000/NOTICE',
  ]) {
    const file = { path, content: 'Text only.\n' };
    assert.throws(() => normalizeUploadFiles([skill, file]), /safe relative paths/, path);
    const result = submission([file]);
    assert.equal(result.ok, false, path);
    assert.ok(result.errors.some(error => error.includes('safe relative path')), path);
  }
});

test('the filename exceptions do not admit unknown extensions or executables', () => {
  for (const path of ['LICENSE.exe', 'NOTICE.dll', 'bin/run', 'setup.exe', 'script.ps1', 'env.example']) {
    const result = submission([{ path, content: 'Text only.\n' }]);
    assert.equal(result.ok, false, path);
    assert.ok(result.errors.includes('Only supported text source files can be submitted.'), path);
  }
});

test('newly supported files still reject binary and malformed text', () => {
  for (const path of ['LICENSE', 'NOTICE', '.env.example']) {
    for (const content of ['text\u0000binary', 'text\u0001binary', 'invalid\ufffdtext']) {
      const result = submission([{ path, content }]);
      assert.equal(result.ok, false, path);
      assert.ok(result.errors.some(error => error.includes('readable UTF-8 text')), path);
    }
  }
});

test('example placeholders are accepted but credentials remain rejected', () => {
  assert.equal(submission([{ path: '.env.example', content: placeholder }]).ok, true);
  for (const path of ['LICENSE', 'NOTICE', '.env.example']) {
    for (const content of [`API_KEY=sk-proj-${'x'.repeat(32)}`, '-----BEGIN PRIVATE KEY-----\nsynthetic']) {
      const result = submission([{ path, content }]);
      assert.equal(result.ok, false, path);
      assert.ok(result.errors.some(error => error.includes('Remove credentials or private keys')), path);
    }
  }
});

test('license and example files still obey duplicate and byte limits', () => {
  for (const [first, second] of [['LICENSE', 'license'], ['NOTICE', 'notice'], ['.env.example', '.env.example']]) {
    const result = submission([{ path: first, content: 'Text.' }, { path: second, content: 'Other text.' }]);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some(error => error.includes('File paths must be unique')));
  }
  const oversized = submission([{ path: 'LICENSE', content: 'é'.repeat(LIMITS.fileBytes / 2 + 1) }]);
  assert.equal(oversized.ok, false);
  assert.ok(oversized.errors.some(error => error.startsWith('Each file must contain')));
});
