import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, Trash2, CheckCircle2, ChevronDown, Link, Unlink, Clock
} from 'lucide-react';
import './WorkoutForm.css';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getUserDocument } from '../firebase/db';

const DEFAULT_WORKOUT_NAMES = ['Split', 'Full Body', 'Cardio', 'Chest & Triceps', 'Back & Biceps', 'Leg Day', 'Dancing', 'Boxing', 'Basketball', 'Football', 'Tennis', 'Swimming', 'Yoga', 'Pilates'];
const MOCK_EXERCISES = ['Bench Press', 'Squat', 'Deadlift', 'Pull-up', 'Push-up', 'Bicep Curl', 'Sprint', 'Leg Press'];
const DEFAULT_SUPPLEMENTS = ['Magnesium', 'Collagen', 'Vitamin B', 'Vitamin C', 'BCAA', 'Whey Protein', 'Arginine'];

type RirColor = 'white' | 'red' | 'green' | 'cheating';

interface SetDetails {
  id: string;
  weight: string; 
  reps: string;
  rirColor: RirColor;
}

interface ExerciseRow {
  id: string;
  name: string;
  isCircuit: boolean; 
  sets: SetDetails[];
}

export const WorkoutForm = ({ onClose, date }: { onClose: () => void, date: Date }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  
  const [workoutName, setWorkoutName] = useState('');
  const [bodyWeight, setBodyWeight] = useState('');
  const [showWorkoutDropdown, setShowWorkoutDropdown] = useState(false);
  const [durationStr, setDurationStr] = useState('60'); // Minutes spent in gym
  const [notes, setNotes] = useState('');
  
  const [selectedSupplements, setSelectedSupplements] = useState<string[]>([]);
  const [suppDropdownOpen, setSuppDropdownOpen] = useState(false);

  const [focusedExerciseRow, setFocusedExerciseRow] = useState<string | null>(null);

  // Dynamic lists from profile
  const [userWorkoutNames, setUserWorkoutNames] = useState<string[]>(DEFAULT_WORKOUT_NAMES);
  const [userSupplements, setUserSupplements] = useState<string[]>(DEFAULT_SUPPLEMENTS);

  useEffect(() => {
    const fetchUserLists = async () => {
      if (!currentUser?.uid) return;
      const profile = await getUserDocument(currentUser.uid);
      if (profile) {
        if (profile.workoutNames) setUserWorkoutNames(profile.workoutNames);
        if (profile.supplements) setUserSupplements(profile.supplements);
        if (profile.weight && !bodyWeight) setBodyWeight(profile.weight);
      }
    };
    fetchUserLists();
  }, [currentUser]);

  const [rows, setRows] = useState<ExerciseRow[]>(() => {
    const initialRows: ExerciseRow[] = [];
    for (let i = 0; i < 5; i++) {
        initialRows.push({
            id: `row-${i}`,
            name: '',
            isCircuit: false,
            sets: [
                { id: `set-${i}-1`, weight: '', reps: '', rirColor: 'white' as RirColor },
                { id: `set-${i}-2`, weight: '', reps: '', rirColor: 'white' as RirColor },
                { id: `set-${i}-3`, weight: '', reps: '', rirColor: 'white' as RirColor }
            ]
        });
    }
    return initialRows;
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addRow = () => {
    setRows([...rows, {
      id: Date.now().toString(),
      name: '',
      isCircuit: false,
      sets: [
        { id: `s1-${Date.now()}`, weight: '', reps: '', rirColor: 'white' as RirColor },
        { id: `s2-${Date.now()}`, weight: '', reps: '', rirColor: 'white' as RirColor },
        { id: `s3-${Date.now()}`, weight: '', reps: '', rirColor: 'white' as RirColor }
      ]
    }]);
  };

  const removeRow = (rowId: string) => {
    setRows(rows.filter(r => r.id !== rowId));
  };

  const updateRow = (rowId: string, field: 'name' | 'isCircuit', value: any) => {
    setRows(rows.map(r => r.id === rowId ? { ...r, [field]: value } : r));
  };

  const updateSet = (rowId: string, setId: string, field: 'weight' | 'reps' | 'rirColor', value: string) => {
    setRows(rows.map(r => {
      if (r.id === rowId) {
        return {
          ...r,
          sets: r.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
        };
      }
      return r;
    }));
  };

  const addSetToRow = (rowId: string) => {
    setRows(rows.map(r => {
      if (r.id === rowId) {
        const lastSet = r.sets[r.sets.length - 1];
        return { 
          ...r, 
          sets: [...r.sets, { 
            id: Date.now().toString(), 
            weight: lastSet ? lastSet.weight : '', 
            reps: lastSet ? lastSet.reps : '', 
            rirColor: 'white' as RirColor 
          }] 
        };
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
     try {
       await addDoc(collection(db, 'workouts'), {
         userId: currentUser.uid,
         date: date.toISOString(),
         type: workoutName,
         duration: durationStr,
         bodyWeight: bodyWeight,
         supplements: selectedSupplements,
         notes: notes,
         exercises: rows.filter(r => r.name.trim() !== '')
       });
       alert('Workout Saved Successfully!');
       onClose();
     } catch (err) {
       console.error(err);
       alert('Error logging workout');
     }
  };

  return (
    <div className="workout-modal-overlay">
      <div className="workout-form card glass full-screen-modal">
        <div className="form-header">
          <div style={{display: 'flex', flexDirection: 'column'}}>
             <span style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 600 }}>{date.toLocaleDateString()}</span>
             <h2>{t('log_workout', 'Log Workout')}</h2>
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
                />
                {showWorkoutDropdown && (
                    <div className="autocomplete-dropdown glass">
                    {userWorkoutNames.filter(n => n.toLowerCase().includes(workoutName.toLowerCase())).map(name => (
                        <div key={name} className="autocomplete-item" onClick={() => setWorkoutName(name)}>
                        {name}
                        </div>
                    ))}
                    {workoutName && !userWorkoutNames.includes(workoutName) && (
                        <div className="autocomplete-item new">
                            "{workoutName}" will be used for this workout!
                        </div>
                    )}
                    </div>
                )}
                </div>

                <div className="workout-duration-container">
                    <Clock size={18} color="var(--color-primary)" />
                    <input 
                      type="number" 
                      className="minimal" 
                      style={{width: '50px', background: 'transparent', textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold'}} 
                      value={durationStr} 
                      onChange={e => setDurationStr(e.target.value)} 
                    />
                    <span style={{color: 'var(--color-text-secondary)', fontSize: '0.875rem'}}>min</span>
                </div>
                
                <div className="workout-duration-container" style={{marginLeft: '0.5rem'}} title="Current Bodyweight">
                    <span>⚖️</span>
                    <input 
                      type="number" 
                      className="minimal" 
                      style={{width: '50px', background: 'transparent', textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold'}} 
                      value={bodyWeight} 
                      onChange={e => setBodyWeight(e.target.value)} 
                    />
                    <span style={{color: 'var(--color-text-secondary)', fontSize: '0.875rem'}}>kg</span>
                </div>
            </div>

            <div className="supplements-section">
              <div style={{ position: 'relative' }}>
                <button 
                  className="btn-secondary add-supp-btn"
                  onClick={() => setSuppDropdownOpen(!suppDropdownOpen)}
                >
                  + Supps <ChevronDown size={14} />
                </button>
                {suppDropdownOpen && (
                  <div className="supp-dropdown glass">
                    {userSupplements.filter(s => !selectedSupplements.includes(s)).map(supp => (
                      <div key={supp} className="supp-item" onClick={() => toggleSupplement(supp)}>
                        {supp}
                      </div>
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
              <div className="workout-table">
                <div className="table-row table-head">
                  <div className="cell col-circ" title="Link to previous (Circuit)"></div>
                  <div className="cell col-ex">{t('exercise', 'Exercise')}</div>
                  <div className="cell col-sets-container">{t('sets', 'Sets (Weight × Reps)')}</div>
                  <div className="cell col-actions"></div>
                </div>

                {rows.map((row, index) => (
                  <div key={row.id} className="table-row">
                    <div className="cell col-circ">
                      {index > 0 && (
                        <button 
                           className={`circuit-btn ${row.isCircuit ? 'active' : ''}`} 
                           onClick={() => updateRow(row.id, 'isCircuit', !row.isCircuit)}
                           title="Join as Super-Set / Circuit with previous"
                        >
                          {row.isCircuit ? <Link size={16} /> : <Unlink size={16} color="var(--color-text-tertiary)" />}
                        </button>
                      )}
                    </div>

                    <div className="cell col-ex" style={{position: 'relative'}}>
                      <input 
                        type="text" 
                        className="input-field minimal cell-input" 
                        placeholder={t('exercise_name', 'Bench Press...')}
                        value={row.name}
                        onFocus={() => setFocusedExerciseRow(row.id)}
                        onBlur={() => setTimeout(() => setFocusedExerciseRow(null), 200)}
                        onChange={e => updateRow(row.id, 'name', e.target.value)}
                      />
                      {focusedExerciseRow === row.id && (
                        <div className="autocomplete-dropdown glass" style={{position: 'absolute', top: '100%', left: 0, zIndex: 50, width: '100%'}}>
                          {MOCK_EXERCISES.filter(ex => ex.toLowerCase().includes(row.name.toLowerCase())).map(ex => (
                            <div key={ex} className="autocomplete-item" onClick={() => updateRow(row.id, 'name', ex)}>
                              {ex}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="cell col-sets-container">
                      <div className="sets-row">
                        {row.sets.map((set, sIdx) => {
                          const prevSet = sIdx > 0 ? row.sets[sIdx - 1] : null;
                          const wIdentical = prevSet && prevSet.weight && set.weight === prevSet.weight;
                          const rIdentical = prevSet && prevSet.reps && set.reps === prevSet.reps;
                          
                          return (
                          <div key={set.id} className={`set-box rir-${set.rirColor}`}>
                            <span className="set-label">S{sIdx+1}</span>
                            <div className="set-inputs">
                              {wIdentical ? (
                                <span className="weight-input identical-placeholder">==</span>
                              ) : (
                                <input 
                                  type="text" inputMode="numeric" pattern="[0-9]*"
                                  className="input-field minimal weight-input" 
                                  placeholder="kg"
                                  value={set.weight}
                                  onChange={(e) => updateSet(row.id, set.id, 'weight', e.target.value)}
                                  title="Weight"
                                />
                              )}
                              
                              <span className="set-divider">×</span>
                              
                              {wIdentical && rIdentical ? (
                                <span className="reps-input identical-placeholder">==</span>
                              ) : (
                                <input 
                                  type="text" inputMode="numeric" pattern="[0-9]*"
                                  className="input-field minimal reps-input" 
                                  placeholder="rps"
                                  value={set.reps}
                                  onChange={(e) => updateSet(row.id, set.id, 'reps', e.target.value)}
                                  title="Reps"
                                />
                              )}
                            </div>
                            <select 
                              className="rir-select"
                              value={set.rirColor}
                              onChange={(e) => updateSet(row.id, set.id, 'rirColor', e.target.value as RirColor)}
                            >
                              <option value="white">⚪️ RIR</option>
                              <option value="green">🟢 2-3</option>
                              <option value="red">🔴 FAIL</option>
                              <option value="cheating">🟠 CHEAT</option>
                            </select>
                            <button className="del-set" onClick={() => removeSetFromRow(row.id, set.id)}>&times;</button>
                          </div>
                        )})}
                        <button className="add-set-mini" onClick={() => addSetToRow(row.id)} title="Add Set">+</button>
                      </div>
                    </div>

                    <div className="cell col-actions">
                      <button className="icon-btn del-row-btn" onClick={() => removeRow(row.id)} style={{marginTop: '0.5rem'}}>
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="btn-secondary add-row-main" onClick={addRow}>
                <Plus size={16} /> {t('add_exercise', 'Add Exercise')}
              </button>

              <div className="form-section" style={{ marginTop: '1.5rem' }}>
                <textarea 
                  className="input-field" 
                  placeholder={t('notes_placeholder', 'How did you feel today?')} 
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
          </div>
        </div>

        <div className="form-footer">
          <button className="btn-secondary" onClick={onClose}>{t('cancel', 'Cancel')}</button>
          <button className="btn-primary flex-center" onClick={handleSave}>
            <CheckCircle2 size={18} /> {t('save_workout', 'Finish Workout')}
          </button>
        </div>
      </div>
    </div>
  );
};
