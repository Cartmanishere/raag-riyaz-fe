"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import { ApiError } from "@/types";
import GoogleSignInButton from "@/components/Auth/GoogleSignInButton";
import { useAuth } from "@/components/Auth/AuthProvider";
import { getGoogleAuthErrorMessage } from "@/services/auth-errors";
import { getDefaultRouteForRole } from "@/services/auth";

export default function OnboardingPage() {
  const router = useRouter();
  const { clearOnboarding, loginWithGoogle, logout, onboarding, session, status } = useAuth();
  const [error, setError] = React.useState("");
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [isRetrying, setIsRetrying] = React.useState(false);

  React.useEffect(() => {
    if (session) {
      router.replace(getDefaultRouteForRole(session.actor.role));
      return;
    }

    if (!onboarding && status !== "loading") {
      router.replace("/login");
    }
  }, [onboarding, router, session, status]);

  const handleRetry = async (credential: string) => {
    setError("");
    setIsRetrying(true);

    try {
      const result = await loginWithGoogle({ idToken: credential });

      if (result.status === "authenticated") {
        router.replace(getDefaultRouteForRole(result.session.actor.role));
        return;
      }

      router.replace("/onboarding");
    } catch (caughtError) {
      const apiError = caughtError as ApiError;
      setError(getGoogleAuthErrorMessage(apiError));
      throw caughtError;
    } finally {
      setIsRetrying(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
      clearOnboarding();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (status === "loading" || session || !onboarding) {
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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(180deg, rgba(55,125,205,0.08) 0%, rgba(55,125,205,0.02) 35%, #f7f9fc 100%)",
        px: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 560,
          borderRadius: 4,
          boxShadow: "0 16px 48px rgba(15, 23, 42, 0.08)",
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <PendingActionsIcon sx={{ fontSize: 48, color: "primary.main", mb: 1.5 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Google sign-in succeeded
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your identity is verified, but app access is still pending invite acceptance.
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            {onboarding.message}
          </Alert>

          <Box
            sx={{
              mb: 3,
              px: 2,
              py: 1.5,
              borderRadius: 3,
              backgroundColor: "rgba(55,125,205,0.06)",
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block">
              Signed in as
            </Typography>
            <Typography variant="subtitle1" fontWeight={700}>
              {onboarding.email}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Next step: {onboarding.nextStep.replaceAll("_", " ")}
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
            Try again after your invite is accepted
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Once your organization adds you, sign in with Google again to receive backend app tokens.
          </Typography>

          {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

          <Box sx={{ mb: 2.5 }}>
            <GoogleSignInButton
              onCredential={handleRetry}
              onError={setError}
              disabled={isRetrying || isLoggingOut}
            />
          </Box>

          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            onClick={handleSignOut}
            disabled={isLoggingOut || isRetrying}
          >
            {isLoggingOut ? <CircularProgress size={20} color="inherit" /> : "Sign out"}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
