import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FormField } from '@/components/Ui/FormField';

describe('FormField', () => {
  it('connects label, hint, error, and input', () => {
    render(
      <FormField label="邮箱" hint="请输入常用邮箱" error="邮箱格式不正确">
        <input />
      </FormField>,
    );

    expect(screen.getByLabelText('邮箱')).toBeTruthy();
    expect(screen.getByText('请输入常用邮箱')).toBeTruthy();
    expect(screen.getByText('邮箱格式不正确')).toBeTruthy();
  });
});
