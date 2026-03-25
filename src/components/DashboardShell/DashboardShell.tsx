"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AppBar,
  Avatar,
  Box,
  ButtonBase,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PeopleIcon from "@mui/icons-material/People";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import GroupsIcon from "@mui/icons-material/Groups";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import LogoutIcon from "@mui/icons-material/Logout";
import { useActorDisplay, useAuth } from "@/components/Auth/AuthProvider";

const DRAWER_WIDTH = 240;

const navItems = [
  {
    label: "Students",
    icon: <PeopleIcon />,
    path: "/teacher-dashboard/students",
  },
  {
    label: "Batches",
    icon: <GroupsIcon />,
    path: "/teacher-dashboard/batches",
  },
  {
    label: "Recordings",
    icon: <AudiotrackIcon />,
    path: "/teacher-dashboard/recordings",
  },
];

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { actor, logout } = useAuth();
  const { displayName, initials } = useActorDisplay();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const currentSection = React.useMemo(
    () => navItems.find((item) => pathname.startsWith(item.path)),
    [pathname]
  );

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const drawerContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background:
          "linear-gradient(180deg, rgba(245,247,250,0.98) 0%, rgba(238,241,245,0.96) 100%)",
      }}
    >
      {/* Drawer header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 3,
          minHeight: { xs: 72, md: 76 },
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2.5,
            display: "grid",
            placeItems: "center",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            boxShadow: "0 14px 28px rgba(55,125,205,0.22)",
          }}
        >
          <MusicNoteIcon fontSize="small" />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={700} noWrap>
            Raag Riyaz
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            Teacher workspace
          </Typography>
        </Box>
      </Box>

      <Divider />

      <List sx={{ flex: 1, pt: 0, px: 0 }}>
        {navItems.map((item) => {
          const active = pathname.startsWith(item.path);
          return (
            <ListItem key={item.path} disablePadding sx={{ display: "block" }}>
              <ListItemButton
                selected={active}
                onClick={() => {
                  router.push(item.path);
                  setOpen(false);
                }}
                sx={{
                  minHeight: 52,
                  px: 2.5,
                  borderRadius: 0,
                  "&.Mui-selected": {
                    backgroundColor: "rgba(55,125,205,0.12)",
                    color: "text.primary",
                    borderRight: "3px solid",
                    borderColor: "primary.main",
                    "& .MuiListItemIcon-root": {
                      color: "primary.main",
                    },
                    "&:hover": { backgroundColor: "rgba(55,125,205,0.16)" },
                  },
                  "&:hover": {
                    backgroundColor: "rgba(55,125,205,0.08)",
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: 1.75, color: active ? "inherit" : "primary.main" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 700 : 600 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, rgba(247,249,252,0.98) 0%, rgba(252,253,255,0.98) 28%, #ffffff 100%)",
      }}
    >
      <AppBar
        position="fixed"
        color="transparent"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          backdropFilter: "blur(18px)",
          borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
          backgroundColor: "rgba(255, 255, 255, 0.86)",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)",
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 72, md: 76 },
            px: { xs: 2, md: 4 },
            gap: 2,
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
            <IconButton
              onClick={() => setOpen(true)}
              size="medium"
              sx={{
                display: { md: "none" },
                border: "1px solid rgba(15, 23, 42, 0.08)",
                backgroundColor: "rgba(255, 255, 255, 0.92)",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 1)" },
              }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 700 }}>
                Dashboard
              </Typography>
              <Typography variant="h6" fontWeight={700} noWrap>
                {currentSection?.label ?? "Teacher workspace"}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
            <ButtonBase
              onClick={() => router.push("/teacher-dashboard/profile")}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                borderRadius: 999,
                px: 1,
                py: 0.75,
                "&:hover": { backgroundColor: "rgba(55,125,205,0.08)" },
              }}
            >
              <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" }, minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={700} noWrap>
                  {displayName || actor?.email || "Teacher"}
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
                  width: 40,
                  height: 40,
                  fontSize: 14,
                  fontWeight: 700,
                  boxShadow: "0 10px 24px rgba(55,125,205,0.18)",
                }}
              >
                {initials}
              </Avatar>
            </ButtonBase>

            <IconButton
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              sx={{
                border: "1px solid rgba(15, 23, 42, 0.08)",
                backgroundColor: "rgba(255, 255, 255, 0.92)",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 1)" },
              }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          display: { xs: "none", md: "block" },
        }}
      >
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: DRAWER_WIDTH,
            height: "100vh",
            borderRight: "1px solid rgba(15, 23, 42, 0.08)",
            backgroundColor: "rgba(243, 246, 249, 0.94)",
            backdropFilter: "blur(18px)",
            boxShadow: "inset -1px 0 0 rgba(255,255,255,0.45)",
          }}
        >
          {drawerContent}
        </Box>
      </Box>

      <Drawer
        variant="temporary"
        open={open}
        onClose={() => setOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { md: "none" },
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            borderRight: "none",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: "100vh",
          minWidth: 0,
          pt: { xs: 11, md: 12 },
          pb: { xs: 3, md: 4 },
          px: { xs: 1.5, sm: 2, md: 4 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
