import { useEffect, useState } from 'react';
import { ArrowRight, Blocks, Bot, Check, Copy, FileText, Plug, type LucideIcon } from 'lucide-react';
import { Button } from './ui/button';
import type { Kind } from '../types';

export const kindLabels: Record<Kind, string> = { skill: 'Skill', mcp: 'MCP server', subagent: 'Subagent', command: 'Command' };
export const kindPlural: Record<Kind, string> = { skill: 'Skills', mcp: 'MCP Servers', subagent: 'Subagents', command: 'Commands' };
export const kindRoutes: Record<Kind, string> = { skill: '/skills', mcp: '/mcp-servers', subagent: '/subagents', command: '/commands' };
const icons: Record<Kind, LucideIcon> = { skill: Blocks, mcp: Plug, subagent: Bot, command: FileText };

export function KindIcon({ kind, size = 18 }: { kind: Kind; size?: number }) {
  const Icon = icons[kind];
  return <Icon size={size} strokeWidth={1.6} aria-hidden="true" />;
}

export function Mark({ small = false }: { small?: boolean }) {
  return <svg viewBox="0 0 32 32" fill="none" className={small ? 'brand-mark small' : 'brand-mark'} aria-hidden="true"><path d="M5 8.5 16 3l11 5.5L16 14 5 8.5Z" fill="currentColor"/><path d="m5 15 11 5.5L27 15M5 21.5 16 27l11-5.5" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round"/></svg>;
}

export function CopyButton({ text, label = 'Copy', className = '' }: { text: string; label?: string; className?: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  useEffect(() => setStatus('idle'), [text]);
  return <span className={`copy-control ${className}`}><Button variant="secondary" size="small" onClick={async () => {
    try { await navigator.clipboard.writeText(text); setStatus('copied'); }
    catch { setStatus('failed'); }
  }} aria-label={status === 'copied' ? `${label}: copied` : label}>{status === 'copied' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}{status === 'copied' ? 'Copied' : label}</Button><span className="copy-message" role="status">{status === 'failed' ? 'Could not copy. Select the text instead.' : ''}</span></span>;
}

export function ArrowLabel({ children }: { children: React.ReactNode }) {
  return <>{children}<ArrowRight size={15} aria-hidden="true" /></>;
}
