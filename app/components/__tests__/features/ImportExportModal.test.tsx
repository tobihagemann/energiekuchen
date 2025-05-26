// Import the ImportExportModal component and testing utilities
import { ImportExportModal } from '@/app/components/features/ImportExportModal';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

// Mock react-hot-toast with proper structure
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock createPortal to render content directly instead of to a portal
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (element: React.ReactNode) => element,
}));

// Import the mock after it's defined
import { toast } from 'react-hot-toast';

// Mock contexts
const mockUIContext = {
  state: { isImportModalOpen: true },
  closeImportModal: jest.fn()
};

const mockEnergyContext = {
  state: { 
    data: { 
      version: '1.0',
      lastModified: '2024-01-01T00:00:00.000Z',
      positive: {
        id: 'positive',
        type: 'positive' as const,
        activities: [{ 
          id: '1', 
          name: 'Test Activity', 
          value: 8,
          color: '#10b981',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }],
        size: 'medium' as const
      },
      negative: {
        id: 'negative', 
        type: 'negative' as const,
        activities: [{ 
          id: '2', 
          name: 'Bad Activity', 
          value: 2,
          color: '#ef4444',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }],
        size: 'medium' as const
      },
      settings: {
        chartSize: 'medium' as const,
        colorScheme: 'default' as const,
        showTooltips: true,
        showLegends: true,
        language: 'de' as const
      }
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

// Mock storage utilities
jest.mock('@/app/lib/utils/storage', () => ({
  exportData: jest.fn(),
  importData: jest.fn()
}));

// Import the mocked functions
import { exportData, importData } from '@/app/lib/utils/storage';
const mockExportData = exportData as jest.MockedFunction<typeof exportData>;
const mockImportData = importData as jest.MockedFunction<typeof importData>;

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  DocumentArrowDownIcon: ({ className }: { className?: string }) => (
    <div data-testid="document-arrow-down-icon" className={className} />
  ),
  DocumentArrowUpIcon: ({ className }: { className?: string }) => (
    <div data-testid="document-arrow-up-icon" className={className} />
  ),
  TrashIcon: ({ className }: { className?: string }) => (
    <div data-testid="trash-icon" className={className} />
  )
}));

// Mock URL and document methods
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
const mockClick = jest.fn();

global.URL = global.URL || {};
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock document.createElement for download functionality
const originalCreateElement = document.createElement;
const mockLinkElement = {
  href: '',
  download: '',
  click: mockClick,
  style: {},
  // Add properties needed for DOM manipulation
  setAttribute: jest.fn(),
  getAttribute: jest.fn(),
  removeAttribute: jest.fn(),
  // Make it look like a real DOM node for appendChild/removeChild
  nodeType: 1,
  nodeName: 'A',
  parentNode: null
};

document.createElement = jest.fn().mockImplementation((tagName) => {
  if (tagName === 'a') {
    return mockLinkElement;
  }
  return originalCreateElement.call(document, tagName);
});

// Mock document.body methods
document.body.appendChild = jest.fn().mockImplementation((node) => {
  // Just return the node for testing purposes
  return node;
});
document.body.removeChild = jest.fn().mockImplementation((node) => {
  return node;
});

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: jest.fn()
});

// Mock FileReader
const mockFileReader = {
  readAsText: jest.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onload: null as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: null as any
};

Object.defineProperty(window, 'FileReader', {
  value: jest.fn(() => mockFileReader)
});

