import { createTheme } from '@mui/material/styles'

export default function createAppTheme(mode: 'light' | 'dark') {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#4f46e5',
        light: '#818cf8',
        dark: '#4338ca',
      },
      warning: {
        main: '#ed6c02',
        light: '#ffb74d',
        dark: '#9a3412',
      },
      background: {
        default: mode === 'light' ? '#f5f6fa' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
      divider: mode === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)',
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
          },
        },
      },
    },
  })
}
