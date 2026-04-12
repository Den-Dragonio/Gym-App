import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, Trash2, CheckCircle2, ChevronDown, Link, Unlink, Clock, MessageSquare,
  ArrowRight, X
} from 'lucide-react';
import './WorkoutForm.css';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getUserDocument, updateWorkout } from '../firebase/db';

const DEFAULT_WORKOUT_NAMES = ['Split', 'Full Body', 'Cardio', 'Chest & Triceps', 'Back & Biceps', 'Leg Day', 'Dancing', 'Boxing', 'Basketball', 'Football', 'Tennis', 'Swimming', 'Yoga', 'Pilates'];
const DEFAULT_EXERCISES = ['Bench Press', 'Squat', 'Deadlift', 'Pull-up', 'Push-up', 'Bicep Curl', 'Sprint', 'Leg Press'];
const DEFAULT_SUPPLEMENTS = ['Magnesium', 'Collagen', 'Vitamin B', 'Vitamin C', 'BCAA', 'Whey Protein', 'Arginine'];

interface SetDetails {
  id: string;
  weight: string; 
  reps: string;
  tags: RirTag[];
}

type SetField = 'weight' | 'reps' | 'tags';

interface ExerciseRow {
  id: string;
  name: string;
  isCircuit: boolean; 
  sets: SetDetails[];
  notes?: string;
  dropped?: boolean;
  children?: ExerciseRow[]; // swapped exercises (max 5 deep)
}

interface WorkoutFormProps {
  onClose: () => void;
  date: Date;
  initialData?: any;
  onSuccess?: (workout: any) => void;
}

const makeEmptySets = (prefix: string): SetDetails[] => [
  { id: `${prefix}-1`, weight: '', reps: '', tags: [] },
  { id: `${prefix}-2`, weight: '', reps: '', tags: [] },
  { id: `${prefix}-3`, weight: '', reps: '', tags: [] }
];

const TAG_COLOR_MAP: Record<string, string> = {
  warmup: 'rgba(59, 130, 246, 0.4)',      // Blue
  approx: 'rgba(148, 163, 184, 0.4)',      // Gray/Slate
  rir_2_3: 'rgba(34, 197, 94, 0.4)',      // Green
  till_failure: 'rgba(234, 179, 8, 0.4)',  // Yellow/Orange (&)
  failure: 'rgba(239, 68, 68, 0.4)',       // Red (&&)
  cheating: 'rgba(168, 85, 247, 0.4)'      // Purple (ch)
};

const getSetBoxBackground = (tags: RirTag[]) => {
  if (tags.length === 0) return 'var(--color-bg-card)';
  if (tags.length === 1) return TAG_COLOR_MAP[tags[0]];
  
  const colors = tags.map(t => TAG_COLOR_MAP[t] || 'var(--color-bg-card)');
  return `linear-gradient(135deg, ${colors.join(', ')})`;
};

const oldColorToTag = (color: string): RirTag => {
  switch(color) {
    case 'warmup': return 'warmup';
    case 'approx': return 'approx';
    case 'green': return 'rir_2_3';
    case 'red0': case 'red': return 'till_failure';
    case 'redNeg': return 'failure';
    case 'cheating': return 'cheating';
    default: return 'approx';
  }
};

