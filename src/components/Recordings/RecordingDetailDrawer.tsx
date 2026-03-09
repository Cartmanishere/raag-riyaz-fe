"use client";

import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import { Recording } from "@/types";

interface RecordingDetailDrawerProps {
  open: boolean;
  recording?: Recording;
  onClose: () => void;
  onEdit: (recording: Recording) => void;
}

export default function RecordingDetailDrawer({
  open,
  recording,
  onClose,
  onEdit,
}: RecordingDetailDrawerProps) {
  if (!recording) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 420 } } }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Recording Detail
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => onEdit(recording)}
            variant="outlined"
          >
            Edit
          </Button>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ px: 3, py: 3, display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Details */}
        <Box>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            {recording.title}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
            <Chip
              label={recording.raag}
              size="small"
              sx={{
                backgroundColor: "primary.main",
                color: "primary.contrastText",
                fontWeight: 600,
              }}
            />
            {recording.taal && (
              <Chip label={`Taal: ${recording.taal}`} size="small" variant="outlined" />
            )}
          </Box>
          {recording.notes && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
              "{recording.notes}"
            </Typography>
          )}
        </Box>

        <Divider />

        <Box sx={{ display: "grid", gap: 1.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Recording ID
            </Typography>
            <Typography variant="body2">{recording.id}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              MIME type
            </Typography>
            <Typography variant="body2">{recording.mimeType}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Storage object key
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
              {recording.objectKey}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
