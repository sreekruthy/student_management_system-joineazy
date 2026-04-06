import { useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const { setUser } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', password: '' });

  const login = async () => {
    const res = await API.post('/auth/login', form);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user)); 
    
    window.location.href = res.data.user.role === "ADMIN" ? "/admin" : "/student";
  };

  return (
    <div className="p-10">
      <input
        placeholder="Email"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        placeholder="Password"
        type="password"
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <button onClick={login}>Login</button>
    </div>
  );
}