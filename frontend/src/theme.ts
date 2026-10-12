import { createTheme } from '@mui/material/styles'

export default function createAppTheme(mode: 'light' | 'dark') {
  const isLight = mode === 'light'

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#059669', // Muted Apple Emerald
        light: '#10b981',
        dark: '#047857',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#64748b',
        light: '#94a3b8',
        dark: '#475569',
        contrastText: '#ffffff',
      },
      success: {
        main: '#059669',
        light: '#34d399',
        dark: '#065f46',
      },
      warning: {
        main: '#d97706',
        light: '#f59e0b',
        dark: '#b45309',
      },
      error: {
        main: '#e11d48', // Apple Rose Red
        light: '#f43f5e',
        dark: '#be123c',
      },
      info: {
        main: '#0284c7', // Apple System Blue
        light: '#38bdf8',
        dark: '#0369a1',
      },
      background: {
        default: isLight ? '#f5f5f7' : '#0c0c0e', // Apple neutral canvas
        paper: isLight ? '#ffffff' : '#18181b', // Pure surface
      },
      text: {
        primary: isLight ? '#1d1d1f' : '#f5f5f7',
        secondary: isLight ? '#6e6e73' : '#a1a1a6',
        disabled: isLight ? '#aeaeb2' : '#636366',
      },
      divider: isLight ? 'rgba(0, 0, 0, 0.07)' : 'rgba(255, 255, 255, 0.08)',
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"SF Pro Text"',
        '"SF Pro Display"',
        '"SF Pro"',
        '"Segoe UI"',
        'Roboto',
        'Helvetica',
        'Arial',
        'sans-serif',
      ].join(','),
      h4: {
        fontSize: '1.65rem',
        fontWeight: 700,
        letterSpacing: '-0.025em',
        color: isLight ? '#1d1d1f' : '#f5f5f7',
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: isLight ? '#1d1d1f' : '#f5f5f7',
      },
      h6: {
        fontSize: '1.05rem',
        fontWeight: 600,
        letterSpacing: '-0.015em',
        color: isLight ? '#1d1d1f' : '#f5f5f7',
      },
      subtitle1: {
        fontSize: '0.9375rem',
        fontWeight: 500,
        letterSpacing: '-0.01em',
      },
      subtitle2: {
        fontSize: '0.8125rem',
        fontWeight: 600,
        letterSpacing: '0.01em',
      },
      body1: {
        fontSize: '0.875rem',
        letterSpacing: '-0.005em',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.8125rem',
        letterSpacing: '0',
        lineHeight: 1.45,
      },
      caption: {
        fontSize: '0.75rem',
        letterSpacing: '0.01em',
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isLight ? '#f5f5f7' : '#0c0c0e',
            color: isLight ? '#1d1d1f' : '#f5f5f7',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '8px 16px',
            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-0.5px)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          },
          containedPrimary: {
            backgroundColor: '#059669',
            '&:hover': {
              backgroundColor: '#047857',
            },
          },
          outlined: {
            borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.15)',
            color: isLight ? '#1d1d1f' : '#f5f5f7',
            '&:hover': {
              borderColor: isLight ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.3)',
              backgroundColor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: 'none',
            border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.07)'}`,
            boxShadow: isLight
              ? '0 1px 3px rgba(0, 0, 0, 0.03), 0 4px 16px rgba(0, 0, 0, 0.02)'
              : '0 2px 8px rgba(0, 0, 0, 0.4)',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 20,
            border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)'}`,
            boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.18)',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.15)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isLight ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.3)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#059669',
              borderWidth: '1.5px',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 9999,
            fontWeight: 600,
            fontSize: '0.725rem',
            height: 24,
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: isLight ? '#fbfbfd' : '#141416',
            '& .MuiTableCell-head': {
              color: isLight ? '#6e6e73' : '#a1a1a6',
              fontSize: '0.725rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              borderBottom: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.07)'}`,
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: '12px 16px',
            borderBottom: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.06)'}`,
            fontSize: '0.84rem',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.12s ease',
            '&.MuiTableRow-hover:hover': {
              backgroundColor: isLight ? 'rgba(0, 0, 0, 0.015)' : 'rgba(255, 255, 255, 0.02)',
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isLight ? '#1d1d1f' : '#27272a',
            color: '#ffffff',
            borderRadius: 8,
            fontSize: '0.75rem',
            padding: '6px 10px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
  })
}
