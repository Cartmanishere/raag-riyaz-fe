"use client";

export function getBaseDomain(): string {
  return process.env.NEXT_PUBLIC_BASE_DOMAIN || window.location.hostname;
}

export function getOrgSlugFromHostname(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const hostname = window.location.hostname;
  const baseDomain = getBaseDomain();

  if (hostname === baseDomain) {
    return null;
  }

  const suffix = `.${baseDomain}`;
  if (hostname.endsWith(suffix)) {
    return hostname.slice(0, -suffix.length);
  }

  return null;
}

export function getBaseUrl(): string {
  const { protocol, port } = window.location;
  const portSuffix = port ? `:${port}` : "";
  return `${protocol}//${getBaseDomain()}${portSuffix}`;
}

export function getSubdomainUrl(slug: string): string {
  const { protocol, port, pathname, search, hash } = window.location;
  const portSuffix = port ? `:${port}` : "";
  return `${protocol}//${slug}.${getBaseDomain()}${portSuffix}${pathname}${search}${hash}`;
}
