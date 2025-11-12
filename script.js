// ---------- Background Carousel ----------
const bgImages = [
  'https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=1600&q=60',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=60',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=60',
  'https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?auto=format&fit=crop&w=1600&q=60',
  'https://images.unsplash.com/photo-1522202195461-2638a59e3483?auto=format&fit=crop&w=1600&q=60'
];

const bgWrap = document.querySelector('.bg-wrap');
let bgIndex = 0, bgInterval = 30000, bgTimer = null;

function buildBg() {
  bgWrap.innerHTML = '';
  bgImages.forEach((src, i) => {
    const d = document.createElement('div');
    d.className = 'bg-slide';
    d.style.backgroundImage = `url(${src})`;
    if (i === 0) d.classList.add('show');
    bgWrap.appendChild(d);
  });
}

function showNextBg() {
  const slides = document.querySelectorAll('.bg-slide');
  slides[bgIndex].classList.remove('show');
  bgIndex = (bgIndex + 1) % slides.length;
  slides[bgIndex].classList.add('show');
}

function startBgTimer() {
  stopBgTimer();
  bgTimer = setInterval(showNextBg, bgInterval);
}

function stopBgTimer() {
  if (bgTimer) clearInterval(bgTimer);
}

buildBg();
startBgTimer();

// ---------- Joke System ----------
const jokeTextEl = document.getElementById('jokeText');
const newJokeBtn = document.getElementById('newJoke');
const copyBtn = document.getElementById('copyJoke');
const saveFavBtn = document.getElementById('saveFav');
const voiceBtn = document.getElementById('voiceBtn');
const jokeListEl = document.getElementById('jokeList');
const catLabel = document.getElementById('catLabel');
const jokeCount = document.getElementById('jokeCount');
const savedCount = document.getElementById('savedCount');
const categorySelect = document.getElementById('categorySelect');
const searchInput = document.getElementById('searchInput');

let jokes = [];
let favorites = [];
let fetching = false;

function normalizeJoke(apiData) {
  if (!apiData) return null;
  const id = apiData.id || Date.now();
  if (apiData.type === 'single')
    return { id, text: apiData.joke, category: apiData.category || 'Misc', source: 'api' };
  if (apiData.type === 'twopart')
    return { id, text: apiData.setup + '\n\n' + apiData.delivery, category: apiData.category || 'Misc', source: 'api' };
  return null;
}

function renderSidebar(list) {
  jokeListEl.innerHTML = '';
  const q = searchInput.value.trim().toLowerCase();
  const filtered = list.filter(j => j.text.toLowerCase().includes(q));
  filtered.slice(0, 60).forEach(j => {
    const itm = document.createElement('div');
    itm.className = 'joke-item';

    const left = document.createElement('div');
    left.style.minWidth = '0';
    const title = document.createElement('strong');
    title.textContent = j.text.replace(/\n/g, ' ');
    const cat = document.createElement('div');
    cat.style.fontSize = '12px';
    cat.style.color = 'rgba(255,255,255,0.65)';
    cat.textContent = j.category;
    left.appendChild(title);
    left.appendChild(cat);

    const right = document.createElement('div');
    const useBtn = document.createElement('button');
    useBtn.textContent = 'Use';
    useBtn.dataset.id = j.id;
    useBtn.addEventListener('click', () => showJoke(j));

    const saveBtn = document.createElement('button');
    saveBtn.textContent = favorites.find(f => f.id === j.id) ? 'Saved' : 'Save';
    saveBtn.style.marginLeft = '6px';
    saveBtn.addEventListener('click', () => toggleSave(j, saveBtn));

    right.appendChild(useBtn);
    right.appendChild(saveBtn);

    itm.appendChild(left);
    itm.appendChild(right);
    jokeListEl.appendChild(itm);
  });
  jokeCount.textContent = list.length;
}

function showJoke(j) {
  if (!j) return;
  jokeTextEl.textContent = j.text;
  catLabel.textContent = j.category || 'Any';
}

function pushJoke(j) {
  if (!j) return;
  if (!jokes.find(x => x.id === j.id)) jokes.unshift(j);
  else jokes = [j, ...jokes.filter(x => x.id !== j.id)];
  renderSidebar(jokes);
}

function toggleSave(j, btnEl) {
  if (!j) return;
  const exists = favorites.find(f => f.id === j.id);
  if (exists) {
    favorites = favorites.filter(f => f.id !== j.id);
    if (btnEl) btnEl.textContent = 'Save';
  } else {
    favorites.push(j);
    if (btnEl) btnEl.textContent = 'Saved';
  }
  savedCount.textContent = favorites.length;
}

async function fetchJoke() {
  if (fetching) return;
  fetching = true;
  jokeTextEl.textContent = 'Loading...';
  try {
    const category = categorySelect.value || 'Any';
    const url = `https://v2.jokeapi.dev/joke/${encodeURIComponent(category)}?blacklistFlags=nsfw,religious,political,explicit`;
    const res = await fetch(url);
    const data = await res.json();
    const nj = normalizeJoke(data);
    if (nj) {
      pushJoke(nj);
      showJoke(nj);
    } else jokeTextEl.textContent = 'No joke found.';
  } catch (e) {
    jokeTextEl.textContent = 'Error fetching joke.';
  }
  fetching = false;
  animateJokeCard();
}

function animateJokeCard() {
  const card = document.querySelector('.joke-card');
  if (card) {
    card.style.animation = 'jokeFade 0.6s forwards';
  }
}

// ---------- Event Listeners ----------
newJokeBtn.addEventListener('click', fetchJoke);

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
    e.preventDefault();
    fetchJoke();
  }
});

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(jokeTextEl.textContent || '');
    copyBtn.textContent = 'Copied';
    setTimeout(() => copyBtn.textContent = 'Copy', 1200);
  } catch (e) {
    alert('Failed to copy joke');
  }
});

saveFavBtn.addEventListener('click', () => {
  const currentJoke = jokes[0];
  if (currentJoke) toggleSave(currentJoke, saveFavBtn);
});

voiceBtn.addEventListener('click', () => {
  const utterance = new SpeechSynthesisUtterance(jokeTextEl.textContent || '');
  speechSynthesis.speak(utterance);
});

categorySelect.addEventListener('change', fetchJoke);
searchInput.addEventListener('input', () => renderSidebar(jokes));

// Initial joke fetch on page load
window.addEventListener('load', fetchJoke);
