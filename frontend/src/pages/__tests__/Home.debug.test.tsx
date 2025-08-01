import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock the required dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  }),
}))

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>{children}</a>
  ),
}))

jest.mock('lucide-react', () => ({
  Upload: (props: any) => <div data-testid="upload-icon" {...props} />,
  History: (props: any) => <div data-testid="history-icon" {...props} />,
  Settings: (props: any) => <div data-testid="settings-icon" {...props} />,
  FileText: (props: any) => <div data-testid="filetext-icon" {...props} />,
}))

// Test different component patterns to identify the issue
describe('React 19 Component Patterns', () => {
  it('renders simple component', () => {
    const SimpleComponent = () => <div>Hello World</div>
    render(<SimpleComponent />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('renders component with props', () => {
    const ComponentWithProps = ({ text }: { text: string }) => <div>{text}</div>
    render(<ComponentWithProps text="Test Props" />)
    expect(screen.getByText('Test Props')).toBeInTheDocument()
  })

  it('renders component with dynamic icon reference', () => {
    const { Upload } = require('lucide-react')
    const TestComponent = () => {
      const IconComponent = Upload
      return (
        <div>
          <IconComponent className="h-6 w-6" />
          <span>With Icon</span>
        </div>
      )
    }
    render(<TestComponent />)
    expect(screen.getByText('With Icon')).toBeInTheDocument()
    expect(screen.getByTestId('upload-icon')).toBeInTheDocument()
  })
})
