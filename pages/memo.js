import React, { useState } from 'react';
import {
  Page,
  Navbar,
  NavbarBackLink,
  Block,
  BlockTitle,
  BlockHeader,
  List,
  ListInput,
  ListButton,
  Preloader,
  Link,
  f7,
  Button
} from 'konsta/react';
import styles from './index.module.css';
import useAuth from "../useAuth";
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { CopyToClipboard } from 'react-copy-to-clipboard';

export default function Home() {
  const user = useAuth();
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [memo, setMemo] = useState(null);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error during Google sign-in:', error);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/transcribe?videoUrl=${encodeURIComponent(videoUrl)}`);
      const data = await res.json();
      setMemo(data.memo);
    } catch (error) {
      f7.dialog.alert('An error occurred: ' + error.message);
    }
    setLoading(false);
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
            <p>Welcome to AppWeekly!</p>
              <p>
              This is an extension of my journey enabling us all to capture and utilize our best thoughts whenever inspiration strikes. Whether it's harnessing the power of AI or innovating other everyday tasks, I'm eager to learn, grow, and create alongside you. If you want to know more, be sure to subscribe to my <Link href="https://www.youtube.com/@AppWeeklyOfficial">YouTube channel</Link>.
              </p>
              <p>Let's begin this exciting journey together! ❤️</p>
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

      <BlockTitle>AI-Powered Meeting Memo</BlockTitle>
        <BlockHeader>
        Tired of manually summarizing your lengthy meetings? Simply provide the URL of your recorded video meeting, and AI will generate a comprehensive summary for you. Not just that, the AI extracts key points, conclusions, decisions, and even offers suggestions for improving your future meetings. Once the memo is generated, you can easily copy it to your clipboard with a single click.
        </BlockHeader>
        <List strong inset>
          <ListInput 
            label="Video URL" 
            type="url" 
            placeholder="URL" 
            value={videoUrl} 
            onInput={(e) => setVideoUrl(e.target.value)}
          />
          <ListButton onClick={handleGenerate}>
            {loading ? <Preloader /> : 'Generate'}
          </ListButton>
        </List>

        {memo && (
          <Block strong className="space-y-4">
            <p>{memo}</p>
            <CopyToClipboard text={memo}>
              <Button large>Copy to Clipboard</Button>
            </CopyToClipboard>
          </Block>
        )}
    </Page>
  );
}