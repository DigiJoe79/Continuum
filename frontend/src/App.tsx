import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import {
  ProjectsPage,
  AssetsPage,
  ScenesPage,
  GlobalsPage,
  SettingsPage,
  InfoPage
} from './pages'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/projects" replace />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="scenes" element={<ScenesPage />} />
        <Route path="globals" element={<GlobalsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="info" element={<InfoPage />} />
        {/* Catch-all route for unknown paths */}
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Route>
    </Routes>
  )
}

export default App
