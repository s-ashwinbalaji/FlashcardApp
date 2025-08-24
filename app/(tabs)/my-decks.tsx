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
import { LinearGradient } from 'expo-linear-gradient';
import { useDatabase, Deck } from '../../hooks/useDatabase';
import { useTheme } from '../../hooks/useTheme';

export default function MyDecksScreen() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { getDecks, deleteDeck, getDeckStats } = useDatabase();
  const { theme } = useTheme();

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
        theme={theme}
      />
    );
  };

  return (
    <View style={[
      styles.container,
      theme.isDark && { backgroundColor: '#000000' }
    ]}>
      {/* Title Section */}
      <View style={[
        styles.titleSection,
        theme.isDark && { backgroundColor: '#cdc2dc', borderBottomColor: '#cdc2dc' }
      ]}>
        <Text style={[
          styles.title,
          theme.isDark && { color: '#000000' }
        ]}>My Decks</Text>
      </View>

      {decks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="library-outline" size={64} color={theme.isDark ? "#cdc2dc" : "#C7C7CC"} />
          <Text style={[
            styles.emptyTitle,
            theme.isDark && { color: '#cdc2dc' }
          ]}>No Decks Yet</Text>
          <Text style={[
            styles.emptyDescription,
            theme.isDark && { color: '#cdc2dc' }
          ]}>
            Create your first deck to start learning with flashcards
          </Text>
          <TouchableOpacity
            style={[
              styles.createButton,
              theme.isDark && { backgroundColor: '#cdc2dc' }
            ]}
            onPress={() => router.push('/create')}
          >
            <Text style={[
              styles.createButtonText,
              theme.isDark && { color: '#000000' }
            ]}>Create Your First Deck</Text>
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
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          theme.isDark && { backgroundColor: '#cdc2dc' }
        ]}
        onPress={() => router.push('/create')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color={theme.isDark ? "#000000" : "#FFFFFF"} />
      </TouchableOpacity>
    </View>
  );
}

interface DeckCardProps {
  deck: Deck;
  onStudy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  theme: any; // Using any for now to avoid import issues
}

function DeckCard({ deck, onStudy, onEdit, onDelete, theme }: DeckCardProps) {
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
    <View style={[
      styles.deckCard,
      theme.isDark && { 
        backgroundColor: '#1a1a1a', 
        borderColor: '#cdc2dc',
        borderLeftColor: '#cdc2dc'
      }
    ]}>
      <TouchableOpacity style={styles.deckContent} onPress={onEdit}>
        <View style={styles.deckHeader}>
          <Text style={[
            styles.deckName,
            theme.isDark && { color: '#cdc2dc' }
          ]} numberOfLines={1}>
            {deck.name}
          </Text>
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
        
        {deck.description ? (
          <Text style={[
            styles.deckDescription,
            theme.isDark && { color: '#cdc2dc' }
          ]} numberOfLines={2}>
            {deck.description}
          </Text>
        ) : null}
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[
              styles.statNumber,
              theme.isDark && { color: '#cdc2dc' }
            ]}>{stats.total}</Text>
            <Text style={[
              styles.statLabel,
              theme.isDark && { color: '#cdc2dc' }
            ]}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[
              styles.statNumber, 
              { color: theme.isDark ? '#FFB74D' : '#FF9500' }
            ]}>
              {stats.new}
            </Text>
            <Text style={[
              styles.statLabel,
              theme.isDark && { color: '#cdc2dc' }
            ]}>New</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[
              styles.statNumber, 
              { color: theme.isDark ? '#FF8A80' : '#FF3B30' }
            ]}>
              {stats.due}
            </Text>
            <Text style={[
              styles.statLabel,
              theme.isDark && { color: '#cdc2dc' }
            ]}>Due</Text>
          </View>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.studyButton,
          stats.total === 0 && styles.studyButtonDisabled,
          theme.isDark && { backgroundColor: '#cdc2dc' }
        ]}
        onPress={onStudy}
        disabled={stats.total === 0}
      >
        <Text
          style={[
            styles.studyButtonText,
            stats.total === 0 && styles.studyButtonTextDisabled,
            theme.isDark && { color: '#000000' }
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
    backgroundColor: '#FFFFFF',
  },
  titleSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 40,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a434e',
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
    paddingTop: 20,
  },
  deckCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#1a434e',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderLeftWidth: 4,
    borderLeftColor: '#1a434e',
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
    color: '#1a434e',
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
    color: '#1a434e',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  studyButton: {
    backgroundColor: '#1a434e',
    padding: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#1a434e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
    paddingTop: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a434e',
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
    backgroundColor: '#0f4c75',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
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
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a434e',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1a434e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
