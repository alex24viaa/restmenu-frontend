// ИЗМЕНЕНО: src/App.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BoardSettings from './features/Settings/BoardSettings';
import TaskChecklist from './features/Tasks/TaskChecklist';
// ИЗМЕНЕНО: Убран неиспользуемый 'Column' для успешной сборки
import type { Project, Status, User, Task, ChecklistItem } from './types';

// --- ГЛОБАЛЬНЫЕ СТИЛИ (без изменений) ---
const GlobalStyles = () => (
    <style>{`
        :root {
            --primary-color: #007bff;
            --primary-hover: #0056b3;
            --danger-color: #dc3545;
            --danger-hover: #c82333;
            --secondary-color: #6c757d;
            --secondary-hover: #5a6268;
            --light-bg: #f8f9fa;
            --border-color: #dee2e6;
            --shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            --border-radius: 8px;
            --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        body { margin: 0; font-family: var(--font-family); background-color: #f0f2f5; }
        .app-container { display: flex; flex-direction: column; height: 100vh; }
        .main-view-wrapper { display: flex; flex-grow: 1; overflow: hidden; }
        .sidebar { width: 240px; background-color: var(--light-bg); border-right: 1px solid var(--border-color); flex-shrink: 0; display: flex; flex-direction: column; }
        .sidebar-header { padding: 1rem 1.25rem; font-size: 1.1rem; font-weight: 600; border-bottom: 1px solid var(--border-color); }
        .sidebar-list { list-style: none; padding: 0; margin: 0; overflow-y: auto; }
        .sidebar-item { display: block; padding: 0.9rem 1.25rem; cursor: pointer; border-bottom: 1px solid #e9ecef; transition: background-color 0.2s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sidebar-item:hover { background-color: #e2e6ea; }
        .sidebar-item-active { background-color: #ddebfd; font-weight: 600; color: var(--primary-color); border-right: 3px solid var(--primary-color); }
        .main-content { flex-grow: 1; padding: 20px; overflow-y: auto; display: flex; justify-content: center; align-items: flex-start; }
        .main-content-login { display: flex; flex-grow: 1; justify-content: center; align-items: center; padding: 20px; }
        .main-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 25px; background-color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.05); position: sticky; top: 0; z-index: 100; flex-shrink: 0; }
        .header-left, .header-right { display: flex; gap: 10px; flex: 1; }
        .header-center { flex: 1; text-align: center; }
        .header-right { justify-content: flex-end; }
        .project-title { margin: 0; font-size: 22px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .card { padding: 40px; border-radius: var(--border-radius); background-color: white; box-shadow: var(--shadow); width: 100%; max-width: 600px; text-align: center; box-sizing: border-box; }
        .card.wide { max-width: 1200px; text-align: left; }
        .input, .textarea, .select { width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 4px; margin-bottom: 16px; font-size: 16px; box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s; }
        .input:focus, .textarea:focus, .select:focus { border-color: var(--primary-color); box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25); outline: none; }
        .textarea { min-height: 100px; resize: vertical; }
        .btn { padding: 12px; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; transition: background-color 0.2s, transform 0.1s; }
        .btn:active { transform: scale(0.98); }
        .btn-primary { background-color: var(--primary-color); color: white; }
        .btn-primary:hover { background-color: var(--primary-hover); }
        .btn-secondary { background-color: var(--secondary-color); color: white; }
        .btn-secondary:hover { background-color: var(--secondary-hover); }
        .btn-danger { background-color: var(--danger-color); color: white; }
        .btn-danger:hover { background-color: var(--danger-hover); }
        .btn-light { background-color: var(--light-bg); color: #333; border: 1px solid var(--border-color); }
        .btn-full { width: 100%; margin-bottom: 10px; }
        .btn-small { padding: 10px 20px; font-size: 14px; }
        .btn-icon { background: none; border: none; cursor: pointer; padding: 5px; color: var(--secondary-color); transition: color 0.2s; }
        .btn-icon:hover { color: var(--primary-color); }
        .error-message { color: var(--danger-color); margin-bottom: 16px; }
        .form-row { display: flex; gap: 10px; align-items: center; }
        .form-row .input { margin-bottom: 0; flex-grow: 1; }
        .project-list { list-style: none; padding: 0; text-align: left; margin-top: 30px; }
        .project-item { display: flex; justify-content: space-between; align-items: center; background-color: var(--light-bg); padding: 15px; border-radius: 4px; margin-bottom: 10px; border: 1px solid var(--border-color); cursor: pointer; transition: background-color 0.2s, transform 0.2s; }
        .project-item:hover { background-color: #e9ecef; transform: translateY(-2px); }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; animation: fadeIn 0.3s; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal-content { background-color: white; padding: 30px; border-radius: var(--border-radius); box-shadow: 0 5px 15px rgba(0,0,0,0.3); width: 90%; max-width: 600px; animation: slideIn 0.3s; }
        @keyframes slideIn { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modal-actions { margin-top: 20px; display: flex; justify-content: center; gap: 15px; }
        .kanban-container { width: 100%; display: flex; flex-direction: column; align-items: center; }
        .kanban-board { display: flex; gap: 20px; width: 100%; max-width: 100%; padding: 10px; overflow-x: auto; align-items: flex-start; }
        .kanban-column { flex-shrink: 0; width: 280px; background-color: #e9ecef; padding: 15px; border-radius: var(--border-radius); display: flex; flex-direction: column; }
        .kanban-column-title { border-bottom: 2px solid #ced4da; padding-bottom: 10px; margin: 0 0 15px 0; display: flex; justify-content: space-between; align-items: center;}
        .task-card { background-color: white; padding: 15px; border-radius: 4px; margin-bottom: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); cursor: pointer; transition: box-shadow 0.2s, transform 0.2s; border-left: 4px solid transparent; }
        .task-card:hover { box-shadow: 0 4px 8px rgba(0,0,0,0.1); transform: translateY(-2px); }
        .task-title { font-weight: 600; margin-bottom: 10px; }
        .task-meta { color: #888; font-size: 12px; margin-top: 10px; display: flex; justify-content: space-between; align-items: center; }
        .tabs { display: flex; border-bottom: 1px solid var(--border-color); margin-bottom: 20px; }
        .tab { padding: 10px 20px; cursor: pointer; border: none; background-color: transparent; border-bottom: 3px solid transparent; }
        .tab-active { border-bottom: 3px solid var(--primary-color); font-weight: bold; }
        .activity-log { list-style: none; padding: 0; max-height: 300px; overflow-y: auto; }
        .log-item { padding: 8px 0; border-bottom: 1px solid #eee; }
    `}</style>
);

