export interface Teacher {
  id: number;
  name: string;
  username: string;
  password: string;
  email: string;
  specialization: string;
  experience: string;
  initials: string;
  bio: string;
}

export interface Student {
  id: number;
  name: string;
  username: string;
  password: string;
  email: string;
  instrument: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  status: "Active" | "Inactive";
  teacherId: number;
  joinDate: string;
  progress: number; // 0–100
}

export interface Recording {
  id: number;
  title: string;
  assignedStudentIds: number[];
  teacherId: number;
  raag: string;
  taal?: string;
  duration: string;
  date: string;
  notes: string;
}

export const teachers: Teacher[] = [
  {
    id: 1,
    name: "Pt. Ravi Shankar",
    username: "ravi",
    password: "teacher123",
    email: "ravi@raagriyaz.com",
    specialization: "Sitar",
    experience: "30 years",
    initials: "RS",
    bio: "Renowned sitar maestro with decades of classical training and teaching experience.",
  },
  {
    id: 2,
    name: "Ustad Zakir Hussain",
    username: "zakir",
    password: "teacher123",
    email: "zakir@raagriyaz.com",
    specialization: "Tabla",
    experience: "40 years",
    initials: "ZH",
    bio: "World-class tabla player and dedicated educator of Hindustani rhythm.",
  },
];

export const students: Student[] = [
  {
    id: 1,
    name: "Ananya Sharma",
    username: "ananya",
    password: "student123",
    email: "ananya@example.com",
    instrument: "Sitar",
    level: "Intermediate",
    status: "Active",
    teacherId: 1,
    joinDate: "2024-01-15",
    progress: 62,
  },
  {
    id: 2,
    name: "Rahul Mehta",
    username: "rahul",
    password: "student123",
    email: "rahul@example.com",
    instrument: "Tabla",
    level: "Beginner",
    status: "Inactive",
    teacherId: 1,
    joinDate: "2024-03-20",
    progress: 28,
  },
  {
    id: 3,
    name: "Priya Patel",
    username: "priya",
    password: "student123",
    email: "priya@example.com",
    instrument: "Vocals",
    level: "Advanced",
    status: "Active",
    teacherId: 1,
    joinDate: "2023-09-10",
    progress: 88,
  },
  {
    id: 4,
    name: "Arjun Kapoor",
    username: "arjun",
    password: "student123",
    email: "arjun@example.com",
    instrument: "Bansuri",
    level: "Beginner",
    status: "Active",
    teacherId: 1,
    joinDate: "2024-06-01",
    progress: 15,
  },
  {
    id: 5,
    name: "Meera Iyer",
    username: "meera",
    password: "student123",
    email: "meera@example.com",
    instrument: "Sitar",
    level: "Intermediate",
    status: "Inactive",
    teacherId: 1,
    joinDate: "2023-11-22",
    progress: 54,
  },
];

export const recordings: Recording[] = [
  {
    id: 1,
    title: "Raag Yaman — Morning Riyaz",
    assignedStudentIds: [1, 3],
    teacherId: 1,
    raag: "Yaman",
    taal: "Teentaal",
    duration: "12:34",
    date: "2024-10-05",
    notes: "Good alap, needs work on taan speed.",
  },
  {
    id: 2,
    title: "Raag Bhairav — Slow Teentaal",
    assignedStudentIds: [3],
    teacherId: 1,
    raag: "Bhairav",
    taal: "Ektaal",
    duration: "18:02",
    date: "2024-10-12",
    notes: "Excellent control of komal Re. Composition memorised.",
  },
  {
    id: 3,
    title: "Raag Bhupali — Practice Session",
    assignedStudentIds: [5],
    teacherId: 1,
    raag: "Bhupali",
    duration: "09:45",
    date: "2024-11-01",
    notes: "Consistent improvement. Focus on meend transitions.",
  },
  {
    id: 4,
    title: "Raag Desh — Evening Session",
    assignedStudentIds: [1],
    teacherId: 1,
    raag: "Desh",
    taal: "Teentaal",
    duration: "14:20",
    date: "2024-11-18",
    notes: "Beautiful bandish rendering. Ready for performance.",
  },
  {
    id: 5,
    title: "Raag Malkauns — Slow Ektaal",
    assignedStudentIds: [3],
    teacherId: 1,
    raag: "Malkauns",
    taal: "Ektaal",
    duration: "22:10",
    date: "2024-12-03",
    notes: "Depth and seriousness in approach. Excellent.",
  },
];
