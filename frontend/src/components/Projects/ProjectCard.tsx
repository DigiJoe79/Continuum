import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import CategoryIcon from '@mui/icons-material/Category'
import MovieIcon from '@mui/icons-material/Movie'
import type { Project } from '../../api/types'

interface ProjectCardProps {
  project: Project
  onOpen: (project: Project) => void
  onDelete: (project: Project) => void
}

export function ProjectCard({ project, onOpen, onDelete }: ProjectCardProps) {
  return (
    <Card>
      <CardContent sx={{ pb: 1 }}>
        <Typography variant="h6" component="h3" gutterBottom noWrap>
          {project.name}
        </Typography>
        {project.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {project.description}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            icon={<CategoryIcon sx={{ fontSize: 16 }} />}
            label="Assets"
            size="small"
          />
          <Chip
            icon={<MovieIcon sx={{ fontSize: 16 }} />}
            label="Scenes"
            size="small"
          />
        </Box>
      </CardContent>
      <CardActions sx={{ borderTop: 1, borderColor: 'divider', px: 2, py: 1 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}
        >
          {new Date(project.created_at).toLocaleDateString()}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Open Project">
          <IconButton
            size="small"
            onClick={() => onOpen(project)}
            sx={{ color: 'primary.main' }}
          >
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            onClick={() => onDelete(project)}
            sx={{ color: 'error.main' }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  )
}
