"use client";

import * as React from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { adminRecordingsApi } from "@/services/api";
import { ApiError, NoteImage } from "@/types";

interface NoteImagesSectionProps {
  recordingId: string;
  open: boolean;
}

export default function NoteImagesSection({ recordingId, open }: NoteImagesSectionProps) {
  const [images, setImages] = React.useState<NoteImage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadImages = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await adminRecordingsApi.listNoteImages(recordingId);
      setImages(result);
    } catch (err) {
      setLoadError((err as ApiError)?.message ?? "Failed to load note images.");
    } finally {
      setIsLoading(false);
    }
  }, [recordingId]);

  React.useEffect(() => {
    if (!open || !recordingId) return;
    void loadImages();
  }, [open, recordingId, loadImages]);

  const handleUploadClick = () => {
    setUploadError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-uploaded
    e.target.value = "";

    setIsUploading(true);
    setUploadError(null);
    try {
      const uploaded = await adminRecordingsApi.uploadNoteImage(recordingId, {
        file,
        mimeType: file.type || undefined,
      });
      setImages((prev) => [...prev, uploaded]);
    } catch (err) {
      const apiError = err as ApiError;
      setUploadError(
        apiError?.statusCode === 409
          ? "Maximum number of note images reached."
          : (apiError?.message ?? "Failed to upload image.")
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    setDeletingId(imageId);
    setDeleteError(null);
    try {
      await adminRecordingsApi.deleteNoteImage(recordingId, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      setDeleteError((err as ApiError)?.message ?? "Failed to delete image.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="subtitle2" fontWeight={700}>
          Note Images
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={isUploading ? <CircularProgress size={14} /> : <AddPhotoAlternateIcon />}
          onClick={handleUploadClick}
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => void handleFileChange(e)}
        />
      </Box>

      {uploadError && <Alert severity="error" onClose={() => setUploadError(null)}>{uploadError}</Alert>}
      {deleteError && <Alert severity="error" onClose={() => setDeleteError(null)}>{deleteError}</Alert>}

      {isLoading ? (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">Loading images...</Typography>
        </Stack>
      ) : loadError ? (
        <Stack spacing={1}>
          <Alert severity="error">{loadError}</Alert>
          <Box>
            <Button size="small" variant="outlined" onClick={() => void loadImages()}>
              Retry
            </Button>
          </Box>
        </Stack>
      ) : images.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No note images uploaded yet.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
            gap: 1,
          }}
        >
          {images.map((img) => (
            <Box
              key={img.id}
              sx={{
                position: "relative",
                borderRadius: 1,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
                aspectRatio: "1",
                bgcolor: "grey.100",
                "&:hover .delete-btn": { opacity: 1 },
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt="Note image"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <Tooltip title="Delete image">
                <IconButton
                  className="delete-btn"
                  size="small"
                  onClick={() => void handleDelete(img.id)}
                  disabled={deletingId === img.id}
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    opacity: 0,
                    transition: "opacity 0.15s",
                    bgcolor: "rgba(0,0,0,0.55)",
                    color: "#fff",
                    "&:hover": { bgcolor: "error.main" },
                    "&.Mui-disabled": { opacity: 0.5 },
                  }}
                >
                  {deletingId === img.id
                    ? <CircularProgress size={14} sx={{ color: "#fff" }} />
                    : <DeleteOutlineIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