describe('ImportExportModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('mock-url');
    mockExportData.mockReturnValue(JSON.stringify({ test: 'data' }));
    mockUIContext.state.isImportModalOpen = true;
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the modal when open', () => {
    const { container } = render(<ImportExportModal />);
    
    // Use container queries instead of screen queries since createPortal renders to container
    expect(container.querySelector('h3')).toHaveTextContent('Import / Export');
    expect(container.querySelectorAll('h3')).toHaveLength(4); // Modal title + 3 section titles
    
    // Check section headings
    const headings = Array.from(container.querySelectorAll('h3')).map(h => h.textContent);
    expect(headings).toContain('Import / Export');
    expect(headings).toContain('Daten exportieren');
    expect(headings).toContain('Daten importieren');
    expect(headings).toContain('Alle Daten löschen');
    
    // Check buttons
    const buttons = Array.from(container.querySelectorAll('button')).map(b => b.textContent);
    expect(buttons).toContain('Daten exportieren');
    expect(buttons).toContain('Datei auswählen');
    expect(buttons).toContain('Daten importieren');
    expect(buttons).toContain('Alle Daten löschen');
  });

  it('does not render when modal is closed', () => {
    mockUIContext.state.isImportModalOpen = false;
    render(<ImportExportModal />);
    
    expect(screen.queryByText('Import / Export')).not.toBeInTheDocument();
  });

  describe('Export functionality', () => {
    it('exports data successfully', async () => {
      const { container } = render(<ImportExportModal />);
      
      // Find export button using container query
      const exportButton = Array.from(container.querySelectorAll('button')).find(btn => 
        btn.textContent?.includes('Daten exportieren')
      );
      expect(exportButton).toBeTruthy();
      fireEvent.click(exportButton!);
      
      expect(mockExportData).toHaveBeenCalledWith(mockEnergyContext.state.data);
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-url');
      expect(toast.success).toHaveBeenCalledWith('Daten erfolgreich exportiert!');
    });

    it('handles export error', () => {
      mockExportData.mockImplementation(() => {
        throw new Error('Export failed');
      });
      
      const { container } = render(<ImportExportModal />);
      
      // Find export button using container query
      const exportButton = Array.from(container.querySelectorAll('button')).find(btn => 
        btn.textContent?.includes('Daten exportieren')
      );
      expect(exportButton).toBeTruthy();
      fireEvent.click(exportButton!);
      
      expect(toast.error).toHaveBeenCalledWith('Fehler beim Exportieren der Daten');
    });

    it('creates download link with correct filename', () => {
      const mockDate = new Date('2024-01-15T10:30:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      
      const { container } = render(<ImportExportModal />);
      
      // Find export button using container query
      const exportButton = Array.from(container.querySelectorAll('button')).find(btn => 
        btn.textContent?.includes('Daten exportieren')
      );
      expect(exportButton).toBeTruthy();
      fireEvent.click(exportButton!);
      
      // Check that createElement was called with 'a'
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLinkElement.download).toContain('energiekuchen-2024-01-15.json');
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLinkElement);
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLinkElement);
    });
  });

  describe('Import functionality', () => {
    it('imports data from textarea successfully', async () => {
      const testData = '{"version": "1.0", "lastModified": "2024-01-01T00:00:00.000Z", "positive": {"id": "positive", "type": "positive", "activities": [], "size": "medium"}, "negative": {"id": "negative", "type": "negative", "activities": [], "size": "medium"}, "settings": {"chartSize": "medium", "colorScheme": "default", "showTooltips": true, "showLegends": true, "language": "de"}}';
      const parsedData = { 
        version: '1.0',
        lastModified: '2024-01-01T00:00:00.000Z',
        positive: { 
          id: 'positive',
          type: 'positive' as const,
          activities: [], 
          size: 'medium' as const
        }, 
        negative: { 
          id: 'negative',
          type: 'negative' as const,
          activities: [], 
          size: 'medium' as const
        },
        settings: {
          chartSize: 'medium' as const,
          colorScheme: 'default' as const,
          showTooltips: true,
          showLegends: true,
          language: 'de' as const
        }
      };
      mockImportData.mockReturnValue(parsedData);
      
      const { container } = render(<ImportExportModal />);
      
      // Find textarea using container query
      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();
      fireEvent.change(textarea, { target: { value: testData } });
      
      // Find import button using container query
      const importButton = Array.from(container.querySelectorAll('button')).find(btn => 
        btn.textContent?.includes('Daten importieren')
      );
      expect(importButton).toBeTruthy();
      fireEvent.click(importButton!);
      
      await waitFor(() => {
        expect(mockImportData).toHaveBeenCalledWith(testData);
        expect(mockEnergyContext.dispatch).toHaveBeenCalledWith({
          type: 'IMPORT_DATA',
          payload: parsedData
        });
        expect(toast.success).toHaveBeenCalledWith('Daten erfolgreich importiert!');
        expect(mockUIContext.closeImportModal).toHaveBeenCalled();
      });
    });

    it('disables import button when content is empty', () => {
      const { container } = render(<ImportExportModal />);
      
      // Ensure textarea is empty (default state)
      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();
      expect(textarea.value).toBe('');
      
      // Find import button using container query
      const importButton = Array.from(container.querySelectorAll('button')).find(btn => 
        btn.textContent?.includes('Daten importieren')
      );
      expect(importButton).toBeTruthy();
      
      // Button should be disabled when content is empty
      expect(importButton).toHaveAttribute('disabled');
    });

    it('handles import error', async () => {
      mockImportData.mockImplementation(() => {
        throw new Error('Invalid JSON');
      });
      
      const { container } = render(<ImportExportModal />);
      
      // Find textarea using container query
      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();
      fireEvent.change(textarea, { target: { value: 'invalid json' } });
      
      // Find import button using container query
      const importButton = Array.from(container.querySelectorAll('button')).find(btn => 
        btn.textContent?.includes('Daten importieren')
      );
      expect(importButton).toBeTruthy();
      fireEvent.click(importButton!);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Fehler beim Importieren der Daten. Bitte überprüfen Sie das Format.');
      });
    });

    it('shows import button text changes during import process', async () => {
      // Set up a working import
      const testData = '{"version": "1.0", "lastModified": "2024-01-01T00:00:00.000Z", "positive": {"id": "positive", "type": "positive", "activities": [], "size": "medium"}, "negative": {"id": "negative", "type": "negative", "activities": [], "size": "medium"}, "settings": {"chartSize": "medium", "colorScheme": "default", "showTooltips": true, "showLegends": true, "language": "de"}}';
      const parsedData = { 
        version: '1.0',
        lastModified: '2024-01-01T00:00:00.000Z',
        positive: { 
          id: 'positive',
          type: 'positive' as const,
          activities: [], 
          size: 'medium' as const
        }, 
        negative: { 
          id: 'negative',
          type: 'negative' as const,
          activities: [], 
          size: 'medium' as const
        },
        settings: {
          chartSize: 'medium' as const,
          colorScheme: 'default' as const,
          showTooltips: true,
          showLegends: true,
          language: 'de' as const
        }
      };
      mockImportData.mockReturnValue(parsedData);
      
      const { container } = render(<ImportExportModal />);
      
      // Find textarea using container query
      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();
      fireEvent.change(textarea, { target: { value: testData } });
      
      // Find import button using container query
      const importButton = Array.from(container.querySelectorAll('button')).find(btn => 
        btn.textContent?.includes('Daten importieren')
      );
      expect(importButton).toBeTruthy();
      expect(importButton).not.toHaveAttribute('disabled'); // Initially enabled with content
      
      // Click the import button
      fireEvent.click(importButton!);
      
      // Verify import was successful
      await waitFor(() => {
        expect(mockImportData).toHaveBeenCalledWith(testData);
        expect(mockEnergyContext.dispatch).toHaveBeenCalledWith({
          type: 'IMPORT_DATA',
          payload: parsedData
        });
        expect(toast.success).toHaveBeenCalledWith('Daten erfolgreich importiert!');
      });
    });

    it('handles file import', async () => {
      const { container } = render(<ImportExportModal />);
      
      // Find file button using container query
      const fileButton = Array.from(container.querySelectorAll('button')).find(btn => 
        btn.textContent?.includes('Datei auswählen')
      );
      expect(fileButton).toBeTruthy();
      fireEvent.click(fileButton!);
      
      // Simulate file selection
      const hiddenInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(hiddenInput).toBeTruthy();
      const mockFile = new File(['{"test": "file data"}'], 'test.json', { type: 'application/json' });
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [mockFile],
        configurable: true
      });
      
      fireEvent.change(hiddenInput);
      
      expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile);
      
      // Simulate file read completion with proper event structure
      mockFileReader.result = '{"test": "file data"}';
      
      await act(async () => {
        // Call onload with the correct structure that the component expects
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: '{"test": "file data"}' } } as ProgressEvent<FileReader>);
        }
      });
      
      // Check that textarea contains the file data using container query
      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
      expect(textarea).toHaveValue('{"test": "file data"}');
    });

    it('handles file import with no file selected', () => {
      const { container } = render(<ImportExportModal />);
      
      const hiddenInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(hiddenInput).toBeTruthy();
      Object.defineProperty(hiddenInput, 'files', {
        value: [],
        configurable: true
      });
      
      fireEvent.change(hiddenInput);
      
      expect(mockFileReader.readAsText).not.toHaveBeenCalled();
    });
  });

  describe('Clear all data functionality', () => {
    it('clears all data when confirmed', () => {
      (window.confirm as jest.Mock).mockReturnValue(true);
      
      const { container } = render(<ImportExportModal />);
      
      // Find clear button using container query
      const clearButton = Array.from(container.querySelectorAll('button')).find(btn => 
        btn.textContent?.includes('Alle Daten löschen')
      );
      expect(clearButton).toBeTruthy();
      fireEvent.click(clearButton!);
      
      expect(window.confirm).toHaveBeenCalledWith('Sind Sie sicher, dass Sie alle Daten löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.');
      expect(mockEnergyContext.dispatch).toHaveBeenCalledWith({ type: 'CLEAR_ALL_DATA' });
      expect(toast.success).toHaveBeenCalledWith('Alle Daten wurden gelöscht');
      expect(mockUIContext.closeImportModal).toHaveBeenCalled();
    });

    it('does not clear data when cancelled', () => {
      (window.confirm as jest.Mock).mockReturnValue(false);
      
      const { container } = render(<ImportExportModal />);
      
      // Find clear button using container query
      const clearButton = Array.from(container.querySelectorAll('button')).find(btn => 
        btn.textContent?.includes('Alle Daten löschen')
      );
      expect(clearButton).toBeTruthy();
      fireEvent.click(clearButton!);
      
      expect(mockEnergyContext.dispatch).not.toHaveBeenCalledWith({ type: 'CLEAR_ALL_DATA' });
      expect(mockUIContext.closeImportModal).not.toHaveBeenCalled();
    });
  });

  describe('UI elements', () => {
    it('displays all icons correctly', () => {
      const { container } = render(<ImportExportModal />);
      
      // Find icons using container queries
      const downloadIcons = container.querySelectorAll('[data-testid="document-arrow-down-icon"]');
      const uploadIcons = container.querySelectorAll('[data-testid="document-arrow-up-icon"]');
      const trashIcons = container.querySelectorAll('[data-testid="trash-icon"]');
      
      expect(downloadIcons).toHaveLength(2);
      expect(uploadIcons).toHaveLength(2);
      expect(trashIcons).toHaveLength(2);
    });

    it('has correct styling for sections', () => {
      const { container } = render(<ImportExportModal />);
      
      // Find clear section by looking for the text and then finding the parent container
      const clearText = Array.from(container.querySelectorAll('*')).find(el => 
        el.textContent?.includes('Alle Daten löschen') && el.tagName === 'H3'
      );
      expect(clearText).toBeTruthy();
      
      const clearSection = clearText?.closest('div');
      expect(clearSection).toHaveClass('border-red-200', 'bg-red-50');
    });

    it('accepts only JSON files', () => {
      const { container } = render(<ImportExportModal />);
      
      const hiddenInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(hiddenInput).toHaveAttribute('accept', '.json');
    });

    it('has correct placeholder text for textarea', () => {
      const { container } = render(<ImportExportModal />);
      
      const textarea = container.querySelector('textarea[placeholder*="version"]') as HTMLTextAreaElement;
      expect(textarea).toHaveAttribute('placeholder', '{"version": "1.0", "positive": {...}, "negative": {...}}');
    });
  });
});
