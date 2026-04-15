import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const NOTES_STORAGE_KEY = 'offlineNotes';
const API_BASE_URL = 'http://localhost:3001';

const PAGE_TITLES = {
  home: 'Главная',
  about: 'О приложении'
};

export default function AppShellNotes() {
  const [activePage, setActivePage] = useState('home');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef(null);
  const registrationRef = useRef(null);
  const vapidPublicKeyRef = useRef('');

  const showNotificationToast = (text) => {
    const notification = document.createElement('div');
    notification.textContent = `Новая задача: ${text}`;
    notification.style.cssText = `
      position: fixed; top: 10px; right: 10px;
      background: #4285f4; color: white; padding: 1rem;
      border-radius: 5px; z-index: 1000;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  useEffect(() => {
    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('taskAdded', (task) => {
      if (!task?.text) {
        return;
      }

      showNotificationToast(task.text);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadContent = async () => {
      setIsLoading(true);

      try {
        const response = await fetch(`/content/${activePage}.html`);
        if (!response.ok) {
          throw new Error(`Cannot load ${activePage}.html`);
        }

        const html = await response.text();
        if (isMounted) {
          setContent(html);
        }
      } catch (error) {
        if (isMounted) {
          setContent('<p class="offline-notes__empty">Ошибка загрузки страницы.</p>');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadContent();
    return () => {
      isMounted = false;
    };
  }, [activePage]);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    const urlBase64ToUint8Array = (base64String) => {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
    };

    const ensureRegistration = async () => {
      if (registrationRef.current) {
        return registrationRef.current;
      }
      const registration = await navigator.serviceWorker.ready;
      registrationRef.current = registration;
      return registration;
    };

    const getVapidPublicKey = async () => {
      if (vapidPublicKeyRef.current) {
        return vapidPublicKeyRef.current;
      }

      const response = await fetch(`${API_BASE_URL}/api/push/public-key`);
      if (!response.ok) {
        throw new Error('Не удалось получить публичный VAPID ключ');
      }

      const data = await response.json();
      vapidPublicKeyRef.current = data.publicKey;
      return data.publicKey;
    };

    const subscribeToPush = async () => {
      const registration = await ensureRegistration();
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        return existingSubscription;
      }

      const publicKey = await getVapidPublicKey();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      await fetch(`${API_BASE_URL}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });

      return subscription;
    };

    const unsubscribeFromPush = async () => {
      const registration = await ensureRegistration();
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        return;
      }

      await fetch(`${API_BASE_URL}/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });

      await subscription.unsubscribe();
    };

    const setupPushButtons = async () => {
      const enableBtn = document.getElementById('enable-push');
      const disableBtn = document.getElementById('disable-push');
      if (!enableBtn || !disableBtn) {
        return () => {};
      }

      const registration = await ensureRegistration();
      const syncButtonsState = async () => {
        const currentSubscription = await registration.pushManager.getSubscription();
        const isEnabled = Boolean(currentSubscription);
        enableBtn.style.display = isEnabled ? 'none' : 'inline-block';
        disableBtn.style.display = isEnabled ? 'inline-block' : 'none';
      };

      await syncButtonsState();

      const handleEnable = async () => {
        if (Notification.permission === 'denied') {
          alert('Уведомления запрещены. Разрешите их в настройках браузера.');
          return;
        }

        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            alert('Необходимо разрешить уведомления.');
            return;
          }
        }

        await subscribeToPush();
        await syncButtonsState();
      };

      const handleDisable = async () => {
        await unsubscribeFromPush();
        await syncButtonsState();
      };

      enableBtn.addEventListener('click', handleEnable);
      disableBtn.addEventListener('click', handleDisable);

      return () => {
        enableBtn.removeEventListener('click', handleEnable);
        disableBtn.removeEventListener('click', handleDisable);
      };
    };

    let cleanupButtons = () => {};
    setupPushButtons().then((cleanup) => {
      cleanupButtons = cleanup;
    }).catch((error) => {
      console.error('Ошибка инициализации push-кнопок:', error);
    });

    return () => {
      cleanupButtons();
    };
  }, [activePage, content]);

  useEffect(() => {
    if (activePage !== 'home' || !content) {
      return;
    }

    const form = document.getElementById('note-form');
    const input = document.getElementById('note-input');
    const reminderForm = document.getElementById('reminder-form');
    const reminderText = document.getElementById('reminder-text');
    const reminderTime = document.getElementById('reminder-time');
    const list = document.getElementById('notes-list');

    if (!form || !input || !reminderForm || !reminderText || !reminderTime || !list) {
      return;
    }

    const escapeHtml = (value) =>
      value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

    const loadNotes = () => {
      const notes = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '[]');
      list.innerHTML = notes
        .map((note) => {
          if (typeof note === 'string') {
            return `<li>${escapeHtml(note)}</li>`;
          }

          const reminderTextHtml = note.reminder
            ? `<br><small>Напоминание: ${new Date(note.reminder).toLocaleString()}</small>`
            : '';
          return `<li>${escapeHtml(note.text || '')}${reminderTextHtml}</li>`;
        })
        .join('');
    };

    const addNote = (text, reminderTimestamp = null) => {
      const notes = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '[]');
      const note = {
        id: Date.now(),
        text,
        reminder: reminderTimestamp
      };
      notes.unshift(note);
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
      loadNotes();

      if (reminderTimestamp) {
        socketRef.current?.emit('newReminder', {
          id: note.id,
          text,
          reminderTime: reminderTimestamp
        });
      } else {
        socketRef.current?.emit('newTask', {
          text,
          timestamp: Date.now()
        });
      }
    };

    const handleSubmit = (event) => {
      event.preventDefault();
      const text = input.value.trim();
      if (!text) {
        return;
      }

      addNote(text);
      input.value = '';
    };

    const handleReminderSubmit = (event) => {
      event.preventDefault();
      const text = reminderText.value.trim();
      const dateTime = reminderTime.value;
      if (!text || !dateTime) {
        return;
      }

      const timestamp = new Date(dateTime).getTime();
      if (Number.isNaN(timestamp) || timestamp <= Date.now()) {
        alert('Дата напоминания должна быть в будущем.');
        return;
      }

      addNote(text, timestamp);
      reminderText.value = '';
      reminderTime.value = '';
    };

    form.addEventListener('submit', handleSubmit);
    reminderForm.addEventListener('submit', handleReminderSubmit);
    loadNotes();

    return () => {
      form.removeEventListener('submit', handleSubmit);
      reminderForm.removeEventListener('submit', handleReminderSubmit);
    };
  }, [activePage, content]);

  return (
    <section className="offline-notes">
      <div className="section-header">
        <h2>App Shell</h2>
      </div>

      <div className="categories">
        {Object.entries(PAGE_TITLES).map(([page, title]) => (
          <button
            key={page}
            type="button"
            className={`category-btn ${activePage === page ? 'active' : ''}`}
            onClick={() => setActivePage(page)}
          >
            {title}
          </button>
        ))}
      </div>

      <div className="offline-notes__content" style={{ marginTop: 16 }}>
        {isLoading ? (
          <p className="offline-notes__empty">Загрузка...</p>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: content }} />
        )}
      </div>
    </section>
  );
}
