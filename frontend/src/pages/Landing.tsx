import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import GlobalStyles from '@mui/material/GlobalStyles'
import {
  alpha,
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  Chip,
  Container,
  Divider,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
  useTheme,
  type Theme,
} from '@mui/material'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'
import SwapVertOutlinedIcon from '@mui/icons-material/SwapVertOutlined'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined'
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined'
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined'
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined'
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { useColorMode } from '../context/ColorModeContext'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Why us', href: '#why-us' },
]

const accent = (theme: Theme) =>
  theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main

const HERO_CHART = [
  { month: 'Jan', inbound: 320, outbound: 210 },
  { month: 'Feb', inbound: 410, outbound: 260 },
  { month: 'Mar', inbound: 280, outbound: 300 },
  { month: 'Apr', inbound: 520, outbound: 340 },
  { month: 'May', inbound: 460, outbound: 390 },
  { month: 'Jun', inbound: 610, outbound: 430 },
]

const LOW_STOCK_ITEMS = [
  { name: 'Wireless Mouse', sku: 'ACC-M-001', qty: 4 },
  { name: 'USB-C Cable 2m', sku: 'ACC-C-014', qty: 9 },
  { name: 'Mechanical Keyboard', sku: 'HWD-K-022', qty: 6 },
]

const FEATURES = [
  {
    icon: <Inventory2OutlinedIcon />,
    title: 'Real-time inventory',
    description:
      'Live quantities across every SKU, category and location. No more stale spreadsheets or guesswork.',
  },
  {
    icon: <NotificationsActiveOutlinedIcon />,
    title: 'Smart stock alerts',
    description:
      'Set minimum thresholds per product and get notified before you run dry — not after.',
  },
  {
    icon: <SwapVertOutlinedIcon />,
    title: 'Movement tracking',
    description:
      'Every inbound, outbound and adjustment is logged with a full audit trail you can trust.',
  },
  {
    icon: <InsightsOutlinedIcon />,
    title: 'Actionable analytics',
    description:
      'Spot trends with clean charts on stock levels, turnover and demand — updated in real time.',
  },
  {
    icon: <LocalShippingOutlinedIcon />,
    title: 'Supplier management',
    description:
      'Keep suppliers, products and reorder information in one place, ready when you need it.',
  },
  {
    icon: <AdminPanelSettingsOutlinedIcon />,
    title: 'Role-based access',
    description:
      'Give admins, managers and staff exactly the access they need — nothing more.',
  },
]

const STEPS = [
  {
    step: '01',
    icon: <WarehouseOutlinedIcon />,
    title: 'Create your catalog',
    description:
      'Add categories, products and suppliers in minutes with structured, validated forms.',
  },
  {
    step: '02',
    icon: <SwapVertOutlinedIcon />,
    title: 'Record movements',
    description:
      'Log stock in, stock out and adjustments with a couple of clicks. History is kept forever.',
  },
  {
    step: '03',
    icon: <TrackChangesOutlinedIcon />,
    title: 'Monitor & optimize',
    description:
      'Watch your dashboard, act on low-stock alerts and let data drive your next order.',
  },
]

const METRICS = [
  { value: '99.9%', label: 'Platform uptime' },
  { value: '40%', label: 'Fewer stockouts' },
  { value: '3×', label: 'Faster fulfilment' },
  { value: '500+', label: 'Teams onboard' },
]

