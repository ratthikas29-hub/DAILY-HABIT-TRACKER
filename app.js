// app.js - Main application logic
function getCurrentPage() {
  return window.location.pathname.split('/').pop().replace('.html', '') || 'index';
}

function navigateTo(page) {
  window.location.href = `${page}.html`;
}

function showToast(title, subtitle = '', type = 'success', duration = 3200) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<strong>${title}</strong>${subtitle ? `<div>${subtitle}</div>` : ''}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, duration);
}

function showLoading(show = true) {
  let overlay = document.getElementById('loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay hidden';
    overlay.innerHTML = '<div class="loader-ring"></div>';
    document.body.appendChild(overlay);
  }
  overlay.classList.toggle('hidden', !show);
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showToast('Notifications enabled', 'HabitFlow can now send reminders.', 'success');
      }
    } catch (error) {
      console.warn('Notification permission failed:', error);
    }
  }
}

async function registerPeriodicSync() {
  if (!('serviceWorker' in navigator) || !('periodicSync' in navigator.serviceWorker)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
    if (status.state === 'granted') {
      await registration.periodicSync.register('habit-sync', { minInterval: 24 * 60 * 60 * 1000 });
    }
  } catch (error) {
    console.warn('Periodic sync not supported', error);
  }
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const isLocal = window.location.protocol === 'file:' || ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (isLocal) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      registrations.forEach(reg => reg.unregister());
      return;
    }
    await navigator.serviceWorker.register('service-worker.js');
  } catch (error) {
    console.warn('Service worker registration failed', error);
  }
}

async function showNotification(title, body) {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return;
  registration.showNotification(title, { body, icon: 'image/train img.png', badge: 'image/train img.png' });
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function getDailyReport(date = new Date().toDateString()) {
  const completed = getCompletedHabits(date).length;
  const total = getUserHabits().length || (habitsData.basic || []).length;
  const score = total ? Math.round((completed / total) * 100) : 0;
  return { completed, total, score };
}

function initDailyAlerts() {
  const currentPage = getCurrentPage();
  if (currentPage === 'login' || currentPage === 'onboarding') return;
  const todayKey = getTodayKey();
  if (localStorage.getItem('habitflow-alert-sent') === todayKey) return;
  const { completed, total, score } = getDailyReport();
  const title = completed >= total ? 'Daily target reached!' : 'Daily habit check-in';
  const body = completed >= total
    ? `Excellent work! You completed ${completed}/${total} habits today.`
    : `You’ve completed ${completed}/${total} habits today. Score ${score}% — finish the rest to keep your streak.`;
  showToast(title, body, 'success');
  if (Notification.permission === 'granted') {
    showNotification(title, body);
  }
  localStorage.setItem('habitflow-alert-sent', todayKey);
}

function initDailyResetTimer() {
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
  const delay = nextMidnight - now;
  setTimeout(() => {
    localStorage.removeItem('habitflow-alert-sent');
    initDailyResetTimer();
  }, delay);
}

function initScrollSnap() {
  document.body.classList.add('scroll-snap-root');
}

/* Animation helpers */
function initAnimations() {
  // Reveal on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal, .anim-fade-up, .anim-fade-scale, .anim-slide-left, .anim-pop').forEach(el => observer.observe(el));

  // Hero parallax (subtle)
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      hero.style.transform = `translate3d(${x * 8}px, ${y * 6}px, 0)`;
      hero.style.transition = 'transform 0.15s linear';
    });
    hero.addEventListener('mouseleave', () => { hero.style.transform = ''; });
  }

  // Button ripple
  document.body.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    let ripple = btn.querySelector('.ripple');
    if (!ripple) {
      ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = '120px';
      btn.appendChild(ripple);
    }
    ripple.style.left = (e.offsetX - 60) + 'px';
    ripple.style.top = (e.offsetY - 60) + 'px';
    ripple.style.transform = 'scale(0)';
    ripple.style.opacity = '0.9';
    requestAnimationFrame(() => { ripple.style.transform = 'scale(1)'; ripple.style.opacity = '0'; });
    setTimeout(() => { ripple.style.opacity = ''; }, 700);
  }, { passive: true });

  // Hero shimmer trigger
  document.querySelectorAll('.shimmer').forEach(s => s.classList.add('animate'));
}

