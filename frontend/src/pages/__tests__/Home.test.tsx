import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import Home from '../Home'

// Mock the required dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'app.title': 'Recipix',
        'app.description': 'Capture, process, and send payment receipts to your financial management system.',
        'navigation.upload': 'Upload Receipt',
        'navigation.history': 'History',
        'navigation.settings': 'Settings',
        'upload.description': 'Upload and process your receipts',
        'history.title': 'View your receipt history',
        'settings.title': 'Configure your settings',
        'upload.title': 'Upload Receipt'
      }
      return translations[key] || key
    }
  }),
}))

// Create a type for mock icon props that accepts only safe HTML attributes
type MockIconProps = {
  className?: string
  'data-testid'?: string
}

jest.mock('lucide-react', () => ({
  Upload: ({ className, ...props }: MockIconProps) => (
    <div data-testid="upload-icon" className={className} {...props} />
  ),
  History: ({ className, ...props }: MockIconProps) => (
    <div data-testid="history-icon" className={className} {...props} />
  ),
  Settings: ({ className, ...props }: MockIconProps) => (
    <div data-testid="settings-icon" className={className} {...props} />
  ),
  FileText: ({ className, ...props }: MockIconProps) => (
    <div data-testid="filetext-icon" className={className} {...props} />
  ),
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      {component}
    </BrowserRouter>
  )
}

describe('Home Component', () => {
  it('renders without crashing', () => {
    renderWithRouter(<Home />)
    expect(screen.getByText('Recipix')).toBeInTheDocument()
  })

  it('displays main title and description', () => {
    renderWithRouter(<Home />)
    expect(screen.getByText('Recipix')).toBeInTheDocument()
    expect(screen.getByText('Capture, process, and send payment receipts to your financial management system.')).toBeInTheDocument()
  })

  it('displays upload and history navigation links', () => {
    renderWithRouter(<Home />)
    
    // Check for navigation links in the header
    const uploadLinks = screen.getAllByText('Upload Receipt')
    const historyLinks = screen.getAllByText('History')
    
    expect(uploadLinks.length).toBeGreaterThan(0)
    expect(historyLinks.length).toBeGreaterThan(0)
  })

  it('displays feature cards', () => {
    renderWithRouter(<Home />)
    
    // Check for feature descriptions
    expect(screen.getByText('Upload and process your receipts')).toBeInTheDocument()
    expect(screen.getByText('View your receipt history')).toBeInTheDocument()
    expect(screen.getByText('Configure your settings')).toBeInTheDocument()
  })

  it('contains proper navigation links', () => {
    renderWithRouter(<Home />)
    
    // Check for links with proper href attributes
    const uploadLink = screen.getAllByRole('link').find(link => 
      link.getAttribute('href') === '/upload'
    )
    const historyLink = screen.getAllByRole('link').find(link => 
      link.getAttribute('href') === '/history'
    )
    const settingsLink = screen.getAllByRole('link').find(link => 
      link.getAttribute('href') === '/settings'
    )
    
    expect(uploadLink).toBeInTheDocument()
    expect(historyLink).toBeInTheDocument()
    expect(settingsLink).toBeInTheDocument()
  })

  it('displays icons for each feature', () => {
    renderWithRouter(<Home />)
    
    expect(screen.getByTestId('upload-icon')).toBeInTheDocument()
    expect(screen.getByTestId('history-icon')).toBeInTheDocument()
    expect(screen.getByTestId('settings-icon')).toBeInTheDocument()
  })

  it('displays stats section', () => {
    renderWithRouter(<Home />)
    
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('Open Source')).toBeInTheDocument()
    expect(screen.getByText('🔒')).toBeInTheDocument()
    expect(screen.getByText('Secure & Private')).toBeInTheDocument()
    expect(screen.getByText('⚡')).toBeInTheDocument()
    expect(screen.getByText('Fast Processing')).toBeInTheDocument()
  })
})
