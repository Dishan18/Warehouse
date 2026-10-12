import {
  AppBar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  Avatar,
} from '@mui/material'
import { useState } from 'react'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import NotificationBell from '../notifications/NotificationBell'
import { useAuth } from '../../context/AuthContext'
import { useColorMode } from '../../context/ColorModeContext'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const { email, logout } = useAuth()
  const { mode, toggleColorMode } = useColorMode()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <AppBar
      position="static"
      color="transparent"
      elevation={0}
      sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Toolbar>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={toggleColorMode} color="default">
          {mode === 'light' ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
        </IconButton>
        <NotificationBell />
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ ml: 1 }}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            {email.charAt(0).toUpperCase()}
          </Avatar>
        </IconButton>
        <Typography variant="subtitle1" fontWeight={500} sx={{ ml: 1 }}>
          {email}
        </Typography>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}
