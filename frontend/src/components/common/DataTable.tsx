import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Box,
  type TableCellProps,
} from '@mui/material'
import type { ReactNode } from 'react'
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
}: DataTableProps<T>) {
  if (loading) {
    return <Loading />
  }

  return (
    <Paper variant="outlined" sx={{ width: '100%' }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.id} align={col.align}>
                  <b>{col.label}</b>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={index} hover>
                  {columns.map((col) => (
                    <TableCell key={col.id} align={col.align}>
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={pageSize}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPageChange={(_, newPage) => onPageChange(newPage)}
          onRowsPerPageChange={(e) => onPageSizeChange(Number(e.target.value))}
        />
      </Box>
    </Paper>
  )
}
