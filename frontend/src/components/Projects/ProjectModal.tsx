import { useState } from 'react'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import { Modal } from '../Common/Modal'

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; description?: string }) => void
}

export function ProjectModal({ isOpen, onClose, onSubmit }: ProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit({ name: name.trim(), description: description.trim() || undefined })
      setName('')
      setDescription('')
      onClose()
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Project"
      footer={
        <>
          <Button variant="outlined" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            Create
          </Button>
        </>
      }
    >
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter project name"
          autoFocus
          size="small"
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          multiline
          rows={3}
          size="small"
        />
      </Box>
    </Modal>
  )
}
