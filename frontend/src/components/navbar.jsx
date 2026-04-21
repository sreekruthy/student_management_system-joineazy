import { Link, useNavigate } from "react-router-dom";
import {useAuth} from "../context/AuthContext";

export default function Navbar() {
  const {user, logout} = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logout();
  }
  if (!user) return null; // don't show navbar if not logged in

  return (
    <div className="flex justify-between items-center p-4 bg-gray-800 text-white shadow">
      <h1 className="text-lg font-bold">Student System</h1>
      <div className="flex gap-6 items-center text-sm font-medium">
        {user.role === "ADMIN" && (
          <Link to="/admin" className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600">Admin</Link>
        )}

        {user.role === "STUDENT" && (
          <Link to="/student" className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600">Dashboard</Link>
        )}
        

        <Link to="/group" className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600">Group</Link>

        <button
          onClick={handleLogout}
          className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
}