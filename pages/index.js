import React, { useContext } from 'react';
import {
  Page,
  Navbar,
  Link,
} from 'konsta/react';
import styles from '../styles/index.module.css';
import { AuthContext } from '../contexts/AuthContext';
import AppLink from '../components/AppLink';

export default function Home() {
  const { handleLogout } = useContext(AuthContext);

  // Array of your app objects. Can be moved to a separate data file and imported.
  const apps = [
    { href: '/memo', name: 'Memo', imgSrc: 'img/memo.png' },
  ];

  return (
    <Page>
      <Navbar
        title="AppWeekly"
        subtitle="v0.1.0"
        className="top-0 sticky"
        right={<Link navbar onClick={handleLogout}>Logout</Link>}
      />

      <div className={styles.appContainer}>
        {apps.map((app, index) => (
          <AppLink key={index} href={app.href} appName={app.name} imgSrc={app.imgSrc} />
        ))}
      </div>
    </Page>
  );
}