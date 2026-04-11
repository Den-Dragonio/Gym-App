import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
    LogOut, User, Flame, Plus, Trash2, CalendarDays, 
    Users, Edit3, MapPin, Globe, CheckCircle, ShieldBan, AlertTriangle
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { updateUserProfile, getUserDocument } from '../firebase/db';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { ProgressChart } from '../components/ProgressChart';

const TITLE_OPTIONS = [
  'Coach',
  'Honored Coach',
  'European Champion',
  'World Champion',
  'Mr. Olympia',
  'Ms. Olympia',
  'National Champion',
  'Gym Legend',
  'Master of Sports',
  'Candidate Master of Sports',
  'Elite Athlete',
  'Fitness Enthusiast',
  'Beginner'
];

const DEFAULT_SUPPLEMENTS = ['Magnesium', 'Collagen', 'Vitamin B', 'Vitamin C', 'BCAA', 'Whey Protein', 'Arginine'];
const DEFAULT_WORKOUT_NAMES = ['Split', 'Full Body', 'Cardio', 'Chest & Triceps', 'Back & Biceps', 'Leg Day', 'Dancing', 'Boxing', 'Basketball', 'Football', 'Tennis', 'Swimming', 'Yoga', 'Pilates'];
const DEFAULT_EXERCISES = ['Bench Press', 'Squat', 'Deadlift', 'Pull-up', 'Push-up', 'Bicep Curl', 'Sprint', 'Leg Press', 'Overhead Press', 'Barbell Row', 'Dumbbell Curl', 'Lat Pulldown', 'Cable Fly', 'Leg Curl', 'Leg Extension', 'Calf Raise'];

