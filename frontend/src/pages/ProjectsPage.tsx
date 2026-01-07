import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import FolderOffIcon from '@mui/icons-material/FolderOff'
import { projectsApi } from '../api/client'
import { queryKeys } from '../api/queryKeys'
import { useStore } from '../store'
import { useSnackbar } from '../contexts'
import { ProjectCard, ProjectModal } from '../components/Projects'
import { FloatingActionButton, CardSkeleton, EmptyState } from '../components/Common'
import type { Project, ProjectCreate } from '../api/types'

export function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setCurrentProject = useStore((state) => state.setCurrentProject)
  const { showSnackbar } = useSnackbar()

  const { data: projects, isLoading, error } = useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: projectsApi.list,
  })

  const createMutation = useMutation({
    mutationFn: (data: ProjectCreate) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
      showSnackbar('Project created successfully', 'success')
    },
    onError: (error: Error) => {
      showSnackbar(error.message || 'Failed to create project', 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
      showSnackbar('Project deleted', 'success')
    },
    onError: (error: Error) => {
      showSnackbar(error.message || 'Failed to delete project', 'error')
    },
  })

  const handleOpenProject = (project: Project) => {
    setCurrentProject(project)
    navigate('/assets')
  }

  const handleDeleteProject = (project: Project) => {
    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
      deleteMutation.mutate(project.id)
    }
  }

  const handleCreateProject = (data: ProjectCreate) => {
    createMutation.mutate(data)
  }

  if (error) {
    return (
      <EmptyState
        icon={FolderOffIcon}
        title="Error loading projects"
        description={(error as Error).message}
      />
    )
  }

  return (
    <Box>
      <Typography variant="h4" component="h2" sx={{ mb: 3 }}>
        Projects
      </Typography>

      {isLoading ? (
        <Grid container spacing={2}>
          {[1, 2, 3].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <CardSkeleton variant="project" />
            </Grid>
          ))}
        </Grid>
      ) : projects && projects.length === 0 ? (
        <EmptyState
          icon={FolderOffIcon}
          title="No projects yet"
          description="Create your first project to start building consistent prompts for your image generation workflow."
          actionLabel="Create Project"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <Grid container spacing={2}>
          {projects?.map((project, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
              <Box
                sx={{
                  animation: 'fadeSlideIn 300ms ease forwards',
                  animationDelay: `${index * 50}ms`,
                  opacity: 0,
                }}
              >
                <ProjectCard
                  project={project}
                  onOpen={handleOpenProject}
                  onDelete={handleDeleteProject}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      <FloatingActionButton
        onClick={() => setIsModalOpen(true)}
        tooltip="New Project"
      />

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </Box>
  )
}
