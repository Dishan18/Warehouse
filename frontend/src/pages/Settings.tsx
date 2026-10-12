import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined'
import CurrencyExchangeOutlinedIcon from '@mui/icons-material/CurrencyExchangeOutlined'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined'
import { settingsApi } from '../api/settingsApi'
import Loading from '../components/common/Loading'
import type { SettingsRequest } from '../types'

const settingsSchema = z.object({
  warehouseName: z
    .string()
    .min(1, 'Warehouse name is required')
    .max(150, 'Warehouse name must be at most 150 characters'),
  currency: z.string().min(1, 'Currency is required'),
  lowStockThreshold: z.coerce
    .number()
    .int('Threshold must be an integer')
    .min(0, 'Threshold must be positive'),
  notificationsEnabled: z.boolean(),
})

type SettingsFormInput = z.input<typeof settingsSchema>
type SettingsFormValues = z.output<typeof settingsSchema>

const CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee (INR)' },
  { code: 'USD', name: 'US Dollar (USD)' },
  { code: 'EUR', name: 'Euro (EUR)' },
  { code: 'GBP', name: 'British Pound (GBP)' },
  { code: 'JPY', name: 'Japanese Yen (JPY)' },
  { code: 'CAD', name: 'Canadian Dollar (CAD)' },
  { code: 'AUD', name: 'Australian Dollar (AUD)' },
  { code: 'CHF', name: 'Swiss Franc (CHF)' },
  { code: 'MAD', name: 'Moroccan Dirham (MAD)' },
  { code: 'TND', name: 'Tunisian Dinar (TND)' },
]

export default function Settings() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormInput, unknown, SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      warehouseName: '',
      currency: 'USD',
      lowStockThreshold: 10,
      notificationsEnabled: true,
    },
  })

  useEffect(() => {
    let active = true
    settingsApi
      .get()
      .then((settings) => {
        if (!active) return
        reset({
          warehouseName: settings.warehouseName,
          currency: settings.currency,
          lowStockThreshold: settings.lowStockThreshold,
          notificationsEnabled: settings.notificationsEnabled,
        })
      })
      .catch(() => {
        if (active) setError('Failed to load settings')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [reset])

  const submit = async (values: SettingsFormValues) => {
    setError(null)
    setSuccess(null)
    const request: SettingsRequest = {
      warehouseName: values.warehouseName,
      currency: values.currency,
      lowStockThreshold: values.lowStockThreshold,
      notificationsEnabled: values.notificationsEnabled,
    }
    try {
      await settingsApi.update(request)
      setSuccess('Settings saved successfully')
    } catch {
      setError('Failed to save settings')
    }
  }

  if (loading) {
    return <Loading />
  }

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.02em', mb: 0.25 }}>
          System Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure facility identity, financial currency, and automated stock thresholds
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px' }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2.5, borderRadius: '12px' }}>
          {success}
        </Alert>
      )}

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
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <form onSubmit={handleSubmit(submit)} noValidate>
            <Stack spacing={3.5}>
              {/* Facility Identity */}
              <Box>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.1)',
                      color: 'primary.main',
                    }}
                  >
                    <WarehouseOutlinedIcon sx={{ fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Facility Profile
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Identity shown on generated PDF reports and export manifests
                    </Typography>
                  </Box>
                </Stack>
                <TextField
                  label="Warehouse Facility Name"
                  fullWidth
                  {...register('warehouseName')}
                  error={Boolean(errors.warehouseName)}
                  helperText={errors.warehouseName?.message}
                  InputProps={{ sx: { borderRadius: '10px' } }}
                />
              </Box>

              <Divider />

              {/* Localization and Currency */}
              <Box>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                      color: 'info.main',
                    }}
                  >
                    <CurrencyExchangeOutlinedIcon sx={{ fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Localization & Currency
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Currency symbol applied to inventory valuations, product prices, and reports
                    </Typography>
                  </Box>
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="currency"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Base Currency</InputLabel>
                          <Select
                            label="Base Currency"
                            value={field.value}
                            onChange={field.onChange}
                            error={Boolean(errors.currency)}
                            sx={{ borderRadius: '10px' }}
                          >
                            {CURRENCIES.map((curr) => (
                              <MenuItem key={curr.code} value={curr.code}>
                                {curr.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Thresholds and Alerts */}
              <Box>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(217, 119, 6, 0.1)',
                      color: 'warning.main',
                    }}
                  >
                    <TuneOutlinedIcon sx={{ fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Stock Thresholds
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Default baseline quantity before items trigger warning status
                    </Typography>
                  </Box>
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Global Low Stock Threshold"
                      type="number"
                      fullWidth
                      inputProps={{ min: 0 }}
                      {...register('lowStockThreshold')}
                      error={Boolean(errors.lowStockThreshold)}
                      helperText={
                        errors.lowStockThreshold?.message ||
                        'Products below this quantity trigger low stock status if no SKU threshold is set'
                      }
                      InputProps={{ sx: { borderRadius: '10px' } }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Notifications Toggle */}
              <Box>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(124, 58, 237, 0.1)',
                      color: 'secondary.main',
                    }}
                  >
                    <NotificationsActiveOutlinedIcon sx={{ fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Real-time Stock Alerts
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Live STOMP WebSocket broadcast delivery to active operators
                    </Typography>
                  </Box>
                </Stack>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    bgcolor: (theme) =>
                      theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                    border: '1px solid',
                    borderColor: (theme) =>
                      theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <Controller
                    name="notificationsEnabled"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value}
                            onChange={field.onChange}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              Broadcast Low-Stock Push Alerts
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Deliver instant notification cards to connected browsers when inventory decreases below threshold
                            </Typography>
                          </Box>
                        }
                        sx={{ m: 0, width: '100%', justifyContent: 'space-between' }}
                      />
                    )}
                  />
                </Box>
              </Box>

              <Box sx={{ pt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveRoundedIcon />}
                  disabled={isSubmitting}
                  sx={{
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: 'none',
                    px: 3.5,
                    py: 1,
                  }}
                >
                  Save Settings
                </Button>
              </Box>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}
