import { useCallback, useEffect, useState } from 'react'
import {
  Badge,
  Box,
  Chip,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  Stack,
  Typography,
} from '@mui/material'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import { useNavigate } from 'react-router-dom'
import { notificationApi } from '../../api/notificationApi'
import { useNotificationSocket } from '../../hooks/useNotificationSocket'
import type { AppNotification, StockAlert } from '../../types'
import ComposeNotificationDialog from './ComposeNotificationDialog'

const PAGE_SIZE = 20

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function NotificationBell() {
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [composeOpen, setComposeOpen] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [page, count, alertList] = await Promise.all([
        notificationApi.getMyNotifications({ page: 0, size: PAGE_SIZE }),
        notificationApi.getUnreadCount(),
        notificationApi.getStockAlerts(),
      ])
      setNotifications(page.content)
      setUnreadCount(count)
      setAlerts(alertList)
    } catch {
      // ignore refresh errors
    }
  }, [])

  useNotificationSocket((notification) => {
    setNotifications((prev) => [notification, ...prev.filter((n) => n.id !== notification.id)])
    if (!notification.read) {
      setUnreadCount((prev) => prev + 1)
    }
  })

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30_000)
    return () => clearInterval(interval)
  }, [refresh])

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget)
    refresh()
  }

  const handleClose = () => setAnchorEl(null)

  const handleMarkRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
    notificationApi.markAsRead(id).catch(() => {
      // ignore sync errors; polling will reconcile
    })
  }

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    try {
      await notificationApi.markAllRead()
    } catch {
      // ignore sync errors; polling will reconcile
    }
  }

  const openProduct = () => {
    handleClose()
    navigate('/products')
  }

  const handleSend = async (data: { recipientId: string; title: string; message: string }) => {
    setSendError(null)
    try {
      await notificationApi.send(data)
      setComposeOpen(false)
      refresh()
    } catch {
      setSendError('Failed to send the notification. Please try again.')
    }
  }

  const badgeCount = unreadCount

  return (
    <>
      <IconButton color="default" onClick={handleOpen} aria-label="Notifications">
        <Badge badgeContent={badgeCount} color="error">
          <NotificationsNoneOutlinedIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        slotProps={{ paper: { sx: { width: 380, maxHeight: 480, mt: 1 } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" fontWeight={600}>
              Notifications
            </Typography>
            <IconButton
              size="small"
              color="primary"
              onClick={() => {
                handleClose()
                setComposeOpen(true)
              }}
              aria-label="New notification"
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {unreadCount > 0 ? `${unreadCount} unread` : 'Messages'}
            </Typography>
            {unreadCount > 0 && (
              <Box
                component="button"
                onClick={handleMarkAllRead}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  p: 0,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: 'primary.main',
                  fontSize: '0.8125rem',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                <CheckRoundedIcon fontSize="inherit" />
                Mark all as read
              </Box>
            )}
          </Stack>
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No messages yet
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {notifications.map((notification) => (
              <ListItemButton
                key={notification.id}
                onClick={() => {
                  if (!notification.read) handleMarkRead(notification.id)
                }}
                sx={{ alignItems: 'flex-start', px: 2, py: 1, bgcolor: notification.read ? 'transparent' : 'action.hover' }}
              >
                <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                  {notification.type === 'STOCK_ALERT' ? (
                    <WarningAmberOutlinedIcon color="warning" fontSize="small" />
                  ) : (
                    <PersonOutlinedIcon color="primary" fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Stack direction="row" justifyContent="space-between" gap={1}>
                      <Typography variant="body2" fontWeight={notification.read ? 400 : 600} noWrap>
                        {notification.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                        {relativeTime(notification.createdAt)}
                      </Typography>
                    </Stack>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {notification.senderName ? `From ${notification.senderName}` : 'System'} —{' '}
                      {notification.message}
                    </Typography>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}
        <Divider />
        <Box sx={{ px: 2, py: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2">Low stock alerts</Typography>
            {alerts.length > 0 && <Chip label={alerts.length} size="small" color="warning" />}
          </Stack>
        </Box>
        {alerts.length === 0 ? (
          <Box sx={{ px: 2, py: 1.5, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No low stock alerts right now
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {alerts.map((alert) => (
              <ListItemButton
                key={alert.productId}
                onClick={openProduct}
                sx={{ alignItems: 'flex-start', px: 2, py: 1 }}
              >
                <ListItemText
                  primary={
                    <Stack direction="row" justifyContent="space-between" gap={1}>
                      <Typography variant="body2" fontWeight={500} noWrap>
                        {alert.productName}
                      </Typography>
                      <Chip
                        label={alert.type === 'OUT_OF_STOCK' ? 'Out of stock' : 'Low stock'}
                        color={alert.type === 'OUT_OF_STOCK' ? 'error' : 'warning'}
                        size="small"
                      />
                    </Stack>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {alert.sku} — {alert.quantity} left
                      {alert.quantity <= alert.minStock ? ` (min ${alert.minStock})` : ''}
                    </Typography>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Menu>
      <ComposeNotificationDialog
        open={composeOpen}
        error={sendError}
        onClose={() => {
          setComposeOpen(false)
          setSendError(null)
        }}
        onSubmit={handleSend}
      />
    </>
  )
}
