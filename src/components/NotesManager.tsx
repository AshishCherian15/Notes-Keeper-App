import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';
import { Note, User } from '../types';
import { NoteItem } from './NoteItem';
import { Plus, Search, Loader2, LogOut, BookText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotesManagerProps {
  user: User;
  onLogout: () => void;
}

export function NotesManager({ user, onLogout }: NotesManagerProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchNotes = useCallback(async (query: string = '') => {
    try {
      setLoading(true);
      const endpoint = query ? `/notes?q=${encodeURIComponent(query)}` : '/notes';
      const data = await apiFetch(endpoint);
      setNotes(data || []);
    } catch (err) {
      console.error('Failed to fetch notes', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotes(searchQuery);
    }, 300); // debounce search
    return () => clearTimeout(timer);
  }, [searchQuery, fetchNotes]);

  const handleCreateNote = async () => {
    if (!newTitle.trim()) return;
    setIsSaving(true);
    try {
      const savedNote = await apiFetch('/notes', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle, content: newContent }),
      });
      setNotes([savedNote, ...notes]);
      setNewTitle('');
      setNewContent('');
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create note', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateNote = async (id: number, title: string, content: string) => {
    try {
      const updatedNote = await apiFetch(`/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title, content }),
      });
      setNotes(current => current.map(n => (n.id === id ? updatedNote : n)));
    } catch (err) {
      console.error('Failed to update note', err);
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await apiFetch(`/notes/${id}`, { method: 'DELETE' });
      setNotes(current => current.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete note', err);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-400 via-pink-500 to-indigo-500 rounded-[2rem] p-8 md:p-10 mb-10 text-white shadow-xl shadow-pink-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full mix-blend-overlay blur-3xl opacity-20 pointer-events-none -translate-y-1/2 translate-x-1/4"></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 bg-white/20 text-white rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/20">
            <BookText className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight drop-shadow-sm mb-1">Notes Keeper</h1>
            <p className="text-white/90 font-medium">Welcome back, {user.username}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto relative z-10">
          <div className="relative flex-1 md:w-80">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search your notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-5 py-3.5 bg-white text-slate-900 border-none rounded-xl focus:outline-none focus:ring-4 focus:ring-white/50 transition-shadow text-base shadow-sm placeholder:text-slate-400 font-medium"
            />
          </div>
          <button
            onClick={onLogout}
            className="p-3.5 text-white bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl transition-colors flex shrink-0 border border-white/10"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar / Create Area */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            {!isCreating ? (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-4 font-medium transition-colors shadow-sm hover:shadow"
              >
                <Plus className="w-5 h-5" />
                New Note
              </button>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border text-left border-blue-200 rounded-xl p-5 shadow-lg shadow-blue-100"
              >
                <h3 className="font-semibold text-slate-900 mb-3 text-sm">Create New Note</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                    placeholder="Note title"
                    autoFocus
                  />
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 h-32 resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                    placeholder="Capture your thoughts..."
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleCreateNote}
                      disabled={isSaving || !newTitle.trim()}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Note'}
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setNewTitle('');
                        setNewContent('');
                      }}
                      disabled={isSaving}
                      className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-lg font-medium text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Notes Grid */}
        <div className="lg:col-span-3">
          {loading && notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
              <p>Loading your notes...</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 border border-slate-100 rounded-2xl">
              <BookText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900">No notes found</h3>
              <p className="text-slate-500 max-w-sm mx-auto mt-1">
                {searchQuery 
                  ? "We couldn't find any notes matching your search." 
                  : "You don't have any notes yet. Create your first note to get started!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {notes.map(note => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    onUpdate={handleUpdateNote}
                    onDelete={handleDeleteNote}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
