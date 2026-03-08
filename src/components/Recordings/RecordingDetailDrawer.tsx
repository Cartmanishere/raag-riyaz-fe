"use client";

import {
  Avatar,
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
import { Recording, Student } from "@/data/seed";

interface RecordingDetailDrawerProps {
  open: boolean;
  recording?: Recording;
  allStudents: Student[];
  onClose: () => void;
  onEdit: (recording: Recording) => void;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

export default function RecordingDetailDrawer({
  open,
  recording,
  allStudents,
  onClose,
  onEdit,
}: RecordingDetailDrawerProps) {
  if (!recording) return null;

  const assignedStudents = allStudents.filter((s) =>
    recording.assignedStudentIds.includes(s.id)
  );

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
        {/* Audio player */}
        <Box>
          <audio
            controls
            style={{ width: "100%", borderRadius: 8 }}
            aria-label="Recording audio preview"
          />
        </Box>

        <Divider />

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

        {/* Assigned students */}
        <Box>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
            Students with access ({assignedStudents.length})
          </Typography>

          {assignedStudents.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No students assigned.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {assignedStudents.map((student) => (
                <Box
                  key={student.id}
                  sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                >
                  <Avatar
                    sx={{
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      width: 32,
                      height: 32,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {getInitials(student.name)}
                  </Avatar>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {student.name}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        bgcolor: student.status === "Active" ? "success.main" : "text.disabled",
                      }}
                    />
                    <Typography
                      variant="caption"
                      color={student.status === "Active" ? "success.main" : "text.disabled"}
                    >
                      {student.status}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
