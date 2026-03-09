"use client";

import { LoginRequest } from "@/types";
import { adminUsersApi, authApi } from "@/services/api";
import {
  clearSessionSnapshot,
  getSessionSnapshot,
  setSessionSnapshot,
} from "@/services/auth-session";

export function isAdminActor(role: string) {
  return role === "admin";
}

async function enrichActorProfile(baseActor?: Awaited<ReturnType<typeof authApi.getCurrentActor>>) {
  const actor = baseActor ?? (await authApi.getCurrentActor());

  if (!isAdminActor(actor.role)) {
    return actor;
  }

  try {
    const user = await adminUsersApi.getById(actor.userId);

    return {
      ...actor,
      displayName: user.displayName,
      phone: user.phone,
      status: user.status,
    };
  } catch {
    return actor;
  }
}

export async function login(credentials: LoginRequest) {
  const session = await authApi.login(credentials);
  setSessionSnapshot(session);

  const actor = await enrichActorProfile(session.actor);
  const currentSession = getSessionSnapshot();

  if (currentSession) {
    const nextSession = {
      ...currentSession,
      actor,
    };

    setSessionSnapshot(nextSession);
    return nextSession;
  }

  return session;
}

export async function fetchCurrentActor() {
  const actor = await enrichActorProfile();
  const currentSession = getSessionSnapshot();

  if (currentSession) {
    setSessionSnapshot({
      ...currentSession,
      actor,
    });
  }

  return actor;
}

export async function logout() {
  const currentSession = getSessionSnapshot();

  try {
    if (currentSession?.refreshToken) {
      await authApi.logout({
        refreshToken: currentSession.refreshToken,
      });
    }
  } finally {
    clearSessionSnapshot();
  }
}
