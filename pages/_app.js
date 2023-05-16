import { App } from 'konsta/react';
import {
  Page,
  Navbar
} from 'konsta/react';
import styles from '../styles/index.module.css';
import '../styles/globals.css';
import useAuth from "../hooks/useAuth";
import { AuthProvider } from '../contexts/AuthContext';
import SignIn from '../components/SignIn';

function MyApp({ Component, pageProps }) {
  const user = useAuth();

  if (!user) {
    return (
      <App theme="ios">
        <AuthProvider>
          <div className={styles.loginPage}>
            <Page>
              <Navbar
                title="AppWeekly"
                subtitle="v0.1.0"
                className="top-0 sticky"
              />
              <SignIn />
            </Page>
          </div>
        </AuthProvider>
      </App>
    );
  }

  return (
    // Wrap our app with App component
    <App theme="ios">
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </App>
  );
}

export default MyApp;