'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getData, StorageKeys, deleteTransaction } from '@/lib/storage'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

export default function ExpensesScreen() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const expensesData = getData(StorageKeys.EXPENSES) || []
    const categoriesData = getData(StorageKeys.CATEGORIES) || []
    setExpenses(expensesData)
    setCategories(categoriesData)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      deleteTransaction('expense', id)
      loadData()
    }
  }

  const filteredExpenses = selectedCategory === 'All'
    ? expenses
    : expenses.filter(e => e.category === selectedCategory)

  const sortedExpenses = [...filteredExpenses].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const totalAmount = filteredExpenses.reduce(
    (sum, e) => sum + (parseFloat(e.amount) || 0),
    0
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-indigo-600 text-white p-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-white">
            ←
          </Link>
          <h1 className="text-xl font-bold">Expenses</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary Card */}
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-xs text-gray-600 mb-1">Total Expenses</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              selectedCategory === 'All'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Expenses List */}
        {sortedExpenses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-500 mb-2">No expenses found</p>
            <p className="text-sm text-gray-400">
              Tap the + button to add your first expense
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedExpenses.map((expense) => (
              <div key={expense.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">
                      {expense.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {expense.category || 'Uncategorized'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(expense.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    {expense.addedBy && (
                      <p className="text-xs text-gray-400 italic">
                        Added by {expense.addedBy}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(parseFloat(expense.amount || 0))}
                    </p>
                    <div className="flex gap-1">
                      <Link
                        href={`/add-transaction?type=expense&edit=${expense.id}`}
                        className="p-1 text-gray-400 hover:text-indigo-600"
                      >
                        ✏️
                      </Link>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link
        href="/add-transaction?type=expense"
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-indigo-700 transition-colors z-50"
      >
        +
      </Link>
    </div>
  )
}



