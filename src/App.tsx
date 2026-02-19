import './App.css';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <div className="App">
      {/* {process.env.NODE_ENV === 'development' && <PerformanceMonitor enabled={true} />} */}
      <Dashboard />
    </div>
  );
}

export default App;
