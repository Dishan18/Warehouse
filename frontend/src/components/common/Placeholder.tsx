import { Box, Typography } from '@mui/material'

interface PlaceholderProps {
  title: string
  description?: string
}

export default function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <Box sx={{ py: 6 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description ?? 'This module is coming soon.'}
      </Typography>
    </Box>
  )
}
