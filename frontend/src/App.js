import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import TaskColumn from './components/TaskColumn';
import TaskModal from './components/TaskModal';

const API_URL = process.env.REACT_APP_API_URL || '/api';
const STATUSES = ['todo', 'in-progress', 'done'];

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/tasks`);
      if (!res.ok) throw new Error('Failed to load tasks');
      setTasks(await res.json());
      setError(null);
    } catch (err) {
      setError('Could not connect to the backend. Is it running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const createTask = async (data) => {
    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const task = await res.json();
    setTasks((prev) => [...prev, task]);
  };

  const updateTask = async (id, updates) => {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const updated = await res.json();
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const deleteTask = async (id) => {
    await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleStatusChange = (id, newStatus) => {
    const task = tasks.find((t) => t.id === id);
    if (task) updateTask(id, { ...task, status: newStatus });
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openModal = (task = null) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleSave = async (data) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await createTask(data);
    }
    setModalOpen(false);
    setEditingTask(null);
  };

  // ── Derived state ──────────────────────────────────────────────────────────
  const visibleTasks = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  const counts = {
    todo: tasks.filter((t) => t.status === 'todo').length,
    'in-progress': tasks.filter((t) => t.status === 'in-progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  return (
    <div className="app">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="header">
        <div className="header-content">
          <h1 className="logo">TaskBloom 🌼</h1>
          <p className="tagline">Bloom through your tasks, one petal at a time</p>
        </div>
        <button className="btn-add" onClick={() => openModal()}>
          + Add Task
        </button>
      </header>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <div className="stats-bar">
        <div className="stat-card stat-todo">
          <span className="stat-count">{counts.todo}</span>
          <span className="stat-label">📋 To Do</span>
        </div>
        <div className="stat-card stat-inprogress">
          <span className="stat-count">{counts['in-progress']}</span>
          <span className="stat-label">🚀 In Progress</span>
        </div>
        <div className="stat-card stat-done">
          <span className="stat-count">{counts.done}</span>
          <span className="stat-label">✅ Done</span>
        </div>
        <div className="stat-card stat-total">
          <span className="stat-count">{tasks.length}</span>
          <span className="stat-label">🌼 Total</span>
        </div>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <div className="filter-bar">
        {[
          { key: 'all', label: 'All Tasks' },
          { key: 'todo', label: '📋 To Do' },
          { key: 'in-progress', label: '🚀 In Progress' },
          { key: 'done', label: '✅ Done' },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`filter-btn ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Board ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="loading">
          <div className="spinner" />
          <p>Loading tasks...</p>
        </div>
      ) : error ? (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={fetchTasks}>Retry</button>
        </div>
      ) : (
        <div className="board">
          {STATUSES.map((status) => (
            <TaskColumn
              key={status}
              status={status}
              tasks={visibleTasks.filter((t) => t.status === status)}
              onEdit={openModal}
              onDelete={deleteTask}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <TaskModal
          task={editingTask}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingTask(null); }}
        />
      )}
    </div>
  );
}

export default App;
