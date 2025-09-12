// ИЗМЕНЕНО: src/App.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- ТИПЫ ДАННЫХ ---
interface User {
  _id: string;
  login: string;
}

interface Status {
  _id: string;
  name: string;
  color: string;
}

interface Column {
  _id: string;
  name: string;
  statusIds: string[];
}

interface Project {
  _id: string;
  name: string;
  members: User[];
  statuses: Status[];
  columns: Column[];
}

interface ChecklistItem {
  _id: string;
  text: string;
  completed: boolean;
}

interface ActivityLog {
  _id: string;
  user: User;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  assignee: User | null;
  status: string; // ID статуса
  priority: number;
  createdAt: string;
  checklist: ChecklistItem[];
  activityLog: ActivityLog[];
}

// --- КОМПОНЕНТЫ ФИЧ ---
// Место для BoardSettings, TaskChecklist и других компонентов...
const BoardSettings = ({ project, token, onSettingsChange, onDirtyChange }: { project: Project, token: string, onSettingsChange: (p: Project) => void, onDirtyChange: (isDirty: boolean) => void }) => {
    // Реализация компонента настроек
    return <div className="card wide"><h2>Настройки доски: {project.name}</h2><p>Здесь будут настройки статусов, колонок и участников.</p></div>;
};

const TaskChecklist = ({ initialChecklist, onChecklistChange }: { initialChecklist: ChecklistItem[], onChecklistChange: (c: ChecklistItem[]) => void }) => {
    // Реализация компонента чеклиста
    const [checklist, setChecklist] = useState(initialChecklist);
    const [newItemText, setNewItemText] = useState("");

    const handleAddItem = () => {
        if (newItemText.trim()) {
            const newItem = { _id: `temp-${Date.now()}`, text: newItemText, completed: false };
            const newChecklist = [...checklist, newItem];
            setChecklist(newChecklist);
            onChecklistChange(newChecklist);
            setNewItemText("");
        }
    };
    
    // ... остальная логика

    return <div><h4>Чек-лист</h4>{/* UI для чеклиста */}</div>;
};


