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
        gap: 2,
        px: 2,
        py: 1.5,
        borderBottom: "1px solid",
        borderColor: "divider",
        "&:last-child": { borderBottom: "none" },
      }}
    >
      <Avatar
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          width: 42,
          height: 42,
          fontSize: 14,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {initials}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          component={Link}
          href={`/teacher-dashboard/students/${student.id}`}
          variant="body2"
          fontWeight={600}
          noWrap
          sx={{
            color: "text.primary",
            textDecoration: "none",
            "&:hover": { color: "primary.main" },
          }}
        >
          {displayName}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {student.email}
          {student.phone ? ` • ${student.phone}` : ""}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: statusColor,
            }}
          />
          <Typography
            variant="caption"
            color={statusColor}
            fontWeight={500}
            sx={{ minWidth: 52, textTransform: "capitalize" }}
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
