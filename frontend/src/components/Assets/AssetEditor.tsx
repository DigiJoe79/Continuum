import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import TextField from '@mui/material/TextField'
import Collapse from '@mui/material/Collapse'
import Snackbar from '@mui/material/Snackbar'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import { assetsApi, llmApi, variantsApi } from '../../api/client'
import { queryKeys } from '../../api/queryKeys'
import { useSnackbar } from '../../contexts'
import { PromptPanel } from './PromptPanel'
import { Modal } from '../Common/Modal'
import type { Asset, ChatMessage, Variant, LayeredPrompt } from '../../api/types'

interface AssetEditorProps {
  asset: Asset
  onClose: () => void
  onUpdate?: () => void
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      sx={{ flex: 1, display: value === index ? 'flex' : 'none', flexDirection: 'column', minHeight: 0 }}
    >
      {value === index && children}
    </Box>
  )
}

export function AssetEditor({ asset, onClose, onUpdate }: AssetEditorProps) {
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()

  // Tab state
  const [activeTab, setActiveTab] = useState(0)
  const [variants, setVariants] = useState<Variant[]>(asset.variants || [])

  // Base prompt state
  const [basePrompt, setBasePrompt] = useState(asset.base_prompt || '')
  const [basePromptOriginal, setBasePromptOriginal] = useState(asset.base_prompt || '')
  const [baseChatMessages, setBaseChatMessages] = useState<ChatMessage[]>([])
  const [baseChatInput, setBaseChatInput] = useState('')
  const [isEnrichingBase, setIsEnrichingBase] = useState(false)

  // Variant prompt states (Map by variant ID)
  const [variantPrompts, setVariantPrompts] = useState<Map<number, string>>(() => {
    const map = new Map<number, string>()
    asset.variants?.forEach((v) => map.set(v.id, v.delta_prompt))
    return map
  })
  const [variantPromptsOriginal, setVariantPromptsOriginal] = useState<Map<number, string>>(() => {
    const map = new Map<number, string>()
    asset.variants?.forEach((v) => map.set(v.id, v.delta_prompt))
    return map
  })
  const [variantChatMessages, setVariantChatMessages] = useState<Map<number, ChatMessage[]>>(
    new Map()
  )
  const [variantChatInputs, setVariantChatInputs] = useState<Map<number, string>>(new Map())
  const [enrichingVariants, setEnrichingVariants] = useState<Set<number>>(new Set())

  // New variant creation
  const [isCreating, setIsCreating] = useState(false)
  const [newVariantName, setNewVariantName] = useState('')

  // Undo delete
  const [deletedVariant, setDeletedVariant] = useState<Variant | null>(null)
  const [showUndoSnackbar, setShowUndoSnackbar] = useState(false)

  // Outfit suggestion
  const [outfitSuggestion, setOutfitSuggestion] = useState<LayeredPrompt | null>(null)
  const [showOutfitDialog, setShowOutfitDialog] = useState(false)

  // Mutations
  const updateAssetMutation = useMutation({
    mutationFn: (data: { base_prompt: string }) => assetsApi.update(asset.id, data),
    onSuccess: () => {
      setBasePromptOriginal(basePrompt)
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
      onUpdate?.()
    },
    onError: (error: Error) => {
      showSnackbar(error.message || 'Failed to save asset', 'error')
    },
  })

  const updateVariantMutation = useMutation({
    mutationFn: ({ id, delta_prompt }: { id: number; delta_prompt: string }) =>
      variantsApi.update(id, { delta_prompt }),
    onSuccess: (_, variables) => {
      setVariantPromptsOriginal((prev) => {
        const next = new Map(prev)
        next.set(variables.id, variables.delta_prompt)
        return next
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
    },
    onError: (error: Error) => {
      showSnackbar(error.message || 'Failed to save variant', 'error')
    },
  })

  const createVariantMutation = useMutation({
    mutationFn: (data: { name: string; delta_prompt: string; asset_id: number }) =>
      variantsApi.create(data),
    onSuccess: (newVariant) => {
      setVariants((prev) => [...prev, newVariant])
      setVariantPrompts((prev) => {
        const next = new Map(prev)
        next.set(newVariant.id, newVariant.delta_prompt)
        return next
      })
      setVariantPromptsOriginal((prev) => {
        const next = new Map(prev)
        next.set(newVariant.id, newVariant.delta_prompt)
        return next
      })
      setNewVariantName('')
      setIsCreating(false)
      // Switch to new variant tab
      setActiveTab(variants.length + 1)
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
    },
    onError: (error: Error) => {
      showSnackbar(error.message || 'Failed to create variant', 'error')
    },
  })

  const deleteVariantMutation = useMutation({
    mutationFn: (id: number) => variantsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
    },
    onError: (error: Error) => {
      showSnackbar(error.message || 'Failed to delete variant', 'error')
    },
  })

  // Handlers
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleSaveBase = () => {
    updateAssetMutation.mutate({ base_prompt: basePrompt })
  }

  const handleSaveVariant = (variantId: number) => {
    const delta_prompt = variantPrompts.get(variantId) || ''
    updateVariantMutation.mutate({ id: variantId, delta_prompt })
  }

  const handleEnrichBase = useCallback(async () => {
    if (!baseChatInput.trim()) return

    const newUserMessage: ChatMessage = { role: 'user', content: baseChatInput.trim() }
    const updatedMessages = [...baseChatMessages, newUserMessage]
    setBaseChatMessages(updatedMessages)
    setBaseChatInput('')
    setIsEnrichingBase(true)

    try {
      const response = await llmApi.enrich({
        asset_type: asset.type,
        messages: updatedMessages,
        current_prompt: basePrompt,
      })

      const { layers, outfit_suggestion } = response
      const layersJson = JSON.stringify(layers, null, 2)

      const assistantMessage: ChatMessage = { role: 'assistant', content: '✓ Prompt generiert' }
      setBaseChatMessages([...updatedMessages, assistantMessage])
      setBasePrompt(layersJson)

      // Check for outfit suggestion if asset is a character
      if (outfit_suggestion && asset.type === 'character') {
        setOutfitSuggestion(outfit_suggestion)
        setShowOutfitDialog(true)
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Error: ${(error as Error).message}. Check LLM settings.`,
      }
      setBaseChatMessages([...updatedMessages, errorMessage])
    } finally {
      setIsEnrichingBase(false)
    }
  }, [baseChatInput, baseChatMessages, basePrompt, asset.type])

  const handleEnrichVariant = useCallback(
    async (variantId: number) => {
      const input = variantChatInputs.get(variantId) || ''
      if (!input.trim()) return

      const messages = variantChatMessages.get(variantId) || []
      const newUserMessage: ChatMessage = { role: 'user', content: input.trim() }
      const updatedMessages = [...messages, newUserMessage]

      setVariantChatMessages((prev) => {
        const next = new Map(prev)
        next.set(variantId, updatedMessages)
        return next
      })
      setVariantChatInputs((prev) => {
        const next = new Map(prev)
        next.set(variantId, '')
        return next
      })
      setEnrichingVariants((prev) => new Set(prev).add(variantId))

      try {
        const currentDelta = variantPrompts.get(variantId) || ''
        const response = await llmApi.enrichVariant({
          asset_type: asset.type,
          base_prompt: basePrompt,
          messages: updatedMessages,
          current_delta: currentDelta || undefined,
        })

        const { layers } = response
        const layersJson = JSON.stringify(layers, null, 2)

        const assistantMessage: ChatMessage = { role: 'assistant', content: '✓ Prompt generiert' }
        setVariantChatMessages((prev) => {
          const next = new Map(prev)
          next.set(variantId, [...updatedMessages, assistantMessage])
          return next
        })
        setVariantPrompts((prev) => {
          const next = new Map(prev)
          next.set(variantId, layersJson)
          return next
        })
      } catch (error) {
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: `Error: ${(error as Error).message}. Check LLM settings.`,
        }
        setVariantChatMessages((prev) => {
          const next = new Map(prev)
          next.set(variantId, [...updatedMessages, errorMessage])
          return next
        })
      } finally {
        setEnrichingVariants((prev) => {
          const next = new Set(prev)
          next.delete(variantId)
          return next
        })
      }
    },
    [variantChatInputs, variantChatMessages, variantPrompts, basePrompt, asset.type]
  )

  const handleCreateVariant = () => {
    if (!newVariantName.trim()) return
    createVariantMutation.mutate({
      name: newVariantName.trim(),
      delta_prompt: '',
      asset_id: asset.id,
    })
  }

  const handleDeleteVariant = (variant: Variant, tabIndex: number) => {
    // Remove from local state immediately
    setVariants((prev) => prev.filter((v) => v.id !== variant.id))
    setDeletedVariant(variant)
    setShowUndoSnackbar(true)

    // Switch to previous tab
    if (activeTab >= tabIndex) {
      setActiveTab(Math.max(0, activeTab - 1))
    }

    // Delete after timeout unless undone
    setTimeout(() => {
      setDeletedVariant((current) => {
        if (current?.id === variant.id) {
          deleteVariantMutation.mutate(variant.id)
          return null
        }
        return current
      })
    }, 5000)
  }

  const handleUndoDelete = () => {
    if (deletedVariant) {
      setVariants((prev) => [...prev, deletedVariant])
      setDeletedVariant(null)
      setShowUndoSnackbar(false)
    }
  }

  const handleCloseSnackbar = () => {
    setShowUndoSnackbar(false)
  }

  const handleAcceptOutfit = () => {
    if (outfitSuggestion) {
      const deltaPromptJson = JSON.stringify(outfitSuggestion, null, 2)
      createVariantMutation.mutate({
        name: 'Default',
        delta_prompt: deltaPromptJson,
        asset_id: asset.id,
      })
    }
    setShowOutfitDialog(false)
    setOutfitSuggestion(null)
  }

  const handleDeclineOutfit = () => {
    setShowOutfitDialog(false)
    setOutfitSuggestion(null)
  }

  return (
    <Paper sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6">{asset.name}</Typography>
        <Button variant="outlined" size="small" onClick={onClose}>
          Close
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ flex: 1 }}
        >
          <Tab label="Base" />
          {variants.map((variant, idx) => (
            <Tab
              key={variant.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {variant.name}
                  <CloseIcon
                    fontSize="small"
                    sx={{
                      fontSize: 16,
                      opacity: 0.5,
                      '&:hover': { opacity: 1, color: 'error.main' },
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteVariant(variant, idx + 1)
                    }}
                  />
                </Box>
              }
            />
          ))}
        </Tabs>
        <IconButton
          size="small"
          onClick={() => setIsCreating(true)}
          sx={{ mr: 1 }}
          title="Add Variant"
        >
          <AddIcon />
        </IconButton>
      </Box>

      {/* New Variant Creation */}
      <Collapse in={isCreating}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            New Variant
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder="Variant name..."
              value={newVariantName}
              onChange={(e) => setNewVariantName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateVariant()
                if (e.key === 'Escape') {
                  setIsCreating(false)
                  setNewVariantName('')
                }
              }}
              autoFocus
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleCreateVariant}
              disabled={!newVariantName.trim() || createVariantMutation.isPending}
            >
              Create
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setIsCreating(false)
                setNewVariantName('')
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Collapse>

      {/* Tab Panels */}
      <Box sx={{ flex: 1, overflow: 'hidden', p: 2, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Base Tab */}
        <TabPanel value={activeTab} index={0}>
          <PromptPanel
            label="Base Prompt"
            value={basePrompt}
            onChange={setBasePrompt}
            onSave={handleSaveBase}
            isSaving={updateAssetMutation.isPending}
            isDirty={basePrompt !== basePromptOriginal}
            chatMessages={baseChatMessages}
            chatInput={baseChatInput}
            onChatInputChange={setBaseChatInput}
            onSendMessage={handleEnrichBase}
            isProcessing={isEnrichingBase}
            placeholder={`Describe your ${asset.type}...`}
            chatPlaceholder={`Describe details about this ${asset.type}...`}
          />
        </TabPanel>

        {/* Variant Tabs */}
        {variants.map((variant, idx) => (
          <TabPanel key={variant.id} value={activeTab} index={idx + 1}>
            <PromptPanel
              label="Delta Prompt"
              value={variantPrompts.get(variant.id) || ''}
              onChange={(value) =>
                setVariantPrompts((prev) => {
                  const next = new Map(prev)
                  next.set(variant.id, value)
                  return next
                })
              }
              onSave={() => handleSaveVariant(variant.id)}
              isSaving={updateVariantMutation.isPending}
              isDirty={variantPrompts.get(variant.id) !== variantPromptsOriginal.get(variant.id)}
              chatMessages={variantChatMessages.get(variant.id) || []}
              chatInput={variantChatInputs.get(variant.id) || ''}
              onChatInputChange={(value) =>
                setVariantChatInputs((prev) => {
                  const next = new Map(prev)
                  next.set(variant.id, value)
                  return next
                })
              }
              onSendMessage={() => handleEnrichVariant(variant.id)}
              isProcessing={enrichingVariants.has(variant.id)}
              placeholder="Modifications to base prompt..."
              chatPlaceholder={`Describe the "${variant.name}" variant...`}
            />
          </TabPanel>
        ))}
      </Box>

      {/* Undo Snackbar */}
      <Snackbar
        open={showUndoSnackbar}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        message={`"${deletedVariant?.name}" deleted`}
        action={
          <Button color="primary" size="small" onClick={handleUndoDelete}>
            Undo
          </Button>
        }
      />

      {/* Outfit Suggestion Modal */}
      <Modal
        isOpen={showOutfitDialog}
        onClose={handleDeclineOutfit}
        title="Outfit erkannt!"
        maxWidth="sm"
        footer={
          <>
            <Button variant="outlined" onClick={handleDeclineOutfit}>
              Nein
            </Button>
            <Button variant="contained" onClick={handleAcceptOutfit}>
              Ja
            </Button>
          </>
        }
      >
        <Typography variant="body1" sx={{ mb: 2 }}>
          Ein Outfit wurde im Prompt erkannt. Soll es als Variante gespeichert werden?
        </Typography>
        {outfitSuggestion && (
          <Box
            sx={{
              p: 2,
              bgcolor: 'action.hover',
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
            }}
          >
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>CORE:</strong> {outfitSuggestion.core}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>STANDARD:</strong> {outfitSuggestion.standard}
            </Typography>
            <Typography variant="body2">
              <strong>DETAIL:</strong> {outfitSuggestion.detail}
            </Typography>
          </Box>
        )}
      </Modal>
    </Paper>
  )
}
