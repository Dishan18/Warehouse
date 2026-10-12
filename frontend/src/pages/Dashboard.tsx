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
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardApi } from '../api/dashboardApi'
import type { DashboardSummary, MovementType } from '../types'
import Loading from '../components/common/Loading'

const PIE_COLORS = ['#4f46e5', '#059669', '#d97706', '#e11d48', '#0284c7', '#7c3aed']

const MOVEMENT_LABELS: Record<MovementType, string> = {
  INBOUND: 'Stock in',
  OUTBOUND: 'Stock out',
  ADJUSTMENT: 'Adjustment',
}

interface StatCardProps {
  label: string
  value: number
  icon: React.ReactNode
  color: string
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: color,
              color: 'white',
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
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

  const firstName = email.split('@')[0].replace(/[._-]/g, ' ')
  const hasLowStock = (summary?.lowStockProducts.length ?? 0) > 0

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Good morning, {firstName}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Here is an overview of your warehouse today
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Products"
            value={summary?.totalProducts ?? 0}
            icon={<Inventory2OutlinedIcon />}
            color="#4f46e5"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Low Stock"
            value={summary?.lowStockCount ?? 0}
            icon={<WarningAmberOutlinedIcon />}
            color="#e11d48"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Out of Stock"
            value={summary?.outOfStockCount ?? 0}
            icon={<BlockOutlinedIcon />}
            color="#d97706"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Categories"
            value={summary?.totalCategories ?? 0}
            icon={<CategoryOutlinedIcon />}
            color="#059669"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 0 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardHeader
              title="Low stock alerts"
              subheader="Products below their minimum stock level"
            />
            <CardContent sx={{ p: 0 }}>
              {hasLowStock ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <b>Product</b>
                        </TableCell>
                        <TableCell>
                          <b>SKU</b>
                        </TableCell>
                        <TableCell align="right">
                          <b>Qty</b>
                        </TableCell>
                        <TableCell align="right">
                          <b>Min stock</b>
                        </TableCell>
                        <TableCell align="right">
                          <b>Status</b>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {summary?.lowStockProducts.map((product) => (
                        <TableRow key={product.id} hover>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>
                            <span style={{ fontFamily: 'monospace' }}>{product.sku}</span>
                          </TableCell>
                          <TableCell align="right">{product.quantity}</TableCell>
                          <TableCell align="right">{product.minStock}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={product.quantity === 0 ? 'Out of stock' : 'Low stock'}
                              color={product.quantity === 0 ? 'error' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    All products are above their minimum stock level.
                  </Typography>
                </Box>
              )}
              <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Link component={RouterLink} to="/products" underline="hover">
                  View all products
                </Link>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardHeader
              title="Products by category"
              subheader="Distribution across categories"
            />
            <CardContent>
              {summary && summary.productsPerCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={summary.productsPerCategory}
                      dataKey="productCount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={2}
                    >
                      {summary.productsPerCategory.map((_, index) => (
                        <Cell
                          key={index}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No products yet
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 0 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardHeader
              title="Stock movements"
              subheader="Inbound vs outbound over the last 6 months"
              avatar={<SwapVertOutlinedIcon color="primary" />}
            />
            <CardContent>
              {summary && summary.monthlyMovements.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={summary.monthlyMovements}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="inbound" name="Stock in" fill="#059669" />
                    <Bar dataKey="outbound" name="Stock out" fill="#e11d48" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No movements recorded yet
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardHeader
              title="Recent movements"
              subheader="Latest warehouse activity"
            />
            <CardContent sx={{ p: 0 }}>
              {summary && summary.recentMovements.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <b>Product</b>
                        </TableCell>
                        <TableCell align="right">
                          <b>Qty</b>
                        </TableCell>
                        <TableCell align="right">
                          <b>Type</b>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {summary.recentMovements.map((movement) => (
                        <TableRow key={movement.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <span>{movement.productName}</span>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(movement.createdAt).toLocaleString()}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">{movement.quantity}</TableCell>
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
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No movements recorded yet.
                  </Typography>
                </Box>
              )}
              <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Link component={RouterLink} to="/movements" underline="hover">
                  View all movements
                </Link>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
