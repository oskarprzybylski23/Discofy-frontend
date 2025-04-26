import './App.css';
import Header from './components/header/Header';
import Footer from './components/footer/Footer';
import Home from './pages/Home/Home';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <div className='min-h-screen flex flex-col bg-gray-100 text-gray-800'>
      <Header />
      <main className='flex-1 px-4 py-8'>
        <Home />
      </main>
      <Toaster richColors />
      <Footer />
    </div>
  );
}

export default App;
