"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { AuthActor, AuthOnboardingState, AuthSession } from "@/types";
import {
  clearOnboardingSnapshot,
  clearSessionSnapshot,
  deriveActorDisplayName,
  deriveActorInitials,
  getOnboardingSnapshot,
  getSessionSnapshot,
  hydrateOnboardingFromStorage,
  hydrateSessionFromStorage,
  setOnboardingSnapshot,
  setSessionSnapshot,
  subscribeToOnboarding,
  subscribeToSession,
} from "@/services/auth-session";
import {
  fetchCurrentActor,
  getDefaultRouteForRole,
  isAdminActor,
  isStudentActor,
  login,
  loginWithGoogle,
  logout,
} from "@/services/auth";

type AuthStatus =
  | "loading"
  | "authenticated"
  | "onboarding_needed"
  | "unauthenticated";

interface AuthContextValue {
  actor: AuthActor | null;
  onboarding: AuthOnboardingState | null;
  session: AuthSession | null;
  status: AuthStatus;
  isTeacher: boolean;
  isStudent: boolean;
  loginWithPassword: typeof login;
  loginWithGoogle: typeof loginWithGoogle;
  logout: typeof logout;
  clearOnboarding: typeof clearOnboardingSnapshot;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

const TEACHER_ROUTE_PREFIX = "/teacher-dashboard";
const STUDENT_ROUTE_PREFIX = "/student-dashboard";
const ONBOARDING_ROUTE = "/onboarding";

function shouldProtectTeacherRoute(pathname: string) {
  return pathname.startsWith(TEACHER_ROUTE_PREFIX);
}

function shouldProtectStudentRoute(pathname: string) {
  return pathname.startsWith(STUDENT_ROUTE_PREFIX);
}

function isLoginRoute(pathname: string) {
  return pathname === "/login";
}

function isOnboardingRoute(pathname: string) {
  return pathname === ONBOARDING_ROUTE;
}

function isAuthorizedForPath(
  pathname: string,
  actor: AuthActor | null | undefined,
) {
  if (!actor) {
    return false;
  }

  if (shouldProtectTeacherRoute(pathname)) {
    return isAdminActor(actor.role);
  }

  if (shouldProtectStudentRoute(pathname)) {
    return isStudentActor(actor.role);
  }

  return true;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = React.useState<AuthStatus>("loading");
  const [bootstrapped, setBootstrapped] = React.useState(false);
  const session = React.useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    () => null
  );
  const onboarding = React.useSyncExternalStore(
    subscribeToOnboarding,
    getOnboardingSnapshot,
    () => null
  );

  React.useEffect(() => {
    let active = true;

    async function restoreSession() {
      const storedSession = hydrateSessionFromStorage();
      const storedOnboarding = hydrateOnboardingFromStorage();

      if (storedSession) {
        try {
          const actor = await fetchCurrentActor();

          if (!active) {
            return;
          }

          const nextSession = getSessionSnapshot();
          if (nextSession) {
            setSessionSnapshot({
              ...nextSession,
              actor,
            });
          }

          if (storedOnboarding) {
            clearOnboardingSnapshot();
          }

          setStatus("authenticated");
          return;
        } catch {
          if (!active) {
            return;
          }

          clearSessionSnapshot();
        } finally {
          if (active) {
            setBootstrapped(true);
          }
        }
      }

      if (active) {
        if (storedOnboarding) {
          setOnboardingSnapshot(storedOnboarding);
          setStatus("onboarding_needed");
        } else {
          setStatus("unauthenticated");
        }

        if (active) {
          setBootstrapped(true);
        }
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (!bootstrapped) {
      return;
    }

    if (session) {
      setStatus("authenticated");
      return;
    }

    if (onboarding) {
      setStatus("onboarding_needed");
      return;
    }

    setStatus("unauthenticated");
  }, [bootstrapped, onboarding, session]);

  React.useEffect(() => {
    if (!bootstrapped) {
      return;
    }

    const isTeacherRoute = shouldProtectTeacherRoute(pathname);
    const isStudentRoute = shouldProtectStudentRoute(pathname);
    const isPendingRoute = isOnboardingRoute(pathname);

    if (session) {
      if (isTeacherRoute && !isAdminActor(session.actor.role)) {
        router.replace(getDefaultRouteForRole(session.actor.role));
        return;
      }

      if (isStudentRoute && !isStudentActor(session.actor.role)) {
        router.replace(getDefaultRouteForRole(session.actor.role));
        return;
      }

      if (isLoginRoute(pathname) || isPendingRoute) {
        router.replace(getDefaultRouteForRole(session.actor.role));
      }

      return;
    }

    if (onboarding) {
      if (!isPendingRoute) {
        router.replace(ONBOARDING_ROUTE);
      }
      return;
    }

    if (isPendingRoute) {
      router.replace("/login");
      return;
    }

    if (isTeacherRoute || isStudentRoute) {
      router.replace("/login");
    }
  }, [bootstrapped, onboarding, pathname, router, session]);

  const contextValue = React.useMemo<AuthContextValue>(
    () => ({
      actor: session?.actor ?? null,
      onboarding,
      session,
      status,
      isTeacher: Boolean(session && isAdminActor(session.actor.role)),
      isStudent: Boolean(session && isStudentActor(session.actor.role)),
      loginWithPassword: login,
      loginWithGoogle,
      logout,
      clearOnboarding: clearOnboardingSnapshot,
    }),
    [onboarding, session, status]
  );

  const isProtectedRoute =
    shouldProtectTeacherRoute(pathname) || shouldProtectStudentRoute(pathname);
  const pendingRoute = isOnboardingRoute(pathname);
  const isAuthorized = isAuthorizedForPath(pathname, session?.actor);

  const showProtectedLoader =
    !bootstrapped ||
    (isProtectedRoute && (!session || status === "loading" || !isAuthorized)) ||
    (isLoginRoute(pathname) &&
      (status === "loading" || Boolean(session) || Boolean(onboarding))) ||
    (pendingRoute &&
      (status === "loading" || Boolean(session) || (!session && !onboarding)));

  if (showProtectedLoader) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "background.default",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useActorDisplay() {
  const { actor } = useAuth();

  return React.useMemo(
    () => ({
      displayName: actor ? deriveActorDisplayName(actor) : "",
      initials: actor ? deriveActorInitials(actor) : "RR",
    }),
    [actor]
  );
}
