const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const TRUSTED_FETCH_SITES = new Set(["same-origin", "none"]);

/**
 * Protection CSRF sans jeton : une écriture n'est acceptée que si le navigateur
 * l'atteste émise par notre propre origine. Un client qui n'envoie ni
 * `Sec-Fetch-Site` ni `Origin` n'est pas un navigateur, il ne porte donc pas la
 * session d'une victime.
 */
export function isCrossOriginUnsafeRequest({
  method,
  headers,
}: Pick<Request, "method" | "headers">): boolean {
  if (SAFE_METHODS.has(method.toUpperCase())) {
    return false;
  }

  const secFetchSite = headers.get("sec-fetch-site");
  if (secFetchSite !== null) {
    return !TRUSTED_FETCH_SITES.has(secFetchSite);
  }

  const origin = headers.get("origin");
  if (origin === null) {
    return false;
  }
  if (!URL.canParse(origin)) {
    return true;
  }

  const originHost = new URL(origin).host;
  return (
    originHost !== headers.get("host") &&
    originHost !== headers.get("x-forwarded-host")
  );
}