// --- ГЛОБАЛЬНЫЕ СТИЛИ (ОБНОВЛЕНО) ---
const GlobalStyles = () => (
  <style>{`
    :root {
      --bg-gradient: radial-gradient(1200px 800px at 10% -10%, #ecf3ff 0%, transparent 60%),
                      radial-gradient(1000px 700px at 110% 10%, #f6f1ff 0%, transparent 60%),
                      linear-gradient(180deg, #f7f9fb 0%, #eef1f6 100%);
      --surface: rgba(255,255,255,0.75);
      --surface-strong: rgba(255,255,255,0.9);
      --backdrop: blur(10px);

      --primary-color: #3b82f6;
      --primary-hover: #2563eb;
      --danger-color: #ef4444;
      --danger-hover: #dc2626;
      --secondary-color: #6b7280;
      --secondary-hover: #4b5563;

      --text-color: #0f172a;
      --muted-text: #6b7280;

      --border-color: rgba(15,23,42,0.08);
      --border-strong: rgba(15,23,42,0.12);

      --shadow-sm: 0 2px 10px rgba(2, 6, 23, 0.06);
      --shadow: 0 10px 30px rgba(2, 6, 23, 0.08);
      --shadow-lg: 0 20px 60px rgba(2, 6, 23, 0.12);

      --radius-sm: 10px;
      --radius-md: 14px;
      --radius-lg: 18px;

      --font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji";
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: var(--font-family);
      color: var(--text-color);
      background: var(--bg-gradient);
    }

    .app-container { display: flex; flex-direction: column; height: 100vh; }

    .main-view-wrapper {
      display: flex; flex-grow: 1; overflow: hidden; gap: 20px; padding: 20px;
    }

    .main-content { flex-grow: 1; overflow-y: auto; display: flex; justify-content: center; align-items: flex-start; }
    .main-content-login { display: flex; flex-grow: 1; justify-content: center; align-items: center; padding: 32px; }

    .main-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 18px; margin: 12px;
      position: sticky; top: 0; z-index: 100; flex-shrink: 0;
      background: var(--surface-strong);
      backdrop-filter: var(--backdrop);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }
    .header-left, .header-right { display: flex; gap: 10px; flex: 1; }
    .header-center { flex: 1; text-align: center; }
    .header-right { justify-content: flex-end; }
    .project-title { margin: 0; font-size: 20px; font-weight: 600; color: var(--text-color); }

    .sidebar {
      width: 260px; flex-shrink: 0; display: flex; flex-direction: column;
      background: var(--surface); backdrop-filter: var(--backdrop);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      padding: 10px; height: calc(100vh - 120px); margin: 12px 0 12px 12px;
    }
    .sidebar-header { padding: 12px 14px; font-size: 14px; font-weight: 700; color: var(--muted-text); letter-spacing: .04em; text-transform: uppercase; }
    .sidebar-list { list-style: none; padding: 6px; margin: 0; overflow-y: auto; border-top: 1px dashed var(--border-color); }
    .sidebar-item {
      display: block; padding: 10px 12px; cursor: pointer; border-radius: 10px;
      transition: background-color .2s, transform .06s, color .2s;
      color: var(--text-color);
    }
    .sidebar-item:hover { background-color: rgba(59,130,246,0.08); }
    .sidebar-item:active { transform: scale(0.99); }
    .sidebar-item-active {
      background: linear-gradient(180deg, rgba(59,130,246,0.14), rgba(59,130,246,0.10));
      border: 1px solid rgba(59,130,246,0.22);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
      color: var(--primary-color); font-weight: 700;
    }

    .card {
      padding: 36px; border-radius: var(--radius-lg);
      background: var(--surface-strong); backdrop-filter: var(--backdrop);
      box-shadow: var(--shadow);
      width: 100%; max-width: 720px; text-align: left;
      border: 1px solid var(--border-color);
    }
    .card.wide { max-width: 1200px; }

    .input, .textarea, .select {
      width: 100%; padding: 12px 14px; border: 1px solid var(--border-color);
      border-radius: 12px; margin-bottom: 14px; font-size: 15px;
      background: #fff; color: var(--text-color);
      transition: border-color .2s, box-shadow .2s, background .2s;
      box-shadow: 0 1px 0 rgba(2,6,23,0.03);
    }
    .input:focus, .textarea:focus, .select:focus {
      border-color: rgba(59,130,246,0.6);
      box-shadow: 0 0 0 4px rgba(59,130,246,0.15);
      outline: none; background: #fff;
    }
    .textarea { min-height: 120px; resize: vertical; border-radius: 14px; }

    .btn {
      padding: 11px 14px; border: 1px solid transparent; border-radius: 12px;
      font-size: 14px; font-weight: 600; cursor: pointer;
      transition: background-color .2s, transform .06s, border-color .2s, box-shadow .2s, color .2s;
      box-shadow: 0 1px 0 rgba(2,6,23,0.04);
    }
    .btn:active { transform: translateY(1px); }
    .btn-primary { background: linear-gradient(180deg, #3b82f6, #2563eb); color: white; border-color: rgba(37,99,235,0.5); }
    .btn-primary:hover { background: linear-gradient(180deg, #4f8ef8, #2c6ef0); }
    .btn-secondary { background: #111827; color: #fff; border-color: #0b1220; }
    .btn-secondary:hover { background: #0f172a; }
    .btn-light { background: #ffffff; color: #0f172a; border-color: var(--border-strong); }
    .btn-light:hover { background: #f8fafc; }
    .btn-danger { background: linear-gradient(180deg, #ef4444, #dc2626); color: white; border-color: rgba(220,38,38,0.5); }
    .btn-danger:hover { background: linear-gradient(180deg, #f25555, #e03434); }
    .btn-full { width: 100%; margin-bottom: 10px; }
    .btn-small { padding: 9px 12px; font-size: 13px; }
    .btn-icon { background: transparent; border: 1px solid transparent; cursor: pointer; padding: 8px; color: var(--secondary-color); border-radius: 10px; }
    .btn-icon:hover { color: var(--primary-color); background: rgba(59,130,246,0.08); }

    .error-message { color: var(--danger-color); margin-bottom: 12px; font-weight: 600; }

    .form-row { display: flex; gap: 10px; align-items: center; }
    .form-row .input { margin-bottom: 0; flex-grow: 1; }

    .project-list { list-style: none; padding: 0; text-align: left; margin-top: 20px; }
    .project-item {
      display: flex; justify-content: space-between; align-items: center;
      background: #fff; padding: 14px; border-radius: 12px; margin-bottom: 10px;
      border: 1px solid var(--border-color); cursor: pointer;
      transition: background-color .2s, transform .06s, border-color .2s, box-shadow .2s;
      box-shadow: var(--shadow-sm);
    }
    .project-item:hover { background-color: #f8fafc; transform: translateY(-1px); border-color: var(--border-strong); }

    .modal-overlay {
      position: fixed; inset: 0; background: rgba(2,6,23,0.35);
      display: flex; justify-content: center; align-items: center; z-index: 1000;
      animation: fadeIn .2s; backdrop-filter: blur(6px);
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal-content {
      background: var(--surface-strong); padding: 26px; border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg); width: 92%; max-width: 720px;
      border: 1px solid var(--border-color); animation: slideIn .2s;
      backdrop-filter: var(--backdrop);
    }
    @keyframes slideIn { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .modal-actions { margin-top: 18px; display: flex; justify-content: center; gap: 12px; }

    .kanban-container { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .kanban-board {
      display: flex; gap: 16px; width: 100%; max-width: 100%; padding: 4px 4px 10px;
      overflow-x: auto; align-items: flex-start;
    }
    .kanban-column {
      flex-shrink: 0; width: 300px;
      background: rgba(255,255,255,0.7); padding: 14px; border-radius: var(--radius-md);
      display: flex; flex-direction: column; border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
    }
    .kanban-column-title {
      border-bottom: 1px dashed var(--border-color); padding-bottom: 10px; margin: 0 0 12px 0;
      display: flex; justify-content: space-between; align-items: center; font-weight: 700;
    }
    .task-card {
      background: #fff; padding: 14px; border-radius: 12px; margin-bottom: 10px;
      box-shadow: var(--shadow-sm); cursor: pointer;
      transition: box-shadow .2s, transform .06s, border-color .2s, background .2s;
      border: 1px solid var(--border-color);
    }
    .task-card:hover { box-shadow: var(--shadow); transform: translateY(-1px); background: #fefefe; }
    .task-title { font-weight: 700; margin-bottom: 8px; }
    .task-meta { color: var(--muted-text); font-size: 12px; margin-top: 8px; display: flex; justify-content: space-between; align-items: center; }

    .tabs { display: flex; border-bottom: 1px solid var(--border-color); margin-bottom: 16px; gap: 6px; }
    .tab {
      padding: 10px 14px; cursor: pointer; border: 1px solid transparent;
      background: transparent; border-bottom: 2px solid transparent; border-radius: 10px 10px 0 0; color: var(--muted-text);
      transition: color .2s, border-color .2s, background .2s;
    }
    .tab:hover { color: var(--text-color); background: rgba(2,6,23,0.03); }
    .tab-active {
      border-color: var(--border-strong); border-bottom-color: var(--primary-color);
      color: var(--text-color); font-weight: 700; background: #fff;
    }

    .activity-log { list-style: none; padding: 0; max-height: 320px; overflow-y: auto; margin: 0; }
    .log-item { padding: 8px 0; border-bottom: 1px dashed var(--border-color); }
  `}</style>
);


