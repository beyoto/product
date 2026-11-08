import { useEffect, useState } from 'react';
import { session } from '../site.js';
import { useSite } from '../SiteContext.jsx';
import './SplashScreen.css';

function SplashScreen({ children }) {
  const { name } = useSite();
  const [alreadyShown] = useState(() => session.get('splashShown') === 'true');
  const [visible, setVisible] = useState(!alreadyShown);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (alreadyShown) return undefined;

    const fadeTimer = setTimeout(() => setFadingOut(true), 1100);
    const removeTimer = setTimeout(() => {
      setVisible(false);
      session.set('splashShown', 'true');
    }, 1450);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [alreadyShown]);

  return (
    <>
      {visible && (
        <div className={`splash-screen ${fadingOut ? 'splash-screen--fade-out' : ''}`}>
          <h1 className="splash-screen__brand">{name}</h1>
        </div>
      )}
      {children}
    </>
  );
}

export default SplashScreen;
