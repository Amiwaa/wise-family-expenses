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
  Button,
  TextInput,
  FAB,
  IconButton,
  Menu,
  Dialog,
  Portal,
  SegmentedButtons,
  Snackbar,
} from 'react-native-paper';
import { getData, StorageKeys, addCustomSection, setData, deleteTransaction } from '../utils/storage';
import { format } from 'date-fns';
import { theme } from '../theme';

const CustomSectionsScreen = ({ route, navigation }) => {
  const { sectionId } = route.params || {};
  const [customSections, setCustomSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionType, setNewSectionType] = useState('expense');
  const [menuVisible, setMenuVisible] = useState({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    loadData();
    if (sectionId) {
      // If navigating to a specific section, find and select it
      loadData().then(() => {
        const section = customSections.find(s => s.id === sectionId);
        if (section) {
          setSelectedSection(section);
        }
      });
    }
  }, [sectionId]);

  const loadData = async () => {
    const sections = await getData(StorageKeys.CUSTOM_SECTIONS);
    setCustomSections(sections || []);
    if (sectionId && !selectedSection) {
      const section = (sections || []).find(s => s.id === sectionId);
      if (section) {
        setSelectedSection(section);
      }
    }
  };

  const handleAddSection = async () => {
    if (!newSectionName.trim()) {
      setSnackbarMessage('Please enter a section name');
      setSnackbarVisible(true);
      return;
    }

    const success = await addCustomSection({
      name: newSectionName.trim(),
      type: newSectionType,
    });

    if (success) {
      setSnackbarMessage('Custom section created successfully');
      setSnackbarVisible(true);
      setNewSectionName('');
      setShowAddDialog(false);
      await loadData();
    } else {
      setSnackbarMessage('Failed to create section. Please try again.');
      setSnackbarVisible(true);
    }
  };

  const handleDeleteSection = async (id) => {
    try {
      const sections = await getData(StorageKeys.CUSTOM_SECTIONS) || [];
      const filtered = sections.filter(s => s.id !== id);
      await setData(StorageKeys.CUSTOM_SECTIONS, filtered);
      if (selectedSection?.id === id) {
        setSelectedSection(null);
      }
      await loadData();
    } catch (error) {
      console.error('Error deleting section:', error);
    }
  };

  const handleAddTransaction = async (sectionId, amount, description) => {
    try {
      const sections = await getData(StorageKeys.CUSTOM_SECTIONS) || [];
      const section = sections.find(s => s.id === sectionId);
      if (!section) return;

      const currentUser = await getData(StorageKeys.CURRENT_USER);
      const familyData = await getData(StorageKeys.FAMILY_DATA);
      const userMember = familyData?.members?.find(
        (m) => m.email === currentUser
      );

      const transaction = {
        id: Date.now().toString(),
        amount: parseFloat(amount),
        description: description || 'No description',
        addedBy: userMember?.name || 'Unknown',
        createdAt: new Date().toISOString(),
      };

      section.transactions = section.transactions || [];
      section.transactions.push(transaction);

      const updated = sections.map(s =>
        s.id === sectionId ? section : s
      );
      await setData(StorageKeys.CUSTOM_SECTIONS, updated);
      await loadData();
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleDeleteTransaction = async (sectionId, transactionId) => {
    try {
      const sections = await getData(StorageKeys.CUSTOM_SECTIONS) || [];
      const section = sections.find(s => s.id === sectionId);
      if (!section) return;

      section.transactions = (section.transactions || []).filter(
        t => t.id !== transactionId
      );

      const updated = sections.map(s =>
        s.id === sectionId ? section : s
      );
      await setData(StorageKeys.CUSTOM_SECTIONS, updated);
      await loadData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const toggleMenu = (id) => {
    setMenuVisible({ ...menuVisible, [id]: !menuVisible[id] });
  };

  if (selectedSection) {
    const transactions = selectedSection.transactions || [];
    const total = transactions.reduce(
      (sum, t) => sum + (parseFloat(t.amount) || 0),
      0
    );

    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <Card style={styles.headerCard}>
            <Card.Content>
              <View style={styles.headerRow}>
                <View style={styles.headerInfo}>
                  <Text style={styles.sectionTitle}>{selectedSection.name}</Text>
                  <Text style={styles.sectionType}>
                    {selectedSection.type === 'expense' ? 'Expense' : 'Savings'} Section
                  </Text>
                </View>
                <Button
                  mode="text"
                  onPress={() => setSelectedSection(null)}
                  icon="arrow-left"
                >
                  Back
                </Button>
              </View>
              <Text style={styles.totalAmount}>₹{total.toFixed(2)}</Text>
            </Card.Content>
          </Card>

          {transactions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyText}>No transactions yet</Text>
                <Text style={styles.emptySubtext}>
                  Tap the + button to add a transaction
                </Text>
              </Card.Content>
            </Card>
          ) : (
            transactions
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((transaction) => (
                <Card key={transaction.id} style={styles.transactionCard}>
                  <Card.Content>
                    <View style={styles.transactionHeader}>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionDescription}>
                          {transaction.description || 'No description'}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                        </Text>
                        {transaction.addedBy && (
                          <Text style={styles.addedBy}>
                            Added by {transaction.addedBy}
                          </Text>
                        )}
                      </View>
                      <View style={styles.transactionAmountContainer}>
                        <Text style={styles.transactionAmount}>
                          ₹{parseFloat(transaction.amount || 0).toFixed(2)}
                        </Text>
                        <Menu
                          visible={menuVisible[transaction.id] || false}
                          onDismiss={() => toggleMenu(transaction.id)}
                          anchor={
                            <IconButton
                              icon="dots-vertical"
                              size={20}
                              onPress={() => toggleMenu(transaction.id)}
                            />
                          }
                        >
                          <Menu.Item
                            onPress={() => {
                              toggleMenu(transaction.id);
                              handleDeleteTransaction(selectedSection.id, transaction.id);
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
          onPress={() => {
            // Simple add transaction dialog
            navigation.navigate('AddTransaction', {
              type: selectedSection.type,
              customSectionId: selectedSection.id,
            });
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {customSections.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>No custom sections yet</Text>
              <Text style={styles.emptySubtext}>
                Create custom sections to organize your expenses or savings
              </Text>
            </Card.Content>
          </Card>
        ) : (
          customSections.map((section) => {
            const transactions = section.transactions || [];
            const total = transactions.reduce(
              (sum, t) => sum + (parseFloat(t.amount) || 0),
              0
            );

            return (
              <Card
                key={section.id}
                style={styles.sectionCard}
              >
                <Card.Content>
                  <TouchableOpacity
                    onPress={() => setSelectedSection(section)}
                    style={styles.sectionTouchable}
                  >
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionInfo}>
                        <Text style={styles.sectionName}>{section.name}</Text>
                        <Text style={styles.sectionType}>
                          {section.type === 'expense' ? 'Expense' : 'Savings'} • {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      <View style={styles.sectionAmountContainer}>
                        <Text style={styles.sectionAmount}>
                          ₹{total.toFixed(2)}
                        </Text>
                        <Menu
                          visible={menuVisible[section.id] || false}
                          onDismiss={() => toggleMenu(section.id)}
                          anchor={
                            <IconButton
                              icon="dots-vertical"
                              size={20}
                              onPress={() => toggleMenu(section.id)}
                            />
                          }
                        >
                          <Menu.Item
                            onPress={() => {
                              toggleMenu(section.id);
                              handleDeleteSection(section.id);
                            }}
                            title="Delete"
                            leadingIcon="delete"
                          />
                        </Menu>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setShowAddDialog(true)}
      />

      <Portal>
        <Dialog
          visible={showAddDialog}
          onDismiss={() => setShowAddDialog(false)}
        >
          <Dialog.Title>Create Custom Section</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Section Name"
              value={newSectionName}
              onChangeText={setNewSectionName}
              mode="outlined"
              style={styles.dialogInput}
              autoCapitalize="words"
            />
            <Text style={styles.dialogLabel}>Section Type</Text>
            <SegmentedButtons
              value={newSectionType}
              onValueChange={setNewSectionType}
              buttons={[
                { value: 'expense', label: 'Expense' },
                { value: 'saving', label: 'Savings' },
              ]}
              style={styles.segmentedButtons}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onPress={handleAddSection}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
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
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  sectionType: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  sectionCard: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTouchable: {
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionInfo: {
    flex: 1,
  },
  sectionName: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  sectionAmountContainer: {
    alignItems: 'flex-end',
  },
  sectionAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  transactionCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  transactionDate: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginBottom: 4,
  },
  addedBy: {
    fontSize: 11,
    color: theme.colors.placeholder,
    fontStyle: 'italic',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
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
  dialogInput: {
    marginBottom: 16,
  },
  dialogLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 8,
  },
  segmentedButtons: {
    marginTop: 8,
  },
});

export default CustomSectionsScreen;



