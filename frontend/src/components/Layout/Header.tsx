import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import MenuIcon from '@mui/icons-material/Menu'
import MenuOpenIcon from '@mui/icons-material/MenuOpen'
import FolderIcon from '@mui/icons-material/Folder'
import { useStore } from '../../store'
import { HEADER_HEIGHT } from '../../theme'

export function Header() {
  const { currentProject, sidebarOpen, toggleSidebar } = useStore()

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        height: HEADER_HEIGHT,
      }}
    >
      <Toolbar sx={{ minHeight: `${HEADER_HEIGHT}px !important`, height: HEADER_HEIGHT }}>
        <IconButton
          color="inherit"
          onClick={toggleSidebar}
          edge="start"
          sx={{ mr: 2 }}
        >
          {sidebarOpen ? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>

        <Typography
          variant="h6"
          component="h1"
          sx={{
            fontWeight: 700,
            color: 'primary.main',
          }}
        >
          Continuum - Consistent Prompt Engine
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        {currentProject && (
          <Chip
            icon={<FolderIcon sx={{ fontSize: 18 }} />}
            label={currentProject.name}
            sx={{
              bgcolor: 'action.selected',
              color: 'text.primary',
              fontWeight: 500,
              '& .MuiChip-icon': {
                color: 'primary.main',
              },
            }}
          />
        )}
      </Toolbar>
    </AppBar>
  )
}
