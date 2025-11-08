import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Text,
  FAB,
  Chip,
  IconButton,
  Menu,
  Divider,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getData, StorageKeys, deleteTransaction } from '../utils/storage';
import { format } from 'date-fns';
import { theme } from '../theme';

const ExpensesScreen = ({ navigation }) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [menuVisible, setMenuVisible] = useState({});

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const [expensesData, categoriesData] = await Promise.all([
      getData(StorageKeys.EXPENSES),
      getData(StorageKeys.CATEGORIES),
    ]);
    setExpenses(expensesData || []);
    setCategories(categoriesData || []);
  };

  const handleDelete = async (id) => {
    const success = await deleteTransaction('expense', id);
    if (success) {
      await loadData();
    }
  };

  const filteredExpenses = selectedCategory === 'All'
    ? expenses
    : expenses.filter(e => e.category === selectedCategory);

  const sortedExpenses = [...filteredExpenses].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const totalAmount = filteredExpenses.reduce(
    (sum, e) => sum + (parseFloat(e.amount) || 0),
    0
  );

  const toggleMenu = (id) => {
    setMenuVisible({ ...menuVisible, [id]: !menuVisible[id] });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
            <Text style={styles.summaryAmount}>₹{totalAmount.toFixed(2)}</Text>
            <Text style={styles.summaryCount}>
              {filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? 's' : ''}
            </Text>
          </Card.Content>
        </Card>

        {/* Category Filter */}
        <View style={styles.categoryFilter}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Chip
              selected={selectedCategory === 'All'}
              onPress={() => setSelectedCategory('All')}
              style={styles.chip}
            >
              All
            </Chip>
            {categories.map((category) => (
              <Chip
                key={category}
                selected={selectedCategory === category}
                onPress={() => setSelectedCategory(category)}
                style={styles.chip}
              >
                {category}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {/* Expenses List */}
        {sortedExpenses.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>No expenses found</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to add your first expense
              </Text>
            </Card.Content>
          </Card>
        ) : (
          sortedExpenses.map((expense) => (
            <Card key={expense.id} style={styles.expenseCard}>
              <Card.Content>
                <View style={styles.expenseHeader}>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseDescription}>
                      {expense.description || 'No description'}
                    </Text>
                    <View style={styles.expenseMeta}>
                      <Chip
                        mode="outlined"
                        compact
                        style={styles.categoryChip}
                        textStyle={styles.categoryChipText}
                      >
                        {expense.category || 'Uncategorized'}
                      </Chip>
                      <Text style={styles.expenseDate}>
                        {format(new Date(expense.createdAt), 'MMM dd, yyyy')}
                      </Text>
                    </View>
                    {expense.addedBy && (
                      <Text style={styles.addedBy}>
                        Added by {expense.addedBy}
                      </Text>
                    )}
                  </View>
                  <View style={styles.expenseAmountContainer}>
                    <Text style={styles.expenseAmount}>
                      ₹{parseFloat(expense.amount || 0).toFixed(2)}
                    </Text>
                    <Menu
                      visible={menuVisible[expense.id] || false}
                      onDismiss={() => toggleMenu(expense.id)}
                      anchor={
                        <IconButton
                          icon="dots-vertical"
                          size={20}
                          onPress={() => toggleMenu(expense.id)}
                        />
                      }
                    >
                      <Menu.Item
                        onPress={() => {
                          toggleMenu(expense.id);
                          navigation.navigate('AddTransaction', {
                            type: 'expense',
                            editData: expense,
                          });
                        }}
                        title="Edit"
                        leadingIcon="pencil"
                      />
                      <Menu.Item
                        onPress={() => {
                          toggleMenu(expense.id);
                          handleDelete(expense.id);
                        }}
                        title="Delete"
                        leadingIcon="delete"
                      />
                    </Menu>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddTransaction', { type: 'expense' })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#fee2e2',
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  categoryFilter: {
    paddingVertical: 12,
    paddingLeft: 16,
  },
  chip: {
    marginRight: 8,
  },
  expenseCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  expenseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryChip: {
    marginRight: 8,
    height: 24,
  },
  categoryChipText: {
    fontSize: 11,
  },
  expenseDate: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  addedBy: {
    fontSize: 11,
    color: theme.colors.placeholder,
    fontStyle: 'italic',
    marginTop: 4,
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginBottom: 8,
  },
  emptyCard: {
    margin: 16,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.placeholder,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.placeholder,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default ExpensesScreen;



