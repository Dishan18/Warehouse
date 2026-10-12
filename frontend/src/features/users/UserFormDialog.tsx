import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import type { CreateUserRequest, UpdateUserRequest, User, UserRole } from '../../types'

const ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'EMPLOYEE']

const nameSchema = z
  .string()
  .min(1, 'Required')
  .max(100, 'Must be at most 100 characters')

const createSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: z.string().email('Email must be valid').max(150),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  phoneNumber: z.string().max(20).optional().or(z.literal('')),
  role: z.enum(ROLES),
})

const editSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: z.string().email('Email must be valid').max(150),
  phoneNumber: z.string().max(20).optional().or(z.literal('')),
  role: z.enum(ROLES),
  enabled: z.boolean(),
})

type CreateInput = z.input<typeof createSchema>
type CreateValues = z.output<typeof createSchema>
type EditInput = z.input<typeof editSchema>
type EditValues = z.output<typeof editSchema>

interface UserFormDialogProps {
  open: boolean
  user: User | null
  error: string | null
  onClose: () => void
  onCreate: (data: CreateUserRequest) => Promise<void>
  onUpdate: (data: UpdateUserRequest) => Promise<void>
}

export default function UserFormDialog({
  open,
  user,
  error,
  onClose,
  onCreate,
  onUpdate,
}: UserFormDialogProps) {
  return user ? (
    <EditUserForm open={open} user={user} error={error} onClose={onClose} onUpdate={onUpdate} />
  ) : (
    <CreateUserForm open={open} error={error} onClose={onClose} onCreate={onCreate} />
  )
}

function CreateUserForm({
  open,
  error,
  onClose,
  onCreate,
}: {
  open: boolean
  error: string | null
  onClose: () => void
  onCreate: (data: CreateUserRequest) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateInput, unknown, CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phoneNumber: '',
      role: 'EMPLOYEE',
    },
  })

  useEffect(() => {
    if (open) reset()
  }, [open, reset])

  const submit = (values: CreateValues) => {
    onCreate({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      phoneNumber: values.phoneNumber || undefined,
      role: values.role,
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '18px',
          border: '1px solid',
          borderColor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 24px 48px -12px rgba(0, 0, 0, 0.6)'
              : '0 20px 40px -12px rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, pt: 2.5, px: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
          Create Team Member
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Register a new account and assign security credentials
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit(submit)} noValidate>
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Stack spacing={2.5}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: '10px' }}>
                {error}
              </Alert>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="First Name"
                placeholder="John"
                fullWidth
                autoFocus
                {...register('firstName')}
                error={Boolean(errors.firstName)}
                helperText={errors.firstName?.message}
                InputProps={{ sx: { borderRadius: '10px' } }}
              />
              <TextField
                label="Last Name"
                placeholder="Doe"
                fullWidth
                {...register('lastName')}
                error={Boolean(errors.lastName)}
                helperText={errors.lastName?.message}
                InputProps={{ sx: { borderRadius: '10px' } }}
              />
            </Stack>

            <TextField
              label="Email Address"
              type="email"
              placeholder="user@warehouse.com"
              fullWidth
              {...register('email')}
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              InputProps={{ sx: { borderRadius: '10px' } }}
            />

            <TextField
              label="Temporary Password"
              type="password"
              placeholder="Min. 6 characters"
              fullWidth
              {...register('password')}
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              InputProps={{ sx: { borderRadius: '10px' } }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Phone Number"
                placeholder="+1 (555) 012-3456"
                fullWidth
                {...register('phoneNumber')}
                error={Boolean(errors.phoneNumber)}
                helperText={errors.phoneNumber?.message}
                InputProps={{ sx: { borderRadius: '10px' } }}
              />
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Authorization Role</InputLabel>
                    <Select
                      label="Authorization Role"
                      value={field.value}
                      onChange={field.onChange}
                      sx={{ borderRadius: '10px' }}
                    >
                      <MenuItem value="ADMIN">Admin (Full System Access)</MenuItem>
                      <MenuItem value="MANAGER">Manager (Operations & Reports)</MenuItem>
                      <MenuItem value="EMPLOYEE">Employee (Movements & Inventory)</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
          <Button
            onClick={onClose}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              color: 'text.secondary',
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 'none',
              px: 3,
            }}
          >
            Create Account
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

function EditUserForm({
  open,
  user,
  error,
  onClose,
  onUpdate,
}: {
  open: boolean
  user: User
  error: string | null
  onClose: () => void
  onUpdate: (data: UpdateUserRequest) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditInput, unknown, EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      role: 'EMPLOYEE',
      enabled: true,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber ?? '',
        role: user.roles[0] ?? 'EMPLOYEE',
        enabled: user.enabled,
      })
    }
  }, [open, user, reset])

  const submit = (values: EditValues) => {
    onUpdate({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phoneNumber: values.phoneNumber || undefined,
      enabled: values.enabled,
      roles: [values.role],
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '18px',
          border: '1px solid',
          borderColor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 24px 48px -12px rgba(0, 0, 0, 0.6)'
              : '0 20px 40px -12px rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, pt: 2.5, px: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
          Edit Team Member
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Update account details, contact info, and permission tier
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit(submit)} noValidate>
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Stack spacing={2.5}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: '10px' }}>
                {error}
              </Alert>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="First Name"
                fullWidth
                {...register('firstName')}
                error={Boolean(errors.firstName)}
                helperText={errors.firstName?.message}
                InputProps={{ sx: { borderRadius: '10px' } }}
              />
              <TextField
                label="Last Name"
                fullWidth
                {...register('lastName')}
                error={Boolean(errors.lastName)}
                helperText={errors.lastName?.message}
                InputProps={{ sx: { borderRadius: '10px' } }}
              />
            </Stack>

            <TextField
              label="Email Address"
              type="email"
              fullWidth
              {...register('email')}
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              InputProps={{ sx: { borderRadius: '10px' } }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Phone Number"
                fullWidth
                {...register('phoneNumber')}
                error={Boolean(errors.phoneNumber)}
                helperText={errors.phoneNumber?.message}
                InputProps={{ sx: { borderRadius: '10px' } }}
              />
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Authorization Role</InputLabel>
                    <Select
                      label="Authorization Role"
                      value={field.value}
                      onChange={field.onChange}
                      sx={{ borderRadius: '10px' }}
                    >
                      <MenuItem value="ADMIN">Admin (Full System Access)</MenuItem>
                      <MenuItem value="MANAGER">Manager (Operations & Reports)</MenuItem>
                      <MenuItem value="EMPLOYEE">Employee (Movements & Inventory)</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
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
                name="enabled"
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
                          Account Enabled
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Disabled accounts cannot log in to the warehouse platform
                        </Typography>
                      </Box>
                    }
                    sx={{ m: 0, width: '100%', justifyContent: 'space-between' }}
                  />
                )}
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
          <Button
            onClick={onClose}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              color: 'text.secondary',
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 'none',
              px: 3,
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
