import { useQuery } from 'convex/react';
import { ArrowLeft, ArrowUpRight, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { AREAS } from '../../lib/catalog.mjs';
import { externalUrl, getEntry, installCommand, listEntries } from '../catalog-api';
import { Link, useNavigation } from '../navigation';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { CopyButton, KindIcon, kindLabels, kindPlural, kindRoutes } from './shared';
import type { CatalogResponse, Entry, Kind } from '../types';

const kindDescriptions: Record<Kind, { eyebrow: string; title: string; description: string }> = {
  skill: { eyebrow: 'A LITTLE EXPERTISE, ON DEMAND', title: 'Skills that make\nthe work click.', description: 'Reusable know-how for the agent already in your workflow.' },
  mcp: { eyebrow: 'MAKE THE CONNECTION', title: 'Tools meet\npossibility.', description: 'MCP servers that connect your agents to the places work happens.' },
  subagent: { eyebrow: 'THE RIGHT MIND FOR THE JOB', title: 'Meet your next\nspecialist.', description: 'Focused agents with a clear purpose and a useful point of view.' },
  command: { eyebrow: 'LESS STARTING FROM SCRATCH', title: 'The words that\nget work moving.', description: 'Reusable prompts for the tasks you come back to.' },
};

export function Sidebar({ counts, kind, area }: { counts?: Record<Kind, number>; kind?: Kind; area: string }) {
  const { location, navigate } = useNavigation();
  const setArea = (value: string) => {
    const params = new URLSearchParams(location.search);
    if (value) params.set('area', value); else params.delete('area');
    navigate(location.pathname + (params.size ? `?${params}` : ''), true);
  };
  return <aside className="library-sidebar" aria-label="Browse library"><p className="section-kicker">THE COLLECTION</p><nav aria-label="Resource types"><Link href="/" className={`side-link ${!kind ? 'active' : ''}`} aria-current={!kind ? 'page' : undefined}><Sparkles size={17} strokeWidth={1.6} aria-hidden="true"/>Everything{counts && <span>{Object.values(counts).reduce((a, b) => a + b, 0)}</span>}</Link>{(['skill', 'mcp', 'subagent', 'command'] as const).map(type => <Link key={type} href={kindRoutes[type]} className={`side-link ${kind === type ? 'active' : ''}`} aria-current={kind === type ? 'page' : undefined}><KindIcon kind={type}/>{kindPlural[type]}{counts && <span>{counts[type] ?? 0}</span>}</Link>)}</nav><div className="area-list"><p className="section-kicker">MADE FOR YOUR WORK</p><button className={`area-link ${!area ? 'selected' : ''}`} aria-pressed={!area} onClick={() => setArea('')}>All business areas<span aria-hidden="true">{!area ? '•' : ''}</span></button>{AREAS.map(value => <button key={value} className={`area-link ${area === value ? 'selected' : ''}`} aria-pressed={area === value} onClick={() => setArea(value)}>{value}<span aria-hidden="true">{area === value ? '•' : ''}</span></button>)}</div><div className="side-note"><span className="side-note-spark" aria-hidden="true">✳</span><p>Useful things.<br/>Shared openly.</p><span>Built by people.<br/>Ready for your agents.</span></div></aside>;
}

function EntryCard({ entry }: { entry: Entry }) {
  const command = entry.kind === 'skill' ? installCommand(entry.repository) : undefined;
  return <article className={`entry-card entry-${entry.kind}`}><div className="entry-topline"><span className={`type-symbol type-${entry.kind}`}><KindIcon kind={entry.kind} size={21}/></span><Badge>{entry.area}</Badge></div><Link className="entry-title" href={`/items/${encodeURIComponent(entry.slug)}`}><h3>{entry.title}</h3><ArrowUpRight size={17} aria-hidden="true"/></Link><p className="entry-summary">{entry.summary}</p><div className="entry-credit"><span className="owner-avatar" aria-hidden="true">{entry.owner.slice(0, 1).toUpperCase()}</span><span>@{entry.owner}</span><span className="entry-kind">{kindLabels[entry.kind]}</span></div><div className="entry-bottom">{command ? <><code title={command}>{command}</code><CopyButton text={command} label="Copy install command"/></> : <Link href={`/items/${encodeURIComponent(entry.slug)}`} className="entry-open">{entry.kind === 'mcp' ? 'Explore server' : 'Read & copy'}<ArrowUpRight size={14} aria-hidden="true"/></Link>}</div></article>;
}

function Empty({ filtered }: { filtered: boolean }) {
  return <div className="empty-state"><span className="empty-symbol" aria-hidden="true"><Sparkles size={28} strokeWidth={1.2}/></span><p className="section-kicker">A LITTLE ROOM FOR SOMETHING GOOD</p><h2>{filtered ? 'Nothing on this shelf. Yet.' : 'The library starts with you.'}</h2><p>{filtered ? 'Try another search or clear your filters to see the whole collection.' : 'Have a skill, a specialist, or a prompt that makes work better? Give it a place here.'}</p><Link href={filtered ? '/' : '/submit'} className="button button-primary button-default">{filtered ? 'View the collection' : 'Share something useful'}<ArrowUpRight size={16} aria-hidden="true"/></Link></div>;
}

function LoadingCards() {
  return <div className="entry-grid" aria-busy="true" aria-label="Loading resources">{[1, 2, 3].map(n => <div className="entry-skeleton" key={n}><span/><span/><span/><span/></div>)}</div>;
}

export function Unavailable({ detail = false }: { detail?: boolean }) {
  return <div className="empty-state unavailable"><span className="empty-symbol" aria-hidden="true"><SlidersHorizontal size={27} strokeWidth={1.3}/></span><p className="section-kicker">A BRIEF INTERMISSION</p><h2>{detail ? 'This resource couldn’t load.' : 'The library is getting ready.'}</h2><p>Browsing and reviews are temporarily unavailable. Please try again a little later.</p><Button variant="secondary" onClick={() => window.location.reload()}>Try again</Button></div>;
}

export function LibraryPage({ connected, kind }: { connected: boolean; kind?: Kind }) {
  if (!connected) return <LibraryView kind={kind} connected={false}/>;
  return <ConnectedLibrary kind={kind}/>;
}

function ConnectedLibrary({ kind }: { kind?: Kind }) {
  const { location } = useNavigation();
  const params = new URLSearchParams(location.search);
  const area = params.get('area') ?? '';
  const owner = params.get('owner') ?? '';
  const search = params.get('q') ?? '';
  const data = useQuery(listEntries, { ...(kind ? { kind } : {}), ...(area ? { area } : {}), ...(owner ? { owner } : {}), ...(search ? { search } : {}) });
  return <LibraryView kind={kind} connected data={data}/>;
}

function LibraryView({ kind, connected, data }: { kind?: Kind; connected: boolean; data?: CatalogResponse }) {
  const { location, navigate } = useNavigation();
  const params = new URLSearchParams(location.search);
  const search = params.get('q') ?? '';
  const area = params.get('area') ?? '';
  const owner = params.get('owner') ?? '';
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(location.search);
    if (value) next.set(key, value); else next.delete(key);
    navigate(location.pathname + (next.size ? `?${next}` : ''), true);
  };
  const intro = kind ? kindDescriptions[kind] : { eyebrow: 'THE OPEN SHELF FOR USEFUL AGENTS', title: 'Good agents.\nGreat work.', description: 'Find the skills, tools, and little bits of intelligence that make your everyday work better.' };
  return <div className="library-layout"><Sidebar counts={data?.counts} kind={kind} area={area}/><main id="main" className="library-main"><section className="library-hero"><div><p className="section-kicker"><span className="tiny-dot"/>{intro.eyebrow}</p><h1>{intro.title.split('\n').map((line, i) => <span key={line} className={i ? 'hero-second-line' : ''}>{line}</span>)}</h1><p className="hero-description">{intro.description}</p></div><div className="hero-aside"><span aria-hidden="true">↗</span><p>Less reinvention.<br/>More good work.</p><Link href="/submit">Contribute to the library<ArrowUpRight size={14} aria-hidden="true"/></Link></div></section><section className="catalog-section" aria-label={kind ? kindPlural[kind] : 'All resources'}><div className="catalog-toolbar"><label className="search-field"><Search size={18} aria-hidden="true"/><span className="sr-only">Search the library</span><input type="search" value={search} placeholder="Find a skill, a tool, a better way…" maxLength={160} onChange={event => update('q', event.target.value)}/><kbd aria-hidden="true">⌕</kbd></label><label className="owner-select"><span className="sr-only">Filter by creator</span><select value={owner} onChange={event => update('owner', event.target.value)}><option value="">All creators</option>{owner && !data?.owners.includes(owner) && <option value={owner}>@{owner}</option>}{data?.owners.map(name => <option key={name} value={name}>@{name}</option>)}</select></label><label className="mobile-area-select"><span className="sr-only">Filter by business area</span><select value={area} onChange={event => update('area', event.target.value)}><option value="">All business areas</option>{AREAS.map(value => <option key={value} value={value}>{value}</option>)}</select></label></div><div className="catalog-label"><h2>{kind ? kindPlural[kind] : 'The collection'}{data && <span>{data.entries.length}{data.truncated ? '+' : ''}</span>}</h2><span>{area || 'All business areas'}{owner && ` · @${owner}`}</span></div>{(area || owner) && <div className="active-filters">{area && <button onClick={() => update('area', '')}>{area}<X size={12} aria-hidden="true"/><span className="sr-only">Remove business area filter</span></button>}{owner && <button onClick={() => update('owner', '')}>@{owner}<X size={12} aria-hidden="true"/><span className="sr-only">Remove creator filter</span></button>}</div>}{!connected ? <Unavailable/> : !data ? <LoadingCards/> : data.entries.length ? <><div className="entry-grid">{data.entries.map(entry => <EntryCard key={entry._id} entry={entry}/>)}</div>{data.truncated && <p className="results-note" role="status">Showing the first 100 matches. Add a search or filter to narrow the collection.</p>}</> : <Empty filtered={!!(search || area || owner)}/>}</section><div className="collection-footnote"><span className="footnote-mark" aria-hidden="true">↳</span><p>Open to browse. Easy to take with you.<br/><span>Read the source, find your fit, make it your own.</span></p><Link href="/submit">Pass something good along<ArrowUpRight size={14} aria-hidden="true"/></Link></div></main></div>;
}

