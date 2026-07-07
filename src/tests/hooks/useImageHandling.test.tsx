import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useImageHandling } from '@/hooks/useImageHandling';

describe('useImageHandling', () => {
  const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-preview');
  const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

  afterEach(() => {
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
  });

  it('creates a preview url for the selected image and clears it later', () => {
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    const { result } = renderHook(() => useImageHandling());

    act(() => {
      result.current.handleImageSelect(file);
    });

    expect(result.current.selectedFile).toBe(file);
    expect(result.current.previewUrl).toBe('blob:test-preview');
    expect(createObjectURL).toHaveBeenCalledWith(file);

    act(() => {
      result.current.clearImage();
    });

    expect(result.current.selectedFile).toBeNull();
    expect(result.current.previewUrl).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-preview');
  });
});
