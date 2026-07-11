(function () {
  const defaultHabits = [
    { id: 'hydration', name: 'Hydrate', description: 'Drink a full glass of water to start the day feeling clear.', category: 'health', icon: '💧' },
    { id: 'walk', name: 'Walk 20 min', description: 'Take a brisk walk and clear your mind.', category: 'fitness', icon: '🚶' },
    { id: 'focus', name: 'Focus sprint', description: 'Work with intent for 25 minutes without distractions.', category: 'productivity', icon: '⏱️' },
    { id: 'stretch', name: 'Stretch', description: 'Loosen your body and reset your posture.', category: 'mindfulness', icon: '🧘' },
    { id: 'reading', name: 'Read 10 pages', description: 'Spend a calm moment with a book or article.', category: 'learning', icon: '📚' },
    { id: 'sleep', name: 'Sleep early', description: 'Protect your recovery by winding down on time.', category: 'sleep', icon: '🌙' }
  ];

  window.habitsData = {
    basic: defaultHabits,
    premium: [
      { id: 'journal', name: 'Journal', description: 'Write three lines about your day and mood.', category: 'mindfulness', icon: '📝' },
      { id: 'meditate', name: 'Meditate', description: 'Take 10 calm minutes to breathe and reset.', category: 'mindfulness', icon: '🕊️' }
    ]
  };

  function getAllHabits() {
    return [...(window.habitsData?.basic || []), ...(window.habitsData?.premium || [])];
  }

  function getHabitById(id) {
    return getAllHabits().find(item => item.id === id) || null;
  }

  function getUserHabits() {
    try {
      return JSON.parse(localStorage.getItem('userHabits') || '[]');
    } catch (error) {
      return [];
    }
  }

  function addUserHabit(habit) {
    const habits = getUserHabits();
    if (!habits.some(item => item.id === habit.id)) {
      habits.unshift({ ...habit });
      localStorage.setItem('userHabits', JSON.stringify(habits));
    }
    return habits;
  }

  function getCompletions(date = new Date().toDateString()) {
    try {
      return JSON.parse(localStorage.getItem('habitCompletions') || '{}');
    } catch (error) {
      return {};
    }
  }

  function getCompletedHabits(date = new Date().toDateString()) {
    const completions = getCompletions();
    return (completions[date] || []).map(id => getHabitById(id)).filter(Boolean);
  }

  function isHabitCompleted(habitId, date = new Date().toDateString()) {
    const completions = getCompletions();
    return (completions[date] || []).includes(habitId);
  }

  function markHabitCompleted(habitId, date = new Date().toDateString()) {
    const completions = getCompletions();
    const current = completions[date] || [];
    if (!current.includes(habitId)) {
      completions[date] = [...new Set([...current, habitId])];
      localStorage.setItem('habitCompletions', JSON.stringify(completions));
    }
    return completions;
  }

  function getCurrentStreak() {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i += 1) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const key = day.toDateString();
      const completed = getCompletedHabits(key).length;
      if (completed > 0) streak += 1;
      else if (streak > 0) break;
    }
    return streak;
  }

  function updateStreak() {
    const streak = getCurrentStreak();
    localStorage.setItem('currentStreak', String(streak));
    return streak;
  }

  function getUserBadges() {
    try {
      return JSON.parse(localStorage.getItem('userBadges') || '[]');
    } catch (error) {
      return [];
    }
  }

  function checkAchievements() {
    const badges = getUserBadges();
    const current = getCurrentStreak();
    const nextBadges = [];
    if (current >= 3 && !badges.includes('Starter')) nextBadges.push('Starter');
    if (current >= 7 && !badges.includes('Momentum')) nextBadges.push('Momentum');
    if (current >= 14 && !badges.includes('Consistency')) nextBadges.push('Consistency');
    const merged = [...new Set([...badges, ...nextBadges])];
    localStorage.setItem('userBadges', JSON.stringify(merged));
    return merged;
  }

  window.getAllHabits = getAllHabits;
  window.getHabitById = getHabitById;
  window.getUserHabits = getUserHabits;
  window.addUserHabit = addUserHabit;
  window.getCompletedHabits = getCompletedHabits;
  window.isHabitCompleted = isHabitCompleted;
  window.markHabitCompleted = markHabitCompleted;
  window.getCurrentStreak = getCurrentStreak;
  window.updateStreak = updateStreak;
  window.getUserBadges = getUserBadges;
  window.checkAchievements = checkAchievements;
})();
