import React, { useEffect } from "react";
import {
  hasLoggedInUser,
  logout,
  getCurrentUser,
  loginAnonymous,
  loginFacebook,
  loginGoogle,
  handleOAuthRedirects,
  addAuthenticationListener,
  removeAuthenticationListener,
} from "./../stitch";

// Create a React Context that lets us expose and access auth state
// without passing props through many levels of the component tree
const StitchAuthContext = React.createContext();

// Create a React Hook that lets us get data from our auth context
export function useStitchAuth() {
  const context = React.useContext(StitchAuthContext);
  if (!context) {
    throw new Error(`useStitchAuth must be used within a StitchAuthProvider`);
  }
  return context;
}

// Create a component that controls auth state and exposes it via
// the React Context we created.
export function StitchAuthProvider(props) {
  const [authState, setAuthState] = React.useState({
    isLoading: true,
    isLoggedIn: hasLoggedInUser(),
    currentUser: getCurrentUser(),
  });
  useEffect(() => {
    const authListener = {
      onUserLoggedIn: (auth, loggedInUser) => {
        console.log("user logged in");
        if (loggedInUser) {
          setAuthState(authState => ({
            ...authState,
            isLoggedIn: true,
            currentUser: loggedInUser,
          }));
        }
      },
      onUserLoggedOut: (auth, loggedOutUser) => {
        setAuthState(authState => ({
          ...authState,
          isLoggedIn: false,
          currentUser: null,
        }));
      },
    };
    addAuthenticationListener(authListener);
    handleOAuthRedirects();
    setAuthState(state => ({ ...state, isLoading: false }));
    return () => {
      removeAuthenticationListener(authListener);
    };
  }, []);

  // prettier-ignore
  const handleLogin = React.useCallback(
    async provider => {
      console.log("handling login", authState.isLoggedIn)
      if (!authState.isLoggedIn) {
        switch(provider) {
          case "anonymous": return loginAnonymous()
          case "facebook": return loginFacebook()
          case "google": return loginGoogle()
          default: {}
        }
      }
    },
    [authState],
  );
  const handleLogout = React.useCallback(async () => {
    if (authState.isLoggedIn) {
      logout();
    } else {
      console.log(`can't handleLogout when no user is logged in`);
    }
  }, [authState]);

  // We useMemo to improve performance by eliminating some re-renders
  const authInfo = React.useMemo(() => {
    const { isLoading, isLoggedIn, currentUser } = authState;
    const value = {
      isLoading,
      isLoggedIn,
      currentUser,
      actions: {
        handleLogin,
        handleLogout,
      },
    };
    return value;
  }, [authState, handleLogin, handleLogout]);

  return (
    <StitchAuthContext.Provider value={authInfo}>
      {props.children}
    </StitchAuthContext.Provider>
  );
}
