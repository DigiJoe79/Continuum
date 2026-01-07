import { useState } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import type { Scene } from '../../api/types'

interface SceneCardProps {
  scene: Scene
  onEdit: (scene: Scene) => void
  onDelete: (scene: Scene) => void
}

export function SceneCard({ scene, onEdit, onDelete }: SceneCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (scene.generated_prompt) {
      try {
        await navigator.clipboard.writeText(scene.generated_prompt)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="h4" gutterBottom>
          {scene.name}
        </Typography>
        {scene.action_text && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Action:</strong> {scene.action_text}
          </Typography>
        )}
        {scene.generated_prompt ? (
          <Paper
            variant="outlined"
            sx={{ p: 1.5, bgcolor: 'background.default' }}
          >
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Generated Prompt:
            </Typography>
            <Typography variant="body2">
              {scene.generated_prompt.substring(0, 150)}...
            </Typography>
          </Paper>
        ) : (
          <Typography variant="body2" color="text.secondary" fontStyle="italic">
            No prompt generated yet
          </Typography>
        )}
      </CardContent>
      <CardActions sx={{ borderTop: 1, borderColor: 'divider', px: 2, py: 1 }}>
        <Button size="small" onClick={() => onEdit(scene)}>
          Edit
        </Button>
        <Button
          size="small"
          onClick={handleCopy}
          disabled={!scene.generated_prompt}
        >
          {copied ? 'Copied!' : 'Copy Prompt'}
        </Button>
        <Button size="small" color="error" onClick={() => onDelete(scene)}>
          Delete
        </Button>
      </CardActions>
    </Card>
  )
}
