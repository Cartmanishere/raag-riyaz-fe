"use client";

import * as React from "react";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  Typography,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import BadgeIcon from "@mui/icons-material/Badge";
import BusinessIcon from "@mui/icons-material/Business";
import PhoneIcon from "@mui/icons-material/Phone";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import LogoutButton from "@/components/LogoutButton/LogoutButton";
import { useActorDisplay, useAuth } from "@/components/Auth/AuthProvider";

export default function ProfilePage() {
  const { actor } = useAuth();
  const { displayName, initials } = useActorDisplay();

  const details = React.useMemo(
    () =>
      [
        {
          icon: <EmailIcon sx={{ color: "primary.main" }} />,
          label: "Email",
          value: actor?.email ?? "-",
        },
        {
          icon: <WorkspacePremiumIcon sx={{ color: "primary.main" }} />,
          label: "Role",
          value: actor?.role ?? "-",
        },
        {
          icon: <VerifiedUserIcon sx={{ color: "primary.main" }} />,
          label: "Status",
          value: actor?.status ?? "-",
        },
        {
          icon: <PhoneIcon sx={{ color: "primary.main" }} />,
          label: "Phone",
          value: actor?.phone ?? "-",
        },
        {
          icon: <BusinessIcon sx={{ color: "primary.main" }} />,
          label: "Organization",
          value: actor?.orgId ?? "-",
        },
        {
          icon: <BadgeIcon sx={{ color: "primary.main" }} />,
          label: "User ID",
          value: actor?.userId ?? "-",
        },
      ].filter((detail) => detail.value !== "-"),
    [actor]
  );

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Avatar card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                py: 4,
                gap: 2,
              }}
            >
              <Avatar
                src={actor?.avatarUrl ?? undefined}
                alt={displayName || actor?.email || "Teacher"}
                sx={{
                  width: 96,
                  height: 96,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  fontSize: 32,
                  fontWeight: 700,
                }}
              >
                {initials}
              </Avatar>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h6" fontWeight={700}>
                  {displayName || actor?.email || "Teacher"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {actor?.role ?? "Teacher"}
                </Typography>
              </Box>
              <Box sx={{ width: "100%", px: 1, pt: 1 }}>
                <LogoutButton />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Details card */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                About
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                This profile reflects the authenticated backend account and only
                shows fields currently provided by the API.
              </Typography>

              <Divider sx={{ mb: 3 }} />

              <Typography variant="h6" fontWeight={600} gutterBottom>
                Details
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {details.map((d) => (
                  <Box
                    key={d.label}
                    sx={{ display: "flex", alignItems: "center", gap: 2 }}
                  >
                    {d.icon}
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        {d.label}
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {d.value}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
