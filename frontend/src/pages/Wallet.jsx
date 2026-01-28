import React, { useEffect, useState } from 'react'
import { walletAPI } from '../services/authService'

// Conversion rate: 1 coin = 1 Rs
const COIN_TO_RS_RATE = 1

export default function Wallet() {
  const [wallet, setWallet] = useState(null)
  const [withdrawalRequests, setWithdrawalRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    upi_id: '',
  })
  const [withdrawError, setWithdrawError] = useState('')
  const [withdrawSuccess, setWithdrawSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadWalletData()
  }, [])

  const loadWalletData = async () => {
    setLoading(true)
    try {
      const [walletRes, withdrawalsRes] = await Promise.all([
        walletAPI.getWallet(),
        walletAPI.getWithdrawals(),
      ])
      setWallet(walletRes.data.data)
      setWithdrawalRequests(withdrawalsRes.data.data.withdrawals || [])
    } catch (err) {
      console.error('Failed to load wallet:', err)
    }
    setLoading(false)
  }

  const validateUPI = (upi) => {
    // Simple UPI validation: should be in format like username@bankname
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/
    return upiRegex.test(upi)
  }

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault()
    setWithdrawError('')
    setWithdrawSuccess('')

    // Validate form
    if (!withdrawalForm.amount || withdrawalForm.amount <= 0) {
      setWithdrawError('Please enter a valid amount')
      return
    }

    if (parseFloat(withdrawalForm.amount) > wallet.balance_coins) {
      setWithdrawError('Insufficient balance')
      return
    }

    if (parseFloat(withdrawalForm.amount) < 20) {
      setWithdrawError('Minimum withdrawal is Rs. 20')
      return
    }

    if (!withdrawalForm.upi_id || withdrawalForm.upi_id.trim().length === 0) {
      setWithdrawError('UPI ID is required')
      return
    }

    if (!validateUPI(withdrawalForm.upi_id.trim())) {
      setWithdrawError('Invalid UPI format. Use format like: username@bankname')
      return
    }

    setSubmitting(true)
    try {
      const response = await walletAPI.requestWithdrawal(
        parseFloat(withdrawalForm.amount),
        withdrawalForm.upi_id.trim()
      )

      if (response.data.success) {
        setWithdrawSuccess('✅ Withdrawal request submitted! Admin will review and process it shortly.')
        setWithdrawalForm({ amount: '', upi_id: '' })
        setTimeout(() => {
          setShowWithdrawModal(false)
          loadWalletData()
          setWithdrawSuccess('')
        }, 2000)
      }
    } catch (err) {
      setWithdrawError(err.response?.data?.error?.message || 'Failed to submit withdrawal request')
    }
    setSubmitting(false)
  }

  if (loading || !wallet) {
    return <div className="text-center py-8">Loading...</div>
  }

  const balanceInRs = wallet.balance_coins * COIN_TO_RS_RATE
  const totalEarnedInRs = wallet.total_earned * COIN_TO_RS_RATE
  const totalWithdrawnInRs = wallet.total_withdrawn * COIN_TO_RS_RATE

  const pendingRequests = withdrawalRequests.filter(r => r.status === 'pending')
  const processedRequests = withdrawalRequests.filter(r => r.status !== 'pending')

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Your Wallet</h1>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-primary to-secondary rounded-lg shadow-lg p-8 text-white mb-8">
          <div className="mb-6">
            <p className="text-gray-200">Total Balance</p>
            <h2 className="text-5xl font-bold">Rs. {balanceInRs.toFixed(2)}</h2>
            <p className="text-gray-200">({wallet.balance_coins.toFixed(0)} coins)</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-200 text-sm">Total Earned</p>
              <p className="text-2xl font-semibold">Rs. {totalEarnedInRs.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-200 text-sm">Total Withdrawn</p>
              <p className="text-2xl font-semibold">Rs. {totalWithdrawnInRs.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Earning Rules */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">📊 How to Earn</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <span className="text-2xl">❤️</span>
              <div>
                <p className="font-semibold">Get 500 Likes on a Post</p>
                <p className="text-sm text-gray-600">Earn Rs. 20 when your post reaches 500 likes</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <span className="text-2xl">👥</span>
              <div>
                <p className="font-semibold">Build Your Audience</p>
                <p className="text-sm text-gray-600">Get followers and boost your post visibility</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <span className="text-2xl">📈</span>
              <div>
                <p className="font-semibold">Consistent Content</p>
                <p className="text-sm text-gray-600">Post regularly to increase your earning potential</p>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={wallet.balance_coins < 20}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            💸 Request Withdrawal
          </button>
          {wallet.balance_coins < 20 && (
            <p className="text-sm text-gray-600 mt-2">
              ⚠️ Minimum balance of Rs. 20 required to withdraw
            </p>
          )}
        </div>

        {/* Pending Withdrawal Requests */}
        {pendingRequests.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-8">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">⏳ Pending Withdrawal Requests</h3>
            <div className="space-y-2">
              {pendingRequests.map(req => (
                <div key={req.id} className="bg-white p-3 rounded border border-yellow-200">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">Rs. {req.amount}</p>
                      <p className="text-sm text-gray-600">{req.upi_id}</p>
                      <p className="text-xs text-gray-500">
                        Requested: {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-yellow-600 font-semibold">Pending</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Withdrawal Requests */}
        {processedRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">📋 Withdrawal History</h3>
            <div className="space-y-3">
              {processedRequests.map(req => (
                <div
                  key={req.id}
                  className={`p-4 rounded-lg border ${
                    req.status === 'completed'
                      ? 'bg-green-50 border-green-200'
                      : req.status === 'approved'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">Rs. {req.amount}</p>
                      <p className="text-sm text-gray-600">{req.upi_id}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        req.status === 'completed'
                          ? 'bg-green-200 text-green-800'
                          : req.status === 'approved'
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {req.status === 'completed' ? '✅ Completed' : req.status === 'approved' ? '✓ Approved' : '❌ Rejected'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Request Withdrawal</h2>

            {withdrawError && (
              <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{withdrawError}</div>
            )}

            {withdrawSuccess && (
              <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{withdrawSuccess}</div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Amount (Rs.)</label>
                <input
                  type="number"
                  step="1"
                  min="20"
                  max={wallet.balance_coins}
                  value={withdrawalForm.amount}
                  onChange={(e) =>
                    setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })
                  }
                  placeholder="Minimum Rs. 20"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available balance: Rs. {wallet.balance_coins.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">UPI ID</label>
                <input
                  type="text"
                  value={withdrawalForm.upi_id}
                  onChange={(e) =>
                    setWithdrawalForm({ ...withdrawalForm, upi_id: e.target.value })
                  }
                  placeholder="username@bankname"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: yourname@googlepay or yourname@phonepe
                </p>
              </div>

              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-blue-800">
                  ℹ️ Your withdrawal request will be reviewed by our admin team. You'll receive a notification once it's processed.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
