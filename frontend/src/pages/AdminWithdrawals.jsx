import React, { useEffect, useState } from 'react'
import API from '../services/api'

export default function AdminWithdrawals() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, approved, rejected, completed
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [actionNotes, setActionNotes] = useState('')
  const [actionType, setActionType] = useState(null) // 'approve', 'reject', 'complete'
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    loadWithdrawals()
  }, [])

  const loadWithdrawals = async () => {
    setLoading(true)
    try {
      const response = await API.get('/wallet/admin/withdrawal-requests')
      if (response.data.success) {
        setRequests(response.data.data.requests || [])
      }
    } catch (err) {
      console.error('Failed to load withdrawals:', err)
    }
    setLoading(false)
  }

  const handleApprove = async () => {
    if (!selectedRequest) return

    setSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const response = await API.put(
        `/wallet/admin/withdrawal-requests/${selectedRequest.id}/approve`,
        { notes: actionNotes }
      )

      if (response.data.success) {
        setSuccessMsg('✅ Withdrawal approved successfully')
        setSelectedRequest(null)
        setActionNotes('')
        setActionType(null)
        loadWithdrawals()
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to approve withdrawal')
    }
    setSubmitting(false)
  }

  const handleReject = async () => {
    if (!selectedRequest) return

    setSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const response = await API.put(
        `/wallet/admin/withdrawal-requests/${selectedRequest.id}/reject`,
        { notes: actionNotes }
      )

      if (response.data.success) {
        setSuccessMsg('❌ Withdrawal rejected successfully')
        setSelectedRequest(null)
        setActionNotes('')
        setActionType(null)
        loadWithdrawals()
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to reject withdrawal')
    }
    setSubmitting(false)
  }

  const handleComplete = async () => {
    if (!selectedRequest) return

    setSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const response = await API.put(
        `/wallet/admin/withdrawal-requests/${selectedRequest.id}/complete`,
        {}
      )

      if (response.data.success) {
        setSuccessMsg('✅ Withdrawal marked as completed')
        setSelectedRequest(null)
        setActionNotes('')
        setActionType(null)
        loadWithdrawals()
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to complete withdrawal')
    }
    setSubmitting(false)
  }

  const filteredRequests =
    filter === 'all'
      ? requests
      : requests.filter(r => r.status === filter)

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return '⏳ Pending'
      case 'approved':
        return '✓ Approved'
      case 'completed':
        return '✅ Completed'
      case 'rejected':
        return '❌ Rejected'
      default:
        return status
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">💰 Withdrawal Requests Management</h1>

        {successMsg && (
          <div className="bg-green-100 text-green-700 p-4 rounded mb-6">{successMsg}</div>
        )}
        {errorMsg && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{errorMsg}</div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['all', 'pending', 'approved', 'completed', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
                filter === status
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'all' && ` (${requests.length})`}
              {status !== 'all' && ` (${requests.filter(r => r.status === status).length})`}
            </button>
          ))}
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              No withdrawal requests found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">UPI ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Balance</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map(req => (
                    <tr key={req.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold">{req.display_name}</p>
                          <p className="text-sm text-gray-600">@{req.username}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold">Rs. {req.amount}</td>
                      <td className="px-6 py-4 font-mono text-sm">{req.upi_id}</td>
                      <td className="px-6 py-4">Rs. {req.available_balance}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(req.status)}`}>
                          {getStatusBadge(req.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="text-primary hover:text-primary/90 font-semibold"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Withdrawal Request Details</h2>

            {/* Request Details */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
              <div>
                <p className="text-sm text-gray-600">User</p>
                <p className="font-semibold">{selectedRequest.display_name}</p>
                <p className="text-sm text-gray-600">@{selectedRequest.username}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Requested Amount</p>
                <p className="text-2xl font-bold text-primary">Rs. {selectedRequest.amount}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Available Balance</p>
                <p className="font-semibold">Rs. {selectedRequest.available_balance}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">UPI ID</p>
                <p className="font-mono">{selectedRequest.upi_id}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(selectedRequest.status)}`}
                >
                  {getStatusBadge(selectedRequest.status)}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-600">Requested On</p>
                <p>{new Date(selectedRequest.created_at).toLocaleDateString()} {new Date(selectedRequest.created_at).toLocaleTimeString()}</p>
              </div>

              {selectedRequest.notes && (
                <div>
                  <p className="text-sm text-gray-600">Admin Notes</p>
                  <p className="bg-white p-2 rounded border">{selectedRequest.notes}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {selectedRequest.status === 'pending' && (
              <>
                {!actionType ? (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => setActionType('approve')}
                      className="bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => setActionType('reject')}
                      className="bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600"
                    >
                      ✕ Reject
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-semibold mb-2">
                        {actionType === 'approve' ? 'Approval Notes (optional)' : 'Rejection Reason (optional)'}
                      </label>
                      <textarea
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        placeholder="Enter notes..."
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        rows="3"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <button
                        onClick={actionType === 'approve' ? handleApprove : handleReject}
                        disabled={submitting}
                        className={`py-2 rounded-lg font-semibold text-white ${
                          actionType === 'approve'
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-red-500 hover:bg-red-600'
                        } disabled:opacity-50`}
                      >
                        {submitting ? 'Processing...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => {
                          setActionType(null)
                          setActionNotes('')
                        }}
                        className="bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {selectedRequest.status === 'approved' && (
              <>
                {!actionType ? (
                  <button
                    onClick={() => setActionType('complete')}
                    className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 mb-4"
                  >
                    ✓ Mark as Completed
                  </button>
                ) : (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 mb-4">
                      Mark this withdrawal as completed after transferring Rs. {selectedRequest.amount} to {selectedRequest.upi_id}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleComplete}
                        disabled={submitting}
                        className="bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50"
                      >
                        {submitting ? 'Processing...' : 'Completed'}
                      </button>
                      <button
                        onClick={() => setActionType(null)}
                        className="bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Close Button */}
            <button
              onClick={() => {
                setSelectedRequest(null)
                setActionType(null)
                setActionNotes('')
              }}
              className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
