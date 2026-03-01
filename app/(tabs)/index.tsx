import { SafeAreaView, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
export default function HomeScreen() {
  const { colors } = useTheme();
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.text }}>Home</Text></SafeAreaView>;
}
