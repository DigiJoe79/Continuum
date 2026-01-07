import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import Divider from '@mui/material/Divider'

const APP_VERSION = '0.1.0'
const REPO_URL = 'https://github.com/DigiJoe79/Continuum'

export function InfoPage() {
  return (
    <Box>
      <Typography variant="h4" component="h2" sx={{ mb: 3 }}>
        Info
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <Typography variant="h5" gutterBottom>
          Continuum
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Consistent Prompt Engine for Image Generators
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Made with care by{' '}
          <Link href="https://github.com/DigiJoe79" target="_blank" rel="noopener noreferrer">
            DigiJoe79
          </Link>
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Version
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
            {APP_VERSION}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Repository
          </Typography>
          <Link href={REPO_URL} target="_blank" rel="noopener noreferrer">
            {REPO_URL}
          </Link>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            License
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            MIT License

Copyright (c) 2024 Continuum

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}
