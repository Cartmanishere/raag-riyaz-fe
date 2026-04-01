import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#c05060",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#a06840",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f5f0e8",
      paper: "#eee6d8",
    },
    text: {
      primary: "#2a1e18",
      secondary: "#807060",
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
          backgroundColor: "#eee6d8",
          boxShadow: "0 2px 8px rgba(42,30,24,0.08)",
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: "#ddd0c0",
        },
        bar: {
          backgroundColor: "#c05060",
        },
      },
    },
  },
});

export default theme;
