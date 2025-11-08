import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Text, Button, Checkbox } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const teasers = [
    {
      title: 'Track Family Expenses',
      description: 'Easily categorize and track all your family expenses in one place',
      icon: '💰',
    },
    {
      title: 'Manage Savings',
      description: 'Keep track of your savings goals and progress',
      icon: '💵',
    },
    {
      title: 'Family Collaboration',
      description: 'Add multiple family members to track expenses together',
      icon: '👨‍👩‍👧‍👦',
    },
    {
      title: 'Custom Categories',
      description: 'Create your own expense and savings categories',
      icon: '📊',
    },
  ];

  const handleNext = async () => {
    if (currentPage < teasers.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      await handleFinish();
    }
  };

  const handleSkip = async () => {
    await handleFinish();
  };

  const handleFinish = async () => {
    try {
      if (dontShowAgain) {
        await AsyncStorage.setItem('hasLaunched', 'true');
      }
      navigation.replace('Auth');
    } catch (error) {
      console.error('Error saving launch status:', error);
      navigation.replace('Auth');
    }
  };

  return (
    <LinearGradient
      colors={['#6366f1', '#8b5cf6']}
      style={styles.container}
    >
      <View style={styles.pageContainer}>
        <View style={styles.page}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{teasers[currentPage].icon}</Text>
          </View>
          <Text style={styles.title}>{teasers[currentPage].title}</Text>
          <Text style={styles.description}>{teasers[currentPage].description}</Text>
        </View>
      </View>

      <View style={styles.pagination}>
        {teasers.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentPage && styles.activeDot,
            ]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.checkboxContainer}>
          <Checkbox
            status={dontShowAgain ? 'checked' : 'unchecked'}
            onPress={() => setDontShowAgain(!dontShowAgain)}
            color="#fff"
          />
          <TouchableOpacity onPress={() => setDontShowAgain(!dontShowAgain)}>
            <Text style={styles.checkboxLabel}>Don't show this again</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          {currentPage < teasers.length - 1 && (
            <Button
              mode="text"
              onPress={handleSkip}
              textColor="#fff"
              style={styles.skipButton}
            >
              Skip
            </Button>
          )}
          <Button
            mode="contained"
            onPress={handleNext}
            style={styles.nextButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            {currentPage === teasers.length - 1 ? 'Get Started' : 'Next'}
          </Button>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  page: {
    width,
    height: height * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#fff',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'center',
  },
  checkboxLabel: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#fff',
    marginLeft: 10,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    color: '#6366f1',
    fontWeight: 'bold',
  },
});

export default WelcomeScreen;

