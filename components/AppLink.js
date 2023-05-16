import React from 'react';
import { Link } from 'konsta/react';

export default function AppLink({ href, appName }) {
  return (
    <Link href={href} className="app">
      <div className="appIcon"></div>
      <div className="appName">
        {appName}
      </div>
    </Link>
  );
}