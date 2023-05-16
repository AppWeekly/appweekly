import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add a loading state

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setUser(user);
      setLoading(false); // Loading is finished once we get the user data
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { user, loading }; // Return the loading state
}