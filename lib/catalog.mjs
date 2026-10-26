export const KINDS = Object.freeze(['skill', 'mcp', 'subagent', 'command']);
export const AREAS = Object.freeze(['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Finance', 'People', 'Operations']);
export const KIND_LABELS = Object.freeze({ skill: 'Skills', mcp: 'MCP Servers', subagent: 'Subagents', command: 'Commands' });
export const LIMITS = Object.freeze({ files: 24, fileBytes: 48 * 1024, totalBytes: 128 * 1024, title: 80, summary: 280, reviewPerHour: 10 });
export const REVIEW_CHECKS = Object.freeze([
  { id: 'format', title: 'Valid format' },
  { id: 'purpose', title: 'Useful business purpose' },
  { id: 'instructions', title: 'Clear instructions' },
  { id: 'completeness', title: 'Complete package' },
  { id: 'permissions', title: 'Appropriate permissions' },
  { id: 'safety', title: 'Safe handling of data' },
  { id: 'portability', title: 'Portable setup' },
  { id: 'attribution', title: 'Source and license' },
]);

const encoder = new TextEncoder();
const allowedTextExtensions = /\.(?:md|mdx|txt|json|jsonl|ya?ml|toml|xml|csv|tsv|py|js|mjs|cjs|ts|tsx|jsx|sh|bash|zsh|sql|html|css|env\.example)$/i;
const allowedTextNames = /(?:^|\/)(?:LICENSE|NOTICE)$/i;
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
  /\b(?:ghp_|gho_|ghu_|ghs_|github_pat_)[A-Za-z0-9_]{20,}\b/,
  /\bsk-(?:proj-|ant-api\d+-)?[A-Za-z0-9_-]{24,}\b/,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  /\b(?:xox[baprs]-)[A-Za-z0-9-]{20,}\b/,
  /(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)\s*[:=]\s*["']?(?!\$\{|<|process\.|os\.|env\.|your[_-]|example|placeholder|changeme|test[_-]|none|null|false)[A-Za-z0-9_+\/=.-]{28,}/i,
];

function safePath(path) {
  return typeof path === 'string' && path.length > 0 && path.length <= 240
    && !path.startsWith('/') && !/^[A-Za-z]:/.test(path)
    && !/[\\\u0000-\u001f\u007f]/.test(path)
    && path.split('/').every((part, index, parts) => part && part !== '.' && part !== '..'
      && (!part.startsWith('.') || (part === '.env.example' && index === parts.length - 1)));
}

/** Strip only the enclosing folder introduced by a directory picker. */
export function normalizeUploadFiles(files) {
  if (!Array.isArray(files)) throw new Error('Choose text files to upload.');
  if (files.some(file => !file || !safePath(file.path) || typeof file.content !== 'string')) {
    throw new Error('Files must have safe relative paths and text contents.');
  }
  const firstRoot = files[0]?.path.split('/')[0];
  const hasRootSkill = files.some(file => file.path === `${firstRoot}/SKILL.md`);
  const commonRoot = hasRootSkill && files.every(file => file.path.startsWith(`${firstRoot}/`));
  return files.map(file => ({ path: commonRoot ? file.path.slice(firstRoot.length + 1) : file.path, content: file.content }));
}

