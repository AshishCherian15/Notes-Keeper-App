import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { api, clearStoredToken, getStoredToken, setStoredToken } from './api.js';

const blankDraft = {
  id: null,
  title: '',
  content: ''
};

function formatDate(value) {
  if (!value) {
    return 'Just now';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

function AuthScreen({ onSuccess }) {
  const [mode, setMode] = useState('register');
  const [form, setForm] = useState({ name: 'Alex Morgan', email: 'alex@notes.app', password: 'secret12' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        email: form.email,
        password: form.password
      };

      if (mode === 'register') {
        payload.name = form.name;
      }

      const result = mode === 'register' ? await api.register(payload) : await api.login(payload);
      setStoredToken(result.token);
      onSuccess(result.user, result.token);
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-screen">
      <div className="auth-glow auth-glow-a" />
      <div className="auth-glow auth-glow-b" />

      <div className="auth-copy">
        <p className="eyebrow">Notes Keeper App</p>
        <h1>Capture ideas in a workspace that feels premium, fast, and focused.</h1>
        <p className="lede">
          Sign in to keep notes synced, searchable, and ready to edit from a clean
          split-pane interface built for everyday writing.
        </p>

        <div className="feature-grid">
          <article>
            <strong>Instant autosave</strong>
            <span>Drafts persist as you type so nothing disappears.</span>
          </article>
          <article>
            <strong>Smart search</strong>
            <span>Find any thought across titles and content in one stroke.</span>
          </article>
          <article>
            <strong>Profile control</strong>
            <span>Update your display name and bio without leaving the app.</span>
          </article>
        </div>
      </div>

      <div className="auth-card glass-card">
        <div className="auth-tabs">
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            Create account
          </button>
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Sign in
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <label>
              Display name
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Your name"
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="At least 6 characters"
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button className="primary-button auth-submit" type="submit" disabled={loading}>
            {loading ? 'Loading...' : mode === 'register' ? 'Start writing' : 'Open workspace'}
          </button>
        </form>
      </div>
    </section>
  );
}

function NotesWorkspace({ user, notes, selectedNoteId, query, onQueryChange, onSelectNote, onCreateNote, onDeleteNote, onSignOut, onProfileSave, profileSaving, profileError, noteSaving, lastSavedAt, activeDraft, onDraftChange, onRefresh }) {
  const selectedNote = notes.find((note) => note.id === selectedNoteId) || null;
  const sortedNotes = useMemo(() => notes, [notes]);
  const noteCount = notes.length;

  return (
    <div className="workspace-shell">
      <aside className="sidebar glass-card">
        <div className="sidebar-top">
          <div>
            <p className="eyebrow">Workspace</p>
            <h2>{user.name}</h2>
            <p className="muted">{user.email}</p>
          </div>
          <button className="ghost-button" onClick={onSignOut}>Sign out</button>
        </div>

        <div className="search-block">
          <label>
            Search notes
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search titles, sentences, keywords"
            />
          </label>
          <button className="primary-button full-width" onClick={onCreateNote}>New note</button>
        </div>

        <div className="stats-row">
          <div>
            <span className="stat-value">{noteCount}</span>
            <span className="stat-label">Saved</span>
          </div>
          <div>
            <span className="stat-value">{sortedNotes.filter((note) => note.content.trim().length > 0).length}</span>
            <span className="stat-label">Written</span>
          </div>
          <div>
            <span className="stat-value">{selectedNote ? '1' : '0'}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>

        <div className="note-list">
          {sortedNotes.length === 0 ? (
            <div className="empty-sidebar-card">
              <strong>No notes yet</strong>
              <span>Start a new note and the workspace will persist it automatically.</span>
            </div>
          ) : (
            sortedNotes.map((note) => (
              <button
                key={note.id}
                className={`note-card ${note.id === selectedNoteId ? 'active' : ''}`}
                onClick={() => onSelectNote(note.id)}
              >
                <div className="note-card-heading">
                  <strong>{note.title || 'Untitled note'}</strong>
                  <span>{formatDate(note.updatedAt)}</span>
                </div>
                <p>{note.preview}</p>
              </button>
            ))
          )}
        </div>
      </aside>

      <main className="main-stage">
        <section className="hero-card glass-card">
          <div>
            <p className="eyebrow">Refined writing space</p>
            <h1>Turn scattered thoughts into a calm, searchable archive.</h1>
          </div>
          <div className="hero-metrics">
            <div>
              <span>{lastSavedAt ? formatDate(lastSavedAt) : 'Awaiting change'}</span>
              <strong>Last autosave</strong>
            </div>
            <div>
              <span>{noteSaving ? 'Saving now' : 'Ready'}</span>
              <strong>Sync status</strong>
            </div>
            <div>
              <span>{query ? `Filter: ${query}` : 'All notes'}</span>
              <strong>Search scope</strong>
            </div>
          </div>
        </section>

        <section className="editor-grid">
          <div className="editor-card glass-card">
            <div className="editor-header">
              <div>
                <p className="eyebrow">Note editor</p>
                <h2>{activeDraft.id ? 'Editing note' : 'New draft'}</h2>
              </div>
              <div className="editor-actions">
                <button className="ghost-button" onClick={onRefresh}>Refresh</button>
                {activeDraft.id && (
                  <button className="danger-button" onClick={() => onDeleteNote(activeDraft.id)}>Delete</button>
                )}
              </div>
            </div>

            <label>
              Title
              <input
                value={activeDraft.title}
                onChange={(event) => onDraftChange({ ...activeDraft, title: event.target.value })}
                placeholder="Write a clear title"
              />
            </label>

            <label>
              Content
              <textarea
                value={activeDraft.content}
                onChange={(event) => onDraftChange({ ...activeDraft, content: event.target.value })}
                placeholder="Capture the idea, task, or project detail here..."
              />
            </label>

            <div className="status-row">
              <span>{noteSaving ? 'Autosaving...' : 'Autosave enabled'}</span>
              <span>{activeDraft.id ? `Note #${activeDraft.id}` : 'Unsaved draft'}</span>
            </div>
          </div>

          <div className="profile-card glass-card">
            <div className="editor-header">
              <div>
                <p className="eyebrow">Profile</p>
                <h2>Basic profile controls</h2>
              </div>
            </div>

            <ProfileEditor user={user} onSave={onProfileSave} loading={profileSaving} error={profileError} />
          </div>
        </section>
      </main>
    </div>
  );
}

function ProfileEditor({ user, onSave, loading, error }) {
  const [form, setForm] = useState({ name: user.name, bio: user.bio || '' });

  useEffect(() => {
    setForm({ name: user.name, bio: user.bio || '' });
  }, [user.name, user.bio]);

  function handleSubmit(event) {
    event.preventDefault();
    onSave(form);
  }

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <label>
        Display name
        <input
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        />
      </label>

      <label>
        Email
        <input value={user.email} disabled />
      </label>

      <label>
        Bio
        <textarea
          value={form.bio}
          onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
          placeholder="A short personal profile note"
        />
      </label>

      {error && <p className="form-error">{error}</p>}

      <button className="primary-button" type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save profile'}
      </button>
    </form>
  );
}

export default function App() {
  const [token, setToken] = useState(getStoredToken());
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [activeDraft, setActiveDraft] = useState(blankDraft);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  async function loadSession(currentToken = token) {
    setLoading(true);
    setError('');

    try {
      const me = await api.me();
      setUser(me.user);
      await loadNotes(deferredQuery, currentToken);
    } catch {
      clearStoredToken();
      setToken('');
      setUser(null);
      setNotes([]);
      setActiveDraft(blankDraft);
      setSelectedNoteId(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadNotes(search = deferredQuery, currentToken = token) {
    const result = await api.listNotes(search);
    setNotes(result.notes);

    if (result.notes.length === 0) {
      setSelectedNoteId(null);
      setActiveDraft((currentDraft) => (currentDraft.id ? blankDraft : currentDraft));
      return;
    }

    setSelectedNoteId((currentId) => {
      if (currentId && result.notes.some((note) => note.id === currentId)) {
        return currentId;
      }

      const nextId = result.notes[0].id;
      const nextNote = result.notes[0];
      setActiveDraft({ id: nextNote.id, title: nextNote.title, content: nextNote.content });
      return nextId;
    });
  }

  useEffect(() => {
    if (!token) {
      return;
    }

    loadSession(token);
  }, []);

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    const timer = window.setTimeout(() => {
      loadNotes(deferredQuery).catch((loadError) => setError(loadError.message));
    }, 200);

    return () => window.clearTimeout(timer);
  }, [deferredQuery, token, user]);

  useEffect(() => {
    if (!user || !isDirty) {
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setNoteSaving(true);
        setError('');

        const hasContent = activeDraft.title.trim().length > 0 || activeDraft.content.trim().length > 0;
        if (!activeDraft.id && !hasContent) {
          setIsDirty(false);
          return;
        }

        const payload = {
          title: activeDraft.title.trim() || 'Untitled note',
          content: activeDraft.content
        };

        const result = activeDraft.id
          ? await api.updateNote(activeDraft.id, payload)
          : await api.createNote(payload);

        const saved = result.note;
        setLastSavedAt(saved.updatedAt);
        setActiveDraft(saved);
        setSelectedNoteId(saved.id);
        setIsDirty(false);
        await loadNotes(deferredQuery);
      } catch (autosaveError) {
        setError(autosaveError.message);
      } finally {
        setNoteSaving(false);
      }
    }, 550);

    return () => window.clearTimeout(timer);
  }, [activeDraft, deferredQuery, isDirty, user]);

  async function handleProfileSave(payload) {
    setProfileSaving(true);
    setProfileError('');

    try {
      const result = await api.updateProfile(payload);
      setUser(result.user);
    } catch (profileSaveError) {
      setProfileError(profileSaveError.message);
    } finally {
      setProfileSaving(false);
    }
  }

  function handleDraftChange(nextDraft) {
    setActiveDraft(nextDraft);
    setIsDirty(true);
  }

  function handleNewNote() {
    setSelectedNoteId(null);
    setActiveDraft(blankDraft);
    setIsDirty(false);
    setMessage('Draft ready. Start writing and it will autosave.');
  }

  function handleSelectNote(noteId) {
    const nextNote = notes.find((item) => item.id === noteId);
    if (!nextNote) {
      return;
    }

    setSelectedNoteId(nextNote.id);
    setActiveDraft({ id: nextNote.id, title: nextNote.title, content: nextNote.content });
    setIsDirty(false);
    setMessage('');
  }

  async function handleDeleteNote(noteId) {
    if (!window.confirm('Delete this note permanently?')) {
      return;
    }

    await api.deleteNote(noteId);
    setMessage('Note deleted.');
    setActiveDraft(blankDraft);
    setSelectedNoteId(null);
    await loadNotes(deferredQuery);
  }

  function handleSignOut() {
    clearStoredToken();
    setToken('');
    setUser(null);
    setNotes([]);
    setSelectedNoteId(null);
    setActiveDraft(blankDraft);
    setMessage('');
    setError('');
  }

  if (loading && !user) {
    return <div className="loading-screen">Opening your workspace...</div>;
  }

  if (!user) {
    return <AuthScreen onSuccess={(nextUser, nextToken) => {
      setUser(nextUser);
      setToken(nextToken);
      setMessage('Welcome back.');
      loadSession(nextToken).catch(() => undefined);
    }} />;
  }

  return (
    <div className="app-root">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <div className="ambient ambient-c" />

      {message && <div className="toast">{message}</div>}
      {error && <div className="toast toast-error">{error}</div>}

      <NotesWorkspace
        user={user}
        notes={notes}
        selectedNoteId={selectedNoteId}
        query={query}
        onQueryChange={setQuery}
        onSelectNote={handleSelectNote}
        onCreateNote={handleNewNote}
        onDeleteNote={handleDeleteNote}
        onSignOut={handleSignOut}
        onProfileSave={handleProfileSave}
        profileSaving={profileSaving}
        profileError={profileError}
        noteSaving={noteSaving}
        lastSavedAt={lastSavedAt}
        activeDraft={activeDraft}
        onDraftChange={handleDraftChange}
        onRefresh={() => loadNotes(deferredQuery).catch((loadError) => setError(loadError.message))}
      />
    </div>
  );
}
