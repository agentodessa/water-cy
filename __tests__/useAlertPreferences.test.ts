import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, act } from '@testing-library/react-native';
import { useAlertPreferences } from '../hooks/useAlertPreferences';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

describe('useAlertPreferences', () => {
  beforeEach(() => jest.clearAllMocks());

  it('defaults to all types enabled', () => {
    const { result } = renderHook(() => useAlertPreferences());
    expect(result.current.isEnabled('earthquake')).toBe(true);
    expect(result.current.isEnabled('flood')).toBe(true);
    expect(result.current.isEnabled('cyclone')).toBe(true);
    expect(result.current.isEnabled('volcano')).toBe(true);
    expect(result.current.isEnabled('drought')).toBe(true);
  });

  it('toggles a type off and on', () => {
    const { result } = renderHook(() => useAlertPreferences());

    act(() => result.current.toggleType('flood'));
    expect(result.current.isEnabled('flood')).toBe(false);

    act(() => result.current.toggleType('flood'));
    expect(result.current.isEnabled('flood')).toBe(true);
  });

  it('persists to AsyncStorage on toggle', () => {
    const { result } = renderHook(() => useAlertPreferences());
    act(() => result.current.toggleType('earthquake'));
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'alert-preferences',
      expect.any(String),
    );
  });

  it('exposes enabledTypes as a Set', () => {
    const { result } = renderHook(() => useAlertPreferences());
    expect(result.current.enabledTypes).toBeInstanceOf(Set);
    expect(result.current.enabledTypes.size).toBe(5);
  });
});
