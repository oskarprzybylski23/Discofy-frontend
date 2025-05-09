import './App.css';
import Header from './components/header/Header';
import Footer from './components/footer/Footer';
import Home from './pages/Home/Home';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <div className='min-h-screen min-w-[300px] flex flex-col'>
      <div
        className='fixed top-0 left-0 w-full h-full bg-repeat-y bg-center blur-xs opacity-20 z-0 pointer-events-none'
        style={{
          backgroundImage: `url('/background.jpg')`,
          backgroundSize: 'cover',
        }}
      ></div>
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
