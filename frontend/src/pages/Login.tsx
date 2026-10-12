import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import { useAuth } from '../context/AuthContext'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const isLight = theme.palette.mode === 'light'
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setError(null)
    try {
      await login(values)
      navigate('/dashboard', { replace: true })
    } catch {
      setError('Invalid email or password')
    }
  }

  const fillDemo = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true })
    setValue('password', pass, { shouldValidate: true })
    setError(null)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2.5,
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 420,
          p: { xs: 3.5, sm: 4.5 },
          borderRadius: '24px',
          border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)'}`,
          boxShadow: isLight
            ? '0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 20px 35px -5px rgba(0, 0, 0, 0.05)'
            : '0 10px 30px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Brand Icon & Heading */}
        <Box sx={{ textAlign: 'center', mb: 3.5 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '14px',
              bgcolor: 'primary.main',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.25rem',
              letterSpacing: '-0.02em',
              mb: 1.75,
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
            }}
          >
            W
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: isLight ? '#1d1d1f' : '#f5f5f7',
            }}
          >
            SmartWarehouse
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mt: 0.5,
              fontSize: '0.84rem',
            }}
          >
            Sign in to access inventory and operations
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2.5,
              borderRadius: '12px',
              fontSize: '0.84rem',
              '& .MuiAlert-icon': { alignItems: 'center' },
            }}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2.25}>
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              autoComplete="email"
              autoFocus
              {...register('email')}
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MailOutlineIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              autoComplete="current-password"
              {...register('password')}
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      aria-label="toggle password visibility"
                      sx={{ color: 'text.secondary' }}
                    >
                      {showPassword ? (
                        <VisibilityOffOutlinedIcon fontSize="small" />
                      ) : (
                        <VisibilityOutlinedIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isSubmitting}
              sx={{
                py: 1.25,
                mt: 1,
                fontSize: '0.9375rem',
                fontWeight: 600,
                borderRadius: '12px',
              }}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </Stack>
        </form>

        {/* Demo Fast Fill Helpers */}
        <Box sx={{ mt: 3.5, pt: 2.5, borderTop: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)'}` }}>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              color: 'text.secondary',
              mb: 1.25,
              fontWeight: 500,
              fontSize: '0.725rem',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            Quick Demo Sign-In
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
            <Chip
              label="Admin"
              size="small"
              onClick={() => fillDemo('admin@warehouse.com', 'Admin@123')}
              sx={{
                cursor: 'pointer',
                borderRadius: '8px',
                fontWeight: 600,
                bgcolor: isLight ? 'rgba(5, 150, 105, 0.08)' : 'rgba(52, 211, 153, 0.15)',
                color: isLight ? '#065f46' : '#6ee7b7',
                '&:hover': {
                  bgcolor: isLight ? 'rgba(5, 150, 105, 0.15)' : 'rgba(52, 211, 153, 0.25)',
                },
              }}
            />
            <Chip
              label="Manager"
              size="small"
              onClick={() => fillDemo('manager@warehouse.com', 'Manager@123')}
              sx={{
                cursor: 'pointer',
                borderRadius: '8px',
                fontWeight: 600,
                bgcolor: isLight ? 'rgba(2, 132, 199, 0.08)' : 'rgba(56, 189, 248, 0.15)',
                color: isLight ? '#0369a1' : '#7dd3fc',
                '&:hover': {
                  bgcolor: isLight ? 'rgba(2, 132, 199, 0.15)' : 'rgba(56, 189, 248, 0.25)',
                },
              }}
            />
            <Chip
              label="Employee"
              size="small"
              onClick={() => fillDemo('employee@warehouse.com', 'Employee@123')}
              sx={{
                cursor: 'pointer',
                borderRadius: '8px',
                fontWeight: 600,
                bgcolor: isLight ? 'rgba(100, 116, 139, 0.08)' : 'rgba(148, 163, 184, 0.15)',
                color: isLight ? '#334155' : '#cbd5e1',
                '&:hover': {
                  bgcolor: isLight ? 'rgba(100, 116, 139, 0.15)' : 'rgba(148, 163, 184, 0.25)',
                },
              }}
            />
          </Stack>
        </Box>
      </Card>
    </Box>
  )
}
