import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/navbar";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export default function AdminDashboard() {
  const [courses, setCourses]           = useState([]);
  const [selectedCourse, setSelected]   = useState(null);
  const [analytics, setAnalytics]       = useState(null);
  const [assignments, setAssignments]   = useState([]);
  const [groups, setGroups]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  const [form, setForm] = useState({
    title: '', description: '', due_date: '', onedrive_link: '', course_id: '', type: 'group'
  });
  const [creating, setCreating]   = useState(false);
  const [showForm, setShowForm]   = useState(false);

  const [courseForm, setCourseForm]         = useState({ title: '', description: '', studentEmails: '' });
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [courseError, setCourseError]       = useState('');
  const [courseSuccess, setCourseSuccess]   = useState('');

  const [editingCourse, setEditingCourse]   = useState(null);
  const [editEmails, setEditEmails]         = useState('');
  const [editingLoading, setEditingLoading] = useState(false);
  const [editError, setEditError]           = useState('');
  const [editSuccess, setEditSuccess]       = useState('');

  const fetchCourses = () =>
    API.get('/courses/teaching').then(res => setCourses(res.data));

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
      setForm({ title: '', description: '', due_date: '', onedrive_link: '', course_id: '', type: 'group' });
      if (selectedCourse) {
        const res = await API.get(`/assignments?course_id=${selectedCourse.id}`);
        setAssignments(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create assignment');
    } finally { setCreating(false); }
  };

  const createCourse = async () => {
    if (!courseForm.title.trim()) return setCourseError('Course title is required');
    setCreatingCourse(true); setCourseError(''); setCourseSuccess('');
    try {
      const emailList = courseForm.studentEmails
        ? courseForm.studentEmails.split(',').map(e => e.trim()).filter(Boolean)
        : [];
      await API.post('/courses', {
        title: courseForm.title.trim(),
        description: courseForm.description.trim(),
        studentEmails: emailList,
      });
      setCourseSuccess(`Course "${courseForm.title}" created!`);
      setCourseForm({ title: '', description: '', studentEmails: '' });
      setShowCourseForm(false);
      fetchCourses();
    } catch (err) {
      setCourseError(err.response?.data?.error || 'Failed to create course');
    } finally { setCreatingCourse(false); }
  };

  const saveEditStudents = async () => {
    if (!editingCourse) return;
    setEditingLoading(true); setEditError(''); setEditSuccess('');
    try {
      const emailList = editEmails.split(',').map(e => e.trim()).filter(Boolean);
      await API.patch(`/courses/${editingCourse.id}/students`, { studentEmails: emailList });
      setEditSuccess('Students updated successfully!');
      fetchCourses();
    } catch (err) {
      setEditError(err.response?.data?.error || 'Failed to update students');
    } finally { setEditingLoading(false); }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner size="lg" /></div>;

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Professor Dashboard</h1>

        {error && <p className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded">{error}</p>}
        {courseSuccess && <p className="text-green-600 text-sm mb-4 p-3 bg-green-50 rounded">{courseSuccess}</p>}

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

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {selectedCourse ? `${selectedCourse.title} — Assignments` : 'My Courses'}
          </h2>
          <div className="flex gap-2">
            {!selectedCourse && (
              <button onClick={() => { setShowCourseForm(v => !v); setShowForm(false); }}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm">
                {showCourseForm ? 'Cancel' : '+ New Course'}
              </button>
            )}
            <button onClick={() => { setShowForm(v => !v); setShowCourseForm(false); }}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm">
              {showForm ? 'Cancel' : '+ New Assignment'}
            </button>
          </div>
        </div>

        {/* Create course form */}
        {showCourseForm && (
          <div className="bg-white rounded-xl shadow p-5 mb-6 border border-green-100">
            <h3 className="font-semibold mb-4 text-green-700">Create New Course</h3>
            {courseError && <p className="text-red-500 text-sm mb-3">{courseError}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Course title *" value={courseForm.title}
                className="border p-2 rounded"
                onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} />
              <input placeholder="Student emails (comma separated, optional)" value={courseForm.studentEmails}
                className="border p-2 rounded"
                onChange={e => setCourseForm({ ...courseForm, studentEmails: e.target.value })} />
              <textarea placeholder="Description (optional)" value={courseForm.description}
                className="border p-2 rounded sm:col-span-2" rows={2}
                onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} />
            </div>
            <button onClick={createCourse} disabled={creatingCourse}
              className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50">
              {creatingCourse ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        )}

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
                className="border p-2 rounded"
                onChange={e => setForm({ ...form, course_id: e.target.value })}>
                <option value="">Select course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <select value={form.type}
                className="border p-2 rounded"
                onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="group">Group assignment</option>
                <option value="individual">Individual assignment</option>
              </select>
            </div>
            {courses.length === 0 && (
              <p className="text-amber-600 text-sm mt-2">No courses yet — create a course first.</p>
            )}
            <button onClick={createAssignment} disabled={creating}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50">
              {creating ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        )}

        {/* Edit students modal */}
        {editingCourse && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
              <h3 className="font-semibold text-lg mb-1">Edit Students</h3>
              <p className="text-gray-500 text-sm mb-4">{editingCourse.title}</p>
              {editError   && <p className="text-red-500 text-sm mb-2">{editError}</p>}
              {editSuccess && <p className="text-green-600 text-sm mb-2">{editSuccess}</p>}
              <textarea
                className="border p-2 rounded w-full text-sm" rows={4}
                placeholder={"Enter student emails, comma separated\ne.g. alice@uni.edu, bob@uni.edu"}
                value={editEmails}
                onChange={e => setEditEmails(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">New emails will be enrolled. Existing enrollments are kept.</p>
              <div className="flex gap-2 mt-4">
                <button onClick={saveEditStudents} disabled={editingLoading}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 text-sm">
                  {editingLoading ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => { setEditingCourse(null); setEditEmails(''); setEditError(''); setEditSuccess(''); }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Course list or assignment list */}
        {!selectedCourse ? (
          courses.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg mb-2">No courses yet</p>
              <p className="text-sm">Click "+ New Course" to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map(c => (
                <div key={c.id} className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
                  <div className="cursor-pointer" onClick={() => setSelected(c)}>
                    <h3 className="font-bold text-lg mb-1">{c.title}</h3>
                    <p className="text-gray-500 text-sm mb-3">{c.description}</p>
                    <div className="flex gap-4 text-xs text-gray-400">
                      <span>{c.student_count} students</span>
                      <span>{c.assignment_count} assignments</span>
                      <span>{c.submission_count} submissions</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setEditingCourse(c); setEditEmails(''); setEditError(''); setEditSuccess(''); }}
                    className="mt-3 text-xs text-indigo-500 hover:underline">
                    + Edit students
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          <>
            <button onClick={() => { setSelected(null); setAssignments([]); setAnalytics(null); }}
              className="text-indigo-500 hover:underline text-sm mb-4 block">
              ← Back to courses
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {assignments.map(a => (
                <div key={a.id} className="bg-white rounded-xl shadow p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold">{a.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      a.type === 'individual' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {a.type === 'individual' ? 'Individual' : 'Group'}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mb-1">{a.description}</p>
                  <p className="text-xs text-gray-400 mb-3">Due: {new Date(a.due_date).toLocaleDateString()}</p>
                  <button onClick={() => loadAnalytics(a.id)}
                    className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100">
                    View analytics
                  </button>
                </div>
              ))}
            </div>

            {analytics && (
              <div className="bg-white rounded-xl shadow p-5">
                <h3 className="font-semibold mb-4">Analytics — {analytics.assignment?.title}</h3>
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
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Submission rate</span>
                  <span>{analytics.total ? Math.round((analytics.submitted / analytics.total) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-indigo-500 h-3 rounded-full transition-all duration-700"
                    style={{ width: `${analytics.total ? Math.round((analytics.submitted / analytics.total) * 100) : 0}%` }} />
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow p-5 mt-6">
              <h3 className="font-semibold mb-3">All Groups</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b">
                    <th className="pb-2">Group</th><th className="pb-2">Leader</th><th className="pb-2">Members</th>
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