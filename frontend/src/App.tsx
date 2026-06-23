import { Routes, Route, Navigate } from 'react-router-dom'

import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import CameraPage from './pages/CameraPage'
import HistoryPage from './pages/HistoryPage'
import ReportsPage from './pages/ReportsPage'
import AdminUsersPage from './pages/AdminUsersPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CameraPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/camera" element={<CameraPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="*" element={<Navigate to="/" />} />
      <Route path="/admin-users" element={<AdminUsersPage />} />
    </Routes>
  )
}