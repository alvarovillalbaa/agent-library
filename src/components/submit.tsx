import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useAction } from 'convex/react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, FilePlus2, FolderUp, LoaderCircle, Plus, ShieldCheck, Upload, X } from 'lucide-react';
import { AREAS, LIMITS, normalizeUploadFiles, validateSubmission } from '../../lib/catalog.mjs';
import { reviewSubmission } from '../catalog-api';
import { Link } from '../navigation';
import type { ReviewResult, SourceFile, Submission, SubmissionKind } from '../types';
import { Button } from './ui/button';
import { Field, Input, Textarea } from './ui/field';
import { Badge } from './ui/badge';
import { CopyButton, KindIcon, kindLabels } from './shared';

const initialSubmission: Submission = { kind: 'skill', title: '', summary: '', area: AREAS[0], owner: '', repository: '', license: '', files: [{ path: 'SKILL.md', content: '' }] };

export function SubmitPage({ connected }: { connected: boolean }) {
  return connected ? <ConnectedSubmit/> : <SubmissionForm/>;
}

function ConnectedSubmit() {
  const review = useAction(reviewSubmission);
  return <SubmissionForm review={submission => review({ submission })}/>;
}

function SubmissionForm({ review }: { review?: (submission: Submission) => Promise<ReviewResult> }) {
  const [draft, setDraft] = useState<Submission>(initialSubmission);
  const [fileIndex, setFileIndex] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [reading, setReading] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const activeFile = draft.files[fileIndex] ?? draft.files[0];
  const update = <K extends keyof Submission>(key: K, value: Submission[K]) => {
    setDraft(current => ({ ...current, [key]: value }));
    setResult(null);
  };
  const updateFile = (key: keyof SourceFile, value: string) => update('files', draft.files.map((file, index) => index === fileIndex ? { ...file, [key]: value } : file));
  const selectKind = (kind: SubmissionKind) => {
    if (kind !== 'skill' && draft.files.length > 1) {
      setErrors(['Commands and subagents contain one file. Keep the file you want before changing the submission type.']);
      return;
    }
    setDraft(current => ({ ...current, kind, files: current.files.map(file => !file.content && ['SKILL.md', 'agent.md', 'command.md'].includes(file.path) ? { ...file, path: kind === 'skill' ? 'SKILL.md' : kind === 'subagent' ? 'agent.md' : 'command.md' } : file) }));
    setResult(null);
    setErrors([]);
  };
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!selected.length) return;
    setReading(true);
    setErrors([]);
    try {
      if (selected.length > (draft.kind === 'skill' ? LIMITS.files : 1)) throw new Error(draft.kind === 'skill' ? 'Choose up to 24 text files for one skill.' : 'Choose one Markdown file for a command or subagent.');
      if (selected.some(file => file.size > LIMITS.fileBytes)) throw new Error('Each file must be 48 KiB or smaller.');
      if (selected.reduce((sum, file) => sum + file.size, 0) > LIMITS.totalBytes) throw new Error('The complete submission must be 128 KiB or smaller.');
      const loaded: SourceFile[] = await Promise.all(selected.map(async file => ({ path: file.webkitRelativePath || file.name, content: new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer()) })));
      const normalized = normalizeUploadFiles(loaded);
      if (normalized.some(file => file.content.includes('\0'))) throw new Error('Choose UTF-8 text files. Binary files cannot be reviewed.');
      update('files', normalized);
      setFileIndex(0);
    } catch (error) {
      setErrors([error instanceof TypeError ? 'One of those files is not valid UTF-8 text.' : error instanceof Error ? error.message : 'Those files could not be read.']);
    } finally { setReading(false); }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setErrors([]);
    setResult(null);
    const validation = validateSubmission(draft);
    if (!validation.ok) { setErrors(validation.errors); return; }
    if (!review) { setErrors(['Reviews are temporarily unavailable. Your draft is still here; please try again later.']); return; }
    setReviewing(true);
    try {
      const response = await review(validation.submission as Submission);
      setResult(response);
    } catch {
      setResult({ status: 'unavailable', summary: 'The review could not finish. Your draft is still here. Please try again in a little while.', checks: [], repairPrompt: '' });
    } finally {
      setReviewing(false);
      requestAnimationFrame(() => resultsRef.current?.focus());
    }
  };
  return <main id="main" className="submit-main"><Link href="/" className="back-link"><ArrowLeft size={15} aria-hidden="true"/>Back to the collection</Link><header className="submit-heading"><div><p className="section-kicker"><span className="tiny-dot"/>GOOD THINGS ARE BETTER SHARED</p><h1>Make someone’s<br/><em>work a little better.</em></h1><p>A useful skill. A thoughtful specialist. A prompt you keep coming back to.<br className="desktop-break"/> Share it once, let someone else build on it.</p></div><button className="how-review-link" onClick={() => setHowOpen(true)}><ShieldCheck size={19} strokeWidth={1.5} aria-hidden="true"/>How reviews work<ArrowUpRight size={14} aria-hidden="true"/></button></header><div className="submission-layout"><form onSubmit={submit} className="submission-form"><fieldset disabled={reviewing || reading}><section className="form-section"><div className="form-section-title"><span>01</span><div><h2>What are you sharing?</h2><p>One useful resource at a time.</p></div></div><div className="submission-kinds">{(['skill', 'subagent', 'command'] as const).map(kind => <button type="button" key={kind} className={`submission-kind ${draft.kind === kind ? 'selected' : ''}`} aria-pressed={draft.kind === kind} onClick={() => selectKind(kind)}><KindIcon kind={kind} size={23}/><strong>{kindLabels[kind]}</strong><span>{kind === 'skill' ? 'Reusable know-how' : kind === 'subagent' ? 'A focused specialist' : 'A reusable prompt'}</span><span className="kind-radio" aria-hidden="true">{draft.kind === kind && <Check size={10}/>}</span></button>)}</div><p className="form-note">MCP servers are added by the library’s maintainers.</p><Field htmlFor="submission-title" label="Give it a name"><Input id="submission-title" value={draft.title} onChange={event => update('title', event.target.value)} maxLength={LIMITS.title} placeholder="A clear, useful name" required/></Field><Field htmlFor="submission-summary" label="What does it help with?" hint="Tell someone what they can do with it. A sentence or two is plenty."><Textarea id="submission-summary" value={draft.summary} onChange={event => update('summary', event.target.value)} rows={3} maxLength={LIMITS.summary} required placeholder="Describe the work it makes easier…"/></Field><div className="form-pair"><Field htmlFor="submission-area" label="Business area"><select className="input" id="submission-area" value={draft.area} onChange={event => update('area', event.target.value)}>{AREAS.map(area => <option key={area} value={area}>{area}</option>)}</select></Field><Field htmlFor="submission-owner" label="Creator’s GitHub handle" hint="Attribution is public and contributor-provided."><div className="input-prefix"><span aria-hidden="true">@</span><Input id="submission-owner" value={draft.owner} onChange={event => update('owner', event.target.value)} maxLength={39} placeholder="your-handle" autoCapitalize="none" autoComplete="off" spellCheck={false} required/></div></Field></div><Field htmlFor="submission-repository" label={draft.kind === 'skill' ? 'GitHub repository' : 'GitHub repository (optional)'} hint={draft.kind === 'skill' ? 'The repository people will install this skill from.' : 'Link to the original source when there is one.'}><Input id="submission-repository" type="url" value={draft.repository} onChange={event => update('repository', event.target.value)} maxLength={240} placeholder="https://github.com/owner/repository" required={draft.kind === 'skill'}/></Field><Field htmlFor="submission-license" label="License" hint="Share only content you have permission to publish under this license."><Input id="submission-license" value={draft.license} onChange={event => update('license', event.target.value)} placeholder="e.g. MIT, Apache-2.0, CC-BY-4.0" maxLength={80} required/></Field></section><section className="form-section"><div className="form-section-title"><span>02</span><div><h2>The useful part.</h2><p>{draft.kind === 'skill' ? 'Your SKILL.md and any text files it needs.' : 'One complete Markdown file. Nothing left out.'}</p></div></div><div className="upload-actions"><Button variant="secondary" size="small" onClick={() => fileInput.current?.click()}><Upload size={14} aria-hidden="true"/>{draft.kind === 'skill' ? 'Choose files' : 'Choose a file'}</Button>{draft.kind === 'skill' && <Button variant="secondary" size="small" onClick={() => folderInput.current?.click()}><FolderUp size={15} aria-hidden="true"/>Choose a folder</Button>}<span>or paste your text below</span></div><input ref={fileInput} className="sr-only" type="file" multiple={draft.kind === 'skill'} accept=".md,.txt,.json,.yaml,.yml,.js,.ts,.mjs,.py,.sh,.csv,.toml,.xml,.html,.css" onChange={upload} aria-label="Upload resource files" tabIndex={-1}/><input ref={element => { folderInput.current = element; element?.setAttribute('webkitdirectory', ''); }} className="sr-only" type="file" multiple onChange={upload} aria-label="Upload a skill folder" tabIndex={-1}/><div className="file-editor"><div className="file-tabs" aria-label="Submission files">{draft.files.map((file, index) => <button type="button" key={index} className={fileIndex === index ? 'selected' : ''} aria-pressed={fileIndex === index} onClick={() => setFileIndex(index)} title={file.path}><FilePlus2 size={13} aria-hidden="true"/>{file.path || 'Untitled'}</button>)}{draft.kind === 'skill' && draft.files.length < LIMITS.files && <button type="button" aria-label="Add a file" className="add-file" onClick={() => { update('files', [...draft.files, { path: `reference-${draft.files.length}.md`, content: '' }]); setFileIndex(draft.files.length); }}><Plus size={15} aria-hidden="true"/></button>}</div><div className="file-path-row"><label htmlFor="source-path">File path</label><input id="source-path" value={activeFile.path} onChange={event => updateFile('path', event.target.value)} maxLength={200} spellCheck={false}/>{draft.files.length > 1 && <button type="button" aria-label={`Remove ${activeFile.path}`} onClick={() => { update('files', draft.files.filter((_, index) => index !== fileIndex)); setFileIndex(Math.max(0, fileIndex - 1)); }}><X size={14} aria-hidden="true"/></button>}</div><label className="sr-only" htmlFor="source-content">File content</label><textarea id="source-content" className="source-editor" value={activeFile.content} onChange={event => updateFile('content', event.target.value)} spellCheck={false} autoCapitalize="none" autoCorrect="off" maxLength={LIMITS.fileBytes} placeholder={draft.kind === 'skill' ? 'Paste your complete SKILL.md, including its name and description frontmatter…' : 'Paste the complete Markdown content…'} rows={18}/><div className="editor-footer"><span>Plain text. Never executed.</span><span>{draft.files.length}/{draft.kind === 'skill' ? LIMITS.files : 1} {draft.kind === 'skill' ? 'files' : 'file'} · {new TextEncoder().encode(draft.files.map(file => file.content).join('')).byteLength.toLocaleString()} bytes</span></div></div><p className="form-note">UTF-8 text only. Up to 48 KiB per file and 128 KiB in total. Don’t include credentials or private information.</p></section><section className="form-section publish-section"><div className="form-section-title"><span>03</span><div><h2>Give it a second pair of eyes.</h2><p>Eight checks, useful feedback, then onto the shelf.</p></div></div>{errors.length > 0 && <div className="form-errors" role="alert"><strong>A few things to fix first</strong><ul>{errors.map((error, index) => <li key={index}>{error}</li>)}</ul></div>}<p className="publication-consent">By submitting, you agree to publish these files and their attribution publicly under the license you provided if the review passes. Rejected submissions stay out of the public catalogue.</p><Button type="submit" disabled={reviewing || reading || !review} className="review-submit">{reviewing ? <><LoaderCircle className="spin" size={16} aria-hidden="true"/>Reviewing your resource…</> : reading ? 'Reading files…' : <><span>{result && result.status !== 'approved' ? 'Review again' : 'Review & publish'}</span><ArrowRight size={16} aria-hidden="true"/></>}</Button>{!review && <p className="review-unavailable" role="status">Reviews are temporarily unavailable. You can prepare a draft here, but it cannot be published yet.</p>}</section></fieldset></form><aside ref={resultsRef} tabIndex={-1} className="review-sidebar" aria-label="Submission review" aria-live="polite">{reviewing ? <div className="review-waiting"><span className="review-symbol"><LoaderCircle className="spin" size={27} aria-hidden="true"/></span><p className="section-kicker">A THOUGHTFUL SECOND LOOK</p><h2>Reading between<br/>the lines.</h2><p>Your resource is being checked for clarity, completeness, permissions, safety and fit. This may take a moment.</p></div> : result ? <ReviewPanel result={result}/> : <div className="review-intro"><span className="review-symbol"><ShieldCheck size={28} strokeWidth={1.2} aria-hidden="true"/></span><p className="section-kicker">BUILT TO BE USEFUL</p><h2>Good work deserves<br/>a good review.</h2><p>An AI review checks eight things before anything is published. If something needs work, you’ll get clear fixes and a prompt to help you get there.</p><ol>{['Format & structure', 'Purpose & business use', 'Clear instructions', 'Complete files', 'Appropriate permissions', 'Safe behavior', 'Portability', 'Attribution & license'].map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, '0')}</span>{item}</li>)}</ol><span className="review-footnote">No account needed. No credentials requested.</span></div>}</aside></div><Dialog.Root open={howOpen} onOpenChange={setHowOpen}><Dialog.Portal><Dialog.Overlay className="dialog-overlay"/><Dialog.Content className="dialog-content"><Dialog.Title>Useful, complete, ready to share.</Dialog.Title><Dialog.Description>Every public submission goes through an AI review before it joins the catalogue.</Dialog.Description><ol className="review-explainer"><li><strong>Start with the files.</strong><p>Paste or upload one skill, subagent or command, including its license and attribution.</p></li><li><strong>Get eight clear checks.</strong><p>The review looks at format, purpose, instructions, completeness, permissions, safety, portability and attribution.</p></li><li><strong>Make it better, or put it to work.</strong><p>A passing resource is published. Otherwise, your feedback includes the issues, fixes and a prompt you can copy to make another attempt.</p></li></ol><p className="dialog-note">Review is a quality screen, not a guarantee. Always read a resource before using it with access to your tools or data.</p><Dialog.Close asChild><Button variant="secondary">Got it</Button></Dialog.Close><Dialog.Close className="dialog-close" aria-label="Close review explanation"><X size={18} aria-hidden="true"/></Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root></main>;
}