// --- КОМПОНЕНТЫ ИКОНОК ---
function PriorityIcon({ priority }: { priority: number }) { const colors: { [key: number]: string } = { 1: '#6c757d', 2: '#6c757d', 3: '#0dcaf0', 4: '#0dcaf0', 5: '#0d6efd', 6: '#0d6efd', 7: '#ffc107', 8: '#ffc107', 9: '#dc3545', 10: '#dc3545' }; const color = colors[priority] || '#6c757d'; return (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={color} stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>); }
function TrashIcon() { return (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>); }

// --- МОДАЛЬНЫЕ КОМПОНЕНТЫ ---
function ConfirmationModal({ isOpen, onClose, onConfirm, message }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, message: string }) { if (!isOpen) return null; return (<div className="modal-overlay" onClick={onClose}><div className="modal-content" onClick={(e) => e.stopPropagation()}><p style={{ fontSize: '18px', marginBottom: '25px', textAlign: 'center' }}>{message}</p><div className="modal-actions"><button onClick={onConfirm} className="btn btn-danger">Да</button><button onClick={onClose} className="btn btn-secondary">Нет</button></div></div></div>); }
function CreateTaskModal({ isOpen, onClose, onSubmit, projectId, token, members, statuses }: { isOpen: boolean, onClose: () => void, onSubmit: (newTask: Task) => void, projectId: string, token: string, members: User[], statuses: Status[] }) { const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [assigneeId, setAssigneeId] = useState(''); const [statusId, setStatusId] = useState(statuses[0]?._id || ''); const [priority, setPriority] = useState(5); const [error, setError] = useState(''); useEffect(() => { if (isOpen) { setTitle(''); setDescription(''); setAssigneeId(''); setStatusId(statuses[0]?._id || ''); setPriority(5); setError(''); } }, [isOpen, statuses]); if (!isOpen) return null; const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setError(''); if (!title.trim()) { setError('Название задачи обязательно.'); return; } try { const response = await axios.post<Task>(`/api/projects/${projectId}/tasks`, { title, description, assignee: assigneeId || undefined, status: statusId, priority }, { headers: { Authorization: `Bearer ${token}` } }); onSubmit(response.data); onClose(); } catch (err) { setError('Не удалось создать задачу.'); } }; return (<div className="modal-overlay"><div className="modal-content"><h2 style={{textAlign: 'center'}}>Создать новую задачу</h2>{error && <p className="error-message">{error}</p>}<form onSubmit={handleSubmit}><input type="text" placeholder="Название задачи" value={title} onChange={e => setTitle(e.target.value)} className="input" /><textarea placeholder="Описание" value={description} onChange={e => setDescription(e.target.value)} className="textarea" /><select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="select"><option value="">Не назначен</option>{members.map(member => <option key={member._id} value={member._id}>{member.login}</option>)}</select><select value={statusId} onChange={e => setStatusId(e.target.value)} className="select">{statuses.map(status => <option key={status._id} value={status._id}>{status.name}</option>)}</select><label>Приоритет: {priority}</label><input type="range" min="1" max="10" value={priority} onChange={e => setPriority(parseInt(e.target.value))} style={{ width: '100%', marginBottom: '16px' }} /><div className="modal-actions"><button type="submit" className="btn btn-primary">Сохранить</button><button type="button" onClick={onClose} className="btn btn-light">Отмена</button></div></form></div></div>); }
function TaskDetailModal({ task, members, statuses, onClose, onUpdate, onDelete, token }: { task: Task | null, members: User[], statuses: Status[], onClose: () => void, onUpdate: (updatedTask: Task) => void, onDelete: (taskId: string) => void, token: string }) {
    const [editableTask, setEditableTask] = useState<Task | null>(task);
    const [activeTab, setActiveTab] = useState('details');
    const [isConfirmOpen, setConfirmOpen] = useState(false);

    useEffect(() => { setEditableTask(task); setActiveTab('details'); }, [task]);

    if (!task || !editableTask) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditableTask(prev => {
            if (!prev) return null;
            const newAssignee = name === 'assignee' ? members.find(m => m._id === value) : prev.assignee;
            return { ...prev, [name]: name === 'assignee' ? newAssignee : name === 'priority' ? parseInt(value) : value };
        });
    };

    const handleChecklistUpdate = (newChecklist: ChecklistItem[]) => {
        setEditableTask(prev => {
            if (!prev) return null;
            return { ...prev, checklist: newChecklist };
        });
    };

    const handleSave = async () => {
        if (!editableTask) return;
        try {
            const response = await axios.patch<Task>(`/api/tasks/${editableTask._id}`, {
                title: editableTask.title,
                description: editableTask.description,
                assignee: editableTask.assignee?._id || null,
                status: editableTask.status,
                priority: editableTask.priority,
                checklist: editableTask.checklist
            }, { headers: { Authorization: `Bearer ${token}` } });
            onUpdate(response.data);
            onClose();
        } catch (error) { console.error("Failed to update task", error); error instanceof Error && alert(error.message); }
    };

    const handleDelete = async () => { try { await axios.delete(`/api/tasks/${task._id}`, { headers: { Authorization: `Bearer ${token}` } }); onDelete(task._id); onClose(); } catch (err) { alert("Не удалось удалить задачу"); } };

    return (<><div className="modal-overlay"><div className="modal-content" style={{maxWidth: '800px'}}><div className="tabs"><button className={`tab ${activeTab === 'details' ? 'tab-active' : ''}`} onClick={() => setActiveTab('details')}>Детали</button><button className={`tab ${activeTab === 'history' ? 'tab-active' : ''}`} onClick={() => setActiveTab('history')}>История</button></div>{activeTab === 'details' ? (<div><input type="text" name="title" value={editableTask.title} onChange={handleChange} className="input" style={{ fontSize: '24px', fontWeight: 'bold', border: 'none', paddingLeft: 0 }} /><textarea name="description" value={editableTask.description} onChange={handleChange} className="textarea" />

        <TaskChecklist initialChecklist={editableTask.checklist || []} onChecklistChange={handleChecklistUpdate} />

        <label style={{ marginTop: '20px', display: 'block' }}>Ответственный</label><select name="assignee" value={editableTask.assignee?._id || ''} onChange={handleChange} className="select"><option value="">Не назначен</option>{members.map(member => <option key={member._id} value={member._id}>{member.login}</option>)}</select><label>Статус</label><select name="status" value={editableTask.status} onChange={handleChange} className="select">{statuses.map(status => <option key={status._id} value={status._id}>{status.name}</option>)}</select><label>Приоритет: {editableTask.priority}</label><input type="range" name="priority" min="1" max="10" value={editableTask.priority} onChange={handleChange} style={{ width: '100%', marginBottom: '16px' }} /><p className="task-meta">Создана: {new Date(task.createdAt).toLocaleString('ru-RU')}</p></div>) : (<div><h3>История изменений</h3><ul className="activity-log">{editableTask.activityLog.slice().reverse().map((log, index) => (<li key={index} className="log-item"><small>{new Date(log.timestamp).toLocaleString('ru-RU')}</small><br /><strong>{log.user.login}</strong> {log.action === 'created' ? `создал(а) задачу "${log.newValue}"` : `изменил(а) поле "${log.field}" с "${log.oldValue}" на "${log.newValue}"`}</li>))}</ul></div>)}<div className="modal-actions" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}><button onClick={() => setConfirmOpen(true)} className="btn btn-icon" style={{color: 'var(--danger-color)'}}><TrashIcon/></button><div style={{flexGrow: 1}}></div><button onClick={onClose} className="btn btn-light">Закрыть</button><button onClick={handleSave} className="btn btn-primary">Сохранить</button></div></div></div><ConfirmationModal isOpen={isConfirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} message="Вы уверены, что хотите удалить эту задачу?" /></>);
}