function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const page = this.dataset.page;
      if (page) navigateTo(page);
      closeMobileMenu();
    });
  });
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  mobileMenuToggle?.addEventListener('click', () => {
    mobileMenu?.classList.toggle('visible');
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.navbar')) {
      closeMobileMenu();
    }
  });
}

function closeMobileMenu() {
  const mobileMenu = document.getElementById('mobile-menu');
  mobileMenu?.classList.remove('visible');
}

function initBottomNavigation() {
  if (document.querySelector('.bottom-navigation')) return;
  const bottomNav = document.createElement('nav');
  bottomNav.className = 'bottom-navigation';
  bottomNav.innerHTML = `
    <div class="bottom-nav-wrapper">
      <button class="bottom-nav-item" data-page="index"><span class="bottom-nav-icon">🏠</span><span>Home</span></button>
      <button class="bottom-nav-item" data-page="habit-categories"><span class="bottom-nav-icon">📋</span><span>Habits</span></button>
      <button class="bottom-nav-item" data-page="health-metrics"><span class="bottom-nav-icon">🩺</span><span>Health</span></button>
      <button class="bottom-nav-item" data-page="mood-tracker"><span class="bottom-nav-icon">😊</span><span>Mood</span></button>
      <button class="bottom-nav-item" data-page="settings"><span class="bottom-nav-icon">⚙️</span><span>More</span></button>
    </div>
  `;
  document.body.appendChild(bottomNav);
  const currentPage = getCurrentPage();
  setBottomNavActive(currentPage);
  bottomNav.querySelectorAll('.bottom-nav-item').forEach(button => {
    button.addEventListener('click', () => navigateTo(button.dataset.page));
  });
}

function setBottomNavActive(page) {
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
}

function initPage(page) {
  switch (page) {
    case 'index': initHomePage(); break;
    case 'splash': initSplashPage(); break;
    case 'login': initLoginPage(); break;
    case 'onboarding-1':
    case 'onboarding-2':
    case 'onboarding-3': initOnboardingPage(); break;
    case 'onboarding': window.location.href = 'onboarding-1.html'; break;
    case 'habit-categories': initHabitCategoriesPage(); break;
    case 'daily-tracker': initDailyTrackerPage(); break;
    case 'progress': initProgressPage(); break;
    case 'customize': initCustomizePage(); break;
    case 'health-metrics': break;
    case 'mood-tracker': break;
    case 'settings': break;
  }
}

function renderFlowIndicator(page = getCurrentPage()) {
  const existing = document.getElementById('journey-flow');
  existing?.remove();
}

function initHomePage() {
  document.getElementById('start-tracking-btn')?.addEventListener('click', () => navigateTo('habit-categories'));
}

function initDashboardPage() {}
function initHealthMetricsPage() {}
function initAICoachPage() {}
function initMoodTrackerPage() {}

