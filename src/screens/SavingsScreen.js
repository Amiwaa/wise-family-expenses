import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Card,
  Text,
  FAB,
  IconButton,
  Menu,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getData, StorageKeys, deleteTransaction } from '../utils/storage';
import { format } from 'date-fns';
import { theme } from '../theme';

const SavingsScreen = ({ navigation }) => {
  const [savings, setSavings] = useState([]);
  const [menuVisible, setMenuVisible] = useState({});

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const savingsData = await getData(StorageKeys.SAVINGS);
    setSavings(savingsData || []);
  };

  const handleDelete = async (id) => {
    const success = await deleteTransaction('saving', id);
    if (success) {
      await loadData();
    }
  };

  const sortedSavings = [...savings].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const totalAmount = savings.reduce(
    (sum, s) => sum + (parseFloat(s.amount) || 0),
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
            <Text style={styles.summaryLabel}>Total Savings</Text>
            <Text style={styles.summaryAmount}>₹{totalAmount.toFixed(2)}</Text>
            <Text style={styles.summaryCount}>
              {savings.length} entr{savings.length !== 1 ? 'ies' : 'y'}
            </Text>
          </Card.Content>
        </Card>

        {/* Savings List */}
        {sortedSavings.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>No savings recorded</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to add your first savings entry
              </Text>
            </Card.Content>
          </Card>
        ) : (
          sortedSavings.map((saving) => (
            <Card key={saving.id} style={styles.savingCard}>
              <Card.Content>
                <View style={styles.savingHeader}>
                  <View style={styles.savingInfo}>
                    <Text style={styles.savingDescription}>
                      {saving.description || 'No description'}
                    </Text>
                    <View style={styles.savingMeta}>
                      <Text style={styles.savingDate}>
                        {format(new Date(saving.createdAt), 'MMM dd, yyyy')}
                      </Text>
                      {saving.addedBy && (
                        <Text style={styles.addedBy}>
                          • Added by {saving.addedBy}
                        </Text>
                      )}
                    </View>
                    {saving.goal && (
                      <Text style={styles.goalText}>
                        Goal: ₹{parseFloat(saving.goal || 0).toFixed(2)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.savingAmountContainer}>
                    <Text style={styles.savingAmount}>
                      ₹{parseFloat(saving.amount || 0).toFixed(2)}
                    </Text>
                    <Menu
                      visible={menuVisible[saving.id] || false}
                      onDismiss={() => toggleMenu(saving.id)}
                      anchor={
                        <IconButton
                          icon="dots-vertical"
                          size={20}
                          onPress={() => toggleMenu(saving.id)}
                        />
                      }
                    >
                      <Menu.Item
                        onPress={() => {
                          toggleMenu(saving.id);
                          navigation.navigate('AddTransaction', {
                            type: 'saving',
                            editData: saving,
                          });
                        }}
                        title="Edit"
                        leadingIcon="pencil"
                      />
                      <Menu.Item
                        onPress={() => {
                          toggleMenu(saving.id);
                          handleDelete(saving.id);
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
        onPress={() => navigation.navigate('AddTransaction', { type: 'saving' })}
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
    backgroundColor: '#d1fae5',
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
  savingCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  savingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  savingInfo: {
    flex: 1,
  },
  savingDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  savingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  savingDate: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  addedBy: {
    fontSize: 11,
    color: theme.colors.placeholder,
    fontStyle: 'italic',
    marginLeft: 8,
  },
  goalText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  savingAmountContainer: {
    alignItems: 'flex-end',
  },
  savingAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.success,
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

export default SavingsScreen;



