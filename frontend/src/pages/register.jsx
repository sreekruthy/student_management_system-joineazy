import { useState } from "react";
import API from "../services/api";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
  });

  const register = async () => {
    await API.post("/auth/register", form);
    alert("Registered!");
  };

  return (
    <div className="flex flex-col gap-4 p-10 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Register</h1>

      <input placeholder="Name"
        className="border p-2"
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <input placeholder="Email"
        className="border p-2"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <input placeholder="Password" type="password"
        className="border p-2"
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />

      <select
        className="border p-2"
        onChange={(e) => setForm({ ...form, role: e.target.value })}
      >
        <option value="STUDENT">Student</option>
        <option value="ADMIN">Professor</option>
      </select>

      <button
        onClick={register}
        className="bg-blue-500 text-white p-2 rounded"
      >
        Register
      </button>
    </div>
  );
}