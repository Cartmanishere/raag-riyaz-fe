"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { AuthActor, AuthSession } from "@/types";
import {
  clearSessionSnapshot,
  deriveActorDisplayName,
  deriveActorInitials,
  getSessionSnapshot,
  hydrateSessionFromStorage,
  setSessionSnapshot,
  subscribeToSession,
} from "@/services/auth-session";
import { fetchCurrentActor, isAdminActor, login, logout } from "@/services/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  actor: AuthActor | null;
  session: AuthSession | null;
  status: AuthStatus;
  isTeacher: boolean;
  loginWithPassword: typeof login;
  logout: typeof logout;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

const TEACHER_ROUTE_PREFIX = "/teacher-dashboard";

function shouldProtectTeacherRoute(pathname: string) {
  return pathname.startsWith(TEACHER_ROUTE_PREFIX);
}

function isLoginRoute(pathname: string) {
  return pathname === "/login";
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

  React.useEffect(() => {
    let active = true;

    async function restoreSession() {
      const storedSession = hydrateSessionFromStorage();

      if (!storedSession) {
        if (active) {
          setStatus("unauthenticated");
          setBootstrapped(true);
        }
        return;
      }

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

        setStatus("authenticated");
      } catch {
        if (!active) {
          return;
        }

        clearSessionSnapshot();
        setStatus("unauthenticated");
      } finally {
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

    setStatus("unauthenticated");
  }, [bootstrapped, session]);

  React.useEffect(() => {
    if (!bootstrapped) {
      return;
    }

    if (shouldProtectTeacherRoute(pathname)) {
      if (!session) {
        router.replace("/login");
        return;
      }

      if (!isAdminActor(session.actor.role)) {
        void logout();
        router.replace("/login");
      }
      return;
    }

    if (isLoginRoute(pathname) && session && isAdminActor(session.actor.role)) {
      router.replace("/teacher-dashboard/students");
    }
  }, [bootstrapped, pathname, router, session]);

  const contextValue = React.useMemo<AuthContextValue>(
    () => ({
      actor: session?.actor ?? null,
      session,
      status,
      isTeacher: Boolean(session && isAdminActor(session.actor.role)),
      loginWithPassword: login,
      logout,
    }),
    [session, status]
  );

  const showProtectedLoader =
    !bootstrapped ||
    (shouldProtectTeacherRoute(pathname) &&
      (status === "loading" || (status === "authenticated" && !contextValue.isTeacher)));

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
