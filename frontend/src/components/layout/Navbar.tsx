import { useState } from 'react'
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import MenuIcon from '@mui/icons-material/Menu'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import NotificationBell from '../notifications/NotificationBell'
import { useAuth } from '../../context/AuthContext'
import { useColorMode } from '../../context/ColorModeContext'

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview & Velocity' },
  '/inventory': { title: 'Inventory', subtitle: 'Stock Balances & Tracking' },
  '/products': { title: 'Products', subtitle: 'Catalog Management' },
  '/movements': { title: 'Movements', subtitle: 'Inbound & Outbound History' },
  '/categories': { title: 'Categories', subtitle: 'Taxonomy & Classification' },
  '/suppliers': { title: 'Suppliers', subtitle: 'Vendor Partners' },
  '/reports': { title: 'Reports', subtitle: 'Analytics & Export' },
  '/users': { title: 'Team Directory', subtitle: 'User Accounts & Roles' },
  '/activity': { title: 'Audit Ledger', subtitle: 'Immutable System Events' },
  '/settings': { title: 'Settings', subtitle: 'Warehouse Configuration' },
}

interface NavbarProps {
  onMenuClick?: () => void
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const theme = useTheme()
  const isLight = theme.palette.mode === 'light'
  const location = useLocation()
  const navigate = useNavigate()
  const { email, roles, isAdmin, logout } = useAuth()
  const { mode, toggleColorMode } = useColorMode()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const currentRole = roles[0] || (isAdmin ? 'ADMIN' : 'USER')
  const pageMeta = PAGE_TITLES[location.pathname] || { title: 'Warehouse', subtitle: '' }

  const handleLogout = () => {
    setAnchorEl(null)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        bgcolor: isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(18, 18, 20, 0.8)',
        borderBottom: '1px solid',
        borderColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)',
        zIndex: theme.zIndex.drawer - 1,
      }}
    >
      <Toolbar sx={{ minHeight: '64px', px: { xs: 2, sm: 3 } }}>
        {/* Mobile Menu Button */}
        {onMenuClick && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open navigation menu"
            onClick={onMenuClick}
            sx={{ mr: 1.5, color: 'text.secondary' }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>
        )}

        {/* Page Title & Breadcrumb */}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1rem', sm: '1.15rem' },
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              color: isLight ? '#1d1d1f' : '#f5f5f7',
            }}
          >
            {pageMeta.title}
          </Typography>
          {pageMeta.subtitle && (
            <Typography
              variant="caption"
              sx={{
                display: { xs: 'none', sm: 'block' },
                color: 'text.secondary',
                fontSize: '0.725rem',
                letterSpacing: '-0.01em',
              }}
            >
              {pageMeta.subtitle}
            </Typography>
          )}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Action Controls */}
        <Stack direction="row" alignItems="center" spacing={1}>
          {/* Theme Toggle */}
          <IconButton
            onClick={toggleColorMode}
            size="small"
            aria-label="toggle color theme"
            sx={{
              color: 'text.secondary',
              bgcolor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)',
              borderRadius: '9px',
              p: 0.85,
              '&:hover': {
                bgcolor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            {mode === 'light' ? (
              <DarkModeOutlinedIcon fontSize="small" />
            ) : (
              <LightModeOutlinedIcon fontSize="small" />
            )}
          </IconButton>

          {/* Real-time Notification Bell */}
          <NotificationBell />

          <Divider
            orientation="vertical"
            flexItem
            sx={{
              mx: 0.5,
              my: 1.5,
              borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)',
            }}
          />

          {/* Profile Button */}
          <Box
            component="button"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            aria-label="user profile menu"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              p: '4px 8px 4px 4px',
              border: 'none',
              background: 'transparent',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
              '&:hover': {
                bgcolor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: '0.85rem',
                fontWeight: 600,
                bgcolor: 'primary.main',
                color: '#ffffff',
              }}
            >
              {email ? email.charAt(0).toUpperCase() : 'A'}
            </Avatar>
            <Typography
              variant="body2"
              sx={{
                display: { xs: 'none', md: 'block' },
                fontWeight: 600,
                fontSize: '0.8125rem',
                color: isLight ? '#1d1d1f' : '#f5f5f7',
                letterSpacing: '-0.01em',
              }}
            >
              {email ? email.split('@')[0] : 'User'}
            </Typography>
          </Box>

          {/* User Popover Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            slotProps={{
              paper: {
                sx: {
                  width: 220,
                  p: 1,
                  mt: 1,
                  borderRadius: '16px',
                  boxShadow: isLight
                    ? '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)'
                    : '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                  border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)'}`,
                },
              },
            }}
          >
            <Box sx={{ px: 1.5, py: 1 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {email}
              </Typography>
              <Chip
                label={currentRole}
                size="small"
                sx={{
                  mt: 0.5,
                  height: 18,
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  bgcolor:
                    currentRole === 'ADMIN'
                      ? isLight
                        ? '#fee2e2'
                        : 'rgba(225, 29, 72, 0.2)'
                      : isLight
                        ? '#ecfdf5'
                        : 'rgba(5, 150, 105, 0.2)',
                  color:
                    currentRole === 'ADMIN'
                      ? isLight
                        ? '#991b1b'
                        : '#fda4af'
                      : isLight
                        ? '#065f46'
                        : '#6ee7b7',
                }}
              />
            </Box>
            <Divider sx={{ my: 0.75 }} />
            <MenuItem
              onClick={handleLogout}
              sx={{
                borderRadius: '8px',
                color: 'error.main',
                fontSize: '0.84rem',
                fontWeight: 500,
                gap: 1.5,
              }}
            >
              <LogoutOutlinedIcon fontSize="small" />
              Sign Out
            </MenuItem>
          </Menu>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
