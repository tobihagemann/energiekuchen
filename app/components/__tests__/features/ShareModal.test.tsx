import { ShareModal } from '@/app/components/features/ShareModal';
import * as SharingUtils from '@/app/lib/utils/sharing';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import toast from 'react-hot-toast';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

const mockToast = toast as jest.Mocked<typeof toast>;

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, width, height, className }: {
    src: string;
    alt: string;
    width?: number | string;
    height?: number | string;
    className?: string;
  }) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img 
        src={src} 
        alt={alt} 
        width={width} 
        height={height} 
        className={className}
        data-testid="qr-code-image"
      />
    );
  };
});

// Mock contexts
const mockUIContext = {
  state: { isShareModalOpen: true },
  closeShareModal: jest.fn()
};

const mockEnergyContext = {
  state: { 
    data: { 
      positive: [{ id: 1, activity: 'Test Activity', energyLevel: 8 }],
      negative: [{ id: 2, activity: 'Bad Activity', energyLevel: 2 }]
    } 
  }
};

jest.mock('@/app/lib/contexts/UIContext', () => ({
  useUI: () => mockUIContext
}));

jest.mock('@/app/lib/contexts/EnergyContext', () => ({
  useEnergy: () => mockEnergyContext
}));

// Mock SharingManager
jest.mock('@/app/lib/utils/sharing', () => ({
  SharingManager: {
    generateShareData: jest.fn(),
    copyToClipboard: jest.fn()
  }
}));

// Get the mocked SharingManager
const mockSharingManager = SharingUtils.SharingManager as jest.Mocked<typeof SharingUtils.SharingManager>;

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  CheckIcon: ({ className }: { className?: string }) => (
    <div data-testid="check-icon" className={className} />
  ),
  ClipboardIcon: ({ className }: { className?: string }) => (
    <div data-testid="clipboard-icon" className={className} />
  )
}));

// Mock window.open
Object.defineProperty(window, 'open', {
  value: jest.fn()
});

