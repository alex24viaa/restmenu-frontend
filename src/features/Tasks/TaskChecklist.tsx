// Создайте новый файл, например, src/features/Tasks/TaskChecklist.tsx

import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Определяем типы прямо здесь для примера
interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  children: ChecklistItem[];
}

// Начальные данные для демонстрации
const initialChecklistData: ChecklistItem[] = [
  {
    id: uuidv4(),
    text: 'Главный пункт 1',
    completed: false,
    children: [
      {
        id: uuidv4(),
        text: 'Подпункт 1.1',
        completed: true,
        children: [
          {
            id: uuidv4(),
            text: 'Третий уровень 1.1.1',
            completed: false,
            children: [],
          },
        ],
      },
      {
        id: uuidv4(),
        text: 'Подпункт 1.2',
        completed: false,
        children: [],
      },
    ],
  },
  {
    id: uuidv4(),
    text: 'Главный пункт 2',
    completed: false,
    children: [],
  },
];

// --- Рекурсивные функции для управления состоянием ---

// Функция для поиска и обновления элемента в дереве (иммутабельно)
const findAndToggle = (items: ChecklistItem[], id: string): ChecklistItem[] => {
  return items.map(item => {
    if (item.id === id) {
      return { ...item, completed: !item.completed };
    }
    if (item.children.length > 0) {
      return { ...item, children: findAndToggle(item.children, id) };
    }
    return item;
  });
};

// Функция для поиска и добавления дочернего элемента
const findAndAddChild = (items: ChecklistItem[], parentId: string, newText: string): ChecklistItem[] => {
  return items.map(item => {
    if (item.id === parentId) {
      const newItem: ChecklistItem = { id: uuidv4(), text: newText, completed: false, children: [] };
      return { ...item, children: [...item.children, newItem] };
    }
    if (item.children.length > 0) {
      return { ...item, children: findAndAddChild(item.children, parentId, newText) };
    }
    return item;
  });
};


// --- Компонент для одного элемента ---

const ChecklistItemView = ({ item, level = 0, onToggle, onAddChild }: {
  item: ChecklistItem;
  level?: number;
  onToggle: (id: string) => void;
  onAddChild: (parentId: string) => void;
}) => {
  return (
    <div style={{ marginLeft: `${level * 25}px`, marginTop: '5px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input 
          type="checkbox" 
          checked={item.completed} 
          onChange={() => onToggle(item.id)}
          style={{ cursor: 'pointer' }}
        />
        <span style={{ textDecoration: item.completed ? 'line-through' : 'none' }}>
          {item.text}
        </span>
        {/* Ограничиваем добавление 3 уровнями вложенности (level 0, 1, 2) */}
        {level < 2 && (
            <button onClick={() => onAddChild(item.id)} title="Добавить подпункт" style={{ padding: '2px 6px' }}>+</button>
        )}
      </div>

      {/* Рекурсия */}
      {item.children.map(child => (
        <ChecklistItemView
          key={child.id}
          item={child}
          level={level + 1}
          onToggle={onToggle}
          onAddChild={onAddChild}
        />
      ))}
    </div>
  );
};


// --- Главный компонент чек-листа ---

export default function TaskChecklist() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklistData);
  const [newItemText, setNewItemText] = useState('');

  const handleToggle = (id: string) => {
    setChecklist(currentChecklist => findAndToggle(currentChecklist, id));
  };

  const handleAddChild = (parentId: string) => {
    const text = prompt("Введите текст нового подпункта:");
    if (text && text.trim()) {
      setChecklist(currentChecklist => findAndAddChild(currentChecklist, parentId, text.trim()));
    }
  };

  const handleAddNewRootItem = () => {
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
        id: uuidv4(),
        text: newItemText.trim(),
        completed: false,
        children: []
    };
    setChecklist([...checklist, newItem]);
    setNewItemText('');
  }

  return (
    <div>
      <h4 style={{ marginTop: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Чек-лист</h4>
      {checklist.map(item => (
        <ChecklistItemView 
          key={item.id} 
          item={item}
          onToggle={handleToggle}
          onAddChild={handleAddChild}
        />
      ))}
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <input 
            type="text" 
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Добавить новый пункт..."
            className="input"
        />
        <button onClick={handleAddNewRootItem} className="btn-primary btn-small">Добавить</button>
      </div>
    </div>
  );
}