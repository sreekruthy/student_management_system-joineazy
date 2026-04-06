import { useState, useEffect } from "react";
import API from "../services/api";
import Navbar from "../components/navbar";

export default function Group() {
  const [group, setGroup] = useState(null);
  const [name, setName] = useState("");

  useEffect(() => {
    API.get("/groups/my").then(res => setGroup(res.data));
  }, []);

  const create = async () => {
    const res = await API.post("/groups", { group_name: name });
    setGroup(res.data);
  };

  return (
    <>
    <Navbar />
    <div className="p-6">
      <h1 className="text-xl font-bold">My Group</h1>

      {!group ? (
        <div className="mt-4">
          <input
            placeholder="Group Name"
            className="border p-2"
            onChange={(e) => setName(e.target.value)}
          />
          <button onClick={create}
            className="bg-green-500 text-white p-2 ml-2">
            Create
          </button>
        </div>
      ) : (
        <div className="mt-4 p-4 border rounded">
          <h2>{group.group_name}</h2>
        </div>
      )}
    </div>
    </>
  );
}