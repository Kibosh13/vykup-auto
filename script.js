const yearSelect = document.querySelector('#car-year');
const currentYear = new Date().getFullYear();

for (let year = currentYear; year >= 1990; year -= 1) {
  const option = document.createElement('option');
  option.value = year;
  option.textContent = year;
  yearSelect.append(option);
}

const phoneInput = document.querySelector('#client-phone');
phoneInput.addEventListener('input', (event) => {
  const digits = event.target.value.replace(/\D/g, '').replace(/^8/, '7').slice(0, 11);
  if (!digits) return;
  const normalized = digits.startsWith('7') ? digits : `7${digits}`;
  const chunks = [
    normalized.slice(0, 1),
    normalized.slice(1, 4),
    normalized.slice(4, 7),
    normalized.slice(7, 9),
    normalized.slice(9, 11),
  ];
  let formatted = `+${chunks[0]}`;
  if (chunks[1]) formatted += ` ${chunks[1]}`;
  if (chunks[2]) formatted += ` ${chunks[2]}`;
  if (chunks[3]) formatted += `-${chunks[3]}`;
  if (chunks[4]) formatted += `-${chunks[4]}`;
  event.target.value = formatted;
});

const leadForm = document.querySelector('#lead-form');
const leadSubmit = document.querySelector('#lead-submit');
const formStatus = document.querySelector('#form-status');
const formStatusTitle = document.querySelector('#form-status-title');
const formStatusText = document.querySelector('#form-status-text');

const showFormStatus = (type, title, message) => {
  formStatus.className = `form-status is-${type}`;
  formStatusTitle.textContent = title;
  formStatusText.textContent = message;
  formStatus.hidden = false;
  formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

leadForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!leadForm.reportValidity()) return;

  formStatus.hidden = true;
  leadSubmit.disabled = true;
  leadSubmit.innerHTML = 'Отправляем…';

  try {
    const response = await fetch(leadForm.action, {
      method: 'POST',
      body: new FormData(leadForm),
      headers: { Accept: 'application/json' },
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Не удалось отправить заявку.');
    }

    showFormStatus('success', 'Заявка отправлена', 'Спасибо! Специалист свяжется с вами в ближайшее время.');
    leadForm.reset();

    if (typeof window.ym === 'function') {
      window.ym(112842151, 'reachGoal', 'lead_sent');
    }
  } catch (error) {
    showFormStatus('error', 'Заявка не отправлена', `${error.message} Позвоните нам по номеру +7 999 528-21-57.`);
  } finally {
    leadSubmit.disabled = false;
    leadSubmit.innerHTML = 'Отправить заявку <span aria-hidden="true">→</span>';
  }
});

const menuToggle = document.querySelector('.menu-toggle');
menuToggle.addEventListener('click', () => {
  const isOpen = document.body.classList.toggle('menu-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
});

document.querySelectorAll('.nav a').forEach((link) => {
  link.addEventListener('click', () => {
    document.body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: .12 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
