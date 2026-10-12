import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Alert,
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New user</DialogTitle>
      <form onSubmit={handleSubmit(submit)} noValidate>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="First name"
                fullWidth
                {...register('firstName')}
                error={Boolean(errors.firstName)}
                helperText={errors.firstName?.message}
              />
              <TextField
                label="Last name"
                fullWidth
                {...register('lastName')}
                error={Boolean(errors.lastName)}
                helperText={errors.lastName?.message}
              />
            </Stack>
            <TextField
              label="Email"
              type="email"
              fullWidth
              {...register('email')}
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              {...register('password')}
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Phone"
                fullWidth
                {...register('phoneNumber')}
                error={Boolean(errors.phoneNumber)}
                helperText={errors.phoneNumber?.message}
              />
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Role</InputLabel>
                    <Select label="Role" value={field.value} onChange={field.onChange}>
                      {ROLES.map((role) => (
                        <MenuItem key={role} value={role}>
                          {role}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Create
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit user</DialogTitle>
      <form onSubmit={handleSubmit(submit)} noValidate>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="First name"
                fullWidth
                {...register('firstName')}
                error={Boolean(errors.firstName)}
                helperText={errors.firstName?.message}
              />
              <TextField
                label="Last name"
                fullWidth
                {...register('lastName')}
                error={Boolean(errors.lastName)}
                helperText={errors.lastName?.message}
              />
            </Stack>
            <TextField
              label="Email"
              type="email"
              fullWidth
              {...register('email')}
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Phone"
                fullWidth
                {...register('phoneNumber')}
                error={Boolean(errors.phoneNumber)}
                helperText={errors.phoneNumber?.message}
              />
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Role</InputLabel>
                    <Select label="Role" value={field.value} onChange={field.onChange}>
                      {ROLES.map((role) => (
                        <MenuItem key={role} value={role}>
                          {role}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Stack>
            <Controller
              name="enabled"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={field.onChange} />}
                  label="Enabled"
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
