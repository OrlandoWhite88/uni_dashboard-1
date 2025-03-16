import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import Intercom from '@intercom/messenger-js-sdk';


const IntercomProvider = () => {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user) {
      // For logged-in users
      Intercom({
        app_id: 'ohn4sdim',
        user_id: user.id,
        name: user.fullName || user.primaryEmailAddress?.emailAddress || '',
        email: user.primaryEmailAddress?.emailAddress || '',
        created_at: Math.floor(new Date(user.createdAt).getTime() / 1000), // Convert to Unix timestamp
      });
    } else {
      // For anonymous users
      Intercom({
        app_id: 'ohn4sdim',
      });
    }

    return () => {
      // Clean up Intercom when component unmounts
      if (window.Intercom) {
        window.Intercom('shutdown');
      }
    };
  }, [isLoaded, isSignedIn, user]);

  return null; // This component doesn't render anything
};

export default IntercomProvider;
