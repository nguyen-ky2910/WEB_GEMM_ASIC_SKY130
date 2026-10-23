import { useCallback, useEffect, useState } from "react";
import type { Page } from "../types/data";
export const pageNames: readonly Page[] = [
  "overview",
  "explorer",
  "architecture",
  "gemm",
  "axi",
  "flow",
  "eco",
  "waveform",
  "timing",
  "power",
  "area",
  "integrity",
  "verification",
  "comparison",
  "sources",
];
const analytics: readonly Page[] = [
  "overview",
  "eco",
  "timing",
  "power",
  "area",
  "integrity",
  "verification",
  "comparison",
  "sources",
];
export function pageFromHash(hash: string): Page {
  const name = hash.replace(/^#\/?/, "");
  return pageNames.includes(name as Page) ? (name as Page) : "explorer";
}
export function usePageNavigation() {
  const initial = pageFromHash(window.location.hash);
  const [page, setPage] = useState<Page>(initial);
  const [analyticPage, setAnalyticPage] = useState<Page>(
    analytics.includes(initial) ? initial : "overview",
  );
  const [visited, setVisited] = useState<Set<Page>>(() => new Set([initial]));
  const apply = useCallback((next: Page) => {
    setPage(next);
    setVisited((old) => new Set([...old, next]));
    if (analytics.includes(next)) setAnalyticPage(next);
  }, []);
  useEffect(() => {
    const update = () => apply(pageFromHash(window.location.hash));
    window.addEventListener("hashchange", update);
    if (window.location.hash !== `#/${initial}`)
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}#/${initial}`,
      );
    return () => window.removeEventListener("hashchange", update);
    // The initial hash is normalized once; later changes use the hashchange listener.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apply]);
  const navigate = useCallback(
    (next: Page) => {
      apply(next);
      if (window.location.hash !== `#/${next}`)
        window.location.hash = `/${next}`;
    },
    [apply],
  );
  return { page, analyticPage, visited, navigate };
}
