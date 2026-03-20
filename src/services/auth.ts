"use client";

import { LoginRequest } from "@/types";
import { adminUsersApi, authApi } from "@/services/api";
import {
  clearSessionSnapshot,
  getSessionSnapshot,
  setSessionSnapshot,
} from "@/services/auth-session";

export const ADMIN_ROLE = "admin";
export const USER_ROLE = "user";

export function isAdminActor(role: string) {
  return role === ADMIN_ROLE;
}

export function isStudentActor(role: string) {
  return role === USER_ROLE;
}

export function getDefaultRouteForRole(role: string) {
  if (isAdminActor(role)) {
    return "/teacher-dashboard/students";
  }

  if (isStudentActor(role)) {
    return "/student-dashboard";
  }

  return "/login";
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
