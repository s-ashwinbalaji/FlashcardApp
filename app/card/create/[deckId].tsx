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
import { useTheme } from '../../../hooks/useTheme';

export default function CreateCardScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const { theme } = useTheme();
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
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: theme.isDark ? '#000000' : '#FFFFFF',
          },
          headerTintColor: theme.isDark ? '#cdc2dc' : '#1a434e',
          headerTitleStyle: {
            color: theme.isDark ? '#cdc2dc' : '#1a434e',
          },
        }} 
      />
      
      <KeyboardAvoidingView 
        style={[
          styles.container,
          theme.isDark && { backgroundColor: '#000000' }
        ]} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
            <View style={[
              styles.cardPreview,
              theme.isDark && { 
                backgroundColor: '#1a1a1a',
                shadowColor: '#cdc2dc'
              }
            ]}>
              <View style={styles.cardSide}>
                <Text style={[
                  styles.cardLabel,
                  theme.isDark && { color: '#cdc2dc' }
                ]}>Front</Text>
                <View style={[
                  styles.cardContainer,
                  theme.isDark && { 
                    backgroundColor: '#000000',
                    borderColor: '#cdc2dc'
                  }
                ]}>
                  <TextInput
                    style={[
                      styles.cardInput,
                      theme.isDark && { 
                        color: '#cdc2dc',
                        backgroundColor: '#000000'
                      }
                    ]}
                    value={front}
                    onChangeText={setFront}
                    placeholder="Enter the question or prompt..."
                    placeholderTextColor={theme.isDark ? "#666666" : "#C7C7CC"}
                    multiline
                    textAlignVertical="top"
                    maxLength={500}
                  />
                </View>
                <Text style={[
                  styles.characterCount,
                  theme.isDark && { color: '#cdc2dc' }
                ]}>
                  {front.length}/500
                </Text>
              </View>

              <View style={[
                styles.divider,
                theme.isDark && { backgroundColor: '#cdc2dc' }
              ]} />

              <View style={styles.cardSide}>
                <Text style={[
                  styles.cardLabel,
                  theme.isDark && { color: '#cdc2dc' }
                ]}>Back</Text>
                <View style={[
                  styles.cardContainer,
                  theme.isDark && { 
                    backgroundColor: '#000000',
                    borderColor: '#cdc2dc'
                  }
                ]}>
                  <TextInput
                    style={[
                      styles.cardInput,
                      theme.isDark && { 
                        color: '#cdc2dc',
                        backgroundColor: '#000000'
                      }
                    ]}
                    value={back}
                    onChangeText={setBack}
                    placeholder="Enter the answer..."
                    placeholderTextColor={theme.isDark ? "#666666" : "#C7C7CC"}
                    multiline
                    textAlignVertical="top"
                    maxLength={500}
                  />
                </View>
                <Text style={[
                  styles.characterCount,
                  theme.isDark && { color: '#cdc2dc' }
                ]}>
                  {back.length}/500
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.createButton, 
                loading && styles.createButtonDisabled,
                theme.isDark && { backgroundColor: '#cdc2dc' }
              ]}
              onPress={handleCreateCard}
              disabled={loading || !front.trim() || !back.trim()}
            >
              <Ionicons 
                name="add" 
                size={20} 
                color={theme.isDark ? "#000000" : "#FFFFFF"} 
                style={styles.buttonIcon} 
              />
              <Text style={[
                styles.createButtonText,
                theme.isDark && { color: '#000000' }
              ]}>
                {loading ? 'Creating...' : 'Create Card'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[
            styles.tips,
            theme.isDark && { 
              backgroundColor: '#1a1a1a',
              borderColor: '#cdc2dc'
            }
          ]}>
            <Text style={[
              styles.tipsTitle,
              theme.isDark && { color: '#cdc2dc' }
            ]}>Tips for Great Cards</Text>
            <View style={styles.tipItem}>
              <Text style={[
                styles.tipText,
                theme.isDark && { color: '#cdc2dc' }
              ]}>
                • Keep questions clear and specific
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={[
                styles.tipText,
                theme.isDark && { color: '#cdc2dc' }
              ]}>
                • Use simple, memorable answers
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={[
                styles.tipText,
                theme.isDark && { color: '#cdc2dc' }
              ]}>
                • Include context when needed
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={[
                styles.tipText,
                theme.isDark && { color: '#cdc2dc' }
              ]}>
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
    backgroundColor: '#FFFFFF',
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
    color: '#1a434e',
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
    color: '#1a434e',
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
    backgroundColor: '#1a434e',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
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
    color: '#1a434e',
    lineHeight: 20,
  },
});