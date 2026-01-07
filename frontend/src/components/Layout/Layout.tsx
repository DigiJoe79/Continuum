import { Outlet } from 'react-router-dom'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { HEADER_HEIGHT } from '../../theme'

export function Layout() {

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          minWidth: 0,
        }}
      >
        <Toolbar sx={{ minHeight: `${HEADER_HEIGHT}px !important` }} />
        <Outlet />
      </Box>
    </Box>
  )
}
