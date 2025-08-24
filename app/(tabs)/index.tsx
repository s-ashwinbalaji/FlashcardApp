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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase, Deck } from '../../hooks/useDatabase';

export default function MyDecksScreen() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { getDecks, deleteDeck, getDeckStats } = useDatabase();

  const loadDecks = useCallback(async () => {
    try {
      const fetchedDecks = await getDecks();
      setDecks(fetchedDecks);
    } catch (error) {
      console.error('Error loading decks:', error);
    }
  }, [getDecks]);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDecks();
    setRefreshing(false);
  }, [loadDecks]);

  const handleDeleteDeck = (deck: Deck) => {
    Alert.alert(
      'Delete Deck',
      `Are you sure you want to delete "${deck.name}"? This will also delete all cards in this deck.`,
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
              await deleteDeck(deck.id);
              await loadDecks();
            } catch (error) {
              console.error('Error deleting deck:', error);
              Alert.alert('Error', 'Failed to delete deck');
            }
          },
        },
      ]
    );
  };

  const handleStudyDeck = (deck: Deck) => {
    router.push(`/(tabs)/study?deckId=${deck.id}&deckName=${encodeURIComponent(deck.name)}`);
  };

  const handleEditDeck = (deck: Deck) => {
    router.push(`/deck/${deck.id}`);
  };

  const renderDeckItem = ({ item: deck }: { item: Deck }) => {
    return (
      <DeckCard
        deck={deck}
        onStudy={() => handleStudyDeck(deck)}
        onEdit={() => handleEditDeck(deck)}
        onDelete={() => handleDeleteDeck(deck)}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Decks</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/create')}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {decks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="library-outline" size={64} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>No Decks Yet</Text>
          <Text style={styles.emptyDescription}>
            Create your first deck to start learning with flashcards
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/create')}
          >
            <Text style={styles.createButtonText}>Create Your First Deck</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={decks}
          renderItem={renderDeckItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

interface DeckCardProps {
  deck: Deck;
  onStudy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function DeckCard({ deck, onStudy, onEdit, onDelete }: DeckCardProps) {
  const [stats, setStats] = useState({ total: 0, due: 0, new: 0 });
  const { getDeckStats } = useDatabase();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const deckStats = await getDeckStats(deck.id);
        setStats(deckStats);
      } catch (error) {
        console.error('Error loading deck stats:', error);
      }
    };
    loadStats();
  }, [deck.id, getDeckStats]);

  return (
    <View style={styles.deckCard}>
      <TouchableOpacity style={styles.deckContent} onPress={onEdit}>
        <View style={styles.deckHeader}>
          <Text style={styles.deckName} numberOfLines={1}>
            {deck.name}
          </Text>
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
        
        {deck.description ? (
          <Text style={styles.deckDescription} numberOfLines={2}>
            {deck.description}
          </Text>
        ) : null}
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FF9500' }]}>
              {stats.new}
            </Text>
            <Text style={styles.statLabel}>New</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FF3B30' }]}>
              {stats.due}
            </Text>
            <Text style={styles.statLabel}>Due</Text>
          </View>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.studyButton,
          stats.total === 0 && styles.studyButtonDisabled,
        ]}
        onPress={onStudy}
        disabled={stats.total === 0}
      >
        <Text
          style={[
            styles.studyButtonText,
            stats.total === 0 && styles.studyButtonTextDisabled,
          ]}
        >
          Study {stats.due + stats.new > 0 ? `(${stats.due + stats.new})` : ''}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F2F2F7',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  addButton: {
    padding: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  deckCard: {
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
  deckContent: {
    padding: 16,
  },
  deckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deckName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  deckDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  studyButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  studyButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  studyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  studyButtonTextDisabled: {
    color: '#8E8E93',
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
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
