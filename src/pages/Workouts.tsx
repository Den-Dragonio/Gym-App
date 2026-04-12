import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, RotateCcw, Filter, Search, Edit2, Trash2 } from 'lucide-react';
import { WorkoutForm } from '../components/WorkoutForm';
import { WorkoutSummary } from '../components/WorkoutSummary';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { deleteWorkout } from '../firebase/db';

export const Workouts = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState<any>(null);
  const [rawWorkouts, setRawWorkouts] = useState<any[]>([]);

  // Advanced Filters State
  const [filterTag, setFilterTag] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [durationOp, setDurationOp] = useState('>');
  const [durationVal, setDurationVal] = useState('');
  const [volumeOp, setVolumeOp] = useState('>');
  const [volumeVal, setVolumeVal] = useState('');

  const fetchWorkouts = async () => {
    if (!currentUser?.uid) return;
    const q = query(
      collection(db, 'workouts'),
      where('userId', '==', currentUser.uid)
    );
    try {
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
      }));
      // Sort in memory DESC (newest first)
      fetched.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRawWorkouts(fetched);
    } catch (err) {
      console.error('Failed to fetch workouts:', err);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [currentUser, isFormOpen]);

  const filteredWorkouts = rawWorkouts.filter((w: any) => {
    const workoutDate = new Date(w.date);
    const dayName = workoutDate.toLocaleDateString('en-US', { weekday: 'long' });
    const matchesTag = (w.type || '').toLowerCase().includes(filterTag.toLowerCase());
    const matchesDay = filterDay === '' || dayName === filterDay;
    
    let matchesDuration = true;
    const durRaw = parseInt(w.duration) || 0;
    if (durationVal) {
       const dVal = parseInt(durationVal);
       matchesDuration = durationOp === '>' ? durRaw > dVal : durRaw < dVal;
    }
    
    let matchesVolume = true;
    const exercisesCount = w.exercises?.length || 0;
    if (volumeVal) {
       const vVal = parseInt(volumeVal);
       matchesVolume = volumeOp === '>' ? exercisesCount > vVal : exercisesCount < vVal;
    }
    
    return matchesTag && matchesDay && matchesDuration && matchesVolume;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm(t('confirm_delete_workout', 'Delete this workout record?'))) {
          await deleteWorkout(id);
          fetchWorkouts();
      }
  };

  const handleEdit = (workout: any, e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveWorkout(workout);
      setIsFormOpen(true);
  };

  const handleView = (workout: any) => {
      setActiveWorkout(workout);
      setIsSummaryOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{t('workouts', 'Workouts')}</h1>
        <button className="btn-primary" onClick={() => { setActiveWorkout(null); setIsFormOpen(true); }}>
          <Plus size={18} /> {t('log_workout', 'Log Workout')}
        </button>
      </div>

      {/* Filters Section */}
      <div className="card glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
           <Filter size={18} /> {t('filter_workouts', 'Filter Workouts')}
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          <div>
            <label style={{display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase'}}>{t('workout_name', 'Workout Name')}</label>
            <div style={{position: 'relative'}}>
              <Search size={16} color="var(--color-text-tertiary)" style={{position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)'}} />
              <input type="text" className="input-field minimal" placeholder={t('search_name', 'Search...')} value={filterTag} onChange={e => setFilterTag(e.target.value)} style={{paddingLeft: '2.5rem'}} />
            </div>
          </div>

          <div>
            <label style={{display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase'}}>{t('day_of_week', 'Day')}</label>
            <select className="input-field minimal" value={filterDay} onChange={e => setFilterDay(e.target.value)}>
               <option value="">{t('all_days', 'All Days')}</option>
               {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                   <option key={d} value={d}>{d}</option>
               ))}
            </select>
          </div>

          <div>
            <label style={{display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase'}}>{t('duration_min', 'Duration')}</label>
            <div style={{display: 'flex', background: 'var(--color-bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden', height: '42px'}}>
               <button 
                  style={{flex: 1, fontSize: '0.7rem', background: durationOp === '>' ? 'var(--color-primary)' : 'transparent', color: durationOp === '>' ? 'white' : 'inherit', border: 'none', cursor: 'pointer'}}
                  onClick={() => setDurationOp('>')}
               >{t('over', 'Over')}</button>
               <button 
                  style={{flex: 1, fontSize: '0.7rem', background: durationOp === '<' ? 'var(--color-primary)' : 'transparent', color: durationOp === '<' ? 'white' : 'inherit', border: 'none', cursor: 'pointer'}}
                  onClick={() => setDurationOp('<')}
               >{t('under', 'Under')}</button>
               <input type="number" placeholder="Min" value={durationVal} onChange={e=>setDurationVal(e.target.value)} style={{width: '60px', background: 'var(--color-bg-card)', border: 'none', borderLeft: '1px solid var(--color-border)', textAlign: 'center', color: 'inherit'}} />
            </div>
          </div>

          <div>
            <label style={{display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase'}}>{t('total_exercises', 'Exercises')}</label>
            <div style={{display: 'flex', background: 'var(--color-bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden', height: '42px'}}>
               <button style={{flex: 1, fontSize: '0.7rem', background: volumeOp === '>' ? 'var(--color-primary)' : 'transparent', color: volumeOp === '>' ? 'white' : 'inherit', border: 'none', cursor: 'pointer'}} onClick={() => setVolumeOp('>')}>{t('more', 'More')}</button>
               <button style={{flex: 1, fontSize: '0.7rem', background: volumeOp === '<' ? 'var(--color-primary)' : 'transparent', color: volumeOp === '<' ? 'white' : 'inherit', border: 'none', cursor: 'pointer'}} onClick={() => setVolumeOp('<')}>{t('less', 'Less')}</button>
               <input type="number" placeholder="Count" value={volumeVal} onChange={e=>setVolumeVal(e.target.value)} style={{width: '60px', background: 'var(--color-bg-card)', border: 'none', borderLeft: '1px solid var(--color-border)', textAlign: 'center', color: 'inherit'}} />
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="card glass" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RotateCcw color="var(--color-primary)" size={20} /> {t('history', 'History')}
          </h2>
          <span style={{color: 'var(--color-text-secondary)', fontSize: '0.875rem'}}>{t('records', { count: filteredWorkouts.length })}</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filteredWorkouts.length === 0 && <p style={{ color: 'var(--color-text-tertiary)' }}>{t('no_workouts_found', 'No workouts found.')}</p>}
          {filteredWorkouts.map((workout: any, idx: number) => (
            <div 
                key={workout.id} 
                onClick={() => handleView(workout)}
                style={{ 
                    padding: '1.25rem 0', 
                    borderBottom: idx !== filteredWorkouts.length - 1 ? '1px solid var(--color-border)' : 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '1.125rem', display: 'block', marginBottom: '0.25rem' }}>{workout.type || 'Custom Workout'}</strong>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    {new Date(workout.date).toLocaleDateString()} • {new Date(workout.date).toLocaleDateString('en-US', { weekday: 'long' })}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Min</div>
                    <strong>{workout.duration}</strong>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Excs</div>
                    <strong>{workout.exercises?.length || 0}</strong>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '1.5rem' }}>
                    <button className="icon-btn" onClick={(e) => handleEdit(workout, e)} title={t('edit')}>
                        <Edit2 size={18} />
                    </button>
                    <button className="icon-btn" onClick={(e) => handleDelete(workout.id, e)} style={{ color: 'var(--color-danger)' }} title={t('delete')}>
                        <Trash2 size={18} />
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isFormOpen && (
        <WorkoutForm 
            date={activeWorkout ? new Date(activeWorkout.date) : new Date()} 
            initialData={activeWorkout}
            onClose={() => { setIsFormOpen(false); setActiveWorkout(null); }}
            onSuccess={(w) => { setActiveWorkout(w); setIsFormOpen(false); setIsSummaryOpen(true); }}
        />
      )}

      {isSummaryOpen && activeWorkout && (
         <WorkoutSummary 
            workout={activeWorkout}
            onClose={() => { setIsSummaryOpen(false); setActiveWorkout(null); }}
            onEdit={(w) => { setIsSummaryOpen(false); setActiveWorkout(w); setIsFormOpen(true); }}
            onDelete={async (id) => { 
                if (window.confirm(t('confirm_delete_workout'))) {
                    await deleteWorkout(id);
                    setIsSummaryOpen(false);
                    fetchWorkouts();
                }
            }}
         />
      )}
    </div>
  );
};
