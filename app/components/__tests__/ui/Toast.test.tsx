import { Toast } from '@/app/components/ui/Toast';
import { render } from '@testing-library/react';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Toaster: ({ children, ...props }: any) => (
    <div data-testid="toaster" {...props}>
      {children}
    </div>
  ),
}));

describe('Toast', () => {
  it('should render toaster component', () => {
    const { getByTestId } = render(<Toast />);
    
    const toaster = getByTestId('toaster');
    expect(toaster).toBeInTheDocument();
  });

  it('should have correct position', () => {
    const { getByTestId } = render(<Toast />);
    
    const toaster = getByTestId('toaster');
    expect(toaster).toHaveAttribute('position', 'top-right');
  });

  it('should have toast options configured', () => {
    const { getByTestId } = render(<Toast />);
    
    const toaster = getByTestId('toaster');
    expect(toaster).toHaveAttribute('toastOptions');
  });
});
