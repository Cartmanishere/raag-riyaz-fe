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
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { Recording } from "@/types";

interface RecordingCardProps {
  recording: Recording;
  onView: (recording: Recording) => void;
  onEdit: (recording: Recording) => void;
}

export default function RecordingCard({
  recording,
  onView,
  onEdit,
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

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label={recording.mimeType}
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: 11 }}
            />
            <Typography variant="caption" color="text.secondary">
              ID: {recording.id}
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
      </Box>
    </Card>
  );
}
