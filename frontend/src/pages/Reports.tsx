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
  Toolbar,
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
import AlertTriangleOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined'
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { downloadBlob } from '@/utils/download'
import { reportsApi, type DateRange } from '@/api/reports'
import { format } from 'date-fns'

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

interface StatCardProps {
  label: string
  value: string
  icon: ReactNode
  color: string
  trend?: 'up' | 'down'
  trendLabel?: string
}

function StatCard({ label, value, icon, color, trend, trendLabel }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              flexShrink: 0,
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
            <Typography variant="h6" fontWeight={700}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            {trend && trendLabel && (
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                sx={{
                  mt: 0.5,
                  color: trend === 'up' ? 'success.main' : 'text.secondary',
                }}
              >
                {trend === 'up' ? (
                  <TrendingUpOutlinedIcon sx={{ fontSize: 14 }} />
                ) : (
                  <TrendingDownOutlinedIcon sx={{ fontSize: 14 }} />
                )}
                <Typography variant="caption">{trendLabel}</Typography>
              </Stack>
            )}
          </Box>
        </Box>
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
    <Card>
      <CardHeader title={title} subheader={description} />
      <CardContent>
        <Box sx={{ height: 300, width: '100%' }}>{children}</Box>
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
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <TextField
        id="startDate"
        label="From"
        type="date"
        size="small"
        value={startDate}
        InputLabelProps={{ shrink: true }}
        onChange={(e) => onChange({ startDate: e.target.value, endDate })}
      />
      <TextField
        id="endDate"
        label="To"
        type="date"
        size="small"
        value={endDate}
        InputLabelProps={{ shrink: true }}
        onChange={(e) => onChange({ startDate, endDate: e.target.value })}
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
      ['Total Inventory Value', formatCurrency(report.totalInventoryValue)],
    ]

    autoTable(pdf, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233] },
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
        formatCurrency(item.value),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233] },
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
        headStyles: { fillColor: [14, 165, 233] },
      })
    }

    const pdfBlob = pdf.output('blob')
    downloadBlob(pdfBlob, `inventory-report-${dateRange.startDate}-to-${dateRange.endDate}.pdf`)
  }

  if (isLoading) {
    return (
      <Box>
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" fontWeight={600}>
              Reports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Advanced analytics and exportable reports
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Skeleton variant="rounded" width={140} height={40} />
            <Skeleton variant="rounded" width={120} height={40} />
          </Stack>
        </Toolbar>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item}>
              <Skeleton variant="rounded" height={96} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={3} sx={{ mt: 0 }}>
          <Grid item xs={12} lg={6}>
            <Skeleton variant="rounded" height={350} />
          </Grid>
          <Grid item xs={12} lg={6}>
            <Skeleton variant="rounded" height={350} />
          </Grid>
        </Grid>
        <Grid container spacing={3} sx={{ mt: 0 }}>
          <Grid item xs={12} lg={6}>
            <Skeleton variant="rounded" height={350} />
          </Grid>
          <Grid item xs={12} lg={6}>
            <Skeleton variant="rounded" height={350} />
          </Grid>
        </Grid>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <AlertTriangleOutlinedIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Failed to load report
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {(error as Error).message}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    )
  }

  if (!report) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Inventory2OutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" fontWeight={600} gutterBottom>
          No data available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No inventory data found for the selected period.
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Toolbar disableGutters sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Advanced analytics and exportable reports
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <DateRangePicker
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={setDateRange}
          />
          <Button
            variant="contained"
            startIcon={<DownloadOutlinedIcon />}
            onClick={handleExportPdf}
          >
            Export PDF
          </Button>
        </Stack>
      </Toolbar>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Total Products"
            value={formatNumber(report.totalProducts)}
            icon={<Inventory2OutlinedIcon />}
            color="#4f46e5"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Low Stock Alerts"
            value={formatNumber(report.lowStockProducts)}
            icon={<AlertTriangleOutlinedIcon />}
            color="#d97706"
            trend={report.lowStockProducts > 0 ? 'up' : 'down'}
            trendLabel={report.lowStockProducts > 0 ? 'Needs attention' : 'All stocked'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Out of Stock"
            value={formatNumber(report.outOfStockProducts)}
            icon={<BlockOutlinedIcon />}
            color="#e11d48"
            trend={report.outOfStockProducts > 0 ? 'up' : 'down'}
            trendLabel={report.outOfStockProducts > 0 ? 'Critical' : 'None'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Inventory Value"
            value={formatCurrency(report.totalInventoryValue)}
            icon={<PaidOutlinedIcon />}
            color="#059669"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 0 }}>
        <Grid item xs={12} lg={6}>
          <ChartCard
            title="Products by Category"
            description="Distribution of products across categories"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.productsByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatNumber} />
                <YAxis type="category" dataKey="category" width={120} />
                <Tooltip
                  formatter={(value) => [formatNumber(Number(value ?? 0)), 'Products']}
                  labelFormatter={(label) => String(label ?? '')}
                />
                <Legend />
                <Bar
                  dataKey="count"
                  fill="#0ea5e9"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        <Grid item xs={12} lg={6}>
          <ChartCard
            title="Inventory Value by Category"
            description="Total inventory value per category"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.productsByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatCurrency} />
                <YAxis type="category" dataKey="category" width={120} />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Value']}
                  labelFormatter={(label) => String(label ?? '')}
                />
                <Legend />
                <Bar
                  dataKey="value"
                  fill="#10b981"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 0 }}>
        <Grid item xs={12} lg={6}>
          <ChartCard
            title="Stock Movements"
            description="Daily stock in vs out movements"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.stockMovements}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MM/dd')} />
                <YAxis tickFormatter={formatNumber} />
                <Tooltip
                  formatter={(value) => [formatNumber(Number(value ?? 0)), 'Units']}
                  labelFormatter={(label) => format(new Date(String(label)), 'PP')}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="in"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2 }}
                  name="Stock In"
                />
                <Line
                  type="monotone"
                  dataKey="out"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 2 }}
                  name="Stock Out"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        <Grid item xs={12} lg={6}>
          <ChartCard
            title="Top Products by Movement"
            description="Most moved products in the period"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={report.topProductsByMovement}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="movements"
                  nameKey="product"
                  label={(entry) => {
                    const item = entry as { product?: string; percent?: number }
                    return `${item.product ?? ''} ${Math.round((item.percent ?? 0) * 100)}%`
                  }}
                >
                  {report.topProductsByMovement.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatNumber(Number(value ?? 0)), 'Movements']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardHeader
          title="Supplier Performance"
          subheader="Products and total value per supplier"
        />
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <b>Supplier</b>
                  </TableCell>
                  <TableCell align="right">
                    <b>Products</b>
                  </TableCell>
                  <TableCell align="right">
                    <b>Total Value</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.supplierPerformance.map((supplier) => (
                  <TableRow key={supplier.supplier} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{supplier.supplier}</TableCell>
                    <TableCell align="right">{formatNumber(supplier.products)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatCurrency(supplier.totalValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {report.supplierPerformance.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No supplier data available for the selected period.
        </Alert>
      )}
    </Box>
  )
}