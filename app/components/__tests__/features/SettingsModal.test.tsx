import { SettingsModal } from '@/app/components/features/SettingsModal';
import { AppSettings } from '@/app/types';
import { fireEvent, render, screen } from '@testing-library/react';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn()
  }
}));

import { toast } from 'react-hot-toast';

// Mock contexts
const mockUIContext = {
  state: { isSettingsModalOpen: true },
  closeSettingsModal: jest.fn()
};

const defaultSettings: AppSettings = {
  chartSize: 'medium',
  colorScheme: 'default',
  showTooltips: true,
  showLegends: true,
  language: 'de'
};

const mockEnergyContext = {
  state: { 
    data: { 
      settings: { ...defaultSettings }
    } 
  },
  dispatch: jest.fn()
};

jest.mock('@/app/lib/contexts/UIContext', () => ({
  useUI: () => mockUIContext
}));

jest.mock('@/app/lib/contexts/EnergyContext', () => ({
  useEnergy: () => mockEnergyContext
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  ChartPieIcon: ({ className }: { className?: string }) => (
    <div data-testid="chart-pie-icon" className={className} />
  ),
  CogIcon: ({ className }: { className?: string }) => (
    <div data-testid="cog-icon" className={className} />
  ),
  EyeIcon: ({ className }: { className?: string }) => (
    <div data-testid="eye-icon" className={className} />
  ),
  EyeSlashIcon: ({ className }: { className?: string }) => (
    <div data-testid="eye-slash-icon" className={className} />
  ),
  InformationCircleIcon: ({ className }: { className?: string }) => (
    <div data-testid="information-circle-icon" className={className} />
  ),
  PaintBrushIcon: ({ className }: { className?: string }) => (
    <div data-testid="paint-brush-icon" className={className} />
  )
}));

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: jest.fn()
});

