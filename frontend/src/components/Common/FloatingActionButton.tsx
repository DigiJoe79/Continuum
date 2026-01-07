import Fab from '@mui/material/Fab'
import Tooltip from '@mui/material/Tooltip'
import Zoom from '@mui/material/Zoom'
import AddIcon from '@mui/icons-material/Add'

interface FloatingActionButtonProps {
  onClick: () => void
  tooltip: string
  icon?: React.ReactNode
}

export function FloatingActionButton({
  onClick,
  tooltip,
  icon = <AddIcon />,
}: FloatingActionButtonProps) {
  return (
    <Zoom in>
      <Tooltip title={tooltip} placement="left">
        <Fab
          color="primary"
          onClick={onClick}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
        >
          {icon}
        </Fab>
      </Tooltip>
    </Zoom>
  )
}
