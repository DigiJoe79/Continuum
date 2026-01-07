import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import MovieIcon from '@mui/icons-material/Movie'
import FolderOffIcon from '@mui/icons-material/FolderOff'
import { scenesApi } from '../api/client'
import { queryKeys } from '../api/queryKeys'
import { useStore } from '../store'
import { useSnackbar } from '../contexts'
import { SceneCard, SceneEditor } from '../components/Scenes'
import { Modal, FloatingActionButton, CardSkeleton, EmptyState } from '../components/Common'
import type { Scene, SceneCreate } from '../api/types'

export function ScenesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingScene, setEditingScene] = useState<Scene | null>(null)
  const [newSceneName, setNewSceneName] = useState('')
  const queryClient = useQueryClient()
  const currentProject = useStore((state) => state.currentProject)
  const { showSnackbar } = useSnackbar()

  const { data: scenes, isLoading, error } = useQuery({
    queryKey: queryKeys.scenes.list(currentProject?.id),
    queryFn: () =>
      currentProject
        ? scenesApi.list(currentProject.id)
        : Promise.resolve([]),
    enabled: !!currentProject,
  })

  const createMutation = useMutation({
    mutationFn: (data: SceneCreate) => scenesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scenes.all })
      setNewSceneName('')
      setIsModalOpen(false)
      showSnackbar('Scene created successfully', 'success')
    },
    onError: (error: Error) => {
      showSnackbar(error.message || 'Failed to create scene', 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => scenesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scenes.all })
      showSnackbar('Scene deleted', 'success')
    },
    onError: (error: Error) => {
      showSnackbar(error.message || 'Failed to delete scene', 'error')
    },
  })

  const handleCreateScene = () => {
    if (!currentProject || !newSceneName.trim()) return
    createMutation.mutate({
      name: newSceneName.trim(),
      project_id: currentProject.id,
    })
  }

  const handleDeleteScene = (scene: Scene) => {
    if (confirm(`Are you sure you want to delete "${scene.name}"?`)) {
      deleteMutation.mutate(scene.id)
    }
  }

  const handleEditScene = (scene: Scene) => {
    setEditingScene(scene)
  }

  if (!currentProject) {
    return (
      <Box>
        <Typography variant="h4" component="h2" sx={{ mb: 3 }}>
          Scenes
        </Typography>
        <EmptyState
          icon={FolderOffIcon}
          title="No project selected"
          description="Please select a project first from the Projects page."
        />
      </Box>
    )
  }

  if (editingScene) {
    return (
      <SceneEditor
        scene={editingScene}
        onClose={() => setEditingScene(null)}
        onUpdate={() => queryClient.invalidateQueries({ queryKey: queryKeys.scenes.all })}
      />
    )
  }

  return (
    <Box>
      <Typography variant="h4" component="h2" sx={{ mb: 3 }}>
        Scenes
      </Typography>

      {isLoading ? (
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid size={{ xs: 12, md: 6 }} key={i}>
              <CardSkeleton variant="scene" />
            </Grid>
          ))}
        </Grid>
      ) : error ? (
        <EmptyState
          icon={MovieIcon}
          title="Error loading scenes"
          description={(error as Error).message}
        />
      ) : scenes && scenes.length === 0 ? (
        <EmptyState
          icon={MovieIcon}
          title="No scenes yet"
          description="Create scenes to compose your assets into complete prompts."
          actionLabel="Create Scene"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <Grid container spacing={2}>
          {scenes?.map((scene, index) => (
            <Grid size={{ xs: 12, md: 6 }} key={scene.id}>
              <Box
                sx={{
                  animation: 'fadeSlideIn 300ms ease forwards',
                  animationDelay: `${index * 50}ms`,
                  opacity: 0,
                }}
              >
                <SceneCard
                  scene={scene}
                  onEdit={handleEditScene}
                  onDelete={handleDeleteScene}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      <FloatingActionButton
        onClick={() => setIsModalOpen(true)}
        tooltip="New Scene"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setNewSceneName('')
        }}
        title="New Scene"
        footer={
          <>
            <Button
              variant="outlined"
              onClick={() => {
                setIsModalOpen(false)
                setNewSceneName('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateScene}
              disabled={!newSceneName.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </>
        }
      >
        <TextField
          fullWidth
          label="Scene Name"
          required
          value={newSceneName}
          onChange={(e) => setNewSceneName(e.target.value)}
          placeholder="e.g., Opening Shot, Chase Scene"
          autoFocus
          size="small"
        />
      </Modal>
    </Box>
  )
}
