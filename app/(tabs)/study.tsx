// app/(tabs)/study.tsx - Study Screen with Multi-Deck Selection

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  Dimensions,
  Alert,
  Modal,
  FlatList,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase, Card, Deck } from '../../hooks/useDatabase';
import { useLocalSearchParams, router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function StudyScreen() {
  const { deckId, deckName } = useLocalSearchParams();
  const [cards, setCards] = useState<Card[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [availableDecks, setAvailableDecks] = useState<Deck[]>([]);
  const [selectedDecks, setSelectedDecks] = useState<Deck[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const { getCardsForDeck, updateCardReview, getDecks, isDbReady } = useDatabase();
  
  const scaleAnimation = new Animated.Value(1);

  // Load available decks
  const loadAvailableDecks = async () => {
    try {
      const deckList = await getDecks();
      console.log('Available decks:', deckList);
      setAvailableDecks(deckList);
      
      // Auto-select first deck if none selected and coming from params
      if (deckId && deckList.length > 0) {
        const numericDeckId = Array.isArray(deckId) ? parseInt(deckId[0]) : parseInt(deckId as string);
        const deck = deckList.find(d => d.id === numericDeckId);
        if (deck) {
          setSelectedDecks([deck]);
          await loadCardsFromDecks([deck]);
        }
      } else if (selectedDecks.length === 0 && deckList.length > 0) {
        setSelectedDecks([deckList[0]]);
        await loadCardsFromDecks([deckList[0]]);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error loading decks:', error);
      setIsLoading(false);
    }
  };

  // Load cards from multiple selected decks
  const loadCardsFromDecks = async (decks: Deck[]) => {
    setIsLoading(true);
    try {
      let allCards: Card[] = [];
      
      for (const deck of decks) {
        const deckCards = await getCardsForDeck(deck.id);
        // Add deck info to each card for reference
        const cardsWithDeck = deckCards.map(card => ({
          ...card,
          deckName: deck.name
        }));
        allCards = [...allCards, ...cardsWithDeck];
      }
      
      // Shuffle cards from multiple decks for better variety
      const shuffledCards = allCards.sort(() => Math.random() - 0.5);
      
      console.log(`Loaded ${shuffledCards.length} cards from ${decks.length} deck(s)`);
      
      setCards(shuffledCards);
      setCurrentCardIndex(0);
      setShowAnswer(false);
      scaleAnimation.setValue(1);
    } catch (error) {
      console.error('Error loading cards:', error);
      Alert.alert('Error', 'Failed to load cards');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isDbReady) return;
    loadAvailableDecks();
  }, [isDbReady]);

  const toggleDeckSelection = (deck: Deck) => {
    const isSelected = selectedDecks.some(d => d.id === deck.id);
    let newSelection: Deck[];
    
    if (isSelected) {
      // Remove deck from selection
      newSelection = selectedDecks.filter(d => d.id !== deck.id);
    } else {
      // Add deck to selection
      newSelection = [...selectedDecks, deck];
    }
    
    setSelectedDecks(newSelection);
  };

  const applyDeckSelection = async () => {
    if (selectedDecks.length === 0) {
      Alert.alert('Error', 'Please select at least one deck to study');
      return;
    }
    
    setShowDropdown(false);
    await loadCardsFromDecks(selectedDecks);
  };

  const flipCard = () => {
    if (showAnswer) return;

    console.log('Showing answer immediately');
    
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
    
    setShowAnswer(true);
  };

  const handleDifficultySelect = async (difficulty: 0 | 1 | 2) => {
    const currentCard = cards[currentCardIndex];
    if (!currentCard) return;

    try {
      await updateCardReview(currentCard.id, difficulty);
      console.log('Card review updated:', difficulty);
      
      Animated.timing(scaleAnimation, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setShowAnswer(false);
        scaleAnimation.setValue(1);
        
        if (currentCardIndex < cards.length - 1) {
          setCurrentCardIndex(currentCardIndex + 1);
        } else {
          Alert.alert(
            'Session Complete!', 
            `You've reviewed all ${cards.length} cards from ${selectedDecks.length} deck(s).`,
            [{ text: 'OK', onPress: () => {
              setCurrentCardIndex(0);
              setShowAnswer(false);
            }}]
          );
        }
      });
    } catch (error) {
      console.error('Error updating card review:', error);
      Alert.alert('Error', 'Failed to save progress');
    }
  };

  const getDropdownDisplayText = () => {
    if (selectedDecks.length === 0) return 'Select decks to study';
    if (selectedDecks.length === 1) return selectedDecks[0].name;
    return `${selectedDecks.length} decks selected`;
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading cards...</Text>
      </View>
    );
  }

  // No decks available
  if (availableDecks.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="library-outline" size={64} color="#C7C7CC" />
        <Text style={styles.emptyText}>No decks found</Text>
        <Text style={styles.emptySubtext}>Create a deck first</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => router.push('/create')}
        >
          <Text style={styles.createButtonText}>Create Your First Deck</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No cards in selected decks
  if (selectedDecks.length > 0 && cards.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Study</Text>
        </View>

        <View style={styles.dropdownContainer}>
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => setShowDropdown(true)}
          >
            <Text style={styles.dropdownText} numberOfLines={1}>
              {getDropdownDisplayText()}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        <View style={styles.centerContainer}>
          <Ionicons name="school-outline" size={64} color="#C7C7CC" />
          <Text style={styles.emptyText}>No cards in selected deck(s)</Text>
          <Text style={styles.emptySubtext}>Add some flashcards first</Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => router.push('/create')}
          >
            <Text style={styles.createButtonText}>Add Cards</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentCard = cards[currentCardIndex];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Study</Text>
        <Text style={styles.progress}>
          {currentCardIndex + 1}/{cards.length}
        </Text>
      </View>

      {/* Deck Selection Dropdown */}
      <View style={styles.dropdownContainer}>
        <TouchableOpacity 
          style={styles.dropdown}
          onPress={() => {
            console.log('Dropdown clicked, setting showDropdown to true');
            setShowDropdown(true);
          }}
        >
          <Text style={styles.dropdownText} numberOfLines={1}>
            {getDropdownDisplayText()}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#8E8E93" />
        </TouchableOpacity>
        
        {selectedDecks.length > 1 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.selectedDecksScroll}
          >
            {selectedDecks.map((deck) => (
              <View key={deck.id} style={styles.selectedDeckTag}>
                <Text style={styles.selectedDeckTagText}>{deck.name}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Card Container */}
      <View style={styles.cardContainer}>
        <Animated.View 
          style={[
            styles.cardWrapper,
            { transform: [{ scale: scaleAnimation }] }
          ]}
        >
          <View style={[
            styles.card,
            showAnswer ? styles.cardBack : styles.cardFront
          ]}>
            <Text style={styles.cardText}>
              {showAnswer ? currentCard?.back : currentCard?.front}
            </Text>
            {/* Show which deck this card is from */}
            <Text style={styles.cardSource}>
              From: {(currentCard as any)?.deckName || 'Unknown deck'}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Action Buttons */}
      {!showAnswer ? (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.showAnswerButton} onPress={flipCard}>
            <Text style={styles.showAnswerText}>Show Answer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <Text style={styles.difficultyTitle}>How did you do?</Text>
          <View style={styles.difficultyButtons}>
            <TouchableOpacity
              style={[styles.difficultyButton, styles.hardButton]}
              onPress={() => handleDifficultySelect(0)}
            >
              <Text style={styles.difficultyButtonText}>Hard</Text>
              <Text style={styles.difficultySubtext}>1 hour</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.difficultyButton, styles.mediumButton]}
              onPress={() => handleDifficultySelect(1)}
            >
              <Text style={styles.difficultyButtonText}>Medium</Text>
              <Text style={styles.difficultySubtext}>1 day</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.difficultyButton, styles.easyButton]}
              onPress={() => handleDifficultySelect(2)}
            >
              <Text style={styles.difficultyButtonText}>Easy</Text>
              <Text style={styles.difficultySubtext}>3 days</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Multi-Selection Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent={true}
        onRequestClose={() => setShowDropdown(false)}
        statusBarTranslucent={true}
        onShow={() => console.log('Modal shown, showDropdown:', showDropdown)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowDropdown(false)}
          />
          <View style={styles.dropdownModal}>
            <Text style={styles.modalTitle}>Select Decks to Study</Text>
            <Text style={styles.modalSubtitle}>
              Choose multiple decks to mix their cards together
            </Text>
            
            <FlatList
              data={availableDecks}
              keyExtractor={(item) => item.id.toString()}
              style={styles.deckList}
              renderItem={({ item }) => {
                const isSelected = selectedDecks.some(d => d.id === item.id);
                return (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      isSelected && styles.dropdownItemSelected
                    ]}
                    onPress={() => toggleDeckSelection(item)}
                  >
                    <View style={styles.dropdownItemContent}>
                      <Text style={[
                        styles.dropdownItemText,
                        isSelected && styles.dropdownItemTextSelected
                      ]}>
                        {item.name}
                      </Text>
                      <Text style={styles.dropdownItemSubtext}>
                        {item.card_count} cards
                      </Text>
                    </View>
                    <View style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected
                    ]}>
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowDropdown(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={applyDeckSelection}
              >
                <Text style={styles.modalButtonText}>
                  Study {selectedDecks.length} Deck{selectedDecks.length !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    zIndex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F2F2F7',
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  progress: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  dropdownContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dropdownText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
    fontWeight: '500',
  },
  selectedDecksScroll: {
    marginTop: 8,
  },
  selectedDeckTag: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  selectedDeckTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardWrapper: {
    width: width - 40,
    minHeight: 280,
    maxHeight: 400,
  },
  card: {
    width: '100%',
    minHeight: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardFront: {
    backgroundColor: '#FFFFFF',
  },
  cardBack: {
    backgroundColor: '#F0F8FF',
  },
  cardText: {
    fontSize: 20,
    color: '#000',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '500',
    flex: 1,
  },
  cardSource: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 12,
    fontStyle: 'italic',
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  showAnswerButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignSelf: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  showAnswerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  difficultyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  difficultyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  hardButton: {
    backgroundColor: '#FF3B30',
  },
  mediumButton: {
    backgroundColor: '#FF9500',
  },
  easyButton: {
    backgroundColor: '#34C759',
  },
  difficultyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  difficultySubtext: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
  loadingText: {
    fontSize: 18,
    color: '#8E8E93',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
    // Ensure modal is positioned correctly
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dropdownModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
    minWidth: '85%',
    maxWidth: '95%',
    zIndex: 1001,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Ensure modal appears on top
    position: 'relative',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
  },
  deckList: {
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  dropdownItemSelected: {
    backgroundColor: '#F0F8FF',
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  dropdownItemTextSelected: {
    color: '#007AFF',
  },
  dropdownItemSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});