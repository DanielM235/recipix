import Navbar from './Navbar'
import Sidebar from './Sidebar'

interface LayoutProps {
  readonly children: React.ReactNode
}

function Layout({ children }: LayoutProps) {
  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      <Navbar />
      <div className='flex'>
        <Sidebar />
        <main className='flex-1 lg:ml-64'>
          <div className='p-4 sm:p-6 lg:p-8'>{children}</div>
        </main>
      </div>
    </div>
  )
}

export default Layout
