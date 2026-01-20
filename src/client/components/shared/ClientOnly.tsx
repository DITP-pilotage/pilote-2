import * as React from "react";
import { Suspense } from "react";

type ClientOnlyProps = {
  /** Rendered on the server, and on the client until hydration completes (optional). */
  fallback?: React.ReactNode;
  /**
   * Either regular children, or a render function that only runs on the client.
   * Prefer the render function when children need access to `window`, etc.
   */
  children: React.ReactNode | (() => React.ReactNode);
};

/**
 * ClientOnly
 * - SSR: renders `fallback` (or nothing).
 * - Client: renders children only after mount, preventing SSR/hydration issues.
 */
export function ClientOnly({ fallback = null, children }: ClientOnlyProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return fallback;
  if (typeof children === "function") return <Suspense>{children()}</Suspense>;
  return <Suspense>children</Suspense>;
}
