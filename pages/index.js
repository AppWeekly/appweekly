import React from 'react';
import {
  Page,
  Navbar,
  Link,
  Block,
  Button,
} from 'konsta/react';
import styles from './index.module.css';
import useAuth from "../useAuth";
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function Home() {
  const user = useAuth();

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error during Google sign-in:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (!user) {
    return (
      <div className={styles.loginPage}>
        <Page>
          <Navbar
            title="AppWeekly"
            subtitle="v0.1.0"
            className="top-0 sticky"
          />
          <div className={styles.loginContainer}>
            <Block strong className="space-y-4">
              <p>
                Welcome to AppWeekly! Please log-in to continue.
              </p>
              <p>
                <Button large onClick={handleGoogleSignIn}>Sign in with Google</Button>
              </p>
            </Block>
          </div>
        </Page>
      </div>
    );
  }

  return (
    <Page>
      <Navbar
        title="AppWeekly"
        subtitle="v0.1.0"
        className="top-0 sticky"
        right={<Link navbar onClick={handleLogout}>Logout</Link>}
      />

      <div className={styles.appContainer}>
        <div className={styles.app}>
          <div className={styles.appIcon}>
            {/* Add your app icon here */}
          </div>
          <div className={styles.appName}>
            App 1
          </div>
        </div>
        <div className={styles.app}>
          <div className={styles.appIcon}>
            {/* Add your app icon here */}
          </div>
          <div className={styles.appName}>
            App 2
          </div>
        </div>
      </div>
    </Page>
  );
}
