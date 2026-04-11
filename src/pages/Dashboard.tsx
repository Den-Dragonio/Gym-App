import { useState, useEffect } from 'react';
import { CalendarWidget } from '../components/CalendarWidget';
import { useTranslation } from 'react-i18next';
import { Flame, Target } from 'lucide-react';
import { format } from 'date-fns';
import { WorkoutForm } from '../components/WorkoutForm';
import { WorkoutSummary } from '../components/WorkoutSummary';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { deleteWorkout } from '../firebase/db';

export const Dashboard = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState<any>(null);
  const [allWorkouts, setAllWorkouts] = useState<any[]>([]);

  const fetchMonthWorkouts = async () => {
    if (!currentUser?.uid) return;
    const q = query(collection(db, 'workouts'), where('userId', '==', currentUser.uid));
    try {
        const snap = await getDocs(q);
        const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllWorkouts(fetched);
    } catch (e) {
        console.error(e);
    }
  };

  useEffect(() => {
    fetchMonthWorkouts();
  }, [currentUser, isFormOpen]);

  // Streak Aggregation
  let dailyStreak = 0;
  let planStreak = 0;

  if (allWorkouts.length > 0) {
      const workoutDates = [...new Set(allWorkouts.map((w: any) => new Date(w.date).toISOString().split('T')[0]))].sort().reverse();
      
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      if (workoutDates.includes(today) || workoutDates.includes(yesterday)) {
         let checkDate = workoutDates.includes(today) ? today : yesterday;
         let dateIndex = workoutDates.indexOf(checkDate);
         
         dailyStreak = 1;
         for (let i = dateIndex; i < workoutDates.length - 1; i++) {
            const current = new Date(workoutDates[i] as string);
            const prev = new Date(workoutDates[i+1] as string);
            const diff = (current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
            if (diff === 1) dailyStreak++;
            else break;
         }
      }

      const daysPlan = currentUser?.daysPlan || [];
      if (daysPlan.length > 0) {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          let currentCheck = new Date();
          let missedPlanDay = false;
          while (!missedPlanDay) {
              const dayName = dayNames[currentCheck.getDay()];
              const dateKey = currentCheck.toISOString().split('T')[0];
              if (daysPlan.includes(dayName)) {
                  if (workoutDates.includes(dateKey)) {
                      planStreak++;
                  } else if (dateKey !== today) {
                      missedPlanDay = true;
                  }
              }
              if (missedPlanDay) break;
              currentCheck.setDate(currentCheck.getDate() - 1);
              if (planStreak > 1000 || currentCheck.getTime() < new Date(workoutDates[workoutDates.length - 1]).getTime() - 86400000) break;
          }
      }
  }  
  const completedDays: any[] = allWorkouts.map(w => ({
      date: format(new Date(w.date), 'yyyy-MM-dd'),
      type: 'Other'
  }));

  const getWorkoutForDate = (date: Date) => {
      const dStr = date.toDateString();
      return allWorkouts.find(w => new Date(w.date).toDateString() === dStr);
  };

  const handleDateClick = (date: Date) => {
      setSelectedDate(date);
      const workout = getWorkoutForDate(date);
      if (workout) {
          setActiveWorkout(workout);
          setIsSummaryOpen(true);
      } else {
          setIsFormOpen(true);
      }
  };

  const handleEdit = (workout: any) => {
      setIsSummaryOpen(false);
      setActiveWorkout(workout);
      setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
      if (window.confirm(t('confirm_delete_workout', 'Are you sure you want to delete this workout?'))) {
          await deleteWorkout(id);
          setIsSummaryOpen(false);
          fetchMonthWorkouts();
      }
  };

  const handleFormSuccess = (workout: any) => {
      setActiveWorkout(workout);
      setIsFormOpen(false);
      setIsSummaryOpen(true);
      fetchMonthWorkouts();
  };

  const selectedWorkout = getWorkoutForDate(selectedDate);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{t('dashboard')}</h1>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="card glass" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flame color="var(--color-streak-daily)" size={24} />
            <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>{dailyStreak}</span>
          </div>

          <div className="card glass" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target color="var(--color-streak-plan)" size={24} />
            <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>{planStreak}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.5rem' }}>
        <div className="card glass" style={{ padding: '1.5rem' }}>
          <CalendarWidget 
             onDateSelect={handleDateClick} 
             completedDays={completedDays} 
          />
        </div>

        <div className="card glass" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
            {t('workouts_for', { date: format(selectedDate, 'MMM d, yyyy') })}
          </h2>
          
          {selectedWorkout ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <div>
                      <strong style={{ fontSize: '1.1rem' }}>{selectedWorkout.type}</strong>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{selectedWorkout.duration} min • {selectedWorkout.exercises?.length || 0} exercises</div>
                  </div>
                  <button className="btn-primary" onClick={() => { setActiveWorkout(selectedWorkout); setIsSummaryOpen(true); }}>
                      {t('view_details', 'View Details')}
                  </button>
              </div>
          ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                {t('no_workouts_this_day', 'No workouts recorded on this day.')}
                <br/><br/>
                <button className="btn-primary" onClick={() => setIsFormOpen(true)}>
                  {t('add_workout', 'Add Workout')}
                </button>
              </div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <WorkoutForm 
            date={selectedDate} 
            initialData={activeWorkout}
            onClose={() => { setIsFormOpen(false); setActiveWorkout(null); }} 
            onSuccess={handleFormSuccess}
        />
      )}

      {isSummaryOpen && activeWorkout && (
         <WorkoutSummary 
            workout={activeWorkout} 
            onClose={() => { setIsSummaryOpen(false); setActiveWorkout(null); }}
            onEdit={handleEdit}
            onDelete={handleDelete}
         />
      )}
    </div>
  );
};
