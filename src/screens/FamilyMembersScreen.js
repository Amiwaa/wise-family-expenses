import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  TextInput,
  Avatar,
  Chip,
  Snackbar,
  Dialog,
  Portal,
} from 'react-native-paper';
import { getData, StorageKeys, addFamilyMember, setData } from '../utils/storage';
import { theme } from '../theme';

const FamilyMembersScreen = ({ navigation }) => {
  const [familyData, setFamilyData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [family, user] = await Promise.all([
      getData(StorageKeys.FAMILY_DATA),
      getData(StorageKeys.CURRENT_USER),
    ]);
    setFamilyData(family);
    setCurrentUser(user);
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !newMemberName.trim()) {
      setSnackbarMessage('Please fill in all fields');
      setSnackbarVisible(true);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMemberEmail)) {
      setSnackbarMessage('Please enter a valid email address');
      setSnackbarVisible(true);
      return;
    }

    const success = await addFamilyMember(newMemberEmail, newMemberName);
    if (success) {
      setSnackbarMessage('Family member added successfully');
      setSnackbarVisible(true);
      setNewMemberEmail('');
      setNewMemberName('');
      setShowAddDialog(false);
      await loadData();
    } else {
      setSnackbarMessage('Failed to add member. Email may already exist.');
      setSnackbarVisible(true);
    }
  };

  const isAdmin = familyData?.members?.find(
    (m) => m.email === currentUser
  )?.isAdmin || false;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.familyCard}>
          <Card.Content>
            <View style={styles.familyHeader}>
              <Avatar.Text
                size={60}
                label={familyData?.familyName?.charAt(0).toUpperCase() || 'F'}
                style={styles.familyAvatar}
              />
              <View style={styles.familyInfo}>
                <Text style={styles.familyName}>{familyData?.familyName}</Text>
                <Text style={styles.memberCount}>
                  {familyData?.members?.length || 0} member
                  {(familyData?.members?.length || 0) !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {isAdmin && (
          <Card style={styles.card}>
            <Card.Content>
              <Button
                mode="contained"
                icon="account-plus"
                onPress={() => setShowAddDialog(true)}
                style={styles.addButton}
              >
                Add Family Member
              </Button>
            </Card.Content>
          </Card>
        )}

        {!isAdmin && (
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text style={styles.infoText}>
                Only family admins can add new members
              </Text>
            </Card.Content>
          </Card>
        )}

        <Card style={styles.card}>
          <Card.Title title="Family Members" />
          <Card.Content>
            {familyData?.members?.map((member, index) => (
              <View
                key={member.email}
                style={[
                  styles.memberItem,
                  index < (familyData.members.length - 1) && styles.memberItemBorder,
                ]}
              >
                <Avatar.Text
                  size={40}
                  label={member.name.charAt(0).toUpperCase()}
                  style={styles.memberAvatar}
                />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                </View>
                <View style={styles.memberBadges}>
                  {member.isAdmin && (
                    <Chip
                      mode="flat"
                      style={styles.adminChip}
                      textStyle={styles.adminChipText}
                    >
                      Admin
                    </Chip>
                  )}
                  {member.email === currentUser && (
                    <Chip
                      mode="flat"
                      style={styles.currentUserChip}
                      textStyle={styles.currentUserChipText}
                    >
                      You
                    </Chip>
                  )}
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      </ScrollView>

      <Portal>
        <Dialog
          visible={showAddDialog}
          onDismiss={() => setShowAddDialog(false)}
        >
          <Dialog.Title>Add Family Member</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Member Name"
              value={newMemberName}
              onChangeText={setNewMemberName}
              mode="outlined"
              style={styles.dialogInput}
              autoCapitalize="words"
            />
            <TextInput
              label="Email Address"
              value={newMemberEmail}
              onChangeText={setNewMemberEmail}
              mode="outlined"
              style={styles.dialogInput}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Text style={styles.dialogHint}>
              The member will be able to join the family using this email address.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onPress={handleAddMember}>Add</Button>
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
  familyCard: {
    margin: 16,
    marginBottom: 8,
  },
  familyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  familyAvatar: {
    backgroundColor: theme.colors.primary,
    marginRight: 16,
  },
  familyInfo: {
    flex: 1,
  },
  familyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  card: {
    margin: 16,
    marginTop: 8,
  },
  infoCard: {
    margin: 16,
    marginTop: 8,
    backgroundColor: '#fef3c7',
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
  },
  addButton: {
    marginTop: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  memberItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },
  memberAvatar: {
    backgroundColor: theme.colors.accent,
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  memberBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  adminChip: {
    backgroundColor: theme.colors.primary,
  },
  adminChipText: {
    color: '#fff',
    fontSize: 11,
  },
  currentUserChip: {
    backgroundColor: theme.colors.accent,
  },
  currentUserChipText: {
    color: '#fff',
    fontSize: 11,
  },
  dialogInput: {
    marginBottom: 16,
  },
  dialogHint: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginTop: 8,
  },
});

export default FamilyMembersScreen;



