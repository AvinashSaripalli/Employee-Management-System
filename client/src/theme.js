import { createTheme } from '@mui/material/styles';

const NAVY = {
  50: '#EEF2FF',
  100: '#DDE4FF',
  200: '#BCCBFF',
  300: '#8FA5E8',
  500: '#14286D',
  600: '#0F1F58',
  700: '#0B1844',
};

const ACCENT = {
  main: '#FE8600',
  light: '#FFF4E5',
};

const SHADOWS = {
  card: '0 1px 2px rgba(17, 32, 77, 0.04), 0 4px 16px rgba(17, 32, 77, 0.06)',
  pop: '0 8px 30px rgba(17, 32, 77, 0.12)',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      light: '#3D5AE8',
      main: NAVY[500],
      dark: NAVY[600],
      contrastText: '#ffffff',
    },
    secondary: {
      main: ACCENT.main,
      light: ACCENT.light,
      dark: '#E07800',
      contrastText: '#ffffff',
    },
    success: { main: '#16A34A', light: '#E8F7EE' },
    warning: { main: '#F59E0B', light: '#FEF3E2' },
    error: { main: '#E11D48', light: '#FDECEF' },
    info: { main: '#0284C7', light: '#E3F4FC' },
    text: {
      primary: '#1B2A5B',
      secondary: '#66708C',
      disabled: '#A6AFC6',
    },
    divider: '#E8ECF5',
    background: {
      default: '#F3F6FB',
      paper: '#FFFFFF',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Sofia Pro", "Segoe UI", Arial, sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
  },
  shadows: [
    'none',
    '0 1px 2px rgba(17,32,77,0.04), 0 4px 12px rgba(17,32,77,0.05)',
    SHADOWS.card,
    SHADOWS.pop,
    '0 12px 40px rgba(17,32,77,0.14)',
    '0 16px 48px rgba(17,32,77,0.16)',
    '0 1px 2px rgba(17,32,77,0.1)',
    '0 1px 2px rgba(17,32,77,0.1)',
    '0 1px 2px rgba(17,32,77,0.1)',
    '0 1px 2px rgba(17,32,77,0.1)',
    '0 1px 2px rgba(17,32,77,0.1)',
    '0 1px 2px rgba(17,32,77,0.1)',
    '0 1px 2px rgba(17,32,77,0.1)',
    '0 1px 2px rgba(17,32,77,0.1)',
    '0 1px 2px rgba(17,32,77,0.1)',
    '0 1px 2px rgba(17,32,77,0.1)',
    '0 1px 2px rgba(17,32,77,0.1)',
    '0 1px 2px rgba(17,32,77,0.1)',
    '0 1px 2px rgba(17,32,77,0.1)',
    '0 1px 2px rgba(17,32,77,0.1)',
    '0 1px 2px rgba(17,32,77,0.1)',
    '0 1px 2px rgba(17,32,77,0.1)',
    '0 1px 2px rgba(17,32,77,0.1)',
    '0 1px 2px rgba(17,32,77,0.1)',
    '0 1px 2px rgba(17,32,77,0.1)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F3F6FB',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '*::-webkit-scrollbar': {
          width: 8,
          height: 8,
        },
        '*::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '*::-webkit-scrollbar-thumb': {
          background: '#C7CEDF',
          borderRadius: 8,
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: '#A8B1C9',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
          padding: '8px 18px',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          '&:hover': { backgroundColor: NAVY[600] },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': { borderWidth: '1.5px' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: SHADOWS.card,
          border: '1px solid #EDF0F7',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 16,
        },
        elevation1: { boxShadow: SHADOWS.card },
        elevation2: { boxShadow: SHADOWS.card },
        elevation3: { boxShadow: SHADOWS.pop },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '20px',
          boxShadow: SHADOWS.pop,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.1rem',
          fontWeight: 700,
          paddingBottom: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600 },
        sizeSmall: { fontSize: '0.72rem' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #EDF0F7',
          color: 'inherit',
          verticalAlign: 'middle',
          padding: '12px 16px',
        },
        head: {
          fontWeight: 700,
          color: '#14286D',
          backgroundColor: '#F6F8FE',
          verticalAlign: 'middle',
          fontSize: '0.8125rem',
          letterSpacing: '0.02em',
          padding: '12px 16px',
        },
        sizeSmall: {
          padding: '8px 12px',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: '#F6F8FE' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 6px',
          minHeight: 36,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
          boxShadow: SHADOWS.pop,
          border: '1px solid #EDF0F7',
          padding: '4px 0',
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#101C3F',
          borderRadius: 8,
          fontSize: '0.75rem',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 3,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
  },
});

export default theme;