function ReviewPanel({ result }: { result: ReviewResult }) {
  const approved = result.status === 'approved';
  return <div className={`review-result ${approved ? 'approved' : ''}`}><span className="review-symbol">{approved ? <Check size={29} strokeWidth={1.4} aria-hidden="true"/> : <ShieldCheck size={29} strokeWidth={1.2} aria-hidden="true"/>}</span><p className="section-kicker">{approved ? 'READY FOR THE SHELF' : result.status === 'changes_requested' || result.status === 'invalid' ? 'A LITTLE WORK TO DO' : 'LET’S TRY THAT AGAIN LATER'}</p><h2>{approved ? 'Something good,\nnow shared.' : result.status === 'changes_requested' || result.status === 'invalid' ? 'A few changes.\nA better resource.' : 'The review\ncouldn’t finish.'}</h2><p>{result.summary}</p>{result.checks.length > 0 && <ul className="review-checks">{result.checks.map(check => <li key={check.id} className={check.passed ? 'passed' : 'needs-work'}><span className="review-check-icon" aria-hidden="true">{check.passed ? <Check size={13}/> : '↗'}</span><div><h3>{check.title}<Badge>{check.passed ? 'Passed' : 'Needs work'}</Badge></h3>{!check.passed && <>{check.issue && <p>{check.issue}</p>}{check.fix && <p className="review-fix"><strong>To fix:</strong> {check.fix}</p>}</>}</div></li>)}</ul>}{result.repairPrompt && <section className="repair-prompt"><h3>A useful next step.</h3><p>Take this prompt to your assistant, make the changes, then review your resource again.</p><pre tabIndex={0}>{result.repairPrompt}</pre><CopyButton text={result.repairPrompt} label="Copy repair prompt"/></section>}{approved && result.entrySlug && <Link href={`/items/${encodeURIComponent(result.entrySlug)}`} className="button button-primary button-default">View your resource<ArrowUpRight size={15} aria-hidden="true"/></Link>}</div>;
}
