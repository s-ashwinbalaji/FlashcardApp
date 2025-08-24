import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDatabase } from '../../hooks/useDatabase';
import { useTheme } from '../../hooks/useTheme';

export default function CreateScreen() {
  const [deckName, setDeckName] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { createDeck } = useDatabase();
  const { theme } = useTheme();

  const handleCreateDeck = async () => {
    if (!deckName.trim()) {
      Alert.alert('Error', 'Please enter a deck name');
      return;
    }

    setLoading(true);
    try {
      const deckId = await createDeck(deckName.trim(), deckDescription.trim());
      Alert.alert(
        'Success',
        'Deck created successfully!',
        [
          {
            text: 'Add Cards',
            onPress: () => router.replace(`/deck/${deckId}`),
          },
          {
            text: 'View Decks',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
      setDeckName('');
      setDeckDescription('');
    } catch (error) {
      console.error('Error creating deck:', error);
      Alert.alert('Error', 'Failed to create deck');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[
        styles.container,
        theme.isDark && { backgroundColor: '#000000' }
      ]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[
          styles.titleSection,
          theme.isDark && { backgroundColor: '#cdc2dc', borderBottomColor: '#cdc2dc' }
        ]}>
          <Text style={[
            styles.title,
            theme.isDark && { color: '#000000' }
          ]}>Create New Deck</Text>
          <Text style={[
            styles.subtitle,
            theme.isDark && { color: '#000000' }
          ]}>
            Start building your flashcard collection
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Text style={[
                styles.label,
                theme.isDark && { color: '#cdc2dc' }
              ]}>Deck Name *</Text>
              <View style={styles.requiredIndicator} />
            </View>
            <TextInput
              style={[
                styles.input,
                theme.isDark && { 
                  backgroundColor: '#1a1a1a', 
                  borderColor: '#cdc2dc',
                  color: '#cdc2dc'
                }
              ]}
              value={deckName}
              onChangeText={setDeckName}
              placeholder="e.g., Spanish Vocabulary"
              placeholderTextColor={theme.isDark ? "#cdc2dc" : "#C7C7CC"}
              maxLength={100}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[
              styles.label,
              theme.isDark && { color: '#cdc2dc' }
            ]}>Description (Optional)</Text>
            <TextInput
              style={[
                styles.input, 
                styles.textArea,
                theme.isDark && { 
                  backgroundColor: '#1a1a1a', 
                  borderColor: '#cdc2dc',
                  color: '#cdc2dc'
                }
              ]}
              value={deckDescription}
              onChangeText={setDeckDescription}
              placeholder="What will you learn with this deck?"
              placeholderTextColor={theme.isDark ? "#cdc2dc" : "#C7C7CC"}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={[
              styles.characterCount,
              theme.isDark && { color: '#cdc2dc' }
            ]}>
              {deckDescription.length}/500
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.createButton, 
              loading && styles.createButtonDisabled,
              theme.isDark && { backgroundColor: '#cdc2dc' }
            ]}
            onPress={handleCreateDeck}
            disabled={loading}
          >
            <Ionicons 
              name="add-circle" 
              size={20} 
              color={theme.isDark ? "#000000" : "#FFFFFF"} 
              style={styles.buttonIcon} 
            />
            <Text style={[
              styles.createButtonText,
              theme.isDark && { color: '#000000' }
            ]}>
              {loading ? 'Creating...' : 'Create Deck'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[
          styles.tips,
          theme.isDark && { backgroundColor: '#1a1a1a', borderColor: '#cdc2dc' }
        ]}>
          <Text style={[
            styles.tipsTitle,
            theme.isDark && { color: '#cdc2dc' }
          ]}>💡 Tips for Great Decks</Text>
          <View style={styles.tipItem}>
            <Text style={[
              styles.tipText,
              theme.isDark && { color: '#cdc2dc' }
            ]}>
              • Keep deck names clear and specific
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={[
              styles.tipText,
              theme.isDark && { color: '#cdc2dc' }
            ]}>
              • Add 10-20 cards to start with
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={[
              styles.tipText,
              theme.isDark && { color: '#cdc2dc' }
            ]}>
              • Use simple, focused questions on each card
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={[
              styles.tipText,
              theme.isDark && { color: '#cdc2dc' }
            ]}>
              • Review regularly for best results
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
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
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#1a434e',
    lineHeight: 24,
    opacity: 0.8,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a434e',
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requiredIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
    marginLeft: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#1a434e',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    shadowColor: '#1a434e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  characterCount: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 4,
  },
  createButton: {
    backgroundColor: '#1a434e',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#1a434e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  buttonIcon: {
    marginRight: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tips: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#1a434e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a434e',
    marginBottom: 16,
  },
  tipItem: {
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
  },
});
