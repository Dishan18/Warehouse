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
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
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

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'MAD', 'TND', 'CHF']

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
      setSuccess('Settings saved')
    } catch {
      setError('Failed to save settings')
    }
  }

  if (loading) {
    return <Loading />
  }

  return (
    <Box>
      <Toolbar disableGutters>
        <Typography variant="h5" fontWeight={600}>
          Settings
        </Typography>
      </Toolbar>

      <Card variant="outlined" sx={{ maxWidth: 720 }}>
        <CardContent>
          <form onSubmit={handleSubmit(submit)} noValidate>
            <Stack spacing={2.5}>
              {error && <Alert severity="error">{error}</Alert>}
              {success && <Alert severity="success">{success}</Alert>}

              <TextField
                label="Warehouse name"
                fullWidth
                {...register('warehouseName')}
                error={Boolean(errors.warehouseName)}
                helperText={errors.warehouseName?.message}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="currency"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Currency</InputLabel>
                        <Select
                          label="Currency"
                          value={field.value}
                          onChange={field.onChange}
                          error={Boolean(errors.currency)}
                        >
                          {CURRENCIES.map((code) => (
                            <MenuItem key={code} value={code}>
                              {code}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Low stock threshold"
                    type="number"
                    fullWidth
                    inputProps={{ min: 0 }}
                    {...register('lowStockThreshold')}
                    error={Boolean(errors.lowStockThreshold)}
                    helperText={
                      errors.lowStockThreshold?.message ??
                      'Products at or below this quantity are flagged as low stock alerts'
                    }
                  />
                </Grid>
              </Grid>

              <Controller
                name="notificationsEnabled"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={field.onChange} />}
                    label="Enable low stock notifications"
                  />
                )}
              />

              <Box>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveOutlinedIcon />}
                  disabled={isSubmitting}
                >
                  Save settings
                </Button>
              </Box>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}
