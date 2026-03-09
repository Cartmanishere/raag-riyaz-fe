"use client";

import * as React from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import SearchIcon from "@mui/icons-material/Search";
import RecordingCard from "./RecordingCard";
import RecordingFormDialog, { RecordingFormValues } from "./RecordingFormDialog";
import RecordingDetailDrawer from "./RecordingDetailDrawer";
import { adminRecordingsApi } from "@/services/api";
import { ApiError, Recording } from "@/types";

function toErrorMessage(error: ApiError | null, fallback: string) {
  return error?.message ?? fallback;
}

export default function RecordingLibrary() {
  const [recordings, setRecordings] = React.useState<Recording[]>([]);
  const [search, setSearch] = React.useState("");
  const [raagFilter, setRaagFilter] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<ApiError | null>(null);

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedRecording, setSelectedRecording] = React.useState<Recording | undefined>();

  const [formOpen, setFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<"add" | "edit">("add");
  const [editTarget, setEditTarget] = React.useState<Recording | undefined>();
  const [isSaving, setIsSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const loadRecordings = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextRecordings = await adminRecordingsApi.list();
      setRecordings(nextRecordings);
    } catch (err) {
      const apiError = err as ApiError;
      setError({
        code: apiError?.code,
        message: apiError?.message ?? "Failed to load recordings.",
        statusCode: apiError?.statusCode ?? 500,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadRecordings();
  }, [loadRecordings]);

  const raagOptions = Array.from(
    new Set(
      recordings
        .map((recording) => recording.raag.trim())
        .filter((raag) => raag.length > 0)
    )
  ).sort((left, right) => left.localeCompare(right));

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = recordings.filter((recording) => {
    const matchesSearch = normalizedSearch
      ? [recording.title, recording.raag, recording.taal ?? "", recording.notes ?? ""].some(
          (value) => value.toLowerCase().includes(normalizedSearch)
        )
      : true;
    const matchesRaag = raagFilter ? recording.raag === raagFilter : true;
    return matchesSearch && matchesRaag;
  });

  const handleView = (recording: Recording) => {
    setSelectedRecording(recording);
    setDetailOpen(true);
  };

  const handleOpenAdd = () => {
    setFormMode("add");
    setEditTarget(undefined);
    setSubmitError(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (recording: Recording) => {
    setDetailOpen(false);
    setFormMode("edit");
    setEditTarget(recording);
    setSubmitError(null);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    if (isSaving) {
      return;
    }

    setFormOpen(false);
    setEditTarget(undefined);
    setSubmitError(null);
  };

  const handleSave = async (values: RecordingFormValues) => {
    setIsSaving(true);
    setSubmitError(null);

    try {
      if (formMode === "add") {
        if (!values.file) {
          setSubmitError("Audio file is required.");
          return;
        }

        const createdRecording = await adminRecordingsApi.create({
          title: values.title.trim(),
          raag: values.raag.trim(),
          taal: values.taal.trim() || "",
          notes: values.notes.trim() || "",
          mimeType: values.file.type || "application/octet-stream",
          file: values.file,
        });

        setRecordings((current) => [createdRecording, ...current]);
        setSelectedRecording(createdRecording);
      } else if (editTarget) {
        const updatedRecording = await adminRecordingsApi.update(editTarget.id, {
          title: values.title.trim(),
          raag: values.raag.trim(),
          taal: values.taal.trim() ? values.taal.trim() : null,
          notes: values.notes.trim() ? values.notes.trim() : null,
        });

        setRecordings((current) =>
          current.map((recording) =>
            recording.id === updatedRecording.id ? updatedRecording : recording
          )
        );
        setSelectedRecording((current) =>
          current?.id === updatedRecording.id ? updatedRecording : current
        );
        setEditTarget(updatedRecording);
      }

      setFormOpen(false);
    } catch (err) {
      const apiError = err as ApiError;
      setSubmitError(
        toErrorMessage(
          apiError,
          formMode === "add"
            ? "Failed to upload recording."
            : "Failed to update recording."
        )
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box>
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
            Manage all uploaded recordings from your organization
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<UploadIcon />} onClick={handleOpenAdd}>
          Upload Recording
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          placeholder="Search recordings..."
          size="small"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
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
            onChange={(event) => setRaagFilter(event.target.value)}
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

      {isLoading ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <CircularProgress size={28} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading recordings...
          </Typography>
        </Box>
      ) : error ? (
        <Stack spacing={1.5} sx={{ py: 6, px: 3, textAlign: "center" }}>
          <Typography variant="body2" fontWeight={600}>
            Unable to load recordings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error.message}
          </Typography>
          <Box sx={{ pt: 0.5 }}>
            <Button variant="outlined" onClick={() => void loadRecordings()}>
              Retry
            </Button>
          </Box>
        </Stack>
      ) : recordings.length === 0 ? (
        <Alert severity="info">
          No recordings have been uploaded yet.
        </Alert>
      ) : filtered.length === 0 ? (
        <Alert severity="info">
          No recordings match your current search or raag filter.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filtered.map((recording) => (
            <Grid item xs={12} sm={6} lg={4} key={recording.id}>
              <RecordingCard
                recording={recording}
                onView={handleView}
                onEdit={handleOpenEdit}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <RecordingDetailDrawer
        open={detailOpen}
        recording={selectedRecording}
        onClose={() => setDetailOpen(false)}
        onEdit={handleOpenEdit}
      />

      <RecordingFormDialog
        open={formOpen}
        mode={formMode}
        recording={editTarget}
        isSaving={isSaving}
        submitError={submitError}
        onClose={handleCloseForm}
        onSave={(values) => {
          void handleSave(values);
        }}
      />
    </Box>
  );
}
