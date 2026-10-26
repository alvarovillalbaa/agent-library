import { createContext, useCallback, useContext, useEffect, useState, type AnchorHTMLAttributes, type ReactNode } from 'react';

type Location = { pathname: string; search: string };
type Navigation = { location: Location; navigate: (href: string, replace?: boolean) => void };
const NavigationContext = createContext<Navigation | null>(null);
const readLocation = (): Location => ({ pathname: window.location.pathname.replace(/\/$/, '') || '/', search: window.location.search });

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState(readLocation);
  useEffect(() => {
    const changed = () => setLocation(readLocation());
    window.addEventListener('popstate', changed);
    return () => window.removeEventListener('popstate', changed);
  }, []);
  const navigate = useCallback((href: string, replace = false) => {
    const next = new URL(href, window.location.origin);
    if (next.origin !== window.location.origin) return;
    window.history[replace ? 'replaceState' : 'pushState']({}, '', next.pathname + next.search + next.hash);
    setLocation(readLocation());
    if (!replace) window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  return <NavigationContext.Provider value={{ location, navigate }}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('NavigationProvider is required.');
  return context;
}

export function Link({ href = '/', onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { navigate } = useNavigation();
  return <a href={href} {...props} onClick={(event) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target || props.download) return;
    const destination = new URL(href, window.location.origin);
    if (destination.origin !== window.location.origin) return;
    event.preventDefault();
    navigate(href);
  }} />;
}
