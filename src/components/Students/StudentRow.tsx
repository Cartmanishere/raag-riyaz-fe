"use client";

import { Avatar, Box, IconButton, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Student } from "@/data/seed";

interface StudentRowProps {
  student: Student;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onView: (id: number) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function StudentRow({
  student,
  onEdit,
  onDelete,
  onView,
}: StudentRowProps) {
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
        "&:hover": { backgroundColor: "action.hover", cursor: "pointer" },
      }}
      onClick={() => onView(student.id)}
    >
      {/* Avatar */}
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
        {getInitials(student.name)}
      </Avatar>

      {/* Name */}
      <Typography
        variant="body2"
        fontWeight={600}
        sx={{ flex: 1, minWidth: 0 }}
        noWrap
      >
        {student.name}
      </Typography>

      {/* Status dot + text */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: student.status === "Active" ? "success.main" : "text.disabled",
          }}
        />
        <Typography
          variant="caption"
          color={student.status === "Active" ? "success.main" : "text.disabled"}
          fontWeight={500}
          sx={{ minWidth: 52 }}
        >
          {student.status}
        </Typography>
      </Box>

      {/* Level */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ flexShrink: 0, minWidth: 80 }}
      >
        {student.level}
      </Typography>

      {/* Actions */}
      <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(student);
          }}
          aria-label="edit student"
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(student);
          }}
          aria-label="delete student"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
        <ChevronRightIcon sx={{ color: "text.disabled", fontSize: 20 }} />
      </Box>
    </Box>
  );
}
