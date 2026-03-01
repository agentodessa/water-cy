import { SafeAreaView, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
export default function TrendsScreen() {
  const { colors } = useTheme();
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.text }}>Trends</Text></SafeAreaView>;
}
