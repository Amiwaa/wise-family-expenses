import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  FAMILY_DATA: 'familyData',
  CURRENT_USER: 'currentUser',
  EXPENSES: 'expenses',
  SAVINGS: 'savings',
  CURRENTS: 'currents',
  CUSTOM_SECTIONS: 'customSections',
  CATEGORIES: 'categories',
  HAS_LAUNCHED: 'hasLaunched',
};

export const getData = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Error getting data for key ${key}:`, error);
    return null;
  }
};

export const setData = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting data for key ${key}:`, error);
    return false;
  }
};

export const addFamilyMember = async (email, name) => {
  try {
    const familyData = await getData(StorageKeys.FAMILY_DATA);
    if (!familyData) return false;

    const existingMember = familyData.members.find(
      (m) => m.email.toLowerCase() === email.toLowerCase()
    );

    if (existingMember) {
      return false; // Member already exists
    }

    familyData.members.push({
      email: email.toLowerCase(),
      name: name.trim(),
      isAdmin: false,
      joinedAt: new Date().toISOString(),
    });

    await setData(StorageKeys.FAMILY_DATA, familyData);
    return true;
  } catch (error) {
    console.error('Error adding family member:', error);
    return false;
  }
};

export const addTransaction = async (type, transaction) => {
  try {
    const key = type === 'expense' ? StorageKeys.EXPENSES :
                type === 'saving' ? StorageKeys.SAVINGS :
                type === 'current' ? StorageKeys.CURRENTS : null;

    if (!key) return false;

    const transactions = await getData(key) || [];
    const newTransaction = {
      id: Date.now().toString(),
      ...transaction,
      createdAt: new Date().toISOString(),
    };

    transactions.push(newTransaction);
    await setData(key, transactions);
    return true;
  } catch (error) {
    console.error(`Error adding ${type} transaction:`, error);
    return false;
  }
};

export const deleteTransaction = async (type, transactionId) => {
  try {
    const key = type === 'expense' ? StorageKeys.EXPENSES :
                type === 'saving' ? StorageKeys.SAVINGS :
                type === 'current' ? StorageKeys.CURRENTS : null;

    if (!key) return false;

    const transactions = await getData(key) || [];
    const filtered = transactions.filter(t => t.id !== transactionId);
    await setData(key, filtered);
    return true;
  } catch (error) {
    console.error(`Error deleting ${type} transaction:`, error);
    return false;
  }
};

export const addCustomSection = async (section) => {
  try {
    const sections = await getData(StorageKeys.CUSTOM_SECTIONS) || [];
    const newSection = {
      id: Date.now().toString(),
      name: section.name,
      type: section.type, // 'expense' or 'saving'
      transactions: [],
      createdAt: new Date().toISOString(),
    };
    sections.push(newSection);
    await setData(StorageKeys.CUSTOM_SECTIONS, sections);
    return true;
  } catch (error) {
    console.error('Error adding custom section:', error);
    return false;
  }
};

export const addCategory = async (category) => {
  try {
    const categories = await getData(StorageKeys.CATEGORIES) || [];
    if (!categories.includes(category)) {
      categories.push(category);
      await setData(StorageKeys.CATEGORIES, categories);
    }
    return true;
  } catch (error) {
    console.error('Error adding category:', error);
    return false;
  }
};

