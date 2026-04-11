import { useTranslation } from 'react-i18next';
import { useSettings } from '../contexts/SettingsContext';
import { 
  Edit3, Trash2, X, Clock, Scale, 
  ClipboardList, Zap, Link, ArrowRight
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
  dropped?: boolean;
  children?: ExerciseRow[];
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
        case 'warmup': return 'W';
        case 'approx': return '≈';
        case 'green': return '@';
        case 'red0': return '&';
        case 'redNeg': return '&&';
        case 'cheating': return 'C';
        case 'red': return '!';
        default: return '';
    }
};

const getRirColor = (rir: string) => {
    switch(rir) {
        case 'warmup': return 'rgba(59, 130, 246, 0.15)';
        case 'approx': return 'rgba(148, 163, 184, 0.2)';
        case 'green': return 'rgba(16, 185, 129, 0.2)';
        case 'red0': return 'rgba(239, 68, 68, 0.2)';
        case 'redNeg': return 'rgba(168, 85, 247, 0.2)';
        case 'cheating': return 'rgba(245, 158, 11, 0.2)';
        case 'red': return 'rgba(239, 68, 68, 0.2)';
        default: return 'var(--color-bg-input)';
    }
};

const getRirBorderColor = (rir: string) => {
    switch(rir) {
        case 'warmup': return '#3b82f6';
        case 'approx': return '#94a3b8';
        case 'green': return 'var(--color-success)';
        case 'red0': return 'var(--color-danger)';
        case 'redNeg': return '#a855f7';
        case 'cheating': return '#f59e0b';
        case 'red': return 'var(--color-danger)';
        default: return 'var(--color-border)';
    }
};