describe('SettingsModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default settings and ensure modal is open
    mockEnergyContext.state.data.settings = { ...defaultSettings };
    mockUIContext.state.isSettingsModalOpen = true;
  });    it('renders the modal when open', () => {
      render(<SettingsModal />);
      
      expect(screen.getByText('Einstellungen')).toBeInTheDocument();
      expect(screen.getByText('Diagrammgröße')).toBeInTheDocument();
      expect(screen.getByText('Farbschema')).toBeInTheDocument();
      expect(screen.getByText('Anzeige')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /einstellungen zurücksetzen/i })).toBeInTheDocument();
    });

  it('does not render when modal is closed', () => {
    mockUIContext.state.isSettingsModalOpen = false;
    render(<SettingsModal />);
    
    expect(screen.queryByText('Einstellungen')).not.toBeInTheDocument();
  });

  describe('Chart Size Settings', () => {
    it('renders chart size options', () => {
      render(<SettingsModal />);
      
      expect(screen.getByRole('button', { name: 'Klein' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Mittel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Groß' })).toBeInTheDocument();
    });

    it('highlights current chart size', () => {
      mockEnergyContext.state.data.settings = {
        ...defaultSettings,
        chartSize: 'large'
      };
      render(<SettingsModal />);
      
      const largeButton = screen.getByRole('button', { name: 'Groß' });
      expect(largeButton).toHaveClass('bg-yellow-400'); // primary variant
    });

    it('changes chart size when option is clicked', () => {
      render(<SettingsModal />);
      
      const smallButton = screen.getByRole('button', { name: 'Klein' });
      fireEvent.click(smallButton);
      
      expect(mockEnergyContext.dispatch).toHaveBeenCalledWith({
        type: 'UPDATE_SETTINGS',
        payload: { chartSize: 'small' }
      });
      expect(toast.success).toHaveBeenCalledWith('Diagrammgröße aktualisiert');
    });

    it('handles all chart size options', () => {
      render(<SettingsModal />);
      
      const sizes = [
        { button: 'Klein', value: 'small' },
        { button: 'Mittel', value: 'medium' },
        { button: 'Groß', value: 'large' }
      ];
      
      sizes.forEach(({ button, value }) => {
        fireEvent.click(screen.getByRole('button', { name: button }));
        expect(mockEnergyContext.dispatch).toHaveBeenCalledWith({
          type: 'UPDATE_SETTINGS',
          payload: { chartSize: value }
        });
      });
    });
  });

  describe('Color Scheme Settings', () => {
    it('renders color scheme options', () => {
      render(<SettingsModal />);
      
      expect(screen.getByText('Standard')).toBeInTheDocument();
      expect(screen.getByText('Hoher Kontrast')).toBeInTheDocument();
      expect(screen.getByText('Farbenblind-freundlich')).toBeInTheDocument();
    });

    it('shows descriptions for color schemes', () => {
      render(<SettingsModal />);
      
      expect(screen.getByText('Bunte, lebendige Farben')).toBeInTheDocument();
      expect(screen.getByText('Starke Kontraste für bessere Lesbarkeit')).toBeInTheDocument();
      expect(screen.getByText('Optimiert für Farbblindheit')).toBeInTheDocument();
    });

    it('highlights current color scheme', () => {
      mockEnergyContext.state.data.settings = {
        ...defaultSettings,
        colorScheme: 'high-contrast'
      };
      render(<SettingsModal />);
      
      // Find the clickable div that contains "Hoher Kontrast" and check for highlighting classes
      const highContrastOption = screen.getByText('Hoher Kontrast').closest('div[class*="border"]');
      expect(highContrastOption).toHaveClass('border-blue-500', 'bg-blue-50');
    });

    it('changes color scheme when option is clicked', () => {
      render(<SettingsModal />);
      
      const colorblindOption = screen.getByText('Farbenblind-freundlich').closest('div[class*="border"]');
      fireEvent.click(colorblindOption as HTMLElement);
      
      expect(mockEnergyContext.dispatch).toHaveBeenCalledWith({
        type: 'UPDATE_SETTINGS',
        payload: { colorScheme: 'colorblind-friendly' }
      });
      expect(toast.success).toHaveBeenCalledWith('Farbschema aktualisiert');
    });

    it('shows selection indicator for current scheme', () => {
      mockEnergyContext.state.data.settings.colorScheme = 'high-contrast';
      render(<SettingsModal />);
      
      // Look for the blue dot indicator in the high contrast option (current selection)
      const highContrastOption = screen.getByText('Hoher Kontrast').closest('div[class*="border"]');
      const indicator = highContrastOption?.querySelector('.bg-blue-500.rounded-full');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Display Settings', () => {
    describe('Tooltips Toggle', () => {
      it('renders tooltips setting', () => {
        render(<SettingsModal />);
        
        expect(screen.getByText('Tooltips anzeigen')).toBeInTheDocument();
        expect(screen.getByText('Zeigt detaillierte Informationen beim Hover über Diagrammelemente')).toBeInTheDocument();
      });

      it('shows eye icon when tooltips are enabled', () => {
        mockEnergyContext.state.data.settings = {
          ...defaultSettings,
          showTooltips: true
        };
        render(<SettingsModal />);
        
        // Find the button in the tooltip section that contains the eye icon
        const buttons = screen.getAllByRole('button');
        const toggleButton = buttons.find(button => 
          button.querySelector('[data-testid="eye-icon"]') &&
          button.closest('div')?.textContent?.includes('Tooltips anzeigen')
        );
        expect(toggleButton).toBeInTheDocument();
      });

      it('shows eye-slash icon when tooltips are disabled', () => {
        mockEnergyContext.state.data.settings = {
          ...defaultSettings,
          showTooltips: false
        };
        render(<SettingsModal />);
        
        // Find the button in the tooltip section that contains the eye-slash icon
        const buttons = screen.getAllByRole('button');
        const toggleButton = buttons.find(button => 
          button.querySelector('[data-testid="eye-slash-icon"]') &&
          button.closest('div')?.textContent?.includes('Tooltips anzeigen')
        );
        expect(toggleButton).toBeInTheDocument();
      });

      it('toggles tooltips when clicked', () => {
        mockEnergyContext.state.data.settings = {
          ...defaultSettings,
          showTooltips: true
        };
        render(<SettingsModal />);
        
        // Find the toggle button for tooltips
        const buttons = screen.getAllByRole('button');
        const toggleButton = buttons.find(button => 
          button.querySelector('[data-testid="eye-icon"]') &&
          button.closest('div')?.textContent?.includes('Tooltips anzeigen')
        );
        
        expect(toggleButton).toBeInTheDocument();
        fireEvent.click(toggleButton as HTMLElement);
        
        expect(mockEnergyContext.dispatch).toHaveBeenCalledWith({
          type: 'UPDATE_SETTINGS',
          payload: { showTooltips: false }
        });
        expect(toast.success).toHaveBeenCalledWith('Tooltips deaktiviert');
      });

      it('enables tooltips when disabled', () => {
        mockEnergyContext.state.data.settings = {
          ...defaultSettings,
          showTooltips: false
        };
        render(<SettingsModal />);
        
        // Find the toggle button for tooltips
        const buttons = screen.getAllByRole('button');
        const toggleButton = buttons.find(button => 
          button.querySelector('[data-testid="eye-slash-icon"]') &&
          button.closest('div')?.textContent?.includes('Tooltips anzeigen')
        );
        
        expect(toggleButton).toBeInTheDocument();
        fireEvent.click(toggleButton as HTMLElement);
        
        expect(mockEnergyContext.dispatch).toHaveBeenCalledWith({
          type: 'UPDATE_SETTINGS',
          payload: { showTooltips: true }
        });
        expect(toast.success).toHaveBeenCalledWith('Tooltips aktiviert');
      });
    });

    describe('Legends Toggle', () => {
      it('renders legends setting', () => {
        render(<SettingsModal />);
        
        expect(screen.getByText('Legenden anzeigen')).toBeInTheDocument();
        expect(screen.getByText('Zeigt Legenden neben den Diagrammen an')).toBeInTheDocument();
      });

      it('shows eye icon when legends are enabled', () => {
        mockEnergyContext.state.data.settings = {
          ...defaultSettings,
          showLegends: true
        };
        render(<SettingsModal />);
        
        // Find the button in the legend section that contains the eye icon
        const buttons = screen.getAllByRole('button');
        const toggleButton = buttons.find(button => 
          button.querySelector('[data-testid="eye-icon"]') &&
          button.closest('div')?.textContent?.includes('Legenden anzeigen')
        );
        expect(toggleButton).toBeInTheDocument();
      });

      it('shows eye-slash icon when legends are disabled', () => {
        mockEnergyContext.state.data.settings = {
          ...defaultSettings,
          showLegends: false
        };
        render(<SettingsModal />);
        
        // Find the button in the legend section that contains the eye-slash icon
        const buttons = screen.getAllByRole('button');
        const toggleButton = buttons.find(button => 
          button.querySelector('[data-testid="eye-slash-icon"]') &&
          button.closest('div')?.textContent?.includes('Legenden anzeigen')
        );
        expect(toggleButton).toBeInTheDocument();
      });

      it('toggles legends when clicked', () => {
        mockEnergyContext.state.data.settings = {
          ...defaultSettings,
          showLegends: true
        };
        render(<SettingsModal />);
        
        // Find the toggle button for legends
        const buttons = screen.getAllByRole('button');
        const toggleButton = buttons.find(button => 
          button.querySelector('[data-testid="eye-icon"]') &&
          button.closest('div')?.textContent?.includes('Legenden anzeigen')
        );
        
        expect(toggleButton).toBeInTheDocument();
        fireEvent.click(toggleButton as HTMLElement);
        
        expect(mockEnergyContext.dispatch).toHaveBeenCalledWith({
          type: 'UPDATE_SETTINGS',
          payload: { showLegends: false }
        });
        expect(toast.success).toHaveBeenCalledWith('Legenden deaktiviert');
      });

      it('enables legends when disabled', () => {
        mockEnergyContext.state.data.settings = {
          ...defaultSettings,
          showLegends: false
        };
        render(<SettingsModal />);
        
        // Find the toggle button for legends
        const buttons = screen.getAllByRole('button');
        const toggleButton = buttons.find(button => 
          button.querySelector('[data-testid="eye-slash-icon"]') &&
          button.closest('div')?.textContent?.includes('Legenden anzeigen')
        );
        
        expect(toggleButton).toBeInTheDocument();
        fireEvent.click(toggleButton as HTMLElement);
        
        expect(mockEnergyContext.dispatch).toHaveBeenCalledWith({
          type: 'UPDATE_SETTINGS',
          payload: { showLegends: true }
        });
        expect(toast.success).toHaveBeenCalledWith('Legenden aktiviert');
      });
    });
  });

  describe('Reset Settings', () => {
    it('renders reset settings section', () => {
      render(<SettingsModal />);
      
      expect(screen.getByRole('button', { name: /einstellungen zurücksetzen/i })).toBeInTheDocument();
      expect(screen.getByText('Setzt alle Einstellungen auf die Standardwerte zurück.')).toBeInTheDocument();
    });

    it('resets settings when confirmed', () => {
      (window.confirm as jest.Mock).mockReturnValue(true);
      
      render(<SettingsModal />);
      
      const resetButton = screen.getByRole('button', { name: /einstellungen zurücksetzen/i });
      fireEvent.click(resetButton);
      
      expect(window.confirm).toHaveBeenCalledWith('Sind Sie sicher, dass Sie alle Einstellungen zurücksetzen möchten?');
      expect(mockEnergyContext.dispatch).toHaveBeenCalledWith({ type: 'RESET_SETTINGS' });
      expect(toast.success).toHaveBeenCalledWith('Einstellungen zurückgesetzt');
    });

    it('does not reset settings when cancelled', () => {
      (window.confirm as jest.Mock).mockReturnValue(false);
      
      render(<SettingsModal />);
      
      const resetButton = screen.getByRole('button', { name: /einstellungen zurücksetzen/i });
      fireEvent.click(resetButton);
      
      expect(mockEnergyContext.dispatch).not.toHaveBeenCalledWith({ type: 'RESET_SETTINGS' });
      expect(toast.success).not.toHaveBeenCalledWith('Einstellungen zurückgesetzt');
    });

    it('has danger styling for reset section', () => {
      render(<SettingsModal />);
      
      const resetButton = screen.getByRole('button', { name: /einstellungen zurücksetzen/i });
      const resetSection = resetButton.closest('div');
      expect(resetSection).toHaveClass('border-red-200', 'bg-red-50');
      expect(resetButton).toHaveClass('bg-red-500'); // danger variant
    });
  });

  describe('Icons', () => {
    it('displays all section icons', () => {
      render(<SettingsModal />);
      
      expect(screen.getAllByTestId('chart-pie-icon')).toHaveLength(2); // Chart size and legends
      expect(screen.getByTestId('paint-brush-icon')).toBeInTheDocument();
      expect(screen.getAllByTestId('eye-icon')).toHaveLength(3); // Display section header + 2 toggle buttons
      expect(screen.getAllByTestId('cog-icon')).toHaveLength(2); // Reset section header and button
      expect(screen.getByTestId('information-circle-icon')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button roles', () => {
      render(<SettingsModal />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('has descriptive text for settings', () => {
      render(<SettingsModal />);
      
      expect(screen.getByText('Bestimmt die Größe der Energiekuchen-Diagramme.')).toBeInTheDocument();
      expect(screen.getByText('Wählen Sie das Farbschema für die Diagramme.')).toBeInTheDocument();
      expect(screen.getByText('Konfigurieren Sie die Anzeige der Diagramme.')).toBeInTheDocument();
    });
  });
});
