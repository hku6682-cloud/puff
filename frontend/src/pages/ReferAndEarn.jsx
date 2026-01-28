import React, { useEffect, useState } from 'react'
import { referralAPI } from '../services/authService'

export default function ReferAndEarn() {
  const [referralData, setReferralData] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const codeRes = await referralAPI.getReferralCode()
        setReferralData(codeRes.data.data)

        const statsRes = await referralAPI.getReferralStats()
        setStats(statsRes.data.data)
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to load referral data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading referral data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Refer & Earn</h1>
          <p className="text-xl text-gray-600">Share your referral code and earn Rs. 50 for each friend who joins!</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Referral Code Card */}
        <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Your Referral Code</h2>
          
          <div className="bg-white/20 rounded-lg p-6 mb-6">
            <p className="text-white/80 text-sm mb-2">Referral Code</p>
            <div className="flex items-center justify-between">
              <code className="text-3xl font-bold tracking-widest">
                {referralData?.referral_code || 'LOADING...'}
              </code>
              <button
                onClick={() => copyToClipboard(referralData?.referral_code)}
                className="bg-white text-primary px-4 py-2 rounded font-semibold hover:bg-gray-100 transition"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="bg-white/20 rounded-lg p-6">
            <p className="text-white/80 text-sm mb-2">Share this link</p>
            <div className="flex items-center justify-between">
              <code className="text-sm break-all">
                {referralData?.referral_link || 'Loading...'}
              </code>
              <button
                onClick={() => copyToClipboard(referralData?.referral_link)}
                className="bg-white text-primary px-4 py-2 rounded font-semibold hover:bg-gray-100 transition ml-2 whitespace-nowrap"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Referrals */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Referrals</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.total_referrals || 0}
                </p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          {/* Total Earnings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Earnings</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  Rs. {stats?.total_earnings || 0}
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          {/* Bonus Per Referral */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Bonus Per Referral</p>
                <p className="text-3xl font-bold text-primary mt-2">Rs. 50</p>
              </div>
              <div className="text-4xl">🎁</div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary text-white">
                  1
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-medium text-gray-900">Share Your Code</h4>
                <p className="mt-2 text-gray-600">Copy your unique referral code and share it with friends</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary text-white">
                  2
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-medium text-gray-900">They Sign Up</h4>
                <p className="mt-2 text-gray-600">When they sign up using your code, they join PUFF</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary text-white">
                  3
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-medium text-gray-900">You Earn Rs. 50</h4>
                <p className="mt-2 text-gray-600">Instantly get Rs. 50 bonus in your wallet for each successful referral</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary text-white">
                  4
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-medium text-gray-900">Withdraw Anytime</h4>
                <p className="mt-2 text-gray-600">Withdraw your referral earnings to your UPI account</p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral List */}
        {stats?.referral_list && stats.referral_list.length > 0 && (
          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Referrals</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Earned</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.referral_list.map((referral) => (
                    <tr key={referral.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900 font-medium">{referral.username}</td>
                      <td className="py-3 px-4 text-gray-600">{referral.email}</td>
                      <td className="py-3 px-4 text-right font-semibold text-green-600">
                        Rs. {referral.earned_amount}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {referral.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Referrals Yet */}
        {(!stats?.referral_list || stats.referral_list.length === 0) && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 text-lg">No referrals yet. Start sharing your code to earn!</p>
          </div>
        )}
      </div>
    </div>
  )
}