// --- КОМПОНЕНТЫ ИКОНОК ---
function PriorityIcon({ priority }: { priority: number }) { const colors: { [key: number]: string } = { 1: '#6c757d', 2: '#6c757d', 3: '#0dcaf0', 4: '#0dcaf0', 5: '#0d6efd', 6: '#0d6efd', 7: '#ffc107', 8: '#ffc107', 9: '#dc3545', 10: '#dc3545' }; const color = colors[priority] || '#6c757d'; return (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={color} stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>); }
function TrashIcon() { return (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>); }

// --- МОДАЛЬНЫЕ КОМПОНЕНТЫ ---
function ConfirmationModal({ isOpen, onClose, onConfirm, message }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, message: string }) { if (!isOpen) return null; return (<div className="modal-overlay" onClick={onClose}><div className="modal-content" onClick={(e) => e.stopPropagation()}><p style={{ fontSize: '18px', marginBottom: '25px', textAlign: 'center' }}>{message}</p><div className="modal-actions"><button onClick={onConfirm} className="btn btn-danger">Да</button><button onClick={onClose} className="btn btn-secondary">Нет</button></div></div></div>); }
function CreateTaskModal({ isOpen, onClose, onSubmit, projectId, token, members, statuses }: { isOpen: boolean, onClose: () => void, onSubmit: (newTask: Task) => void, projectId: string, token: string, members: User[], statuses: Status[] }) { const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [assigneeId, setAssigneeId] = useState(''); const [statusId, setStatusId] = useState(statuses[0]?._id || ''); const [priority, setPriority] = useState(5); const [error, setError] = useState(''); useEffect(() => { if (isOpen) { setTitle(''); setDescription(''); setAssigneeId(''); setStatusId(statuses[0]?._id || ''); setPriority(5); setError(''); } }, [isOpen, statuses]); if (!isOpen) return null; const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setError(''); if (!title.trim()) { setError('Название задачи обязательно.'); return; } try { const response = await axios.post<Task>(`/api/projects/${projectId}/tasks`, { title, description, assignee: assigneeId || undefined, status: statusId, priority }, { headers: { Authorization: `Bearer ${token}` } }); onSubmit(response.data); onClose(); } catch (err) { setError('Не удалось создать задачу.'); } }; return (<div className="modal-overlay"><div className="modal-content"><h2 className="card-title">Создать новую задачу</h2>{error && <p className="error-message">{error}</p>}<form onSubmit={handleSubmit}><input type="text" placeholder="Название задачи" value={title} onChange={e => setTitle(e.target.value)} className="input" /><textarea placeholder="Описание" value={description} onChange={e => setDescription(e.target.value)} className="textarea" /><select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="select"><option value="">Не назначен</option>{members.map(member => <option key={member._id} value={member._id}>{member.login}</option>)}</select><select value={statusId} onChange={e => setStatusId(e.target.value)} className="select">{statuses.map(status => <option key={status._id} value={status._id}>{status.name}</option>)}</select><label>Приоритет: {priority}</label><input type="range" min="1" max="10" value={priority} onChange={e => setPriority(parseInt(e.target.value))} style={{ width: '100%', marginBottom: '16px' }} /><button type="submit" className="btn btn-primary btn-full">Сохранить</button><button type="button" onClick={onClose} className="btn btn-secondary btn-full">Отмена</button></form></div></div>); }
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

    return (<><div className="modal-overlay"><div className="modal-content"><div className="tabs"><button className={`tab ${activeTab === 'details' ? 'tab-active' : ''}`} onClick={() => setActiveTab('details')}>Детали</button><button className={`tab ${activeTab === 'history' ? 'tab-active' : ''}`} onClick={() => setActiveTab('history')}>История</button></div>{activeTab === 'details' ? (<div><input type="text" name="title" value={editableTask.title} onChange={handleChange} className="input" style={{ fontSize: '24px', fontWeight: 'bold' }} /><textarea name="description" value={editableTask.description} onChange={handleChange} className="textarea" />

        <TaskChecklist initialChecklist={editableTask.checklist || []} onChecklistChange={handleChecklistUpdate} />

        <label style={{ marginTop: '20px', display: 'block' }}>Ответственный</label><select name="assignee" value={editableTask.assignee?._id || ''} onChange={handleChange} className="select"><option value="">Не назначен</option>{members.map(member => <option key={member._id} value={member._id}>{member.login}</option>)}</select><label>Статус</label><select name="status" value={editableTask.status} onChange={handleChange} className="select">{statuses.map(status => <option key={status._id} value={status._id}>{status.name}</option>)}</select><label>Приоритет: {editableTask.priority}</label><input type="range" name="priority" min="1" max="10" value={editableTask.priority} onChange={handleChange} style={{ width: '100%', marginBottom: '16px' }} /><p className="task-meta">Создана: {new Date(task.createdAt).toLocaleString('ru-RU')}</p></div>) : (<div><h3 className="card-title">История изменений</h3><ul className="activity-log">{editableTask.activityLog.slice().reverse().map((log, index) => (<li key={index} className="log-item"><small>{new Date(log.timestamp).toLocaleString('ru-RU')}</small><br /><strong>{log.user.login}</strong> {log.action === 'created' ? `создал(а) задачу "${log.newValue}"` : `изменил(а) поле "${log.field}" с "${log.oldValue}" на "${log.newValue}"`}</li>))}</ul></div>)}<div className="form-row" style={{ gap: '10px', marginTop: '20px' }}><button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Закрыть</button><button onClick={() => setConfirmOpen(true)} className="btn btn-danger" style={{ flex: 1 }}>Удалить</button><button onClick={handleSave} className="btn btn-primary" style={{ flex: 2 }}>Сохранить</button></div></div></div><ConfirmationModal isOpen={isConfirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} message="Вы уверены, что хотите удалить эту задачу?" /></>);
}

