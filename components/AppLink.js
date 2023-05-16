import React from 'react';
import { Link } from 'konsta/react';
import styles from '../styles/index.module.css';

export default function AppLink({ href, appName, imgSrc }) {
  return (
    <Link href={href} className={styles.app}>
      <img src={imgSrc} alt={appName} className={styles.appIcon} />
      <div className={styles.appName}>
        {appName}
      </div>
    </Link>
  );
}