function Logo() {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.6)})`,
          color: '#fff',
          boxShadow: (theme) => `0 6px 16px ${alpha(theme.palette.primary.main, 0.35)}`,
        }}
      >
        <WarehouseOutlinedIcon fontSize="small" />
      </Box>
      <Box>
        <Typography component="span" variant="subtitle1" fontWeight={700} lineHeight={1.1}>
          SmartWarehouse
        </Typography>
        <Typography variant="caption" color="text.secondary" lineHeight={1}>
          Inventory, perfected
        </Typography>
      </Box>
    </Stack>
  )
}

function LandingNavbar() {
  const { mode, toggleColorMode } = useColorMode()
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        bgcolor: scrolled
          ? (t) => alpha(t.palette.background.default, 0.8)
          : 'transparent',
        borderBottom: '1px solid',
        borderColor: scrolled ? 'divider' : 'transparent',
        transition: 'background-color 0.25s, border-color 0.25s, backdrop-filter 0.25s',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ minHeight: 72 }}
        >
          <Logo />

          <Stack
            direction="row"
            spacing={4}
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            {NAV_LINKS.map((link) => (
              <Typography
                key={link.href}
                component="a"
                href={link.href}
                color="text.primary"
                sx={{
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  '&:hover': { color: 'primary.main' },
                }}
              >
                {link.label}
              </Typography>
            ))}
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton
              onClick={toggleColorMode}
              aria-label={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              color="inherit"
            >
              {mode === 'light' ? (
                <DarkModeOutlinedIcon fontSize="small" />
              ) : (
                <LightModeOutlinedIcon fontSize="small" />
              )}
            </IconButton>
            <Button
              component={RouterLink}
              to="/login"
              variant="text"
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              Sign in
            </Button>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              sx={{ display: { xs: 'none', sm: 'inline-flex' }, pl: 2.5, pr: 2.5 }}
            >
              Get started
            </Button>
            <IconButton
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              sx={{ display: { md: 'none' }, color: 'text.primary' }}
            >
              <MenuOutlinedIcon />
            </IconButton>
          </Stack>
        </Stack>
      </Container>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 280, bgcolor: 'background.paper' } }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Logo />
            <IconButton onClick={() => setDrawerOpen(false)} aria-label="Close menu">
              <CloseOutlinedIcon />
            </IconButton>
          </Stack>
          <List>
            {NAV_LINKS.map((link) => (
              <ListItem key={link.href} disablePadding>
                <ListItemButton
                  component="a"
                  href={link.href}
                  onClick={() => setDrawerOpen(false)}
                >
                  <ListItemText primary={link.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 1 }} />
          <Stack spacing={1} sx={{ p: 1 }}>
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              startIcon={<LoginOutlinedIcon />}
              onClick={() => setDrawerOpen(false)}
            >
              Sign in
            </Button>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              onClick={() => setDrawerOpen(false)}
            >
              Get started
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </Box>
  )
}

function HeroMockup() {
  const theme = useTheme()

  return (
    <Box
      sx={{
        position: 'relative',
        display: { xs: 'none', md: 'block' },
        ml: { lg: 4 },
      }}
    >
      <Card
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: (t) =>
            `0 24px 64px -24px ${alpha(t.palette.primary.main, 0.4)}, 0 8px 24px ${alpha(
              t.palette.common.black,
              0.08,
            )}`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2.5,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.default',
          }}
        >
          <Stack direction="row" spacing={1}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: (t) => t.palette.error.main }} />
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: (t) => t.palette.warning.main }} />
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: (t) => t.palette.success.main }} />
          </Stack>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Warehouse overview
          </Typography>
          <Chip
            size="small"
            icon={<VerifiedOutlinedIcon sx={{ fontSize: 14 }} />}
            label="Live"
            sx={{
              bgcolor: (t) => alpha(t.palette.success.main, 0.12),
              color: (t) =>
                t.palette.mode === 'dark' ? t.palette.success.light : t.palette.success.dark,
              '& .MuiChip-icon': { color: (t) => (t.palette.mode === 'dark' ? t.palette.success.light : t.palette.success.dark) },
              fontWeight: 600,
            }}
          />
        </Box>

        <Box sx={{ p: 2.5, bgcolor: 'background.paper' }}>
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            {[
              { label: 'Products', value: '1,284', trend: '+12%' },
              { label: 'Low stock', value: '8', trend: '-3' },
              { label: 'Fulfilled today', value: '96%', trend: '+4%' },
            ].map((stat) => (
              <Grid item xs={4} key={stat.label}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {stat.label}
                  </Typography>
                  <Typography component="span" variant="h6" fontWeight={700} lineHeight={1.2}>
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    sx={{ color: (t) => alpha(t.palette.success.main, 0.9) }}
                  >
                    {stat.trend}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mb: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                Stock movements
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last 6 months
              </Typography>
            </Stack>
            <Box sx={{ height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={HERO_CHART} barGap={3}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={alpha(theme.palette.divider, 0.6)}
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: alpha(theme.palette.primary.main, 0.08) }}
                    contentStyle={{
                      borderRadius: 10,
                      border: `1px solid ${theme.palette.divider}`,
                      background: theme.palette.background.paper,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    }}
                  />
                  <Bar dataKey="inbound" name="Stock in" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outbound" name="Stock out" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="body2" fontWeight={600}>
              Low stock alerts
            </Typography>
            <Button size="small" sx={{ textTransform: 'none', minWidth: 0 }}>
              View all
            </Button>
          </Stack>
          <Stack spacing={1}>
            {LOW_STOCK_ITEMS.map((item) => (
              <Stack
                key={item.sku}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  p: 1.25,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.25}>
                  <Box
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: (t) => alpha(t.palette.warning.main, 0.14),
                      color: 'warning.main',
                    }}
                  >
                    <WarningAmberRoundedIcon sx={{ fontSize: 16 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {item.sku}
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  size="small"
                  label={`${item.qty} left`}
                  variant="outlined"
                  sx={{
                    fontWeight: 600,
                    color: (t) =>
                      t.palette.mode === 'dark' ? t.palette.warning.light : t.palette.warning.dark,
                    borderColor: (t) => alpha(t.palette.warning.main, 0.45),
                  }}
                />
              </Stack>
            ))}
          </Stack>
        </Box>
      </Card>

      <Card
        elevation={0}
        sx={{
          position: 'absolute',
          top: -22,
          right: -18,
          px: 1.75,
          py: 1.25,
          borderRadius: 2.5,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: (t) => `0 16px 40px -12px ${alpha(t.palette.common.black, 0.25)}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (t) => alpha(t.palette.warning.main, 0.14),
            color: 'warning.main',
          }}
        >
          <NotificationsActiveOutlinedIcon sx={{ fontSize: 18 }} />
        </Box>
        <Box>
          <Typography variant="caption" fontWeight={700} lineHeight={1.2}>
            Low stock alert
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.3}>
            Wireless Mouse · 4 left
          </Typography>
        </Box>
      </Card>

      <Card
        elevation={0}
        sx={{
          position: 'absolute',
          bottom: -20,
          left: -24,
          px: 1.75,
          py: 1.25,
          borderRadius: 2.5,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: (t) => `0 16px 40px -12px ${alpha(t.palette.common.black, 0.25)}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (t) => alpha(t.palette.success.main, 0.14),
            color: 'success.main',
          }}
        >
          <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />
        </Box>
        <Box>
          <Typography variant="caption" fontWeight={700} lineHeight={1.2}>
            Stock synced
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.3}>
            3 movements recorded
          </Typography>
        </Box>
      </Card>
    </Box>
  )
}

function Hero() {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: 560,
            height: 560,
            borderRadius: '50%',
            top: -180,
            right: -120,
            background: (t) => `radial-gradient(circle, ${alpha(t.palette.primary.main, 0.18)}, transparent 65%)`,
            filter: 'blur(10px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 480,
            height: 480,
            borderRadius: '50%',
            bottom: -200,
            left: -160,
            background: (t) => `radial-gradient(circle, ${alpha(t.palette.primary.main, 0.12)}, transparent 65%)`,
            filter: 'blur(10px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '45%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            maxWidth: 900,
            height: 420,
            background: (t) =>
              `radial-gradient(ellipse, ${alpha(t.palette.primary.main, 0.07)}, transparent 70%)`,
          }}
        />
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', py: { xs: 8, md: 12 } }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Chip
              icon={<BoltOutlinedIcon />}
              label="Real-time warehouse management"
              sx={{
                mb: 3,
                bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                color: (t) => accent(t),
                fontWeight: 600,
                '& .MuiChip-icon': { color: (t) => accent(t) },
              }}
            />
            <Typography
              component="h1"
              variant="h2"
              fontWeight={800}
              sx={{
                fontSize: { xs: '2.4rem', sm: '3.2rem', md: '3.6rem' },
                lineHeight: 1.1,
                letterSpacing: -0.02,
                mb: 2,
              }}
            >
              Your warehouse,
              <Box
                component="span"
                sx={{
                  display: 'block',
                  background: (t) => `linear-gradient(90deg, ${accent(t)}, ${alpha(accent(t), 0.55)})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                in perfect sync.
              </Box>
            </Typography>
            <Typography component="p" variant="h6" color="text.secondary" sx={{ fontWeight: 400, maxWidth: 520, mb: 4 }}>
              Track inventory, automate restocking alerts and see every movement in one
              clean, real-time dashboard.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 5 }}>
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardOutlinedIcon />}
                sx={{
                  px: 4,
                  py: 1.5,
                  boxShadow: (t) => `0 12px 28px -8px ${alpha(t.palette.primary.main, 0.6)}`,
                  '&:hover': { transform: 'translateY(-1px)', boxShadow: (t) => `0 16px 34px -8px ${alpha(t.palette.primary.main, 0.7)}` },
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
              >
                Get started free
              </Button>
              <Button
                href="#features"
                variant="outlined"
                size="large"
                sx={{ px: 4, py: 1.5 }}
              >
                Explore features
              </Button>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2}>
              <AvatarGroup
                max={4}
                sx={{ '& .MuiAvatar-root': { width: 36, height: 36, fontSize: 14 } }}
              >
                <Avatar sx={{ bgcolor: '#059669' }}>MK</Avatar>
                <Avatar sx={{ bgcolor: '#d97706' }}>AS</Avatar>
                <Avatar sx={{ bgcolor: '#0284c7' }}>JL</Avatar>
                <Avatar sx={{ bgcolor: '#7c3aed' }}>RT</Avatar>
                <Avatar sx={{ bgcolor: '#e11d48' }}>+</Avatar>
              </AvatarGroup>
              <Box>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {[...Array(5)].map((_, i) => (
                    <Box key={i} sx={{ color: 'warning.main', fontSize: 16, lineHeight: 1 }}>★</Box>
                  ))}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Trusted by 500+ logistics teams
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ px: { md: 2 }, py: 2 }}>
              <HeroMockup />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

