import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.cardInfoText}>
              EF: {card.easiness_factor.toFixed(1)}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="refresh" size={12} color="#1a434e" />
            <Text style={styles.cardInfoText}>
              Reviews: {card.review_count}
            </Text>
          </View>
        </View>
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
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#1a434e',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    backfaceVisibility: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  frontCard: {
    borderLeftWidth: 6,
    borderLeftColor: '#1a434e',
  },
  backCard: {
    borderLeftWidth: 6,
    borderLeftColor: '#1a434e',
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
    color: '#1a434e',
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cardInfoText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginLeft: 4,
  },
});
