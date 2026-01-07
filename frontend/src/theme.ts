import { createTheme, keyframes } from '@mui/material/styles'

// Extend MUI Palette to include assetTypes
declare module '@mui/material/styles' {
  interface Palette {
    assetTypes: {
      character: string
      location: string
      object: string
      style: string
      shot_type: string
      lighting_setup: string
    }
  }
  interface PaletteOptions {
    assetTypes?: {
      character: string
      location: string
      object: string
      style: string
      shot_type: string
      lighting_setup: string
    }
  }
}

// Animation keyframes
const fadeSlideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#B388FF',
      light: '#E1BEE7',
      dark: '#7C4DFF',
    },
    secondary: {
      main: '#CE93D8',
      light: '#F3E5F5',
      dark: '#AB47BC',
    },
    background: {
      default: '#0D0D0F',
      paper: '#1A1A1F',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.7)',
      disabled: 'rgba(255, 255, 255, 0.38)',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    action: {
      active: '#FFFFFF',
      hover: 'rgba(255, 255, 255, 0.08)',
      selected: 'rgba(179, 136, 255, 0.16)',
      disabled: 'rgba(255, 255, 255, 0.3)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
    },
    error: {
      main: '#EF5350',
      light: '#E57373',
      dark: '#D32F2F',
    },
    warning: {
      main: '#FFB74D',
      light: '#FFCC80',
      dark: '#F57C00',
    },
    info: {
      main: '#64B5F6',
      light: '#90CAF9',
      dark: '#1976D2',
    },
    success: {
      main: '#81C784',
      light: '#A5D6A7',
      dark: '#388E3C',
    },
    assetTypes: {
      character: '#64B5F6',
      location: '#81C784',
      object: '#FFB74D',
      style: '#CE93D8',
      shot_type: '#EF5350',
      lighting_setup: '#FFF176',
    },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '@global': {
          '@keyframes fadeSlideIn': {
            from: { opacity: 0, transform: 'translateY(20px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        },
        // Custom scrollbar
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-track': {
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
        },
        '*::-webkit-scrollbar-thumb': {
          background: 'rgba(179, 136, 255, 0.3)',
          borderRadius: '4px',
          '&:hover': {
            background: 'rgba(179, 136, 255, 0.5)',
          },
        },
        '*::-webkit-scrollbar-corner': {
          background: 'transparent',
        },
        // Firefox scrollbar
        '*': {
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(179, 136, 255, 0.3) rgba(255, 255, 255, 0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
        },
        contained: {
          background: 'linear-gradient(135deg, #7C4DFF 0%, #B388FF 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #6E3FE8 0%, #A070FF 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1A1A1F',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.06)',
          transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            borderColor: 'rgba(255, 255, 255, 0.12)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
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
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1A1A1F',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: '#1A1A1F',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.15)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(179, 136, 255, 0.5)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#B388FF',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&.active': {
            backgroundColor: 'rgba(179, 136, 255, 0.16)',
            '& .MuiListItemIcon-root': {
              color: '#B388FF',
            },
            '& .MuiListItemText-primary': {
              color: '#B388FF',
            },
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #7C4DFF 0%, #B388FF 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #6E3FE8 0%, #A070FF 100%)',
            transform: 'scale(1.05)',
          },
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(179, 136, 255, 0.15)',
          color: '#B388FF',
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        },
      },
    },
  },
})

// Animation export for components
export const animations = {
  fadeSlideIn,
}

// Layout constants
export const SIDEBAR_WIDTH = 240
export const HEADER_HEIGHT = 64
