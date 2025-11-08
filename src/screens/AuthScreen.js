import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput, Button, Text, Card, Snackbar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';

const AuthScreen = ({ navigation }) => {
  const [familyName, setFamilyName] = useState('');
  const [email, setEmail] = useState('');
  const [memberName, setMemberName] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleCreateFamily = async () => {
    if (!familyName.trim() || !email.trim() || !memberName.trim()) {
      setSnackbarMessage('Please fill in all fields');
      setSnackbarVisible(true);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSnackbarMessage('Please enter a valid email address');
      setSnackbarVisible(true);
      return;
    }

    try {
      const familyData = {
        familyName: familyName.trim(),
        members: [
          {
            email: email.trim().toLowerCase(),
            name: memberName.trim(),
            isAdmin: true,
            joinedAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('familyData', JSON.stringify(familyData));
      await AsyncStorage.setItem('currentUser', email.trim().toLowerCase());
      
      // Initialize empty data structures
      await AsyncStorage.setItem('expenses', JSON.stringify([]));
      await AsyncStorage.setItem('savings', JSON.stringify([]));
      await AsyncStorage.setItem('currents', JSON.stringify([]));
      await AsyncStorage.setItem('customSections', JSON.stringify([]));
      await AsyncStorage.setItem('categories', JSON.stringify([
        'Food & Dining',
        'Transportation',
        'Shopping',
        'Bills & Utilities',
        'Entertainment',
        'Healthcare',
        'Education',
        'Other',
      ]));

      navigation.replace('Dashboard');
    } catch (error) {
      console.error('Error creating family:', error);
      setSnackbarMessage('Failed to create family. Please try again.');
      setSnackbarVisible(true);
    }
  };

  const handleJoinFamily = async () => {
    try {
      const familyDataStr = await AsyncStorage.getItem('familyData');
      if (!familyDataStr) {
        setSnackbarMessage('No family found. Please create a family first.');
        setSnackbarVisible(true);
        return;
      }

      const familyData = JSON.parse(familyDataStr);
      const existingMember = familyData.members.find(
        (m) => m.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (existingMember) {
        await AsyncStorage.setItem('currentUser', email.trim().toLowerCase());
        navigation.replace('Dashboard');
      } else {
        setSnackbarMessage('Email not found in family. Please contact your family admin.');
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.error('Error joining family:', error);
      setSnackbarMessage('Failed to join family. Please try again.');
      setSnackbarVisible(true);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logo}>💰</Text>
          <Text style={styles.title}>Wise Family Expenses</Text>
          <Text style={styles.subtitle}>Track and manage your family finances</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Family Name"
              value={familyName}
              onChangeText={setFamilyName}
              mode="outlined"
              style={styles.input}
              autoCapitalize="words"
            />

            <TextInput
              label="Your Name"
              value={memberName}
              onChangeText={setMemberName}
              mode="outlined"
              style={styles.input}
              autoCapitalize="words"
            />

            <TextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Button
              mode="contained"
              onPress={handleCreateFamily}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Create Family
            </Button>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              mode="outlined"
              onPress={handleJoinFamily}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Join Existing Family
            </Button>
          </Card.Content>
        </Card>
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.placeholder,
    textAlign: 'center',
  },
  card: {
    elevation: 4,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.placeholder,
  },
  dividerText: {
    marginHorizontal: 16,
    color: theme.colors.placeholder,
    fontSize: 14,
  },
});

export default AuthScreen;

