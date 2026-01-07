import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Slide from '@mui/material/Slide'
import type { SlideProps } from '@mui/material/Slide'

type Severity = 'success' | 'error' | 'warning' | 'info'

interface SnackbarContextValue {
  showSnackbar: (message: string, severity?: Severity) => void
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null)

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />
}

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState<Severity>('success')

  const showSnackbar = useCallback((msg: string, sev: Severity = 'success') => {
    setMessage(msg)
    setSeverity(sev)
    setOpen(true)
  }, [])

  const handleClose = (_?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return
    setOpen(false)
  }

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={SlideTransition}
      >
        <Alert
          onClose={handleClose}
          severity={severity}
          variant="filled"
          sx={{
            width: '100%',
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderLeft: 4,
            borderColor: `${severity}.main`,
            '& .MuiAlert-icon': {
              color: `${severity}.main`,
            },
          }}
        >
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  )
}

export function useSnackbar() {
  const context = useContext(SnackbarContext)
  if (!context) {
    throw new Error('useSnackbar must be used within SnackbarProvider')
  }
  return context
}
