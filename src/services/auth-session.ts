"use client";

import { AuthActor, AuthOnboardingState, AuthSession } from "@/types";

const SESSION_STORAGE_KEY = "raag-riyaz.auth.session";
const ONBOARDING_STORAGE_KEY = "raag-riyaz.auth.onboarding";

type SessionListener = (session: AuthSession | null) => void;
type OnboardingListener = (onboarding: AuthOnboardingState | null) => void;

let sessionSnapshot: AuthSession | null = null;
let onboardingSnapshot: AuthOnboardingState | null = null;
const listeners = new Set<SessionListener>();
const onboardingListeners = new Set<OnboardingListener>();

function notifyListeners() {
  listeners.forEach((listener) => listener(sessionSnapshot));
}

function notifyOnboardingListeners() {
  onboardingListeners.forEach((listener) => listener(onboardingSnapshot));
}

export function getSessionSnapshot() {
  return sessionSnapshot;
}

export function getOnboardingSnapshot() {
  return onboardingSnapshot;
}

export function subscribeToSession(listener: SessionListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function subscribeToOnboarding(listener: OnboardingListener) {
  onboardingListeners.add(listener);
  return () => onboardingListeners.delete(listener);
}

export function setSessionSnapshot(session: AuthSession | null) {
  sessionSnapshot = session;

  if (typeof window !== "undefined") {
    if (session) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  notifyListeners();
}

export function setOnboardingSnapshot(onboarding: AuthOnboardingState | null) {
  onboardingSnapshot = onboarding;

  if (typeof window !== "undefined") {
    if (onboarding) {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(onboarding));
    } else {
      window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }
  }

  notifyOnboardingListeners();
}

export function hydrateSessionFromStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!rawSession) {
    sessionSnapshot = null;
    return null;
  }

  try {
    sessionSnapshot = JSON.parse(rawSession) as AuthSession;
    return sessionSnapshot;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionSnapshot = null;
    return null;
  }
}

export function hydrateOnboardingFromStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawOnboarding = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
  if (!rawOnboarding) {
    onboardingSnapshot = null;
    return null;
  }

  try {
    onboardingSnapshot = JSON.parse(rawOnboarding) as AuthOnboardingState;
    return onboardingSnapshot;
  } catch {
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    onboardingSnapshot = null;
    return null;
  }
}

export function clearSessionSnapshot() {
  setSessionSnapshot(null);
}

export function clearOnboardingSnapshot() {
  setOnboardingSnapshot(null);
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
