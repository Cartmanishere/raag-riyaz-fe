import {
  Avatar,
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  Typography,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import PeopleIcon from "@mui/icons-material/People";
import { teachers, students } from "@/data/seed";
import LogoutButton from "@/components/LogoutButton/LogoutButton";

const currentTeacher = teachers[0];
const teacherStudents = students.filter(
  (s) => s.teacherId === currentTeacher.id
);

const details = [
  {
    icon: <EmailIcon sx={{ color: "primary.main" }} />,
    label: "Email",
    value: currentTeacher.email,
  },
  {
    icon: <MusicNoteIcon sx={{ color: "primary.main" }} />,
    label: "Specialization",
    value: currentTeacher.specialization,
  },
  {
    icon: <WorkspacePremiumIcon sx={{ color: "primary.main" }} />,
    label: "Experience",
    value: currentTeacher.experience,
  },
  {
    icon: <PeopleIcon sx={{ color: "primary.main" }} />,
    label: "Students",
    value: `${teacherStudents.length} enrolled`,
  },
];

export default function ProfilePage() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>
        Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Avatar card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                py: 4,
                gap: 2,
              }}
            >
              <Avatar
                sx={{
                  width: 96,
                  height: 96,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  fontSize: 32,
                  fontWeight: 700,
                }}
              >
                {currentTeacher.initials}
              </Avatar>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h6" fontWeight={700}>
                  {currentTeacher.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentTeacher.specialization} Teacher
                </Typography>
              </Box>
              <Box sx={{ width: "100%", px: 1, pt: 1 }}>
                <LogoutButton />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Details card */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                About
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                {currentTeacher.bio}
              </Typography>

              <Divider sx={{ mb: 3 }} />

              <Typography variant="h6" fontWeight={600} gutterBottom>
                Details
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {details.map((d) => (
                  <Box
                    key={d.label}
                    sx={{ display: "flex", alignItems: "center", gap: 2 }}
                  >
                    {d.icon}
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        {d.label}
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {d.value}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
