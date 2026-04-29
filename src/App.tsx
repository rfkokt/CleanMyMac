import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Shell } from './components/layout/Shell';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import Visualizer from './pages/Visualizer';
import DevTools from './pages/DevTools';
import LargeFiles from './pages/LargeFiles';
import Settings from './pages/Settings';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="popLayout">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/scan" element={<Scanner />} />
        <Route path="/visualize" element={<Visualizer />} />
        <Route path="/dev-tools" element={<DevTools />} />
        <Route path="/large-files" element={<LargeFiles />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Shell>
        <AnimatedRoutes />
      </Shell>
    </BrowserRouter>
  );
}

export default App;
