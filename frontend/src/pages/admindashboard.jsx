import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import StatusBadge from "../components/ui/StatusBadge";

export default function AdminDashboard() {
  const [courses, setCourses]       = useState([]);
  const [selectedCourse, setSelected] = useState(null);
  const [analytics, setAnalytics]   = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [groups, setGroups]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  // Create assignment form
  const [form, setForm] = useState({
    title: '', description: '', due_date: '', onedrive_link: '', course_id: ''
  });
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    Promise.all([
      API.get('/courses/teaching'),
      API.get('/groups'),
    ]).then(([coursesRes, groupsRes]) => {
      setCourses(coursesRes.data);
      setGroups(groupsRes.data);
    }).catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  // Load analytics when course is selected
  useEffect(() => {
    if (!selectedCourse) return;
    API.get(`/assignments?course_id=${selectedCourse.id}`)
      .then(res => setAssignments(res.data));
  }, [selectedCourse]);

  const loadAnalytics = async (assignmentId) => {
    const res = await API.get(`/assignments/${assignmentId}/analytics`);
    setAnalytics(res.data);
  };

  const createAssignment = async () => {
    if (!form.title || !form.due_date || !form.course_id) {
      return setError('Title, due date and course are required');
    }
    setCreating(true); setError('');
    try {
      await API.post('/assignments', form);
      setShowForm(false);
      setForm({ title: '', description: '', due_date: '', onedrive_link: '', course_id: '' });
      if (selectedCourse) {
        const res = await API.get(`/assignments?course_id=${selectedCourse.id}`);
        setAssignments(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create assignment');
    } finally { setCreating(false); }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner size="lg" /></div>;

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Professor Dashboard</h1>

        {error && <p className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded">{error}</p>}

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Courses',     value: courses.length },
            { label: 'Groups',      value: groups.length },
            { label: 'Assignments', value: courses.reduce((a, c) => a + parseInt(c.assignment_count || 0), 0) },
            { label: 'Students',    value: courses.reduce((a, c) => a + parseInt(c.student_count    || 0), 0) },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl shadow p-4 text-center">
              <p className="text-3xl font-bold text-indigo-600">{s.value}</p>
              <p className="text-gray-500 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Create assignment button */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {selectedCourse ? `${selectedCourse.title} — Assignments` : 'My Courses'}
          </h2>
          <button onClick={() => setShowForm(v => !v)}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm">
            {showForm ? 'Cancel' : '+ New Assignment'}
          </button>
        </div>

        {/* Create assignment form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow p-5 mb-6">
            <h3 className="font-semibold mb-4">Create Assignment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Title" value={form.title}
                className="border p-2 rounded"
                onChange={e => setForm({ ...form, title: e.target.value })} />
              <input type="date" value={form.due_date}
                className="border p-2 rounded"
                onChange={e => setForm({ ...form, due_date: e.target.value })} />
              <input placeholder="OneDrive link" value={form.onedrive_link}
                className="border p-2 rounded sm:col-span-2"
                onChange={e => setForm({ ...form, onedrive_link: e.target.value })} />
              <textarea placeholder="Description" value={form.description}
                className="border p-2 rounded sm:col-span-2"
                onChange={e => setForm({ ...form, description: e.target.value })} />
              <select value={form.course_id}
                className="border p-2 rounded sm:col-span-2"
                onChange={e => setForm({ ...form, course_id: e.target.value })}>
                <option value="">Select course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <button onClick={createAssignment} disabled={creating}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50">
              {creating ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        )}

        {/* Course list or assignment list */}
        {!selectedCourse ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(c => (
              <div key={c.id} onClick={() => setSelected(c)}
                className="bg-white rounded-xl shadow p-5 cursor-pointer hover:shadow-md transition">
                <h3 className="font-bold text-lg mb-1">{c.title}</h3>
                <p className="text-gray-500 text-sm mb-3">{c.description}</p>
                <div className="flex gap-4 text-xs text-gray-400">
                  <span>{c.student_count} students</span>
                  <span>{c.assignment_count} assignments</span>
                  <span>{c.submission_count} submissions</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <button onClick={() => { setSelected(null); setAssignments([]); setAnalytics(null); }}
              className="text-indigo-500 hover:underline text-sm mb-4 block">
              ← Back to courses
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {assignments.map(a => (
                <div key={a.id} className="bg-white rounded-xl shadow p-4">
                  <h3 className="font-bold mb-1">{a.title}</h3>
                  <p className="text-gray-500 text-sm mb-1">{a.description}</p>
                  <p className="text-xs text-gray-400 mb-3">
                    Due: {new Date(a.due_date).toLocaleDateString()}
                  </p>
                  <button onClick={() => loadAnalytics(a.id)}
                    className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100">
                    View analytics
                  </button>
                </div>
              ))}
            </div>

            {/* Analytics panel */}
            {analytics && (
              <div className="bg-white rounded-xl shadow p-5">
                <h3 className="font-semibold mb-4">
                  Analytics — {analytics.assignment?.title}
                </h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[
                    { label: 'Total students', value: analytics.total },
                    { label: 'Submitted',      value: analytics.submitted },
                    { label: 'Acknowledged',   value: analytics.acknowledged },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-indigo-600">{s.value}</p>
                      <p className="text-gray-500 text-xs mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Submission rate</span>
                    <span>{analytics.total ? Math.round((analytics.submitted / analytics.total) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-indigo-500 h-3 rounded-full transition-all duration-700"
                      style={{ width: `${analytics.total ? Math.round((analytics.submitted / analytics.total) * 100) : 0}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/* Groups table */}
            <div className="bg-white rounded-xl shadow p-5 mt-6">
              <h3 className="font-semibold mb-3">All Groups</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b">
                    <th className="pb-2">Group</th>
                    <th className="pb-2">Leader</th>
                    <th className="pb-2">Members</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map(g => (
                    <tr key={g.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{g.group_name}</td>
                      <td className="py-2 text-gray-500">{g.leader_name || '—'}</td>
                      <td className="py-2 text-gray-500">{g.member_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}