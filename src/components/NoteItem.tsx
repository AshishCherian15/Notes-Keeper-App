import React, { useState } from 'react';
import { Note } from '../types';
import { Pencil, Trash2, Check, X, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface NoteItemProps {
  note: Note;
  onUpdate: (id: number, title: string, content: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export const NoteItem: React.FC<NoteItemProps> = ({ note, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.content);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    setIsSaving(true);
    await onUpdate(note.id, editTitle, editContent);
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);
  };

  const bgColors = [
    'bg-orange-50 border-orange-200',
    'bg-pink-50 border-pink-200',
    'bg-blue-50 border-blue-200',
    'bg-green-50 border-green-200',
    'bg-yellow-50 border-yellow-200',
  ];
  const colorClass = bgColors[note.id % bgColors.length];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      className={`border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative flex flex-col h-full ${isEditing ? 'bg-white border-slate-200' : colorClass}`}
    >
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full font-semibold text-lg bg-slate-50 border border-slate-200 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Note title"
            autoFocus
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full text-slate-700 bg-slate-50 border border-slate-200 rounded px-3 py-2 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Write your note here..."
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1.5"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !editTitle.trim()}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start gap-4 mb-2">
            <h3 className="font-semibold text-lg text-slate-900 leading-tight">
              {note.title}
            </h3>
            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Edit note"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(note.id)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-slate-600 whitespace-pre-wrap text-sm mb-4">
            {note.content}
          </p>
          <div className="flex items-center gap-1 text-xs text-slate-400 mt-auto pt-3 border-t border-slate-50">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated {formatDate(note.updated_at)}</span>
          </div>
        </>
      )}
    </motion.div>
  );
}
