import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from '../firebase';
import useAuth from "../useAuth";

export default function LoginPage() {
  const user = useAuth();

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error during Google sign-in:', error);
    }
  };

  if (user) {
    return <p>You are logged in as {user.displayName}.</p>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded"
        onClick={handleGoogleSignIn}
      >
        Sign in with Google
      </button>
    </div>
  );
}