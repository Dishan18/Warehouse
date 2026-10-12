import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  useTheme,
  type TableCellProps,
} from '@mui/material'
import type { ReactNode } from 'react'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import Loading from './Loading'

export interface Column<T> {
  id: string
  label: string
  align?: TableCellProps['align']
  render: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  emptyMessage?: string
}

export default function DataTable<T>({
  columns,
  rows,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  emptyMessage = 'No records found',
}: DataTableProps<T>) {
  const theme = useTheme()
  const isLight = theme.palette.mode === 'light'

  if (loading) {
    return <Loading />
  }

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        borderRadius: '16px',
        border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.07)'}`,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        boxShadow: isLight
          ? '0 1px 3px rgba(0, 0, 0, 0.02), 0 4px 12px rgba(0, 0, 0, 0.02)'
          : '0 2px 8px rgba(0, 0, 0, 0.3)',
      }}
    >
      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align}
                  sx={{
                    py: 1.5,
                    px: 2,
                    fontSize: '0.725rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: isLight ? '#6e6e73' : '#a1a1a6',
                    bgcolor: isLight ? '#fbfbfd' : '#141416',
                    borderBottom: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.07)'}`,
                  }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'text.secondary',
                    }}
                  >
                    <InboxOutlinedIcon sx={{ fontSize: 40, mb: 1, opacity: 0.4 }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      {emptyMessage}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow
                  key={index}
                  hover
                  sx={{
                    transition: 'background-color 0.12s ease',
                    '&:last-child td': { borderBottom: 0 },
                  }}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.id}
                      align={col.align}
                      sx={{
                        py: 1.6,
                        px: 2,
                        fontSize: '0.84rem',
                        borderBottom: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)'}`,
                      }}
                    >
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box
        sx={{
          borderTop: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.06)'}`,
          bgcolor: isLight ? '#fbfbfd' : '#141416',
        }}
      >
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={pageSize}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPageChange={(_, newPage) => onPageChange(newPage)}
          onRowsPerPageChange={(e) => onPageSizeChange(Number(e.target.value))}
          sx={{
            color: 'text.secondary',
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: '0.785rem',
              fontWeight: 500,
            },
            '& .MuiTablePagination-select': {
              fontSize: '0.785rem',
            },
          }}
        />
      </Box>
    </Paper>
  )
}
