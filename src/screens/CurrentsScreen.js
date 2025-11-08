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
  Chip,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getData, StorageKeys, deleteTransaction } from '../utils/storage';
import { format } from 'date-fns';
import { theme } from '../theme';

const CurrentsScreen = ({ navigation }) => {
  const [currents, setCurrents] = useState([]);
  const [menuVisible, setMenuVisible] = useState({});

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const currentsData = await getData(StorageKeys.CURRENTS);
    setCurrents(currentsData || []);
  };

  const handleDelete = async (id) => {
    const success = await deleteTransaction('current', id);
    if (success) {
      await loadData();
    }
  };

  const sortedCurrents = [...currents].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const totalAmount = currents.reduce(
    (sum, c) => sum + (parseFloat(c.amount) || 0),
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
            <Text style={styles.summaryLabel}>Current Account Balance</Text>
            <Text style={styles.summaryAmount}>₹{totalAmount.toFixed(2)}</Text>
            <Text style={styles.summaryCount}>
              {currents.length} entr{currents.length !== 1 ? 'ies' : 'y'}
            </Text>
          </Card.Content>
        </Card>

        {/* Currents List */}
        {sortedCurrents.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>No current account entries</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to add your first entry
              </Text>
            </Card.Content>
          </Card>
        ) : (
          sortedCurrents.map((current) => (
            <Card key={current.id} style={styles.currentCard}>
              <Card.Content>
                <View style={styles.currentHeader}>
                  <View style={styles.currentInfo}>
                    <Text style={styles.currentDescription}>
                      {current.description || 'No description'}
                    </Text>
                    <View style={styles.currentMeta}>
                      <Chip
                        mode="outlined"
                        compact
                        style={[
                          styles.typeChip,
                          current.type === 'credit' && styles.creditChip,
                          current.type === 'debit' && styles.debitChip,
                        ]}
                        textStyle={styles.typeChipText}
                      >
                        {current.type === 'credit' ? 'Credit' : 'Debit'}
                      </Chip>
                      <Text style={styles.currentDate}>
                        {format(new Date(current.createdAt), 'MMM dd, yyyy')}
                      </Text>
                    </View>
                    {current.addedBy && (
                      <Text style={styles.addedBy}>
                        Added by {current.addedBy}
                      </Text>
                    )}
                  </View>
                  <View style={styles.currentAmountContainer}>
                    <Text
                      style={[
                        styles.currentAmount,
                        current.type === 'credit' && styles.creditAmount,
                        current.type === 'debit' && styles.debitAmount,
                      ]}
                    >
                      {current.type === 'credit' ? '+' : '-'}₹
                      {parseFloat(current.amount || 0).toFixed(2)}
                    </Text>
                    <Menu
                      visible={menuVisible[current.id] || false}
                      onDismiss={() => toggleMenu(current.id)}
                      anchor={
                        <IconButton
                          icon="dots-vertical"
                          size={20}
                          onPress={() => toggleMenu(current.id)}
                        />
                      }
                    >
                      <Menu.Item
                        onPress={() => {
                          toggleMenu(current.id);
                          navigation.navigate('AddTransaction', {
                            type: 'current',
                            editData: current,
                          });
                        }}
                        title="Edit"
                        leadingIcon="pencil"
                      />
                      <Menu.Item
                        onPress={() => {
                          toggleMenu(current.id);
                          handleDelete(current.id);
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
        onPress={() => navigation.navigate('AddTransaction', { type: 'current' })}
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
    backgroundColor: '#dbeafe',
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
  currentCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  currentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  currentInfo: {
    flex: 1,
  },
  currentDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  currentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeChip: {
    marginRight: 8,
    height: 24,
  },
  creditChip: {
    backgroundColor: '#d1fae5',
  },
  debitChip: {
    backgroundColor: '#fee2e2',
  },
  typeChipText: {
    fontSize: 11,
  },
  currentDate: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  addedBy: {
    fontSize: 11,
    color: theme.colors.placeholder,
    fontStyle: 'italic',
    marginTop: 4,
  },
  currentAmountContainer: {
    alignItems: 'flex-end',
  },
  currentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  creditAmount: {
    color: theme.colors.success,
  },
  debitAmount: {
    color: theme.colors.error,
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

export default CurrentsScreen;