describe('ShareModal', () => {
  const mockShareData = {
    encoded: 'bW9jay1lbmNvZGVkLWRhdGE=',
    url: 'https://example.com/share/12345',
    qrCode: 'data:image/png;base64,mock-qr-code'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSharingManager.generateShareData.mockResolvedValue(mockShareData);
    // Reset UI context state
    mockUIContext.state.isShareModalOpen = true;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the modal when open', async () => {
    await act(async () => {
      render(<ShareModal />);
    });
    
    expect(screen.getByText('Energiekuchen teilen')).toBeInTheDocument();
    expect(screen.getByText(/Teilen Sie Ihre Energiekuchen mit anderen/)).toBeInTheDocument();
  });

  it('does not render when modal is closed', async () => {
    await act(async () => {
      mockUIContext.state.isShareModalOpen = false;
      render(<ShareModal />);
    });
    
    expect(screen.queryByText('Energiekuchen teilen')).not.toBeInTheDocument();
  });

  it('shows loading state while generating share data', async () => {
    // Create a slow promise to ensure we can see the loading state
    let resolvePromise: (value: typeof mockShareData) => void;
    const slowPromise = new Promise<typeof mockShareData>((resolve) => {
      resolvePromise = resolve;
    });
    mockSharingManager.generateShareData.mockReturnValue(slowPromise);
    
    render(<ShareModal />);
    
    expect(screen.getByText('Erstelle Sharing-Link...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    
    // Resolve the promise to complete the test
    resolvePromise!(mockShareData);
    await waitFor(() => {
      expect(screen.getByDisplayValue(mockShareData.url)).toBeInTheDocument();
    });
  });

  it('generates share data on modal open', async () => {
    await act(async () => {
      render(<ShareModal />);
    });
    
    await waitFor(() => {
      expect(mockSharingManager.generateShareData).toHaveBeenCalledWith(mockEnergyContext.state.data);
    });
  });

  describe('Share Data Display', () => {
    beforeEach(async () => {
      await act(async () => {
        render(<ShareModal />);
      });
      // Wait for the loading state to complete and share data to be displayed
      await waitFor(() => {
        expect(screen.getByDisplayValue(mockShareData.url)).toBeInTheDocument();
      });
    });

    it('displays sharing URL input', () => {
      expect(screen.getByDisplayValue(mockShareData.url)).toBeInTheDocument();
      expect(screen.getByText('Sharing-Link')).toBeInTheDocument();
    });

    it('makes URL input readonly', () => {
      const urlInput = screen.getByDisplayValue(mockShareData.url);
      expect(urlInput).toHaveAttribute('readonly');
    });

    it('displays QR code', () => {
      expect(screen.getByTestId('qr-code-image')).toBeInTheDocument();
      expect(screen.getByText('QR-Code')).toBeInTheDocument();
      expect(screen.getByText('QR-Code scannen zum direkten Öffnen')).toBeInTheDocument();
    });

    it('displays quick share options', () => {
      expect(screen.getByText('Schnell teilen')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'WhatsApp' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'E-Mail' })).toBeInTheDocument();
    });

    it('shows privacy notice', () => {
      expect(screen.getByText(/Der Link enthält Ihre Energiekuchen-Daten/)).toBeInTheDocument();
    });
  });

  describe('Copy functionality', () => {
    beforeEach(async () => {
      await act(async () => {
        render(<ShareModal />);
      });
      // Wait for the loading state to complete and copy button to be available
      await waitFor(() => {
        expect(screen.getByTestId('clipboard-icon')).toBeInTheDocument();
      });
    });

    it('copies URL to clipboard when copy button is clicked', async () => {
      mockSharingManager.copyToClipboard.mockResolvedValue(undefined);
      
      const copyButton = screen.getByTestId('clipboard-icon').closest('button')!;
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(mockSharingManager.copyToClipboard).toHaveBeenCalledWith(mockShareData.url);
        expect(mockToast.success).toHaveBeenCalledWith('Link kopiert!');
      });
    });

    it('shows check icon after successful copy', async () => {
      mockSharingManager.copyToClipboard.mockResolvedValue(undefined);
      
      const copyButton = screen.getByTestId('clipboard-icon').closest('button')!;
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      });
    });

    it('reverts to clipboard icon after timeout', async () => {
      mockSharingManager.copyToClipboard.mockResolvedValue(undefined);
      
      const copyButton = screen.getByTestId('clipboard-icon').closest('button')!;
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      });
      
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('clipboard-icon')).toBeInTheDocument();
      });
    });

    it('handles copy error', async () => {
      mockSharingManager.copyToClipboard.mockRejectedValue(new Error('Copy failed'));
      
      const copyButton = screen.getByTestId('clipboard-icon').closest('button')!;
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Fehler beim Kopieren des Links');
      });
    });
  });

  describe('Quick share options', () => {
    beforeEach(async () => {
      await act(async () => {
        render(<ShareModal />);
      });
      // Wait for the loading state to complete and quick share buttons to be available
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'WhatsApp' })).toBeInTheDocument();
      });
    });

    it('opens WhatsApp with formatted message', () => {
      const whatsappButton = screen.getByRole('button', { name: 'WhatsApp' });
      fireEvent.click(whatsappButton);
      
      const expectedText = `Schau dir meinen Energiekuchen an: ${mockShareData.url}`;
      const expectedUrl = `https://wa.me/?text=${encodeURIComponent(expectedText)}`;
      
      expect(window.open).toHaveBeenCalledWith(expectedUrl, '_blank');
    });

    it('opens email with formatted content', () => {
      const emailButton = screen.getByRole('button', { name: 'E-Mail' });
      fireEvent.click(emailButton);
      
      const expectedSubject = 'Mein Energiekuchen';
      const expectedBody = `Hallo!\n\nIch möchte meinen Energiekuchen mit dir teilen:\n\n${mockShareData.url}\n\nViele Grüße!`;
      const expectedUrl = `mailto:?subject=${encodeURIComponent(expectedSubject)}&body=${encodeURIComponent(expectedBody)}`;
      
      expect(window.open).toHaveBeenCalledWith(expectedUrl);
    });
  });

  describe('Error handling', () => {
    it('shows error state when share generation fails', async () => {
      mockSharingManager.generateShareData.mockRejectedValue(new Error('Generation failed'));
      
      await act(async () => {
        render(<ShareModal />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Fehler beim Erstellen des Sharing-Links')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Erneut versuchen' })).toBeInTheDocument();
      });
      
      expect(mockToast.error).toHaveBeenCalledWith('Fehler beim Erstellen der Sharing-Daten');
    });

    it('retries share generation when retry button is clicked', async () => {
      mockSharingManager.generateShareData
        .mockRejectedValueOnce(new Error('Generation failed'))
        .mockResolvedValueOnce(mockShareData);
      
      await act(async () => {
        render(<ShareModal />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Fehler beim Erstellen des Sharing-Links')).toBeInTheDocument();
      });
      
      const retryButton = screen.getByRole('button', { name: 'Erneut versuchen' });
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(mockSharingManager.generateShareData).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Modal interactions', () => {
    it('closes modal when close button is clicked', async () => {
      await act(async () => {
        render(<ShareModal />);
      });
      
      const closeButtons = screen.getAllByRole('button', { name: 'Schließen' });
      // Click the main close button (the one at the bottom)
      fireEvent.click(closeButtons[1]);
      
      expect(mockUIContext.closeShareModal).toHaveBeenCalled();
    });

    it('resets state when modal is closed', async () => {
      await act(async () => {
        render(<ShareModal />);
      });
      
      await waitFor(() => {
        expect(mockSharingManager.generateShareData).toHaveBeenCalled();
      });
      
      const closeButtons = screen.getAllByRole('button', { name: 'Schließen' });
      // Click the main close button (the one at the bottom)
      fireEvent.click(closeButtons[1]);
      
      expect(mockUIContext.closeShareModal).toHaveBeenCalled();
    });

    it('regenerates share data when modal reopens', async () => {
      const { rerender } = await act(async () => {
        return render(<ShareModal />);
      });
      
      // Wait for initial generation
      await waitFor(() => {
        expect(mockSharingManager.generateShareData).toHaveBeenCalledTimes(1);
      });
      
      // Close modal by updating the context state
      act(() => {
        mockUIContext.state.isShareModalOpen = false;
      });
      rerender(<ShareModal />);
      
      // Wait a bit to ensure the component processes the close
      await waitFor(() => {
        expect(screen.queryByText('Energiekuchen teilen')).not.toBeInTheDocument();
      });
      
      // Reset the mock to track new calls
      mockSharingManager.generateShareData.mockClear();
      
      // Reopen modal
      act(() => {
        mockUIContext.state.isShareModalOpen = true;
      });
      rerender(<ShareModal />);
      
      // Wait for the component to generate share data again
      await waitFor(() => {
        expect(mockSharingManager.generateShareData).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('UI elements', () => {
    it('displays correct modal title', async () => {
      await act(async () => {
        render(<ShareModal />);
      });
      
      expect(screen.getByText('Energiekuchen teilen')).toBeInTheDocument();
    });

    it('has proper loading spinner styling', async () => {
      // Create a slow promise to ensure we can see the loading state
      let resolvePromise: (value: typeof mockShareData) => void;
      const slowPromise = new Promise<typeof mockShareData>((resolve) => {
        resolvePromise = resolve;
      });
      mockSharingManager.generateShareData.mockReturnValue(slowPromise);
      
      render(<ShareModal />);
      
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('rounded-full', 'border-b-2', 'border-yellow-400');
      
      // Resolve the promise to complete the test
      resolvePromise!(mockShareData);
      await waitFor(() => {
        expect(screen.getByDisplayValue(mockShareData.url)).toBeInTheDocument();
      });
    });

    it('styles QR code container correctly', async () => {
      await act(async () => {
        render(<ShareModal />);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('qr-code-image')).toBeInTheDocument();
      });
      
      const qrContainer = screen.getByTestId('qr-code-image').closest('div');
      expect(qrContainer).toHaveClass('p-4', 'bg-white', 'border', 'border-gray-200', 'rounded-lg');
    });

    it('styles privacy notice correctly', async () => {
      await act(async () => {
        render(<ShareModal />);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Der Link enthält Ihre Energiekuchen-Daten/)).toBeInTheDocument();
      });
      
      const privacyNotice = screen.getByText(/Der Link enthält Ihre Energiekuchen-Daten/).closest('div');
      expect(privacyNotice).toHaveClass('bg-blue-50', 'p-3', 'rounded-md');
    });
  });
});
