import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import CategoryIcon from '@mui/icons-material/Category'
import FolderOffIcon from '@mui/icons-material/FolderOff'
import { assetsApi } from '../api/client'
import { queryKeys } from '../api/queryKeys'
import { useStore } from '../store'
import { useSnackbar } from '../contexts'
import { AssetCard, AssetModal, AssetEditor } from '../components/Assets'
import { FloatingActionButton, CardSkeleton, EmptyState } from '../components/Common'
import type { Asset, AssetCreate, AssetType } from '../api/types'

export function AssetsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [filterType, setFilterType] = useState<AssetType | 'all'>('all')
  const queryClient = useQueryClient()
  const currentProject = useStore((state) => state.currentProject)
  const { showSnackbar } = useSnackbar()

  const { data: assets, isLoading, error } = useQuery({
    queryKey: queryKeys.assets.list({ project_id: currentProject?.id }),
    queryFn: () =>
      currentProject
        ? assetsApi.list({ project_id: currentProject.id })
        : Promise.resolve([]),
    enabled: !!currentProject,
  })

  const createMutation = useMutation({
    mutationFn: (data: AssetCreate) => assetsApi.create(data),
    onSuccess: (newAsset) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
      setIsModalOpen(false)
      // Open editor immediately after creation
      setEditingAsset(newAsset)
    },
    onError: (error: Error) => {
      showSnackbar(error.message || 'Failed to create asset', 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => assetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
      showSnackbar('Asset deleted', 'success')
    },
    onError: (error: Error) => {
      showSnackbar(error.message || 'Failed to delete asset', 'error')
    },
  })

  const handleCreateAsset = (data: { name: string; type: AssetType }) => {
    if (!currentProject) return
    createMutation.mutate({
      ...data,
      project_id: currentProject.id,
      is_global: false,
    })
  }

  const handleDeleteAsset = (asset: Asset) => {
    if (confirm(`Are you sure you want to delete "${asset.name}"?`)) {
      deleteMutation.mutate(asset.id)
    }
  }

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset)
  }

  if (!currentProject) {
    return (
      <Box>
        <Typography variant="h4" component="h2" sx={{ mb: 3 }}>
          Assets
        </Typography>
        <EmptyState
          icon={FolderOffIcon}
          title="No project selected"
          description="Please select a project first from the Projects page."
        />
      </Box>
    )
  }

  if (editingAsset) {
    return (
      <AssetEditor
        asset={editingAsset}
        onClose={() => setEditingAsset(null)}
        onUpdate={() => queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })}
      />
    )
  }

  const filteredAssets = assets?.filter(
    (asset) => filterType === 'all' || asset.type === filterType
  )

  const assetTypes: { value: AssetType | 'all'; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'character', label: 'Characters' },
    { value: 'location', label: 'Locations' },
    { value: 'object', label: 'Objects' },
  ]

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h2">
          Assets
        </Typography>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as AssetType | 'all')}
          >
            {assetTypes.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {isLoading ? (
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <CardSkeleton variant="asset" />
            </Grid>
          ))}
        </Grid>
      ) : error ? (
        <EmptyState
          icon={CategoryIcon}
          title="Error loading assets"
          description={(error as Error).message}
        />
      ) : filteredAssets && filteredAssets.length === 0 ? (
        <EmptyState
          icon={CategoryIcon}
          title={filterType === 'all' ? 'No assets yet' : `No ${filterType} assets`}
          description={
            filterType === 'all'
              ? 'Create your first asset to define reusable prompt elements.'
              : 'Try selecting a different filter or create a new asset.'
          }
          actionLabel="Create Asset"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <Grid container spacing={2}>
          {filteredAssets?.map((asset, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={asset.id}>
              <Box
                sx={{
                  animation: 'fadeSlideIn 300ms ease forwards',
                  animationDelay: `${index * 50}ms`,
                  opacity: 0,
                }}
              >
                <AssetCard
                  asset={asset}
                  onEdit={handleEditAsset}
                  onDelete={handleDeleteAsset}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      <FloatingActionButton
        onClick={() => setIsModalOpen(true)}
        tooltip="New Asset"
      />

      <AssetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateAsset}
        projectId={currentProject.id}
      />
    </Box>
  )
}
