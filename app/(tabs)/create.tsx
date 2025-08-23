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
import { useDatabase } from '../../hooks/useDatabase';

export default function CreateScreen() {
  const [deckName, setDeckName] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { createDeck } = useDatabase();

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
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create New Deck</Text>
          <Text style={styles.subtitle}>
            Start building your flashcard collection
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Deck Name *</Text>
            <TextInput
              style={styles.input}
              value={deckName}
              onChangeText={setDeckName}
              placeholder="e.g., Spanish Vocabulary"
              placeholderTextColor="#C7C7CC"
              maxLength={100}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={deckDescription}
              onChangeText={setDeckDescription}
              placeholder="What will you learn with this deck?"
              placeholderTextColor="#C7C7CC"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>
              {deckDescription.length}/500
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreateDeck}
            disabled={loading}
          >
            <Ionicons 
              name="add-circle" 
              size={20} 
              color="#FFFFFF" 
              style={styles.buttonIcon} 
            />
            <Text style={styles.createButtonText}>
              {loading ? 'Creating...' : 'Create Deck'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>💡 Tips for Great Decks</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>
              • Keep deck names clear and specific
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>
              • Add 10-20 cards to start with
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>
              • Use simple, focused questions on each card
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>
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
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 24,
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
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
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
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
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
