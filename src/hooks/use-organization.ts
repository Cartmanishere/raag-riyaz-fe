"use client";

import * as React from "react";
import { organizationApi } from "@/services/api";
import { getOrgSlugFromHostname } from "@/lib/domain";

let cachedOrgName: string | null = null;
let cachedOrgSlug: string | null = null;
let fetchPromise: Promise<string | null> | null = null;

function fetchOrgName(slug: string): Promise<string | null> {
  if (cachedOrgSlug === slug && cachedOrgName !== null) {
    return Promise.resolve(cachedOrgName);
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = organizationApi
    .getBySlug(slug)
    .then((org) => {
      cachedOrgSlug = slug;
      cachedOrgName = org.name;
      return org.name;
    })
    .catch(() => {
      cachedOrgSlug = slug;
      cachedOrgName = null;
      return null;
    })
    .finally(() => {
      fetchPromise = null;
    });

  return fetchPromise;
}

export function useOrganization(): string | null {
  const [orgName, setOrgName] = React.useState<string | null>(null);

  React.useEffect(() => {
    const slug = getOrgSlugFromHostname();

    if (!slug) {
      setOrgName(null);
      return;
    }

    let cancelled = false;

    void fetchOrgName(slug).then((name) => {
      if (!cancelled) {
        setOrgName(name);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return orgName;
}
