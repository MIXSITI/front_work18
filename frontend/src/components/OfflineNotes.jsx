import { useEffect, useMemo, useState } from 'react';

const NOTES_STORAGE_KEY = 'offlineNotes';

export default function OfflineNotes() {
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(NOTES_STORAGE_KEY);
      setNotes(saved ? JSON.parse(saved) : []);
    } catch (error) {
      setNotes([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const trimmedText = useMemo(() => noteText.trim(), [noteText]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!trimmedText) {
      return;
    }

    setNotes((prev) => [trimmedText, ...prev]);
    setNoteText('');
  };

  return (
    <section className="offline-notes">
      <div className="section-header">
        <h2>Офлайн заметки</h2>
      </div>

      <form className="offline-notes__form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Введите задачу или заметку"
          value={noteText}
          onChange={(event) => setNoteText(event.target.value)}
          required
        />
        <button type="submit" className="btn btn-add">Добавить</button>
      </form>

      {notes.length ? (
        <ul className="offline-notes__list">
          {notes.map((note, index) => (
            <li key={`${note}-${index}`}>{note}</li>
          ))}
        </ul>
      ) : (
        <p className="offline-notes__empty">Список пуст. Добавьте первую заметку.</p>
      )}
    </section>
  );
}
