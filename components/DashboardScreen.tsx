'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { getData, setData, StorageKeys } from '@/lib/storage'
import { getFamilyByEmail, getExpenses, getSavings, getCurrents, getDebts, getCustomSections } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { format, subDays, isPast, isToday } from 'date-fns'

export default function DashboardScreen() {
  const router = useRouter()
  const { data: session } = useSession()
  const [familyData, setFamilyData] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [savings, setSavings] = useState<any[]>([])
  const [currents, setCurrents] = useState<any[]>([])
  const [debts, setDebts] = useState<any[]>([])
  const [customSections, setCustomSections] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/auth' })
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch family data (email is extracted from authenticated session)
      // This will fail if user is not authenticated or not in a family
      const family = await getFamilyByEmail()
      setFamilyData(family)
      
      const familyId = family.id
      
      // Get user email from session (primary source) or fallback to stored/localStorage
      const sessionEmail = session?.user?.email
      const storedEmail = getData(StorageKeys.CURRENT_USER)
      const userEmail = sessionEmail || storedEmail || family.members?.find((m: any) => m.email === sessionEmail)?.email

      if (!familyId) {
        router.push('/auth')
        return
      }

      setCurrentUser(userEmail || sessionEmail)
      
      // Update localStorage with family ID and email for quick access
      if (sessionEmail) {
        setData(StorageKeys.CURRENT_USER, sessionEmail)
      }
      setData(StorageKeys.FAMILY_ID, familyId)

      // Fetch all data in parallel
      const [expensesData, savingsData, currentsData, debtsData, customSectionsData] = await Promise.all([
        getExpenses(familyId),
        getSavings(familyId),
        getCurrents(familyId),
        getDebts(familyId),
        getCustomSections(familyId),
      ])

      setExpenses(expensesData)
      setSavings(savingsData)
      setCurrents(currentsData)
      setDebts(debtsData)
      setCustomSections(customSectionsData)
    } catch (error: any) {
      console.error('Error loading data:', error)
      setError(error.message || 'Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = (transactions: any[]) => {
    return transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
  }

  const calculateRecentTotal = (transactions: any[], days: number = 7) => {
    const cutoffDate = subDays(new Date(), days)
    return transactions
      .filter((t) => new Date(t.createdAt) >= cutoffDate)
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
  }

  const totalExpenses = calculateTotal(expenses)
  const totalSavings = calculateTotal(savings)
  const totalCurrents = calculateTotal(currents)
  const totalDebts = calculateTotal(debts.filter((d: any) => d.status === 'pending' || d.status === 'overdue'))
  const weeklyExpenses = calculateRecentTotal(expenses, 7)
  const monthlyExpenses = calculateRecentTotal(expenses, 30)

  const getCategoryBreakdown = () => {
    const breakdown: Record<string, number> = {}
    expenses.forEach((expense) => {
      const category = expense.category || 'Other'
      breakdown[category] = (breakdown[category] || 0) + (parseFloat(expense.amount) || 0)
    })
    return breakdown
  }

  const categoryBreakdown = getCategoryBreakdown()
  const topCategories = Object.entries(categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

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
            onClick={loadData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!familyData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">No family data found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-indigo-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
              {familyData?.familyName?.charAt(0).toUpperCase() || 'F'}
            </div>
            <div>
              <h1 className="font-bold text-lg">{familyData?.familyName || 'Family'}</h1>
              <p className="text-sm text-indigo-100">
                {familyData?.members?.length || 0} member{(familyData?.members?.length || 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/family-members"
              className="text-sm bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30 transition-colors"
            >
              Manage
            </Link>
            {session?.user?.email && (
              <button
                onClick={handleSignOut}
                className="text-sm bg-indigo-700 hover:bg-indigo-800 px-3 py-1 rounded transition-colors"
                title="Sign Out"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-xs text-gray-600 mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
            <p className="text-xs text-gray-500 mt-1">{formatCurrency(weeklyExpenses)} this week</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-xs text-gray-600 mb-1">Total Savings</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSavings)}</p>
            <p className="text-xs text-gray-500 mt-1">{savings.length} entries</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4">
            <p className="text-xs text-gray-600 mb-1">Outstanding Debts</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalDebts)}</p>
            <p className="text-xs text-gray-500 mt-1">{debts.filter((d: any) => d.status === 'pending' || d.status === 'overdue').length} active</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs text-gray-600 mb-1">Current Account</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCurrents)}</p>
            <p className="text-xs text-gray-500 mt-1">Balance</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            <Link
              href="/add-transaction?type=expense"
              className="flex flex-col items-center p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <span className="text-3xl mb-2">💸</span>
              <span className="text-xs font-medium text-gray-700">Add Expense</span>
            </Link>
            <Link
              href="/add-transaction?type=saving"
              className="flex flex-col items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <span className="text-3xl mb-2">💰</span>
              <span className="text-xs font-medium text-gray-700">Add Saving</span>
            </Link>
            <Link
              href="/add-transaction?type=debt"
              className="flex flex-col items-center p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <span className="text-3xl mb-2">💳</span>
              <span className="text-xs font-medium text-gray-700">Add Debt</span>
            </Link>
          </div>
        </div>

        {/* Top Categories */}
        {topCategories.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Top Expense Categories</h2>
            <div className="space-y-3">
              {topCategories.map(([category, amount]) => (
                <div key={category}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{category}</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(amount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${(amount / totalExpenses) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/expenses"
            className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center hover:shadow-md transition-shadow"
          >
            <span className="text-3xl mb-2">📊</span>
            <span className="text-sm font-medium text-gray-700">Expenses</span>
          </Link>
          <Link
            href="/savings"
            className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center hover:shadow-md transition-shadow"
          >
            <span className="text-3xl mb-2">💵</span>
            <span className="text-sm font-medium text-gray-700">Savings</span>
          </Link>
          <Link
            href="/debts"
            className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center hover:shadow-md transition-shadow"
          >
            <span className="text-3xl mb-2">💳</span>
            <span className="text-sm font-medium text-gray-700">Debts</span>
          </Link>
          <Link
            href="/currents"
            className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center hover:shadow-md transition-shadow"
          >
            <span className="text-3xl mb-2">💳</span>
            <span className="text-sm font-medium text-gray-700">Currents</span>
          </Link>
        </div>

        {/* Recent Debts */}
        {debts.filter((d: any) => d.status === 'pending' || d.status === 'overdue').length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-900">Outstanding Debts</h2>
              <Link
                href="/debts"
                className="text-sm text-indigo-600 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="space-y-2">
              {debts
                .filter((d: any) => d.status === 'pending' || d.status === 'overdue')
                .slice(0, 3)
                .map((debt: any) => (
                  <div
                    key={debt.id}
                    className="flex justify-between items-center p-2 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(parseFloat(debt.amount))}
                      </p>
                      <p className="text-xs text-gray-500">
                        {debt.creditor || debt.description || 'Debt'}
                        {debt.dueDate && ` • Due: ${format(new Date(debt.dueDate), 'MMM dd')}`}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded font-medium ${
                        debt.status === 'overdue' || 
                        (debt.dueDate && isPast(new Date(debt.dueDate)) && !isToday(new Date(debt.dueDate)))
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {debt.status === 'overdue' || 
                       (debt.dueDate && isPast(new Date(debt.dueDate)) && !isToday(new Date(debt.dueDate)))
                        ? 'Overdue'
                        : 'Pending'}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Custom Sections */}
        {customSections.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-900">Custom Sections</h2>
              <Link
                href="/custom-sections"
                className="text-sm text-indigo-600 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="space-y-2">
              {customSections.slice(0, 3).map((section) => {
                const sectionTotal = calculateTotal(section.transactions || [])
                return (
                  <Link
                    key={section.id}
                    href={`/custom-sections?id=${section.id}`}
                    className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{section.name}</p>
                      <p className="text-xs text-gray-500">
                        {section.type === 'expense' ? 'Expense' : 'Savings'} • {formatCurrency(sectionTotal)}
                      </p>
                    </div>
                    <span className="text-gray-400">→</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Link
        href="/add-transaction"
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-indigo-700 transition-colors z-50"
      >
        +
      </Link>
    </div>
  )
}

