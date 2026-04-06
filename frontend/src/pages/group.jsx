import { useState, useEffect } from "react";
import API from "../services/api";
import Navbar from "../components/navbar";

export default function Group() {
  const [group, setGroup] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);

  useEffect(() => {
    API.get("/groups/my").then(res => setGroup(res.data));
  }, []);

  const create = async () => {
    const res = await API.post("/groups", { group_name: name });
    setGroup(res.data);
  };

  const addMember = async () => {
  await API.post("/groups/add", {
    email,
    group_id: group.id
  });

  alert("Member added!");
};

  return (
    <>
    <Navbar />
    <div className="p-6">
      <h1 className="text-xl font-bold">My Group</h1>

      <div className="mt-6">
        <h2 className="text-lg font-bold mb-2">Add Member</h2>
        
        <div className="flex gap-2">
          <input
          placeholder="Enter email"
          className="border p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          />
          
          <button
          onClick={addMember}
          className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add
          </button>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-semibold">Members:</h3>
        {group?.members?.map(m => (
          <p key={m.email}>{m.email}</p>
          ))}
      </div>

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