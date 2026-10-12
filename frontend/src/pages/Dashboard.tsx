import { useCallback, useEffect, useState } from 'react'
import {
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link,
  Stack,
  useTheme,
} from '@mui/material'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined'
import SwapVertOutlinedIcon from '@mui/icons-material/SwapVertOutlined'
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardApi } from '../api/dashboardApi'
import type { DashboardSummary, MovementType } from '../types'
import Loading from '../components/common/Loading'

const PIE_COLORS = ['#059669', '#0284c7', '#d97706', '#e11d48', '#8b5cf6', '#64748b']

const MOVEMENT_LABELS: Record<MovementType, string> = {
  INBOUND: 'Inbound',
  OUTBOUND: 'Outbound',
  ADJUSTMENT: 'Adjustment',
}

interface StatCardProps {
  label: string
  value: number
  icon: React.ReactNode
  accentColor: string
  bgTint: string
}

function StatCard({ label, value, icon, accentColor, bgTint }: StatCardProps) {
  const theme = useTheme()
  const isLight = theme.palette.mode === 'light'

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: '16px',
        bgcolor: 'background.paper',
        border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.07)'}`,
        boxShadow: isLight
          ? '0 1px 3px rgba(0, 0, 0, 0.02), 0 4px 12px rgba(0, 0, 0, 0.02)'
          : '0 2px 8px rgba(0, 0, 0, 0.3)',
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                display: 'block',
                mb: 0.5,
              }}
            >
              {label}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
              }}
            >
              {value.toLocaleString()}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: bgTint,
              color: accentColor,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const theme = useTheme()
  const isLight = theme.palette.mode === 'light'
  const { email } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    try {
      const data = await dashboardApi.getSummary()
      setSummary(data)
    } catch {
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  if (loading) {
    return <Loading />
  }

  const displayName = email.split('@')[0].replace(/[._-]/g, ' ')
  const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1)
  const hasLowStock = (summary?.lowStockProducts.length ?? 0) > 0

  return (
    <Box>
      {/* Page Heading Banner */}
      <Box sx={{ mb: 3.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                letterSpacing: '-0.025em',
                color: isLight ? '#1d1d1f' : '#f5f5f7',
                mb: 0.5,
              }}
            >
              Overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Welcome back, {formattedName}. Here is your live warehouse status.
            </Typography>
          </Box>
          <Chip
            label="Live Telemetry"
            size="small"
            sx={{
              borderRadius: '9999px',
              bgcolor: isLight ? 'rgba(5, 150, 105, 0.08)' : 'rgba(52, 211, 153, 0.15)',
              color: isLight ? '#065f46' : '#6ee7b7',
              fontWeight: 600,
              fontSize: '0.725rem',
            }}
          />
        </Stack>
      </Box>

      {/* Metric KPI Cards */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Total Products"
            value={summary?.totalProducts ?? 0}
            icon={<Inventory2OutlinedIcon fontSize="medium" />}
            accentColor="#059669"
            bgTint={isLight ? 'rgba(5, 150, 105, 0.08)' : 'rgba(52, 211, 153, 0.15)'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Low Stock Items"
            value={summary?.lowStockCount ?? 0}
            icon={<WarningAmberOutlinedIcon fontSize="medium" />}
            accentColor="#d97706"
            bgTint={isLight ? 'rgba(217, 119, 6, 0.08)' : 'rgba(245, 158, 11, 0.15)'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Out of Stock"
            value={summary?.outOfStockCount ?? 0}
            icon={<BlockOutlinedIcon fontSize="medium" />}
            accentColor="#e11d48"
            bgTint={isLight ? 'rgba(225, 29, 72, 0.08)' : 'rgba(244, 63, 94, 0.15)'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Categories"
            value={summary?.totalCategories ?? 0}
            icon={<CategoryOutlinedIcon fontSize="medium" />}
            accentColor="#0284c7"
            bgTint={isLight ? 'rgba(2, 132, 199, 0.08)' : 'rgba(56, 189, 248, 0.15)'}
          />
        </Grid>
      </Grid>

      {/* Row 2: Low Stock List & Category Breakdown */}
      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
              title={
                <Typography variant="h6" fontWeight={700}>
                  Low Stock Critical Alerts
                </Typography>
              }
              subheader="Products currently at or below minimum threshold"
              subheaderTypographyProps={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.25 }}
              sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}
            />
            <CardContent sx={{ p: 0, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              {hasLowStock ? (
                <TableContainer sx={{ flexGrow: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell>SKU</TableCell>
                        <TableCell align="right">Current Qty</TableCell>
                        <TableCell align="right">Threshold</TableCell>
                        <TableCell align="right">Severity</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {summary?.lowStockProducts.map((product) => (
                        <TableRow key={product.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{product.name}</TableCell>
                          <TableCell>
                            <Typography
                              component="span"
                              sx={{
                                fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                fontSize: '0.8rem',
                                color: 'text.secondary',
                              }}
                            >
                              {product.sku}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {product.quantity}
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'text.secondary' }}>
                            {product.minStock}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={product.quantity === 0 ? 'Out of stock' : 'Low stock'}
                              color={product.quantity === 0 ? 'error' : 'warning'}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.675rem',
                                height: 22,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 5, textAlign: 'center', my: 'auto' }}>
                  <Typography variant="body2" color="text.secondary">
                    All products are safely above their minimum thresholds.
                  </Typography>
                </Box>
              )}
              <Box
                sx={{
                  px: 2.5,
                  py: 1.5,
                  borderTop: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.07)'}`,
                  bgcolor: isLight ? '#fbfbfd' : '#141416',
                }}
              >
                <Link
                  component={RouterLink}
                  to="/products"
                  underline="none"
                  sx={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'primary.main',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Manage all products <ArrowForwardOutlinedIcon sx={{ fontSize: 14 }} />
                </Link>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ height: '100%' }}>
            <CardHeader
              title={
                <Typography variant="h6" fontWeight={700}>
                  Products by Category
                </Typography>
              }
              subheader="Inventory taxonomic distribution"
              subheaderTypographyProps={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.25 }}
              sx={{ px: 2.5, pt: 2.5, pb: 1 }}
            />
            <CardContent sx={{ pt: 0 }}>
              {summary && summary.productsPerCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={290}>
                  <PieChart>
                    <Pie
                      data={summary.productsPerCategory}
                      dataKey="productCount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {summary.productsPerCategory.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '10px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        backgroundColor: isLight ? '#1d1d1f' : '#27272a',
                        color: '#fff',
                        fontSize: '0.8rem',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.785rem', paddingTop: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No categories registered yet
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Row 3: Monthly Inbound/Outbound Velocity & Recent Activity */}
      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        <Grid item xs={12} lg={8}>
          <Card elevation={0}>
            <CardHeader
              title={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <SwapVertOutlinedIcon fontSize="small" sx={{ color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight={700}>
                    Movement Velocity
                  </Typography>
                </Stack>
              }
              subheader="Inbound received vs outbound dispatched over the last 6 months"
              subheaderTypographyProps={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.25 }}
              sx={{ px: 2.5, pt: 2.5, pb: 1 }}
            />
            <CardContent sx={{ pt: 1 }}>
              {summary && summary.monthlyMovements.length > 0 ? (
                <ResponsiveContainer width="100%" height={290}>
                  <BarChart data={summary.monthlyMovements} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isLight ? '#f2f2f7' : '#27272a'} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: isLight ? '#86868b' : '#a1a1a6' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: isLight ? '#86868b' : '#a1a1a6' }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '10px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        backgroundColor: isLight ? '#1d1d1f' : '#27272a',
                        color: '#fff',
                        fontSize: '0.8rem',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.785rem', paddingTop: '8px' }} />
                    <Bar dataKey="inbound" name="Inbound" fill="#059669" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="outbound" name="Outbound" fill="#e11d48" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No monthly movements recorded yet
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
              title={
                <Typography variant="h6" fontWeight={700}>
                  Recent Activity
                </Typography>
              }
              subheader="Latest stock transactions"
              subheaderTypographyProps={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.25 }}
              sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}
            />
            <CardContent sx={{ p: 0, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              {summary && summary.recentMovements.length > 0 ? (
                <TableContainer sx={{ flexGrow: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Type</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {summary.recentMovements.map((movement) => (
                        <TableRow key={movement.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body2" fontWeight={600} noWrap>
                                {movement.productName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(movement.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {movement.quantity}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={MOVEMENT_LABELS[movement.type]}
                              color={
                                movement.type === 'INBOUND'
                                  ? 'success'
                                  : movement.type === 'OUTBOUND'
                                    ? 'error'
                                    : 'warning'
                              }
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.675rem',
                                height: 22,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 5, textAlign: 'center', my: 'auto' }}>
                  <Typography variant="body2" color="text.secondary">
                    No movements recorded yet.
                  </Typography>
                </Box>
              )}
              <Box
                sx={{
                  px: 2.5,
                  py: 1.5,
                  borderTop: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.07)'}`,
                  bgcolor: isLight ? '#fbfbfd' : '#141416',
                }}
              >
                <Link
                  component={RouterLink}
                  to="/movements"
                  underline="none"
                  sx={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'primary.main',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  View full ledger <ArrowForwardOutlinedIcon sx={{ fontSize: 14 }} />
                </Link>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
