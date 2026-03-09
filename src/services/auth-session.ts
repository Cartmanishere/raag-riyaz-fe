"use client";

import { AuthActor, AuthSession } from "@/types";

const STORAGE_KEY = "raag-riyaz.auth.session";

type SessionListener = (session: AuthSession | null) => void;

let sessionSnapshot: AuthSession | null = null;
const listeners = new Set<SessionListener>();

function notifyListeners() {
  listeners.forEach((listener) => listener(sessionSnapshot));
}

export function getSessionSnapshot() {
  return sessionSnapshot;
}

export function subscribeToSession(listener: SessionListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setSessionSnapshot(session: AuthSession | null) {
  sessionSnapshot = session;

  if (typeof window !== "undefined") {
    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  notifyListeners();
}

export function hydrateSessionFromStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession = window.localStorage.getItem(STORAGE_KEY);
  if (!rawSession) {
    sessionSnapshot = null;
    return null;
  }

  try {
    sessionSnapshot = JSON.parse(rawSession) as AuthSession;
    return sessionSnapshot;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    sessionSnapshot = null;
    return null;
  }
}

export function clearSessionSnapshot() {
  setSessionSnapshot(null);
}

export function deriveActorDisplayName(actor: Pick<AuthActor, "email" | "displayName">) {
  if (actor.displayName && actor.displayName.trim().length > 0) {
    return actor.displayName.trim();
  }

  const email = actor.email;
  const localPart = email.split("@")[0] ?? email;
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function deriveActorInitials(actor: Pick<AuthActor, "email" | "displayName">) {
  const displayName = deriveActorDisplayName(actor);
  const parts = displayName.split(" ").filter(Boolean);

  if (parts.length === 0) {
    return "RR";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
