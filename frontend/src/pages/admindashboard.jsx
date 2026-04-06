import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/navbar";

export default function AdminDashboard() {
  const [data, setData] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
    onedrive_link: ""
  });
  const createAssignment = async () => {
    await API.post("/assignments", form);
    alert("Created!");
  };

  useEffect(() => {
    API.get("/submissions").then(res => setData(res.data));
  }, []);

  return (
    <> 
    <Navbar/>
    <div className="p-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="p-4 bg-blue-200 rounded">
          Total Submissions: {data.length}
        </div>
      </div>

      {/* CREATE ASSIGNMENT FORM */}
      <div className="mt-6 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-3">
          Create Assignment
        </h2>
        
        <div className="grid grid-cols-2 gap-3">
          <input
          placeholder="Title"
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

           <input
           type="date"
           className="border p-2 rounded"
           onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          />

          <input
          placeholder="OneDrive Link"
          className="border p-2 rounded col-span-2"
          onChange={(e) => setForm({ ...form, onedrive_link: e.target.value })}
          />

          <textarea
          placeholder="Description"
          className="border p-2 rounded col-span-2"
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          
        </div>

        <button
        onClick={createAssignment}
        className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Assignment
        </button>
     </div>

      <table className="mt-6 w-full border">
        <thead>
          <tr>
            <th>Group</th>
            <th>Assignment</th>
          </tr>
        </thead>
        <tbody>
          {data.map(d => (
            <tr key={d.id}>
              <td>{d.group_name}</td>
              <td>{d.title}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}