// --- СТРАНИЦЫ / ФИЧИ ---

function LoginPage({ onLogin, onRequireSetPassword }: { onLogin: (token: string) => void; onRequireSetPassword: (tempToken: string) => void; }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (isRegistering) {
            if (password !== confirmPassword) {
                setError('Пароли не совпадают.');
                return;
            }
            try {
                const response = await axios.post<{ token: string }>('/api/auth/register', { login, password });
                onLogin(response.data.token);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Ошибка регистрации.');
            }
            return;
        }

        try {
            const response = await axios.post<{ token: string } | { setPasswordRequired: boolean; tempToken: string }>('/api/auth/login', { login, password });
            if ('token' in response.data) {
                onLogin(response.data.token);
            } else if (response.data.setPasswordRequired) {
                onRequireSetPassword(response.data.tempToken);
            }
        } catch (err: any) {
            setError('Неверный логин или пароль');
        }
    };

    return (
        <div className="card" style={{maxWidth: '420px', textAlign: 'center'}}>
            <h1 style={{fontSize: '28px', fontWeight: 700}}>{isRegistering ? 'Регистрация' : 'Вход в Task Manager'}</h1>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
                <input type="text" value={login} onChange={e => setLogin(e.target.value)} placeholder="Логин" className="input" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Пароль" className="input" />
                {isRegistering && (
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Подтвердите пароль" className="input" />
                )}
                <button type="submit" className="btn btn-primary btn-full">
                    {isRegistering ? 'Зарегистрироваться' : 'Войти'}
                </button>
            </form>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                    onClick={() => {
                        setIsRegistering(!isRegistering);
                        setError('');
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', padding: '8px', fontSize: '14px' }}
                >
                    {isRegistering ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
                </button>
            </div>
        </div>
    );
}


function SetPasswordPage({ onPasswordSet, tempToken }: { onPasswordSet: (token: string) => void, tempToken: string }) { const [password, setPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState(''); const [error, setError] = useState(''); const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setError(''); if (password.length < 6) { setError('Пароль должен быть не менее 6 символов.'); return; } if (password !== confirmPassword) { setError('Пароли не совпадают.'); return; } try { const response = await axios.post<{ token: string }>('/api/auth/set-password', { password }, { headers: { Authorization: `Bearer ${tempToken}` } }); alert('Пароль успешно установлен!'); onPasswordSet(response.data.token); } catch (err: any) { setError(err.response?.data?.message || 'Не удалось установить пароль.'); } }; return (<div className="card" style={{maxWidth: '420px', textAlign: 'center'}}><h1 style={{fontSize: '28px', fontWeight: 700}}>Установите ваш пароль</h1><p style={{ color: 'var(--muted-text)', marginBottom: '24px' }}>Чтобы продолжить, создайте пароль для вашего аккаунта.</p>{error && <p className="error-message">{error}</p>}<form onSubmit={handleSubmit}><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Новый пароль" className="input" /><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Подтвердите пароль" className="input" /><button type="submit" className="btn btn-primary btn-full">Сохранить и войти</button></form></div>); }
function Dashboard({ projects, token, onSelectProject, onProjectUpdate }: { projects: Project[], token: string, onSelectProject: (project: Project) => void, onProjectUpdate: (projects: Project[]) => void }) { const [newProjectName, setNewProjectName] = useState(''); const [error, setError] = useState(''); const [modalInfo, setModalInfo] = useState<{ isOpen: boolean; projectToDelete: Project | null }>({ isOpen: false, projectToDelete: null }); const handleCreateProject = async (e: React.FormEvent) => { e.preventDefault(); setError(''); if (!newProjectName.trim()) return; if (projects.some(p => p.name.toLowerCase() === newProjectName.trim().toLowerCase())) { setError('Проект с таким названием уже существует.'); return; } try { const response = await axios.post<Project>('/api/projects', { name: newProjectName }, { headers: { Authorization: `Bearer ${token}` } }); onProjectUpdate([...projects, response.data]); setNewProjectName(''); } catch (err) { setError('Не удалось создать проект'); } }; const openDeleteModal = (project: Project) => setModalInfo({ isOpen: true, projectToDelete: project }); const closeDeleteModal = () => setModalInfo({ isOpen: false, projectToDelete: null }); const handleDeleteProject = async () => { if (!modalInfo.projectToDelete) return; try { await axios.delete(`/api/projects/${modalInfo.projectToDelete._id}`, { headers: { Authorization: `Bearer ${token}` } }); onProjectUpdate(projects.filter(p => p._id !== modalInfo.projectToDelete?._id)); closeDeleteModal(); } catch (err) { setError('Не удалось удалить проект'); } }; return (<div className="card"><h1 style={{fontSize: '28px', fontWeight: 700}}>Ваши проекты</h1>{error && <p className="error-message">{error}</p>}<form onSubmit={handleCreateProject} className="form-row"><input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="Название нового проекта" className="input" /><button type="submit" className="btn btn-primary">Создать</button></form><ul className="project-list">{projects.map((project) => (<li key={project._id} className="project-item" onClick={() => onSelectProject(project)}><span>{project.name}</span><button onClick={(e) => { e.stopPropagation(); openDeleteModal(project); }} className="btn-icon" style={{ color: 'var(--danger-color)' }}><TrashIcon /></button></li>))}</ul><ConfirmationModal isOpen={modalInfo.isOpen} onClose={closeDeleteModal} onConfirm={handleDeleteProject} message={`Вы уверены, что хотите удалить проект "${modalInfo.projectToDelete?.name}"?`} /></div>); }
function KanbanBoard({ project, token, tasks, members, setTasks }: { project: Project, token: string, tasks: Task[], members: User[], setTasks: React.Dispatch<React.SetStateAction<Task[]>> }) { const [selectedTask, setSelectedTask] = useState<Task | null>(null); const handleTaskUpdated = (updatedTask: Task) => { setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t)); }; const handleTaskDeleted = (taskId: string) => { setTasks(prev => prev.filter(t => t._id !== taskId)); }; return (<div className="kanban-container"><div className="kanban-board">{project.columns.map(column => (<div key={column._id} className="kanban-column"><h3 className="kanban-column-title"><span>{column.name}</span></h3>{tasks.filter(task => column.statusIds.includes(task.status)).map(task => (<div key={task._id} className="task-card" onClick={() => setSelectedTask(task)}><div className="task-title">{task.title}</div><div className="task-meta"><span>{task.assignee?.login || 'Нет'}</span><PriorityIcon priority={task.priority} /></div></div>))}</div>))}</div><TaskDetailModal task={selectedTask} members={members} statuses={project.statuses} onClose={() => setSelectedTask(null)} onUpdate={handleTaskUpdated} onDelete={handleTaskDeleted} token={token} /></div>); }
function Sidebar({ projects, selectedProject, onSelectProject }: { projects: Project[], selectedProject: Project | null, onSelectProject: (project: Project) => void }) { return (<aside className="sidebar"><div className="sidebar-header">Проекты</div><ul className="sidebar-list">{projects.map(project => (<li key={project._id} className={`sidebar-item ${project._id === selectedProject?._id ? 'sidebar-item-active' : ''}`} onClick={() => onSelectProject(project)} >{project.name}</li>))}</ul></aside>); }

