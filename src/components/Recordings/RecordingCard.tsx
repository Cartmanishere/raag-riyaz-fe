"use client";

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  IconButton,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import PeopleIcon from "@mui/icons-material/People";
import { Recording } from "@/data/seed";

interface RecordingCardProps {
  recording: Recording;
  onView: (recording: Recording) => void;
  onEdit: (recording: Recording) => void;
  onDelete: (recording: Recording) => void;
}

export default function RecordingCard({
  recording,
  onView,
  onEdit,
  onDelete,
}: RecordingCardProps) {
  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.12)" },
      }}
    >
      <CardActionArea
        onClick={() => onView(recording)}
        sx={{ flex: 1, alignItems: "flex-start" }}
      >
        <CardContent sx={{ pb: 1 }}>
          {/* Icon + raag chip */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <MusicNoteIcon sx={{ color: "primary.main", fontSize: 20 }} />
            <Chip
              label={recording.raag}
              size="small"
              sx={{
                backgroundColor: "primary.main",
                color: "primary.contrastText",
                fontWeight: 600,
                fontSize: 11,
              }}
            />
          </Box>

          {/* Title */}
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            {recording.title}
          </Typography>

          {/* Taal */}
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
            Taal: {recording.taal ?? "—"}
          </Typography>

          {/* Student count */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <PeopleIcon sx={{ fontSize: 14, color: "text.disabled" }} />
            <Typography variant="caption" color="text.secondary">
              {recording.assignedStudentIds.length}{" "}
              {recording.assignedStudentIds.length === 1 ? "student" : "students"}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>

      {/* Actions */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          px: 1,
          pb: 1,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); onEdit(recording); }}
          aria-label="edit recording"
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); onDelete(recording); }}
          aria-label="delete recording"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </Card>
  );
}
