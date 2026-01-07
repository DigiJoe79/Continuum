import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import type { SvgIconComponent } from '@mui/icons-material'

interface EmptyStateProps {
  icon: SvgIconComponent
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 8,
        px: 3,
        animation: 'fadeSlideIn 400ms ease forwards',
      }}
    >
      <Icon
        sx={{
          fontSize: 64,
          color: 'text.secondary',
          mb: 2,
          opacity: 0.5,
        }}
      />
      <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
        {title}
      </Typography>
      <Typography
        color="text.secondary"
        sx={{ mb: actionLabel ? 3 : 0, maxWidth: 400, mx: 'auto' }}
      >
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  )
}
