import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { useDatabase, Card } from '../../hooks/useDatabase';
import { calculateSpacedRepetition, QUALITY_LABELS } from '../../hooks/useSpacedRepetition';
import FlashCard from '../../components/FlashCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function StudyScreen() {
  const { deckId, deckName } = useLocalSearchParams<{ 
    deckId: string; 
    deckName: string; 
  }>();
  
  const [cards, setCards] = useState<Card[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [studyComplete, setStudyComplete] = useState(false);
  const [showAnswerButtons, setShowAnswerButtons] = useState(false);
  
  const { getCardsForReview, updateCard } = useDatabase();
  
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const loadCards = useCallback(async () => {
    try {
      const reviewCards = await getCardsForReview(parseInt(deckId as string, 10));
      setCards(reviewCards);
      setLoading(false);
      
      if (reviewCards.length === 0) {
        setStudyComplete(true);
      }
    } catch (error) {
      console.error('Error loading cards:', error);
      Alert.alert('Error', 'Failed to load cards for review');
    }
  }, [deckId, getCardsForReview]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const handleCardFlip = () => {
    setShowAnswerButtons(true);
  };

  const processAnswer = async (quality: 1 | 2 | 3 | 4 | 5) => {
    const currentCard = cards[currentCardIndex];
    if (!currentCard) return;

    try {
      const result = calculateSpacedRepetition(currentCard, quality);
      await updateCard(
        currentCard.id,
        currentCard.front,
        currentCard.back,
        result.difficulty,
        new Date().toISOString(),
        result.nextReview.toISOString(),
        result.reviewCount
      );

      nextCard();
    } catch (error) {
      console.error('Error updating card:', error);
      Alert.alert('Error', 'Failed to save answer');
    }
  };

  const nextCard = () => {
    setShowAnswerButtons(false);
    
    if (currentCardIndex + 1 >= cards.length) {
      setStudyComplete(true);
      return;
    }

    // Animate card exit
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(() => {
        setCurrentCardIndex(currentCardIndex + 1);
        opacity.value = withTiming(1, { duration: 200 });
      })();
    });
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
    },
    onEnd: (event) => {
      const threshold = SCREEN_WIDTH * 0.3;
      
      if (Math.abs(event.translationX) > threshold) {
        // Swipe far enough - determine direction and quality
        const direction = event.translationX > 0 ? 'right' : 'left';
        const quality = direction === 'right' ? 4 : 2; // Easy vs Hard
        
        // Animate off screen
        translateX.value = withSpring(
          direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH,
          {},
          () => {
            runOnJS(processAnswer)(quality);
            translateX.value = 0;
          }
        );
      } else {
        // Return to center
        translateX.value = withSpring(0);
      }
    },
  });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH * 0.5, 0, SCREEN_WIDTH * 0.5],
      [-15, 0, 15]
    );

    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${rotate}deg` },
      ],
      opacity: opacity.value,
    };
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading cards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (studyComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{ 
            title: 'Study Complete',
            headerBackTitle: 'Decks',
          }} 
        />
        <View style={styles.completeContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#34C759" />
          <Text style={styles.completeTitle}>Study Session Complete!</Text>
          <Text style={styles.completeDescription}>
            {cards.length === 0 
              ? 'No cards are due for review right now.'
              : `You've reviewed ${cards.length} cards.`
            }
          </Text>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentCard = cards[currentCardIndex];
  const progress = ((currentCardIndex + 1) / cards.length) * 100;

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{ 
            title: deckName ? decodeURIComponent(deckName) : 'Study',
            headerBackTitle: 'Decks',
          }} 
        />
        
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {currentCardIndex + 1} of {cards.length}
            </Text>
          </View>
        </View>

        <View style={styles.cardContainer}>
          <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View style={cardStyle}>
              <FlashCard card={currentCard} onFlip={handleCardFlip} />
            </Animated.View>
          </PanGestureHandler>
        </View>

        {showAnswerButtons && (
          <View style={styles.answersContainer}>
            <Text style={styles.answersTitle}>How well did you know this?</Text>
            <View style={styles.answersGrid}>
              {([1, 2, 3, 4, 5] as const).map((quality) => (
                <TouchableOpacity
                  key={quality}
                  style={[
                    styles.answerButton,
                    { backgroundColor: QUALITY_LABELS[quality].color }
                  ]}
                  onPress={() => processAnswer(quality)}
                >
                  <Text style={styles.answerButtonText}>
                    {QUALITY_LABELS[quality].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.swipeHint}>
              💡 Tip: Swipe right for Easy, left for Hard
            </Text>
          </View>
        )}

        {!showAnswerButtons && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              Tap the card to reveal the answer
            </Text>
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
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
  },
  loadingText: {
    fontSize: 18,
    color: '#8E8E93',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  answersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  answersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
  },
  answersGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  answerButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  answerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  swipeHint: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  instructionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  completeDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  doneButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
