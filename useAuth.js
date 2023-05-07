import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

const useAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      authUser ? setUser(authUser) : setUser(null);
    });

    return () => unsubscribe();
  }, []);

  return user;
};

export default useAuth;