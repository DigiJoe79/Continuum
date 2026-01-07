import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Skeleton from '@mui/material/Skeleton'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { assetsApi } from '../api/client'
import { queryKeys } from '../api/queryKeys'
import { useSnackbar } from '../contexts'
import { Modal } from '../components/Common'
import { extractCorePrompt, wrapCorePrompt } from '../utils/promptUtils'
import type { Asset, AssetCreate, AssetType } from '../api/types'

export function GlobalsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<AssetType>('style')
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [newName, setNewName] = useState('')
  const [newPrompt, setNewPrompt] = useState('')
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()

  const { data: shotTypes, isLoading: loadingShotTypes } = useQuery({
    queryKey: queryKeys.assets.global('shot_type'),
    queryFn: () => assetsApi.list({ type: 'shot_type', is_global: true }),
  })

  const { data: styles, isLoading: loadingStyles } = useQuery({
    queryKey: queryKeys.assets.global('style'),
    queryFn: () => assetsApi.list({ type: 'style', is_global: true }),
  })

  const { data: lightingSetups, isLoading: loadingLightingSetups } = useQuery({
    queryKey: queryKeys.assets.global('lighting_setup'),
    queryFn: () => assetsApi.list({ type: 'lighting_setup', is_global: true }),
  })

  const createMutation = useMutation({
    mutationFn: (data: AssetCreate) => assetsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
      resetForm()
      showSnackbar('Global asset created successfully', 'success')
    },
    onError: (error: Error) => {
      showSnackbar(error.message || 'Failed to create global asset', 'error')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AssetCreate> }) =>
      assetsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
      resetForm()
      showSnackbar('Global asset updated successfully', 'success')
    },
    onError: (error: Error) => {
      showSnackbar(error.message || 'Failed to update global asset', 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => assetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
      showSnackbar('Global asset deleted', 'success')
    },
    onError: (error: Error) => {
      showSnackbar(error.message || 'Failed to delete global asset', 'error')
    },
  })

  const resetForm = () => {
    setIsModalOpen(false)
    setEditingAsset(null)
    setNewName('')
    setNewPrompt('')
  }

  const handleOpenModal = (type: AssetType, asset?: Asset) => {
    setModalType(type)
    if (asset) {
      setEditingAsset(asset)
      setNewName(asset.name)
      // Extract core value from JSON for editing
      setNewPrompt(extractCorePrompt(asset.base_prompt))
    } else {
      setEditingAsset(null)
      setNewName('')
      setNewPrompt('')
    }
    setIsModalOpen(true)
  }

  const getTypeLabel = (type: AssetType): string => {
    const labels: Record<AssetType, string> = {
      character: 'Character',
      location: 'Location',
      object: 'Object',
      style: 'Style',
      shot_type: 'Shot Type',
      lighting_setup: 'Lighting Setup',
    }
    return labels[type]
  }

  const getTypePlaceholder = (type: AssetType): { name: string; prompt: string } => {
    const placeholders: Partial<Record<AssetType, { name: string; prompt: string }>> = {
      style: {
        name: 'e.g., Cinematic',
        prompt: 'e.g., cinematic film still, dramatic lighting, shallow depth of field',
      },
      shot_type: {
        name: 'e.g., Close-up',
        prompt: 'e.g., extreme close-up shot, detailed face filling frame',
      },
      lighting_setup: {
        name: 'e.g., Golden Hour',
        prompt: 'e.g., warm golden hour sunlight, soft shadows, orange-tinted rim light',
      },
    }
    return placeholders[type] || { name: '', prompt: '' }
  }

  const handleSubmit = () => {
    if (!newName.trim()) return

    // Wrap prompt in JSON format for storage
    const wrappedPrompt = newPrompt.trim() ? wrapCorePrompt(newPrompt) : ''

    if (editingAsset) {
      updateMutation.mutate({
        id: editingAsset.id,
        data: {
          name: newName.trim(),
          base_prompt: wrappedPrompt,
        },
      })
    } else {
      createMutation.mutate({
        name: newName.trim(),
        type: modalType,
        base_prompt: wrappedPrompt,
        is_global: true,
      })
    }
  }

  const handleDelete = (asset: Asset) => {
    if (confirm(`Are you sure you want to delete "${asset.name}"?`)) {
      deleteMutation.mutate(asset.id)
    }
  }

  const isLoading = loadingShotTypes || loadingStyles || loadingLightingSetups

  const renderSkeleton = () => (
    <Grid container spacing={2}>
      {[1, 2, 3, 4].map((i) => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
          <Card sx={{ '&:hover': { transform: 'none' } }}>
            <CardContent>
              <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="100%" height={20} />
              <Skeleton variant="text" width="80%" height={20} />
            </CardContent>
            <CardActions sx={{ borderTop: 1, borderColor: 'divider', px: 2 }}>
              <Skeleton variant="rounded" width={50} height={28} />
              <Skeleton variant="rounded" width={50} height={28} />
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  )

  const renderSection = (
    title: string,
    type: AssetType,
    items: Asset[] | undefined,
    helpText: string,
    loading: boolean
  ) => (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">{title}</Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal(type)}
        >
          Add {getTypeLabel(type)}
        </Button>
      </Box>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
        {helpText}
      </Typography>

      {loading ? (
        renderSkeleton()
      ) : items && items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" fontStyle="italic">
          No {title.toLowerCase()} defined yet.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {items?.map((item, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.id}>
              <Box
                sx={{
                  animation: 'fadeSlideIn 300ms ease forwards',
                  animationDelay: `${index * 50}ms`,
                  opacity: 0,
                }}
              >
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom noWrap>
                      {item.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {extractCorePrompt(item.base_prompt) || 'No prompt defined'}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ borderTop: 1, borderColor: 'divider', px: 2, justifyContent: 'flex-end' }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenModal(type, item)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(item)}
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4" component="h2" sx={{ mb: 3 }}>Global Assets</Typography>
        {renderSection('Shot Types', 'shot_type', undefined, 'Shot types define camera angles and framing.', true)}
        {renderSection('Styles', 'style', undefined, 'Styles define visual aesthetics.', true)}
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" component="h2" sx={{ mb: 3 }}>Global Assets</Typography>

      {renderSection('Shot Types', 'shot_type', shotTypes, 'Shot types define camera angles and framing (e.g., close-up, wide shot).', loadingShotTypes)}
      {renderSection('Lighting Setups', 'lighting_setup', lightingSetups, 'Lighting setups define light sources, direction, and mood (e.g., golden hour, studio lighting).', loadingLightingSetups)}
      {renderSection('Styles', 'style', styles, 'Styles define visual aesthetics (e.g., cinematic, anime, photorealistic).', loadingStyles)}

      <Modal
        isOpen={isModalOpen}
        onClose={resetForm}
        title={`${editingAsset ? 'Edit' : 'New'} ${getTypeLabel(modalType)}`}
        footer={
          <>
            <Button variant="outlined" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!newName.trim() || createMutation.isPending || updateMutation.isPending}
            >
              {editingAsset ? 'Save' : 'Create'}
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Name"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={getTypePlaceholder(modalType).name}
            autoFocus
            size="small"
          />
          <TextField
            fullWidth
            label="Prompt"
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            placeholder={getTypePlaceholder(modalType).prompt}
            multiline
            rows={4}
            size="small"
          />
        </Box>
      </Modal>
    </Box>
  )
}
