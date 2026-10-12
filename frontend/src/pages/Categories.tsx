import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined'
import { categoryApi } from '../api/categoryApi'
import type { Category, CategoryRequest } from '../types'
import DataTable, { type Column } from '../components/common/DataTable'
import ConfirmDialog from '../components/common/ConfirmDialog'
import CategoryFormDialog from '../features/categories/CategoryFormDialog'
import { useDebounce } from '../hooks/useDebounce'

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

  const columns: Column<Category>[] = [
    {
      id: 'name',
      label: 'Category',
      render: (row) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.08)',
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            <CategoryOutlinedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {row.name}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      id: 'description',
      label: 'Description',
      render: (row) => (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
          {row.description || 'None'}
        </Typography>
      ),
    },
    {
      id: 'active',
      label: 'Status',
      render: (row) => (
        <Chip
          label={row.active ? 'Active' : 'Inactive'}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.72rem',
            borderRadius: '6px',
            bgcolor: row.active
              ? (theme) => (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.1)')
              : (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'),
            color: row.active ? 'primary.main' : 'text.secondary',
            border: 'none',
          }}
        />
      ),
    },
    {
      id: 'createdAt',
      label: 'Created',
      render: (row) => (
        <Typography variant="caption" color="text.secondary">
          {new Date(row.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Edit category" arrow>
            <IconButton
              size="small"
              onClick={() => openEdit(row)}
              sx={{
                borderRadius: '8px',
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                  color: 'primary.main',
                },
              }}
            >
              <EditOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete category" arrow>
            <IconButton
              size="small"
              onClick={() => setDeleting(row)}
              sx={{
                borderRadius: '8px',
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
                  color: 'error.main',
                },
              }}
            >
              <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ]

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.02em', mb: 0.25 }}>
            Categories
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage catalog classifications and product departments
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={openCreate}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            px: 2,
            py: 0.85,
            '&:hover': {
              boxShadow: 'none',
            },
          }}
        >
          New category
        </Button>
      </Stack>

      <Box
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: '14px',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
          <TextField
            placeholder="Search categories by name..."
            size="small"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            sx={{
              flex: 1,
              width: { xs: '100%', sm: 'auto' },
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: 19, color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')}>
                    <ClearRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />

          <FormControl size="small" sx={{ minWidth: 150, width: { xs: '100%', sm: 'auto' } }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sortBy}
              label="Sort by"
              onChange={(e) => setSortBy(e.target.value)}
              sx={{ borderRadius: '10px' }}
            >
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="createdAt">Date created</MenuItem>
              <MenuItem value="active">Status</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 130, width: { xs: '100%', sm: 'auto' } }}>
            <InputLabel>Direction</InputLabel>
            <Select
              value={direction}
              label="Direction"
              onChange={(e) => setDirection(e.target.value as 'asc' | 'desc')}
              sx={{ borderRadius: '10px' }}
            >
              <MenuItem value="asc">Ascending</MenuItem>
              <MenuItem value="desc">Descending</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px' }}>
          {error}
        </Alert>
      )}

      <DataTable
        columns={columns}
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
        title="Delete Category"
        message={`Are you sure you want to delete "${deleting?.name}"? Products linked to this category may be affected.`}
        confirmText="Delete"
        severity="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </Box>
  )
}
