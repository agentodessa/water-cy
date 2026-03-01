import { render } from '@testing-library/react-native';
import React from 'react';
import { SystemGauge } from '../components/SystemGauge';
import { ThemeProvider } from '../theme/ThemeContext';

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children }: any) => <View>{children}</View>,
    Path: () => null,
    Circle: () => null,
  };
});

it('renders percentage text', () => {
  const { getByText } = render(
    <ThemeProvider>
      <SystemGauge percentage={0.203} date="Feb 27, 2026" />
    </ThemeProvider>
  );
  expect(getByText('20.3%')).toBeTruthy();
  expect(getByText('Feb 27, 2026')).toBeTruthy();
});
