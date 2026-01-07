import { useState, useRef, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { assetsApi } from '../../api/client'
import { queryKeys } from '../../api/queryKeys'
import type { Asset, AssetType } from '../../api/types'

interface AssetAutocompleteProps {
  value: string
  onChange: (value: string) => void
  projectId: number
  placeholder?: string
  rows?: number
}

type DropdownMode = 'asset' | 'variant'

interface DropdownItem {
  id: number
  name: string
  type?: AssetType
}

const TYPE_LABELS: Record<AssetType, string> = {
  character: 'CHR',
  location: 'LOC',
  object: 'OBJ',
  style: 'STY',
  shot_type: 'SHT',
  lighting_setup: 'LIT',
}

export function AssetAutocomplete({
  value,
  onChange,
  projectId,
  placeholder,
  rows = 3,
}: AssetAutocompleteProps) {
  const theme = useTheme()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [showDropdown, setShowDropdown] = useState(false)
  const [mode, setMode] = useState<DropdownMode>('asset')
  const [searchText, setSearchText] = useState('')
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [bracketStartPos, setBracketStartPos] = useState<number | null>(null)

  const { data: projectAssets } = useQuery({
    queryKey: queryKeys.assets.list({ project_id: projectId }),
    queryFn: () => assetsApi.list({ project_id: projectId }),
    enabled: !!projectId,
  })

  const { data: globalAssets } = useQuery({
    queryKey: queryKeys.assets.allGlobal(),
    queryFn: () => assetsApi.list({ is_global: true }),
  })

  const allAssets = useMemo(() => {
    const combined = [...(projectAssets || []), ...(globalAssets || [])]
    return combined.filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i)
  }, [projectAssets, globalAssets])

  const filteredItems: DropdownItem[] = useMemo(() => {
    if (mode === 'asset') {
      const search = searchText.toLowerCase()
      return allAssets
        .filter((a) => a.name.toLowerCase().includes(search))
        .slice(0, 10)
        .map((a) => ({ id: a.id, name: a.name, type: a.type }))
    } else if (mode === 'variant' && selectedAsset) {
      const search = searchText.toLowerCase()
      return (selectedAsset.variants || [])
        .filter((v) => v.name.toLowerCase().includes(search))
        .slice(0, 10)
        .map((v) => ({ id: v.id, name: v.name }))
    }
    return []
  }, [mode, searchText, allAssets, selectedAsset])

  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredItems])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    const cursorPos = e.target.selectionStart
    checkForAutocomplete(newValue, cursorPos)
  }

  const checkForAutocomplete = (text: string, cursorPos: number) => {
    let bracketPos = -1
    let depth = 0

    for (let i = cursorPos - 1; i >= 0; i--) {
      if (text[i] === ']') {
        depth++
      } else if (text[i] === '[') {
        if (depth === 0) {
          bracketPos = i
          break
        }
        depth--
      }
    }

    if (bracketPos === -1) {
      setShowDropdown(false)
      return
    }

    const content = text.substring(bracketPos + 1, cursorPos)
    const colonPos = content.indexOf(':')

    if (colonPos !== -1) {
      const assetName = content.substring(0, colonPos)
      const variantSearch = content.substring(colonPos + 1)

      const asset = allAssets.find(
        (a) => a.name.toLowerCase() === assetName.toLowerCase()
      )

      if (asset && asset.variants && asset.variants.length > 0) {
        setMode('variant')
        setSelectedAsset(asset)
        setSearchText(variantSearch)
        setBracketStartPos(bracketPos)
        setShowDropdown(true)
      } else {
        setShowDropdown(false)
      }
    } else {
      setMode('asset')
      setSelectedAsset(null)
      setSearchText(content)
      setBracketStartPos(bracketPos)
      setShowDropdown(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showDropdown) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
        break
      case 'Enter':
      case 'Tab':
        if (filteredItems.length > 0) {
          e.preventDefault()
          handleSelectItem(filteredItems[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowDropdown(false)
        break
    }
  }

  const handleSelectItem = (item: DropdownItem) => {
    if (!textareaRef.current || bracketStartPos === null) return

    const textarea = textareaRef.current
    const cursorPos = textarea.selectionStart

    if (mode === 'asset') {
      const before = value.substring(0, bracketStartPos + 1)
      const after = value.substring(cursorPos)
      const newValue = before + item.name + after
      onChange(newValue)

      const newCursorPos = bracketStartPos + 1 + item.name.length
      setTimeout(() => {
        textarea.focus()
        textarea.selectionStart = textarea.selectionEnd = newCursorPos
        const asset = allAssets.find((a) => a.id === item.id)
        if (asset && asset.variants && asset.variants.length > 0) {
          setMode('asset')
          setSearchText(item.name)
        }
      }, 0)

      setShowDropdown(false)
    } else if (mode === 'variant') {
      const colonPos = value.lastIndexOf(':', cursorPos)
      const before = value.substring(0, colonPos + 1)
      const after = value.substring(cursorPos)
      const newValue = before + item.name + ']' + after
      onChange(newValue)

      const newCursorPos = colonPos + 1 + item.name.length + 1
      setTimeout(() => {
        textarea.focus()
        textarea.selectionStart = textarea.selectionEnd = newCursorPos
      }, 0)

      setShowDropdown(false)
    }
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        fullWidth
        multiline
        rows={rows}
        inputRef={textareaRef}
        value={value}
        onChange={handleTextChange as never}
        onKeyDown={handleKeyDown as never}
        placeholder={placeholder}
        size="small"
      />

      {showDropdown && (
        <Paper
          ref={dropdownRef}
          elevation={8}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 0.5,
            maxHeight: 200,
            overflow: 'auto',
            zIndex: 100,
          }}
        >
          {filteredItems.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              fontStyle="italic"
              sx={{ p: 1.5, textAlign: 'center' }}
            >
              {mode === 'asset' ? 'No assets found' : 'No variants found'}
            </Typography>
          ) : (
            filteredItems.map((item, idx) => (
              <Box
                key={item.id}
                onClick={() => handleSelectItem(item)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 1,
                  cursor: 'pointer',
                  bgcolor: idx === selectedIndex ? 'action.hover' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                {mode === 'asset' && item.type && (
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      color: 'white',
                      bgcolor: theme.palette.assetTypes[item.type],
                    }}
                  >
                    {TYPE_LABELS[item.type]}
                  </Box>
                )}
                <Typography
                  variant="body2"
                  sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {item.name}
                </Typography>
                {mode === 'variant' && (
                  <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                    variant
                  </Typography>
                )}
              </Box>
            ))
          )}
        </Paper>
      )}
    </Box>
  )
}
