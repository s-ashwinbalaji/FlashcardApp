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
import { LinearGradient } from 'expo-linear-gradient';
import { useDatabase, Card, Deck } from '../../hooks/useDatabase';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';

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
  const [studyMode, setStudyMode] = useState<'all' | 'due'>('all');
  
  const { getCardsForDeck, getCards, updateCardReview, getDecks, isDbReady } = useDatabase();
  const { theme } = useTheme();
  
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
    if (decks.length === 0) return;
    
    setIsLoading(true);
    try {
      let allCards: Card[] = [];
      
      for (const deck of decks) {
        // Choose function based on study mode
        const deckCards = studyMode === 'all' 
          ? await getCards(deck.id)
          : await getCardsForDeck(deck.id);
        
        // Add deck info to each card for reference
        const cardsWithDeck = deckCards.map(card => ({
          ...card,
          deckName: deck.name
        }));
        allCards = [...allCards, ...cardsWithDeck];
      }
      
      // Shuffle cards from multiple decks for better variety
      const shuffledCards = allCards.sort(() => Math.random() - 0.5);
      
      console.log(`Loaded ${shuffledCards.length} cards from ${decks.length} deck(s) in ${studyMode} mode`);
      console.log('Cards from each deck:', decks.map(deck => ({ deck: deck.name, count: shuffledCards.filter(card => (card as any).deckName === deck.name).length })));
      
      setCards(shuffledCards);
      setCurrentCardIndex(0);
      setShowAnswer(false);
      scaleAnimation.setValue(1);
      
      // Ensure we're not showing the dropdown after loading cards
      setShowDropdown(false);
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

  // Debug modal state changes
  useEffect(() => {
    console.log('Modal state changed - showDropdown:', showDropdown);
  }, [showDropdown]);

  // Monitor cards changes and ensure proper state
  useEffect(() => {
    if (cards.length > 0 && showDropdown) {
      console.log('Cards loaded, closing dropdown');
      setShowDropdown(false);
    }
  }, [cards.length, showDropdown]);

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
    
    console.log('Deck selection toggled:', deck.name, 'isSelected:', !isSelected);
    setSelectedDecks(newSelection);
  };

  const applyDeckSelection = async () => {
    if (selectedDecks.length === 0) {
      Alert.alert('Error', 'Please select at least one deck to study');
      return;
    }
    
    console.log('Applying deck selection, closing modal');
    setShowDropdown(false);
    
    // Small delay to ensure modal closes before loading cards
    setTimeout(async () => {
      await loadCardsFromDecks(selectedDecks);
    }, 100);
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
            activeOpacity={0.7}
            onPress={() => {
              console.log('Dropdown clicked from empty state');
              setShowDropdown(true);
            }}
          >
            <Text style={styles.dropdownText} numberOfLines={1}>
              {getDropdownDisplayText()}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#8E8E93" />
          </TouchableOpacity>
          
          {/* Backup button in case dropdown doesn't work */}
          <TouchableOpacity 
            style={styles.backupButton}
            onPress={() => {
              console.log('Backup button clicked from empty state');
              setShowDropdown(true);
            }}
          >
            <Text style={styles.backupButtonText}>Select Decks</Text>
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
    <View style={[
      styles.container,
      theme.isDark && { backgroundColor: '#000000' }
    ]}>
      {/* Progress Display */}
      <View style={[
        styles.progressDisplay,
        theme.isDark && { backgroundColor: '#cdc2dc', borderBottomColor: '#cdc2dc' }
      ]}>
        <Text style={[
          styles.progressText,
          theme.isDark && { color: '#000000' }
        ]}>
          {cards.length > 0 ? `${currentCardIndex + 1}/${cards.length}` : '0/0'}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${cards.length > 0 ? ((currentCardIndex + 1) / cards.length) * 100 : 0}%` }
            ]} 
          />
        </View>
      </View>

      {/* Study Mode Toggle */}
      <View style={styles.studyModeContainer}>
        <Text style={[
          styles.studyModeLabel,
          theme.isDark && { color: '#cdc2dc' }
        ]}>Study Mode:</Text>
        <View style={[
          styles.studyModeToggle,
          theme.isDark && { 
            backgroundColor: '#1a1a1a', 
            borderColor: '#cdc2dc',
            shadowColor: '#cdc2dc'
          }
        ]}>
                     <TouchableOpacity
             style={[
               styles.studyModeButton,
               studyMode === 'all' && [
                 styles.studyModeButtonActive,
                 theme.isDark && { 
                   backgroundColor: '#cdc2dc', 
                   borderColor: '#cdc2dc',
                   shadowColor: '#cdc2dc'
                 }
               ]
             ]}
             onPress={() => {
               if (studyMode !== 'all') {
                 setStudyMode('all');
                 if (selectedDecks.length > 0) {
                   loadCardsFromDecks(selectedDecks);
                 }
               }
             }}
           >
            <Text style={[
              styles.studyModeButtonText,
              studyMode === 'all' && styles.studyModeButtonTextActive,
              theme.isDark && { color: studyMode === 'all' ? '#000000' : '#cdc2dc' }
            ]}>
              All Cards
            </Text>
          </TouchableOpacity>
                     <TouchableOpacity
             style={[
               styles.studyModeButton,
               studyMode === 'due' && [
                 styles.studyModeButtonActive,
                 theme.isDark && { 
                   backgroundColor: '#cdc2dc', 
                   borderColor: '#cdc2dc',
                   shadowColor: '#cdc2dc'
                 }
               ]
             ]}
             onPress={() => {
               if (studyMode !== 'due') {
                 setStudyMode('due');
                 if (selectedDecks.length > 0) {
                   loadCardsFromDecks(selectedDecks);
                 }
               }
             }}
           >
            <Text style={[
              styles.studyModeButtonText,
              studyMode === 'due' && styles.studyModeButtonTextActive,
              theme.isDark && { color: studyMode === 'due' ? '#000000' : '#cdc2dc' }
            ]}>
              Due Cards
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Deck Selection Dropdown */}
      <View style={styles.dropdownContainer}>
        <TouchableOpacity 
          style={[
            styles.dropdown,
            theme.isDark && { 
              backgroundColor: '#1a1a1a', 
              borderColor: '#cdc2dc',
              shadowColor: '#cdc2dc'
            }
          ]}
          activeOpacity={0.7}
          onPress={() => {
            console.log('Dropdown clicked, setting showDropdown to true');
            setShowDropdown(true);
          }}
          onLongPress={() => {
            console.log('Dropdown long pressed');
          }}
        >
          <Text style={[
            styles.dropdownText,
            theme.isDark && { color: '#cdc2dc' }
          ]} numberOfLines={1}>
            {getDropdownDisplayText()}
          </Text>
          <Ionicons name="chevron-down" size={20} color={theme.isDark ? "#cdc2dc" : "#8E8E93"} />
        </TouchableOpacity>
        
        {/* Backup button in case dropdown doesn't work */}
        <TouchableOpacity 
          style={[
            styles.backupButton,
            theme.isDark && { backgroundColor: '#cdc2dc' }
          ]}
          onPress={() => {
            console.log('Backup button clicked');
            setShowDropdown(true);
          }}
        >
          <Text style={[
            styles.backupButtonText,
            theme.isDark && { color: '#000000' }
          ]}>Select Decks</Text>
        </TouchableOpacity>
        
        {selectedDecks.length > 1 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.selectedDecksScroll}
          >
            {selectedDecks.map((deck) => (
              <View key={deck.id} style={[
                styles.selectedDeckTag,
                theme.isDark && { backgroundColor: '#cdc2dc' }
              ]}>
                <Text style={[
                  styles.selectedDeckTagText,
                  theme.isDark && { color: '#000000' }
                ]}>{deck.name}</Text>
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
            showAnswer ? styles.cardBack : styles.cardFront,
            theme.isDark && { 
              backgroundColor: showAnswer ? '#1a1a1a' : '#1a1a1a',
              borderColor: '#cdc2dc',
              shadowColor: '#cdc2dc'
            }
          ]}>
            <Text style={[
              styles.cardText,
              theme.isDark && { color: '#cdc2dc' }
            ]}>
              {showAnswer ? currentCard?.back : currentCard?.front}
            </Text>
            {/* Show which deck this card is from */}
            <Text style={[
              styles.cardSource,
              theme.isDark && { color: '#cdc2dc' }
            ]}>
              From: {(currentCard as any)?.deckName || 'Unknown deck'}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Action Buttons */}
      {!showAnswer ? (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[
            styles.showAnswerButton,
            theme.isDark && { backgroundColor: '#cdc2dc' }
          ]} onPress={flipCard}>
            <Text style={[
              styles.showAnswerText,
              theme.isDark && { color: '#000000' }
            ]}>Show Answer</Text>
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
        animationType="fade"
        presentationStyle="overFullScreen"
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              console.log('Backdrop pressed, closing modal');
              setShowDropdown(false);
            }}
          />
          <View style={styles.dropdownModal}>
            <Text style={styles.modalTitle}>Select Decks to Study</Text>
            <Text style={styles.modalSubtitle}>
              Choose multiple decks to mix their cards together
            </Text>
            
            {/* Study Mode Selection in Modal */}
            <View style={styles.modalStudyModeContainer}>
              <Text style={styles.modalStudyModeLabel}>Study Mode:</Text>
              <View style={styles.modalStudyModeToggle}>
                <TouchableOpacity
                  style={[
                    styles.modalStudyModeButton,
                    studyMode === 'all' && styles.modalStudyModeButtonActive
                  ]}
                  onPress={() => setStudyMode('all')}
                >
                  <Text style={[
                    styles.modalStudyModeButtonText,
                    studyMode === 'all' && styles.modalStudyModeButtonTextActive
                  ]}>
                    All Cards
                  </Text>
                  <Text style={styles.modalStudyModeSubtext}>
                    Study every card in selected decks
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalStudyModeButton,
                    studyMode === 'due' && styles.modalStudyModeButtonActive
                  ]}
                  onPress={() => setStudyMode('due')}
                >
                  <Text style={[
                    styles.modalStudyModeButtonText,
                    studyMode === 'due' && styles.modalStudyModeButtonTextActive
                  ]}>
                    Due Cards
                  </Text>
                  <Text style={styles.modalStudyModeSubtext}>
                    Only cards ready for review
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
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
                  Study {selectedDecks.length} Deck{selectedDecks.length !== 1 ? 's' : ''} ({studyMode === 'all' ? 'All Cards' : 'Due Cards'})
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
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1a434e',
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progress: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  progressDisplay: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    paddingTop: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  progressText: {
    fontSize: 16,
    color: '#1a434e',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: 120,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  studyModeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 24,
  },
  studyModeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a434e',
    marginBottom: 8,
  },
  studyModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    shadowColor: '#1a434e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  studyModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  studyModeButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#1a434e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#1a434e',
  },
  studyModeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  studyModeButtonTextActive: {
    color: '#1a434e',
    fontWeight: '600',
  },
  dropdownContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    shadowColor: '#1a434e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backupButton: {
    backgroundColor: '#1a434e',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    alignItems: 'center',
    shadowColor: '#1a434e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  backupButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
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
    backgroundColor: '#1a434e',
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
    borderRadius: 20,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1a434e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardFront: {
    backgroundColor: '#FFFFFF',
  },
  cardBack: {
    backgroundColor: '#F8F9FA',
    borderColor: '#1a434e',
  },
  cardText: {
    fontSize: 22,
    color: '#1a434e',
    textAlign: 'center',
    lineHeight: 30,
    fontWeight: '600',
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
    backgroundColor: '#1a434e',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignSelf: 'center',
    shadowColor: '#1a434e',
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
    color: '#1a434e',
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
    color: '#1a434e',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#0f4c75',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
    shadowColor: '#0f4c75',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dropdownModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
    minWidth: '85%',
    maxWidth: '95%',
    shadowColor: '#1a434e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a434e',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalStudyModeContainer: {
    marginBottom: 20,
  },
  modalStudyModeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a434e',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalStudyModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 6,
    gap: 4,
  },
  modalStudyModeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalStudyModeButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalStudyModeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  modalStudyModeButtonTextActive: {
    color: '#1a434e',
  },
  modalStudyModeSubtext: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
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
    color: '#1a434e',
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
    backgroundColor: '#1a434e',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    color: '#1a434e',
    fontSize: 16,
    fontWeight: '600',
  },
});