import { useState } from 'react'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { Modal } from '../Common/Modal'
import type { AssetType } from '../../api/types'

interface AssetModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; type: AssetType }) => void
  projectId?: number | null
}

// Project assets: only Character, Location, Object
const projectAssetTypes: { value: AssetType; label: string }[] = [
  { value: 'character', label: 'Character' },
  { value: 'location', label: 'Location' },
  { value: 'object', label: 'Object' },
]

export function AssetModal({
  isOpen,
  onClose,
  onSubmit,
}: AssetModalProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<AssetType>('character')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit({
        name: name.trim(),
        type,
      })
      resetForm()
    }
  }

  const resetForm = () => {
    setName('')
    setType('character')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Asset"
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
            Create & Edit
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
          placeholder="e.g., Anna, Forest, Vintage Camera"
          autoFocus
          size="small"
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth size="small">
          <InputLabel id="asset-type-label">Type</InputLabel>
          <Select
            labelId="asset-type-label"
            value={type}
            label="Type"
            onChange={(e) => setType(e.target.value as AssetType)}
          >
            {projectAssetTypes.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Modal>
  )
}
