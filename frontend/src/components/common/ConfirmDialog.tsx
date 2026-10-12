import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  confirmText?: string
  severity?: 'error' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  confirmText,
  severity = 'error',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const label = confirmText || confirmLabel

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '20px',
            p: 1.5,
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, px: 2 }}>
        <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ px: 2, pb: 2 }}>
        <DialogContentText sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 2, pt: 1, gap: 1 }}>
        <Button onClick={onCancel} color="inherit" variant="outlined" sx={{ borderRadius: '10px' }}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color={severity === 'warning' ? 'warning' : 'error'}
          variant="contained"
          sx={{ borderRadius: '10px' }}
        >
          {label}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
