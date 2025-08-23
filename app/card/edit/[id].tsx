import React, { useState, useEffect } from 'react';
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
import { useDatabase, Card } from '../../../hooks/useDatabase';

export default function EditCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [card, setCard] = useState<Card | null>(null);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [loading, setLoading] = useState(false);
  const { getCard, updateCard } = useDatabase();

  const cardId = parseInt(id as string, 10);

  useEffect(() => {
    const loadCard = async () => {
      try {
        const fetchedCard = await getCard(cardId);
        if (fetchedCard) {
          setCard(fetchedCard);
          setFront(fetchedCard.front);
          setBack(fetchedCard.back);
        }
      } catch (error) {
        console.error('Error loading card:', error);
        Alert.alert('Error', 'Failed to load card');
        router.back();
      }
    };

    loadCard();
  }, [cardId, getCard]);

  const handleUpdateCard = async () => {
    if (!front.trim() || !back.trim()) {
      Alert.alert('Error', 'Please fill in both the front and back of the card');
      return;
    }

    if (!card) return;

    setLoading(true);
    try {
      await updateCard(cardId, front.trim(), back.trim());
      Alert.alert(
        'Success',
        'Card updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating card:', error);
      Alert.alert('Error', 'Failed to update card');
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = card && (front !== card.front || back !== card.back);

  if (!card) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Edit Card',
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
              style={[
                styles.updateButton, 
                (loading || !hasChanges || !front.trim() || !back.trim()) && styles.updateButtonDisabled
              ]}
              onPress={handleUpdateCard}
              disabled={loading || !hasChanges || !front.trim() || !back.trim()}
            >
              <Ionicons 
                name="checkmark" 
                size={20} 
                color="#FFFFFF" 
                style={styles.buttonIcon} 
              />
              <Text style={styles.updateButtonText}>
                {loading ? 'Updating...' : 'Update Card'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.cardInfoTitle}>Card Statistics</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Times Reviewed:</Text>
              <Text style={styles.statValue}>{card.review_count}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Difficulty:</Text>
              <Text style={styles.statValue}>{card.difficulty}/5</Text>
            </View>
            {card.last_reviewed && (
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Last Reviewed:</Text>
                <Text style={styles.statValue}>
                  {new Date(card.last_reviewed).toLocaleDateString()}
                </Text>
              </View>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  updateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  buttonIcon: {
    marginRight: 8,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cardInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  cardInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 16,
    color: '#3C3C43',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});
