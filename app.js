const STORAGE_KEY = 'calendar-workspace.events.v1';

const monthTitle = document.getElementById('monthTitle');
const grid = document.getElementById('calendarGrid');
const selectedDateTitle = document.getElementById('selectedDateTitle');
const eventList = document.getElementById('eventList');
const eventForm = document.getElementById('eventForm');
const eventTitle = document.getElementById('eventTitle');
const eventTime = document.getElementById('eventTime');
const eventType = document.getElementById('eventType');

let currentMonth = new Date();
currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
let selectedDate = new Date();

function loadEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

let events = loadEvents();

function saveEvents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameDate(a, b) {
  return dateKey(a) === dateKey(b);
}

function render() {
  monthTitle.textContent = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric'
  }).format(currentMonth);

  grid.innerHTML = '';

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const startDate = new Date(year, month, 1 - firstWeekday);

  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'day-cell';

    if (date.getMonth() !== month) cell.classList.add('outside');
    if (isSameDate(date, new Date())) cell.classList.add('today');
    if (isSameDate(date, selectedDate)) cell.classList.add('selected');

    const dayNumber = document.createElement('span');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    cell.appendChild(dayNumber);

    const dayEvents = events
      .filter((event) => event.date === dateKey(date))
      .slice(0, 3);

    if (dayEvents.length) {
      const list = document.createElement('div');
      list.className = 'event-dot-list';

      dayEvents.forEach((event) => {
        const chip = document.createElement('div');
        chip.className = 'event-chip';
        chip.dataset.type = event.type;
        chip.textContent = event.time ? `${event.time} · ${event.title}` : event.title;
        list.appendChild(chip);
      });

      cell.appendChild(list);
    }

    cell.addEventListener('click', () => {
      selectedDate = new Date(date);
      if (selectedDate.getMonth() !== currentMonth.getMonth()) {
        currentMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      }
      render();
    });

    grid.appendChild(cell);
  }

  renderSelectedDay();
}

function renderSelectedDay() {
  selectedDateTitle.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  }).format(selectedDate);

  const dayEvents = events
    .filter((event) => event.date === dateKey(selectedDate))
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

  eventList.innerHTML = '';

  if (!dayEvents.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-events';
    empty.textContent = 'No events yet for this day.';
    eventList.appendChild(empty);
    return;
  }

  dayEvents.forEach((event) => {
    const item = document.createElement('article');
    item.className = 'event-item';

    const row = document.createElement('div');
    row.className = 'event-item-row';

    const title = document.createElement('strong');
    title.textContent = event.title;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'event-remove';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      events = events.filter((candidate) => candidate.id !== event.id);
      saveEvents();
      render();
    });

    row.append(title, remove);

    const meta = document.createElement('div');
    meta.className = 'event-meta';
    meta.textContent = [event.time || 'Any time', event.type].join(' · ');

    item.append(row, meta);
    eventList.appendChild(item);
  });
}

eventForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const title = eventTitle.value.trim();
  if (!title) return;

  events.push({
    id: crypto.randomUUID(),
    title,
    date: dateKey(selectedDate),
    time: eventTime.value,
    type: eventType.value
  });

  saveEvents();
  eventForm.reset();
  render();
});

document.getElementById('prevMonth').addEventListener('click', () => {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  selectedDate = new Date(currentMonth);
  render();
});

document.getElementById('nextMonth').addEventListener('click', () => {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  selectedDate = new Date(currentMonth);
  render();
});

document.getElementById('todayButton').addEventListener('click', () => {
  selectedDate = new Date();
  currentMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  render();
});

render();
