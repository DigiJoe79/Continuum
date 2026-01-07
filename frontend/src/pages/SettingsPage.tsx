import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import RefreshIcon from '@mui/icons-material/Refresh'
import IconButton from '@mui/material/IconButton'
import { settingsApi, llmApi } from '../api/client'
import type { LLMRequestLog } from '../api/client'
import { queryKeys } from '../api/queryKeys'
import { useSnackbar } from '../contexts'
import type { Settings } from '../api/types'

export function SettingsPage() {
  const [formData, setFormData] = useState<Partial<Settings>>({
    llm_provider: 'openrouter',
    llm_api_key: '',
    llm_model: 'openai/gpt-4o-mini',
    llm_base_url: 'https://openrouter.ai/api/v1',
  })
  const [showSuccess, setShowSuccess] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()

  const { data: settings, isLoading, error } = useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: settingsApi.get,
  })

  const { data: logsData, refetch: refetchLogs } = useQuery({
    queryKey: queryKeys.llm.logs(),
    queryFn: llmApi.getLogs,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  })

  useEffect(() => {
    if (settings) {
      setFormData(settings)
    }
  }, [settings])

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Settings>) => settingsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all })
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    },
    onError: (error: Error) => {
      showSnackbar(error.message || 'Failed to save settings', 'error')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const handleInputChange = (field: keyof Settings, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    try {
      const result = await llmApi.testConnection()
      if (result.success) {
        showSnackbar('LLM connection successful!', 'success')
      } else {
        showSnackbar(result.message, 'error')
      }
    } catch (err) {
      showSnackbar((err as Error).message, 'error')
    } finally {
      setIsTesting(false)
    }
  }

  const providerPresets: Record<string, { base_url: string; model: string }> = {
    openrouter: {
      base_url: 'https://openrouter.ai/api/v1',
      model: 'openai/gpt-4o-mini',
    },
    lmstudio: {
      base_url: 'http://host.docker.internal:1234/v1',
      model: 'local-model',
    },
    openai: {
      base_url: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
    },
  }

  const handleProviderChange = (provider: string) => {
    const preset = providerPresets[provider]
    if (preset) {
      setFormData((prev) => ({
        ...prev,
        llm_provider: provider,
        llm_base_url: preset.base_url,
        llm_model: preset.model,
      }))
    } else {
      setFormData((prev) => ({ ...prev, llm_provider: provider }))
    }
  }

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4" component="h2" sx={{ mb: 3 }}>Settings</Typography>
        <Typography>Loading settings...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" component="h2" sx={{ mb: 3 }}>Settings</Typography>
        <Alert severity="error">Error loading settings: {(error as Error).message}</Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" component="h2" sx={{ mb: 3 }}>Settings</Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>LLM Provider Configuration</Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>
          Configure the LLM provider for asset enrichment. Continuum uses an OpenAI-compatible API.
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Provider</InputLabel>
                <Select
                  value={formData.llm_provider || ''}
                  label="Provider"
                  onChange={(e) => handleProviderChange(e.target.value)}
                >
                  <MenuItem value="openrouter">OpenRouter</MenuItem>
                  <MenuItem value="openai">OpenAI</MenuItem>
                  <MenuItem value="lmstudio">LM Studio (Local)</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Base URL"
                value={formData.llm_base_url || ''}
                onChange={(e) => handleInputChange('llm_base_url', e.target.value)}
                placeholder="https://openrouter.ai/api/v1"
                size="small"
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="API Key"
                type="password"
                value={formData.llm_api_key || ''}
                onChange={(e) => handleInputChange('llm_api_key', e.target.value)}
                placeholder="Enter your API key"
                size="small"
                helperText={
                  formData.llm_provider === 'lmstudio'
                    ? 'LM Studio typically does not require an API key.'
                    : 'Your API key is stored locally and never shared. Protect your data/ directory.'
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Model"
                value={formData.llm_model || ''}
                onChange={(e) => handleInputChange('llm_model', e.target.value)}
                placeholder="openai/gpt-4o-mini"
                size="small"
                helperText={
                  formData.llm_provider === 'openrouter'
                    ? 'OpenRouter models use format: provider/model-name'
                    : undefined
                }
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleTestConnection}
              disabled={isTesting}
              startIcon={isTesting ? <CircularProgress size={16} /> : null}
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </Button>
          </Box>

          {showSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Settings saved successfully!
            </Alert>
          )}

          {updateMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error saving settings: {(updateMutation.error as Error).message}
            </Alert>
          )}
        </Box>
      </Paper>

      {/* LLM Request Logs */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">LLM Request History</Typography>
          <IconButton size="small" onClick={() => refetchLogs()} title="Refresh">
            <RefreshIcon />
          </IconButton>
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          Last 10 requests (current session only, not persisted)
        </Typography>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Provider / Model</TableCell>
                <TableCell align="right">Tokens</TableCell>
                <TableCell align="right">Speed</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logsData?.logs && logsData.logs.length > 0 ? (
                logsData.logs.map((log: LLMRequestLog, index: number) => {
                  const time = new Date(log.timestamp).toLocaleTimeString()
                  const tokensPerSec = log.generation_time_ms > 0
                    ? ((log.output_tokens / log.generation_time_ms) * 1000).toFixed(1)
                    : '0'
                  return (
                    <TableRow key={index}>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {time}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {log.provider}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          {log.model}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {log.input_tokens.toLocaleString()} → {log.output_tokens.toLocaleString()}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {tokensPerSec} t/s
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={log.status === 'success' ? 'OK' : 'Error'}
                          size="small"
                          color={log.status === 'success' ? 'success' : 'error'}
                          sx={{ minWidth: 50 }}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No requests yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}
