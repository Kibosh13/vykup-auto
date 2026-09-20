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

const formatPrice = (number) => `${Math.round(number / 10000) * 10000}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const estimateForm = document.querySelector('#estimate-form');
const estimateResult = document.querySelector('#estimate-result');
const estimatePrice = document.querySelector('#estimate-price');
const telegramResult = document.querySelector('#telegram-result');

estimateForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!estimateForm.reportValidity()) return;

  const formData = new FormData(estimateForm);
  const model = formData.get('model').trim();
  const year = Number(formData.get('year'));
  const mileage = Number(formData.get('mileage'));
  const condition = formData.get('condition');
  const phone = formData.get('phone');
  const ageFactor = Math.max(.16, 1 - (currentYear - year) * .058);
  const mileageFactor = Math.max(.58, 1 - Math.max(0, mileage - 30000) / 520000);
  const conditionFactors = { excellent: 1, good: .91, damaged: .67, broken: .48 };
  const modelSeed = [...model.toLowerCase()].reduce((sum, letter) => sum + letter.charCodeAt(0), 0);
  const segmentBase = 1900000 + (modelSeed % 17) * 65000;
  const midpoint = Math.max(120000, segmentBase * ageFactor * mileageFactor * conditionFactors[condition]);
  const low = midpoint * .91;
  const high = midpoint * 1.06;

  estimatePrice.textContent = `${formatPrice(low)}–${formatPrice(high)} ₽`;
  estimateResult.hidden = false;
  estimateResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  const conditionLabels = { excellent: 'отличное', good: 'есть нюансы', damaged: 'после ДТП', broken: 'не на ходу' };
  const leadText = `Здравствуйте! Хочу оценить автомобиль: ${model}, ${year} г., пробег ${mileage.toLocaleString('ru-RU')} км, состояние — ${conditionLabels[condition]}. Телефон: ${phone}.`;
  telegramResult.dataset.lead = leadText;
});

telegramResult.addEventListener('click', async () => {
  const lead = telegramResult.dataset.lead;
  if (!lead) return;
  try {
    await navigator.clipboard.writeText(lead);
    const toast = document.querySelector('#toast');
    toast.textContent = 'Данные скопированы — вставьте их в чат';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
  } catch (_) {
    // Переход в Telegram остаётся доступен, даже если браузер запретил буфер обмена.
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
