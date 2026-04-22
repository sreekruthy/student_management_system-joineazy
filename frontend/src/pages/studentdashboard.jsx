import { useEffect, useState } from "react";
import API from "../services/api";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Navbar from "../components/navbar";
import ProgressBar from "../components/ui/ProgressBar";

export default function StudentDashboard() {
  const [courses, setCourses]         = useState([]);
  const [selectedCourse, setSelected] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [group, setGroup]             = useState(null);
  const [groupProgress, setGroupProgress]       = useState({ total: 0, submitted: 0, acknowledged: 0 });
  const [individualProgress, setIndividualProgress] = useState({ total: 0, submitted: 0 });
  const [submittedIds, setSubmittedIds] = useState(new Set());
  const [confirmingId, setConfirmingId] = useState(null);
  const [expandedId, setExpandedId]   = useState(null); // per-assignment breakdown
  const [breakdowns, setBreakdowns]   = useState({});   // cache: assignmentId -> breakdown
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

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

  useEffect(() => {
    if (!selectedCourse) return;
    API.get(`/assignments?course_id=${selectedCourse.id}`)
      .then(res => setAssignments(res.data));
  }, [selectedCourse]);

  const fetchGroupProgress = async () => {
    if (!group?.id) return;
    try {
      const res = await API.get(`/submissions/progress/group?group_id=${group.id}`);
      setGroupProgress(res.data);
    } catch { /* ignore */ }
  };

  const fetchIndividualProgress = async () => {
    try {
      const res = await API.get('/submissions/progress/individual');
      setIndividualProgress(res.data);
    } catch { /* ignore */ }
  };

  const fetchBreakdown = async (assignmentId) => {
    if (breakdowns[assignmentId]) return; // already cached
    try {
      const res = await API.get(`/submissions/breakdown/${assignmentId}?group_id=${group.id}`);
      setBreakdowns(prev => ({ ...prev, [assignmentId]: res.data }));
    } catch { /* ignore */ }
  };

  const toggleBreakdown = (assignmentId) => {
    if (expandedId === assignmentId) {
      setExpandedId(null);
    } else {
      setExpandedId(assignmentId);
      fetchBreakdown(assignmentId);
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
      // Invalidate breakdown cache for this assignment
      setBreakdowns(prev => { const n = { ...prev }; delete n[assignmentId]; return n; });
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
      // Invalidate breakdown cache
      setBreakdowns(prev => { const n = { ...prev }; delete n[assignmentId]; return n; });
      fetchGroupProgress();
    } catch (err) {
      setError(err.response?.data?.msg || 'Acknowledgment failed');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <LoadingSpinner size="lg" />
    </div>
  );

  if (!group) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <h2 className="text-xl font-bold mb-2">No Group Found</h2>
      <p className="text-gray-500 mb-4">Create or join a group to continue</p>
      <a href="/group" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        Go to Group Page
      </a>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Student Dashboard</h1>
        <p className="text-gray-500 mb-6">
          Welcome, {JSON.parse(localStorage.getItem('user'))?.name}
        </p>

        {error && <p className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded">{error}</p>}

        {/* ── Top-level progress cards ── */}
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
                  <ProgressBar value={groupProgress.submitted} max={groupProgress.total} label="Groups submitted" color="indigo" showBadge/>
                </div>
                <div>
                  <ProgressBar value={groupProgress.acknowledged} max={groupProgress.total} label="Leader acknowledged" color="green" showBadge />
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
                <ProgressBar value={individualProgress.submitted} max={individualProgress.total} label="Submitted" color="indigo" showBadge />
              </div>
            )}
          </div>
        </div>

        {/* ── Course list / assignment list ── */}
        {!selectedCourse ? (
          <>
            <h2 className="text-lg font-semibold mb-3">My Courses</h2>
            {courses.length === 0 ? (
              <p className="text-gray-400">You are not enrolled in any courses yet.</p>
            ) : (
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
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => { setSelected(null); setAssignments([]); setExpandedId(null); }}
                className="text-indigo-500 hover:underline text-sm">
                ← Back to courses
              </button>
              <h2 className="text-lg font-semibold">{selectedCourse.title}</h2>
            </div>

            {assignments.length === 0 ? (
              <p className="text-gray-400">No assignments posted yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignments.map(a => {
                  const isSubmitted = submittedIds.has(a.id);
                  const isOverdue   = new Date(a.due_date) < new Date() && !isSubmitted;
                  const status      = isSubmitted ? 'CONFIRMED' : isOverdue ? 'OVERDUE' : 'PENDING';
                  const isGroup     = a.type === 'group';
                  const isExpanded  = expandedId === a.id;
                  const bd          = breakdowns[a.id];

                  return (
                    <div key={a.id} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold">{a.title}</h3>
                        <div className="flex flex-col items-end gap-1">
                          <StatusBadge status={status} />
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isGroup
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {isGroup ? 'Group' : 'Individual'}
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-500 text-sm">{a.description}</p>
                      <p className="text-xs text-gray-400">Due: {new Date(a.due_date).toLocaleDateString()}</p>
                      {a.professor_name && (
                        <p className="text-xs text-gray-400">By: {a.professor_name}</p>
                      )}
                      {a.onedrive_link && (
                        <a href={a.onedrive_link} target="_blank" rel="noreferrer"
                          className="text-blue-500 text-sm hover:underline">
                          Open submission link ↗
                        </a>
                      )}

                      {/* Submit / confirm controls */}
                      {isSubmitted ? (
                        <div className="flex flex-col gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                            ✓ Submitted
                          </span>
                          {group.is_leader && isGroup && (
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

                      {/* ── Per-assignment group breakdown (group assignments only) ── */}
                      {isGroup && (
                        <button
                          onClick={() => toggleBreakdown(a.id)}
                          className="mt-1 text-xs text-indigo-500 hover:underline text-left">
                          {isExpanded ? '▲ Hide group breakdown' : '▼ View group breakdown'}
                        </button>
                      )}

                      {isGroup && isExpanded && (
                        <div className="mt-2 border-t pt-3 space-y-3">
                          {!bd ? (
                            <p className="text-xs text-gray-400">Loading...</p>
                          ) : (
                            <>
                              {/* Member submission bar */}
                              <div>
                                <ProgressBar
                                  value={bd.submittedCount}
                                  max={bd.totalMembers}
                                  label="Members submitted"
                                  color="indigo"
                                />
                              </div>

                              {/* Acknowledgment bar */}
                              <div>
                                <ProgressBar
                                  value={bd.acknowledgedCount}
                                  max={bd.totalMembers}
                                  label="Leader acknowledged"
                                  color="green"
                                  showBadge
                                />
                              </div>

                              {/* Member list */}
                              <div className="space-y-1">
                                {bd.members.map(m => (
                                  <div key={m.id}
                                    className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                                    <span className="text-gray-700">{m.name}</span>
                                    <div className="flex gap-2">
                                      <span className={`px-1.5 py-0.5 rounded ${
                                        m.submitted
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-gray-100 text-gray-400'
                                      }`}>
                                        {m.submitted ? '✓ Submitted' : 'Pending'}
                                      </span>
                                      {m.submitted && (
                                        <span className={`px-1.5 py-0.5 rounded ${
                                          m.acknowledged
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'bg-gray-100 text-gray-400'
                                        }`}>
                                          {m.acknowledged ? '✓ Ack' : 'Not ack'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}