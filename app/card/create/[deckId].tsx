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
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../../../hooks/useDatabase';

export default function CreateCardScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [loading, setLoading] = useState(false);
  const { createCard } = useDatabase();

  const handleCreateCard = async () => {
    if (!front.trim() || !back.trim()) {
      Alert.alert('Error', 'Please fill in both the front and back of the card');
      return;
    }

    setLoading(true);
    try {
      await createCard(parseInt(deckId as string, 10), front.trim(), back.trim());
      Alert.alert(
        'Success',
        'Card created successfully!',
        [
          {
            text: 'Add Another',
            onPress: () => {
              setFront('');
              setBack('');
            },
          },
          {
            text: 'Done',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating card:', error);
      Alert.alert('Error', 'Failed to create card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Add Card',
          headerBackTitle: 'Deck',
        }} 
      />
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
            <View style={styles.cardPreview}>
              <View style={styles.cardSide}>
                <Text style={styles.cardLabel}>Front</Text>
                <View style={styles.cardContainer}>
                  <TextInput
                    style={styles.cardInput}
                    value={front}
                    onChangeText={setFront}
                    placeholder="Enter the question or prompt..."
                    placeholderTextColor="#C7C7CC"
                    multiline
                    textAlignVertical="top"
                    maxLength={500}
                  />
                </View>
                <Text style={styles.characterCount}>
                  {front.length}/500
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardSide}>
                <Text style={styles.cardLabel}>Back</Text>
                <View style={styles.cardContainer}>
                  <TextInput
                    style={styles.cardInput}
                    value={back}
                    onChangeText={setBack}
                    placeholder="Enter the answer..."
                    placeholderTextColor="#C7C7CC"
                    multiline
                    textAlignVertical="top"
                    maxLength={500}
                  />
                </View>
                <Text style={styles.characterCount}>
                  {back.length}/500
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.createButton, loading && styles.createButtonDisabled]}
              onPress={handleCreateCard}
              disabled={loading || !front.trim() || !back.trim()}
            >
              <Ionicons 
                name="add" 
                size={20} 
                color="#FFFFFF" 
                style={styles.buttonIcon} 
              />
              <Text style={styles.createButtonText}>
                {loading ? 'Creating...' : 'Create Card'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>💡 Card Creation Tips</Text>
            <View style={styles.tipItem}>
              <Text style={styles.tipText}>
                • Keep questions clear and specific
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipText}>
                • Use simple, memorable answers
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipText}>
                • Include context when needed
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipText}>
                • Test yourself - would you understand this later?
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
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
  form: {
    marginBottom: 32,
  },
  cardPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardSide: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  cardContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    minHeight: 120,
  },
  cardInput: {
    padding: 16,
    fontSize: 16,
    color: '#000',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 24,
  },
  createButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
