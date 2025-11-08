'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getData, StorageKeys } from '@/lib/storage'
import { getDebts, deleteDebt } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { format, parseISO, isPast, isToday } from 'date-fns'

export default function DebtsScreen() {
  const router = useRouter()
  const [debts, setDebts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all')

  useEffect(() => {
    loadDebts()
  }, [])

  const loadDebts = async () => {
    try {
      setLoading(true)
      setError(null)
      const familyId = getData(StorageKeys.FAMILY_ID)
      if (!familyId) {
        router.push('/auth')
        return
      }

      const debtsData = await getDebts(Number(familyId))
      // Sort by due date (nulls last) and then by created date
      debtsData.sort((a: any, b: any) => {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
      setDebts(debtsData)
    } catch (error: any) {
      console.error('Error loading debts:', error)
      setError(error.message || 'Failed to load debts')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this debt?')) return

    try {
      await deleteDebt(id)
      await loadDebts()
    } catch (error: any) {
      console.error('Error deleting debt:', error)
      setError(error.message || 'Failed to delete debt')
    }
  }

  const getStatusColor = (status: string, dueDate?: string) => {
    if (status === 'paid') return 'bg-green-100 text-green-700'
    if (status === 'overdue') return 'bg-red-100 text-red-700'
    if (dueDate && isPast(parseISO(dueDate)) && !isToday(parseISO(dueDate))) {
      return 'bg-red-100 text-red-700'
    }
    return 'bg-yellow-100 text-yellow-700'
  }

  const getStatusText = (status: string, dueDate?: string) => {
    if (status === 'paid') return 'Paid'
    if (status === 'overdue') return 'Overdue'
    if (dueDate && isPast(parseISO(dueDate)) && !isToday(parseISO(dueDate))) {
      return 'Overdue'
    }
    return 'Pending'
  }

  const filteredDebts = debts.filter((debt) => {
    if (filter === 'all') return true
    if (filter === 'overdue') {
      return debt.status === 'overdue' || 
        (debt.dueDate && isPast(parseISO(debt.dueDate)) && !isToday(parseISO(debt.dueDate)))
    }
    return debt.status === filter
  })

  const totalDebts = filteredDebts
    .filter((d) => d.status !== 'paid')
    .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadDebts}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-indigo-600 text-white p-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-white">
            ←
          </Link>
          <h1 className="text-xl font-bold">Debts</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary */}
        <div className="bg-orange-50 rounded-xl p-4">
          <p className="text-xs text-gray-600 mb-1">Total Outstanding Debts</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalDebts)}</p>
          <p className="text-xs text-gray-500 mt-1">{filteredDebts.filter((d) => d.status !== 'paid').length} active debts</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex gap-2 overflow-x-auto">
            {['all', 'pending', 'overdue', 'paid'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap ${
                  filter === f
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Debts List */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-3">All Debts</h2>
          {filteredDebts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No debts found</p>
              <Link
                href="/add-transaction?type=debt"
                className="mt-4 inline-block text-indigo-600 font-medium"
              >
                Add your first debt
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDebts.map((debt) => (
                <div
                  key={debt.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(parseFloat(debt.amount))}
                      </p>
                      <span
                        className={`px-2 py-1 text-xs rounded font-medium ${getStatusColor(
                          debt.status,
                          debt.dueDate
                        )}`}
                      >
                        {getStatusText(debt.status, debt.dueDate)}
                      </span>
                    </div>
                    {debt.description && (
                      <p className="text-sm text-gray-600 mb-1">{debt.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {debt.creditor && (
                        <span>Creditor: {debt.creditor}</span>
                      )}
                      {debt.dueDate && (
                        <span>
                          Due: {format(parseISO(debt.dueDate), 'MMM dd, yyyy')}
                          {isPast(parseISO(debt.dueDate)) && !isToday(parseISO(debt.dueDate)) && (
                            <span className="text-red-600 ml-1">(Overdue)</span>
                          )}
                        </span>
                      )}
                      {debt.addedBy && (
                        <span>Added by: {debt.addedBy}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(debt.id)}
                    className="ml-4 text-red-600 hover:text-red-800 p-2"
                    title="Delete debt"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <Link
        href="/add-transaction?type=debt"
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-indigo-700 transition-colors z-50"
      >
        +
      </Link>
    </div>
  )
}

