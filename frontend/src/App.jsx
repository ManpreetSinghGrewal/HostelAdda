import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import ParticleBackground from './components/ParticleBackground';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ChatRoom from './pages/ChatRoom';
import About from './pages/About';
import Profile from './pages/Profile';

function App() {
  return (
    <ThemeProvider>
      <div className="app-container" style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        <ParticleBackground />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/chat/:roomId" element={<ChatRoom />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App;
