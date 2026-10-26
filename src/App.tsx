import { Component, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ArrowUpRight, Plus } from 'lucide-react';
import { DetailPage, LibraryPage, Unavailable } from './components/library';
import { SubmitPage } from './components/submit';
import { Mark } from './components/shared';
import { Link, NavigationProvider, useNavigation } from './navigation';
import type { Kind } from './types';

const configuredUrl = import.meta.env.VITE_CONVEX_URL;
let convex: ConvexReactClient | undefined;
if (configuredUrl && /^https:\/\/[^\s/]+\.convex\.cloud\/?$/.test(configuredUrl)) {
  convex = new ConvexReactClient(configuredUrl);
}

class LibraryBoundary extends Component<{ children: ReactNode; resetKey: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { /* Public errors remain generic; provider details are not rendered. */ }
  componentDidUpdate(previous: { resetKey: string }) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() { return this.state.failed ? <main id="main" className="boundary-main"><Unavailable/></main> : this.props.children; }
}

function AppRoutes() {
  const { location } = useNavigation();
  const kindByPath: Record<string, Kind> = { '/skills': 'skill', '/mcp-servers': 'mcp', '/subagents': 'subagent', '/commands': 'command' };
  const kind = kindByPath[location.pathname];
  const isDetail = location.pathname.startsWith('/items/');
  const isSubmit = location.pathname === '/submit';
  const known = location.pathname === '/' || !!kind || isDetail || isSubmit;
  let slug = '';
  try { if (isDetail) slug = decodeURIComponent(location.pathname.slice('/items/'.length)); } catch { slug = ''; }
  useEffect(() => {
    const titles = { skill: 'Skills', mcp: 'MCP Servers', subagent: 'Subagents', command: 'Commands' };
    document.title = `${isSubmit ? 'Share something useful' : kind ? titles[kind] : isDetail ? 'Resource' : 'Good agents, great work'} — Agent Library`;
  }, [location.pathname, kind, isDetail, isSubmit]);
  return <><a className="skip-link" href="#main">Skip to content</a><header className="site-header"><Link href="/" className="brand" aria-label="Agent Library home"><Mark/><span>agent<span className="brand-second">library</span><span className="brand-period">.</span></span></Link><div className="header-caption">A LITTLE INTELLIGENCE.<br/>A LOT OF POSSIBILITY.</div><nav aria-label="Main navigation"><a className="github-link" aria-label="Open source on GitHub" href="https://github.com/alvarovillalbaa/agent-library" target="_blank" rel="noreferrer"><span>Open source</span><ArrowUpRight size={12} aria-hidden="true"/></a><Link href="/submit" className="button button-primary button-small"><Plus size={15} aria-hidden="true"/><span>Submit a resource</span></Link></nav></header><LibraryBoundary resetKey={location.pathname}>{isSubmit ? <SubmitPage connected={!!convex}/> : isDetail ? <DetailPage connected={!!convex} slug={slug}/> : known ? <LibraryPage connected={!!convex} kind={kind}/> : <main id="main" className="not-found"><p className="section-kicker">A DIFFERENT SHELF, PERHAPS</p><h1>That page isn’t here.</h1><Link href="/" className="button button-primary button-default">Explore the library<ArrowUpRight size={16} aria-hidden="true"/></Link></main>}</LibraryBoundary><footer className="site-footer"><Link href="/" className="footer-brand"><Mark small/>Useful things, shared openly.</Link><p>Skills. Connections. Specialists. A better starting point.</p><a href="https://github.com/alvarovillalbaa/agent-library" target="_blank" rel="noreferrer">Made to be built on<ArrowUpRight size={12} aria-hidden="true"/></a></footer></>;
}

export default function App() {
  const content = <NavigationProvider><AppRoutes/></NavigationProvider>;
  return convex ? <ConvexProvider client={convex}>{content}</ConvexProvider> : content;
}
