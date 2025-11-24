import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';
import type { Project, Column, Status, User } from '../../types';

// Определяем тип участника с ролью
interface MemberWithRole {
  user: User;
  role: 'admin' | 'member';
}

// Вспомогательная функция для получения ID пользователя из токена
const getUserIdFromToken = (token: string): string | null => {
    try {
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = atob(payloadBase64);
        return JSON.parse(decodedPayload).userId;
    } catch (e) {
        return null;
    }
};


// --- ИКОНКИ ---
function CloseIcon() { return (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>); }
function EditIcon() { return (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>); }

// --- Компоненты для страницы настроек ---
function SortableStatus({ status, onUpdate, onDelete }: { status: Status, onUpdate: (newName: string) => void, onDelete: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: status._id, data: { type: 'status', status } });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
    const handleNameClick = () => {
        const newName = prompt("Введите новое название статуса:", status.name);
        if (newName && newName.trim()) onUpdate(newName.trim());
    };
    return (<div ref={setNodeRef} style={style} className="settings-item" {...attributes} {...listeners}><span>{status.name}</span><div><button onClick={handleNameClick} className="btn-icon"><EditIcon /></button><button onClick={onDelete} className="btn-icon"><CloseIcon /></button></div></div>);
}

function DroppableColumn({ id, name, statusIds, statuses, onUpdateColumn, onRemoveStatus, onRemoveColumn }: { id: string, name: string, statusIds: string[], statuses: Status[], onUpdateColumn: (colId: string, newName: string) => void, onRemoveStatus: (colId: string, statusId: string) => void, onRemoveColumn: (colId: string) => void }) {
    const { setNodeRef } = useDroppable({ id, data: { type: 'column' } });
    const handleNameClick = () => {
        const newName = prompt("Введите новое название колонки:", name);
        if (newName && newName.trim()) onUpdateColumn(id, newName.trim());
    };
    return (<div className="kanban-column" style={{ width: '240px' }}><h4 className="kanban-column-title"><span onClick={handleNameClick} style={{ cursor: 'pointer' }}>{name}</span><span><button onClick={handleNameClick} className="btn-icon"><EditIcon /></button><button onClick={() => onRemoveColumn(id)} className="btn-icon"><CloseIcon /></button></span></h4><div ref={setNodeRef} className="settings-list"><SortableContext items={statusIds}>{statusIds.map(statusId => { const status = statuses.find(s => s._id === statusId); return status ? <SortableStatus key={statusId} status={status} onUpdate={() => { }} onDelete={() => onRemoveStatus(id, statusId)} /> : null; })}</SortableContext></div></div>);
}

function StatusItem({ status }: { status: Status }) { return (<div className="settings-item" style={{ cursor: 'grabbing', boxShadow: 'var(--shadow)' }}><span>{status.name}</span></div>); }

