import { useRef, useEffect, useMemo } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import SendIcon from '@mui/icons-material/Send'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import type { ChatMessage } from '../../api/types'

interface LayeredPrompt {
  core: string
  standard: string
  detail: string
}

interface CoreOnlyPrompt {
  core: string
}

function parseLayeredPrompt(value: string): LayeredPrompt | null {
  if (!value.trim()) return null
  try {
    const parsed = JSON.parse(value)
    if (
      typeof parsed === 'object' &&
      typeof parsed.core === 'string' &&
      typeof parsed.standard === 'string' &&
      typeof parsed.detail === 'string'
    ) {
      return parsed as LayeredPrompt
    }
  } catch {
    // Not valid JSON
  }
  return null
}

function parseCoreOnlyPrompt(value: string): CoreOnlyPrompt | null {
  if (!value.trim()) return null
  try {
    const parsed = JSON.parse(value)
    // Core-only: has core but NOT standard/detail
    if (
      typeof parsed === 'object' &&
      typeof parsed.core === 'string' &&
      !('standard' in parsed) &&
      !('detail' in parsed)
    ) {
      return parsed as CoreOnlyPrompt
    }
  } catch {
    // Not valid JSON
  }
  return null
}

function stringifyLayeredPrompt(layers: LayeredPrompt): string {
  return JSON.stringify(layers, null, 2)
}

function stringifyCoreOnlyPrompt(core: string): string {
  return JSON.stringify({ core })
}

interface PromptPanelProps {
  label: string
  value: string
  onChange: (value: string) => void
  onSave: () => void
  isSaving?: boolean
  isDirty?: boolean
  chatMessages: ChatMessage[]
  chatInput: string
  onChatInputChange: (value: string) => void
  onSendMessage: () => void
  isProcessing?: boolean
  placeholder?: string
  chatPlaceholder?: string
}

export function PromptPanel({
  label,
  value,
  onChange,
  onSave,
  isSaving = false,
  isDirty = false,
  chatMessages,
  chatInput,
  onChatInputChange,
  onSendMessage,
  isProcessing = false,
  placeholder = 'Enter prompt...',
  chatPlaceholder = 'Describe what you want...',
}: PromptPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Parse value as layered prompt if possible
  const layeredPrompt = useMemo(() => parseLayeredPrompt(value), [value])
  // Parse value as core-only prompt if not layered
  const coreOnlyPrompt = useMemo(() => parseCoreOnlyPrompt(value), [value])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSendMessage()
    }
  }

  const handleLayerChange = (layer: keyof LayeredPrompt, newValue: string) => {
    if (layeredPrompt) {
      const updated = { ...layeredPrompt, [layer]: newValue }
      onChange(stringifyLayeredPrompt(updated))
    }
  }

  const handleCoreOnlyChange = (newValue: string) => {
    onChange(stringifyCoreOnlyPrompt(newValue))
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', height: '100%', flex: 1, minHeight: 0, gap: 2 }}>
      {/* Chat Section - 60% */}
      <Paper
        variant="outlined"
        sx={{
          width: '60%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: 'background.default',
          minHeight: 0,
        }}
      >
        <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2">LLM Assistant</Typography>
        </Box>

        {/* Messages */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
          {chatMessages.length === 0 && (
            <Typography
              color="text.secondary"
              textAlign="center"
              fontStyle="italic"
              sx={{ py: 4 }}
            >
              Start a conversation to get suggestions...
            </Typography>
          )}
          {chatMessages.map((msg, idx) => {
            const isSuccess = msg.role === 'assistant' && msg.content.startsWith('✓')
            return (
              <Box
                key={idx}
                sx={{
                  mb: 1,
                  p: 1,
                  borderRadius: 1,
                  bgcolor: msg.role === 'user'
                    ? 'primary.main'
                    : isSuccess
                      ? 'success.light'
                      : 'action.hover',
                  color: msg.role === 'user' ? 'white' : isSuccess ? 'success.dark' : 'text.primary',
                  ml: msg.role === 'user' ? 4 : 0,
                  mr: msg.role === 'assistant' ? 4 : 0,
                }}
              >
                {isSuccess ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon fontSize="small" />
                    <Typography variant="body2" fontWeight={500}>
                      Prompt generiert
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    <Typography component="span" variant="body2" fontWeight={600}>
                      {msg.role === 'user' ? 'You: ' : 'AI: '}
                    </Typography>
                    {msg.content}
                  </Typography>
                )}
              </Box>
            )
          })}
          {isProcessing && (
            <Box sx={{ mb: 1, p: 1, borderRadius: 1, bgcolor: 'action.hover', mr: 4 }}>
              <Typography variant="body2">
                <Typography component="span" variant="body2" fontWeight={600}>
                  AI:{' '}
                </Typography>
                Thinking...
              </Typography>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input */}
        <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            value={chatInput}
            onChange={(e) => onChatInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={chatPlaceholder}
            disabled={isProcessing}
          />
          <Button
            variant="contained"
            onClick={onSendMessage}
            disabled={isProcessing || !chatInput.trim()}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            <SendIcon fontSize="small" />
          </Button>
        </Box>
      </Paper>

      {/* Prompt Section - 40% */}
      <Box sx={{ width: '40%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {label}
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={onSave}
            disabled={isSaving || !isDirty}
            sx={{
              opacity: isDirty ? 1 : 0,
              transition: 'opacity 150ms',
            }}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {layeredPrompt ? (
            // Layered view: 3 editable blocks
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
              {(['core', 'standard', 'detail'] as const).map((layer) => (
                <Paper
                  key={layer}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderLeft: 4,
                    borderLeftColor:
                      layer === 'core'
                        ? 'primary.main'
                        : layer === 'standard'
                          ? 'secondary.main'
                          : 'grey.400',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color={
                      layer === 'core'
                        ? 'primary.main'
                        : layer === 'standard'
                          ? 'secondary.main'
                          : 'text.secondary'
                    }
                    sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                  >
                    {layer}
                  </Typography>
                  <TextField
                    fullWidth
                    value={layeredPrompt[layer]}
                    onChange={(e) => handleLayerChange(layer, e.target.value)}
                    multiline
                    size="small"
                    variant="standard"
                    sx={{ mt: 0.5, flex: 1 }}
                    InputProps={{ disableUnderline: true }}
                  />
                </Paper>
              ))}
            </Box>
          ) : coreOnlyPrompt ? (
            // Core-only view: simple text field showing core value
            <TextField
              fullWidth
              value={coreOnlyPrompt.core}
              onChange={(e) => handleCoreOnlyChange(e.target.value)}
              multiline
              size="small"
              placeholder={placeholder}
              sx={{
                flex: 1,
                '& .MuiInputBase-root': { height: '100%', alignItems: 'flex-start' },
                '& .MuiInputBase-input': { height: '100% !important', overflow: 'auto !important' }
              }}
            />
          ) : (
            // Plain text view
            <TextField
              fullWidth
              value={value}
              onChange={(e) => onChange(e.target.value)}
              multiline
              size="small"
              placeholder={placeholder}
              sx={{
                flex: 1,
                '& .MuiInputBase-root': { height: '100%', alignItems: 'flex-start' },
                '& .MuiInputBase-input': { height: '100% !important', overflow: 'auto !important' }
              }}
            />
          )}
        </Box>
      </Box>
    </Box>
  )
}
