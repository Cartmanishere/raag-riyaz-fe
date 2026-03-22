"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AppBar,
  Avatar,
  Box,
  ButtonBase,
  Button,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { useActorDisplay, useAuth } from "@/components/Auth/AuthProvider";

interface StudentDashboardShellProps {
  children: React.ReactNode;
}

export default function StudentDashboardShell({
  children,
}: StudentDashboardShellProps) {
  const router = useRouter();
  const { actor, logout } = useAuth();
  const { displayName, initials } = useActorDisplay();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, rgba(55,125,205,0.08) 0%, rgba(55,125,205,0.02) 18%, #f7f9fc 48%, #f4f6f8 100%)",
      }}
    >
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255, 255, 255, 0.72)",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)",
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 86, sm: 96 },
            px: { xs: 2, sm: 3 },
            gap: 2,
            justifyContent: "space-between",
          }}
        >
          <ButtonBase
            onClick={() => router.push("/student-dashboard")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1.5, sm: 2 },
              minWidth: 0,
              borderRadius: 2.5,
              px: 1,
              py: 0.75,
              ml: -1,
              "&:hover": { backgroundColor: "rgba(55,125,205,0.08)" },
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                bgcolor: "primary.main",
                color: "primary.contrastText",
                boxShadow: "0 12px 30px rgba(55,125,205,0.22)",
                flexShrink: 0,
              }}
            >
              <MusicNoteIcon />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" fontWeight={700} noWrap>
                Raag Riyaz
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                Student practice
              </Typography>
            </Box>
          </ButtonBase>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, sm: 1.5 },
              minWidth: 0,
              pl: { sm: 2 },
            }}
          >
            <Box
              sx={{
                textAlign: "right",
                display: { xs: "none", sm: "block" },
                minWidth: 0,
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} noWrap>
                {displayName || actor?.email || "Student"}
              </Typography>
              {actor?.email ? (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {actor.email}
                </Typography>
              ) : null}
            </Box>

            <Avatar
              sx={{
                bgcolor: "primary.main",
                color: "primary.contrastText",
                width: 42,
                height: 42,
                fontWeight: 700,
              }}
            >
              {initials}
            </Avatar>

            <Button
              variant="outlined"
              size="small"
              startIcon={<LogoutIcon />}
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              sx={{ borderRadius: 999 }}
            >
              Log out
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth={false}
        sx={{
          pt: { xs: 4, sm: 5 },
          pb: { xs: 8, sm: 10 },
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {children}
      </Container>
    </Box>
  );
}
