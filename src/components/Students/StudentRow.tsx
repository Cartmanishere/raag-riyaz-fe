"use client";

import Link from "next/link";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Avatar, Box, IconButton, Typography } from "@mui/material";
import { deriveActorDisplayName, deriveActorInitials } from "@/services/auth-session";
import { User } from "@/types";

interface StudentRowProps {
  student: User;
  onEdit: (student: User) => void;
}

function getStatusColor(status: string) {
  return status.toLowerCase() === "active" ? "success.main" : "text.disabled";
}

function formatStatus(status: string) {
  if (!status.trim()) {
    return "Unknown";
  }

  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export default function StudentRow({ student, onEdit }: StudentRowProps) {
  const displayName = deriveActorDisplayName(student);
  const initials = deriveActorInitials(student);
  const statusColor = getStatusColor(student.status);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 1.5, sm: 2 },
        px: { xs: 1.5, sm: 2.5 },
        py: { xs: 1.5, sm: 2 },
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        transition: "border-color 0.15s, background-color 0.15s",
        "&:hover": {
          borderColor: "primary.light",
          backgroundColor: "action.hover",
        },
      }}
    >
      <Link
        href={`/teacher-dashboard/students/detail?id=${student.id}`}
        style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0, textDecoration: "none" }}
      >
        <Avatar
          sx={{
            bgcolor: "primary.main",
            color: "primary.contrastText",
            width: { xs: 44, sm: 52 },
            height: { xs: 44, sm: 52 },
            fontSize: { xs: 16, sm: 20 },
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initials}
        </Avatar>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body1"
            fontWeight={600}
            color="text.primary"
            noWrap
            sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
          >
            {displayName}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {student.email}
            {student.phone ? ` • ${student.phone}` : ""}
          </Typography>
        </Box>
      </Link>

      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 }, flexShrink: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: statusColor, flexShrink: 0 }} />
          <Typography
            variant="body2"
            color={statusColor}
            fontWeight={500}
            sx={{ minWidth: { xs: 44, sm: 52 }, textTransform: "capitalize", display: { xs: "none", sm: "block" } }}
          >
            {formatStatus(student.status)}
          </Typography>
        </Box>

        <IconButton
          size="small"
          aria-label={`Edit ${displayName}`}
          onClick={() => onEdit(student)}
        >
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
