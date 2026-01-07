import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import { useTheme } from '@mui/material/styles'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import type { Asset, AssetType } from '../../api/types'
import { extractCorePrompt } from '../../utils/promptUtils'

interface AssetCardProps {
  asset: Asset
  onEdit: (asset: Asset) => void
  onDelete: (asset: Asset) => void
}

const typeIcons: Record<AssetType, string> = {
  character: 'C',
  location: 'L',
  object: 'O',
  style: 'S',
  shot_type: 'T',
  lighting_setup: '💡',
}

const typeLabels: Record<AssetType, string> = {
  character: 'Character',
  location: 'Location',
  object: 'Object',
  style: 'Style',
  shot_type: 'Shot Type',
  lighting_setup: 'Lighting',
}

export function AssetCard({ asset, onEdit, onDelete }: AssetCardProps) {
  const theme = useTheme()
  const bgColor = theme.palette.assetTypes[asset.type]

  return (
    <Card
      sx={{
        '&:hover': {
          borderColor: `${bgColor}50`,
          boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15)`,
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Avatar
            sx={{
              bgcolor: bgColor,
              width: 44,
              height: 44,
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            {typeIcons[asset.type]}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h6" component="h4" noWrap>
              {asset.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {typeLabels[asset.type]}
            </Typography>
          </Box>
        </Box>
        {asset.base_prompt && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {extractCorePrompt(asset.base_prompt)}
          </Typography>
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'space-between', borderTop: 1, borderColor: 'divider', px: 2, py: 1 }}>
        <Chip
          label={`${asset.variants.length} variant${asset.variants.length !== 1 ? 's' : ''}`}
          size="small"
          sx={{ bgcolor: `${bgColor}20`, color: bgColor }}
        />
        <Box>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => onEdit(asset)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => onDelete(asset)}
              sx={{ color: 'error.main' }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  )
}
