"use client";

import * as React from "react";
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import SearchIcon from "@mui/icons-material/Search";
import {
  Recording,
  recordings as seedRecordings,
  students,
  teachers,
} from "@/data/seed";
import RecordingCard from "./RecordingCard";
import RecordingFormDialog from "./RecordingFormDialog";
import RecordingDetailDrawer from "./RecordingDetailDrawer";
import DeleteRecordingDialog from "./DeleteRecordingDialog";

const currentTeacher = teachers[0];

export default function RecordingLibrary() {
  const [recordings, setRecordings] = React.useState<Recording[]>(
    seedRecordings.filter((r) => r.teacherId === currentTeacher.id)
  );
  const [search, setSearch] = React.useState("");
  const [raagFilter, setRaagFilter] = React.useState("");

  // Detail drawer
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedRecording, setSelectedRecording] = React.useState<Recording | undefined>();

  // Form dialog
  const [formOpen, setFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<"add" | "edit">("add");
  const [editTarget, setEditTarget] = React.useState<Recording | undefined>();

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = React.useState<Recording | undefined>();

  // Unique raags for filter dropdown
  const raagOptions = Array.from(new Set(recordings.map((r) => r.raag))).sort();

  const filtered = recordings.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase());
    const matchesRaag = raagFilter ? r.raag === raagFilter : true;
    return matchesSearch && matchesRaag;
  });

  const handleView = (recording: Recording) => {
    setSelectedRecording(recording);
    setDetailOpen(true);
  };

  const handleOpenAdd = () => {
    setFormMode("add");
    setEditTarget(undefined);
    setFormOpen(true);
  };

  const handleOpenEdit = (recording: Recording) => {
    setDetailOpen(false);
    setFormMode("edit");
    setEditTarget(recording);
    setFormOpen(true);
  };

  const handleSave = (values: {
    title: string;
    raag: string;
    taal: string;
    notes: string;
    fileName: string;
  }) => {
    if (formMode === "add") {
      const newRec: Recording = {
        id: Date.now(),
        title: values.title,
        raag: values.raag,
        taal: values.taal || undefined,
        notes: values.notes,
        assignedStudentIds: [],
        teacherId: currentTeacher.id,
        duration: "00:00",
        date: new Date().toISOString().split("T")[0],
      };
      setRecordings((prev) => [newRec, ...prev]);
    } else if (editTarget) {
      setRecordings((prev) =>
        prev.map((r) =>
          r.id === editTarget.id
            ? {
                ...r,
                title: values.title,
                raag: values.raag,
                taal: values.taal || undefined,
                notes: values.notes,
              }
            : r
        )
      );
      // Refresh detail panel if open
      if (detailOpen && selectedRecording?.id === editTarget.id) {
        setSelectedRecording((prev) =>
          prev
            ? { ...prev, title: values.title, raag: values.raag, taal: values.taal || undefined, notes: values.notes }
            : prev
        );
      }
    }
    setFormOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    if (detailOpen && selectedRecording?.id === deleteTarget.id) setDetailOpen(false);
    setRecordings((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setDeleteTarget(undefined);
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Recording Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage all uploaded recordings
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<UploadIcon />} onClick={handleOpenAdd}>
          Upload Recording
        </Button>
      </Box>

      {/* Search + Raag filter */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          placeholder="Search recordings..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 200, maxWidth: 360 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Raag</InputLabel>
          <Select
            value={raagFilter}
            label="Raag"
            onChange={(e) => setRaagFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {raagOptions.map((raag) => (
              <MenuItem key={raag} value={raag}>
                {raag}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No recordings found.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {filtered.map((rec) => (
            <Grid item xs={12} sm={6} lg={4} key={rec.id}>
              <RecordingCard
                recording={rec}
                onView={handleView}
                onEdit={handleOpenEdit}
                onDelete={setDeleteTarget}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Detail slide-over */}
      <RecordingDetailDrawer
        open={detailOpen}
        recording={selectedRecording}
        allStudents={students}
        onClose={() => setDetailOpen(false)}
        onEdit={handleOpenEdit}
      />

      {/* Upload / Edit dialog */}
      <RecordingFormDialog
        open={formOpen}
        mode={formMode}
        recording={editTarget}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      {/* Delete confirmation */}
      <DeleteRecordingDialog
        open={!!deleteTarget}
        recordingTitle={deleteTarget?.title ?? ""}
        onClose={() => setDeleteTarget(undefined)}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  );
}
