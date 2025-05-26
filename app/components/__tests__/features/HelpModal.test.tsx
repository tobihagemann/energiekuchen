import { HelpModal } from '@/app/components/features/HelpModal';
import { fireEvent, render, screen } from '@testing-library/react';

// Mock UIContext
const mockUIContext = {
  state: { isHelpModalOpen: true },
  closeHelpModal: jest.fn()
};

jest.mock('@/app/lib/contexts/UIContext', () => ({
  useUI: () => mockUIContext
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  ChartPieIcon: ({ className }: { className?: string }) => (
    <div data-testid="chart-pie-icon" className={className} />
  ),
  CogIcon: ({ className }: { className?: string }) => (
    <div data-testid="cog-icon" className={className} />
  ),
  DocumentArrowUpIcon: ({ className }: { className?: string }) => (
    <div data-testid="document-arrow-up-icon" className={className} />
  ),
  PencilIcon: ({ className }: { className?: string }) => (
    <div data-testid="pencil-icon" className={className} />
  ),
  PlusIcon: ({ className }: { className?: string }) => (
    <div data-testid="plus-icon" className={className} />
  ),
  QuestionMarkCircleIcon: ({ className }: { className?: string }) => (
    <div data-testid="question-mark-circle-icon" className={className} />
  ),
  ShareIcon: ({ className }: { className?: string }) => (
    <div data-testid="share-icon" className={className} />
  ),
  SwatchIcon: ({ className }: { className?: string }) => (
    <div data-testid="swatch-icon" className={className} />
  ),
  TrashIcon: ({ className }: { className?: string }) => (
    <div data-testid="trash-icon" className={className} />
  )
}));

