window.HabitFlowApp = (() => {
  const routes = {
    splash: 'splash.html',
    onboarding: 'onboarding-1.html',
    login: 'login.html',
    home: 'index.html',
    habits: 'habits.html',
    statistics: 'progress.html',
    ai: 'ai-coach.html',
    profile: 'dashboard.html',
    notifications: 'mood-tracker.html',
    setup: 'health-metrics.html'
  };

  function navigate(page) {
    const target = routes[page] || routes.home;
    window.location.href = target;
  }

  function initBottomNav() {
    const current = window.location.pathname.split('/').pop().replace('.html', '');
    const map = {
      index: 'home',
      habits: 'habits',
      progress: 'statistics',
      'ai-coach': 'ai',
      dashboard: 'profile',
      'health-metrics': 'setup',
      'mood-tracker': 'notifications'
    };
    const active = map[current] || 'home';
    document.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.nav === active);
      btn.onclick = (event) => {
        event.preventDefault();
        navigate(btn.dataset.nav);
      };
    });
  }

  return { navigate, initBottomNav };
})();
