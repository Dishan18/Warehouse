import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded'
import BlockRoundedIcon from '@mui/icons-material/BlockRounded'
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { downloadBlob } from '@/utils/download'
import { reportsApi, type DateRange } from '@/api/reports'
import { settingsApi } from '@/api/settingsApi'
import { format } from 'date-fns'

const PIE_COLORS = ['#10b981', '#0ea5e9', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e']

function formatCurrency(value: number, currencyCode: string = 'USD'): string {
  try {
    return new Intl.NumberFormat(currencyCode === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(value)
  } catch {
    return `${currencyCode} ${Number(value || 0).toFixed(2)}`
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

interface StatCardProps {
  label: string
  value: string
  icon: ReactNode
  bgColor: string
  iconColor: string
  trend?: 'up' | 'down'
  trendLabel?: string
}

function StatCard({ label, value, icon, bgColor, iconColor, trend, trendLabel }: StatCardProps) {
  return (
    <Card
      sx={{
        borderRadius: '16px',
        border: '1px solid',
        borderColor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: bgColor,
              color: iconColor,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              {label}
            </Typography>
            <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.02em', my: 0.25 }}>
              {value}
            </Typography>
            {trend && trendLabel && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                {trend === 'up' ? (
                  <TrendingUpRoundedIcon sx={{ fontSize: 14, color: 'success.main' }} />
                ) : (
                  <TrendingDownRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                )}
                <Typography variant="caption" color={trend === 'up' ? 'success.main' : 'text.secondary'} fontWeight={600}>
                  {trendLabel}
                </Typography>
              </Stack>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <Card
      sx={{
        borderRadius: '16px',
        border: '1px solid',
        borderColor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      <CardHeader
        title={
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
        }
        subheader={
          description ? (
            <Typography variant="caption" color="text.secondary">
              {description}
            </Typography>
          ) : undefined
        }
        sx={{ pb: 0, pt: 2.5, px: 2.5 }}
      />
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ height: 280, width: '100%' }}>{children}</Box>
      </CardContent>
    </Card>
  )
}

function DateRangePicker({
  startDate,
  endDate,
  onChange,
}: {
  startDate: string
  endDate: string
  onChange: (dates: DateRange) => void
}) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
      <TextField
        id="startDate"
        label="From"
        type="date"
        size="small"
        value={startDate}
        InputLabelProps={{ shrink: true }}
        onChange={(e) => onChange({ startDate: e.target.value, endDate })}
        sx={{
          minWidth: 140,
          '& .MuiOutlinedInput-root': { borderRadius: '10px' },
        }}
      />
      <TextField
        id="endDate"
        label="To"
        type="date"
        size="small"
        value={endDate}
        InputLabelProps={{ shrink: true }}
        onChange={(e) => onChange({ startDate, endDate: e.target.value })}
        sx={{
          minWidth: 140,
          '& .MuiOutlinedInput-root': { borderRadius: '10px' },
        }}
      />
    </Stack>
  )
}

export default function Reports() {
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: format(thirtyDaysAgo, 'yyyy-MM-dd'),
    endDate: format(today, 'yyyy-MM-dd'),
  })

  const { data: report, isLoading, error } = useQuery({
    queryKey: ['inventoryReport', dateRange],
    queryFn: async () => (await reportsApi.getInventoryReport(dateRange)).data,
  })

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get(),
  })
  const currencyCode = settings?.currency || 'USD'
  const fmtCurrency = (val: number) => formatCurrency(val, currencyCode)

  const handleExportPdf = async () => {
    if (!report) return

    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()

    pdf.setFontSize(20)
    pdf.text('Inventory Report', pageWidth / 2, 20, { align: 'center' })

    pdf.setFontSize(10)
    pdf.text(
      `Generated on ${format(new Date(), 'PPpp')} | Period: ${format(new Date(dateRange.startDate), 'PP')} - ${format(new Date(dateRange.endDate), 'PP')}`,
      pageWidth / 2,
      28,
      { align: 'center' },
    )

    let yPos = 40

    pdf.setFontSize(14)
    pdf.text('Summary', 14, yPos)
    yPos += 10

    const summaryData = [
      ['Total Products', formatNumber(report.totalProducts)],
      ['Total Categories', formatNumber(report.totalCategories)],
      ['Total Suppliers', formatNumber(report.totalSuppliers)],
      ['Low Stock Products', formatNumber(report.lowStockProducts)],
      ['Out of Stock Products', formatNumber(report.outOfStockProducts)],
      ['Total Inventory Value', fmtCurrency(report.totalInventoryValue)],
    ]

    autoTable(pdf, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [5, 150, 105] },
    })

    yPos = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

    pdf.setFontSize(14)
    pdf.text('Products by Category', 14, yPos)
    yPos += 10

    autoTable(pdf, {
      startY: yPos,
      head: [['Category', 'Product Count', 'Total Value']],
      body: report.productsByCategory.map((item) => [
        item.category,
        formatNumber(item.count),
        fmtCurrency(item.value),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [5, 150, 105] },
    })

    yPos = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

    if (report.topProductsByMovement.length > 0) {
      pdf.setFontSize(14)
      pdf.text('Top Products by Movement', 14, yPos)
      yPos += 10

      autoTable(pdf, {
        startY: yPos,
        head: [['Product', 'Movements']],
        body: report.topProductsByMovement.map((item) => [item.product, formatNumber(item.movements)]),
        theme: 'striped',
        headStyles: { fillColor: [5, 150, 105] },
      })
    }

    const pdfBlob = pdf.output('blob')
    downloadBlob(pdfBlob, `inventory-report-${dateRange.startDate}-to-${dateRange.endDate}.pdf`)
  }

  if (isLoading) {
    return (
      <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, sm: 3 } }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Skeleton variant="text" width={180} height={36} />
            <Skeleton variant="text" width={260} height={20} />
          </Box>
          <Skeleton variant="rounded" width={240} height={40} />
        </Stack>
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item}>
              <Skeleton variant="rounded" height={100} sx={{ borderRadius: '16px' }} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={6}>
            <Skeleton variant="rounded" height={340} sx={{ borderRadius: '16px' }} />
          </Grid>
          <Grid item xs={12} lg={6}>
            <Skeleton variant="rounded" height={340} sx={{ borderRadius: '16px' }} />
          </Grid>
        </Grid>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, maxWidth: 480, mx: 'auto' }}>
        <WarningAmberRoundedIcon sx={{ fontSize: 52, color: 'error.main', mb: 2 }} />
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Failed to load report
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {(error as Error).message}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()} sx={{ borderRadius: '10px' }}>
          Retry
        </Button>
      </Box>
    )
  }

  if (!report) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, maxWidth: 480, mx: 'auto' }}>
        <Inventory2OutlinedIcon sx={{ fontSize: 52, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" fontWeight={700} gutterBottom>
          No data available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No inventory transactions recorded for the selected period.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.02em', mb: 0.25 }}>
            Analytics & Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Facility valuation metrics, category breakdowns, and exportable PDF audit summaries
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
          <DateRangePicker
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={setDateRange}
          />
          <Button
            variant="contained"
            startIcon={<DownloadRoundedIcon />}
            onClick={handleExportPdf}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 'none',
              px: 2.5,
              py: 0.85,
              whiteSpace: 'nowrap',
            }}
          >
            Export PDF
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Total Products"
            value={formatNumber(report.totalProducts)}
            icon={<Inventory2OutlinedIcon sx={{ fontSize: 22 }} />}
            bgColor="rgba(14, 165, 233, 0.12)"
            iconColor="#0284c7"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Low Stock Alerts"
            value={formatNumber(report.lowStockProducts)}
            icon={<WarningAmberRoundedIcon sx={{ fontSize: 22 }} />}
            bgColor="rgba(245, 158, 11, 0.12)"
            iconColor="#d97706"
            trend={report.lowStockProducts > 0 ? 'up' : 'down'}
            trendLabel={report.lowStockProducts > 0 ? 'Requires attention' : 'Optimal'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Out of Stock"
            value={formatNumber(report.outOfStockProducts)}
            icon={<BlockRoundedIcon sx={{ fontSize: 22 }} />}
            bgColor="rgba(239, 68, 68, 0.12)"
            iconColor="#e11d48"
            trend={report.outOfStockProducts > 0 ? 'up' : 'down'}
            trendLabel={report.outOfStockProducts > 0 ? 'Depleted' : 'None'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Total Inventory Value"
            value={fmtCurrency(report.totalInventoryValue)}
            icon={<AccountBalanceWalletOutlinedIcon sx={{ fontSize: 22 }} />}
            bgColor="rgba(16, 185, 129, 0.12)"
            iconColor="#059669"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={6}>
          <ChartCard
            title="Products by Category"
            description="Item count distribution across product departments"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.productsByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.15} />
                <XAxis type="number" tickFormatter={formatNumber} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="category" width={110} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [formatNumber(Number(value ?? 0)), 'Products']}
                  labelFormatter={(label) => String(label ?? '')}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#0ea5e9"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        <Grid item xs={12} lg={6}>
          <ChartCard
            title="Inventory Value by Category"
            description="Capital allocation valuation across departments"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.productsByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.15} />
                <XAxis type="number" tickFormatter={fmtCurrency} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="category" width={110} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [fmtCurrency(Number(value ?? 0)), 'Valuation']}
                  labelFormatter={(label) => String(label ?? '')}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#10b981"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={7}>
          <ChartCard
            title="Stock Flow Trends"
            description="Daily inbound intake vs outbound dispatches"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.stockMovements}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MM/dd')} tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatNumber} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [formatNumber(Number(value ?? 0)), 'Units']}
                  labelFormatter={(label) => format(new Date(String(label)), 'PP')}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="in"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ fill: '#10b981', r: 3 }}
                  name="Stock In"
                />
                <Line
                  type="monotone"
                  dataKey="out"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  dot={{ fill: '#f43f5e', r: 3 }}
                  name="Stock Out"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        <Grid item xs={12} lg={5}>
          <ChartCard
            title="Top Transacted Items"
            description="SKUs with the highest movement velocity in this period"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={report.topProductsByMovement}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="movements"
                  nameKey="product"
                >
                  {report.topProductsByMovement.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatNumber(Number(value ?? 0)), 'Movements']}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      {/* Supplier Performance Table */}
      <Card
        sx={{
          borderRadius: '16px',
          border: '1px solid',
          borderColor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <CardHeader
          title={
            <Typography variant="subtitle1" fontWeight={700}>
              Supplier Contribution & Volume
            </Typography>
          }
          subheader={
            <Typography variant="caption" color="text.secondary">
              Product catalog counts and cumulative stock valuations per vendor
            </Typography>
          }
          sx={{ pb: 1.5, pt: 2.5, px: 2.5 }}
        />
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size="medium">
              <TableHead>
                <TableRow sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)') }}>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', pl: 2.5 }}>
                    Supplier
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                    Supplied SKUs
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', pr: 2.5 }}>
                    Cumulative Valuation
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.supplierPerformance.map((supplier) => (
                  <TableRow
                    key={supplier.supplier}
                    sx={{
                      '&:hover': {
                        bgcolor: (theme) =>
                          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600, pl: 2.5 }}>{supplier.supplier}</TableCell>
                    <TableCell align="right">{formatNumber(supplier.products)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main', pr: 2.5 }}>
                      {fmtCurrency(supplier.totalValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {report.supplierPerformance.length === 0 && (
        <Alert severity="info" sx={{ mt: 2.5, borderRadius: '12px' }}>
          No supplier data available for the selected date period.
        </Alert>
      )}
    </Box>
  )
}