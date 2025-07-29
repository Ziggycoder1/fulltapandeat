import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminDashboard from './Components/AdminDashboard';
import Login from './Components/Login';
import Signup from './Components/Signup';
import RestaurantDashboard from './Components/RestaurantDashboard';

const Placeholder = ({ title }) => <div style={{ padding: '2rem' }}><h2>{title}</h2><p>Coming soon...</p></div>;

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/restaurant" element={<RestaurantDashboard />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/users" element={<Placeholder title="Users" />} />
          <Route path="/transactions" element={<Placeholder title="Transactions" />} />
          <Route path="/settings" element={<Placeholder title="Settings" />} />
          <Route path="/profile" element={<Placeholder title="Profile" />} />
          <Route path="/restaurant/clients" element={<Placeholder title="Restaurant Clients" />} />
          <Route path="/restaurant/logs" element={<Placeholder title="Restaurant Meal Logs" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;