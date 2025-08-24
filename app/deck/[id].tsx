import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase, Deck, Card } from '../../hooks/useDatabase';

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { getDeck, getCards, deleteCard } = useDatabase();

  const deckId = parseInt(id as string, 10);

  const loadDeck = useCallback(async () => {
    try {
      const fetchedDeck = await getDeck(deckId);
      setDeck(fetchedDeck);
    } catch (error) {
      console.error('Error loading deck:', error);
    }
  }, [deckId, getDeck]);

  const loadCards = useCallback(async () => {
    try {
      const fetchedCards = await getCards(deckId);
      setCards(fetchedCards);
    } catch (error) {
      console.error('Error loading cards:', error);
    }
  }, [deckId, getCards]);

  useEffect(() => {
    loadDeck();
    loadCards();
  }, [loadDeck, loadCards]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadDeck(), loadCards()]);
    setRefreshing(false);
  }, [loadDeck, loadCards]);

  const handleDeleteCard = (card: Card) => {
    Alert.alert(
      'Delete Card',
      'Are you sure you want to delete this card?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCard(card.id);
              await loadCards();
            } catch (error) {
              console.error('Error deleting card:', error);
              Alert.alert('Error', 'Failed to delete card');
            }
          },
        },
      ]
    );
  };

  const handleEditCard = (card: Card) => {
    router.push(`/card/edit/${card.id}`);
  };

  const handleAddCard = () => {
    router.push(`/card/create/${deckId}`);
  };

  const handleStudy = () => {
    if (cards.length === 0) {
      Alert.alert('No Cards', 'Add some cards to this deck before studying.');
      return;
    }
    router.push(`/(tabs)/study?deckId=${deckId}&deckName=${encodeURIComponent(deck?.name || '')}`);
  };

  const renderCardItem = ({ item: card }: { item: Card }) => (
    <CardItem
      card={card}
      onEdit={() => handleEditCard(card)}
      onDelete={() => handleDeleteCard(card)}
    />
  );

  if (!deck) {
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
          title: deck.name,
          headerBackTitle: 'Decks',
        }} 
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.deckInfo}>
            <Text style={styles.deckName}>{deck.name}</Text>
            {deck.description ? (
              <Text style={styles.deckDescription}>{deck.description}</Text>
            ) : null}
            <Text style={styles.cardCount}>
              {cards.length} {cards.length === 1 ? 'card' : 'cards'}
            </Text>
          </View>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.studyButton}
              onPress={handleStudy}
            >
              <Ionicons name="school" size={20} color="#FFFFFF" />
              <Text style={styles.studyButtonText}>Study</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.addCardButton}
              onPress={handleAddCard}
            >
              <Ionicons name="add" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {cards.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="duplicate-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>No Cards Yet</Text>
            <Text style={styles.emptyDescription}>
              Add your first card to start building this deck
            </Text>
            <TouchableOpacity
              style={styles.addFirstCardButton}
              onPress={handleAddCard}
            >
              <Text style={styles.addFirstCardButtonText}>Add First Card</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={cards}
            renderItem={renderCardItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>
    </>
  );
}

interface CardItemProps {
  card: Card;
  onEdit: () => void;
  onDelete: () => void;
}

function CardItem({ card, onEdit, onDelete }: CardItemProps) {
  return (
    <TouchableOpacity style={styles.cardItem} onPress={onEdit}>
      <View style={styles.cardContent}>
        <View style={styles.cardSide}>
          <Text style={styles.cardLabel}>Front</Text>
          <Text style={styles.cardText} numberOfLines={2}>
            {card.front}
          </Text>
        </View>
        
        <View style={styles.cardSide}>
          <Text style={styles.cardLabel}>Back</Text>
          <Text style={styles.cardText} numberOfLines={2}>
            {card.back}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={onDelete} style={styles.deleteCardButton}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  deckInfo: {
    marginBottom: 16,
  },
  deckName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  deckDescription: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 8,
    lineHeight: 24,
  },
  cardCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studyButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
  },
  studyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addCardButton: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  listContainer: {
    padding: 16,
  },
  cardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
    flexDirection: 'row',
    flex: 1,
  },
  cardSide: {
    flex: 1,
    marginRight: 16,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  cardText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 22,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  deleteCardButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addFirstCardButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstCardButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