function initLoginPage() {
  const form = document.getElementById('login-form');
  const googleBtn = document.getElementById('google-signin');
  const otpSection = document.getElementById('otp-section');
  const otpCodeInput = document.getElementById('otp-code');
  const verifyBtn = document.getElementById('verify-otp-btn');
  const resendBtn = document.getElementById('resend-otp-btn');
  const otpMessage = document.getElementById('otp-sent-message');
  const otpEmailKey = 'habitflow-otp-email';
  const otpCodeKey = 'habitflow-otp-code';
  const otpExpiryKey = 'habitflow-otp-expiry';

  function hideOtpSection() {
    otpSection?.classList.add('hidden');
    otpCodeInput?.value && (otpCodeInput.value = '');
  }

  function showOtpSection(email) {
    otpSection?.classList.remove('hidden');
    if (otpMessage) {
      otpMessage.textContent = `Enter the 6-digit code sent to ${email}.`;
    }
    otpCodeInput?.focus();
  }

  function generateOtpCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  function storeOtp(email, code) {
    localStorage.setItem(otpEmailKey, email);
    localStorage.setItem(otpCodeKey, code);
    localStorage.setItem(otpExpiryKey, String(Date.now() + 5 * 60 * 1000));
  }

  function validateOtpInput(code) {
    const storedCode = localStorage.getItem(otpCodeKey);
    const expiry = Number(localStorage.getItem(otpExpiryKey) || '0');
    if (Date.now() > expiry) {
      showToast('Code expired', 'Send a new code to continue.', 'error');
      return false;
    }
    if (!storedCode || storedCode !== code) {
      showToast('Invalid code', 'Please check the digits and try again.', 'error');
      return false;
    }
    return true;
  }

  hideOtpSection();

  form?.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('email')?.value.trim();
    if (!email) {
      showToast('Email required', 'Add your email to continue.', 'error');
      return;
    }
    const code = generateOtpCode();
    storeOtp(email, code);
    showLoading(true);
    setTimeout(() => {
      showLoading(false);
      showToast('OTP sent', `A one-time code is on the way to ${email}.`, 'success');
      showOtpSection(email);
    }, 950);
  });

  verifyBtn?.addEventListener('click', function () {
    const inputCode = otpCodeInput?.value.trim();
    if (!inputCode) {
      showToast('Enter the code', 'Your one-time password is required.', 'error');
      return;
    }
    if (!validateOtpInput(inputCode)) {
      return;
    }
    showLoading(true);
    setTimeout(() => {
      showLoading(false);
      localStorage.setItem('userLoggedIn', 'true');
      showToast('Welcome back', 'You are now in your daily space.', 'success');
      navigateTo('index');
    }, 900);
  });

  resendBtn?.addEventListener('click', function () {
    const email = localStorage.getItem(otpEmailKey);
    if (!email) {
      showToast('Start again', 'Enter your email to request a new code.', 'error');
      return;
    }
    const code = generateOtpCode();
    storeOtp(email, code);
    showToast('OTP resent', `A fresh code was sent to ${email}.`, 'success');
    showOtpSection(email);
  });

  googleBtn?.addEventListener('click', function () {
    showLoading(true);
    setTimeout(() => {
      showLoading(false);
      localStorage.setItem('userLoggedIn', 'true');
      showToast('Signed in', 'You are now in your daily space.', 'success');
      navigateTo('index');
    }, 900);
  });
}

function initSplashPage() {
  const continueButton = document.getElementById('begin-onboarding-btn');
  let autoAdvance = true;

  continueButton?.addEventListener('click', function () {
    localStorage.setItem('habitflow-seen-splash', 'true');
    autoAdvance = false;
    navigateTo('onboarding-1');
  });

  setTimeout(() => {
    if (autoAdvance) {
      localStorage.setItem('habitflow-seen-splash', 'true');
      navigateTo('onboarding-1');
    }
  }, 2200);
}

function initOnboardingPage() {
  const nextButton = document.getElementById('onboarding-next');
  const skipButton = document.getElementById('skip-onboarding');
  const currentPage = getCurrentPage();
  const nextPage = currentPage === 'onboarding-1' ? 'onboarding-2' : currentPage === 'onboarding-2' ? 'onboarding-3' : 'login';

  nextButton?.addEventListener('click', function () {
    if (currentPage === 'onboarding-3') {
      localStorage.setItem('habitflow-seen-onboarding', 'true');
      localStorage.setItem('habitflow-onboarding-complete', 'true');
      navigateTo('login');
      return;
    }
    localStorage.setItem('habitflow-seen-onboarding', 'true');
    navigateTo(nextPage);
  });

  skipButton?.addEventListener('click', function () {
    localStorage.setItem('habitflow-seen-onboarding', 'true');
    localStorage.setItem('habitflow-onboarding-complete', 'true');
    navigateTo('login');
  });
}

