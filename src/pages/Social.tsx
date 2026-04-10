import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, UserPlus, UserCheck, ShieldBan, CalendarDays } from 'lucide-react';
import { db } from '../firebase/config';
import { 
    collection, query, where, getDocs, limit, 
    doc, setDoc, getDoc, onSnapshot
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export const Social = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [friends, setFriends] = useState<any[]>([]); 
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]); // IDs of users I blocked or who blocked me

  // Fetch blocks (both ways)
  useEffect(() => {
    if (!currentUser?.uid) return;

    // Use two queries because OR with array-contains can be tricky/limited
    const q1 = query(collection(db, 'blocks'), where('blockerId', '==', currentUser.uid));
    const q2 = query(collection(db, 'blocks'), where('blockedId', '==', currentUser.uid));

    const unsub1 = onSnapshot(q1, (snap) => {
        const ids = snap.docs.map(d => d.data().blockedId);
        setBlockedUsers(prev => Array.from(new Set([...prev, ...ids])));
    });
    const unsub2 = onSnapshot(q2, (snap) => {
        const ids = snap.docs.map(d => d.data().blockerId);
        setBlockedUsers(prev => Array.from(new Set([...prev, ...ids])));
    });

    return () => { unsub1(); unsub2(); };
  }, [currentUser]);

  // Fetch friends real-time
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
        collection(db, 'friendships'),
        where('users', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
        const friendships = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        const friendsData = await Promise.all(friendships.map(async (f: any) => {
            const friendId = f.users.find((id: string) => id !== currentUser.uid);
            
            // Skip if blocked
            if (blockedUsers.includes(friendId)) return null;

            const userRef = doc(db, 'users', friendId);
            const userSnap = await getDoc(userRef);
            return {
                id: friendId,
                since: f.since,
                ...(userSnap.exists() ? userSnap.data() : { username: 'Deleted User' })
            };
        }));
        setFriends(friendsData.filter(f => f !== null));
    });

    return () => unsubscribe();
  }, [currentUser, blockedUsers]);

  const handleSearch = async () => {
    const cleanQuery = searchQuery.toLowerCase().trim();
    if (!cleanQuery) return;
    
    setIsSearching(true);
    try {
        const q = query(
            collection(db, 'users'), 
            where('username', '==', cleanQuery),
            limit(1)
        );
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).filter(u => u.id !== currentUser?.uid && !blockedUsers.includes(u.id));
        
        setSearchResults(fetched);
    } catch (e) {
        console.error("Search failed", e);
    } finally {
        setIsSearching(false);
    }
  };

  const handleAddFriend = async (targetUser: any) => {
    if (!currentUser?.uid) return;
    
    const friendId = targetUser.id;
    const docId = [currentUser.uid, friendId].sort().join('_');
    
    try {
        await setDoc(doc(db, 'friendships', docId), {
            users: [currentUser.uid, friendId],
            uid1: currentUser.uid,
            uid2: friendId,
            since: new Date().toISOString()
        });
        setSearchQuery('');
        setSearchResults([]);
    } catch (e) {
        console.error("Failed to add friend", e);
    }
  };

  const isAlreadyFriend = (userId: string) => {
      return friends.some(f => f.id === userId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{t('social', 'Social')}</h1>

      {/* Global Username Explanation */}
      <div className="card glass" style={{ padding: '1.5rem' }}>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
           {t('social_desc', "Find friends by their exact username. You can view progress of people who have not blocked you.")}
        </p>
      </div>

      {/* Search */}
      <div className="card glass" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Search size={20} color="var(--color-text-tertiary)" />
        <input 
          type="text" 
          placeholder={t('search_placeholder', "Search by exact username...")}
          className="input-field minimal"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button className="btn-primary" onClick={handleSearch} disabled={isSearching}>
            {isSearching ? '...' : t('find', 'Find')}
        </button>
      </div>

      {searchQuery && (
        <div className="card glass" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>{t('search_results', 'Search Results')}</h3>
          {isSearching ? <p>{t('searching', 'Searching...')}</p> : (
            searchResults.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)' }}>{t('no_user_found', 'No users found or they have blocked you.')}</p>
            ) : (
              searchResults.map(user => (
                <div key={user.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg-card)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}/>
                        ) : (
                            <div style={{ width: 44, height: 44, backgroundColor: 'var(--color-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <UserCheck size={20} />
                            </div>
                        )}
                        <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${user.id}`)}>
                            <span style={{ fontWeight: 600, display: 'block' }}>@{user.username}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{user.firstName} {user.lastName}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-secondary minimal" onClick={() => navigate(`/profile/${user.id}`)}>
                           {t('view', 'View')}
                        </button>
                        {isAlreadyFriend(user.id) ? (
                            <span style={{ color: 'var(--color-success)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <UserCheck size={16}/> {t('already_friends', 'Friends')}
                            </span>
                        ) : (
                            <button className="btn-primary" onClick={() => handleAddFriend(user)}>
                                <UserPlus size={16}/> {t('add_friend', 'Add')}
                            </button>
                        )}
                    </div>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      )}

      {/* Friends List */}
      <div className="card glass" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserCheck size={20} color="var(--color-primary)" /> {t('my_friends', 'My Friends')}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {friends.length === 0 && <p style={{ color: 'var(--color-text-secondary)' }}>{t('no_friends', "You don't have any friends added.")}</p>}
          {friends.map(friend => (
               <div key={friend.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {friend.avatarUrl ? (
                            <img src={friend.avatarUrl} alt="Avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}/>
                        ) : (
                            <div style={{ width: 40, height: 40, backgroundColor: 'var(--color-bg-input)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <UserCheck size={18} color="var(--color-primary)"/>
                            </div>
                        )}
                        <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${friend.id}`)}>
                            <span style={{ fontWeight: 600, display: 'block' }}>@{friend.username}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <CalendarDays size={12}/> {t('friends_since', 'Friends since')}: {new Date(friend.since).toLocaleDateString()}
                            </span>
                        </div>
                   </div>
                   <button className="btn-secondary minimal" style={{ color: 'var(--color-danger)' }} onClick={() => navigate(`/profile/${friend.id}`)}>
                       <ShieldBan size={16}/>
                   </button>
               </div>
          ))}
        </div>
      </div>

    </div>
  );
};
