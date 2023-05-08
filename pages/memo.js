import React from 'react';
import {
  Page,
  Navbar,
  NavbarBackLink,
  Block,
  Button,
  BlockTitle,
  BlockHeader,
  List,
  ListInput,
  ListButton
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
        title="Memo"
        className="top-0 sticky"
        left={
          <NavbarBackLink text="Back" onClick={() => history.back()} />
        }
      />

      <BlockTitle>AI Generate Memo for your meetings</BlockTitle>
        <BlockHeader>
          Medium and Large will collapse to usual size on page scroll
        </BlockHeader>
        <List strong inset>
          <ListInput label="Video URL" type="url" placeholder="URL" />
          <ListButton>Generate</ListButton>
        </List>
    </Page>
  );
}