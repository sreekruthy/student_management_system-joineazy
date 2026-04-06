import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/navbar";

export default function AdminDashboard() {
  const [data, setData] = useState([]);

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