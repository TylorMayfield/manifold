import { cn } from '../../lib/utils/cn';

describe('cn utility', () => {
  it('should combine multiple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    expect(cn('foo', true && 'bar', 'baz')).toBe('foo bar baz');
  });

  it('should handle objects with boolean values', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });

  it('should handle arrays', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });

  it('should handle mixed inputs', () => {
    expect(cn('foo', ['bar', 'baz'], { qux: true, quux: false })).toBe('foo bar baz qux');
  });

  it('should filter out falsy values', () => {
    expect(cn('foo', null, undefined, false, '', 'bar')).toBe('foo bar');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn(null, undefined, false)).toBe('');
  });

  it('should handle Tailwind utility classes', () => {
    expect(cn('bg-white', 'text-black', 'p-4')).toBe('bg-white text-black p-4');
  });

  it('should handle responsive classes', () => {
    expect(cn('text-sm', 'md:text-base', 'lg:text-lg')).toBe('text-sm md:text-base lg:text-lg');
  });

  it('should handle state variants', () => {
    expect(cn('hover:bg-gray-100', 'focus:ring-2', 'active:scale-95')).toBe('hover:bg-gray-100 focus:ring-2 active:scale-95');
  });

  it('should handle duplicate classes in objects', () => {
    // When a class is added both as string and in object, it appears twice
    const result = cn('foo', { foo: true, bar: true });
    // clsx doesn't deduplicate across different input types
    expect(result).toContain('foo');
    expect(result).toContain('bar');
  });

  it('should handle complex conditional logic', () => {
    const variant = 'primary';
    const isDisabled = false;
    const size = 'md';

    const classes = cn(
      'base-class',
      variant === 'primary' && 'bg-blue-500',
      isDisabled && 'opacity-50',
      {
        'px-4': size === 'md',
        'px-6': size === 'lg',
      }
    );

    expect(classes).toBe('base-class bg-blue-500 px-4');
  });

  it('should handle undefined and null gracefully', () => {
    const classes = cn('foo', undefined, null, 'bar');
    expect(classes).toBe('foo bar');
  });

  it('should work with dynamic values', () => {
    const active = true;
    const disabled = false;
    
    expect(cn('btn', active && 'active', disabled && 'disabled')).toBe('btn active');
  });
});