describe('HelpModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure modal is open for each test
    mockUIContext.state.isHelpModalOpen = true;
  });

  it('renders the modal when open', () => {
    render(<HelpModal />);
    
    expect(screen.getByText('Hilfe & Anleitung')).toBeInTheDocument();
  });

  it('does not render when modal is closed', () => {
    mockUIContext.state.isHelpModalOpen = false;
    render(<HelpModal />);
    
    expect(screen.queryByText('Hilfe & Anleitung')).not.toBeInTheDocument();
    // Reset for subsequent tests
    mockUIContext.state.isHelpModalOpen = true;
  });

  describe('Navigation sections', () => {
    it('renders all navigation sections', () => {
      render(<HelpModal />);
      
      expect(screen.getByRole('button', { name: /erste schritte/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /aktivitäten verwalten/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /diagramme verstehen/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /teilen & exportieren/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /einstellungen/i })).toBeInTheDocument();
    });

    it('displays icons for all sections', () => {
      render(<HelpModal />);
      
      expect(screen.getByTestId('question-mark-circle-icon')).toBeInTheDocument();
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
      expect(screen.getByTestId('chart-pie-icon')).toBeInTheDocument();
      expect(screen.getByTestId('share-icon')).toBeInTheDocument();
      expect(screen.getByTestId('cog-icon')).toBeInTheDocument();
    });

    it('highlights the active section', () => {
      render(<HelpModal />);
      
      const gettingStartedButton = screen.getByRole('button', { name: /erste schritte/i });
      expect(gettingStartedButton).toHaveClass('bg-blue-100', 'text-blue-700');
    });

    it('changes active section when clicked', () => {
      render(<HelpModal />);
      
      const activitiesButton = screen.getByRole('button', { name: /aktivitäten verwalten/i });
      fireEvent.click(activitiesButton);
      
      expect(activitiesButton).toHaveClass('bg-blue-100', 'text-blue-700');
      expect(screen.getByRole('button', { name: /erste schritte/i })).not.toHaveClass('bg-blue-100');
    });
  });

  describe('Getting Started content', () => {
    it('displays getting started content by default', () => {
      render(<HelpModal />);
      
      expect(screen.getByText('Willkommen bei Energiekuchen!')).toBeInTheDocument();
      expect(screen.getByText(/Energiekuchen hilft Ihnen dabei/)).toBeInTheDocument();
    });

    it('shows positive and negative energy explanations', () => {
      render(<HelpModal />);
      
      expect(screen.getByText('Positive Energie')).toBeInTheDocument();
      expect(screen.getByText('Negative Energie')).toBeInTheDocument();
      expect(screen.getByText(/Aktivitäten, die Ihnen Energie geben/)).toBeInTheDocument();
      expect(screen.getByText(/Aktivitäten, die Ihnen Energie entziehen/)).toBeInTheDocument();
    });

    it('displays quickstart steps', () => {
      render(<HelpModal />);
      
      expect(screen.getByText('Schnellstart:')).toBeInTheDocument();
      expect(screen.getByText(/Fügen Sie Ihre ersten Aktivitäten/)).toBeInTheDocument();
      expect(screen.getByText(/Ordnen Sie sie den passenden Kategorien/)).toBeInTheDocument();
      expect(screen.getByText(/Bewerten Sie ihre Stärke/)).toBeInTheDocument();
      expect(screen.getByText(/Betrachten Sie Ihre persönliche Energiebilanz/)).toBeInTheDocument();
    });

    it('styles positive and negative energy sections correctly', () => {
      render(<HelpModal />);
      
      // Find the container divs that have the background colors
      const positiveSection = document.querySelector('.bg-green-50');
      expect(positiveSection).toBeInTheDocument();
      expect(positiveSection).toHaveClass('bg-green-50');
      
      const negativeSection = document.querySelector('.bg-red-50');
      expect(negativeSection).toBeInTheDocument();
      expect(negativeSection).toHaveClass('bg-red-50');
    });
  });

  describe('Activities management content', () => {
    beforeEach(() => {
      render(<HelpModal />);
      const activitiesButton = screen.getByRole('button', { name: /aktivitäten verwalten/i });
      fireEvent.click(activitiesButton);
    });

    it('displays activities management content', () => {
      fireEvent.click(screen.getByRole('button', { name: 'Aktivitäten verwalten' }));
      expect(screen.getAllByText('Aktivitäten verwalten')[1]).toBeInTheDocument(); // Content heading
    });

    it('shows how to add new activities', () => {
      fireEvent.click(screen.getByRole('button', { name: 'Aktivitäten verwalten' }));
      expect(screen.getByText('Neue Aktivität hinzufügen')).toBeInTheDocument();
      expect(screen.getByText(/Klicken Sie auf den \+ Button/)).toBeInTheDocument();
      expect(screen.getAllByTestId('plus-icon')[1]).toBeInTheDocument(); // Content plus icon
    });

    it('shows how to edit activities', () => {
      expect(screen.getByText('Aktivität bearbeiten')).toBeInTheDocument();
      expect(screen.getByText(/Klicken Sie auf eine Aktivität in der Liste/)).toBeInTheDocument();
      expect(screen.getByTestId('pencil-icon')).toBeInTheDocument();
    });

    it('shows how to delete activities', () => {
      expect(screen.getByText('Aktivität löschen')).toBeInTheDocument();
      expect(screen.getByText(/Verwenden Sie den Löschen-Button/)).toBeInTheDocument();
      expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
    });

    it('displays activity tip', () => {
      expect(screen.getByText('💡 Tipp:')).toBeInTheDocument();
      expect(screen.getByText(/Seien Sie ehrlich bei der Bewertung/)).toBeInTheDocument();
    });

    it('styles tip section correctly', () => {
      const tipSection = screen.getByText('💡 Tipp:').closest('div');
      expect(tipSection).toHaveClass('bg-blue-50');
    });
  });

  describe('Charts understanding content', () => {
    beforeEach(() => {
      render(<HelpModal />);
      const chartsButton = screen.getByRole('button', { name: /diagramme verstehen/i });
      fireEvent.click(chartsButton);
    });

    it('displays charts content', () => {
      fireEvent.click(screen.getByRole('button', { name: 'Diagramme verstehen' }));
      expect(screen.getAllByText('Diagramme verstehen')[1]).toBeInTheDocument(); // Content heading
    });

    it('explains chart diagrams', () => {
      expect(screen.getByText('Energiekuchen-Diagramme')).toBeInTheDocument();
      expect(screen.getByText(/Die beiden Kreisdiagramme zeigen/)).toBeInTheDocument();
    });

    it('explains energy balance', () => {
      expect(screen.getByText('Energiebilanz')).toBeInTheDocument();
      expect(screen.getByText('Positiv:')).toBeInTheDocument();
      expect(screen.getByText('Ausgeglichen:')).toBeInTheDocument();
      expect(screen.getByText('Negativ:')).toBeInTheDocument();
    });

    it('explains interactivity', () => {
      expect(screen.getByText('Interaktivität')).toBeInTheDocument();
      expect(screen.getByText(/Klicken Sie auf Legende-Einträge/)).toBeInTheDocument();
    });

    it('shows colored indicators for energy balance', () => {
      const indicators = document.querySelectorAll('.bg-green-500, .bg-gray-400, .bg-red-500');
      expect(indicators).toHaveLength(3);
    });
  });

  describe('Sharing content', () => {
    beforeEach(() => {
      render(<HelpModal />);
      const sharingButton = screen.getByRole('button', { name: /teilen & exportieren/i });
      fireEvent.click(sharingButton);
    });

    it('displays sharing content', () => {
      fireEvent.click(screen.getByRole('button', { name: 'Teilen & Exportieren' }));
      expect(screen.getAllByText('Teilen & Exportieren')[1]).toBeInTheDocument(); // Content heading
    });

    it('explains link sharing', () => {
      expect(screen.getByText('Link teilen')).toBeInTheDocument();
      expect(screen.getByText(/Erstellen Sie einen Link zu Ihrer aktuellen/)).toBeInTheDocument();
      expect(screen.getAllByTestId('share-icon')).toHaveLength(2); // One in nav, one in content
    });

    it('explains data export/import', () => {
      expect(screen.getByText('Daten exportieren/importieren')).toBeInTheDocument();
      expect(screen.getByText(/Sichern Sie Ihre Daten oder übertragen/)).toBeInTheDocument();
      expect(screen.getByTestId('document-arrow-up-icon')).toBeInTheDocument();
    });

    it('shows privacy warning', () => {
      expect(screen.getByText('⚠️ Datenschutz:')).toBeInTheDocument();
      expect(screen.getByText(/Geteilte Links enthalten Ihre Aktivitätsdaten/)).toBeInTheDocument();
    });

    it('styles privacy warning correctly', () => {
      const warningSection = screen.getByText('⚠️ Datenschutz:').closest('div');
      expect(warningSection).toHaveClass('bg-yellow-50');
    });
  });

  describe('Settings content', () => {
    beforeEach(() => {
      render(<HelpModal />);
      const settingsButton = screen.getByRole('button', { name: /einstellungen/i });
      fireEvent.click(settingsButton);
    });

    it('displays settings content', () => {
      expect(screen.getByText('Einstellungen anpassen')).toBeInTheDocument();
    });

    it('explains chart size settings', () => {
      expect(screen.getByText('Diagrammgröße')).toBeInTheDocument();
      expect(screen.getByText(/Wählen Sie zwischen klein, mittel und groß/)).toBeInTheDocument();
      expect(screen.getAllByTestId('chart-pie-icon')).toHaveLength(2); // One in nav, one in content
    });

    it('explains color scheme settings', () => {
      expect(screen.getByText('Farbschema')).toBeInTheDocument();
      expect(screen.getByText('Standard:')).toBeInTheDocument();
      expect(screen.getByText('Hoher Kontrast:')).toBeInTheDocument();
      expect(screen.getByText('Farbenblind-freundlich:')).toBeInTheDocument();
      expect(screen.getByTestId('swatch-icon')).toBeInTheDocument();
    });

    it('explains display options', () => {
      expect(screen.getByText('Anzeige-Optionen')).toBeInTheDocument();
      expect(screen.getByText('Tooltips:')).toBeInTheDocument();
      expect(screen.getByText('Legenden:')).toBeInTheDocument();
    });

    it('shows pro tip', () => {
      expect(screen.getByText('✨ Pro-Tipp:')).toBeInTheDocument();
      expect(screen.getByText(/Experimentieren Sie mit verschiedenen Einstellungen/)).toBeInTheDocument();
    });

    it('styles pro tip correctly', () => {
      const tipSection = screen.getByText('✨ Pro-Tipp:').closest('div');
      expect(tipSection).toHaveClass('bg-green-50');
    });
  });

  describe('Modal structure', () => {
    it('has proper layout with sidebar and content', () => {
      render(<HelpModal />);
      
      // Check for sidebar navigation
      const sidebar = document.querySelector('.w-64');
      expect(sidebar).toBeInTheDocument();
      
      // Check for content area
      const content = document.querySelector('.flex-1.overflow-y-auto');
      expect(content).toBeInTheDocument();
    });

    it('has scrollable content area', () => {
      render(<HelpModal />);
      
      const content = document.querySelector('.overflow-y-auto');
      expect(content).toBeInTheDocument();
    });

    it('has fixed height container', () => {
      render(<HelpModal />);
      
      const container = document.querySelector('.h-96');
      expect(container).toBeInTheDocument();
    });

    it('applies correct styling to navigation buttons', () => {
      render(<HelpModal />);
      
      const navButtons = screen.getAllByRole('button').filter(button => 
        button.textContent?.includes('Erste Schritte') ||
        button.textContent?.includes('Aktivitäten verwalten') ||
        button.textContent?.includes('Diagramme verstehen') ||
        button.textContent?.includes('Teilen & Exportieren') ||
        button.textContent?.includes('Einstellungen')
      );
      
      navButtons.forEach(button => {
        expect(button).toHaveClass('w-full', 'flex', 'items-center', 'gap-3');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper button roles for navigation', () => {
      render(<HelpModal />);
      
      const navButtons = screen.getAllByRole('button');
      expect(navButtons.length).toBeGreaterThanOrEqual(5);
    });

    it('has clear headings hierarchy', () => {
      render(<HelpModal />);
      
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2); // Modal title + content heading
    });

    it('provides descriptive text for each section', () => {
      render(<HelpModal />);
      
      const sections = ['Erste Schritte', 'Aktivitäten verwalten', 'Diagramme verstehen', 'Teilen & Exportieren', 'Einstellungen'];
      
      sections.forEach(sectionName => {
        const button = screen.getByRole('button', { name: sectionName });
        fireEvent.click(button);
        
        // Check that content area has changed and contains meaningful content
        const contentArea = document.querySelector('.flex-1.overflow-y-auto');
        expect(contentArea).toHaveTextContent(/\w+/); // Has some word characters
        expect(contentArea?.textContent?.length).toBeGreaterThan(50); // Has substantial content
      });
    });
  });
});
