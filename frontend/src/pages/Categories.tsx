import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { categoryApi } from '../api/categoryApi'
import type { Category, CategoryRequest } from '../types'
import DataTable, { type Column } from '../components/common/DataTable'
import ConfirmDialog from '../components/common/ConfirmDialog'
import CategoryFormDialog from '../features/categories/CategoryFormDialog'
import { useDebounce } from '../hooks/useDebounce'

const COLUMNS: Column<Category>[] = [
  { id: 'name', label: 'Name', render: (row) => <b>{row.name}</b> },
  {
    id: 'description',
    label: 'Description',
    render: (row) => row.description ?? '—',
  },
  {
    id: 'active',
    label: 'Status',
    render: (row) => (
      <Chip
        label={row.active ? 'Active' : 'Inactive'}
        color={row.active ? 'success' : 'default'}
        size="small"
      />
    ),
  },
  {
    id: 'createdAt',
    label: 'Created',
    render: (row) => new Date(row.createdAt).toLocaleDateString(),
  },
]

export default function Categories() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [sortBy, setSortBy] = useState('name')
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc')

  const [rows, setRows] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)

  const [deleting, setDeleting] = useState<Category | null>(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await categoryApi.getAll({
        page,
        size,
        sortBy,
        direction,
        search: debouncedSearch || undefined,
      })
      setRows(res.content)
      setTotal(res.totalElements)
    } catch {
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [page, size, sortBy, direction, debouncedSearch])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const openCreate = () => {
    setEditing(null)
    setDialogError(null)
    setDialogOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditing(category)
    setDialogError(null)
    setDialogOpen(true)
  }

  const handleSubmit = async (data: CategoryRequest) => {
    try {
      if (editing) {
        await categoryApi.update(editing.id, data)
      } else {
        await categoryApi.create(data)
      }
      setDialogOpen(false)
      fetchCategories()
    } catch (err: unknown) {
      setDialogError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to save category',
      )
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await categoryApi.delete(deleting.id)
      setDeleting(null)
      fetchCategories()
    } catch {
      setError('Failed to delete category')
      setDeleting(null)
    }
  }

  const actionColumn: Column<Category> = {
    id: 'actions',
    label: 'Actions',
    align: 'right',
    render: (row) => (
      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
        <IconButton size="small" onClick={() => openEdit(row)}>
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" color="error" onClick={() => setDeleting(row)}>
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Stack>
    ),
  }

  return (
    <Box>
      <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h5" fontWeight={600}>
          Categories
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
        >
          New category
        </Button>
      </Toolbar>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ my: 2 }}
        alignItems="center"
      >
        <TextField
          label="Search"
          placeholder="Search by name"
          size="small"
          sx={{ minWidth: 260 }}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Sort by</InputLabel>
          <Select
            value={sortBy}
            label="Sort by"
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="createdAt">Created</MenuItem>
            <MenuItem value="active">Status</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Direction</InputLabel>
          <Select
            value={direction}
            label="Direction"
            onChange={(e) => setDirection(e.target.value as 'asc' | 'desc')}
          >
            <MenuItem value="asc">Ascending</MenuItem>
            <MenuItem value="desc">Descending</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DataTable
        columns={[...COLUMNS, actionColumn]}
        rows={rows}
        loading={loading}
        page={page}
        pageSize={size}
        total={total}
        onPageChange={(newPage) => {
          setPage(newPage)
          fetchCategories()
        }}
        onPageSizeChange={(newSize) => {
          setSize(newSize)
          setPage(0)
          fetchCategories()
        }}
      />

      <CategoryFormDialog
        open={dialogOpen}
        category={editing}
        error={dialogError}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete category"
        message={`Are you sure you want to delete "${deleting?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </Box>
  )
}
