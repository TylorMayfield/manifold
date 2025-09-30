import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should return initial value when no stored value exists', () => {
    const { result } = renderHook(() => 
      useLocalStorage('test-key', 'initial-value')
    );

    expect(result.current[0]).toBe('initial-value');
  });

  it('should return stored value when it exists', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'));

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial-value')
    );

    expect(result.current[0]).toBe('stored-value');
  });

  it('should update localStorage when value changes', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial')
    );

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify('updated'));
  });

  it('should handle complex objects', () => {
    const complexObject = { name: 'test', count: 42, nested: { value: true } };

    const { result } = renderHook(() =>
      useLocalStorage('test-key', complexObject)
    );

    expect(result.current[0]).toEqual(complexObject);

    act(() => {
      result.current[1]({ ...complexObject, count: 100 });
    });

    expect(result.current[0].count).toBe(100);
  });

  it('should handle arrays', () => {
    const initialArray = [1, 2, 3];

    const { result } = renderHook(() =>
      useLocalStorage('test-key', initialArray)
    );

    expect(result.current[0]).toEqual(initialArray);

    act(() => {
      result.current[1]([...initialArray, 4]);
    });

    expect(result.current[0]).toEqual([1, 2, 3, 4]);
  });

  it('should handle null values', () => {
    const { result } = renderHook(() =>
      useLocalStorage<string | null>('test-key', null)
    );

    expect(result.current[0]).toBeNull();
  });

  it('should handle function updater', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 0)
    );

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);

    act(() => {
      result.current[1]((prev) => prev * 2);
    });

    expect(result.current[0]).toBe(2);
  });

  it('should handle localStorage errors gracefully', () => {
    // Mock localStorage.setItem to throw an error
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('Storage full');
      });

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial')
    );

    // Should not throw error
    act(() => {
      result.current[1]('new-value');
    });

    setItemSpy.mockRestore();
  });

  it('should handle invalid JSON in localStorage', () => {
    localStorage.setItem('test-key', 'invalid-json{');

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'fallback')
    );

    // Should fallback to initial value
    expect(result.current[0]).toBe('fallback');
  });

  it('should persist value to localStorage', () => {
    const { result } = renderHook(() =>
      useLocalStorage('persist-key', 'initial')
    );

    act(() => {
      result.current[1]('persisted');
    });

    // Value should be in localStorage
    const stored = localStorage.getItem('persist-key');
    expect(stored).toBe(JSON.stringify('persisted'));
  });

  it('should support removeValue function', () => {
    const { result } = renderHook(() =>
      useLocalStorage('remove-key', 'initial')
    );

    // Set a value first
    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');

    // Remove it
    act(() => {
      result.current[2](); // removeValue is the third element
    });

    // Should reset to initial value
    expect(result.current[0]).toBe('initial');
    expect(localStorage.getItem('remove-key')).toBeNull();
  });
});
