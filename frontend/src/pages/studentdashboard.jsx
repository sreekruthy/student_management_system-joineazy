import { useEffect, useState } from "react";
import API from "../services/api";
import ProgressBar from "../components/ui/ProgressBar";
import Navbar from "../components/navbar";

export default function StudentDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [progress, setProgress] = useState({
    total: 0, submitted: 0, acknowledged: 0,
    submittedPct:0, acknowledgedPct:0,
    totalMembers: 0,membersConfirmed: 0, memberPct: 0,
  });
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => {
    API.get("/assignments")
      .then(res => setAssignments(res.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    API.get("/groups/my")
      .then(res => setGroup(res.data));
  }, []);

  const fetchProgress = async () => {
  const res = await API.get(`/submissions/progress?group_id=${group.id}`);
  console.log("PROGRESS FROM BACKEND:", res.data.progress); // 👈 ADD THIS
  setProgress(res.data);
};

  useEffect(() => {
  if (!group?.id) return;
  if (group) {
    fetchProgress();
  }
}, [group]);

  
  const confirm = async (id) => {
    if (!group) return alert("No group");

    await API.post("/submissions/confirm", {
      assignment_id: id,
      group_id: group.id
    });
    
    alert("Submitted");
    fetchProgress();

    if (!group?.id) return;
    const res = await API.get(`/submissions/progress?group_id=${group.id}`);
    setProgress(res.data.progress);
  };

  if (loading) {
  return <p className="p-6">Loading...</p>;
}

if (!group) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <h2 className="text-xl font-bold mb-2">
        No Group Found
      </h2>
      <p className="text-gray-500 mb-4">
        Create or join a group to continue
      </p>

      <a
        href="/group"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Go to Group Page
      </a>
    </div>
  );
}
  return (
    <>
    <Navbar />
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Student Dashboard</h1>

      <div className="mt-4 space-y-3">
        <p className="mb-1">Progress</p>
        <ProgressBar 
        label="Assignments submitted" 
        value={progress.submitted}
        max={progress.total}
        color="indigo"
        showBadge
        />
        <ProgressBar

    label="Leader acknowledged"

    value={progress.acknowledged}

    max={progress.total}

    color="green"

    showBadge
  />
  {progress.total > 0 && (

    <p className="text-xs text-gray-500">

      {progress.membersConfirmed}/{progress.totalMembers} members confirmed

      the latest assignment

    </p>

  )}
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        {assignments.map(a => (
          <div key={a.id} className="bg-white shadow-lg rounded-xl p-4 hover:shadow-xl transition">
            <h2 className="text-lg font-bold">{a.title}</h2>
            <p className="text-gray-600">{a.description}</p>

            <a href={a.onedrive_link}
              className="text-blue-500 block mt-2"
              target="_blank">
              Open Link
            </a>

            {confirmingId === a.id ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Confirm submission for this assignment?
                </p>
                
                <button
                onClick={() => {
                  confirm(a.id);
                  setConfirmingId(null);
                }}
                className="bg-green-600 text-white px-3 py-2 rounded mr-2"
                >
                  Yes, I have submitted
                </button>
                
                <button
                onClick={() => setConfirmingId(null)}
                className="bg-gray-400 text-white px-3 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
              ) : (
              <button
              onClick={() => setConfirmingId(a.id)}
              className="bg-green-500 text-white px-3 py-2 mt-2 rounded"
              >
                Confirm Submission
              </button>
            
            )}
          </div>
        ))}
      </div>
    </div>
    </>
  );
}