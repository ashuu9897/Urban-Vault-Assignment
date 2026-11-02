import { createTheme } from '@mui/material/styles';

// Light-mode colours are dark enough that text in tonal chips (10% tint) and outlined
// buttons stays above WCAG AA (4.5:1) on white; dark mode uses lighter tints for the same reason.
const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'data-mui-color-scheme' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#4338ca', light: '#6366f1', dark: '#3730a3' },
        secondary: { main: '#7e22ce' },
        error: { main: '#b91c1c' },
        warning: { main: '#a84f08' },
        success: { main: '#157a3a' },
        info: { main: '#0369a1' },
        background: { default: '#f5f6fa', paper: '#ffffff' },
        text: { primary: '#111827', secondary: '#4b5563' },
        divider: '#e2e5ec',
      },
    },
    dark: {
      palette: {
        primary: { main: '#a5b4fc', light: '#c7d2fe', dark: '#818cf8' },
        secondary: { main: '#d8b4fe' },
        error: { main: '#fca5a5' },
        warning: { main: '#fcd34d' },
        success: { main: '#86efac' },
        info: { main: '#7dd3fc' },
        background: { default: '#0e1117', paper: '#161b22' },
        text: { primary: '#e6e8ee', secondary: '#a3aab8' },
        divider: '#2b313c',
      },
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h1: { fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h2: { fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.005em' },
    h3: { fontSize: '1rem', fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    overline: { fontWeight: 700, letterSpacing: '0.08em', lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // A clearly visible keyboard focus ring (MUI's ripple-only focus is easy to miss).
        'a:focus-visible, button:focus-visible, [role="tab"]:focus-visible, [tabindex]:focus-visible':
          {
            outline: '2px solid var(--mui-palette-primary-main)',
            outlineOffset: 2,
          },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
            scrollBehavior: 'auto !important',
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 500 } },
    },
    MuiTab: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600, minHeight: 44 } },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
    },
    MuiSkeleton: {
      defaultProps: { animation: 'wave' },
    },
  },
});

export default theme;
