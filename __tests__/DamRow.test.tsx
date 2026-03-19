import { render } from '@testing-library/react-native';
import React from 'react';
import { DamRow } from '../components/DamRow';

it('renders dam name and percentage', () => {
  const { getByText } = render(
    <DamRow
      name="Kouris"
      percentage={0.183}
      capacityMCM={115}
      storageMCM={21.09}
      onPress={() => {}}
    />
  );
  expect(getByText('Kouris')).toBeTruthy();
  expect(getByText('18.3%')).toBeTruthy();
});
