import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (!user) return null; // don't show navbar if not logged in

  return (
    <div className="flex justify-between items-center p-4 bg-gray-800 text-white shadow">
      <h1 className="text-lg font-bold">Student System</h1>

      <div className="flex gap-4 items-center">
        {user.role === "ADMIN" && (
          <Link to="/admin" className="hover:underline">Admin</Link>
        )}

        {user.role === "STUDENT" && (
          <Link to="/student" className="hover:underline">Dashboard</Link>
        )}

        <Link to="/group" className="hover:underline">Group</Link>

        <button
          onClick={logout}
          className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
}