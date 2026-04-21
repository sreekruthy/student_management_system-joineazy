import { useState, useEffect } from "react";
import API from "../services/api";
import Navbar from "../components/navbar";

export default function Group() {
  const [group, setGroup] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [error, setError] = useState('');   
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/groups/my").then(res => setGroup(res.data)).catch(() => setGroup("Failed to load group"));
  }, []);

  const create = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await API.post("/groups", { group_name: name });
      setGroup(res.data);
    }
    catch (err) {
      setError(err.response?.data?.msg || 'Failed to create group');
    }
    finally {
      setLoading(false);
    }
  };

  

  const addMember = async () => {
    if (!email.trim()) return setError('Email is required');
    setError('');
    setLoading(true);

    await API.post("/groups/add", {
      email,
      group_id: group.id});
      setEmail('');
try{
      //refresh to show new member
      const res = await API.get("/groups/my");
      setGroup(res.data);
  } catch (err) {
    setError(err.response?.data?.msg || 'Failed to add member');
  } finally {
    setLoading(false);
  }
 
};

  return (
    <>
    <Navbar />
    <div className="p-4">

    {error && (
     <p className="text-red-500 text-sm mb-3">{error}</p>
     )}

 
{/* If group exists */}
        {group ? (
          <div className="mt-4 p-4 border rounded">

            <h2 className="text-xl font-bold">{group.group_name}</h2>

            {/* Members */}
            <div className="mt-4">
              <h3 className="font-semibold">Members:</h3>
              {group?.members?.map((m) => (
                <p key={m.email}>{m.email}</p>
              ))}
            </div>

            {/* Add Member (only leader) */}
            {group?.is_leader && (
              <div className="mt-6">
                <h2 className="text-lg font-bold mb-2">Add Member</h2>

                <div className="flex gap-2">
                  <input
                    placeholder="Enter email"
                    className="border p-2 flex-1"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <button
                    onClick={addMember}
                    disabled={loading}
                    className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    {loading ? "Adding..." : "Add"}
                  </button>
                </div>
              </div>
            )}

          </div>
        ) : (
          // If no group → show create
          <div className="mt-4">
            <input
              placeholder="Group Name"
              className="border p-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <button
              onClick={create}
              disabled={loading}
              className="bg-green-500 text-white p-2 ml-2 rounded disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        )}

      </div>
    </>
  );
}