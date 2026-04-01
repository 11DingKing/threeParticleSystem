/**
 * toast.js — Lightweight UI notification utility.
 * Usage: toast('message', 'success' | 'error' | 'warning' | 'info', durationMs)
 */

const ICONS = { info: 'ℹ', success: '✓', warning: '⚠', error: '✕' };

export function toast(message, type = 'info', duration = 4500) {
  const container = document.getElementById('toastContainer');
  if (!container) { console.warn('[toast]', message); return; }

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span class="toast-icon">${ICONS[type] ?? 'ℹ'}</span><span>${message}</span>`;
  container.appendChild(el);

  // Trigger CSS enter transition
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));

  const dismiss = () => {
    el.classList.remove('show');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  };

  const timer = setTimeout(dismiss, duration);
  el.addEventListener('click', () => { clearTimeout(timer); dismiss(); });
}