interface GymLocation {
  id: string;
  name: string;
  location: string;
  url: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export const Profile = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser, logout, deleteAccount } = useAuth();
  const { theme, setTheme, system, setSystem } = useSettings();

  const isOwner = !uid || uid === currentUser?.uid;
  const targetUid = uid || currentUser?.uid;

  const [loadingProfile, setLoadingProfile] = useState(!!uid && uid !== currentUser?.uid);
  const [visitedUser, setVisitedUser] = useState<any>(null);

  const [friendsCount, setFriendsCount] = useState(0);

  useEffect(() => {
    if (!targetUid) return;
    const q = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', targetUid)
    );
    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      setFriendsCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [targetUid]);

  // Fetch visited profile if not owner
  useEffect(() => {
    const fetchVisited = async () => {
        if (!isOwner && uid) {
            setLoadingProfile(true);
            const data = await getUserDocument(uid);
            if (data) {
                setVisitedUser(data);
            }
            setLoadingProfile(false);
        } else {
            setVisitedUser(null);
            setLoadingProfile(false);
        }
    };
    fetchVisited();
  }, [uid, isOwner]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const displayUser = isOwner ? currentUser : visitedUser;

  // Stats / DB logic
  const [supplements, setSupplements] = useState<string[]>([]);
  const [workoutNames, setWorkoutNames] = useState<string[]>([]);
  const [exerciseNames, setExerciseNames] = useState<string[]>([]);
  const [daysPlan, setDaysPlan] = useState<string[]>([]);
  const [gender, setGender] = useState('Male');
  const [weight, setWeight] = useState('85');
  const [height, setHeight] = useState('182');
  const [bio, setBio] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPosition, setAvatarPosition] = useState(50);
  const [email, setEmail] = useState('');
  const [showEmail, setShowEmail] = useState(false);
  const [startYear, setStartYear] = useState('');
  const [benchPress, setBenchPress] = useState('100');
  const [squat, setSquat] = useState('140');
  const [deadlift, setDeadlift] = useState('180');
  const [gyms, setGyms] = useState<GymLocation[]>([]);

  // Initialize state from profile
  useEffect(() => {
      if (displayUser) {
          setSupplements(displayUser.supplements || DEFAULT_SUPPLEMENTS);
          setWorkoutNames(displayUser.workoutNames || DEFAULT_WORKOUT_NAMES);
          setExerciseNames(displayUser.exerciseNames || DEFAULT_EXERCISES);
          setDaysPlan(displayUser.daysPlan || ['Monday', 'Wednesday', 'Friday']);
          setGender(displayUser.gender || 'Male');
          setWeight(displayUser.weight || '85');
          setHeight(displayUser.height || '182');
          setBio(displayUser.bio || '');
          setFirstName(displayUser.firstName || '');
          setLastName(displayUser.lastName || '');
          setTitle(displayUser.title || '');
          setAvatarUrl(displayUser.avatarUrl || '');
          setAvatarPosition(displayUser.avatarPosition || 50);
          setEmail(displayUser.email || '');
          setShowEmail(displayUser.showEmail || false);
          setStartYear(displayUser.startYear || new Date().getFullYear().toString());
          setBenchPress(displayUser.benchPress || '0');
          setSquat(displayUser.squat || '0');
          setDeadlift(displayUser.deadlift || '0');
          setGyms(displayUser.gyms || []);
      }
  }, [displayUser]);

  const handleSaveProfile = async () => {
    if (!currentUser?.uid) return;
    setIsSaving(true);
    try {
        await updateUserProfile(currentUser.uid, {
            firstName, lastName, title, startYear,
            bio, avatarUrl, avatarPosition, email, showEmail, gender, weight, height, 
            benchPress, squat, deadlift, gyms, daysPlan, supplements, workoutNames, exerciseNames,
            theme,
            measurementSystem: system,
        });
        setIsEditing(false);
    } catch (e) {
        alert("Failed to save profile");
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation1 = window.confirm(t('delete_account_confirm1', "Are you absolutely sure you want to PERMANENTLY delete your account? All your workout history and social data will be lost forever."));
    if (!confirmation1) return;

    const confirmation2 = window.confirm(t('delete_account_confirm2', "This action CANNOT be undone. Proceed with deletion?"));
    if (!confirmation2) return;

    try {
        await deleteAccount();
        alert(t('account_deleted', "Your account has been successfully deleted."));
        navigate('/register');
    } catch (error: any) {
        if (error.message === "REAUTH_REQUIRED") {
            alert(t('reauth_required', "For security reasons, please log out and log back in before deleting your account."));
        } else {
            alert(t('delete_failed', "Failed to delete account. Please try again later."));
        }
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBlockUser = async () => {
      if (!currentUser?.uid || !uid) return;
      if (window.confirm("Are you sure you want to block this user?")) {
          const docId = `block_${currentUser.uid}_${uid}`;
          await setDoc(doc(db, 'blocks', docId), {
              blockerId: currentUser.uid,
              blockedId: uid,
              timestamp: new Date().toISOString()
          });
          alert("User blocked");
          navigate('/social');
      }
  };

  const addSupp = () => {
    if (newSupp && !supplements.includes(newSupp)) {
      setSupplements([...supplements, newSupp]);
      setNewSupp('');
    }
  };

  const addWorkoutName = () => {
    if (newWorkoutName && !workoutNames.includes(newWorkoutName)) {
      setWorkoutNames([...workoutNames, newWorkoutName]);
      setNewWorkoutName('');
    }
  };

  const addExerciseName = () => {
    if (newExerciseName && !exerciseNames.includes(newExerciseName)) {
      setExerciseNames([...exerciseNames, newExerciseName]);
      setNewExerciseName('');
    }
  };

  const addGym = () => {
    if (newGym.name) {
      const g: GymLocation = { 
        ...newGym, 
        id: Math.random().toString(36).substr(2, 9),
        startDate: newGym.startDate || new Date().toISOString().split('T')[0],
        endDate: newGym.isCurrent ? '' : (newGym.endDate || ''),
      };
      setGyms([...gyms, g]);
      setNewGym({ name: '', location: '', url: '', startDate: '', endDate: '', isCurrent: false });
    }
  };

  const removeGym = (id: string) => {
    setGyms(gyms.filter(g => g.id !== id));
  };


  const [newSupp, setNewSupp] = useState('');
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newGym, setNewGym] = useState({ 
    name: '', 
    location: '', 
    url: '', 
    startDate: '', 
    endDate: '', 
    isCurrent: false 
  });

  // Stats logic
  const [stats, setStats] = useState({
      total: 0,
      first: 'N/A',
      last: 'N/A',
      longest: '0m',
      dailyStreak: 0,
      planStreak: 0,
      chartData: [] as any[]
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!targetUid) return;
      const q = query(
        collection(db, 'workouts'),
        where('userId', '==', targetUid),
        orderBy('date', 'asc')
      );
      const snapshot = await getDocs(q);
      const workouts = snapshot.docs.map((d: any) => d.data());
      
      if (workouts.length > 0) {
        const firstDate = new Date(workouts[0].date).toLocaleDateString();
        const lastDate = new Date(workouts[workouts.length - 1].date).toLocaleDateString();
        const maxDuration = Math.max(...workouts.map((w: any) => parseInt(w.duration) || 0));

        // Streak Aggregation
        const workoutDates = [...new Set(workouts.map((w: any) => new Date(w.date).toISOString().split('T')[0]))].sort().reverse();
        
        // Daily Streak logic
        let dailyStreak = 0;
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

        // Plan Streak logic
        let planStreak = 0;
        if (daysPlan && daysPlan.length > 0) {
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
                if (planStreak > 1000 || currentCheck.getTime() < new Date(workouts[0].date).getTime() - 86400000) break;
            }
        }

        const chartData = workouts.map((w: any) => {
            let bench = 0, squat = 0, deadlift = 0;
            w.exercises.forEach((ex: any) => {
                const name = ex.name.toLowerCase();
                const maxW = Math.max(...ex.sets.map((s: any) => parseFloat(s.weight) || 0));
                if (name.includes('bench')) bench = Math.max(bench, maxW);
                if (name.includes('squat')) squat = Math.max(squat, maxW);
                if (name.includes('deadlift')) deadlift = Math.max(deadlift, maxW);
            });
            return {
                date: w.date,
                weight: parseFloat(w.bodyWeight) || null,
                bench: bench > 0 ? bench : null,
                squat: squat > 0 ? squat : null,
                deadlift: deadlift > 0 ? deadlift : null,
            };
        });

        setStats({
          total: workouts.length,
          first: firstDate,
          last: lastDate,
          longest: `${maxDuration}m`,
          dailyStreak,
          planStreak,
          chartData
        });
      }
    };
    fetchStats();
  }, [targetUid, daysPlan]);

  const experienceYears = new Date().getFullYear() - parseInt(startYear || '0');
  const regDate = displayUser?.createdAt ? new Date(displayUser.createdAt).toLocaleDateString() : "01.01.2024";

  if (loadingProfile) return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('loading', 'Loading Profile...')}</div>;
  if (!displayUser && !isOwner) return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('user_not_found', 'User not found.')}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Header Profile Section */}
      <div className="card glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
         <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
            {isOwner ? (
                <button className="btn-secondary minimal" onClick={() => setIsEditing(!isEditing)}>
                    <Edit3 size={18} /> {isEditing ? t('cancel', 'Cancel') : t('edit_profile', 'Edit')}
                </button>
            ) : (
                <button className="btn-secondary minimal" style={{ color: 'var(--color-danger)' }} onClick={handleBlockUser}>
                    <ShieldBan size={18} /> {t('block', 'Block')}
                </button>
            )}
         </div>

         <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', objectPosition: `center ${avatarPosition}%`, border: '3px solid var(--color-primary)', boxShadow: 'var(--shadow-lg)' }}/>
            ) : (
                <div style={{ width: 100, height: 100, borderRadius: '50%', backgroundColor: 'var(--color-bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={48} color="var(--color-text-tertiary)" />
                </div>
            )}
            
            <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.75rem' }}>{firstName} {lastName}</h2>
                    {title && <span className="badge-premium" title={title}>{title.slice(0, 2).toUpperCase()}</span>}
                </div>
                <div style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '1rem', marginBottom: '0.75rem' }}>@{displayUser?.username}</div>
                
                <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--color-text-primary)', maxWidth: '500px' }}>
                    {bio}
                </p>
            </div>
         </div>

         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CalendarDays size={14}/> {regDate}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Users size={14}/> {t('friends', 'Friends')}: {friendsCount}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-streak-daily)', fontWeight: 700 }} title={t('daily_streak_desc', 'Consecutive days with any activity')}>
              <Flame size={14}/> {t('daily_streak', 'Daily')}: {stats.dailyStreak}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-streak-plan)', fontWeight: 700 }} title={t('plan_streak_desc', 'Consecutive plan days completed')}>
              <Flame size={14}/> {t('plan_streak', 'Plan')}: {stats.planStreak}
            </span>
          </div>

        </div>

        {isOwner && (
        <button className="btn-secondary" onClick={logout} style={{ color: 'var(--color-danger)', border: 'none', background: 'transparent', alignSelf: 'flex-end', fontSize: '0.875rem' }}>
          <LogOut size={16} /> {t('logout', 'Logout')}
        </button>
        )}

      {isEditing && isOwner && (
        <div className="card glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>{t('edit_profile', 'Edit Profile')}</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="label">{t('first_name', 'First Name')}</label>
              <input type="text" className="input-field" value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div>
              <label className="label">{t('last_name', 'Last Name')}</label>
              <input type="text" className="input-field" value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
            <div>
              <label className="label">{t('avatar', 'Avatar')}</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarUpload} 
                    style={{ display: 'none' }} 
                    id="avatar-upload" 
                    />
                    <label htmlFor="avatar-upload" className="btn-secondary minimal" style={{ cursor: 'pointer', padding: '0.5rem 1rem' }}>
                    {t('choose_file', 'Choose File')}
                    </label>
                </div>
                {avatarUrl && (
                    <div style={{ backgroundColor: 'var(--color-bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        <label className="label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem', display: 'block' }}>{t('center_avatar', 'Vertical Alignment')}</label>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={avatarPosition} 
                            onChange={e => setAvatarPosition(parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                        />
                    </div>
                )}
              </div>
            </div>
            <div>
              <label className="label">{t('title', 'Status/Title')}</label>
              <select className="input-field" value={title} onChange={e => setTitle(e.target.value)}>
                <option value="">{t('no_title', 'No Title')}</option>
                {TITLE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
             <label className="label">{t('bio', 'Bio')}</label>
             <textarea className="input-field" value={bio} onChange={e => setBio(e.target.value)} style={{ minHeight: '80px', resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="label">{t('email', 'Email')}</label>
              <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} />
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" checked={showEmail} onChange={e => setShowEmail(e.target.checked)} />
                <span style={{ fontSize: '0.8rem' }}>{t('show_email_publicly', 'Show email publicly')}</span>
              </div>
            </div>
            <div>
               <label className="label">{t('theme', 'Theme')}</label>
               <select className="input-field" value={theme} onChange={e => setTheme(e.target.value as any)}>
                  <option value="light">{t('theme_light', 'Light')}</option>
                  <option value="dark">{t('theme_dark', 'Dark')}</option>
                  <option value="system">{t('theme_system', 'System (OS)')}</option>
               </select>
            </div>
            <div>
               <label className="label">{t('system', 'System')}</label>
               <select className="input-field" value={system} onChange={e => setSystem(e.target.value as any)}>
                  <option value="metric">{t('metric', 'Metric')}</option>
                  <option value="imperial">{t('imperial', 'Imperial')}</option>
               </select>
            </div>
          </div>

          <button className="btn-primary" onClick={handleSaveProfile} disabled={isSaving}>
            {isSaving ? '...' : t('save_changes', 'Save Changes')}
          </button>

          {/* Danger Zone */}
          <div style={{ padding: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)', marginTop: '2rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                  <AlertTriangle size={18} /> {t('danger_zone', 'Danger Zone')}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                  {t('delete_account_desc', "Once you delete your account, there is no going back. Please be certain.")}
              </p>
              <button 
                  className="btn-secondary" 
                  style={{ backgroundColor: 'var(--color-danger)', color: 'white', borderColor: 'var(--color-danger)', fontSize: '0.875rem' }}
                  onClick={handleDeleteAccount}
              >
                  {t('delete_account', 'Delete My Account')}
              </button>
          </div>
        </div>
      )}

      {/* Stats and Analytics */}
      <div className="card glass" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>{t('progress_analytics', 'Analytics & Progress')}</h3>
          <div style={{ height: '350px' }}>
              <ProgressChart data={stats.chartData} />
          </div>
      </div>

      {/* Secondary Stats Group */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <div className="card glass" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Globe size={20} color="var(--color-primary)" /> {t('body_stats', 'Physical Stats')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t('weight', 'Weight')}</label>
                {isEditing && isOwner ? <input type="number" className="input-field minimal" value={weight} onChange={e=>setWeight(e.target.value)} /> : <div style={{fontWeight: 600, fontSize: '0.875rem'}}>{weight} kg</div>}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t('height', 'Height')}</label>
                {isEditing && isOwner ? <input type="number" className="input-field minimal" value={height} onChange={e=>setHeight(e.target.value)} /> : <div style={{fontWeight: 600, fontSize: '0.875rem'}}>{height} cm</div>}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t('gender', 'Gender')}</label>
                {isEditing && isOwner ? (
                    <select className="input-field minimal" value={gender} onChange={e=>setGender(e.target.value)}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                ) : <div style={{fontWeight: 600, fontSize: '0.875rem'}}>{gender}</div>}
              </div>
            </div>
        </div>

        <div className="card glass" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={20} color="var(--color-success)" /> {t('personal_bests', 'Records')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t('bench_press', 'Bench')}</label>
                {isEditing && isOwner ? <input type="number" className="input-field minimal" value={benchPress} onChange={e=>setBenchPress(e.target.value)} /> : <div style={{fontWeight: 600, fontSize: '0.875rem'}}>{benchPress}</div>}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t('squat', 'Squat')}</label>
                {isEditing && isOwner ? <input type="number" className="input-field minimal" value={squat} onChange={e=>setSquat(e.target.value)} /> : <div style={{fontWeight: 600, fontSize: '0.875rem'}}>{squat}</div>}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t('deadlift', 'Deadlift')}</label>
                {isEditing && isOwner ? <input type="number" className="input-field minimal" value={deadlift} onChange={e=>setDeadlift(e.target.value)} /> : <div style={{fontWeight: 600, fontSize: '0.875rem'}}>{deadlift}</div>}
              </div>
            </div>
            
            <div style={{ background: 'var(--color-bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem'}}>
                 <span style={{color: 'var(--color-text-secondary)'}}>{t('experience', 'Experience')}:</span> 
                 {isEditing && isOwner ? (
                    <input type="number" className="input-field minimal" value={startYear} onChange={e=>setStartYear(e.target.value)} style={{width: '60px'}} />
                 ) : (
                    <strong>{experienceYears > 0 ? `${experienceYears} years` : '< 1 year'}</strong>
                 )}
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem'}}>
                  <span style={{color: 'var(--color-text-secondary)'}}>{t('longest_workout', 'Longest Workout')}:</span> 
                  <strong>{stats.longest}</strong>
               </div>
               <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem'}}>
                  <span style={{color: 'var(--color-text-secondary)'}}>{t('first_workout', 'First Workout')}:</span> 
                  <strong>{stats.first}</strong>
               </div>
               <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <span style={{color: 'var(--color-text-secondary)'}}>{t('last_workout', 'Last Workout')}:</span> 
                  <strong>{stats.last}</strong>
               </div>
               <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.25rem'}}>
                  <span style={{color: 'var(--color-text-secondary)'}}>{t('total_workouts', 'Total Sessions')}:</span> 
                  <strong>{stats.total}</strong>
               </div>
             </div>
        </div>
      </div>

      {/* Gym Locations Section */}
      <div className="card glass" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin color="var(--color-primary)" size={20} /> {t('my_gyms', 'My Gyms')}
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {gyms.length === 0 && <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>No physical gyms visited yet.</p>}
          {[...gyms].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(gym => (
            <div key={gym.id} style={{ flex: '1 1 200px', backgroundColor: 'var(--color-bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', position: 'relative' }}>
              {isOwner && isEditing && (
                  <button style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', color: 'var(--color-danger)' }} onClick={() => removeGym(gym.id)}>
                      <Trash2 size={14} />
                  </button>
              )}
              <h4 style={{ margin: '0 0 0.25rem 0' }}>{gym.name}</h4>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                  {new Date(gym.startDate).toLocaleDateString()} — {gym.isCurrent ? t('present', 'Present') : (gym.endDate ? new Date(gym.endDate).toLocaleDateString() : '...')}
              </p>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{gym.location}</p>
              {gym.url && <a href={gym.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>Visit Website</a>}
            </div>
          ))}
          {isEditing && isOwner && (
              <div style={{ flex: '1 1 250px', backgroundColor: 'var(--color-bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '2px dashed var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h4 style={{margin: 0, fontSize: '0.875rem'}}>{t('add_gym', 'Add New Gym')}</h4>
                  <input type="text" className="input-field minimal" placeholder={t('gym_name', 'Gym Name')} value={newGym.name} onChange={e => setNewGym({...newGym, name: e.target.value})} />
                  <input type="text" className="input-field minimal" placeholder={t('gym_address', 'Address / City')} value={newGym.location} onChange={e => setNewGym({...newGym, location: e.target.value})} />
                  <input type="text" className="input-field minimal" placeholder={t('gym_website', 'Website URL')} value={newGym.url} onChange={e => setNewGym({...newGym, url: e.target.value})} />
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>{t('start_date', 'Start Date')}</label>
                          <input type="date" className="input-field minimal" value={newGym.startDate} onChange={e => setNewGym({...newGym, startDate: e.target.value})} />
                      </div>
                      {!newGym.isCurrent && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <label style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>{t('end_date', 'End Date')}</label>
                              <input type="date" className="input-field minimal" value={newGym.endDate} onChange={e => setNewGym({...newGym, endDate: e.target.value})} />
                          </div>
                      )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <input type="checkbox" id="currGym" checked={newGym.isCurrent} onChange={e => setNewGym({...newGym, isCurrent: e.target.checked})} />
                      <label htmlFor="currGym" style={{ fontSize: '0.75rem', cursor: 'pointer' }}>{t('training_here_now', 'Currently training here')}</label>
                  </div>

                  <button className="btn-secondary" style={{alignSelf: 'flex-start', marginTop: '0.5rem'}} onClick={addGym}><Plus size={16}/> Add Experience</button>
              </div>
          )}
        </div>
      </div>

      {/* Plan Settings */}
      {(isOwner || (daysPlan.length > 0)) && (
      <div className="card glass" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Flame color="var(--color-streak-plan)" size={20} /> {isOwner ? 'My Workout Plan' : 'Plan'}
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          {isOwner ? 'Select the days you plan to workout. Hitting these days will build your Plan Streak!' : 'The days this athlete plans to train.'}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
            <div 
              key={day}
              className={`btn-secondary ${daysPlan.includes(day) ? 'active' : ''}`}
              style={{
                  ...daysPlan.includes(day) ? { backgroundColor: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' } : { opacity: 0.5 },
                  cursor: isOwner && isEditing ? 'pointer' : 'default'
              }}
              onClick={() => isOwner && isEditing && setDaysPlan(daysPlan.includes(day) ? daysPlan.filter(d => d !== day) : [...daysPlan, day])}
            >
              {day.slice(0,3)}
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Custom lists managers */}
      {isEditing && isOwner && (
      <div className="card glass" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Manage Auto-complete Templates</h3>
        
        <label style={{ display: 'block', margin: '1rem 0 0.5rem', fontWeight: 600 }}>Workout Names</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {workoutNames.map(name => (
            <span key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-bg-input)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
              {name} 
              <button 
                style={{ color: 'var(--color-danger)' }} 
                onClick={() => setWorkoutNames(workoutNames.filter(n => n !== name))}
              >
                <Trash2 size={14} />
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="New Workout Name..." 
            value={newWorkoutName}
            onChange={e => setNewWorkoutName(e.target.value)}
          />
          <button className="btn-primary" onClick={addWorkoutName}><Plus size={16}/></button>
        </div>

        <label style={{ display: 'block', margin: '2rem 0 0.5rem', fontWeight: 600 }}>Supplements</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {supplements.map(supp => (
            <span key={supp} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-bg-input)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
              {supp} 
              <button 
                style={{ color: 'var(--color-danger)' }} 
                onClick={() => setSupplements(supplements.filter(s => s !== supp))}
              >
                <Trash2 size={14} />
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="New Supplement..." 
            value={newSupp}
            onChange={e => setNewSupp(e.target.value)}
          />
          <button className="btn-primary" onClick={addSupp}><Plus size={16}/></button>
        </div>

        <label style={{ display: 'block', margin: '2rem 0 0.5rem', fontWeight: 600 }}>Exercises</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {exerciseNames.map(ex => (
            <span key={ex} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-bg-input)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
              {ex} 
              <button 
                style={{ color: 'var(--color-danger)' }} 
                onClick={() => setExerciseNames(exerciseNames.filter(e => e !== ex))}
              >
                <Trash2 size={14} />
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="New Exercise..." 
            value={newExerciseName}
            onChange={e => setNewExerciseName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addExerciseName()}
          />
          <button className="btn-primary" onClick={addExerciseName}><Plus size={16}/></button>
        </div>

      </div>
      )}

    </div>
  );
};
