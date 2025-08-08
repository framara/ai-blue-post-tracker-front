import type { ReactNode } from 'react';
import { Search, Settings, BarChart3 } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="blue-gradient w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Blue Post Tracker
              </h1>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                <Search className="w-4 h-4 mr-1" />
                Search
              </button>
              <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                <BarChart3 className="w-4 h-4 mr-1" />
                Analytics
              </button>
              <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                <Settings className="w-4 h-4 mr-1" />
                Settings
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            Blue Post Tracker - Keeping track of official game communications
          </div>
        </div>
      </footer>
    </div>
  );
}
