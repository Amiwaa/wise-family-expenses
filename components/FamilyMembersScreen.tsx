'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getData, setData, StorageKeys } from '@/lib/storage'
import { getFamilyByEmail, addFamilyMember } from '@/lib/api'

export default function FamilyMembersScreen() {
  const router = useRouter()
  const [familyData, setFamilyData] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberName, setNewMemberName] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Fetch fresh family data from API (email is extracted from authenticated session)
      const family = await getFamilyByEmail()
      setFamilyData(family)
      
      const userEmail = getData(StorageKeys.CURRENT_USER) || family.members?.[0]?.email
      const familyId = family.id
      
      if (!userEmail || !familyId) {
        router.push('/auth')
        return
      }

      setCurrentUser(userEmail)
      
      // Update localStorage for quick access
      setData(StorageKeys.CURRENT_USER, userEmail)
      setData(StorageKeys.FAMILY_ID, familyId)
    } catch (error: any) {
      console.error('Error loading family data:', error)
      const errorMessage = error.message || 'Failed to load family data'
      setError(errorMessage)
      
      // If unauthorized or authentication error, redirect to auth
      if (errorMessage.includes('Authentication') || errorMessage.includes('Unauthorized') || errorMessage.includes('401') || errorMessage.includes('403')) {
        router.push('/auth')
        return
      }
    }
  }

  const handleAddMember = async () => {
    setError('')
    setSuccess('')
    setLoading(true)

    if (!newMemberEmail.trim() || !newMemberName.trim()) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newMemberEmail)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      const familyId = getData(StorageKeys.FAMILY_ID)
      if (!familyId) {
        router.push('/auth')
        return
      }

      await addFamilyMember(Number(familyId), newMemberEmail.trim(), newMemberName.trim())
      
      setSuccess('Family member added successfully')
      setNewMemberEmail('')
      setNewMemberName('')
      setShowAddDialog(false)
      await loadData()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      console.error('Error adding family member:', error)
      setError(error.message || 'Failed to add member. Email may already exist.')
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = familyData?.members?.find(
    (m: any) => m.email === currentUser
  )?.isAdmin || false

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-indigo-600 text-white p-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-white">
            ←
          </Link>
          <h1 className="text-xl font-bold">Family Members</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
              {familyData?.familyName?.charAt(0).toUpperCase() || 'F'}
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-900">{familyData?.familyName}</h2>
              <p className="text-sm text-gray-500">
                {familyData?.members?.length || 0} member{(familyData?.members?.length || 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {isAdmin ? (
            <button
              onClick={() => setShowAddDialog(true)}
              className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + Add Family Member
            </button>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm text-center">
              Only family admins can add new members
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Family Members</h2>
          <div className="space-y-3">
            {familyData?.members?.map((member: any, index: number) => (
              <div
                key={member.email}
                className={`flex items-center gap-3 ${
                  index < familyData.members.length - 1 ? 'pb-3 border-b border-gray-100' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
                <div className="flex gap-2">
                  {member.isAdmin && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded font-medium">
                      Admin
                    </span>
                  )}
                  {member.email === currentUser && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded font-medium">
                      You
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Member Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add Family Member</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Name
                </label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter member name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>
              <p className="text-xs text-gray-500">
                The member will be able to join the family using this email address.
              </p>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddDialog(false)
                    setError('')
                    setSuccess('')
                  }}
                  className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


