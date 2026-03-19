import { render } from '@testing-library/react-native';
import React from 'react';
import { SystemGauge } from '../components/SystemGauge';

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
    <SystemGauge percentage={0.203} date="Feb 27, 2026" />
  );
  expect(getByText('20.3%')).toBeTruthy();
  expect(getByText('Feb 27, 2026')).toBeTruthy();
});
