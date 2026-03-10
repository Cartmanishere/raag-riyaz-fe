"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
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
  Tooltip,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PeopleIcon from "@mui/icons-material/People";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { useActorDisplay, useAuth } from "@/components/Auth/AuthProvider";

const DRAWER_WIDTH = 240;

const navItems = [
  {
    label: "Students Management",
    icon: <PeopleIcon />,
    path: "/teacher-dashboard/students",
  },
  {
    label: "Recording Management",
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
  const { actor } = useAuth();
  const { displayName, initials } = useActorDisplay();

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Drawer header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 2 }}>
        <MusicNoteIcon sx={{ color: "primary.main" }} />
        <Typography variant="subtitle1" fontWeight={700} noWrap>
          Raag Riyaz
        </Typography>
      </Box>

      <Divider />

      <List sx={{ flex: 1, pt: 1 }}>
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
                  minHeight: 48,
                  px: 2.5,
                  borderRadius: 1,
                  mx: 1,
                  mb: 0.5,
                  "&.Mui-selected": {
                    backgroundColor: "primary.main",
                    color: "primary.contrastText",
                    "& .MuiListItemIcon-root": {
                      color: "primary.contrastText",
                    },
                    "&:hover": { backgroundColor: "primary.dark" },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: 2 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Profile at bottom */}
      <Divider />
      <Tooltip title="Profile">
        <ButtonBase
          onClick={() => {
            router.push("/teacher-dashboard/profile");
            setOpen(false);
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2,
            py: 1.5,
            width: "100%",
            justifyContent: "flex-start",
            "&:hover": { backgroundColor: "action.hover" },
          }}
        >
          <Avatar
            sx={{
              bgcolor: "primary.main",
              color: "primary.contrastText",
              width: 36,
              height: 36,
              fontSize: 14,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ textAlign: "left", minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {displayName || actor?.email || "Teacher"}
            </Typography>
            {actor?.email && displayName && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {actor.email}
              </Typography>
            )}
          </Box>
        </ButtonBase>
      </Tooltip>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Hamburger toggle — floats top-left */}
      <IconButton
        onClick={() => setOpen(true)}
        size="medium"
        sx={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 1200,
          backgroundColor: "background.paper",
          boxShadow: 2,
          "&:hover": { backgroundColor: "background.paper" },
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* Drawer — always temporary overlay */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={() => setOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          minWidth: 0,
          backgroundColor: "background.default",
          minHeight: "100vh",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
