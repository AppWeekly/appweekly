import { React, useContext } from 'react';
import {
  Block,
  Button,
  Link,
} from 'konsta/react';
import { AuthContext } from '../contexts/AuthContext';

export default function SignIn() {
  const { handleGoogleSignIn } = useContext(AuthContext);

  return (
    <div className="loginContainer">
      <Block strong className="space-y-4">
        <p>
          Explore the world of ideas and creative solutions to daily challenges. To follow this journey, check out the <Link href="https://www.youtube.com/@AppWeeklyOfficial">YouTube</Link> channel. Free, so please use responsibly.</p>
        <p>
          <Button large onClick={handleGoogleSignIn}>Sign in with Google</Button>
        </p>
      </Block>
    </div>
  );
}