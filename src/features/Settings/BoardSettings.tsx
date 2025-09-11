// ИЗМЕНЕНО: src/features/Settings/BoardSettings.tsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';
import type { Project, Column, Status, User } from '../../types'; // ИЗМЕНЕНО: Путь к типам

// --- ИКОНКИ ---
function TrashIcon() { return (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>); }
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

// --- Страница настроек ---
export default function BoardSettings({ project, token, onSettingsChange, onDirtyChange }: { project: Project, token: string, onSettingsChange: (updatedProject: Project) => void, onDirtyChange: (isDirty: boolean) => void }) {
    const [localColumns, setLocalColumns] = useState<Column[]>(() => JSON.parse(JSON.stringify(project.columns)));
    const [localStatuses, setLocalStatuses] = useState<Status[]>(() => JSON.parse(JSON.stringify(project.statuses)));
    const [projectName, setProjectName] = useState(project.name);
    const [members, setMembers] = useState<User[]>([]);
    const [inviteLogin, setInviteLogin] = useState('');
    const [newStatusName, setNewStatusName] = useState('');
    const [newColumnName, setNewColumnName] = useState('');
    const [activeStatus, setActiveStatus] = useState<Status | null>(null);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    useEffect(() => {
        const initialData = JSON.stringify({ name: project.name, columns: project.columns, statuses: project.statuses });
        const currentData = JSON.stringify({ name: projectName, columns: localColumns, statuses: localStatuses });
        onDirtyChange(initialData !== currentData);
    }, [projectName, localColumns, localStatuses, project, onDirtyChange]);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const response = await axios.get<User[]>(`/api/projects/${project._id}/members`, { headers: { Authorization: `Bearer ${token}` } });
                setMembers(response.data);
            } catch (error) { console.error("Failed to fetch members", error); }
        };
        fetchMembers();
    }, [project._id, token]);

    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteLogin.trim()) return;
        try {
            const response = await axios.post<{ members: User[] }>(`/api/projects/${project._id}/invite`, { login: inviteLogin }, { headers: { Authorization: `Bearer ${token}` } });
            setMembers(response.data.members);
            setInviteLogin('');
            alert(`Пользователь ${inviteLogin} приглашен.`);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Ошибка при приглашении пользователя.');
        }
    };

    const handleDragStart = (event: DragEndEvent) => {
        if (event.active.data.current?.type === 'status') {
            setActiveStatus(event.active.data.current.status as Status);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveStatus(null);
        const { active, over } = event;
        if (!over || !active.data.current?.type || active.data.current.type !== 'status') return;

        const activeId = active.id.toString();
        const overContainerId = over.id.toString();
        const overContainerType = over.data.current?.type;

        setLocalColumns((prevCols) => {
            const newCols = prevCols.map(c => ({
                ...c,
                statusIds: c.statusIds.filter(id => id !== activeId)
            }));

            if (overContainerType === 'column') {
                const overColIndex = newCols.findIndex(c => c._id === overContainerId);
                if (overColIndex !== -1 && !newCols[overColIndex].statusIds.includes(activeId)) {
                    newCols[overColIndex].statusIds.push(activeId);
                }
            }
            return newCols;
        });
    };

    const handleSave = async () => {
        try {
            const payload = { name: projectName, columns: localColumns, statuses: localStatuses };
            const response = await axios.patch<Project>(`/api/projects/${project._id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
            onSettingsChange(response.data);
            alert('Настройки сохранены!');
        } catch (error) {
            alert('Не удалось сохранить настройки');
        }
    };

    const handleAddNewStatus = () => {
        if (!newStatusName.trim()) return;
        const newStatus: Status = { _id: `s_${uuidv4()}`, name: newStatusName.trim() };
        setLocalStatuses(prev => [...prev, newStatus]);
        setNewStatusName('');
    };

    const handleAddNewColumn = () => {
        if (!newColumnName.trim()) return;
        const newColumn: Column = { _id: `c_${uuidv4()}`, name: newColumnName.trim(), statusIds: [] };
        setLocalColumns(prev => [...prev, newColumn]);
        setNewColumnName('');
    };

    const handleDeleteStatus = (statusId: string) => {
        if (window.confirm('Удалить статус?')) {
            setLocalStatuses(prev => prev.filter(s => s._id !== statusId));
            setLocalColumns(prev => prev.map(c => ({ ...c, statusIds: c.statusIds.filter(id => id !== statusId) })));
        }
    };

    const handleRemoveStatusFromColumn = (colId: string, statusId: string) => {
        setLocalColumns(prev => prev.map(c => c._id === colId ? { ...c, statusIds: c.statusIds.filter(id => id !== statusId) } : c));
    };

    const handleDeleteColumn = (colId: string) => {
        if (window.confirm('Удалить колонку?')) {
            setLocalColumns(prev => prev.filter(c => c._id !== colId));
        }
    };

    const handleUpdateStatus = (statusId: string, newName: string) => {
        setLocalStatuses(prev => prev.map(s => s._id === statusId ? { ...s, name: newName } : s));
    };

    const handleUpdateColumn = (colId: string, newName: string) => {
        setLocalColumns(prev => prev.map(c => c._id === colId ? { ...c, name: newName } : c));
    };

    const unassignedStatuses = useMemo(() => {
        const assignedStatusIds = new Set(localColumns.flatMap(c => c.statusIds));
        return localStatuses.filter(s => !assignedStatusIds.has(s._id));
    }, [localColumns, localStatuses]);

    const { setNodeRef: setStatusPoolRef } = useDroppable({ id: 'statusPool', data: { type: 'statusPool' } });

    return (
        <div className="card wide">
            <h1 className="card-title" style={{ textAlign: 'center' }}>Настройки проекта</h1>
            <div className="settings-section">
                <h3>Общие настройки</h3>
                <label htmlFor="projectName">Название проекта</label>
                <input id="projectName" type="text" value={projectName} onChange={e => setProjectName(e.target.value)} className="input" />
                <h3 style={{ marginTop: '20px' }}>Участники</h3>
                <ul className="member-list">{members.map(member => <li key={member._id} className="member-item">{member.login}</li>)}</ul>
                <h3 style={{ marginTop: '20px' }}>Пригласить</h3>
                <form onSubmit={handleInviteUser} className="form-row">
                    <input type="text" value={inviteLogin} onChange={e => setInviteLogin(e.target.value)} placeholder="Логин" className="input" />
                    <button type="submit" className="btn btn-primary btn-small">Пригласить</button>
                </form>
            </div>
            <div style={{ marginTop: '30px' }}>
                <h3>Настройка доски</h3>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <div className="kanban-board" style={{ padding: '10px 0', borderTop: '1px solid var(--border-color)' }}>
                        <div className="kanban-column" style={{ width: '260px' }}>
                            <h4 className="kanban-column-title">Свободные статусы</h4>
                            <div className="add-item-form" style={{ marginBottom: '15px' }}>
                                <input type="text" value={newStatusName} onChange={e => setNewStatusName(e.target.value)} placeholder="Новый статус" className="input" />
                                <button onClick={handleAddNewStatus} className="btn-small btn-primary">Добавить</button>
                            </div>
                            <div ref={setStatusPoolRef} className="settings-list">
                                <SortableContext items={unassignedStatuses.map(s => s._id)}>
                                    {unassignedStatuses.map(status => <SortableStatus key={status._id} status={status} onUpdate={(newName) => handleUpdateStatus(status._id, newName)} onDelete={() => handleDeleteStatus(status._id)} />)}
                                </SortableContext>
                            </div>
                        </div>
                        {localColumns.map(column => <DroppableColumn key={column._id} id={column._id} name={column.name} statusIds={column.statusIds} statuses={localStatuses} onUpdateColumn={handleUpdateColumn} onRemoveStatus={handleRemoveStatusFromColumn} onRemoveColumn={handleDeleteColumn} />)}
                        <div className="kanban-column" style={{ width: '260px' }}>
                            <h4 className="kanban-column-title">Добавить колонку</h4>
                            <div className="add-item-form">
                                <input type="text" value={newColumnName} onChange={e => setNewColumnName(e.target.value)} placeholder="Название колонки" className="input" />
                                <button onClick={handleAddNewColumn} className="btn-small btn-primary">Добавить</button>
                            </div>
                        </div>
                    </div>
                    <DragOverlay>{activeStatus ? <StatusItem status={activeStatus} /> : null}</DragOverlay>
                </DndContext>
            </div>
            <button onClick={handleSave} className="btn btn-primary" style={{ marginTop: '30px', display: 'block', margin: '30px auto 0' }}>Сохранить изменения</button>
        </div>
    );
}