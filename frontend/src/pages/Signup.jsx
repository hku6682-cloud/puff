import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../context/authContext'
import { referralAPI } from '../services/authService'

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    phone: '',
    referral_code: '',
  })
  const [error, setError] = useState('')
  const [referralInfo, setReferralInfo] = useState(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signup, isLoading } = useAuthStore()

  useEffect(() => {
    // Check if referral code in URL
    const refCode = searchParams.get('ref')
    if (refCode) {
      setFormData({ ...formData, referral_code: refCode })
      // Validate referral code
      const validateCode = async () => {
        try {
          const res = await referralAPI.validateReferralCode(refCode)
          if (res.data.data.valid) {
            setReferralInfo(res.data.data)
          }
        } catch (err) {
          console.log('Invalid referral code')
        }
      }
      validateCode()
    }
  }, [searchParams])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    
    // Validate referral code if changed
    if (name === 'referral_code' && value) {
      const validateCode = async () => {
        try {
          const res = await referralAPI.validateReferralCode(value)
          if (res.data.data.valid) {
            setReferralInfo(res.data.data)
          } else {
            setReferralInfo(null)
          }
        } catch (err) {
          setReferralInfo(null)
        }
      }
      validateCode()
    } else if (name === 'referral_code' && !value) {
      setReferralInfo(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await signup(
        formData.email,
        formData.username,
        formData.password,
        formData.phone,
        formData.referral_code
      )
      navigate('/onboarding')
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Signup failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">PUFF</h1>
        <p className="text-center text-gray-600 mb-8">Share. Earn. Connect.</p>

        {referralInfo && (
          <div className="bg-green-100 text-green-800 p-3 rounded mb-4 text-sm">
            <p className="font-semibold">Great! Referred by @{referralInfo.username}</p>
            <p className="text-xs mt-1">You'll both get Rs. 50 bonus!</p>
          </div>
        )}

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone (optional)"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            name="referral_code"
            placeholder="Referral Code (optional)"
            value={formData.referral_code}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-4">
          Already have an account? <a href="/login" className="text-primary font-semibold">Login</a>
        </p>
      </div>
    </div>
  )
}
