import { App } from 'konsta/react';
import {
  Page,
  Block,
  Navbar,
  Preloader, // Import the Preloader component
} from 'konsta/react';
import styles from '../styles/index.module.css';
import '../styles/globals.css';
import useAuth from "../hooks/useAuth";
import { AuthProvider } from '../contexts/AuthContext';
import SignIn from '../components/SignIn';

function MyApp({ Component, pageProps }) {
  const { user, loading } = useAuth(); // Destructure loading from useAuth

  if (loading) {
    return (
      <App theme="ios">
        <Page>
          <Navbar
            title="AppWeekly"
            subtitle="loading.."
            className="top-0 sticky"
          />
          <Block strong className="text-center">
            <div className="text-center">
              <Preloader size="w-12 h-12" />
            </div>
          </Block>
        </Page>
      </App>
    );
  }

  return (
    <AuthProvider>
      <App theme="ios">
        {!user ? (
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
        ) : (
          <Component {...pageProps} />
        )}
      </App>
    </AuthProvider>
  );
}

export default MyApp;