export const WorkoutSummary = ({ workout, onClose, onEdit, onDelete }: WorkoutSummaryProps) => {
  const { t, i18n } = useTranslation();
  const { formatDate } = useSettings();
  const unit = i18n.language === 'uk' ? 'кг' : 'kg';

  const renderGroupedSets = (sets: SetDetails[]) => {
      const groups: { weight: string, reps: string[], rirs: string[] }[] = [];
      let lastEffectiveWeight = '';
      
      sets.forEach(set => {
          const currentWeight = set.weight.trim() || lastEffectiveWeight;
          const lastGroup = groups[groups.length - 1];
          if (lastGroup && lastGroup.weight === currentWeight) {
              lastGroup.reps.push(set.reps);
              lastGroup.rirs.push(set.rirColor);
          } else {
              groups.push({ weight: currentWeight, reps: [set.reps], rirs: [set.rirColor] });
          }
          lastEffectiveWeight = currentWeight;
      });

      return groups.map((group, gIdx) => (
          <div key={gIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
              {gIdx > 0 && <span style={{ color: 'var(--color-text-tertiary)', margin: '0 0.5rem', fontWeight: 300, fontSize: '1.2rem' }}>|</span>}
              {group.weight && (
                  <div style={{ backgroundColor: 'var(--color-primary)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                      {group.weight} {unit}
                  </div>
              )}
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  {group.reps.map((rep, rIdx) => (
                      <div key={rIdx} style={{ minWidth: '32px', height: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: getRirColor(group.rirs[rIdx]), border: `1px solid ${getRirBorderColor(group.rirs[rIdx])}`, borderRadius: '8px', position: 'relative', padding: '2px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{rep}</span>
                          {group.rirs[rIdx] !== 'white' && (
                              <span style={{ fontSize: '0.55rem', position: 'absolute', top: '-6px', right: '-6px', backgroundColor: getRirBorderColor(group.rirs[rIdx]), color: 'white', padding: '1px 4px', borderRadius: '10px', fontWeight: 900 }}>
                                  {getRirLabel(group.rirs[rIdx])}
                              </span>
                          )}
                      </div>
                  ))}
              </div>
          </div>
      ));
  };

  const renderExercise = (ex: ExerciseRow, idx: number, indent: number = 0) => (
    <div key={ex.id} style={{ 
        padding: '1.5rem', 
        paddingLeft: `${1.5 + indent * 1.5}rem`,
        borderRadius: 'var(--radius-md)', 
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: `1px solid ${ex.dropped ? 'var(--color-danger)' : 'var(--color-border)'}`,
        position: 'relative',
        width: '100%',
        maxWidth: '850px',
        opacity: ex.dropped ? 0.6 : 1
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ textAlign: 'left' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', textDecoration: ex.dropped ? 'line-through' : 'none' }}>
                    {indent > 0 && <ArrowRight size={16} color="var(--color-primary)" />}
                    <span style={{ color: 'var(--color-primary)', fontSize: '0.875rem', opacity: 0.7 }}>#{idx+1}</span>
                    {ex.name}
                    {ex.isCircuit && <Link size={16} color="var(--color-streak-plan)" />}
                    {ex.dropped && <span style={{ color: 'var(--color-danger)', fontSize: '1rem', fontWeight: 900 }}>✕</span>}
                </h3>
                {ex.notes && (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <ClipboardList size={14} style={{ marginTop: '2px' }} /> {ex.notes}
                    </p>
                )}
            </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'flex-start' }}>
            {renderGroupedSets(ex.sets)}
        </div>

        {/* Render swap children */}
        {ex.children && ex.children.length > 0 && (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {ex.children.map((child, cIdx) => (
              <div key={child.id} style={{ paddingLeft: '1rem', borderLeft: '2px solid var(--color-primary)', marginLeft: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <ArrowRight size={14} color="var(--color-primary)" />
                  <strong style={{ fontSize: '1rem' }}>{child.name || `Swap ${cIdx + 1}`}</strong>
                </div>
                {child.notes && (
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                    <ClipboardList size={12} style={{ marginRight: '0.25rem' }} />{child.notes}
                  </p>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  {renderGroupedSets(child.sets)}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );

  return (
    <div className="workout-modal-overlay">
      <div className="card glass full-screen-modal" style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div className="form-header" style={{ padding: '1.5rem 2rem', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                {formatDate(workout.date)}
            </span>
            <h2 style={{ margin: 0, fontSize: '1.75rem' }}>{workout.type || t('untiltled_workout', 'Untitled Workout')}</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="icon-btn" onClick={() => onEdit(workout)} title={t('edit', 'Edit')}><Edit3 size={20} /></button>
              <button className="icon-btn" onClick={() => onDelete(workout.id)} style={{ color: 'var(--color-danger)' }} title={t('delete', 'Delete')}><Trash2 size={20} /></button>
              <div style={{ width: '1px', background: 'var(--color-border)', margin: '0 0.5rem' }} />
              <button className="icon-btn" onClick={onClose}><X size={24} /></button>
          </div>
        </div>

        <div className="form-body" style={{ overflowY: 'auto', padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '2.5rem', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
             {workout.duration && (
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                 <div style={{ backgroundColor: 'var(--color-bg-input)', padding: '0.75rem', borderRadius: '50%' }}><Clock size={20} color="var(--color-primary)" /></div>
                 <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>{t('duration', 'Duration')}</div>
                    <strong style={{ fontSize: '1.125rem' }}>{workout.duration} min</strong>
                 </div>
             </div>
             )}
             {workout.bodyWeight && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ backgroundColor: 'var(--color-bg-input)', padding: '0.75rem', borderRadius: '50%' }}><Scale size={20} color="var(--color-primary)" /></div>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>{t('weight', 'Weight')}</div>
                        <strong style={{ fontSize: '1.125rem' }}>{workout.bodyWeight} {unit}</strong>
                    </div>
                </div>
             )}
             {workout.supplements && workout.supplements.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ backgroundColor: 'var(--color-bg-input)', padding: '0.75rem', borderRadius: '50%' }}><Zap size={20} color="var(--color-primary)" /></div>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>{t('supps', 'Supps')}</div>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>{workout.supplements.map(s => <span key={s} style={{ fontSize: '0.75rem', fontWeight: 600 }}>{s}</span>)}</div>
                    </div>
                </div>
             )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
             {workout.exercises.map((ex, idx) => renderExercise(ex, idx))}
          </div>

          {workout.notes && (
              <div style={{ marginTop: '3rem', maxWidth: '850px', padding: '1.5rem', borderLeft: '4px solid var(--color-primary)', backgroundColor: 'var(--color-bg-input)', borderRadius: '0 var(--radius-md) var(--radius-md) 0', textAlign: 'left' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--color-primary)' }}>{t('notes_label', 'ЗАМЕТКИ')}</h4>
                  <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>{workout.notes}</p>
              </div>
          )}
        </div>

        <div className="form-footer" style={{ padding: '1.5rem 2rem' }}>
            <button className="btn-secondary" onClick={onClose}>{t('close', 'Close')}</button>
            <button className="btn-primary" onClick={() => onEdit(workout)}>{t('edit_workout', 'Edit Workout')}</button>
        </div>
      </div>
    </div>
  );
};