function MetricsStrip() {
  return (
    <Box component="section" sx={{ borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 6 } }}>
        <Grid container spacing={4}>
          {METRICS.map((metric) => (
            <Grid item xs={6} md={3} key={metric.label}>
              <Box sx={{ textAlign: { xs: 'left', md: 'center' } }}>
                <Typography
                  component="span"
                  variant="h4"
                  fontWeight={800}
                  sx={{
                    color: (t) => accent(t),
                    fontSize: { xs: '2rem', md: '2.4rem' },
                    mb: 0.5,
                  }}
                >
                  {metric.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  {metric.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}

function FeatureCard({ icon, title, description }: (typeof FEATURES)[number]) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: 'primary.main',
          boxShadow: (t) => `0 20px 44px -20px ${alpha(t.palette.primary.main, 0.4)}`,
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
            color: (t) => accent(t),
            mb: 2.5,
          }}
        >
          {icon}
        </Box>
        <Typography component="h3" variant="h6" fontWeight={700} sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
    </Card>
  )
}

function Features() {
  return (
    <Box component="section" id="features" sx={{ bgcolor: 'background.paper', py: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <Box sx={{ maxWidth: 640, mx: 'auto', textAlign: 'center', mb: { xs: 5, md: 7 } }}>
          <Typography variant="overline" fontWeight={700} sx={{ letterSpacing: 2, color: (t) => accent(t) }}>
            Features
          </Typography>
          <Typography component="h2" variant="h3" fontWeight={800} sx={{ fontSize: { xs: '1.9rem', md: '2.6rem' }, mb: 2, letterSpacing: -0.01 }}>
            Everything your warehouse needs
          </Typography>
          <Typography variant="body1" color="text.secondary">
            One platform to run inventory, keep every product moving and make decisions
            with confidence.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {FEATURES.map((feature) => (
            <Grid item xs={12} sm={6} lg={4} key={feature.title}>
              <FeatureCard {...feature} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}

function HowItWorks() {
  return (
    <Box component="section" id="how-it-works" sx={{ bgcolor: 'background.default', py: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <Box sx={{ maxWidth: 640, mx: 'auto', textAlign: 'center', mb: { xs: 5, md: 7 } }}>
          <Typography variant="overline" fontWeight={700} sx={{ letterSpacing: 2, color: (t) => accent(t) }}>
            How it works
          </Typography>
          <Typography component="h2" variant="h3" fontWeight={800} sx={{ fontSize: { xs: '1.9rem', md: '2.6rem' }, mb: 2, letterSpacing: -0.01 }}>
            Live in three simple steps
          </Typography>
          <Typography variant="body1" color="text.secondary">
            From empty shelf to full control in less than an afternoon.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {STEPS.map((step, index) => (
            <Grid item xs={12} md={4} key={step.step}>
              <Box sx={{ position: 'relative', height: '100%' }}>
                {index < STEPS.length - 1 && (
                  <Box
                    sx={{
                      display: { xs: 'none', md: 'block' },
                      position: 'absolute',
                      top: 40,
                      left: 'calc(50% + 40px)',
                      width: 'calc(100% - 80px)',
                      borderTop: '2px dashed',
                      borderColor: 'divider',
                    }}
                  />
                )}
                <Box
                  sx={{
                    textAlign: 'center',
                    px: 2,
                    position: 'relative',
                    bgcolor: 'background.default',
                  }}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                      position: 'relative',
                      background: (t) =>
                        `linear-gradient(135deg, ${t.palette.primary.main}, ${alpha(t.palette.primary.main, 0.65)})`,
                      color: '#fff',
                      boxShadow: (t) => `0 16px 36px -12px ${alpha(t.palette.primary.main, 0.55)}`,
                    }}
                  >
                    {step.icon}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'background.paper',
                        color: (t) => accent(t),
                        border: '1px solid',
                        borderColor: 'divider',
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: 'monospace',
                      }}
                    >
                      {step.step}
                    </Box>
                  </Box>
                  <Typography component="h3" variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}

function WhyUs() {
  return (
    <Box component="section" id="why-us" sx={{ bgcolor: 'background.paper', py: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="overline" fontWeight={700} sx={{ letterSpacing: 2, color: (t) => accent(t) }}>
              Why SmartWarehouse
            </Typography>
            <Typography component="h2" variant="h3" fontWeight={800} sx={{ fontSize: { xs: '1.9rem', md: '2.6rem' }, mb: 2, letterSpacing: -0.01 }}>
              Built for teams that can't afford to guess
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 520 }}>
              We stripped away the friction of legacy WMS software and focused on the
              handful of things that keep a warehouse running smoothly.
            </Typography>

            <Stack spacing={2.5}>
              {[
                {
                  icon: <TrackChangesOutlinedIcon />,
                  title: 'Data you can act on',
                  description: 'Every metric is one glance away — no exports, no waiting for monthly reports.',
                },
                {
                  icon: <VerifiedOutlinedIcon />,
                  title: 'Built on trust',
                  description: 'Role-based permissions, full audit trails and secure sign-in out of the box.',
                },
                {
                  icon: <BoltOutlinedIcon />,
                  title: 'Fast to adopt',
                  description: 'A clean, consistent interface your team already knows how to use.',
                },
              ].map((item) => (
                <Stack direction="row" spacing={2} key={item.title}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      flexShrink: 0,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                      color: (t) => accent(t),
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Box>
                    <Typography component="h3" variant="subtitle1" fontWeight={700}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 4,
                p: { xs: 3, md: 5 },
                background: (t) =>
                  t.palette.mode === 'light'
                    ? `linear-gradient(160deg, ${alpha(t.palette.primary.main, 0.06)}, ${t.palette.background.paper})`
                    : `linear-gradient(160deg, ${alpha(t.palette.primary.main, 0.12)}, ${t.palette.background.paper})`,
              }}
            >
              <Box sx={{ color: 'warning.main', fontSize: 32, mb: 2 }}>★★★★★</Box>
              <Typography component="p" variant="h6" fontWeight={600} sx={{ lineHeight: 1.6, mb: 3 }}>
                "We cut our stockouts by 40% in the first quarter. The low-stock alerts alone
                paid for the switch — now reordering happens before a problem exists, not after."
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ width: 44, height: 44, bgcolor: 'primary.main', fontWeight: 700 }}>
                  AR
                </Avatar>
                <Box>
                  <Typography component="p" variant="subtitle2" fontWeight={700}>
                    Amira Rahmani
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Operations Lead, Northline Logistics
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

function CtaBand() {
  return (
    <Box component="section" sx={{ bgcolor: 'background.default', py: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 4,
            px: { xs: 3, md: 8 },
            py: { xs: 6, md: 9 },
            textAlign: 'center',
            color: '#fff',
            background: (t) =>
              `linear-gradient(135deg, ${t.palette.primary.main}, ${alpha(t.palette.primary.main, 0.72)})`,
            boxShadow: (t) => `0 32px 80px -24px ${alpha(t.palette.primary.main, 0.6)}`,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              width: 320,
              height: 320,
              borderRadius: '50%',
              top: -140,
              right: -80,
              bgcolor: 'rgba(255,255,255,0.12)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: 260,
              height: 260,
              borderRadius: '50%',
              bottom: -120,
              left: -70,
              bgcolor: 'rgba(255,255,255,0.1)',
            }}
          />
          <Box sx={{ position: 'relative' }}>
            <Typography
              component="h2"
              variant="h3"
              fontWeight={800}
              sx={{ fontSize: { xs: '1.8rem', md: '2.6rem' }, mb: 2, letterSpacing: -0.01 }}
            >
              Ready to modernize your warehouse?
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 560, mx: 'auto', mb: 4 }}>
              Join hundreds of teams keeping their shelves stocked, their data accurate and
              their operations moving — all from one dashboard.
            </Typography>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardOutlinedIcon />}
              sx={{
                bgcolor: '#fff',
                color: 'primary.main',
                px: 4.5,
                py: 1.5,
                fontWeight: 700,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.92)', transform: 'translateY(-1px)' },
                transition: 'transform 0.15s',
              }}
            >
              Get started free
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

function Footer() {
  return (
    <Box component="footer" sx={{ borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 2 }}>
              <Logo />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
              Smart inventory and warehouse management for modern logistics teams.
            </Typography>
          </Grid>
          {[
            {
              heading: 'Product',
              links: ['Features', 'Pricing', 'Dashboard', 'Integrations'],
            },
            {
              heading: 'Company',
              links: ['About', 'Blog', 'Careers', 'Contact'],
            },
            {
              heading: 'Resources',
              links: ['Documentation', 'Help center', 'API status', 'Changelog'],
            },
          ].map((col) => (
            <Grid item xs={6} md={2} key={col.heading}>
              <Typography component="h3" variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                {col.heading}
              </Typography>
              <Stack spacing={1}>
                {col.links.map((link) => (
                  <Typography
                    key={link}
                    component="a"
                    href="#top"
                    color="text.secondary"
                    sx={{
                      textDecoration: 'none',
                      fontSize: 14,
                      '&:hover': { color: 'primary.main' },
                    }}
                  >
                    {link}
                  </Typography>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>
        <Divider sx={{ my: 4 }} />
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
        >
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} SmartWarehouse. All rights reserved.
          </Typography>
          <Stack direction="row" spacing={3}>
            <Typography variant="caption" color="text.secondary" sx={{ '&:hover': { color: 'primary.main' } }}>
              Privacy
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ '&:hover': { color: 'primary.main' } }}>
              Terms
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ '&:hover': { color: 'primary.main' } }}>
              Security
            </Typography>
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}

export default function Landing() {
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <GlobalStyles
        styles={{
          html: { scrollBehavior: 'smooth' },
          section: { scrollMarginTop: 88 },
        }}
      />
      <LandingNavbar />
      <main>
        <Hero />
        <MetricsStrip />
        <Features />
        <HowItWorks />
        <WhyUs />
        <CtaBand />
      </main>
      <Footer />
    </Box>
  )
}
