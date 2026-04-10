import { useTranslation } from 'react-i18next';
import { 
  Edit3, Trash2, X, Clock, Scale, 
  ClipboardList, Zap, Link
} from 'lucide-react';

interface SetDetails {
  id: string;
  weight: string; 
  reps: string;
  rirColor: string;
}

interface ExerciseRow {
  id: string;
  name: string;
  isCircuit: boolean; 
  sets: SetDetails[];
  notes?: string;
}

interface Workout {
  id: string;
  type: string;
  duration: string;
  bodyWeight: string;
  supplements: string[];
  notes: string;
  exercises: ExerciseRow[];
  date: string;
}

interface WorkoutSummaryProps {
  workout: Workout;
  onClose: () => void;
  onEdit: (workout: Workout) => void;
  onDelete: (id: string) => void;
}

const getRirLabel = (rir: string) => {
    switch(rir) {
        case 'approx': return '≈';
        case 'green': return '2-3';
        case 'red0': return 'F0';
        case 'redNeg': return 'F-1';
        case 'cheating': return 'CHT';
        case 'red': return 'F';
        default: return 'RIR';
    }
};

const getRirColor = (rir: string) => {
    switch(rir) {
        case 'approx': return 'var(--color-text-tertiary)';
        case 'green': return 'var(--color-success)';
        case 'red0': return 'var(--color-danger)';
        case 'redNeg': return '#a855f7'; // Purple failure
        case 'cheating': return '#f59e0b'; // Orange cheating
        case 'red': return 'var(--color-danger)';
        default: return 'transparent';
    }
};

export const WorkoutSummary = ({ workout, onClose, onEdit, onDelete }: WorkoutSummaryProps) => {
  const { t, i18n } = useTranslation();
  const unit = i18n.language === 'uk' ? 'кг' : 'kg';

  // Grouping logic
  const renderGroupedSets = (sets: SetDetails[]) => {
      const groups: { weight: string, reps: string[], rirs: string[] }[] = [];
      
      sets.forEach(set => {
          const lastGroup = groups[groups.length - 1];
          if (lastGroup && lastGroup.weight === set.weight) {
              lastGroup.reps.push(set.reps);
              lastGroup.rirs.push(set.rirColor);
          } else {
              groups.push({ weight: set.weight, reps: [set.reps], rirs: [set.rirColor] });
          }
      });

      return groups.map((group, gIdx) => (
          <div key={gIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              {gIdx > 0 && <span style={{ color: 'var(--color-text-tertiary)', margin: '0 0.5rem', fontWeight: 300 }}>|</span>}
              <div style={{ backgroundColor: 'var(--color-bg-input)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{group.weight}{unit}</span>
                  <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                      {group.reps.map((rep, rIdx) => (
                          <div key={rIdx} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <span>{rep}</span>
                              {group.rirs[rIdx] !== 'white' && (
                                  <span style={{ fontSize: '0.6rem', color: getRirColor(group.rirs[rIdx]), fontWeight: 900 }}>
                                      {getRirLabel(group.rirs[rIdx])}
                                  </span>
                              )}
                              {rIdx < group.reps.length - 1 && <span style={{ color: 'var(--color-text-tertiary)' }}>,</span>}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      ));
  };

  return (
    <div className="workout-modal-overlay">
      <div className="card glass full-screen-modal" style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Header */}
        <div className="form-header" style={{ padding: '1.5rem 2rem' }}>
          <div>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                {new Date(workout.date).toLocaleDateString()}
            </span>
            <h2 style={{ margin: 0, fontSize: '1.75rem' }}>{workout.type || t('untiltled_workout', 'Untitled Workout')}</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="icon-btn" onClick={() => onEdit(workout)} title={t('edit', 'Edit')}>
                  <Edit3 size={20} />
              </button>
              <button className="icon-btn" onClick={() => onDelete(workout.id)} style={{ color: 'var(--color-danger)' }} title={t('delete', 'Delete')}>
                  <Trash2 size={20} />
              </button>
              <div style={{ width: '1px', background: 'var(--color-border)', margin: '0 0.5rem' }} />
              <button className="icon-btn" onClick={onClose}><X size={24} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="form-body" style={{ overflowY: 'auto', padding: '2rem' }}>
          
          {/* Top Stats */}
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '2.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                 <div style={{ backgroundColor: 'var(--color-bg-input)', padding: '0.75rem', borderRadius: '50%' }}>
                    <Clock size={20} color="var(--color-primary)" />
                 </div>
                 <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>{t('duration', 'Duration')}</div>
                    <strong style={{ fontSize: '1.125rem' }}>{workout.duration} min</strong>
                 </div>
             </div>
             {workout.bodyWeight && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ backgroundColor: 'var(--color-bg-input)', padding: '0.75rem', borderRadius: '50%' }}>
                        <Scale size={20} color="var(--color-primary)" />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>{t('weight', 'Weight')}</div>
                        <strong style={{ fontSize: '1.125rem' }}>{workout.bodyWeight} {unit}</strong>
                    </div>
                </div>
             )}
             {workout.supplements && workout.supplements.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ backgroundColor: 'var(--color-bg-input)', padding: '0.75rem', borderRadius: '50%' }}>
                        <Zap size={20} color="var(--color-primary)" />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>{t('supps', 'Supps')}</div>
                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                            {workout.supplements.map(s => <span key={s} style={{ fontSize: '0.75rem', fontWeight: 600 }}>{s}</span>)}
                        </div>
                    </div>
                </div>
             )}
          </div>

          {/* Exercises List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
             {workout.exercises.map((ex, idx) => (
                <div key={ex.id} style={{ 
                    padding: '1.25rem', 
                    borderRadius: 'var(--radius-md)', 
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--color-border)',
                    position: 'relative',
                    width: '100%',
                    maxWidth: '800px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                                <span style={{ color: 'var(--color-primary)', fontSize: '0.875rem', opacity: 0.7 }}>#{idx+1}</span>
                                {ex.name}
                                {ex.isCircuit && <Link size={14} color="var(--color-streak-plan)" />}
                            </h3>
                            {ex.notes && (
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', display: 'flex', alignItems: 'flex-start', gap: '0.25rem' }}>
                                    <ClipboardList size={14} style={{ marginTop: '2px' }} /> {ex.notes}
                                </p>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                        {renderGroupedSets(ex.sets)}
                    </div>
                </div>
             ))}
          </div>

          {workout.notes && (
              <div style={{ marginTop: '3rem', maxWidth: '800px', margin: '3rem auto 0 auto', padding: '1.5rem', borderLeft: '4px solid var(--color-primary)', backgroundColor: 'var(--color-bg-input)', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--color-primary)' }}>{t('notes_label', 'ЗАМЕТКИ')}</h4>
                  <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>{workout.notes}</p>
              </div>
          )}

        </div>

        {/* Footer */}
        <div className="form-footer" style={{ padding: '1.5rem 2rem' }}>
            <button className="btn-secondary" onClick={onClose}>{t('close', 'Close')}</button>
            <button className="btn-primary" onClick={() => onEdit(workout)}>{t('edit_workout', 'Edit Workout')}</button>
        </div>
      </div>
    </div>
  );
};
