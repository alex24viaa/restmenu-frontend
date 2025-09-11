// НОВЫЙ ФАЙЛ: src/features/Tasks/TaskChecklist.tsx

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ChecklistItem } from '../../types'; // ИЗМЕНЕНО: Импортируем тип

// --- Рекурсивные функции для управления состоянием ---
const findAndToggle = (items: ChecklistItem[], id: string): ChecklistItem[] => {
  return items.map(item => ({
    ...item,
    completed: item.id === id ? !item.completed : item.completed,
    children: findAndToggle(item.children, id),
  }));
};

const findAndAddChild = (items: ChecklistItem[], parentId: string, newText: string): ChecklistItem[] => {
  return items.map(item => (
    item.id === parentId
      ? { ...item, children: [...item.children, { id: uuidv4(), text: newText, completed: false, children: [] }] }
      : { ...item, children: findAndAddChild(item.children, parentId, newText) }
  ));
};

// --- Компонент для одного элемента ---
const ChecklistItemView = ({ item, level = 0, onToggle, onAddChild }: {
  item: ChecklistItem;
  level?: number;
  onToggle: (id: string) => void;
  onAddChild: (parentId: string) => void;
}) => (
  <div style={{ marginLeft: `${level * 25}px`, marginTop: '5px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input type="checkbox" checked={item.completed} onChange={() => onToggle(item.id)} style={{ cursor: 'pointer' }} />
      <span style={{ textDecoration: item.completed ? 'line-through' : 'none' }}>{item.text}</span>
      {level < 2 && (
        <button onClick={() => onAddChild(item.id)} title="Добавить подпункт" style={{ padding: '2px 6px' }}>+</button>
      )}
    </div>
    {item.children.map(child => (
      <ChecklistItemView key={child.id} item={child} level={level + 1} onToggle={onToggle} onAddChild={onAddChild} />
    ))}
  </div>
);

// --- Главный компонент чек-листа ---
export default function TaskChecklist({ initialChecklist, onChecklistChange }: {
  initialChecklist: ChecklistItem[];
  onChecklistChange: (newChecklist: ChecklistItem[]) => void;
}) {
  const [checklist, setChecklist] = useState(initialChecklist);
  const [newItemText, setNewItemText] = useState('');

  useEffect(() => {
    onChecklistChange(checklist);
  }, [checklist, onChecklistChange]);

  // Синхронизация с внешними изменениями
  useEffect(() => {
    setChecklist(initialChecklist);
  }, [initialChecklist]);

  const handleToggle = (id: string) => setChecklist(current => findAndToggle(current, id));
  const handleAddChild = (parentId: string) => {
    const text = prompt("Введите текст нового подпункта:");
    if (text && text.trim()) {
      setChecklist(current => findAndAddChild(current, parentId, text.trim()));
    }
  };
  const handleAddNewRootItem = () => {
    if (!newItemText.trim()) return;
    setChecklist([...checklist, { id: uuidv4(), text: newItemText.trim(), completed: false, children: [] }]);
    setNewItemText('');
  };

  return (
    <div>
      <h4 style={{ marginTop: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Чек-лист</h4>
      {checklist.map(item => (
        <ChecklistItemView key={item.id} item={item} onToggle={handleToggle} onAddChild={handleAddChild} />
      ))}
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <input type="text" value={newItemText} onChange={(e) => setNewItemText(e.target.value)} placeholder="Добавить новый пункт..." className="input" />
        <button onClick={handleAddNewRootItem} className="btn-primary btn-small">Добавить</button>
      </div>
    </div>
  );
}