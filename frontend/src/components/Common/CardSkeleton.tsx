import Skeleton from '@mui/material/Skeleton'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Box from '@mui/material/Box'

interface CardSkeletonProps {
  variant?: 'project' | 'asset' | 'scene'
}

export function CardSkeleton({ variant = 'project' }: CardSkeletonProps) {
  return (
    <Card sx={{ '&:hover': { transform: 'none' } }}>
      <CardContent>
        {variant === 'asset' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="30%" height={16} />
            </Box>
          </Box>
        )}
        {variant !== 'asset' && (
          <>
            <Skeleton variant="text" width="70%" height={28} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="90%" height={20} />
            <Skeleton variant="text" width="40%" height={20} />
          </>
        )}
        {variant === 'project' && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Skeleton variant="rounded" width={80} height={24} />
            <Skeleton variant="rounded" width={80} height={24} />
          </Box>
        )}
      </CardContent>
      <CardActions sx={{ borderTop: 1, borderColor: 'divider', px: 2 }}>
        <Skeleton variant="text" width={80} height={20} />
        <Box sx={{ flexGrow: 1 }} />
        <Skeleton variant="rounded" width={60} height={30} />
        <Skeleton variant="rounded" width={60} height={30} />
      </CardActions>
    </Card>
  )
}
