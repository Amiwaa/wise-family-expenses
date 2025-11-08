'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getData, StorageKeys } from '@/lib/storage'
import { getCustomSections, createCustomSection, deleteCustomSection, deleteCustomSectionTransaction } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

export default function CustomSectionsScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sectionId = searchParams.get('id')
  const [customSections, setCustomSections] = useState<any[]>([])
  const [selectedSection, setSelectedSection] = useState<any>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')
  const [newSectionType, setNewSectionType] = useState<'expense' | 'saving'>('expense')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (sectionId && customSections.length > 0) {
      const section = customSections.find((s) => s.id === sectionId)
      if (section) {
        setSelectedSection(section)
      }
    }
  }, [sectionId, customSections])

  const loadData = async () => {
    try {
      setInitialLoading(true)
      setError('')
      
      const familyId = getData(StorageKeys.FAMILY_ID)
      if (!familyId) {
        router.push('/auth')
        return
      }

      const sections = await getCustomSections(Number(familyId))
      setCustomSections(sections)

      if (sectionId) {
        const section = sections.find((s: any) => s.id === sectionId)
        if (section) {
          setSelectedSection(section)
        }
      }
    } catch (error: any) {
      console.error('Error loading custom sections:', error)
      setError(error.message || 'Failed to load custom sections')
    } finally {
      setInitialLoading(false)
    }
  }

  const handleAddSection = async () => {
    setError('')
    setLoading(true)

    if (!newSectionName.trim()) {
      setError('Please enter a section name')
      setLoading(false)
      return
    }

    try {
      const familyId = getData(StorageKeys.FAMILY_ID)
      if (!familyId) {
        router.push('/auth')
        return
      }

      await createCustomSection(Number(familyId), {
        name: newSectionName.trim(),
        type: newSectionType,
      })

      setNewSectionName('')
      setNewSectionType('expense')
      setShowAddDialog(false)
      setError('')
      await loadData()
    } catch (error: any) {
      console.error('Error creating section:', error)
      setError(error.message || 'Failed to create section. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section? All transactions in this section will also be deleted.')) {
      return
    }

    try {
      await deleteCustomSection(id)
      if (selectedSection?.id === id) {
        setSelectedSection(null)
        router.push('/custom-sections')
      }
      await loadData()
    } catch (error: any) {
      console.error('Error deleting section:', error)
      setError(error.message || 'Failed to delete section')
    }
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return
    }

    try {
      setError('')
      await deleteCustomSectionTransaction(transactionId)
      // Reload all data to get updated sections with transactions
      await loadData()
    } catch (error: any) {
      console.error('Error deleting transaction:', error)
      setError(error.message || 'Failed to delete transaction')
    }
  }

  const calculateTotal = (transactions: any[]) => {
    return transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (selectedSection) {
    const transactions = selectedSection.transactions || []
    const total = calculateTotal(transactions)

    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-indigo-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedSection(null)
                  router.push('/custom-sections')
                }}
                className="text-white"
              >
                ←
              </button>
              <h1 className="text-xl font-bold">{selectedSection.name}</h1>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-600 mb-1">Total</p>
            <p className="text-3xl font-bold text-indigo-600">{formatCurrency(total)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {selectedSection.type === 'expense' ? 'Expense' : 'Savings'} Section
            </p>
          </div>

          {transactions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <p className="text-gray-500 mb-2">No transactions yet</p>
              <p className="text-sm text-gray-400">
                Tap the + button to add a transaction
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions
                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((transaction: any) => (
                  <div key={transaction.id} className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-1">
                          {transaction.description || 'No description'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                          {transaction.addedBy && ` • Added by ${transaction.addedBy}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(parseFloat(transaction.amount || 0))}
                        </p>
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <Link
          href={`/add-transaction?type=${selectedSection.type}&section=${selectedSection.id}`}
          className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-indigo-700 transition-colors z-50"
        >
          +
        </Link>
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
          <h1 className="text-xl font-bold">Custom Sections</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {customSections.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-500 mb-2">No custom sections yet</p>
            <p className="text-sm text-gray-400">
              Create custom sections to organize your expenses or savings
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {customSections.map((section) => (
              <div
                key={section.id}
                className="bg-white rounded-xl shadow-sm p-4"
              >
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => {
                      setSelectedSection(section)
                      router.push(`/custom-sections?id=${section.id}`)
                    }}
                    className="flex-1 text-left"
                  >
                    <p className="font-semibold text-gray-900 mb-1">{section.name}</p>
                    <p className="text-sm text-gray-500">
                      {section.type === 'expense' ? 'Expense' : 'Savings'} • {section.transactionCount || 0} transaction{(section.transactionCount || 0) !== 1 ? 's' : ''}
                    </p>
                  </button>
                  <div className="flex items-center gap-3">
                    <p className="text-xl font-bold text-indigo-600">
                      {formatCurrency(section.total || 0)}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSection(section.id)
                      }}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete section"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowAddDialog(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-indigo-700 transition-colors z-50"
      >
        +
      </button>

      {/* Add Section Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create Custom Section</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section Name
                </label>
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter section name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['expense', 'saving'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setNewSectionType(t)}
                      className={`py-2 px-4 rounded-lg font-medium ${
                        newSectionType === t
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddDialog(false)
                    setError('')
                  }}
                  disabled={loading}
                  className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSection}
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