function scalarFrontmatter(text) {
  const match = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (!match) return null;
  const values = {};
  const lines = match[1].split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const field = /^(name|description):\s*(.*?)\s*$/.exec(line);
    if (!field) continue;
    let value = field[2];
    if (/^[|>][+-]?$/.test(value)) {
      const block = [];
      while (index + 1 < lines.length && (/^\s+/.test(lines[index + 1]) || !lines[index + 1].trim())) {
        block.push(lines[++index].trim());
      }
      value = block.join(value[0] === '>' ? ' ' : '\n').trim();
    } else if (/^["']/.test(value)) {
      if (value.at(-1) !== value[0]) return null;
      if (value[0] === '"') {
        try { value = JSON.parse(value); } catch { return null; }
      } else value = value.slice(1, -1).replace(/''/g, "'");
    } else value = value.replace(/\s+#.*$/, '').trim();
    if (values[field[1]] !== undefined) return null;
    values[field[1]] = value;
  }
  return values;
}

/** Validation is shared with the client but always repeated on the server. */
export function validateSubmission(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, errors: ['A submission is required.'] };
  if (!['skill', 'subagent', 'command'].includes(raw.kind)) errors.push('Choose a skill, subagent or command. MCP servers are curated by the library owner.');
  const text = (key, minimum, maximum, label) => {
    if (typeof raw[key] !== 'string') { errors.push(`${label} is required.`); return ''; }
    const value = raw[key].trim();
    if (value.length < minimum || value.length > maximum || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) errors.push(`${label} must contain ${minimum}–${maximum} readable characters.`);
    return value;
  };
  const title = text('title', 3, LIMITS.title, 'Title');
  const summary = text('summary', 20, LIMITS.summary, 'Summary');
  const owner = text('owner', 1, 39, 'Creator');
  if (owner && !/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(owner)) errors.push('Creator must be a GitHub-style account name.');
  const license = text('license', 2, 80, 'License');
  if (!AREAS.includes(raw.area)) errors.push('Choose one of the available business areas.');
  let repository;
  if (raw.repository !== undefined && raw.repository !== '') {
    if (typeof raw.repository !== 'string' || !/^https:\/\/github\.com\/[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\/[A-Za-z0-9_.-]+\/?$/.test(raw.repository.trim())) errors.push('Source repository must be an HTTPS GitHub repository URL.');
    else repository = raw.repository.trim().replace(/\/$/, '').replace(/\.git$/, '');
  }
  if (raw.kind === 'skill' && !repository) errors.push('Skills need a GitHub source repository so people can install them.');
  if (repository && repository.split('/')[3].toLowerCase() !== owner.toLowerCase()) errors.push('The source repository owner must match the creator.');
  let files = [];
  if (!Array.isArray(raw.files) || raw.files.length === 0 || raw.files.length > (raw.kind === 'skill' ? LIMITS.files : 1)) {
    errors.push(raw.kind === 'skill' ? `Include 1–${LIMITS.files} text files.` : 'Commands and subagents require exactly one Markdown file.');
  } else {
    const seen = new Set();
    let total = 0;
    for (const file of raw.files) {
      if (!file || !safePath(file.path) || typeof file.content !== 'string') { errors.push('Each file needs a safe relative path and text contents.'); continue; }
      const key = file.path.toLowerCase();
      if (seen.has(key)) errors.push('File paths must be unique, including letter case.');
      seen.add(key);
      const bytes = encoder.encode(file.content).byteLength;
      total += bytes;
      if (bytes === 0 || bytes > LIMITS.fileBytes) errors.push(`Each file must contain 1 byte–${LIMITS.fileBytes / 1024} KiB of text.`);
      if (!allowedTextExtensions.test(file.path) && !allowedTextNames.test(file.path)) errors.push('Only supported text source files can be submitted.');
      if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\ufffd]/.test(file.content)) errors.push('Files must be readable UTF-8 text, without binary or invalid characters.');
      if (secretPatterns.some(pattern => pattern.test(`${file.path}\n${file.content}`))) errors.push('Remove credentials or private keys before sharing this package.');
      files.push({ path: file.path, content: file.content });
    }
    if (total > LIMITS.totalBytes) errors.push(`The package must be no larger than ${LIMITS.totalBytes / 1024} KiB.`);
    if (raw.kind !== 'skill' && files.some(file => !/\.md$/i.test(file.path))) errors.push('Commands and subagents use one Markdown (.md) file.');
  }
  if (raw.kind === 'skill') {
    const skill = files.find(file => file.path === 'SKILL.md');
    if (!skill) errors.push('Skills require a SKILL.md file at the package root.');
    else {
      const metadata = scalarFrontmatter(skill.content);
      if (!metadata || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.name ?? '') || (metadata.name?.length ?? 0) > 64 || !metadata.description || metadata.description.length < 10 || metadata.description.length > 1024 || ['|', '>', '|-', '>-'].includes(metadata.description)) {
        errors.push('SKILL.md needs YAML frontmatter with a lowercase hyphenated name and a 10–1024 character description.');
      }
    }
  }
  if (secretPatterns.some(pattern => pattern.test(`${title}\n${summary}\n${license}`))) errors.push('Remove credentials from the submission details.');
  if (errors.length) return { ok: false, errors: [...new Set(errors)] };
  return { ok: true, errors: [], submission: { kind: raw.kind, title, summary, area: raw.area, owner, ...(repository ? { repository } : {}), license, files } };
}

export function makeInstallCommand(repository) {
  if (typeof repository !== 'string' || !/^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+\/?$/.test(repository)) return null;
  return `npx skills add ${repository.replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '')}`;
}

export function makeRepairPrompt(submission, checks) {
  const failures = checks.filter(check => !check.passed);
  if (!failures.length) return '';
  return `Revise my ${submission.kind} “${submission.title}” while preserving its intended business purpose.\n\nRequired fixes:\n${failures.map((check, index) => `${index + 1}. ${check.title}: ${check.issue}\n   Fix: ${check.fix}`).join('\n')}\n\nReturn the complete corrected files with their original relative paths. Do not include credentials, invent capabilities or claim unperformed verification. Keep the package ready for a fresh library review.`;
}
