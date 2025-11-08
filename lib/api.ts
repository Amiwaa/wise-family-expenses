// API client functions to interact with the backend
// Note: NextAuth automatically handles authentication via HTTP-only cookies
// No need to manually add auth headers

const API_BASE = '/api'

// Helper to get headers (credentials: 'include' ensures cookies are sent)
function getHeaders() {
  return {
    'Content-Type': 'application/json',
  }
}

export async function createFamily(familyName: string, memberName: string) {
  const response = await fetch(`${API_BASE}/families`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ familyName, memberName }),
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create family')
  }
  return response.json()
}

export async function getFamilyByEmail(email?: string) {
  // Email is now extracted from the authenticated session on the server
  const response = await fetch(`${API_BASE}/families`, {
    headers: getHeaders(),
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch family')
  }
  return response.json()
}

export async function addFamilyMember(familyId: number, email: string, name: string) {
  const response = await fetch(`${API_BASE}/families/members`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ familyId, email, name }),
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to add family member')
  }
  return response.json()
}

export async function getExpenses(familyId: number, category?: string) {
  const params = new URLSearchParams({ familyId: familyId.toString() })
  if (category) params.append('category', category)
  const response = await fetch(`${API_BASE}/expenses?${params}`, {
    headers: getHeaders(),
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch expenses')
  }
  return response.json()
}

export async function createExpense(familyId: number, expense: any) {
  const response = await fetch(`${API_BASE}/expenses`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ familyId, ...expense }),
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create expense')
  }
  return response.json()
}

export async function deleteExpense(id: string) {
  const response = await fetch(`${API_BASE}/expenses?id=${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete expense')
  }
  return response.json()
}

export async function getSavings(familyId: number) {
  const response = await fetch(`${API_BASE}/savings?familyId=${familyId}`, {
    headers: getHeaders(),
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch savings')
  }
  return response.json()
}

export async function createSaving(familyId: number, saving: any) {
  const response = await fetch(`${API_BASE}/savings`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ familyId, ...saving }),
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create saving')
  }
  return response.json()
}

export async function deleteSaving(id: string) {
  const response = await fetch(`${API_BASE}/savings?id=${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete saving')
  }
  return response.json()
}

export async function getCurrents(familyId: number) {
  const response = await fetch(`${API_BASE}/currents?familyId=${familyId}`, {
    headers: getHeaders(),
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch currents')
  }
  return response.json()
}

export async function createCurrent(familyId: number, current: any) {
  const response = await fetch(`${API_BASE}/currents`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ familyId, ...current }),
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create current')
  }
  return response.json()
}

export async function deleteCurrent(id: string) {
  const response = await fetch(`${API_BASE}/currents?id=${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete current')
  }
  return response.json()
}

export async function getCategories(familyId: number) {
  const response = await fetch(`${API_BASE}/categories?familyId=${familyId}`, {
    headers: getHeaders(),
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch categories')
  }
  return response.json()
}

export async function createCategory(familyId: number, name: string) {
  const response = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ familyId, name }),
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create category')
  }
  return response.json()
}

// Debts API
export async function getDebts(familyId: number) {
  const response = await fetch(`${API_BASE}/debts?familyId=${familyId}`, {
    headers: getHeaders(),
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch debts')
  }
  return response.json()
}

export async function createDebt(familyId: number, debt: {
  amount: number
  description?: string
  creditor?: string
  dueDate?: string
  status?: 'pending' | 'paid' | 'overdue'
  addedBy?: string
}) {
  const response = await fetch(`${API_BASE}/debts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ familyId, ...debt }),
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create debt')
  }
  return response.json()
}

export async function deleteDebt(id: string) {
  const response = await fetch(`${API_BASE}/debts?id=${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete debt')
  }
  return response.json()
}

// Custom Sections API
export async function getCustomSections(familyId: number) {
  const response = await fetch(`${API_BASE}/custom-sections?familyId=${familyId}`, {
    headers: getHeaders(),
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch custom sections')
  }
  return response.json()
}

export async function createCustomSection(familyId: number, section: { name: string; type: 'expense' | 'saving' }) {
  const response = await fetch(`${API_BASE}/custom-sections`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ familyId, ...section }),
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create custom section')
  }
  return response.json()
}

export async function deleteCustomSection(id: string) {
  const response = await fetch(`${API_BASE}/custom-sections?id=${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete custom section')
  }
  return response.json()
}

// Custom Section Transactions API
export async function getCustomSectionTransactions(sectionId: string) {
  const response = await fetch(`${API_BASE}/custom-sections/transactions?sectionId=${sectionId}`, {
    headers: getHeaders(),
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch transactions')
  }
  return response.json()
}

export async function createCustomSectionTransaction(sectionId: string, transaction: { amount: number; description?: string; addedBy?: string }) {
  const response = await fetch(`${API_BASE}/custom-sections/transactions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ sectionId, ...transaction }),
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create transaction')
  }
  return response.json()
}

export async function deleteCustomSectionTransaction(id: string) {
  const response = await fetch(`${API_BASE}/custom-sections/transactions?id=${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete transaction')
  }
  return response.json()
}