function initHabitCategoriesPage() {
  const container = document.getElementById('habits-container');
  if (!container || typeof habitsData === 'undefined') return;
  const userHabitIds = getUserHabits().map(habit => habit.id);
  container.innerHTML = '';
  const allHabits = getAllHabits().slice(0, 12);
  allHabits.forEach(habit => {
    const isAdded = userHabitIds.includes(habit.id);
    const card = document.createElement('div');
    card.className = 'habit-card';
    card.innerHTML = `
      <div class="habit-icon"><img src="${habit.icon}" alt="${habit.name}"></div>
      <div>
        <h3>${habit.name}</h3>
        <p>${habit.description}</p>
      </div>
      <div class="habit-actions">
        <div class="habit-pill">${habit.category || 'Wellness'}</div>
        <button class="btn btn-secondary add-habit-btn" data-habit-id="${habit.id}" ${isAdded ? 'disabled' : ''}>
          ${isAdded ? 'Added' : 'Add Habit'}
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  container.addEventListener('click', function (event) {
    const button = event.target.closest('.add-habit-btn');
    if (!button) return;
    const habitId = button.dataset.habitId;
    const habit = getHabitById(habitId);
    if (!habit) return;
    addUserHabit(habit);
    button.textContent = 'Added';
    button.disabled = true;
    showToast('Habit added', `${habit.name} will appear in your daily tracker.`, 'success');
  });
}

function initDailyTrackerPage() {
  updateStreak();
  const streakEl = document.getElementById('current-streak');
  const habitContainer = document.getElementById('daily-habits-container');
  streakEl && (streakEl.textContent = String(getCurrentStreak() || 0));
  if (!habitContainer || typeof habitsData === 'undefined') return;

  const trackedHabits = getUserHabits().length ? getUserHabits() : (habitsData.basic || []).slice(0, 6);
  const report = getDailyReport();
  document.getElementById('today-completed')?.textContent = String(report.completed);
  document.getElementById('today-score')?.textContent = String(report.score);
  document.getElementById('today-total')?.textContent = String(report.total);
  habitContainer.innerHTML = '';

  trackedHabits.slice(0, 6).forEach(habit => {
    const completed = isHabitCompleted(habit.id);
    const card = document.createElement('div');
    card.className = `habit-card ${completed ? 'completed' : ''}`;
    card.innerHTML = `
      <div class="habit-icon"><img src="${habit.icon}" alt="${habit.name}"></div>
      <div>
        <h3>${habit.name}</h3>
        <p>${habit.description.substring(0, 90)}...</p>
      </div>
      <button class="btn btn-secondary habit-toggle" data-habit-id="${habit.id}" ${completed ? 'disabled' : ''}>
        ${completed ? 'Completed' : 'Mark done'}
      </button>
    `;
    habitContainer.appendChild(card);
  });

  habitContainer.addEventListener('click', function (e) {
    const toggle = e.target.closest('.habit-toggle');
    if (!toggle) return;
    const habitId = toggle.dataset.habitId;
    if (!habitId) return;
    if (isHabitCompleted(habitId)) return;

    markHabitCompleted(habitId);
    toggle.textContent = 'Completed';
    toggle.disabled = true;
    toggle.closest('.habit-card')?.classList.add('completed');
    updateStreak();
    streakEl && (streakEl.textContent = String(getCurrentStreak() || 0));
    showToast('Habit completed', 'Nice work — keep the streak going.', 'success');
  });
}

function initProgressPage() {
  const report = getDailyReport();
  document.getElementById('progress-streak')?.textContent = String(getCurrentStreak());
  document.getElementById('progress-completed')?.textContent = String(report.completed);
  document.getElementById('progress-score')?.textContent = `${String(report.score)}%`;
  document.getElementById('progress-badges')?.textContent = String(getUserBadges().length);
  const bars = document.querySelectorAll('.progress-bar span');
  bars.forEach(span => {
    const width = span.dataset.value || '0';
    requestAnimationFrame(() => { span.style.width = `${width}%`; });
  });
}

function initCustomizePage() {
  const addForm = document.getElementById('add-custom-habit-form');
  const habitsContainer = document.getElementById('user-habits-container');
  const emptyState = document.getElementById('customize-empty');
  const modal = document.getElementById('delete-modal');
  const deleteConfirm = document.getElementById('delete-modal-confirm');
  const deleteCancel = document.getElementById('delete-modal-cancel');
  let customHabits = JSON.parse(localStorage.getItem('habitflow-custom-habits') || '[]');
  let deleteIndex = null;
  function renderHabits() {
    habitsContainer.innerHTML = '';
    if (!customHabits.length) {
      emptyState?.classList.remove('hidden');
      return;
    }
    emptyState?.classList.add('hidden');
    customHabits.forEach((habit, index) => {
      const card = document.createElement('div');
      card.className = 'habit-card';
      card.innerHTML = `
        <div>
          <h3>${habit.name}</h3>
          <p>${habit.description || 'A custom habit to keep your routine on track.'}</p>
        </div>
        <button class="btn btn-secondary delete-habit" data-index="${index}">Delete</button>
      `;
      habitsContainer.appendChild(card);
    });
  }
  renderHabits();
  addForm?.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('custom-habit-name')?.value.trim();
    const description = document.getElementById('custom-habit-description')?.value.trim();
    if (!name) {
      showToast('Habit name is required', '', 'error');
      return;
    }
    customHabits.unshift({ name, description });
    localStorage.setItem('habitflow-custom-habits', JSON.stringify(customHabits));
    addForm.reset();
    renderHabits();
    showToast('Habit added!', 'Your custom habit is ready to track.', 'success');
  });
  habitsContainer?.addEventListener('click', function (e) {
    const button = e.target.closest('.delete-habit');
    if (!button) return;
    deleteIndex = Number(button.dataset.index);
    modal?.classList.remove('hidden');
  });
  deleteConfirm?.addEventListener('click', function () {
    if (deleteIndex === null) return;
    customHabits.splice(deleteIndex, 1);
    localStorage.setItem('habitflow-custom-habits', JSON.stringify(customHabits));
    renderHabits();
    modal?.classList.add('hidden');
    showToast('Habit deleted', '', 'success');
  });
  deleteCancel?.addEventListener('click', function () {
    modal?.classList.add('hidden');
  });
  document.addEventListener('click', function (e) {
    if (e.target === modal) {
      modal?.classList.add('hidden');
    }
  });
}

function initApp() {
  initNavigation();
  initBottomNavigation();
  const currentPage = getCurrentPage();
  const loggedIn = localStorage.getItem('userLoggedIn') === 'true';
  const seenSplash = localStorage.getItem('habitflow-seen-splash') === 'true';
  const seenOnboarding = localStorage.getItem('habitflow-seen-onboarding') === 'true';
  const authPages = ['splash', 'login', 'onboarding-1', 'onboarding-2', 'onboarding-3', 'onboarding'];

  if (!loggedIn) {
    if (!seenSplash && currentPage !== 'splash') {
      window.location.href = 'splash.html';
      return;
    }
    if (seenSplash && !seenOnboarding && currentPage !== 'splash' && !currentPage.startsWith('onboarding')) {
      window.location.href = 'onboarding-1.html';
      return;
    }
    if (seenOnboarding && currentPage !== 'login' && currentPage !== 'splash' && !currentPage.startsWith('onboarding')) {
      window.location.href = 'login.html';
      return;
    }
  }

  if (authPages.includes(currentPage) && loggedIn) {
    navigateTo('index');
    return;
  }

  const hideNav = ['splash', 'login', 'onboarding', 'onboarding-1', 'onboarding-2', 'onboarding-3'].includes(currentPage);
  document.querySelector('.bottom-navigation')?.classList.toggle('hidden', hideNav);
  setBottomNavActive(currentPage);
  renderFlowIndicator(currentPage);
  registerServiceWorker();
  requestNotificationPermission();
  registerPeriodicSync();
  initScrollSnap();
  initAnimations();
  initDailyResetTimer();
  initDailyAlerts();
  initPage(currentPage);
}

document.addEventListener('DOMContentLoaded', initApp);
