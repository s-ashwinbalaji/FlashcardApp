import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Card } from '../hooks/useDatabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = 400;

interface FlashCardProps {
  card: Card;
  onFlip?: () => void;
}

export default function FlashCard({ card, onFlip }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnimation = useSharedValue(0);

  const handleFlip = () => {
    const newFlippedState = !isFlipped;
    setIsFlipped(newFlippedState);
    
    flipAnimation.value = withTiming(newFlippedState ? 1 : 0, {
      duration: 600,
    });
    
    if (onFlip) {
      onFlip();
    }
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAnimation.value, [0, 1], [0, 180]);
    const opacity = interpolate(flipAnimation.value, [0, 0.5, 1], [1, 0, 0]);
    
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      opacity,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAnimation.value, [0, 1], [180, 360]);
    const opacity = interpolate(flipAnimation.value, [0, 0.5, 1], [0, 0, 1]);
    
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      opacity,
    };
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.cardContainer} 
        onPress={handleFlip}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.card, styles.frontCard, frontAnimatedStyle]}>
          <View style={styles.cardContent}>
            <Text style={styles.sideLabel}>Question</Text>
            <Text style={styles.cardText}>{card.front}</Text>
          </View>
          <View style={styles.flipIndicator}>
            <Text style={styles.flipText}>Tap to reveal answer</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.card, styles.backCard, backAnimatedStyle]}>
          <View style={styles.cardContent}>
            <Text style={styles.sideLabel}>Answer</Text>
            <Text style={styles.cardText}>{card.back}</Text>
          </View>
          <View style={styles.flipIndicator}>
            <Text style={styles.flipText}>Tap to see question</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
      
      <View style={styles.cardInfo}>
        <Text style={styles.cardInfoText}>
          Difficulty: {card.difficulty}/5 • Reviews: {card.review_count}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    perspective: 1000,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    backfaceVisibility: 'hidden',
  },
  frontCard: {
    borderLeftWidth: 6,
    borderLeftColor: '#007AFF',
  },
  backCard: {
    borderLeftWidth: 6,
    borderLeftColor: '#34C759',
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  sideLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 16,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  cardText: {
    fontSize: 18,
    color: '#000',
    lineHeight: 28,
    textAlign: 'center',
    flex: 1,
    textAlignVertical: 'center',
  },
  flipIndicator: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  flipText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  cardInfo: {
    marginTop: 12,
    paddingHorizontal: 20,
  },
  cardInfoText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
