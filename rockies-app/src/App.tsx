import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { PlayersProvider } from './context/PlayersContext';
import LineupPage from './pages/LineupPage';
import SchedulePage from './pages/SchedulePage';
import RosterPage from './pages/RosterPage';
import StatsPage from './pages/StatsPage';
import LogicPage from './pages/LogicPage';

export default function App() {
  return (
    <PlayersProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/lineup" replace />} />
            <Route path="/lineup" element={<LineupPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/roster" element={<RosterPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/logic" element={<LogicPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </PlayersProvider>
  );
}