// --- ГЛАВНЫЙ КОМПОНЕНТ СТРАНИЦЫ НАСТРОЕК ---
export default function BoardSettings({ project, token, onSettingsChange, onDirtyChange }: { project: Project, token: string, onSettingsChange: (updatedProject: Project) => void, onDirtyChange: (isDirty: boolean) => void }) {
    const [localColumns, setLocalColumns] = useState<Column[]>(() => JSON.parse(JSON.stringify(project.columns)));
    const [localStatuses, setLocalStatuses] = useState<Status[]>(() => JSON.parse(JSON.stringify(project.statuses)));
    const [projectName, setProjectName] = useState(project.name);
    const [inviteLogin, setInviteLogin] = useState('');
    const [newStatusName, setNewStatusName] = useState('');
    const [newColumnName, setNewColumnName] = useState('');
    const [activeStatus, setActiveStatus] = useState<Status | null>(null);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
    
    const currentUserId = getUserIdFromToken(token);
    const currentUserIsAdmin = project.members.find(m => m.user._id === currentUserId)?.role === 'admin';
    const isOwner = project.owner && project.owner._id === currentUserId;

    useEffect(() => {
        const initialData = JSON.stringify({ name: project.name, columns: project.columns, statuses: project.statuses });
        const currentData = JSON.stringify({ name: projectName, columns: localColumns, statuses: localStatuses });
        onDirtyChange(initialData !== currentData);
    }, [projectName, localColumns, localStatuses, project, onDirtyChange]);
    
    // --- Логика управления участниками ---
    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteLogin.trim()) return;
        try {
            const response = await axios.post<Project>(`/api/projects/${project._id}/invite`, { login: inviteLogin }, { headers: { Authorization: `Bearer ${token}` } });
            onSettingsChange(response.data);
            setInviteLogin('');
            alert(`Пользователь ${inviteLogin} успешно приглашен.`);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Ошибка при приглашении пользователя.');
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (window.confirm('Вы уверены, что хотите удалить этого участника?')) {
            try {
                const response = await axios.delete<Project>(`/api/projects/${project._id}/members/${memberId}`, { headers: { Authorization: `Bearer ${token}` } });
                onSettingsChange(response.data);
            } catch (error: any) {
                alert(error.response?.data?.message || 'Не удалось удалить участника.');
            }
        }
    };

    const handleChangeRole = async (memberId: string, newRole: 'admin' | 'member') => {
        try {
            const response = await axios.patch<Project>(`/api/projects/${project._id}/members/${memberId}/role`, { role: newRole }, { headers: { Authorization: `Bearer ${token}` } });
            onSettingsChange(response.data);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Не удалось изменить роль.');
        }
    };


    // --- Логика управления доской ---
    const handleDragStart = (event: DragEndEvent) => { /* ... ваш код ... */ };
    const handleDragEnd = (event: DragEndEvent) => { /* ... ваш код ... */ };
    const handleSave = async () => { /* ... ваш код ... */ };
    const handleAddNewStatus = () => { /* ... ваш код ... */ };
    const handleAddNewColumn = () => { /* ... ваш код ... */ };
    const handleDeleteStatus = (statusId: string) => { /* ... ваш код ... */ };
    const handleRemoveStatusFromColumn = (colId: string, statusId: string) => { /* ... ваш код ... */ };
    const handleDeleteColumn = (colId: string) => { /* ... ваш код ... */ };
    const handleUpdateStatus = (statusId: string, newName: string) => { /* ... ваш код ... */ };
    const handleUpdateColumn = (colId: string, newName: string) => { /* ... ваш код ... */ };
    const unassignedStatuses = useMemo(() => { /* ... ваш код ... */ }, [localColumns, localStatuses]);
    const { setNodeRef: setStatusPoolRef } = useDroppable({ id: 'statusPool', data: { type: 'statusPool' } });

    return (
        <div className="card wide">
            <h1 className="card-title" style={{ textAlign: 'center' }}>Настройки проекта</h1>
            
            {/* --- РАЗДЕЛ УПРАВЛЕНИЯ УЧАСТНИКАМИ --- */}
            <div className="settings-section" style={{marginTop: '20px'}}>
                <h3>Участники</h3>
                <ul className="project-list" style={{marginTop: 0}}>
                    {(() => {
                        // Убеждаемся, что owner всегда в списке
                        let membersToShow = project.members || [];
                        if (project.owner) {
                            const ownerId = project.owner._id;
                            const ownerInMembers = membersToShow.some(m => m.user._id === ownerId);
                            if (!ownerInMembers) {
                                membersToShow = [
                                    { user: project.owner, role: 'admin' as const },
                                    ...membersToShow
                                ];
                            }
                        }
                        
                        if (membersToShow.length === 0) {
                            return (
                                <li className="project-item" style={{ color: '#6c757d', fontStyle: 'italic' }}>
                                    Нет участников
                                </li>
                            );
                        }
                        
                        return membersToShow.map(({ user, role }) => {
                            const isUserOwner = project.owner && project.owner._id === user._id;
                            return (
                                <li key={user._id} className="project-item">
                                    <div>
                                        <span>{user.login}</span>
                                        {isUserOwner && (
                                            <span style={{ marginLeft: '10px', padding: '2px 6px', background: '#fef3c7', color: '#d97706', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                                                создатель
                                            </span>
                                        )}
                                        <span style={{ marginLeft: '10px', padding: '2px 6px', background: role === 'admin' ? '#e0f2fe' : '#f3f4f6', color: role === 'admin' ? '#0ea5e9' : '#4b5563', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                                            {role}
                                        </span>
                                    </div>
                                    {currentUserIsAdmin && currentUserId !== user._id && !isUserOwner && (
                                        <div style={{display: 'flex', gap: '10px'}}>
                                            {role === 'member' ? (
                                                <button onClick={() => handleChangeRole(user._id, 'admin')} className="btn-light btn-small">Сделать админом</button>
                                            ) : (
                                                <button onClick={() => handleChangeRole(user._id, 'member')} className="btn-light btn-small">Снять права</button>
                                            )}
                                            <button onClick={() => handleRemoveMember(user._id)} className="btn-danger btn-small">Удалить</button>
                                        </div>
                                    )}
                                </li>
                            );
                        });
                    })()}
                </ul>

                {currentUserIsAdmin && (
                 <div style={{marginTop: '20px'}}>
                    <h4 style={{marginTop: 0}}>Пригласить нового участника</h4>
                    <form onSubmit={handleInviteUser} className="form-row">
                        <input type="text" value={inviteLogin} onChange={e => setInviteLogin(e.target.value)} placeholder="Логин пользователя" className="input"/>
                        <button type="submit" className="btn btn-primary btn-small">Пригласить</button>
                    </form>
                </div>
                )}
            </div>

            {/* --- РАЗДЕЛ УПРАВЛЕНИЯ ДОСКОЙ --- */}
            <div className="settings-section" style={{ marginTop: '30px' }}>
                <h3>Настройка доски</h3>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    {/* ... ваша JSX-разметка для управления колонками и статусами ... */}
                </DndContext>
            </div>
            
            <button onClick={handleSave} className="btn btn-primary" style={{ marginTop: '30px', display: 'block', margin: '30px auto 0' }}>Сохранить изменения</button>
        </div>
    );
}