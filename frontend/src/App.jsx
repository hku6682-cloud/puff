import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './context/authContext'
import Header from './components/Header'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import OnboardingFollow from './pages/OnboardingFollow'
import Feed from './pages/Feed'
import CreatePost from './pages/CreatePost'
import Wallet from './pages/Wallet'
import ReferAndEarn from './pages/ReferAndEarn'
import Discover from './pages/Discover'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'
import AdminDashboard from './pages/AdminDashboard'
import AdminWithdrawals from './pages/AdminWithdrawals'
import './App.css'

function App() {
  const token = useAuthStore((state) => state.token)

  return (
    <Router>
      {token && <Header />}
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Routes */}
        {token ? (
          <>
            <Route path="/onboarding" element={<OnboardingFollow />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/create" element={<CreatePost />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/refer" element={<ReferAndEarn />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
            <Route path="/" element={<Navigate to="/feed" />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        )}
      </Routes>
    </Router>
  )
}

export default App
