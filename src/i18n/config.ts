import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Strictly EN and RU translations
const resources = {
  en: {
    translation: {
      dashboard: 'Dashboard',
      workouts: 'Workouts',
      social: 'Social',
      profile: 'Profile',
      login: 'Login',
      register: 'Register',
      theme: 'Theme',
      system: 'Measurement System',
      metric: 'Metric (kg, cm)',
      imperial: 'Imperial (lbs, in)',
      language: 'Language',
      theme_light: 'Light',
      theme_dark: 'Dark',
      theme_system: 'System (OS)',
      
      // Workout Form
      log_workout: 'Log Workout',
      exercise: 'Exercise',
      sets: 'Sets (Weight × Reps)',
      add_exercise: 'Add Exercise',
      save_workout: 'Finish Workout',
      cancel: 'Cancel',
      exercise_name: 'Bench Press...',
      notes_placeholder: 'How did you feel today?',
      
      // Profile
      preferences: 'Preferences',
      body_stats: 'Body Stats',
      current_weight: 'Current Weight',
      height: 'Height',
      gender: 'Gender',
      male: 'Male',
      female: 'Female',
      other: 'Other',
      longest_workout: 'Longest Workout',
      first_workout: 'First Workout',
      last_workout: 'Last Workout',
      my_gyms: 'My Gyms',
      add_gym: 'Add Gym Location',
      gym_name: 'Gym Name',
      gym_address: 'Address / City',
      gym_website: 'Website / Link',
      edit_profile: 'Edit Profile',
      save_profile: 'Save Profile',
      bio_placeholder: 'Tell us about your fitness journey...',
      
      // Workouts Page
      filter_workouts: 'Filter Workouts',
      workout_name: 'Workout Name',
      day_of_week: 'Day of the Week',
      duration_min: 'Duration (Minutes)',
      total_exercises: 'Total Exercises',
      search_name: 'Search name...',
      all_days: 'All Days',
      over: 'Over',
      under: 'Under',
      any: 'Any',
      more: 'More',
      less: 'Less',
      history: 'History',
      showing_records: 'Showing {{count}} records',
      no_workouts_found: 'No workouts found.',
      time: 'Time',
      excs: 'Excs',
      
      // Days
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
      
      // Profile Stats
      total_workouts: 'Total Sessions',
      daily_streak: 'Daily Streak',
      plan_streak: 'Plan Streak',
      daily_streak_desc: 'Consecutive days with any activity',
      plan_streak_desc: 'Consecutive plan days completed',
      friends: 'Friends',
      logout: 'Logout',
      
      // Dashboard
      streak_daily: 'Daily Streak',
      streak_plan: 'Plan Streak',
      workouts_for: 'Workouts for {{date}}',
      no_workouts_this_day: 'No workouts recorded on this day.',
      add_workout: 'Add Workout',
    }
  },
  ru: {
    translation: {
      dashboard: 'Главная',
      workouts: 'Тренировки',
      social: 'Друзья',
      profile: 'Профиль',
      login: 'Войти',
      register: 'Регистрация',
      theme: 'Тема',
      system: 'Метрическая система',
      metric: 'Метрическая (кг, см)',
      imperial: 'Имперская (фунты, дюймы)',
      language: 'Язык',
      theme_light: 'Светлая',
      theme_dark: 'Темная',
      theme_system: 'Системная (ОС)',
      
      // Workout Form
      log_workout: 'Записать тренировку',
      exercise: 'Упражнение',
      sets: 'Подходы (Вес × Повторы)',
      add_exercise: 'Добавить упражнение',
      save_workout: 'Завершить тренировку',
      cancel: 'Отмена',
      exercise_name: 'Жим лежа...',
      notes_placeholder: 'Как самочувствие сегодня?',
      
      // Profile
      preferences: 'Настройки',
      body_stats: 'Показатели тела',
      current_weight: 'Текущий вес',
      height: 'Рост',
      gender: 'Пол',
      male: 'Мужской',
      female: 'Женский',
      other: 'Другое',
      longest_workout: 'Самая долгая тренировка',
      first_workout: 'Первая тренировка',
      last_workout: 'Последняя тренировка',
      my_gyms: 'Мои Залы',
      add_gym: 'Добавить Зал',
      gym_name: 'Название Зала',
      gym_address: 'Адрес / Город',
      gym_website: 'Сайт / Ссылка',
      edit_profile: 'Редактировать',
      save_profile: 'Сохранить',
      bio_placeholder: 'Расскажите о своем пути в спорте...',
      
      // Workouts Page
      filter_workouts: 'Фильтр тренировок',
      workout_name: 'Название тренировки',
      day_of_week: 'День недели',
      duration_min: 'Длительность (мин)',
      total_exercises: 'Всего упражнений',
      search_name: 'Поиск по названию...',
      all_days: 'Все дни',
      over: 'Больше',
      under: 'Меньше',
      any: 'Любая',
      more: 'Больше',
      less: 'Меньше',
      history: 'История',
      showing_records: 'Показано {{count}} записей',
      no_workouts_found: 'Тренировки не найдены.',
      time: 'Время',
      excs: 'Упр.',
      
      // Days
      monday: 'Понедельник',
      tuesday: 'Вторник',
      wednesday: 'Среда',
      thursday: 'Четверг',
      friday: 'Пятница',
      saturday: 'Суббота',
      sunday: 'Воскресенье',
      
      // Profile Stats
      total_workouts: 'Всего тренировок',
      daily_streak: 'Дневной стрик',
      plan_streak: 'Стрик по плану',
      daily_streak_desc: 'Дней активности подряд',
      plan_streak_desc: 'Дней выполнения плана подряд',
      friends: 'Друзей',
      logout: 'Выйти',
      
      // Dashboard
      streak_daily: 'Дневной стрик',
      streak_plan: 'Стрик по плану',
      workouts_for: 'Тренировки {{date}}',
      no_workouts_this_day: 'В этот день тренировок не записано.',
      add_workout: 'Добавить тренировку',
    }
  }
};

i18n
  .use(initReactI18next);

i18n.init({
  resources,
  lng: localStorage.getItem('gym_language') || 'ru', 
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
