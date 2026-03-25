import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#377dcdff",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#ffffffff",
      contrastText: "#377dcdff",
    },
    background: {
      default: "#ffffffff",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: [
      '"Avenir Next"',
      '"Inter"',
      '"SF Pro Display"',
      '"Segoe UI Variable Text"',
      '"Segoe UI"',
      '"Helvetica Neue"',
      "sans-serif",
    ].join(","),
    h1: {
      fontWeight: 800,
      letterSpacing: "-0.035em",
      lineHeight: 1.08,
    },
    h2: {
      fontWeight: 750,
      letterSpacing: "-0.03em",
      lineHeight: 1.12,
    },
    h3: {
      fontWeight: 700,
      letterSpacing: "-0.025em",
      lineHeight: 1.16,
    },
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
      lineHeight: 1.2,
    },
    h5: {
      fontWeight: 700,
      letterSpacing: "-0.015em",
      lineHeight: 1.24,
    },
    h6: {
      fontWeight: 650,
      letterSpacing: "-0.01em",
      lineHeight: 1.3,
    },
    subtitle1: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
      lineHeight: 1.45,
    },
    subtitle2: {
      fontWeight: 600,
      lineHeight: 1.45,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.65,
      letterSpacing: "-0.01em",
    },
    body2: {
      fontSize: "0.95rem",
      lineHeight: 1.6,
      letterSpacing: "-0.01em",
    },
    button: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    caption: {
      lineHeight: 1.5,
      letterSpacing: "0.01em",
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFeatureSettings: '"ss01" 1, "cv02" 1, "cv03" 1',
          textRendering: "optimizeLegibility",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: "1rem",
          lineHeight: 1.5,
        },
        input: {
          fontSize: "1rem",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        },
      },
    },
  },
});

export default theme;
