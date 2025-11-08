export const StorageKeys = {
  FAMILY_DATA: 'familyData', // Legacy - kept for backward compatibility
  FAMILY_ID: 'familyId', // New - stores family ID from database
  CURRENT_USER: 'currentUser',
  EXPENSES: 'expenses', // Legacy
  SAVINGS: 'savings', // Legacy
  CURRENTS: 'currents', // Legacy
  CUSTOM_SECTIONS: 'customSections', // Legacy
  CATEGORIES: 'categories', // Legacy
  HAS_LAUNCHED: 'hasLaunched',
};

export const getData = (key: string): any => {
  if (typeof window === 'undefined') return null;
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Error getting data for key ${key}:`, error);
    return null;
  }
};

export const setData = (key: string, value: any): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting data for key ${key}:`, error);
    return false;
  }
};

export const addFamilyMember = (email: string, name: string): boolean => {
  try {
    const familyData = getData(StorageKeys.FAMILY_DATA);
    if (!familyData) return false;

    const existingMember = familyData.members.find(
      (m: any) => m.email.toLowerCase() === email.toLowerCase()
    );

    if (existingMember) {
      return false;
    }

    familyData.members.push({
      email: email.toLowerCase(),
      name: name.trim(),
      isAdmin: false,
      joinedAt: new Date().toISOString(),
    });

    return setData(StorageKeys.FAMILY_DATA, familyData);
  } catch (error) {
    console.error('Error adding family member:', error);
    return false;
  }
};

export const addTransaction = (type: 'expense' | 'saving' | 'current', transaction: any): boolean => {
  try {
    const key = type === 'expense' ? StorageKeys.EXPENSES :
                type === 'saving' ? StorageKeys.SAVINGS :
                StorageKeys.CURRENTS;

    const transactions = getData(key) || [];
    const newTransaction = {
      id: Date.now().toString(),
      ...transaction,
      createdAt: new Date().toISOString(),
    };

    transactions.push(newTransaction);
    return setData(key, transactions);
  } catch (error) {
    console.error(`Error adding ${type} transaction:`, error);
    return false;
  }
};

export const deleteTransaction = (type: 'expense' | 'saving' | 'current', transactionId: string): boolean => {
  try {
    const key = type === 'expense' ? StorageKeys.EXPENSES :
                type === 'saving' ? StorageKeys.SAVINGS :
                StorageKeys.CURRENTS;

    const transactions = getData(key) || [];
    const filtered = transactions.filter((t: any) => t.id !== transactionId);
    return setData(key, filtered);
  } catch (error) {
    console.error(`Error deleting ${type} transaction:`, error);
    return false;
  }
};

// Custom sections are now managed via API - see lib/api.ts

export const addCategory = (category: string): boolean => {
  try {
    const categories = getData(StorageKeys.CATEGORIES) || [];
    if (!categories.includes(category)) {
      categories.push(category);
      return setData(StorageKeys.CATEGORIES, categories);
    }
    return true;
  } catch (error) {
    console.error('Error adding category:', error);
    return false;
  }
};

