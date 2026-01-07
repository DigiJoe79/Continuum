import { useState } from 'react'
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
import { scenesApi, assetsApi } from '../../api/client'
import { queryKeys } from '../../api/queryKeys'
import { useSnackbar } from '../../contexts'
import { AssetAutocomplete } from './AssetAutocomplete'
import type { Scene } from '../../api/types'

interface SceneEditorProps {
  scene: Scene
  onClose: () => void
  onUpdate?: () => void
}

export function SceneEditor({ scene, onClose, onUpdate }: SceneEditorProps) {
  const [name, setName] = useState(scene.name)
  const [actionText, setActionText] = useState(scene.action_text || '')
  const [shotTypeId, setShotTypeId] = useState<number | null>(scene.shot_type_id)
  const [styleId, setStyleId] = useState<number | null>(scene.style_id)
  const [lightingId, setLightingId] = useState<number | null>(scene.lighting_id)
  const [generatedPrompt, setGeneratedPrompt] = useState(scene.generated_prompt || '')
  const [copied, setCopied] = useState(false)
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()

  const { data: shotTypes } = useQuery({
    queryKey: queryKeys.assets.global('shot_type'),
    queryFn: () => assetsApi.list({ type: 'shot_type', is_global: true }),
  })

  const { data: styles } = useQuery({
    queryKey: queryKeys.assets.global('style'),
    queryFn: () => assetsApi.list({ type: 'style', is_global: true }),
  })

  const { data: lightingSetups } = useQuery({
    queryKey: queryKeys.assets.global('lighting_setup'),
    queryFn: () => assetsApi.list({ type: 'lighting_setup', is_global: true }),
  })

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; action_text: string; shot_type_id: number | null; style_id: number | null; lighting_id: number | null }) =>
      scenesApi.update(scene.id, {
        name: data.name,
        action_text: data.action_text,
        shot_type_id: data.shot_type_id ?? undefined,
        style_id: data.style_id ?? undefined,
        lighting_id: data.lighting_id ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scenes.all })
      onUpdate?.()
    },
    onError: (error: Error) => {
      showSnackbar(error.message || 'Failed to save scene', 'error')
    },
  })

  const generateMutation = useMutation({
    mutationFn: () => scenesApi.generate(scene.id, styleId ?? undefined),
    onSuccess: (updatedScene) => {
      setGeneratedPrompt(updatedScene.generated_prompt || '')
      queryClient.invalidateQueries({ queryKey: queryKeys.scenes.all })
      onUpdate?.()
    },
    onError: (error: Error) => {
      showSnackbar(error.message || 'Failed to generate prompt', 'error')
    },
  })

  const handleSave = () => {
    updateMutation.mutate({
      name,
      action_text: actionText,
      shot_type_id: shotTypeId,
      style_id: styleId,
      lighting_id: lightingId,
    })
  }

  const handleGenerate = () => {
    updateMutation.mutate(
      { name, action_text: actionText, shot_type_id: shotTypeId, style_id: styleId, lighting_id: lightingId },
      { onSuccess: () => generateMutation.mutate() }
    )
  }

  const handleCopy = async () => {
    if (generatedPrompt) {
      try {
        await navigator.clipboard.writeText(generatedPrompt)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h3">
          Edit Scene
        </Typography>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ flex: 1, minHeight: 0 }}>
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
          <Paper sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <TextField
              fullWidth
              label="Scene Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              size="small"
              sx={{ mb: 2 }}
            />

            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Action Text
            </Typography>
            <Box sx={{ flex: 1, minHeight: 100 }}>
              <AssetAutocomplete
                value={actionText}
                onChange={setActionText}
                projectId={scene.project_id}
                placeholder="Describe the action... Type [ to insert assets"
                rows={5}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, mb: 2 }}>
              Type [ to insert assets. Use [ASSET] or [ASSET:Variant] syntax.
            </Typography>

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Shot Type</InputLabel>
              <Select
                value={shotTypeId ?? ''}
                label="Shot Type"
                onChange={(e) => setShotTypeId(e.target.value ? Number(e.target.value) : null)}
              >
                <MenuItem value="">Select shot type...</MenuItem>
                {shotTypes?.map((shot) => (
                  <MenuItem key={shot.id} value={shot.id}>
                    {shot.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Lighting</InputLabel>
              <Select
                value={lightingId ?? ''}
                label="Lighting"
                onChange={(e) => setLightingId(e.target.value ? Number(e.target.value) : null)}
              >
                <MenuItem value="">No lighting</MenuItem>
                {lightingSetups?.map((lighting) => (
                  <MenuItem key={lighting.id} value={lighting.id}>
                    {lighting.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Style</InputLabel>
              <Select
                value={styleId ?? ''}
                label="Style"
                onChange={(e) => setStyleId(e.target.value ? Number(e.target.value) : null)}
              >
                <MenuItem value="">No style</MenuItem>
                {styles?.map((style) => (
                  <MenuItem key={style.id} value={style.id}>
                    {style.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="contained"
                onClick={handleGenerate}
                disabled={generateMutation.isPending || updateMutation.isPending}
              >
                {generateMutation.isPending ? 'Generating...' : 'Generate Prompt'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
          <Paper sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', mb: 2 }}>
              <TextField
                fullWidth
                label="Generated Prompt"
                value={generatedPrompt}
                InputProps={{ readOnly: true }}
                multiline
                placeholder="Prompt will appear here after generation..."
                size="small"
                sx={{
                  flex: 1,
                  '& .MuiInputBase-root': { height: '100%', alignItems: 'flex-start' },
                  '& .MuiInputBase-input': { height: '100% !important', overflow: 'auto !important' }
                }}
              />
              {generateMutation.isPending && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 7,
                    left: 1,
                    right: 1,
                    bottom: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(26, 26, 31, 0.9)',
                    borderRadius: 1,
                    zIndex: 1,
                  }}
                >
                  <CircularProgress size={48} />
                </Box>
              )}
            </Box>
            <Button
              variant="outlined"
              onClick={handleCopy}
              disabled={!generatedPrompt}
            >
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>
            {generateMutation.isError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Error generating prompt: {(generateMutation.error as Error).message}
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