export const WorkoutForm = ({ onClose, date, initialData, onSuccess }: WorkoutFormProps) => {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();
  const { formatDate } = useSettings();
  const unit = i18n.language === 'uk' ? 'кг' : 'kg';
  
  const [workoutName, setWorkoutName] = useState(initialData?.type || '');
  const [bodyWeight, setBodyWeight] = useState(initialData?.bodyWeight || '');
  const [showWorkoutDropdown, setShowWorkoutDropdown] = useState(false);
  const [durationStr, setDurationStr] = useState(initialData?.duration || ''); 
  const [notes, setNotes] = useState(initialData?.notes || '');
  
  const [selectedSupplements, setSelectedSupplements] = useState<string[]>(initialData?.supplements || []);
  const [suppDropdownOpen, setSuppDropdownOpen] = useState(false);

  const [focusedExerciseRow, setFocusedExerciseRow] = useState<string | null>(null);

  // Dynamic lists from profile
  const [userWorkoutNames, setUserWorkoutNames] = useState<string[]>(DEFAULT_WORKOUT_NAMES);
  const [userSupplements, setUserSupplements] = useState<string[]>(DEFAULT_SUPPLEMENTS);
  const [userExercises, setUserExercises] = useState<string[]>(DEFAULT_EXERCISES);

  useEffect(() => {
    const fetchUserLists = async () => {
      if (!currentUser?.uid) return;
      const profile = await getUserDocument(currentUser.uid);
      if (profile) {
        if (profile.workoutNames) setUserWorkoutNames(profile.workoutNames);
        if (profile.supplements) setUserSupplements(profile.supplements);
        if (profile.exerciseNames) setUserExercises(profile.exerciseNames);
      }
    };
    fetchUserLists();
  }, [currentUser, initialData]);

  const [rows, setRows] = useState<ExerciseRow[]>(() => {
    if (initialData?.exercises) {
        return initialData.exercises.map((row: any) => ({
            ...row,
            sets: row.sets.map((s: any) => ({
                ...s,
                tags: s.tags || (s.rirColor ? [oldColorToTag(s.rirColor)] : [])
            }))
        }));
    }
    const initialRows: ExerciseRow[] = [];
    for (let i = 0; i < 5; i++) {
        initialRows.push({
            id: `row-${i}`,
            name: '',
            isCircuit: false,
            notes: '',
            sets: makeEmptySets(`set-${i}`)
        });
    }
    return initialRows;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addRow = () => {
    const id = Date.now().toString();
    setRows([...rows, {
      id,
      name: '',
      isCircuit: false,
      notes: '',
      sets: makeEmptySets(`s-${id}`)
    }]);
  };

  const removeRow = (rowId: string) => {
    setRows(rows.filter(r => r.id !== rowId));
  };

  const updateRow = (rowId: string, field: string, value: any) => {
    setRows(rows.map(r => r.id === rowId ? { ...r, [field]: value } : r));
  };

  // --- Drop: simple toggle ---
  const toggleDrop = (rowId: string) => {
    setRows(rows.map(r => r.id === rowId ? { ...r, dropped: !r.dropped } : r));
  };

  // --- Swap: add child exercise row (max 5 deep) ---
  const getSwapDepth = (row: ExerciseRow): number => {
    if (!row.children || row.children.length === 0) return 0;
    return row.children.length;
  };

  const addSwap = (rowId: string) => {
    setRows(rows.map(r => {
      if (r.id === rowId) {
        const depth = getSwapDepth(r);
        if (depth >= 5) return r;
        const childId = `swap-${rowId}-${Date.now()}`;
        const newChild: ExerciseRow = {
          id: childId,
          name: '',
          isCircuit: false,
          notes: '',
          sets: makeEmptySets(childId),
        };
        return { ...r, children: [...(r.children || []), newChild] };
      }
      return r;
    }));
  };

  const updateChild = (parentId: string, childId: string, field: string, value: any) => {
    setRows(rows.map(r => {
      if (r.id === parentId && r.children) {
        return {
          ...r,
          children: r.children.map(c => c.id === childId ? { ...c, [field]: value } : c)
        };
      }
      return r;
    }));
  };

  const removeChild = (parentId: string, childId: string) => {
    setRows(rows.map(r => {
      if (r.id === parentId && r.children) {
        return { ...r, children: r.children.filter(c => c.id !== childId) };
      }
      return r;
    }));
  };

  const updateChildSet = (parentId: string, childId: string, setId: string, field: SetField, value: any) => {
    let finalValue = value;
    if (field === 'weight') finalValue = validateWeight(value);
    setRows(rows.map(r => {
      if (r.id === parentId && r.children) {
        return {
          ...r,
          children: r.children.map(c => {
            if (c.id === childId) {
              return { ...c, sets: c.sets.map(s => {
                if (s.id === setId) {
                  if (field === 'tags') {
                    const tag = value as RirTag;
                    const tags = s.tags.includes(tag) ? s.tags.filter(t => t !== tag) : [...s.tags, tag];
                    return { ...s, tags };
                  }
                  return { ...s, [field]: finalValue };
                }
                return s;
              }) };
            }
            return c;
          })
        };
      }
      return r;
    }));
  };

  const addSetToChild = (parentId: string, childId: string) => {
    setRows(rows.map(r => {
      if (r.id === parentId && r.children) {
        return {
          ...r,
          children: r.children.map(c => {
            if (c.id === childId) {
              const lastSet = c.sets[c.sets.length - 1];
              return { ...c, sets: [...c.sets, { id: Date.now().toString(), weight: lastSet?.weight || '', reps: lastSet?.reps || '', tags: lastSet?.tags || [] }] };
            }
            return c;
          })
        };
      }
      return r;
    }));
  };

  const removeSetFromChild = (parentId: string, childId: string, setId: string) => {
    setRows(rows.map(r => {
      if (r.id === parentId && r.children) {
        return {
          ...r,
          children: r.children.map(c => {
            if (c.id === childId) {
              if (c.sets.length <= 1) return c;
              return { ...c, sets: c.sets.filter(s => s.id !== setId) };
            }
            return c;
          })
        };
      }
      return r;
    }));
  };

  const validateWeight = (val: string) => {
      return val.replace(/[^0-9.,]/g, '');
  };

  const updateSet = (rowId: string, setId: string, field: SetField, value: any) => {
    let finalValue = value;
    if (field === 'weight') finalValue = validateWeight(value);
    setRows(rows.map(r => {
      if (r.id === rowId) {
        return { ...r, sets: r.sets.map(s => {
          if (s.id === setId) {
            if (field === 'tags') {
              const tag = value as RirTag;
              const tags = s.tags.includes(tag) ? s.tags.filter(t => t !== tag) : [...s.tags, tag];
              return { ...s, tags };
            }
            return { ...s, [field]: finalValue };
          }
          return s;
        }) };
      }
      return r;
    }));
  };

  const addSetToRow = (rowId: string) => {
    setRows(rows.map(r => {
      if (r.id === rowId) {
        const lastSet = r.sets[r.sets.length - 1];
        return { ...r, sets: [...r.sets, { id: Date.now().toString(), weight: lastSet ? lastSet.weight : '', reps: lastSet ? lastSet.reps : '', tags: lastSet ? lastSet.tags : [] }] };
      }
      return r;
    }));
  };

  const removeSetFromRow = (rowId: string, setId: string) => {
    setRows(rows.map(r => {
      if (r.id === rowId) {
        if (r.sets.length <= 1) return r; 
        return { ...r, sets: r.sets.filter(s => s.id !== setId) };
      }
      return r;
    }));
  };

  const toggleSupplement = (supp: string) => {
    if (!selectedSupplements.includes(supp)) {
      setSelectedSupplements([...selectedSupplements, supp]);
    }
    setSuppDropdownOpen(false);
  };

  const handleSave = async () => {
     if (!currentUser?.uid) return;
     const workoutData = {
        userId: currentUser.uid,
        date: initialData?.date || date.toISOString(),
        type: workoutName,
        duration: durationStr,
        bodyWeight: bodyWeight,
        supplements: selectedSupplements,
        notes: notes,
        exercises: rows.filter(r => r.name.trim() !== '')
      };

     try {
       if (initialData?.id) {
          await updateWorkout(initialData.id, workoutData);
          if (onSuccess) onSuccess({ id: initialData.id, ...workoutData });
       } else {
          const docRef = await addDoc(collection(db, 'workouts'), workoutData);
          if (onSuccess) onSuccess({ id: docRef.id, ...workoutData });
       }
       onClose();
     } catch (err) {
       console.error(err);
     }
  };

  // Render a set box (shared)
  const renderSetBox = (set: SetDetails, sIdx: number, onUpdate: (setId: string, field: SetField, value: any) => void, onRemove: (setId: string) => void) => (
    <div key={set.id} className="set-box" style={{ background: getSetBoxBackground(set.tags) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '0.25rem' }}>
        <span className="set-label">S{sIdx+1}</span>
        <button className="del-set" onClick={() => onRemove(set.id)}>&times;</button>
      </div>
      <div className="set-inputs">
        <input type="text" className="weight-input" placeholder={unit} value={set.weight} onChange={(e) => onUpdate(set.id, 'weight', e.target.value)} />
        <span className="set-divider">×</span>
        <input type="text" className="reps-input" placeholder="rps" value={set.reps} onChange={(e) => onUpdate(set.id, 'reps', e.target.value)} />
      </div>
      <div className="set-tags-grid">
         {[
           { id: 'warmup', label: 'W', color: 'warmup', title: 'Warmup / Разминка' },
           { id: 'approx', label: '~', color: 'approx', title: 'Approx / Примерно' },
           { id: 'rir_2_3', label: '@', color: 'rir-2-3', title: 'RIR 2-3' },
           { id: 'till_failure', label: '&', color: 'till-failure', title: 'Until Failure / До отказа' },
           { id: 'failure', label: '&&', color: 'failure', title: 'Beyond Failure / Отказ' },
           { id: 'cheating', label: 'ch', color: 'cheating', title: 'Cheat / Читинг' }
         ].map(tag => (
           <button 
             key={tag.id}
             title={tag.title}
             className={`tag-btn tag-${tag.color} ${set.tags.includes(tag.id as RirTag) ? 'active' : ''}`}
             onClick={() => onUpdate(set.id, 'tags', tag.id)}
           >
             {tag.label}
           </button>
         ))}
      </div>
    </div>
  );

  return (
    <div className="workout-modal-overlay">
      <div className="workout-form card glass full-screen-modal">
        <div className="form-header">
          <div style={{display: 'flex', flexDirection: 'column'}}>
             <span style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 600 }}>{formatDate(date.toISOString())}</span>
             <h2>{initialData ? t('edit_workout', 'Edit Workout') : t('log_workout', 'Log Workout')}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ transform: 'scale(1.2)' }}>&times;</button>
        </div>

        <div className="form-body no-scroll-wrapper">
          <div className="header-meta">
            <div className="workout-title-row">
                <div className="workout-title-container">
                <input 
                    type="text" 
                    className="input-field header-input minimal" 
                    placeholder="Workout Type (e.g. Cardio, Chest...)"
                    value={workoutName}
                    onFocus={() => setShowWorkoutDropdown(true)}
                    onBlur={() => setTimeout(() => setShowWorkoutDropdown(false), 200)}
                    onChange={e => setWorkoutName(e.target.value)}
                    style={{ textAlign: 'left' }}
                />
                {showWorkoutDropdown && (
                    <div className="autocomplete-dropdown glass" style={{ width: '300px', left: '0' }}>
                    {userWorkoutNames.filter(n => n.toLowerCase().includes(workoutName.toLowerCase())).map(name => (
                        <div key={name} className="autocomplete-item" onClick={() => setWorkoutName(name)}>
                        {name}
                        </div>
                    ))}
                    </div>
                )}
                </div>

                <div className="workout-duration-container">
                    <Clock size={18} color="var(--color-primary)" />
                    <input 
                      type="number" 
                      className="minimal" 
                      style={{width: '60px', background: 'transparent', textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold'}} 
                      placeholder="—"
                      value={durationStr} 
                      onChange={e => setDurationStr(e.target.value)} 
                    />
                    <span style={{color: 'var(--color-text-secondary)', fontSize: '0.875rem'}}>min</span>
                </div>
                
                <div className="workout-duration-container" style={{marginLeft: '0.5rem'}} title="Current Bodyweight">
                    <span>⚖️</span>
                    <input 
                      type="text" 
                      className="minimal" 
                      style={{width: '80px', background: 'transparent', textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold'}} 
                      value={bodyWeight} 
                      onChange={e => setBodyWeight(validateWeight(e.target.value))} 
                    />
                    <span style={{color: 'var(--color-text-secondary)', fontSize: '0.875rem'}}>{unit}</span>
                </div>
            </div>

            <div className="supplements-section" style={{ justifyContent: 'flex-start' }}>
              <div style={{ position: 'relative' }}>
                <button className="btn-secondary add-supp-btn" onClick={() => setSuppDropdownOpen(!suppDropdownOpen)}>
                  + Supps <ChevronDown size={14} />
                </button>
                {suppDropdownOpen && (
                  <div className="supp-dropdown glass">
                    {userSupplements.filter(s => !selectedSupplements.includes(s)).map(supp => (
                      <div key={supp} className="supp-item" onClick={() => toggleSupplement(supp)}>{supp}</div>
                    ))}
                  </div>
                )}
              </div>
              <div className="supp-tags">
                {selectedSupplements.map(supp => (
                  <span key={supp} className="supp-tag">
                    {supp} <button onClick={() => setSelectedSupplements(selectedSupplements.filter(s => s !== supp))}>&times;</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="table-scroll-area">
              {rows.map((row, index) => (
                <div key={row.id} className={`exercise-card ${row.dropped ? 'exercise-dropped' : ''}`}>
                  {/* Row 1: Circuit + Exercise Name + Delete */}
                  <div className="exercise-card-header" style={{ position: 'relative' }}>
                    <button 
                       className={`circuit-btn ${row.isCircuit ? 'active' : ''}`} 
                       onClick={() => updateRow(row.id, 'isCircuit', !row.isCircuit)}
                       title="Super-Set"
                    >
                      {row.isCircuit ? <Link size={16} /> : <Unlink size={16} color="var(--color-text-tertiary)" />}
                    </button>

                    <input 
                      type="text" 
                      className="input-field minimal exercise-name-input" 
                      placeholder={t('exercise_name', 'Exercise name...')}
                      value={row.name}
                      onFocus={() => setFocusedExerciseRow(row.id)}
                      onBlur={() => setTimeout(() => setFocusedExerciseRow(null), 200)}
                      onChange={e => updateRow(row.id, 'name', e.target.value)}
                      style={row.dropped ? { textDecoration: 'line-through', opacity: 0.5 } : undefined}
                    />
                    <button className="icon-btn" onClick={() => removeRow(row.id)} style={{ color: 'var(--color-text-tertiary)' }}>
                      <Trash2 size={16}/>
                    </button>

                    {focusedExerciseRow === row.id && (
                      <div className="autocomplete-dropdown glass" style={{position: 'absolute', top: '42px', left: '2rem', zIndex: 50, width: 'calc(100% - 5rem)'}}>
                        {userExercises.filter(ex => ex.toLowerCase().includes(row.name.toLowerCase())).map(ex => (
                          <div key={ex} className="autocomplete-item" onClick={() => updateRow(row.id, 'name', ex)}>{ex}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Row 2: Sets + action buttons */}
                  <div className="exercise-sets-row" style={{ paddingLeft: '2rem' }}>
                    {row.sets.map((set, sIdx) => renderSetBox(set, sIdx, (setId, field, value) => updateSet(row.id, setId, field, value), (setId) => removeSetFromRow(row.id, setId)))}
                    
                    {/* Drop marker after last set */}
                    {row.dropped && <span className="drop-marker" title={t('dropped', 'Dropped')}>✕</span>}
                    
                    <button className="add-set-mini" onClick={() => addSetToRow(row.id)} title="Add Set">+</button>
                    <button className="action-btn-mini swap-btn" onClick={() => addSwap(row.id)} title={t('swap_exercise', 'Switch Exercise')} disabled={getSwapDepth(row) >= 5}>
                      <ArrowRight size={16} />
                    </button>
                    <button className={`action-btn-mini drop-btn ${row.dropped ? 'drop-active' : ''}`} onClick={() => toggleDrop(row.id)} title={t('drop_exercise', 'Drop Exercise')}>
                      <X size={16} />
                    </button>
                  </div>

                  {/* Swap children (indented sub-exercises) */}
                  {row.children && row.children.map((child, cIdx) => (
                    <div key={child.id} className="swap-child-row" style={{ marginLeft: `${Math.min(cIdx + 1, 3) * 1.5}rem` }}>
                      <div className="swap-arrow-line">
                        <ArrowRight size={14} color="var(--color-primary)" />
                      </div>
                      <div className="swap-child-content">
                        <div className="exercise-card-header">
                          <input 
                            type="text" 
                            className="input-field minimal exercise-name-input" 
                            placeholder={t('new_exercise', 'New exercise...')}
                            value={child.name}
                            onChange={e => updateChild(row.id, child.id, 'name', e.target.value)}
                          />
                          <button className="icon-btn" onClick={() => removeChild(row.id, child.id)} style={{ color: 'var(--color-text-tertiary)' }}>
                            <Trash2 size={14}/>
                          </button>
                        </div>
                        <div className="exercise-sets-row">
                          {child.sets.map((set, sIdx) => renderSetBox(set, sIdx, (setId, field, value) => updateChildSet(row.id, child.id, setId, field, value), (setId) => removeSetFromChild(row.id, child.id, setId)))}
                          <button className="add-set-mini" onClick={() => addSetToChild(row.id, child.id)} title="Add Set">+</button>
                        </div>
                        <div className="exercise-note-row" style={{ opacity: child.notes ? 1 : 0.5, paddingLeft: 0 }}>
                          <MessageSquare size={12} color="var(--color-primary)" />
                          <input type="text" className="exercise-note-input" placeholder={t('ex_notes', 'Note...')} value={child.notes || ''} onChange={e => updateChild(row.id, child.id, 'notes', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Row 3: Exercise note */}
                  <div className="exercise-note-row" style={{ opacity: row.notes ? 1 : 0.5 }}>
                    <MessageSquare size={14} color="var(--color-primary)" />
                    <input type="text" className="exercise-note-input" placeholder={t('ex_notes', 'Note about this exercise...')} value={row.notes || ''} onChange={e => updateRow(row.id, 'notes', e.target.value)} />
                  </div>
                </div>
              ))}
              
              <button className="btn-secondary add-row-main" onClick={addRow}>
                <Plus size={16} /> {t('add_exercise', 'Add Exercise')}
              </button>

              <div className="session-notes-wrapper">
                <textarea className="input-field" placeholder={t('notes_placeholder', 'ЗАМЕТКИ')} rows={3} value={notes} onChange={e => setNotes(e.target.value)} style={{ fontWeight: 'bold', textAlign: 'left', width: '100%' }} />
              </div>
          </div>
        </div>

        <div className="form-footer">
          <button className="btn-secondary" onClick={onClose}>{t('cancel', 'Cancel')}</button>
          <button className="btn-primary flex-center" onClick={handleSave}>
            <CheckCircle2 size={18} /> {initialData ? t('update_workout', 'Update Workout') : t('save_workout', 'Finish Workout')}
          </button>
        </div>
      </div>
    </div>
  );
};
