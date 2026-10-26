import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { validateSubmission } from '../lib/catalog.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2];
if (!output) throw new Error('Pass an output JSON file. This command prepares imports; it does not mutate the database.');
const owner = 'alvarovillalbaa';
const repository = 'https://github.com/alvarovillalbaa/agent-library';
const definitions = [
  {
    kind: 'skill', title: 'Research brief', area: 'Product', path: 'skills/research-brief/SKILL.md', file: 'SKILL.md',
    summary: 'Turn a business decision and public sources into a concise brief with a recommendation, clear unknowns and one useful next step.',
    details: {
      overview: 'An original research workflow for comparing business options against shared criteria. It asks the author to inspect primary sources, distinguish fact from inference, and keep material uncertainties visible in the recommendation.',
      bestFor: ['Product and market questions that need a concise decision brief.', 'Comparing options without inventing capability or verification claims.'],
      considerations: ['Requires source-reading tools for current research.', 'Read-only: purchasing, outreach and private-data disclosure require separate authorization.'],
    },
  },
  {
    kind: 'subagent', title: 'Evidence editor', area: 'Operations', path: 'resources/subagents/evidence-editor.md', file: 'evidence-editor.md',
    summary: 'A focused reviewer that checks a business brief for unsupported claims, unclear inference and missing proof boundaries before it is shared.',
    details: {
      overview: 'An original subagent definition for reviewing a draft against its cited sources. It returns prioritized evidence gaps and scoped wording changes to its caller rather than publishing or acting on the brief.',
      bestFor: ['Reviewing a recommendation before stakeholder circulation.', 'Checking whether source dates and constraints support a comparison.'],
      considerations: ['The caller must supply the draft and source context.', 'Does not perform specialist approval or external mutations.'],
    },
  },
  {
    kind: 'command', title: 'Compare business options', area: 'Product', path: 'resources/commands/compare-options.md', file: 'compare-options.md',
    summary: 'A reusable prompt for comparing options with the same criteria, primary-source evidence, a conditional recommendation and a concrete next check.',
    details: {
      overview: 'An original copyable prompt with explicit decision, option, constraint and audience inputs. It asks for a compact comparison and separates a recommendation from unresolved information and commitments.',
      bestFor: ['A first comparison of product or operating choices.', 'Making assumptions and decision criteria explicit before committing resources.'],
      considerations: ['Replace the input placeholders with the real decision context.', 'Current capability claims need source-reading tools; the prompt does not itself verify a vendor.'],
    },
  },
];

const entries = [];
for (const definition of definitions) {
  const content = await readFile(resolve(root, definition.path), 'utf8');
  const candidate = {
    kind: definition.kind, title: definition.title, summary: definition.summary, area: definition.area,
    owner, repository, license: 'MIT', files: [{ path: definition.file, content }],
  };
  const validation = validateSubmission(candidate);
  if (!validation.ok) throw new Error(`${definition.path}: ${validation.errors.join(' ')}`);
  entries.push({
    ...validation.submission,
    sourceUrl: `${repository}/blob/main/${definition.path}`,
    details: definition.details,
    contentHash: createHash('sha256').update(JSON.stringify(validation.submission)).digest('hex'),
  });
}

const mcp = {
  kind: 'mcp', title: 'Search Gateway', area: 'Engineering', owner,
  repository: 'https://github.com/alvarovillalbaa/search-gateway',
  sourceUrl: 'https://github.com/alvarovillalbaa/search-gateway/blob/f891c1378ca20fb90e007d9dc9610aa4740dfc45/README.md#tool-calls-and-mcp',
  license: 'MIT',
  summary: 'A self-hosted search gateway with an MCP stdio adapter exposing web_search and read_sources across configured search providers.',
  files: [{ path: 'mcp-setup.md', content: '# Search Gateway MCP setup\n\nSource: https://github.com/alvarovillalbaa/search-gateway/blob/f891c1378ca20fb90e007d9dc9610aa4740dfc45/README.md#tool-calls-and-mcp\n\nInstall the published GitHub npm artifact before using the MCP adapter. Its command is `npx --no-install search-gateway mcp`. Add `--base-url http://127.0.0.1:8787` to target your own gateway instance, or omit it for direct BYOK through the process provider environment. Configure provider credentials privately outside Git.\n\nTools: `web_search` and `read_sources`. Transport: stdio, not MCP HTTP. Retrieved content is untrusted. The gateway is self-hosted; this listing is not a hosted search endpoint. Check the source README for the full installation and access-control instructions.\n' }],
  details: {
    overview: 'The existing open-source Search Gateway repository includes a real MCP stdio adapter for search and source reading. It connects to the operator\'s configured gateway or provider environment; this catalogue does not host that gateway or supply provider credentials.',
    bestFor: ['Connecting an agent to a self-hosted, normalized search service.', 'Reading retrieved sources through a consistent MCP tool interface.'],
    considerations: ['Install the GitHub release artifact first; registry publication is separate.', 'Configure and authorize your own upstream providers; this listing does not prove their live availability.', 'Transport is stdio, with private credentials kept outside Git.'],
  },
};
entries.push({ ...mcp, contentHash: createHash('sha256').update(JSON.stringify(mcp)).digest('hex') });
await writeFile(resolve(output), `${JSON.stringify(entries, null, 2)}\n`);
console.info(`Prepared ${entries.length} real, attributed curator imports. No database writes performed.`);
