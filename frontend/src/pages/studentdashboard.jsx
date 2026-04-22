import { useEffect, useState } from "react";
import API from "../services/api";
import ProgressBar from "../components/ui/ProgressBar";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Navbar from "../components/navbar";

export default function StudentDashboard() {
  const [courses, setCourses]           = useState([]);
  const [selectedCourse, setSelected]   = useState(null);
  const [assignments, setAssignments]   = useState([]);
  const [group, setGroup]               = useState(null);
  const [groupProgress, setGroupProgress]         = useState({ total: 0, submitted: 0, acknowledged: 0 });
  const [individualProgress, setIndividualProgress] = useState({ total: 0, submitted: 0 });
  const [submittedIds, setSubmittedIds] = useState(new Set());
  const [confirmingId, setConfirmingId] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  useEffect(() => {
    Promise.all([
      API.get('/courses/my'),
      API.get('/groups/my'),
    ]).then(([coursesRes, groupRes]) => {
      setCourses(coursesRes.data);
      setGroup(groupRes.data);
    }).catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    API.get(`/assignments?course_id=${selectedCourse.id}`)
      .then(res => setAssignments(res.data));
  }, [selectedCourse]);

  useEffect(() => {
    if (!group?.id) return;
    fetchGroupProgress();
    fetchIndividualProgress();
    API.get('/submissions').then(res => {
      const ids = res.data
        .filter(s => s.group_id === group.id)
        .map(s => s.assignment_id);
      setSubmittedIds(new Set(ids));
    });
  }, [group]);

  const fetchGroupProgress = async () => {
    if (!group?.id) return;
    const res = await API.get(`/submissions/progress?group_id=${group.id}&type=group`);
    setGroupProgress(res.data);
  };

  const fetchIndividualProgress = async () => {
    if (!group?.id) return;
    try {
      const res = await API.get(`/submissions/progress?group_id=${group.id}&type=individual`);
      setIndividualProgress(res.data);
    } catch {
      // individual progress endpoint may not exist yet — silently ignore
    }
  };

  const handleConfirm = async (assignmentId) => {
    if (!group) return;
    try {
      await API.post('/submissions/confirm', {
        assignment_id: assignmentId,
        group_id: group.id,
      });
      setSubmittedIds(prev => new Set([...prev, assignmentId]));
      setConfirmingId(null);
      fetchGroupProgress();
      fetchIndividualProgress();
    } catch (err) {
      setError(err.response?.data?.msg || 'Submission failed');
    }
  };

  const handleAcknowledge = async (assignmentId) => {
    try {
      await API.post('/submissions/acknowledge', {
        assignment_id: assignmentId,
        group_id: group.id,
      });
      fetchGroupProgress();
    } catch (err) {
      setError(err.response?.data?.msg || 'Acknowledgment failed');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner size="lg" /></div>;

  if (!group) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <h2 className="text-xl font-bold mb-2">No Group Found</h2>
      <p className="text-gray-500 mb-4">Create or join a group to continue</p>
      <a href="/group" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Go to Group Page</a>
    </div>
  );

  const groupSubmittedPct    = groupProgress.total ? Math.round((groupProgress.submitted    / groupProgress.total) * 100) : 0;
  const groupAcknowledgedPct = groupProgress.total ? Math.round((groupProgress.acknowledged / groupProgress.total) * 100) : 0;
  const indivSubmittedPct    = individualProgress.total ? Math.round((individualProgress.submitted / individualProgress.total) * 100) : 0;

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Student Dashboard</h1>
        <p className="text-gray-500 mb-6">Welcome, {JSON.parse(localStorage.getItem('user'))?.name}</p>

        {error && <p className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded">{error}</p>}

        {/* Progress section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Group progress */}
          <div className="bg-white rounded-xl shadow p-4 space-y-3">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Group</span>
              Group Assignment Progress
            </h2>
            {groupProgress.total === 0 ? (
              <p className="text-gray-400 text-sm">No group assignments yet.</p>
            ) : (
              <>
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Submitted</span>
                    <span>{groupProgress.submitted}/{groupProgress.total} ({groupSubmittedPct}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-indigo-500 h-3 rounded-full transition-all duration-700"
                      style={{ width: `${groupSubmittedPct}%` }} />
                  </div>
                  {groupSubmittedPct === 100 && <p className="text-green-600 text-xs font-medium mt-1">Complete</p>}
                </div>
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Leader acknowledged</span>
                    <span>{groupProgress.acknowledged}/{groupProgress.total} ({groupAcknowledgedPct}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full transition-all duration-700"
                      style={{ width: `${groupAcknowledgedPct}%` }} />
                  </div>
                  {groupAcknowledgedPct === 100 && <p className="text-green-600 text-xs font-medium mt-1">Complete</p>}
                </div>
              </>
            )}
          </div>

          {/* Individual progress */}
          <div className="bg-white rounded-xl shadow p-4 space-y-3">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Individual</span>
              Individual Assignment Progress
            </h2>
            {individualProgress.total === 0 ? (
              <p className="text-gray-400 text-sm">No individual assignments yet.</p>
            ) : (
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Submitted</span>
                  <span>{individualProgress.submitted}/{individualProgress.total} ({indivSubmittedPct}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-purple-500 h-3 rounded-full transition-all duration-700"
                    style={{ width: `${indivSubmittedPct}%` }} />
                </div>
                {indivSubmittedPct === 100 && <p className="text-green-600 text-xs font-medium mt-1">Complete</p>}
              </div>
            )}
          </div>
        </div>

        {/* Course cards */}
        {!selectedCourse ? (
          <>
            <h2 className="text-lg font-semibold mb-3">My Courses</h2>
            {courses.length === 0
              ? <p className="text-gray-400">You are not enrolled in any courses yet.</p>
              : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map(c => (
                    <div key={c.id} onClick={() => setSelected(c)}
                      className="bg-white rounded-xl shadow p-5 cursor-pointer hover:shadow-md transition border border-transparent hover:border-indigo-200">
                      <h3 className="font-bold text-lg mb-1">{c.title}</h3>
                      <p className="text-gray-500 text-sm mb-3">{c.description}</p>
                      <div className="flex gap-4 text-xs text-gray-400">
                        <span>{c.assignment_count} assignments</span>
                        <span>by {c.professor_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => { setSelected(null); setAssignments([]); }}
                className="text-indigo-500 hover:underline text-sm">
                ← Back to courses
              </button>
              <h2 className="text-lg font-semibold">{selectedCourse.title}</h2>
            </div>

            {assignments.length === 0
              ? <p className="text-gray-400">No assignments posted yet.</p>
              : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignments.map(a => {
                    const isSubmitted = submittedIds.has(a.id);
                    const isOverdue   = new Date(a.due_date) < new Date() && !isSubmitted;
                    const status      = isSubmitted ? 'CONFIRMED' : isOverdue ? 'OVERDUE' : 'PENDING';

                    return (
                      <div key={a.id} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold">{a.title}</h3>
                          <div className="flex flex-col items-end gap-1">
                            <StatusBadge status={status} />
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              a.type === 'individual' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {a.type === 'individual' ? 'Individual' : 'Group'}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-500 text-sm">{a.description}</p>
                        <p className="text-xs text-gray-400">Due: {new Date(a.due_date).toLocaleDateString()}</p>
                        {a.professor_name && <p className="text-xs text-gray-400">By: {a.professor_name}</p>}
                        {a.onedrive_link && (
                          <a href={a.onedrive_link} target="_blank" rel="noreferrer"
                            className="text-blue-500 text-sm hover:underline">
                            Open submission link ↗
                          </a>
                        )}

                        {isSubmitted ? (
                          <div className="flex flex-col gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">✓ Submitted</span>
                            {group.is_leader && a.type === 'group' && (
                              <button onClick={() => handleAcknowledge(a.id)}
                                className="bg-indigo-500 text-white text-sm px-3 py-1.5 rounded hover:bg-indigo-600">
                                Acknowledge for group
                              </button>
                            )}
                          </div>
                        ) : confirmingId === a.id ? (
                          <div className="flex gap-2 mt-1">
                            <button onClick={() => handleConfirm(a.id)}
                              className="bg-green-600 text-white text-sm px-3 py-1.5 rounded hover:bg-green-700">
                              Yes, submitted
                            </button>
                            <button onClick={() => setConfirmingId(null)}
                              className="bg-gray-200 text-gray-700 text-sm px-3 py-1.5 rounded hover:bg-gray-300">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmingId(a.id)}
                            className="mt-1 bg-green-500 text-white text-sm px-3 py-1.5 rounded hover:bg-green-600">
                            Confirm Submission
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            }
          </>
        )}
      </div>
    </>
  );
}