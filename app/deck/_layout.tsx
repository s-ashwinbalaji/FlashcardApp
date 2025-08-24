import { Stack } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';

export default function DeckLayout() {
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
        name="[id]" 
        options={{ 
          title: 'Deck Details',
          headerBackTitle: 'Back',
        }} 
      />
    </Stack>
  );
}
