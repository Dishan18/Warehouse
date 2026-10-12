import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
      >
        <Navbar />
        <Box component="section" sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
