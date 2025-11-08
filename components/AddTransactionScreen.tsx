'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getData, StorageKeys } from '@/lib/storage'
import { 
  createExpense, 
  createSaving, 
  createCurrent,
  createDebt,
  getCategories, 
  createCategory,
  createCustomSectionTransaction
} from '@/lib/api'

export default function AddTransactionScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'expense'
  const sectionId = searchParams.get('section')
  const editId = searchParams.get('edit')

  const [transactionType, setTransactionType] = useState(type)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [goal, setGoal] = useState('')
  const [currentType, setCurrentType] = useState('credit')
  const [creditor, setCreditor] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [debtStatus, setDebtStatus] = useState<'pending' | 'paid' | 'overdue'>('pending')
  const [categories, setCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCategories()
    // Note: Edit functionality would need to be implemented with API
    // For now, we'll skip edit loading since it requires API endpoints
  }, [type])

  const loadCategories = async () => {
    try {
      const familyId = getData(StorageKeys.FAMILY_ID)
      if (familyId) {
        const categoriesData = await getCategories(Number(familyId))
        setCategories(categoriesData)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const handleSave = async () => {
    setError('')

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (transactionType === 'expense' && !category && !sectionId) {
      setError('Please select or create a category')
      return
    }

    setLoading(true)

    try {
      const familyId = getData(StorageKeys.FAMILY_ID)
      const currentUser = getData(StorageKeys.CURRENT_USER)
      const familyData = getData(StorageKeys.FAMILY_DATA)
      const userMember = familyData?.members?.find(
        (m: any) => m.email === currentUser
      )

      if (!familyId) {
        router.push('/auth')
        return
      }

      // Handle custom section transaction
      if (sectionId) {
        await createCustomSectionTransaction(sectionId, {
          amount: parseFloat(amount),
          description: description.trim() || 'No description',
          addedBy: userMember?.name || 'Unknown',
        })
        router.back()
        return
      }

      // Create new category if needed
      if (showNewCategory && newCategory.trim()) {
        try {
          await createCategory(Number(familyId), newCategory.trim())
          setCategory(newCategory.trim())
          await loadCategories()
        } catch (error) {
          console.error('Error creating category:', error)
          // Continue even if category creation fails
        }
      }

      // Handle regular transactions
      if (transactionType === 'debt') {
        await createDebt(Number(familyId), {
          amount: parseFloat(amount),
          description: description.trim() || 'No description',
          creditor: creditor.trim() || undefined,
          dueDate: dueDate || undefined,
          status: debtStatus,
          addedBy: userMember?.name || 'Unknown',
        })
      } else {
        const transactionData = {
          amount: parseFloat(amount),
          description: description.trim() || 'No description',
          addedBy: userMember?.name || 'Unknown',
          ...(transactionType === 'expense' && { category: category || 'Other' }),
          ...(transactionType === 'saving' && goal && { goal: parseFloat(goal) }),
          ...(transactionType === 'current' && { type: currentType }),
        }

        if (transactionType === 'expense') {
          await createExpense(Number(familyId), transactionData)
        } else if (transactionType === 'saving') {
          await createSaving(Number(familyId), transactionData)
        } else if (transactionType === 'current') {
          await createCurrent(Number(familyId), transactionData)
        }
      }

      router.back()
    } catch (error: any) {
      console.error('Error saving transaction:', error)
      setError(error.message || 'Failed to save transaction. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-indigo-600 text-white p-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-white">
            ←
          </Link>
          <h1 className="text-xl font-bold">
            Add Transaction
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {!type && !sectionId && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['expense', 'saving', 'debt', 'current'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTransactionType(t)}
                  className={`py-2 px-4 rounded-lg font-medium text-sm ${
                    transactionType === t
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {sectionId && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <p className="text-sm text-indigo-700">
              Adding transaction to custom section
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="0.00"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={3}
              placeholder="Enter description"
            />
          </div>

          {transactionType === 'expense' && !sectionId && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setCategory(cat)
                        setShowNewCategory(false)
                      }}
                      className={`px-3 py-1 rounded-full text-sm ${
                        category === cat
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowNewCategory(!showNewCategory)}
                  className="text-sm text-indigo-600 font-medium"
                >
                  {showNewCategory ? 'Hide' : '+ Create New Category'}
                </button>
                {showNewCategory && (
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Category name"
                  />
                )}
              </div>
            </>
          )}

          {transactionType === 'saving' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Goal Amount (Optional)
              </label>
              <input
                type="number"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          )}

          {transactionType === 'debt' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Creditor (Optional)
                </label>
                <input
                  type="text"
                  value={creditor}
                  onChange={(e) => setCreditor(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Who you owe (e.g., Bank, Credit Card)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['pending', 'paid', 'overdue'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setDebtStatus(s as 'pending' | 'paid' | 'overdue')}
                      className={`py-2 px-4 rounded-lg font-medium text-sm ${
                        debtStatus === s
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {transactionType === 'current' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['credit', 'debit'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setCurrentType(t)}
                    className={`py-2 px-4 rounded-lg font-medium ${
                      currentType === t
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save'} Transaction
          </button>
        </div>
      </div>
    </div>
  )
}


