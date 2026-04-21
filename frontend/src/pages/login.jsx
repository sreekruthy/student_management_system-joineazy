import { useState, useContext } from 'react';

import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const {login} = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });

  const [error,setError] = useState('');
  const [loading,setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try{
      const user = await login(form);
      
      navigate(user.role === 'ADMIN' ? '/admin' : '/student');
    } catch (err) {
      setError(err.response.data?.msg || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      
      <div className="bg-white p-8 rounded-lg shadow-md w-96">

        {/* Heading */}
        <h2 className="text-2xl font-bold text-center mb-6">
          Login Page
        </h2>

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-2 border rounded"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-2 border rounded"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error && (

  <p className="text-red-500 text-sm mb-4 text-center">{error}</p>

)}

<button onClick={handleLogin} disabled={loading}

  className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50">

  {loading ? 'Logging in...' : 'Login'}

</button>

        {/* Signup Link */}
        <p className="text-center mt-4">
          Not a user?{" "}
          <Link to="/register" className="text-blue-500 hover:underline">
            Sign up
          </Link>
        </p>

      </div>
    </div>
  );
}