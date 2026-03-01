import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
export default function DamDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { colors } = useTheme();
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.text }}>{name}</Text></SafeAreaView>;
}
