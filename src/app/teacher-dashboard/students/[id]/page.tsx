import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Typography,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { students, recordings } from "@/data/seed";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function StudentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const student = students.find((s) => s.id === Number(params.id));
  if (!student) notFound();

  const studentRecordings = recordings.filter((r) =>
    r.assignedStudentIds.includes(student.id)
  );

  return (
    <Box>
      {/* Back link */}
      <Box sx={{ mb: 3 }}>
        <Link
          href="/teacher-dashboard/students"
          style={{ textDecoration: "none" }}
        >
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              color: "text.secondary",
              "&:hover": { color: "primary.main" },
            }}
          >
            <ArrowBackIcon fontSize="small" />
            <Typography variant="body2">Back to Students</Typography>
          </Box>
        </Link>
      </Box>

      {/* Student info card */}
      <Card sx={{ mb: 3 }}>
        <CardContent
          sx={{ display: "flex", alignItems: "center", gap: 3, p: 3 }}
        >
          <Avatar
            sx={{
              bgcolor: "primary.main",
              color: "primary.contrastText",
              width: 64,
              height: 64,
              fontSize: 22,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {getInitials(student.name)}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
              <Typography variant="h5" fontWeight={700}>
                {student.name}
              </Typography>
              {/* Status dot + text */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor:
                      student.status === "Active" ? "success.main" : "text.disabled",
                  }}
                />
                <Typography
                  variant="caption"
                  color={
                    student.status === "Active" ? "success.main" : "text.disabled"
                  }
                  fontWeight={500}
                >
                  {student.status}
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {student.email}
            </Typography>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip label={student.level} size="small" />
              <Chip label={student.instrument} size="small" variant="outlined" />
              <Chip
                label={`Joined ${student.joinDate}`}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Recordings */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Recordings
        </Typography>
        {/* Placeholder — assign wired up later */}
        <Button
          variant="outlined"
          size="small"
          startIcon={<AudiotrackIcon />}
          disabled
        >
          + Assign
        </Button>
      </Box>

      <Card>
        {studentRecordings.length === 0 ? (
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              No recordings assigned yet.
            </Typography>
          </CardContent>
        ) : (
          studentRecordings.map((rec, i) => (
            <Box key={rec.id}>
              <Box sx={{ px: 3, py: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <AudiotrackIcon
                    sx={{ fontSize: 16, color: "primary.main" }}
                  />
                  <Typography variant="body2" fontWeight={600}>
                    {rec.title}
                  </Typography>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1, fontStyle: "italic", pl: 3 }}
                >
                  "{rec.notes}"
                </Typography>

                <Box sx={{ display: "flex", gap: 2, pl: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <AccessTimeIcon
                      sx={{ fontSize: 13, color: "text.disabled" }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {rec.duration}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <CalendarTodayIcon
                      sx={{ fontSize: 13, color: "text.disabled" }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {rec.date}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              {i < studentRecordings.length - 1 && <Divider />}
            </Box>
          ))
        )}
      </Card>
    </Box>
  );
}
