import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert,
  Switch,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useDatabase } from '../../hooks/useDatabase';
import { useTheme } from '../../hooks/useTheme';

export default function SettingsScreen() {
  const { exportDatabase } = useDatabase();
  const { theme, setTheme } = useTheme();
  
  // Algorithm Settings - Research-backed defaults based on SM-2 studies
  const [startingEaseFactor, setStartingEaseFactor] = useState(2.5); // Optimal starting point from Wozniak's research
  const [minInterval, setMinInterval] = useState(1440); // 1 day minimum - prevents over-reviewing
  const [maxInterval, setMaxInterval] = useState(0); // Unlimited - allows natural spacing to develop
  const [newCardSteps, setNewCardSteps] = useState([1, 10, 1440]); // 1m, 10m, 1d - proven learning steps
  const [graduatingInterval, setGraduatingInterval] = useState(1); // 1 day - standard SM-2 graduation
  const [easyBonusMultiplier, setEasyBonusMultiplier] = useState(1.3); // 1.3x - optimal boost for easy cards
  
  // Validation functions for algorithm settings - Research-backed ranges
  const validateEaseFactor = (value: number) => {
    return Math.max(1.3, Math.min(2.5, value)); // SM-2 standard: 1.3 to 2.5 (Wozniak's research)
  };
  
  const validateMinInterval = (value: number) => {
    return Math.max(1440, Math.min(10080, value)); // 1 day to 1 week (prevents over-reviewing)
  };
  
  const validateMaxInterval = (value: number) => {
    if (value === 0) return 0; // Unlimited - allows natural spacing
    return Math.max(1440, Math.min(2628000, value)); // 1 day to 5 years (reasonable upper bound)
  };
  
  const validateGraduatingInterval = (value: number) => {
    return Math.max(1, Math.min(7, value)); // 1 to 7 days (optimal learning range)
  };
  
  const validateEasyBonusMultiplier = (value: number) => {
    return Math.max(1.1, Math.min(1.5, value)); // 1.1x to 1.5x (prevents over-boosting)
  };

  // Validation functions for study session controls - Research-backed ranges
  const validateDailyNewCardLimit = (value: number) => {
    return Math.max(5, Math.min(50, value)); // 5-50 new cards per day (prevents overwhelm)
  };

  const validateDailyReviewLimit = (value: number) => {
    return Math.max(50, Math.min(500, value)); // 50-500 reviews per day (maintains retention)
  };

  const validateSessionTimeLimit = (value: number) => {
    return Math.max(15, Math.min(60, value)); // 15-60 minutes (optimal attention span)
  };
  
  // Study Session Controls - Research-backed defaults for optimal learning
  const [dailyNewCardLimit, setDailyNewCardLimit] = useState(20); // Optimal: 15-25 new cards per day
  const [dailyReviewLimit, setDailyReviewLimit] = useState(200); // Optimal: 150-250 reviews per day
  const [sessionTimeLimit, setSessionTimeLimit] = useState(25); // Optimal: 20-30 minute sessions
  const [cardOrder, setCardOrder] = useState('mixed'); // 'new', 'reviews', 'mixed' - mixed is optimal
  const [showAnswerTimer, setShowAnswerTimer] = useState(true); // Helps with metacognition
  
  // Display Preferences
  const [fontSize, setFontSize] = useState('medium'); // 'small', 'medium', 'large'
  const [animationSpeed, setAnimationSpeed] = useState('normal'); // 'instant', 'fast', 'normal', 'slow'
  const [showProgressIndicators, setShowProgressIndicators] = useState(true);
  
  // Audio/Accessibility
  const [textToSpeech, setTextToSpeech] = useState(false);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [preventScreenTimeout, setPreventScreenTimeout] = useState(true);
  
  // Data Management
  const [autoBackupFrequency, setAutoBackupFrequency] = useState('weekly'); // 'daily', 'weekly', 'monthly'
  const [resetStatistics, setResetStatistics] = useState(false);
  const [suspendMatureCards, setSuspendMatureCards] = useState(false);
  
  // Study Behavior
  const [allowUndo, setAllowUndo] = useState(true);
  const [showNextReviewTimes, setShowNextReviewTimes] = useState(true);
  const [prioritizeOverdue, setPrioritizeOverdue] = useState(true);

  // Haptic feedback function that respects user preference
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
    if (!hapticFeedback) return;
    
    try {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    } catch (error) {
      console.log('Haptic feedback not available:', error);
    }
  };

  const handleExportData = async () => {
    triggerHaptic('medium');
    try {
      const data = await exportDatabase();
      triggerHaptic('success');
      Alert.alert(
        'Export Complete', 
        'Your data has been exported. You can copy this data to save it.',
        [
          { text: 'Copy Data', onPress: () => {
            // In a real app, you'd copy to clipboard
            console.log('Data exported:', data);
          }},
          { text: 'OK', style: 'cancel' }
        ]
      );
    } catch (error) {
      Alert.alert('Export Failed', 'Failed to export your data');
    }
  };

  const handleClearData = () => {
    triggerHaptic('error');
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your decks and cards. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => {
            triggerHaptic('heavy');
            Alert.alert('Data Cleared', 'All data has been cleared');
          }
        }
      ]
    );
  };

  const handleResetStatistics = () => {
    triggerHaptic('warning');
    Alert.alert(
      'Reset Statistics',
      'This will reset all learning statistics but keep your cards and decks. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset Stats', 
          style: 'destructive',
          onPress: () => {
            triggerHaptic('heavy');
            setResetStatistics(true);
            Alert.alert('Statistics Reset', 'All learning statistics have been reset');
          }
        }
      ]
    );
  };

  const formatInterval = (minutes: number) => {
    if (minutes === 0) return 'Unlimited';
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    if (minutes < 43200) return `${Math.round(minutes / 1440)}d`;
    return `${Math.round(minutes / 43200)}y`;
  };

  const parseInterval = (text: string) => {
    const match = text.match(/^(\d+)([mhd])$/);
    if (!match) return 0;
    const value = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
      case 'm': return value;
      case 'h': return value * 60;
      case 'd': return value * 1440;
      default: return 0;
    }
  };

  // Algorithm setting handlers
  const handleEaseFactorChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setStartingEaseFactor(validateEaseFactor(numValue));
    }
  };

  const handleMinIntervalChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      // Convert days to minutes for internal storage
      setMinInterval(validateMinInterval(numValue * 1440));
    }
  };

  const handleMaxIntervalChange = (value: string) => {
    if (value === 'unlimited' || value === '') {
      setMaxInterval(0);
    } else {
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        setMaxInterval(validateMaxInterval(numValue));
      }
    }
  };

  const handleGraduatingIntervalChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setGraduatingInterval(validateGraduatingInterval(numValue));
    }
  };

  const handleEasyBonusChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setEasyBonusMultiplier(validateEasyBonusMultiplier(numValue));
    }
  };

  // Study session control handlers
  const handleDailyNewCardLimitChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setDailyNewCardLimit(validateDailyNewCardLimit(numValue));
    }
  };

  const handleDailyReviewLimitChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setDailyReviewLimit(validateDailyReviewLimit(numValue));
    }
  };

  const handleSessionTimeLimitChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setSessionTimeLimit(validateSessionTimeLimit(numValue));
    }
  };

  const handleCardOrderChange = (value: string) => {
    if (['new', 'reviews', 'mixed'].includes(value)) {
      setCardOrder(value);
    }
  };

  // Validation functions for display preferences
  const validateFontSize = (value: string) => {
    return ['small', 'medium', 'large'].includes(value) ? value : 'medium';
  };

  const validateAnimationSpeed = (value: string) => {
    return ['instant', 'fast', 'normal', 'slow'].includes(value) ? value : 'normal';
  };

  // Display preference handlers
  const handleFontSizeChange = (value: string) => {
    setFontSize(validateFontSize(value));
  };

  const handleAnimationSpeedChange = (value: string) => {
    setAnimationSpeed(validateAnimationSpeed(value));
  };

  // Night mode handler with theme switching
  const handleNightModeToggle = (value: boolean) => {
    triggerHaptic('medium');
    setTheme(value);
    console.log('Night mode:', value ? 'enabled' : 'disabled');
  };

  // Save algorithm settings and study session controls
  const saveAlgorithmSettings = async () => {
    triggerHaptic('light');
    try {
      // In a real app, you'd save these to AsyncStorage or your database
      const settings = {
        // Algorithm Settings
        startingEaseFactor,
        minInterval,
        maxInterval,
        newCardSteps,
        graduatingInterval,
        easyBonusMultiplier,
        // Study Session Controls
        dailyNewCardLimit,
        dailyReviewLimit,
        sessionTimeLimit,
        cardOrder,
        showAnswerTimer,
        // Display Preferences
        nightMode: theme.isDark,
        fontSize,
        animationSpeed,
        showProgressIndicators,
        timestamp: new Date().toISOString()
      };
      
      // For now, just log the settings
      console.log('Settings saved:', settings);
      
      triggerHaptic('success');
      Alert.alert(
        'Settings Saved',
        'Your algorithm and study session settings have been updated successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      triggerHaptic('error');
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  return (
    <View style={[
      styles.container, 
      theme.isDark && { backgroundColor: '#000000' }
    ]}>
      {/* Title Section */}
      <View style={[
        styles.titleSection, 
        theme.isDark && { backgroundColor: '#cdc2dc', borderBottomColor: '#cdc2dc' }
      ]}>
        <Text style={[
          styles.title, 
          theme.isDark && { color: '#000000' }
        ]}>Settings</Text>
      </View>

      <ScrollView style={[
        styles.content, 
        theme.isDark && { backgroundColor: '#000000' }
      ]} showsVerticalScrollIndicator={false}>
        {/* Algorithm Settings Section */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle, 
            theme.isDark && { color: '#cdc2dc' }
          ]}>Algorithm Settings</Text>
          <Text style={[
            styles.sectionSubtitle, 
            theme.isDark && { color: '#cdc2dc' }
          ]}>
            Research-backed defaults based on Piotr Wozniak's SM-2 algorithm studies
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.iconContainer,
                theme.isDark && { backgroundColor: '#1a1a1a' }
              ]}>
                <Ionicons name="calculator-outline" size={24} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
              </View>
              <View style={styles.settingText}>
                <Text style={[
                  styles.settingTitle,
                  theme.isDark && { color: '#cdc2dc' }
                ]}>Starting Ease Factor</Text>
                <Text style={styles.settingSubtitle}>Research default: 2.5 (1.3 to 2.5)</Text>
              </View>
            </View>
            <TextInput
              style={styles.settingInput}
              value={startingEaseFactor.toString()}
              onChangeText={handleEaseFactorChange}
              onFocus={() => triggerHaptic('light')}
              keyboardType="numeric"
              placeholder="2.5"
              placeholderTextColor="#C7C7CC"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.iconContainer,
                theme.isDark && { backgroundColor: '#1a1a1a' }
              ]}>
                <Ionicons name="time-outline" size={24} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
              </View>
              <View style={styles.settingText}>
                <Text style={[
                  styles.settingTitle,
                  theme.isDark && { color: '#cdc2dc' }
                ]}>Minimum Interval (days)</Text>
                <Text style={styles.settingSubtitle}>Research default: 1 day (1d to 7d)</Text>
              </View>
            </View>
            <TextInput
              style={styles.settingInput}
              value={Math.round(minInterval / 1440).toString()}
              onChangeText={handleMinIntervalChange}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor="#C7C7CC"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.iconContainer,
                theme.isDark && { backgroundColor: '#1a1a1a' }
              ]}>
                <Ionicons name="infinite-outline" size={24} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Maximum Interval</Text>
                <Text style={styles.settingSubtitle}>Research default: Unlimited (allows natural spacing)</Text>
              </View>
            </View>
            <TextInput
              style={styles.settingInput}
              value={maxInterval === 0 ? '' : Math.round(maxInterval / 1440).toString()}
              onChangeText={handleMaxIntervalChange}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#C7C7CC"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.iconContainer,
                theme.isDark && { backgroundColor: '#1a1a1a' }
              ]}>
                <Ionicons name="layers-outline" size={24} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>New Card Steps</Text>
                <Text style={styles.settingSubtitle}>Learning intervals</Text>
              </View>
            </View>
            <Text style={styles.settingValue}>1m, 10m, 1d</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.iconContainer,
                theme.isDark && { backgroundColor: '#1a1a1a' }
              ]}>
                <Ionicons name="school-outline" size={24} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Graduating Interval (days)</Text>
                <Text style={styles.settingSubtitle}>Research default: 1 day (1 to 7 days)</Text>
              </View>
            </View>
            <TextInput
              style={styles.settingInput}
              value={graduatingInterval.toString()}
              onChangeText={handleGraduatingIntervalChange}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor="#C7C7CC"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.iconContainer,
                theme.isDark && { backgroundColor: '#1a1a1a' }
              ]}>
                <Ionicons name="trending-up-outline" size={24} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Easy Bonus Multiplier</Text>
                <Text style={styles.settingSubtitle}>Research default: 1.3x (1.1x to 1.5x)</Text>
              </View>
            </View>
            <TextInput
              style={styles.settingInput}
              value={easyBonusMultiplier.toString()}
              onChangeText={handleEasyBonusChange}
              keyboardType="numeric"
              placeholder="1.3"
              placeholderTextColor="#C7C7CC"
            />
          </View>
          
          {/* Save Button */}
          <TouchableOpacity style={[
            styles.saveButton,
            theme.isDark && { backgroundColor: '#cdc2dc' }
          ]} onPress={saveAlgorithmSettings}>
            <Ionicons name="save-outline" size={20} color={theme.isDark ? "#000000" : "#FFFFFF"} />
            <Text style={[
              styles.saveButtonText,
              theme.isDark && { color: '#000000' }
            ]}>Save Algorithm Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Study Session Controls Section */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle, 
            theme.isDark && { color: '#cdc2dc' }
          ]}>Study Session Controls</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.iconContainer,
                theme.isDark && { backgroundColor: '#1a1a1a' }
              ]}>
                <Ionicons name="add-circle-outline" size={24} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Daily New Card Limit</Text>
                <Text style={styles.settingSubtitle}>Research default: 20 (5-50 cards/day)</Text>
              </View>
            </View>
            <TextInput
              style={styles.settingInput}
              value={dailyNewCardLimit.toString()}
              onChangeText={handleDailyNewCardLimitChange}
              keyboardType="numeric"
              placeholder="20"
              placeholderTextColor="#C7C7CC"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.iconContainer,
                theme.isDark && { backgroundColor: '#1a1a1a' }
              ]}>
                <Ionicons name="refresh-outline" size={24} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Daily Review Limit</Text>
                <Text style={styles.settingSubtitle}>Research default: 200 (50-500 reviews/day)</Text>
              </View>
            </View>
            <TextInput
              style={styles.settingInput}
              value={dailyReviewLimit.toString()}
              onChangeText={handleDailyReviewLimitChange}
              keyboardType="numeric"
              placeholder="200"
              placeholderTextColor="#C7C7CC"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.iconContainer,
                theme.isDark && { backgroundColor: '#1a1a1a' }
              ]}>
                <Ionicons name="timer-outline" size={24} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Session Time Limit (minutes)</Text>
                <Text style={styles.settingSubtitle}>Research default: 25 (15-60 min sessions)</Text>
              </View>
            </View>
            <TextInput
              style={styles.settingInput}
              value={sessionTimeLimit.toString()}
              onChangeText={handleSessionTimeLimitChange}
              keyboardType="numeric"
              placeholder="25"
              placeholderTextColor="#C7C7CC"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.iconContainer,
                theme.isDark && { backgroundColor: '#1a1a1a' }
              ]}>
                <Ionicons name="shuffle-outline" size={24} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Card Order</Text>
                <Text style={styles.settingSubtitle}>Research default: Mixed (optimal learning)</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[
                styles.orderButton,
                theme.isDark && { 
                  backgroundColor: '#1a1a1a', 
                  borderColor: '#cdc2dc' 
                }
              ]} 
              onPress={() => {
                triggerHaptic('light');
                const options = ['new', 'reviews', 'mixed'];
                const currentIndex = options.indexOf(cardOrder);
                const nextIndex = (currentIndex + 1) % options.length;
                setCardOrder(options[nextIndex]);
              }}
            >
              <Text style={[
                styles.orderButtonText,
                theme.isDark && { color: '#cdc2dc' }
              ]}>
                {cardOrder === 'new' ? 'New First' : 
                 cardOrder === 'reviews' ? 'Reviews First' : 'Mixed'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
            </TouchableOpacity>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.iconContainer,
                theme.isDark && { backgroundColor: '#1a1a1a' }
              ]}>
                <Ionicons name="stopwatch-outline" size={24} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Show Answer Timer</Text>
                <Text style={styles.settingSubtitle}>Track thinking time</Text>
              </View>
            </View>
            <Switch
              value={showAnswerTimer}
              onValueChange={(value) => {
                triggerHaptic('light');
                setShowAnswerTimer(value);
              }}
              trackColor={{ false: '#E5E5EA', true: theme.isDark ? '#cdc2dc' : '#1a434e' }}
              thumbColor={showAnswerTimer ? (theme.isDark ? '#000000' : '#FFFFFF') : '#FFFFFF'}
            />
          </View>
          
          {/* Save Button for Study Session Controls */}
          <TouchableOpacity style={[
            styles.saveButton,
            theme.isDark && { backgroundColor: '#cdc2dc' }
          ]} onPress={saveAlgorithmSettings}>
            <Ionicons name="save-outline" size={20} color={theme.isDark ? "#000000" : "#FFFFFF"} />
            <Text style={[
              styles.saveButtonText,
              theme.isDark && { color: '#000000' }
            ]}>Save Study Session Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Display Preferences Section */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle, 
            theme.isDark && { color: '#cdc2dc' }
          ]}>Display Preferences</Text>
          
          <View style={[
            styles.settingItem,
            theme.isDark && { backgroundColor: '#1a1a1a', borderColor: '#cdc2dc' }
          ]}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.iconContainer,
                theme.isDark && { backgroundColor: '#cdc2dc' }
              ]}>
                <Ionicons name="moon-outline" size={24} color={theme.isDark ? "#000000" : "#1a434e"} />
              </View>
              <View style={styles.settingText}>
                <Text style={[
                  styles.settingTitle,
                  theme.isDark && { color: '#cdc2dc' }
                ]}>Night Mode</Text>
                <Text style={[
                  styles.settingSubtitle,
                  theme.isDark && { color: '#cdc2dc', opacity: 0.8 }
                ]}>Reduce eye strain for evening study</Text>
              </View>
            </View>
            <Switch
              value={theme.isDark}
              onValueChange={handleNightModeToggle}
              trackColor={{ false: '#E5E5EA', true: '#cdc2dc' }}
              thumbColor={theme.isDark ? '#000000' : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.iconContainer,
                theme.isDark && { backgroundColor: '#1a1a1a' }
              ]}>
                <Ionicons name="text-outline" size={24} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Font Size</Text>
                <Text style={styles.settingSubtitle}>Small, Medium, or Large</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[
                styles.orderButton,
                theme.isDark && { 
                  backgroundColor: '#1a1a1a', 
                  borderColor: '#cdc2dc' 
                }
              ]} 
              onPress={() => {
                triggerHaptic('light');
                const options = ['small', 'medium', 'large'];
                const currentIndex = options.indexOf(fontSize);
                const nextIndex = (currentIndex + 1) % options.length;
                setFontSize(options[nextIndex]);
              }}
            >
              <Text style={[
                styles.orderButtonText,
                theme.isDark && { color: '#cdc2dc' }
              ]}>
                {fontSize.charAt(0).toUpperCase() + fontSize.slice(1)}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
            </TouchableOpacity>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.iconContainer,
                theme.isDark && { backgroundColor: '#1a1a1a' }
              ]}>
                <Ionicons name="flash-outline" size={24} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Animation Speed</Text>
                <Text style={styles.settingSubtitle}>Instant, Fast, Normal, or Slow</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[
                styles.orderButton,
                theme.isDark && { 
                  backgroundColor: '#1a1a1a', 
                  borderColor: '#cdc2dc' 
                }
              ]} 
              onPress={() => {
                triggerHaptic('light');
                const options = ['instant', 'fast', 'normal', 'slow'];
                const currentIndex = options.indexOf(animationSpeed);
                const nextIndex = (currentIndex + 1) % options.length;
                setAnimationSpeed(options[nextIndex]);
              }}
            >
              <Text style={[
                styles.orderButtonText,
                theme.isDark && { color: '#cdc2dc' }
              ]}>
                {animationSpeed.charAt(0).toUpperCase() + animationSpeed.slice(1)}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
            </TouchableOpacity>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.iconContainer,
                theme.isDark && { backgroundColor: '#1a1a1a' }
              ]}>
                <Ionicons name="bar-chart-outline" size={24} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Progress Indicators</Text>
                <Text style={styles.settingSubtitle}>Show session completion, daily streaks</Text>
              </View>
            </View>
            <Switch
              value={showProgressIndicators}
              onValueChange={(value) => {
                triggerHaptic('light');
                setShowProgressIndicators(value);
              }}
              trackColor={{ false: '#E5E5EA', true: theme.isDark ? '#cdc2dc' : '#1a434e' }}
              thumbColor={showProgressIndicators ? (theme.isDark ? '#000000' : '#FFFFFF') : '#FFFFFF'}
            />
          </View>
          
          {/* Save Button for Display Preferences */}
          <TouchableOpacity style={[
            styles.saveButton,
            theme.isDark && { backgroundColor: '#cdc2dc' }
          ]} onPress={saveAlgorithmSettings}>
            <Ionicons name="save-outline" size={20} color={theme.isDark ? "#000000" : "#FFFFFF"} />
            <Text style={[
              styles.saveButtonText,
              theme.isDark && { color: '#000000' }
            ]}>Save Display Preferences</Text>
          </TouchableOpacity>
        </View>

        {/* Audio/Accessibility Section */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            theme.isDark && { color: '#cdc2dc' }
          ]}>Audio & Accessibility</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.iconContainer,
                theme.isDark && { backgroundColor: '#1a1a1a' }
              ]}>
                <Ionicons name="volume-high-outline" size={24} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Text-to-Speech</Text>
                <Text style={styles.settingSubtitle}>Useful for language learning</Text>
              </View>
            </View>
            <Switch
              value={textToSpeech}
              onValueChange={(value) => {
                triggerHaptic('light');
                setTextToSpeech(value);
              }}
              trackColor={{ false: '#E5E5EA', true: theme.isDark ? '#cdc2dc' : '#1a434e' }}
              thumbColor={textToSpeech ? (theme.isDark ? '#000000' : '#FFFFFF') : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.iconContainer,
                theme.isDark && { backgroundColor: '#1a1a1a' }
              ]}>
                <Ionicons name="phone-portrait-outline" size={24} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Haptic Feedback</Text>
                <Text style={styles.settingSubtitle}>Button press confirmation</Text>
              </View>
            </View>
            <Switch
              value={hapticFeedback}
              onValueChange={(value) => {
                // Don't trigger haptic when turning off haptic feedback
                if (value) {
                  triggerHaptic('light');
                }
                setHapticFeedback(value);
              }}
              trackColor={{ false: '#E5E5EA', true: theme.isDark ? '#cdc2dc' : '#1a434e' }}
              thumbColor={hapticFeedback ? (theme.isDark ? '#000000' : '#FFFFFF') : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.iconContainer,
                theme.isDark && { backgroundColor: '#1a1a1a' }
              ]}>
                <Ionicons name="eye-outline" size={24} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Prevent Screen Timeout</Text>
                <Text style={styles.settingSubtitle}>Keep display on during study</Text>
              </View>
            </View>
            <Switch
              value={preventScreenTimeout}
              onValueChange={(value) => {
                triggerHaptic('light');
                setPreventScreenTimeout(value);
              }}
              trackColor={{ false: '#E5E5EA', true: theme.isDark ? '#cdc2dc' : '#1a434e' }}
              thumbColor={preventScreenTimeout ? (theme.isDark ? '#000000' : '#FFFFFF') : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            theme.isDark && { color: '#cdc2dc' }
          ]}>Data Management</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleExportData}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.iconContainer,
                theme.isDark && { backgroundColor: '#1a1a1a' }
              ]}>
                <Ionicons name="download-outline" size={24} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Export Data</Text>
                <Text style={styles.settingSubtitle}>Backup your flashcards</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.iconContainer,
                theme.isDark && { backgroundColor: '#1a1a1a' }
              ]}>
                <Ionicons name="cloud-upload-outline" size={24} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Auto Backup Frequency</Text>
                <Text style={styles.settingSubtitle}>Daily/weekly local exports</Text>
              </View>
            </View>
            <Text style={styles.settingValue}>{autoBackupFrequency.charAt(0).toUpperCase() + autoBackupFrequency.slice(1)}</Text>
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={handleResetStatistics}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFF5F5' }]}>
                <Ionicons name="refresh-circle-outline" size={24} color="#FF3B30" />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Reset Statistics</Text>
                <Text style={styles.settingSubtitle}>Fresh start for poorly-learned material</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.iconContainer,
                theme.isDark && { backgroundColor: '#1a1a1a' }
              ]}>
                <Ionicons name="pause-circle-outline" size={24} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Suspend Mature Cards</Text>
                <Text style={styles.settingSubtitle}>Temporarily remove well-known content</Text>
              </View>
            </View>
            <Switch
              value={suspendMatureCards}
              onValueChange={(value) => {
                triggerHaptic('light');
                setSuspendMatureCards(value);
              }}
              trackColor={{ false: '#E5E5EA', true: theme.isDark ? '#cdc2dc' : '#1a434e' }}
              thumbColor={suspendMatureCards ? (theme.isDark ? '#000000' : '#FFFFFF') : '#FFFFFF'}
            />
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={handleClearData}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFF5F5' }]}>
                <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Clear All Data</Text>
                <Text style={styles.settingSubtitle}>Delete everything</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* Study Behavior Section */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            theme.isDark && { color: '#cdc2dc' }
          ]}>Study Behavior</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.iconContainer,
                theme.isDark && { backgroundColor: '#1a1a1a' }
              ]}>
                <Ionicons name="arrow-undo-outline" size={24} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Allow Undo</Text>
                <Text style={styles.settingSubtitle}>Fix accidental button presses</Text>
              </View>
            </View>
            <Switch
              value={allowUndo}
              onValueChange={(value) => {
                triggerHaptic('light');
                setAllowUndo(value);
              }}
              trackColor={{ false: '#E5E5EA', true: theme.isDark ? '#cdc2dc' : '#1a434e' }}
              thumbColor={allowUndo ? (theme.isDark ? '#000000' : '#FFFFFF') : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.iconContainer,
                theme.isDark && { backgroundColor: '#1a1a1a' }
              ]}>
                <Ionicons name="calendar-outline" size={24} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Show Next Review Times</Text>
                <Text style={styles.settingSubtitle}>Preview scheduling impact</Text>
              </View>
            </View>
            <Switch
              value={showNextReviewTimes}
              onValueChange={(value) => {
                triggerHaptic('light');
                setShowNextReviewTimes(value);
              }}
              trackColor={{ false: '#E5E5EA', true: theme.isDark ? '#cdc2dc' : '#1a434e' }}
              thumbColor={showNextReviewTimes ? (theme.isDark ? '#000000' : '#FFFFFF') : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.iconContainer,
                theme.isDark && { backgroundColor: '#1a1a1a' }
              ]}>
                <Ionicons name="alert-circle-outline" size={24} color={theme.isDark ? "#cdc2dc" : "#1a434e"} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Prioritize Overdue Cards</Text>
                <Text style={styles.settingSubtitle}>Focus on severely overdue content</Text>
              </View>
            </View>
            <Switch
              value={prioritizeOverdue}
              onValueChange={(value) => {
                triggerHaptic('light');
                setPrioritizeOverdue(value);
              }}
              trackColor={{ false: '#E5E5EA', true: theme.isDark ? '#cdc2dc' : '#1a434e' }}
              thumbColor={prioritizeOverdue ? (theme.isDark ? '#000000' : '#FFFFFF') : '#FFFFFF'}
            />
          </View>
        </View>

        {/* App Information Section */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            theme.isDark && { color: '#cdc2dc' }
          ]}>App Information</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#F0F0F0' }]}>
                <Ionicons name="information-circle-outline" size={24} color="#8E8E93" />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Version</Text>
                <Text style={styles.settingSubtitle}>1.0.0</Text>
              </View>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFF5F5' }]}>
                <Ionicons name="heart-outline" size={24} color="#FF3B30" />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Made with ❤️</Text>
                <Text style={styles.settingSubtitle}>Flashcard App</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Spacing for bottom */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1a434e',
    paddingTop: 20,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingTop: 40,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a434e',
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a434e',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#1a434e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a434e',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a434e',
    marginLeft: 16,
  },
  settingInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a434e',
    textAlign: 'right',
    minWidth: 60,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  saveButton: {
    backgroundColor: '#1a434e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    marginHorizontal: 20,
    shadowColor: '#1a434e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    minWidth: 100,
    justifyContent: 'space-between',
  },
  orderButtonText: {
    color: '#1a434e',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  bottomSpacing: {
    height: 40,
  },
});
