import { Stack } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';

export default function CardLayout() {
  const { theme } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.isDark ? '#000000' : '#FFFFFF',
        },
        headerTintColor: theme.isDark ? '#cdc2dc' : '#1a434e',
        headerTitleStyle: {
          color: theme.isDark ? '#cdc2dc' : '#1a434e',
        },
        headerBackTitleVisible: true,
        presentation: 'card',
      }}
    >
      <Stack.Screen 
        name="create/[deckId]" 
        options={{ 
          title: 'Add Card',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="edit/[id]" 
        options={{ 
          title: 'Edit Card',
          headerBackTitle: 'Back',
        }} 
      />
    </Stack>
  );
}
