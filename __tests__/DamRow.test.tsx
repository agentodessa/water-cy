import { render } from '@testing-library/react-native';
import React from 'react';
import { DamRow } from '../components/DamRow';
import { ThemeProvider } from '../theme/ThemeContext';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

it('renders dam name and percentage', () => {
  const { getByText } = render(
    <ThemeProvider>
      <DamRow
        name="Kouris"
        percentage={0.183}
        capacityMCM={115}
        storageMCM={21.09}
        onPress={() => {}}
      />
    </ThemeProvider>
  );
  expect(getByText('Kouris')).toBeTruthy();
  expect(getByText('18.3%')).toBeTruthy();
});
