import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Text,
  SegmentedButtons,
  Snackbar,
} from 'react-native-paper';
import { getData, StorageKeys, addTransaction, addCategory, setData } from '../utils/storage';
import { theme } from '../theme';

const AddTransactionScreen = ({ route, navigation }) => {
  const { type, editData } = route.params || {};
  const [transactionType, setTransactionType] = useState(type || 'expense');
  const [amount, setAmount] = useState(editData?.amount?.toString() || '');
  const [description, setDescription] = useState(editData?.description || '');
  const [category, setCategory] = useState(editData?.category || '');
  const [goal, setGoal] = useState(editData?.goal?.toString() || '');
  const [currentType, setCurrentType] = useState(editData?.type || 'credit');
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const categoriesData = await getData(StorageKeys.CATEGORIES);
    setCategories(categoriesData || []);
  };

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setSnackbarMessage('Please enter a valid amount');
      setSnackbarVisible(true);
      return;
    }

    if (transactionType === 'expense' && !category) {
      setSnackbarMessage('Please select or create a category');
      setSnackbarVisible(true);
      return;
    }

    if (showNewCategory && newCategory.trim()) {
      await addCategory(newCategory.trim());
      setCategory(newCategory.trim());
      await loadCategories();
    }

    try {
      const currentUser = await getData(StorageKeys.CURRENT_USER);
      const familyData = await getData(StorageKeys.FAMILY_DATA);
      const userMember = familyData?.members?.find(
        (m) => m.email === currentUser
      );

      const transaction = {
        amount: parseFloat(amount),
        description: description.trim() || 'No description',
        addedBy: userMember?.name || 'Unknown',
        ...(transactionType === 'expense' && { category: category || 'Other' }),
        ...(transactionType === 'saving' && goal && { goal: parseFloat(goal) }),
        ...(transactionType === 'current' && { type: currentType }),
      };

      if (editData) {
        // Update existing transaction
        const key = transactionType === 'expense' ? StorageKeys.EXPENSES :
                    transactionType === 'saving' ? StorageKeys.SAVINGS :
                    StorageKeys.CURRENTS;
        const transactions = await getData(key) || [];
        const updated = transactions.map(t =>
          t.id === editData.id ? { ...t, ...transaction } : t
        );
        await setData(key, updated);
      } else {
        await addTransaction(transactionType, transaction);
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving transaction:', error);
      setSnackbarMessage('Failed to save transaction. Please try again.');
      setSnackbarVisible(true);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!type && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.label}>Transaction Type</Text>
              <SegmentedButtons
                value={transactionType}
                onValueChange={setTransactionType}
                buttons={[
                  { value: 'expense', label: 'Expense' },
                  { value: 'saving', label: 'Saving' },
                  { value: 'current', label: 'Current' },
                ]}
                style={styles.segmentedButtons}
              />
            </Card.Content>
          </Card>
        )}

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Amount"
              value={amount}
              onChangeText={setAmount}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
              left={<TextInput.Icon icon="currency-inr" />}
            />

            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
            />

            {transactionType === 'expense' && (
              <>
                <Text style={styles.label}>Category</Text>
                {categories.length > 0 && (
                  <View style={styles.categoryButtons}>
                    {categories.map((cat) => (
                      <Button
                        key={cat}
                        mode={category === cat ? 'contained' : 'outlined'}
                        onPress={() => {
                          setCategory(cat);
                          setShowNewCategory(false);
                        }}
                        style={styles.categoryButton}
                        compact
                      >
                        {cat}
                      </Button>
                    ))}
                  </View>
                )}

                <Button
                  mode="text"
                  onPress={() => setShowNewCategory(!showNewCategory)}
                  icon={showNewCategory ? 'chevron-up' : 'chevron-down'}
                  style={styles.newCategoryButton}
                >
                  {showNewCategory ? 'Hide' : 'Create New Category'}
                </Button>

                {showNewCategory && (
                  <TextInput
                    label="New Category Name"
                    value={newCategory}
                    onChangeText={setNewCategory}
                    mode="outlined"
                    style={styles.input}
                    autoCapitalize="words"
                  />
                )}
              </>
            )}

            {transactionType === 'saving' && (
              <TextInput
                label="Goal Amount (Optional)"
                value={goal}
                onChangeText={setGoal}
                mode="outlined"
                keyboardType="decimal-pad"
                style={styles.input}
                left={<TextInput.Icon icon="target" />}
              />
            )}

            {transactionType === 'current' && (
              <>
                <Text style={styles.label}>Transaction Type</Text>
                <SegmentedButtons
                  value={currentType}
                  onValueChange={setCurrentType}
                  buttons={[
                    { value: 'credit', label: 'Credit' },
                    { value: 'debit', label: 'Debit' },
                  ]}
                  style={styles.segmentedButtons}
                />
              </>
            )}
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveButton}
          contentStyle={styles.buttonContent}
        >
          {editData ? 'Update' : 'Save'} Transaction
        </Button>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  categoryButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  newCategoryButton: {
    marginBottom: 8,
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 32,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default AddTransactionScreen;

