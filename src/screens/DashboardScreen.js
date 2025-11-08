import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  FAB,
  Avatar,
  Chip,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getData, StorageKeys } from '../utils/storage';
import { format, subDays } from 'date-fns';
import { theme } from '../theme';

const DashboardScreen = ({ navigation }) => {
  const [familyData, setFamilyData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [savings, setSavings] = useState([]);
  const [currents, setCurrents] = useState([]);
  const [customSections, setCustomSections] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [family, expensesData, savingsData, currentsData, customSectionsData, user] = await Promise.all([
        getData(StorageKeys.FAMILY_DATA),
        getData(StorageKeys.EXPENSES),
        getData(StorageKeys.SAVINGS),
        getData(StorageKeys.CURRENTS),
        getData(StorageKeys.CUSTOM_SECTIONS),
        getData(StorageKeys.CURRENT_USER),
      ]);

      setFamilyData(family);
      setExpenses(expensesData || []);
      setSavings(savingsData || []);
      setCurrents(currentsData || []);
      setCustomSections(customSectionsData || []);
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const calculateTotal = (transactions) => {
    return transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  };

  const calculateRecentTotal = (transactions, days = 7) => {
    const cutoffDate = subDays(new Date(), days);
    return transactions
      .filter(t => new Date(t.createdAt) >= cutoffDate)
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  };

  const totalExpenses = calculateTotal(expenses);
  const totalSavings = calculateTotal(savings);
  const totalCurrents = calculateTotal(currents);
  const weeklyExpenses = calculateRecentTotal(expenses, 7);
  const monthlyExpenses = calculateRecentTotal(expenses, 30);

  const getCategoryBreakdown = () => {
    const breakdown = {};
    expenses.forEach(expense => {
      const category = expense.category || 'Other';
      breakdown[category] = (breakdown[category] || 0) + (parseFloat(expense.amount) || 0);
    });
    return breakdown;
  };

  const categoryBreakdown = getCategoryBreakdown();
  const topCategories = Object.entries(categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Family Header */}
        {familyData && (
          <Card style={styles.familyCard}>
            <Card.Content>
              <View style={styles.familyHeader}>
                <Avatar.Text
                  size={50}
                  label={familyData.familyName.charAt(0).toUpperCase()}
                  style={styles.avatar}
                />
                <View style={styles.familyInfo}>
                  <Text style={styles.familyName}>{familyData.familyName}</Text>
                  <Text style={styles.memberCount}>
                    {familyData.members.length} member{familyData.members.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Button
                  mode="text"
                  icon="account-group"
                  onPress={() => navigation.navigate('FamilyMembers')}
                  compact
                >
                  Manage
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <Card style={[styles.summaryCard, styles.expenseCard]}>
            <Card.Content>
              <Text style={styles.summaryLabel}>Total Expenses</Text>
              <Text style={styles.summaryAmount}>₹{totalExpenses.toFixed(2)}</Text>
              <Text style={styles.summarySubtext}>
                ₹{weeklyExpenses.toFixed(2)} this week
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.summaryCard, styles.savingsCard]}>
            <Card.Content>
              <Text style={styles.summaryLabel}>Total Savings</Text>
              <Text style={styles.summaryAmount}>₹{totalSavings.toFixed(2)}</Text>
              <Text style={styles.summarySubtext}>
                {savings.length} entries
              </Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.summaryRow}>
          <Card style={[styles.summaryCard, styles.currentCard]}>
            <Card.Content>
              <Text style={styles.summaryLabel}>Current Account</Text>
              <Text style={styles.summaryAmount}>₹{totalCurrents.toFixed(2)}</Text>
              <Text style={styles.summarySubtext}>
                {currents.length} entries
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.summaryCard, styles.monthlyCard]}>
            <Card.Content>
              <Text style={styles.summaryLabel}>Monthly Expenses</Text>
              <Text style={styles.summaryAmount}>₹{monthlyExpenses.toFixed(2)}</Text>
              <Text style={styles.summarySubtext}>
                Last 30 days
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Actions */}
        <Card style={styles.card}>
          <Card.Title title="Quick Actions" />
          <Card.Content>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => navigation.navigate('AddTransaction', { type: 'expense' })}
              >
                <Text style={styles.quickActionIcon}>💸</Text>
                <Text style={styles.quickActionText}>Add Expense</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => navigation.navigate('AddTransaction', { type: 'saving' })}
              >
                <Text style={styles.quickActionIcon}>💰</Text>
                <Text style={styles.quickActionText}>Add Saving</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => navigation.navigate('AddTransaction', { type: 'current' })}
              >
                <Text style={styles.quickActionIcon}>💳</Text>
                <Text style={styles.quickActionText}>Add Current</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Top Categories */}
        {topCategories.length > 0 && (
          <Card style={styles.card}>
            <Card.Title title="Top Expense Categories" />
            <Card.Content>
              {topCategories.map(([category, amount], index) => (
                <View key={category} style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category}</Text>
                    <Text style={styles.categoryAmount}>₹{amount.toFixed(2)}</Text>
                  </View>
                  <View style={styles.categoryBar}>
                    <View
                      style={[
                        styles.categoryBarFill,
                        {
                          width: `${(amount / totalExpenses) * 100}%`,
                          backgroundColor: theme.colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Custom Sections */}
        {customSections.length > 0 && (
          <Card style={styles.card}>
            <Card.Title title="Custom Sections" />
            <Card.Content>
              {customSections.map((section) => {
                const sectionTotal = calculateTotal(section.transactions || []);
                return (
                  <TouchableOpacity
                    key={section.id}
                    style={styles.customSectionItem}
                    onPress={() => navigation.navigate('CustomSections', { sectionId: section.id })}
                  >
                    <View>
                      <Text style={styles.customSectionName}>{section.name}</Text>
                      <Text style={styles.customSectionType}>
                        {section.type === 'expense' ? 'Expense' : 'Savings'} • ₹{sectionTotal.toFixed(2)}
                      </Text>
                    </View>
                    <Text style={styles.arrow}>→</Text>
                  </TouchableOpacity>
                );
              })}
            </Card.Content>
          </Card>
        )}

        {/* Navigation Cards */}
        <View style={styles.navigationRow}>
          <TouchableOpacity
            style={styles.navCard}
            onPress={() => navigation.navigate('Expenses')}
          >
            <Text style={styles.navCardIcon}>📊</Text>
            <Text style={styles.navCardText}>Expenses</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navCard}
            onPress={() => navigation.navigate('Savings')}
          >
            <Text style={styles.navCardIcon}>💵</Text>
            <Text style={styles.navCardText}>Savings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navCard}
            onPress={() => navigation.navigate('Currents')}
          >
            <Text style={styles.navCardIcon}>💳</Text>
            <Text style={styles.navCardText}>Currents</Text>
          </TouchableOpacity>
        </View>

        {customSections.length > 0 && (
          <TouchableOpacity
            style={styles.navCardFull}
            onPress={() => navigation.navigate('CustomSections')}
          >
            <Text style={styles.navCardIcon}>⚙️</Text>
            <Text style={styles.navCardText}>Custom Sections</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddTransaction')}
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
  familyCard: {
    margin: 16,
    marginBottom: 8,
  },
  familyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginRight: 12,
  },
  familyInfo: {
    flex: 1,
  },
  familyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  memberCount: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  summaryCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  expenseCard: {
    backgroundColor: '#fee2e2',
  },
  savingsCard: {
    backgroundColor: '#d1fae5',
  },
  currentCard: {
    backgroundColor: '#dbeafe',
  },
  monthlyCard: {
    backgroundColor: '#f3e8ff',
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 11,
    color: theme.colors.placeholder,
  },
  card: {
    margin: 16,
    marginTop: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
    padding: 12,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: theme.colors.text,
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  categoryAmount: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  categoryBar: {
    height: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  customSectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },
  customSectionName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  customSectionType: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginTop: 4,
  },
  arrow: {
    fontSize: 20,
    color: theme.colors.placeholder,
  },
  navigationRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  navCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  navCardFull: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 2,
  },
  navCardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  navCardText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default DashboardScreen;



