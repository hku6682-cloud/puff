import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../context/authContext'

export default function Header() {
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-gradient-to-r from-primary to-secondary text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/feed" className="text-2xl font-bold">
            PUFF
          </Link>

          {/* Navigation Links */}
          <nav className="flex gap-6 items-center">
            <Link to="/feed" className="hover:opacity-80 transition">
              🏠 Feed
            </Link>
            <Link to="/discover" className="hover:opacity-80 transition">
              🌍 Discover
            </Link>
            <Link to="/create" className="hover:opacity-80 transition">
              ✏️ Create
            </Link>
            <Link to="/wallet" className="hover:opacity-80 transition">
              💰 Wallet
            </Link>
            <Link to="/refer" className="hover:opacity-80 transition">
              🎁 Refer
            </Link>
            <Link to="/notifications" className="hover:opacity-80 transition relative">
              🔔 Notifications
            </Link>
            <Link to="/profile" className="hover:opacity-80 transition">
              👤 Profile
            </Link>
            {user?.is_admin && (
              <div className="flex gap-2">
                <Link to="/admin" className="hover:opacity-80 transition bg-yellow-500 px-3 py-1 rounded font-semibold">
                  👑 Admin
                </Link>
                <Link to="/admin/withdrawals" className="hover:opacity-80 transition bg-yellow-600 px-3 py-1 rounded font-semibold">
                  💸 Withdrawals
                </Link>
              </div>
            )}
          </nav>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-semibold transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
