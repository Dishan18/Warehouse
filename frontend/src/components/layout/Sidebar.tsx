import {
  Box,
  Chip,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { NavLink, useLocation } from 'react-router-dom'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined'
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import { useAuth } from '../../context/AuthContext'

const DRAWER_WIDTH = 250

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  adminOnly?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', path: '/dashboard', icon: <DashboardOutlinedIcon fontSize="small" /> }],
  },
  {
    title: 'Inventory & Stock',
    items: [
      { label: 'Inventory', path: '/inventory', icon: <WarehouseOutlinedIcon fontSize="small" /> },
      { label: 'Products', path: '/products', icon: <Inventory2OutlinedIcon fontSize="small" /> },
      { label: 'Movements', path: '/movements', icon: <SwapHorizOutlinedIcon fontSize="small" /> },
    ],
  },
  {
    title: 'Catalog & Insights',
    items: [
      { label: 'Categories', path: '/categories', icon: <CategoryOutlinedIcon fontSize="small" /> },
      { label: 'Suppliers', path: '/suppliers', icon: <LocalShippingOutlinedIcon fontSize="small" /> },
      { label: 'Reports', path: '/reports', icon: <AssessmentOutlinedIcon fontSize="small" /> },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Users', path: '/users', icon: <GroupOutlinedIcon fontSize="small" />, adminOnly: true },
      { label: 'Activity', path: '/activity', icon: <ReceiptLongOutlinedIcon fontSize="small" />, adminOnly: true },
      { label: 'Settings', path: '/settings', icon: <SettingsOutlinedIcon fontSize="small" /> },
    ],
  },
]

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const theme = useTheme()
  const isLight = theme.palette.mode === 'light'
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const location = useLocation()
  const { email, roles, isAdmin } = useAuth()

  const currentRole = roles[0] || (isAdmin ? 'ADMIN' : 'USER')

  const drawerContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: isLight ? '#fbfbfd' : '#111114',
      }}
    >
      {/* Brand Header */}
      <Box sx={{ px: 2.5, pt: 3, pb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '9px',
              bgcolor: 'primary.main',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
              letterSpacing: '-0.02em',
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
            }}
          >
            W
          </Box>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                color: isLight ? '#1d1d1f' : '#f5f5f7',
              }}
            >
              SmartWarehouse
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: '0.6875rem',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                fontWeight: 500,
              }}
            >
              Internal Operations
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Navigation Sections */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5, py: 1 }}>
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => !item.adminOnly || isAdmin)
          if (visibleItems.length === 0) return null

          return (
            <Box key={section.title} sx={{ mb: 2.5 }}>
              <Typography
                variant="caption"
                sx={{
                  px: 1.5,
                  mb: 0.75,
                  display: 'block',
                  color: isLight ? '#86868b' : '#71717a',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                {section.title}
              </Typography>
              <List disablePadding>
                {visibleItems.map((item) => {
                  const isActive = location.pathname === item.path

                  return (
                    <ListItemButton
                      key={item.path}
                      component={NavLink}
                      to={item.path}
                      onClick={isMobile ? onMobileClose : undefined}
                      sx={{
                        borderRadius: '10px',
                        py: 0.85,
                        px: 1.5,
                        mb: 0.35,
                        transition: 'all 0.15s ease',
                        bgcolor: isActive
                          ? isLight
                            ? 'rgba(5, 150, 105, 0.08)'
                            : 'rgba(52, 211, 153, 0.14)'
                          : 'transparent',
                        color: isActive
                          ? isLight
                            ? '#059669'
                            : '#34d399'
                          : isLight
                            ? '#4b5563'
                            : '#d1d5db',
                        '&:hover': {
                          bgcolor: isActive
                            ? isLight
                              ? 'rgba(5, 150, 105, 0.12)'
                              : 'rgba(52, 211, 153, 0.18)'
                            : isLight
                              ? 'rgba(0, 0, 0, 0.035)'
                              : 'rgba(255, 255, 255, 0.04)',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 32,
                          color: isActive
                            ? isLight
                              ? '#059669'
                              : '#34d399'
                            : isLight
                              ? '#6b7280'
                              : '#9ca3af',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: '0.84rem',
                          fontWeight: isActive ? 600 : 500,
                          letterSpacing: '-0.01em',
                        }}
                      />
                    </ListItemButton>
                  )
                })}
              </List>
            </Box>
          )
        })}
      </Box>

      {/* User Status Footer */}
      <Divider sx={{ borderColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.07)' }} />
      <Box sx={{ p: 2, bgcolor: isLight ? 'rgba(0, 0, 0, 0.015)' : 'rgba(255, 255, 255, 0.02)' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              bgcolor: isLight ? '#e5e7eb' : '#27272a',
              color: isLight ? '#374151' : '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            {email ? email.charAt(0).toUpperCase() : 'U'}
          </Box>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography
              variant="body2"
              noWrap
              sx={{ fontWeight: 600, fontSize: '0.8rem', letterSpacing: '-0.01em' }}
            >
              {email || 'Operator'}
            </Typography>
            <Chip
              label={currentRole}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.625rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
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
        </Stack>
      </Box>
    </Box>
  )

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    )
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: isLight ? 'rgba(0, 0, 0, 0.07)' : 'rgba(255, 255, 255, 0.08)',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  )
}
