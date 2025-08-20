// Update copyright year
document.getElementById('y').textContent = new Date().getFullYear();

// Mobile menu toggle
const btn = document.getElementById('menuBtn');
if (btn) {
  btn.addEventListener('click', () => {
    const m = document.getElementById('mnav');
    const on = m.style.display !== 'none';
    m.style.display = on ? 'none' : 'block';
    btn.setAttribute('aria-expanded', String(!on));
  });
}