export function DetailPage({ connected, slug }: { connected: boolean; slug: string }) {
  return <main id="main" className="detail-main"><Link href="/" className="back-link"><ArrowLeft size={15} aria-hidden="true"/>Back to the collection</Link>{connected ? <ConnectedDetail slug={slug}/> : <Unavailable detail/>}</main>;
}

function ConnectedDetail({ slug }: { slug: string }) {
  const entry = useQuery(getEntry, { slug });
  if (entry === undefined) return <div className="detail-loading" role="status">Taking it off the shelf…</div>;
  if (entry === null) return <div className="empty-state"><p className="section-kicker">NOT ON THIS SHELF</p><h1>We couldn’t find that resource.</h1><p>It may have moved or no longer be available.</p><Link href="/" className="button button-primary button-default">Explore the collection</Link></div>;
  const command = entry.kind === 'skill' ? installCommand(entry.repository) : entry.kind !== 'mcp' && entry.files?.length === 1 ? entry.files[0].content : undefined;
  const source = externalUrl(entry.sourceUrl) ?? externalUrl(entry.repository);
  return <><header className="detail-header"><span className={`type-symbol type-${entry.kind}`}><KindIcon kind={entry.kind} size={28}/></span><div><div className="detail-eyebrow"><Badge>{kindLabels[entry.kind]}</Badge><span>{entry.area}</span></div><h1>{entry.title}</h1><p>{entry.summary}</p><div className="detail-credit"><span className="owner-avatar" aria-hidden="true">{entry.owner.slice(0, 1).toUpperCase()}</span><span>Shared by <strong>@{entry.owner}</strong></span><span className="credit-note">Creator attribution is provided by the contributor.</span></div></div></header><div className="detail-layout"><div className="detail-body"><section><p className="section-kicker">THE OVERVIEW</p><h2>A little more context.</h2><p className="detail-overview">{entry.overview}</p></section><div className="detail-two-up"><section><h3>Best for</h3><ul>{entry.bestFor.map((value, index) => <li key={index}>{value}</li>)}</ul></section><section><h3>Keep in mind</h3><ul>{entry.considerations.map((value, index) => <li key={index}>{value}</li>)}</ul></section></div>{entry.files && entry.files.length > 0 && <SourceViewer files={entry.files}/>}</div><aside className="resource-sidebar" aria-label="Resource information"><p className="section-kicker">MAKE IT YOURS</p><h2>{entry.kind === 'skill' ? 'A little expertise.\nOne command away.' : entry.kind === 'mcp' ? 'Make the connection.' : 'Ready for your next task.'}</h2>{command && <div className="take-resource">{entry.kind === 'skill' && <code>{command}</code>}<CopyButton text={command} label={entry.kind === 'skill' ? 'Copy install command' : `Copy ${kindLabels[entry.kind].toLowerCase()}`}/></div>}{source && <a href={source} target="_blank" rel="noreferrer" className="source-link">View original source<ArrowUpRight size={15} aria-hidden="true"/></a>}<dl><div><dt>License</dt><dd>{entry.license}</dd></div><div><dt>Published</dt><dd>{formatDate(entry.publishedAt)}</dd></div><div><dt>Review</dt><dd>{/ai/i.test(entry.review.method) ? 'AI reviewed' : 'Curator reviewed'}</dd></div>{entry.review.model && <div><dt>Review model</dt><dd>{entry.review.model}</dd></div>}<div><dt>Review version</dt><dd>{entry.review.version}</dd></div></dl><p className="resource-note">A review helps check quality and completeness. Read the files and permissions before using a resource in your own workflow.</p></aside></div></>;
}

function SourceViewer({ files }: { files: NonNullable<Entry['files']> }) {
  return <section className="source-viewer"><div className="source-heading"><div><p className="section-kicker">NOTHING TUCKED AWAY</p><h2>The files.</h2></div><Badge>{files.length} {files.length === 1 ? 'file' : 'files'}</Badge></div>{files.map(file => <details key={file.path} className="source-file"><summary>{file.path}<span>Read file</span></summary><div className="source-file-actions"><CopyButton text={file.content} label={`Copy ${file.path}`}/></div><pre tabIndex={0}><code>{file.content}</code></pre></details>)}</section>;
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  return Number.isNaN(date.valueOf()) ? '—' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}