// --- СТРАНИЦЫ / ФИЧИ ---

// ЗАМЕНЕН КОМПОНЕНТ LoginPage для добавления регистрации и исправления ошибки
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
                // Используем токен из ответа сервера, чтобы сразу войти в систему
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
        <div className="card">
            <h1 className="card-title">{isRegistering ? 'Регистрация' : 'Task Manager'}</h1>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
                <input type="text" value={login} onChange={e => setLogin(e.target.value)} placeholder="Логин" className="input" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Пароль" className="input" />
                {isRegistering && (
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Подтвердите пароль" className="input" />
                )}
                <button type="submit" className="btn btn-primary btn-full">
                    {isRegistering ? 'Зарегистрироваться и войти' : 'Войти'}
                </button>
            </form>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                    onClick={() => {
                        setIsRegistering(!isRegistering);
                        setError('');
                    }}
                    className="btn-light"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)' }}
                >
                    {isRegistering ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
                </button>
            </div>
        </div>
    );
}


function SetPasswordPage({ onPasswordSet, tempToken }: { onPasswordSet: (token: string) => void, tempToken: string }) { const [password, setPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState(''); const [error, setError] = useState(''); const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setError(''); if (password.length < 6) { setError('Пароль должен быть не менее 6 символов.'); return; } if (password !== confirmPassword) { setError('Пароли не совпадают.'); return; } try { const response = await axios.post<{ token: string }>('/api/auth/set-password', { password }, { headers: { Authorization: `Bearer ${tempToken}` } }); alert('Пароль успешно установлен!'); onPasswordSet(response.data.token); } catch (err: any) { setError(err.response?.data?.message || 'Не удалось установить пароль.'); } }; return (<div className="card"><h1 className="card-title">Установите ваш пароль</h1><p style={{ color: '#6c757d', marginBottom: '24px' }}>Чтобы продолжить, создайте пароль для вашего аккаунта.</p>{error && <p className="error-message">{error}</p>}<form onSubmit={handleSubmit}><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Новый пароль" className="input" /><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Подтвердите пароль" className="input" /><button type="submit" className="btn btn-primary btn-full">Сохранить и войти</button></form></div>); }
function Dashboard({ projects, token, onSelectProject, onProjectUpdate }: { projects: Project[], token: string, onSelectProject: (project: Project) => void, onProjectUpdate: (projects: Project[]) => void }) { const [newProjectName, setNewProjectName] = useState(''); const [error, setError] = useState(''); const [modalInfo, setModalInfo] = useState<{ isOpen: boolean; projectToDelete: Project | null }>({ isOpen: false, projectToDelete: null }); const handleCreateProject = async (e: React.FormEvent) => { e.preventDefault(); setError(''); if (!newProjectName.trim()) return; if (projects.some(p => p.name.toLowerCase() === newProjectName.trim().toLowerCase())) { setError('Проект с таким названием уже существует.'); return; } try { const response = await axios.post<Project>('/api/projects', { name: newProjectName }, { headers: { Authorization: `Bearer ${token}` } }); onProjectUpdate([...projects, response.data]); setNewProjectName(''); } catch (err) { setError('Не удалось создать проект'); } }; const openDeleteModal = (project: Project) => setModalInfo({ isOpen: true, projectToDelete: project }); const closeDeleteModal = () => setModalInfo({ isOpen: false, projectToDelete: null }); const handleDeleteProject = async () => { if (!modalInfo.projectToDelete) return; try { await axios.delete(`/api/projects/${modalInfo.projectToDelete._id}`, { headers: { Authorization: `Bearer ${token}` } }); onProjectUpdate(projects.filter(p => p._id !== modalInfo.projectToDelete?._id)); closeDeleteModal(); } catch (err) { setError('Не удалось удалить проект'); } }; return (<div className="card"><h1 className="card-title">Ваши проекты</h1>{error && <p className="error-message">{error}</p>}<form onSubmit={handleCreateProject} className="form-row"><input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="Название нового проекта" className="input" /><button type="submit" className="btn btn-primary btn-small">Создать</button></form><ul className="project-list">{projects.map((project) => (<li key={project._id} className="project-item" onClick={() => onSelectProject(project)}><span>{project.name}</span><button onClick={(e) => { e.stopPropagation(); openDeleteModal(project); }} className="btn-icon" style={{ color: 'var(--danger-color)' }}><TrashIcon /></button></li>))}</ul><ConfirmationModal isOpen={modalInfo.isOpen} onClose={closeDeleteModal} onConfirm={handleDeleteProject} message={`Вы уверены, что хотите удалить проект "${modalInfo.projectToDelete?.name}"?`} /></div>); }
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
        axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        if (authToken) {
            setLoading(true);
            axios.get<Project[]>('/api/projects', { headers: { Authorization: `Bearer ${authToken}` } })
                .then(response => {
                    setProjects(response.data);
                    if (response.data.length > 0 && !selectedProject) {
                        handleSelectProject(response.data[0]);
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

    const handleLogin = (newToken: string) => { localStorage.setItem('authToken', newToken); setToken(newToken); };
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
        if (loading && !token) return <div className="card"><p>Загрузка...</p></div>;
        if (view === 'setPassword' && tempToken) return <SetPasswordPage onPasswordSet={handleLogin} tempToken={tempToken} />;
        if (!token) return <LoginPage onLogin={handleLogin} onRequireSetPassword={handleRequireSetPassword} />;
        if (!selectedProject) return <Dashboard projects={projects} token={token} onSelectProject={handleSelectProject} onProjectUpdate={handleProjectUpdate} />;

        switch (view) {
            case 'board': return boardLoading ? <p>Загрузка доски...</p> : <KanbanBoard project={selectedProject} token={token} tasks={tasks} members={members} setTasks={setTasks} />;
            case 'settings': return <BoardSettings project={selectedProject} token={token} onSettingsChange={handleSettingsChange} onDirtyChange={setSettingsDirty} />;
            default: return <Dashboard projects={projects} token={token} onSelectProject={handleSelectProject} onProjectUpdate={handleProjectUpdate} />;
        }
    };

    const showHeader = token && selectedProject;

    if (!showHeader) { return (<div className="app-container"><GlobalStyles /><main className="main-content-login">{renderContent()}</main></div>) }

    return (
        <div className="app-container">
            <GlobalStyles />
            <header className="main-header">
                <div className="header-left">
                    {view === 'settings' && (<button onClick={() => setView('board')} className="btn btn-light btn-small"> ← К доске </button>)}
                    <button onClick={handleGoToDashboard} className="btn btn-light btn-small"> Панель проектов </button>
                    {view === 'board' && <button onClick={handleGoToSettings} className="btn btn-light btn-small">Настройки</button>}
                </div>
                <div className="header-center">
                    {view === 'board' ? (<button onClick={() => setCreateModalOpen(true)} className="btn btn-primary">Создать задачу</button>) : (<h1 className="project-title">{selectedProject.name}</h1>)}
                </div>
                <div className="header-right"> <button onClick={handleLogout} className="btn btn-secondary btn-small">Выйти</button> </div>
            </header>

            <div className="main-view-wrapper">
                <Sidebar projects={projects} selectedProject={selectedProject} onSelectProject={handleSelectProject} />
                <main className="main-content"> {renderContent()} </main>
            </div>

            <ConfirmationModal isOpen={isConfirmNavOpen} onClose={() => { setConfirmNavOpen(false); setPendingNavigation(null); }} onConfirm={confirmAndNavigate} message="У вас есть несохраненные изменения. Вы уверены, что хотите уйти?" />
            {selectedProject && token && <CreateTaskModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onSubmit={handleTaskCreated} projectId={selectedProject._id} token={token} members={members} statuses={selectedProject.statuses} />}
        </div>
    );
}