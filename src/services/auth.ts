"use client";

import { LoginRequest } from "@/types";
import { authApi } from "@/services/api";
import {
  clearSessionSnapshot,
  getSessionSnapshot,
  setSessionSnapshot,
} from "@/services/auth-session";

export function isAdminActor(role: string) {
  return role === "admin";
}

export async function login(credentials: LoginRequest) {
  const session = await authApi.login(credentials);
  setSessionSnapshot(session);
  return session;
}

export async function fetchCurrentActor() {
  const actor = await authApi.getCurrentActor();
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
