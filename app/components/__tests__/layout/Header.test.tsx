import { Header } from '@/app/components/layout/Header';
import { fireEvent, render, screen } from '@testing-library/react';

// Mock the UIContext
const mockUIContext = {
  openShareModal: jest.fn(),
  openSettingsModal: jest.fn(),
  openHelpModal: jest.fn(),
  openImportModal: jest.fn(),
  closeModal: jest.fn(),
  showToast: jest.fn(),
  isModalOpen: false,
  modalType: null as string | null,
  modalProps: {}
};

jest.mock('@/app/lib/contexts/UIContext', () => ({
  useUI: () => mockUIContext
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  ArrowUpTrayIcon: ({ className }: { className?: string }) => (
    <div data-testid="arrow-up-tray-icon" className={className} />
  ),
  Cog6ToothIcon: ({ className }: { className?: string }) => (
    <div data-testid="cog-6-tooth-icon" className={className} />
  ),
  QuestionMarkCircleIcon: ({ className }: { className?: string }) => (
    <div data-testid="question-mark-circle-icon" className={className} />
  ),
  ShareIcon: ({ className }: { className?: string }) => (
    <div data-testid="share-icon" className={className} />
  )
}));

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the header with logo and title', () => {
    render(<Header />);
    
    expect(screen.getByText('🥧')).toBeInTheDocument();
    expect(screen.getByText('Energiekuchen')).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renders all navigation buttons', () => {
    render(<Header />);
    
    expect(screen.getByRole('button', { name: /importieren/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /teilen/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /einstellungen/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hilfe/i })).toBeInTheDocument();
  });

  it('displays icons for all buttons', () => {
    render(<Header />);
    
    expect(screen.getByTestId('arrow-up-tray-icon')).toBeInTheDocument();
    expect(screen.getByTestId('share-icon')).toBeInTheDocument();
    expect(screen.getByTestId('cog-6-tooth-icon')).toBeInTheDocument();
    expect(screen.getByTestId('question-mark-circle-icon')).toBeInTheDocument();
  });

  it('calls openImportModal when Import button is clicked', () => {
    render(<Header />);
    
    const importButton = screen.getByRole('button', { name: /importieren/i });
    fireEvent.click(importButton);
    
    expect(mockUIContext.openImportModal).toHaveBeenCalledTimes(1);
  });

  it('calls openShareModal when Share button is clicked', () => {
    render(<Header />);
    
    const shareButton = screen.getByRole('button', { name: /teilen/i });
    fireEvent.click(shareButton);
    
    expect(mockUIContext.openShareModal).toHaveBeenCalledTimes(1);
  });

  it('calls openSettingsModal when Settings button is clicked', () => {
    render(<Header />);
    
    const settingsButton = screen.getByRole('button', { name: /einstellungen/i });
    fireEvent.click(settingsButton);
    
    expect(mockUIContext.openSettingsModal).toHaveBeenCalledTimes(1);
  });

  it('calls openHelpModal when Help button is clicked', () => {
    render(<Header />);
    
    const helpButton = screen.getByRole('button', { name: /hilfe/i });
    fireEvent.click(helpButton);
    
    expect(mockUIContext.openHelpModal).toHaveBeenCalledTimes(1);
  });

  it('has correct responsive classes for import button', () => {
    render(<Header />);
    
    const importButton = screen.getByRole('button', { name: /importieren/i });
    expect(importButton).toHaveClass('hidden', 'sm:flex');
  });

  it('has correct responsive classes for settings button text', () => {
    render(<Header />);
    
    const settingsText = screen.getByText('Einstellungen');
    expect(settingsText).toHaveClass('hidden', 'sm:inline');
  });

  it('has correct responsive classes for help button text', () => {
    render(<Header />);
    
    const helpText = screen.getByText('Hilfe');
    expect(helpText).toHaveClass('hidden', 'sm:inline');
  });

  it('applies correct styling classes', () => {
    render(<Header />);
    
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-white', 'shadow-sm', 'border-b', 'border-gray-200');
    
    const title = screen.getByText('Energiekuchen');
    expect(title).toHaveClass('text-xl', 'font-bold', 'text-gray-900');
  });

  it('maintains button order in navigation', () => {
    render(<Header />);
    
    const buttons = screen.getAllByRole('button');
    const buttonTexts = buttons.map(button => button.textContent);
    
    expect(buttonTexts).toEqual([
      'Importieren',
      'Teilen', 
      'Einstellungen',
      'Hilfe'
    ]);
  });

  it('has proper semantic structure', () => {
    render(<Header />);
    
    const header = screen.getByRole('banner');
    const navigation = screen.getByRole('navigation');
    const heading = screen.getByRole('heading', { level: 1 });
    
    expect(header).toContainElement(navigation);
    expect(header).toContainElement(heading);
    expect(heading.textContent).toBe('Energiekuchen');
  });

  it('handles multiple rapid button clicks', () => {
    render(<Header />);
    
    const shareButton = screen.getByRole('button', { name: /teilen/i });
    
    fireEvent.click(shareButton);
    fireEvent.click(shareButton);
    fireEvent.click(shareButton);
    
    expect(mockUIContext.openShareModal).toHaveBeenCalledTimes(3);
  });
});
