import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../../hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated', delay: 500 });

    // Should still be initial value (not debounced yet)
    expect(result.current).toBe('initial');

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Now should be updated
    expect(result.current).toBe('updated');
  });

  it('should cancel previous timeout on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    // Rapid changes
    rerender({ value: 'change1' });
    act(() => { jest.advanceTimersByTime(200); });
    
    rerender({ value: 'change2' });
    act(() => { jest.advanceTimersByTime(200); });
    
    rerender({ value: 'change3' });
    act(() => { jest.advanceTimersByTime(200); });

    // Should still be initial (no change has completed)
    expect(result.current).toBe('initial');

    // Complete the debounce
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should only have the last value
    expect(result.current).toBe('change3');
  });

  it('should handle different delay times', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 1000 } }
    );

    rerender({ value: 'updated', delay: 1000 });

    act(() => {
      jest.advanceTimersByTime(999);
    });

    // Should not be updated yet
    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(1);
    });

    // Now should be updated
    expect(result.current).toBe('updated');
  });

  it('should handle zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 0),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(result.current).toBe('updated');
  });

  it('should debounce complex objects', () => {
    const initial = { name: 'John', age: 30 };
    const updated = { name: 'Jane', age: 25 };

    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: initial } }
    );

    expect(result.current).toEqual(initial);

    rerender({ value: updated });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toEqual(updated);
  });

  it('should handle arrays', () => {
    const initial = [1, 2, 3];
    const updated = [4, 5, 6];

    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: initial } }
    );

    rerender({ value: updated });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toEqual(updated);
  });

  it('should cleanup timeout on unmount', () => {
    const { unmount } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    // Should not throw error
    unmount();

    // Advance timers to ensure no memory leaks
    act(() => {
      jest.advanceTimersByTime(1000);
    });
  });

  it('should handle multiple rapid updates followed by stability', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    // Simulate typing
    const updates = ['i', 'in', 'inp', 'inpu', 'input'];
    
    updates.forEach((value, index) => {
      rerender({ value });
      act(() => {
        jest.advanceTimersByTime(50); // User types every 50ms
      });
    });

    // Should still be initial (typing is fast)
    expect(result.current).toBe('initial');

    // User stops typing, wait for debounce
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should have the final value
    expect(result.current).toBe('input');
  });

  it('should handle boolean values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: false } }
    );

    expect(result.current).toBe(false);

    rerender({ value: true });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe(true);
  });

  it('should handle number values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 0 } }
    );

    rerender({ value: 42 });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe(42);
  });
});