// --- ГЛАВНЫЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ ---
export default function App() {
    const [token, setToken] = useState<string | null>(null);
    const [tempToken, setTempToken] = useState<string | null>(null);
    const [view, setView] = useState<'dashboard' | 'board' | 'settings' | 'setPassword'>('dashboard');
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isSettingsDirty, setSettingsDirty] = useState(false);
    const [isConfirmNavOpen, setConfirmNavOpen] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [members, setMembers] = useState<User[]>([]);
    const [boardLoading, setBoardLoading] = useState(false);

    useEffect(() => {
        const authToken = localStorage.getItem('authToken');
        setToken(authToken);
        axios.defaults.baseURL = 'http://localhost:3000'; // Установите ваш URL API
        if (authToken) {
            setLoading(true);
            axios.get<Project[]>('/api/projects', { headers: { Authorization: `Bearer ${authToken}` } })
                .then(response => {
                    setProjects(response.data);
                    if (response.data.length > 0 && !selectedProject) {
                         // Не выбираем проект по умолчанию, остаемся на дашборде
                    }
                })
                .catch(() => handleLogout())
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (selectedProject && token && view === 'board') {
            const fetchData = async () => {
                try {
                    setBoardLoading(true);
                    const [tasksRes, membersRes] = await Promise.all([
                        axios.get<Task[]>(`/api/projects/${selectedProject._id}/tasks`, { headers: { Authorization: `Bearer ${token}` } }),
                        axios.get<User[]>(`/api/projects/${selectedProject._id}/members`, { headers: { Authorization: `Bearer ${token}` } })
                    ]);
                    setTasks(tasksRes.data);
                    setMembers(membersRes.data);
                } catch (err) {
                    console.error('Не удалось загрузить данные проекта.');
                } finally {
                    setBoardLoading(false);
                }
            };
            fetchData();
        }
    }, [selectedProject, token, view]);

    const handleLogin = (newToken: string) => { localStorage.setItem('authToken', newToken); setToken(newToken); setView('dashboard'); setSelectedProject(null); };
    const handleRequireSetPassword = (temp: string) => { setTempToken(temp); setView('setPassword'); };
    const handleLogout = () => { localStorage.removeItem('authToken'); setToken(null); setTempToken(null); setSelectedProject(null); setProjects([]); setView('dashboard'); };

    const handleSelectProject = (project: Project) => {
        const navigate = () => { setSelectedProject(project); setView('board'); setSettingsDirty(false); };
        if (isSettingsDirty) { setPendingNavigation(() => navigate); setConfirmNavOpen(true); } else { navigate(); }
    };

    const handleGoToDashboard = () => {
        const navigate = () => { setSelectedProject(null); setView('dashboard'); setSettingsDirty(false); };
        if (isSettingsDirty) { setPendingNavigation(() => navigate); setConfirmNavOpen(true); } else { navigate(); }
    };

    const handleGoToSettings = () => setView('settings');
    const handleSettingsChange = (updatedProject: Project) => { setSelectedProject(updatedProject); setProjects(prev => prev.map(p => p._id === updatedProject._id ? updatedProject : p)); setSettingsDirty(false); };
    const handleProjectUpdate = (updatedProjects: Project[]) => { setProjects(updatedProjects); };
    const handleTaskCreated = (newTask: Task) => { setTasks(prevTasks => [...prevTasks, newTask]); };

    const confirmAndNavigate = () => { if (pendingNavigation) { pendingNavigation(); } setConfirmNavOpen(false); setPendingNavigation(null); };

    const renderContent = () => {
        if (loading) return <div className="card" style={{textAlign: 'center'}}><p>Загрузка...</p></div>;
        if (view === 'setPassword' && tempToken) return <SetPasswordPage onPasswordSet={handleLogin} tempToken={tempToken} />;
        if (!token) return <LoginPage onLogin={handleLogin} onRequireSetPassword={handleRequireSetPassword} />;
        
        if (!selectedProject || view === 'dashboard') return <Dashboard projects={projects} token={token} onSelectProject={handleSelectProject} onProjectUpdate={handleProjectUpdate} />;

        switch (view) {
            case 'board': return boardLoading ? <p>Загрузка доски...</p> : <KanbanBoard project={selectedProject} token={token} tasks={tasks} members={members} setTasks={setTasks} />;
            case 'settings': return <BoardSettings project={selectedProject} token={token} onSettingsChange={handleSettingsChange} onDirtyChange={setSettingsDirty} />;
            default: return <div>Неизвестное состояние</div>;
        }
    };

    const showSidebar = token && selectedProject;

    if (!token || view === 'setPassword') { 
        return (
            <div className="app-container">
                <GlobalStyles />
                <main className="main-content-login">{renderContent()}</main>
            </div>
        );
    }

    return (
        <div className="app-container">
            <GlobalStyles />
            {selectedProject && (
              <header className="main-header">
                  <div className="header-left">
                      <button onClick={handleGoToDashboard} className="btn btn-light btn-small"> Мои проекты </button>
                      {view === 'board' && <button onClick={handleGoToSettings} className="btn btn-light btn-small">Настройки</button>}
                      {view === 'settings' && (<button onClick={() => setView('board')} className="btn btn-light btn-small"> ← К доске </button>)}
                  </div>
                  <div className="header-center">
                     <h1 className="project-title">{selectedProject.name}</h1>
                  </div>
                  <div className="header-right"> 
                    {view === 'board' && (<button onClick={() => setCreateModalOpen(true)} className="btn btn-primary">Создать задачу</button>)}
                    <button onClick={handleLogout} className="btn btn-secondary btn-small">Выйти</button> 
                  </div>
              </header>
            )}
            
            <div className="main-view-wrapper" style={!showSidebar ? {padding: '20px'} : {}}>
                {showSidebar && <Sidebar projects={projects} selectedProject={selectedProject} onSelectProject={handleSelectProject} />}
                <main className="main-content"> {renderContent()} </main>
            </div>

            <ConfirmationModal isOpen={isConfirmNavOpen} onClose={() => { setConfirmNavOpen(false); setPendingNavigation(null); }} onConfirm={confirmAndNavigate} message="У вас есть несохраненные изменения. Вы уверены, что хотите уйти?" />
            {selectedProject && token && <CreateTaskModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onSubmit={handleTaskCreated} projectId={selectedProject._id} token={token} members={members} statuses={selectedProject.statuses} />}
        </div>
    );
}
