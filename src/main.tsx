import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('🚀 main.tsx executing...');

const rootElement = document.getElementById('root');
console.log('📍 Root element found:', !!rootElement);

if (rootElement) {
  console.log('🎯 Creating React root...');
  const root = createRoot(rootElement);
  
  console.log('🎨 Rendering App...');
  root.render(<App />);
  
  console.log('✅ Render call completed');
} else {
  console.error('❌ Root element not found!');
}
