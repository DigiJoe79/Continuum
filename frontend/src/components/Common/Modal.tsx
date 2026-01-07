import { type ReactNode } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import Fade from '@mui/material/Fade'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg'
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'sm',
}: ModalProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      TransitionComponent={Fade}
      transitionDuration={200}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          },
        },
      }}
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, pr: 6 }}>
        {title}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'text.secondary',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: 'divider' }}>
        {children}
      </DialogContent>
      {footer && (
        <DialogActions sx={{ p: 2, gap: 1 }}>
          {footer}
        </DialogActions>
      )}
    </Dialog>
  )
}
