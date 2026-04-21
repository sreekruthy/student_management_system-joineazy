import { useState } from "react";
import API from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { set } from "../../../backend/src/app";


export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
  });
  const [error, setError] = useState('');
  const [loading,setLoading] = useState(false);

  const register = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await API.post("/auth/register", form);
      alert("Registered successfully!");

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/student');
    } catch (err) {
      setError(err.response.data?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      
      <div className="bg-white p-8 rounded-lg shadow-md w-96">

        <h2 className="text-2xl font-bold text-center mb-6">
          Register
        </h2>

        <input
          placeholder="Name"
          className="w-full mb-4 p-2 border rounded"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="Email"
          className="w-full mb-4 p-2 border rounded"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          placeholder="Password"
          type="password"
          className="w-full mb-4 p-2 border rounded"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <select
          className="w-full mb-6 p-2 border rounded"
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="STUDENT">Student</option>
          <option value="ADMIN">Professor</option>
        </select>

        {error && (

  <p className="text-red-500 text-sm mb-4 text-center">{error}</p>

)}

<button onClick={register} disabled={loading}

  className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-50">

  {loading ? 'Registering...' : 'Register'}

</button>

        <p className="text-center mt-4">
          Already have an account?{" "}
          <Link to="/" className="text-blue-500 hover:underline">
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}