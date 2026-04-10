import { useState } from 'react';
import { CalendarWidget } from '../components/CalendarWidget';
import { useTranslation } from 'react-i18next';
import { Flame, Target } from 'lucide-react';
import { format } from 'date-fns';
import { WorkoutForm } from '../components/WorkoutForm';

export const Dashboard = () => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);

  // Temporary state for UI, should be fetched from Firebase later
  const dailyStreak = 0;
  const planStreak = 0;
  const completedDays: any[] = [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{t('dashboard')}</h1>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="card glass" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flame color="var(--color-streak-daily)" size={24} />
            <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>{dailyStreak}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'none' }} className="hide-mobile">
              {t('streak_daily')}
            </span>
          </div>

          <div className="card glass" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target color="var(--color-streak-plan)" size={24} />
            <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>{planStreak}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'none' }} className="hide-mobile">
              {t('streak_plan')}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.5rem' }}>
        <div className="card glass" style={{ padding: '1.5rem' }}>
          <CalendarWidget 
             onDateSelect={(date) => { 
               setSelectedDate(date); 
               setIsWorkoutModalOpen(true); 
             }} 
             completedDays={completedDays} 
          />
        </div>

        <div className="card glass" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
            {t('workouts_for', { date: format(selectedDate, 'MMM d, yyyy') })}
          </h2>
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            {t('no_workouts_this_day', 'No workouts recorded on this day.')}
            <br/><br/>
            <button className="btn-primary" onClick={() => setIsWorkoutModalOpen(true)}>
              {t('add_workout', 'Add Workout')}
            </button>
          </div>
        </div>
      </div>

      {isWorkoutModalOpen && (
        <WorkoutForm date={selectedDate} onClose={() => setIsWorkoutModalOpen(false)} />
      )}
    </div>
  );
};
