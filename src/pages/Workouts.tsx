import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, RotateCcw, Filter, Search } from 'lucide-react';
import { WorkoutForm } from '../components/WorkoutForm';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';

export const Workouts = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);

  // Advanced Filters State
  const [filterTag, setFilterTag] = useState('');
  const [filterDay, setFilterDay] = useState('');
  
  const [durationOp, setDurationOp] = useState('>');
  const [durationVal, setDurationVal] = useState('');
  
  const [volumeOp, setVolumeOp] = useState('>');
  const [volumeVal, setVolumeVal] = useState('');

  useEffect(() => {
    const fetchWorkouts = async () => {
      if (!currentUser?.uid) return;
      const q = query(
        collection(db, 'workouts'),
        where('userId', '==', currentUser.uid),
        orderBy('date', 'desc'),
        limit(10)
      );
      try {
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map(doc => ({
           id: doc.id,
           name: doc.data().type,
           date: new Date(doc.data().date).toLocaleDateString(),
           dayName: new Date(doc.data().date).toLocaleDateString('en-US', { weekday: 'long' }),
           durationRaw: parseInt(doc.data().duration) || 0,
           duration: `${doc.data().duration}m`,
           sets: doc.data().exercises.reduce((acc: number, curr: any) => acc + curr.sets.length, 0),
           exercisesCount: doc.data().exercises.length,
           maxWeight: 'N/A' // Need advanced calculation logic for max weight
        }));
        setRecentWorkouts(fetched);
      } catch (err) {
        console.error('Failed to fetch workouts:', err);
      }
    };
    fetchWorkouts();
  }, [currentUser, isModalOpen]);

  const filteredWorkouts = recentWorkouts.filter((w: any) => {
    const matchesTag = w.name.toLowerCase().includes(filterTag.toLowerCase());
    const matchesDay = filterDay === '' || w.dayName === filterDay;
    
    let matchesDuration = true;
    if (durationVal) {
       const dVal = parseInt(durationVal);
       matchesDuration = durationOp === '>' ? w.durationRaw > dVal : w.durationRaw < dVal;
    }
    
    let matchesVolume = true;
    if (volumeVal) {
       const vVal = parseInt(volumeVal);
       matchesVolume = volumeOp === '>' ? w.exercisesCount > vVal : w.exercisesCount < vVal;
    }
    
    return matchesTag && matchesDay && matchesDuration && matchesVolume;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{t('workouts', 'Workouts')}</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> {t('log_workout', 'Log Workout')}
        </button>
      </div>

      <div className="card glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
           <Filter size={18} /> {t('filter_workouts', 'Filter Workouts')}
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          
          <div>
            <label style={{display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em'}}>{t('workout_name', 'Workout Name')}</label>
            <div style={{position: 'relative'}}>
              <Search size={16} color="var(--color-text-tertiary)" style={{position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)'}} />
              <input type="text" className="input-field minimal" placeholder={t('search_name', 'Search name...')} value={filterTag} onChange={e => setFilterTag(e.target.value)} style={{paddingLeft: '2.5rem'}} />
            </div>
          </div>

          <div>
            <label style={{display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em'}}>{t('day_of_week', 'Day of the Week')}</label>
            <select className="input-field minimal" value={filterDay} onChange={e => setFilterDay(e.target.value)}>
               <option value="">{t('all_days', 'All Days')}</option>
               <option value="Monday">{t('monday', 'Monday')}</option>
               <option value="Tuesday">{t('tuesday', 'Tuesday')}</option>
               <option value="Wednesday">{t('wednesday', 'Wednesday')}</option>
               <option value="Thursday">{t('thursday', 'Thursday')}</option>
               <option value="Friday">{t('friday', 'Friday')}</option>
               <option value="Saturday">{t('saturday', 'Saturday')}</option>
               <option value="Sunday">{t('sunday', 'Sunday')}</option>
            </select>
          </div>

          <div>
            <label style={{display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em'}}>{t('duration_min', 'Duration (Minutes)')}</label>
            <div style={{display: 'flex', background: 'var(--color-bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden', height: '42px'}}>
               <button 
                  style={{flex: 1, fontSize: '0.8rem', fontWeight: 600, background: durationOp === '>' ? 'var(--color-primary)' : 'transparent', color: durationOp === '>' ? 'white' : 'var(--color-text-secondary)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0}}
                  onClick={() => setDurationOp('>')}
               >{t('over', 'Over')}</button>
               <button 
                  style={{flex: 1, fontSize: '0.8rem', fontWeight: 600, background: durationOp === '<' ? 'var(--color-primary)' : 'transparent', color: durationOp === '<' ? 'white' : 'var(--color-text-secondary)', border: 'none', borderLeft: durationOp === '<' ? 'none' : '1px solid var(--color-border)', cursor: 'pointer', transition: 'all 0.2s', padding: 0}}
                  onClick={() => setDurationOp('<')}
               >{t('under', 'Under')}</button>
               <input type="number" placeholder={t('any', 'Any')} value={durationVal} onChange={e=>setDurationVal(e.target.value)} style={{flex: 1.5, background: 'var(--color-bg-card)', border: 'none', borderLeft: '1px solid var(--color-border)', padding: '0 0.5rem', outline: 'none', fontSize: '1rem', textAlign: 'center', color: 'inherit'}} />
            </div>
          </div>

          <div>
            <label style={{display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em'}}>{t('total_exercises', 'Total Exercises')}</label>
            <div style={{display: 'flex', background: 'var(--color-bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden', height: '42px'}}>
               <button 
                  style={{flex: 1, fontSize: '0.8rem', fontWeight: 600, background: volumeOp === '>' ? 'var(--color-primary)' : 'transparent', color: volumeOp === '>' ? 'white' : 'var(--color-text-secondary)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0}}
                  onClick={() => setVolumeOp('>')}
               >{t('more', 'More')}</button>
               <button 
                  style={{flex: 1, fontSize: '0.8rem', fontWeight: 600, background: volumeOp === '<' ? 'var(--color-primary)' : 'transparent', color: volumeOp === '<' ? 'white' : 'var(--color-text-secondary)', border: 'none', borderLeft: volumeOp === '<' ? 'none' : '1px solid var(--color-border)', cursor: 'pointer', transition: 'all 0.2s', padding: 0}}
                  onClick={() => setVolumeOp('<')}
               >{t('less', 'Less')}</button>
               <input type="number" placeholder={t('any', 'Any')} value={volumeVal} onChange={e=>setVolumeVal(e.target.value)} style={{flex: 1.5, background: 'var(--color-bg-card)', border: 'none', borderLeft: '1px solid var(--color-border)', padding: '0 0.5rem', outline: 'none', fontSize: '1rem', textAlign: 'center', color: 'inherit'}} />
            </div>
          </div>

        </div>
      </div>

      <div className="card glass" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RotateCcw color="var(--color-primary)" size={20} /> {t('history', 'History')}
          </h2>
          <span style={{color: 'var(--color-text-secondary)', fontSize: '0.875rem'}}>{t('showing_records', 'Showing {{count}} records', { count: filteredWorkouts.length })}</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filteredWorkouts.length === 0 && <p style={{ color: 'var(--color-text-tertiary)' }}>{t('no_workouts_found', 'No workouts found.')}</p>}
          {filteredWorkouts.map((workout: any, idx: number) => (
            <div key={workout.id} style={{ 
                padding: '1.25rem 0', 
                borderBottom: idx !== filteredWorkouts.length - 1 ? '1px solid var(--color-border)' : 'none',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' 
            }}>
              <div>
                <strong style={{ fontSize: '1.125rem', display: 'block', marginBottom: '0.25rem' }}>{workout.name || 'Custom Workout'}</strong>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    {workout.date} • {workout.dayName}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', color: 'var(--color-text-primary)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>{t('time', 'Time')}</div>
                    <strong>{workout.durationRaw}m</strong>
                </div>
                <div style={{ textAlign: 'center', backgroundColor: 'var(--color-bg-input)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>{t('sets', 'Sets')}</div>
                    <strong>{workout.sets}</strong>
                </div>
                <div style={{ textAlign: 'center', backgroundColor: 'var(--color-bg-input)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>{t('excs', 'Excs')}</div>
                    <strong>{workout.exercisesCount}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <WorkoutForm date={new Date()} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
};
