import { NavLink } from 'react-router-dom'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Toolbar from '@mui/material/Toolbar'
import FolderIcon from '@mui/icons-material/Folder'
import CategoryIcon from '@mui/icons-material/Category'
import MovieIcon from '@mui/icons-material/Movie'
import PublicIcon from '@mui/icons-material/Public'
import SettingsIcon from '@mui/icons-material/Settings'
import InfoIcon from '@mui/icons-material/Info'
import { useStore } from '../../store'
import { SIDEBAR_WIDTH, HEADER_HEIGHT } from '../../theme'

export function Sidebar() {
  const { sidebarOpen, currentProject } = useStore()

  if (!sidebarOpen) return null

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar sx={{ minHeight: `${HEADER_HEIGHT}px !important` }} />

      <List component="nav" sx={{ pt: 1 }}>
        <ListItemButton
          component={NavLink}
          to="/projects"
          sx={{ borderRadius: 1, mb: 0.5 }}
        >
          <ListItemIcon>
            <FolderIcon />
          </ListItemIcon>
          <ListItemText primary="Projects" />
        </ListItemButton>

        {currentProject && (
          <>
            <Box
              sx={{
                px: 2,
                py: 1,
                mt: 1,
                mb: 0.5,
                mx: 1,
                bgcolor: 'action.selected',
                borderRadius: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {currentProject.name}
              </Typography>
            </Box>
            <ListItemButton
              component={NavLink}
              to="/assets"
              sx={{ borderRadius: 1, mb: 0.5, pl: 3 }}
            >
              <ListItemIcon>
                <CategoryIcon />
              </ListItemIcon>
              <ListItemText primary="Assets" primaryTypographyProps={{ variant: 'body2' }} />
            </ListItemButton>
            <ListItemButton
              component={NavLink}
              to="/scenes"
              sx={{ borderRadius: 1, mb: 0.5, pl: 3 }}
            >
              <ListItemIcon>
                <MovieIcon />
              </ListItemIcon>
              <ListItemText primary="Scenes" primaryTypographyProps={{ variant: 'body2' }} />
            </ListItemButton>
          </>
        )}

        <Divider sx={{ my: 1.5 }} />

        <ListItemButton
          component={NavLink}
          to="/globals"
          sx={{ borderRadius: 1, mb: 0.5 }}
        >
          <ListItemIcon>
            <PublicIcon />
          </ListItemIcon>
          <ListItemText primary="Global Assets" />
        </ListItemButton>
        <ListItemButton
          component={NavLink}
          to="/settings"
          sx={{ borderRadius: 1, mb: 0.5 }}
        >
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItemButton>
        <ListItemButton
          component={NavLink}
          to="/info"
          sx={{ borderRadius: 1 }}
        >
          <ListItemIcon>
            <InfoIcon />
          </ListItemIcon>
          <ListItemText primary="Info" />
        </ListItemButton>
      </List>
    </Drawer>
  )
}
