import React, { useEffect, useState } from "react";
import firebase from "firebase/app";

import "./SignOut.scss";

export const SignOut: React.FC = () => {
  let [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    let unSub = firebase
      .auth()
      .onAuthStateChanged((user) => setIsSignedIn(!!user));
    return () => {
      unSub();
    };
  }, []);
  return isSignedIn ? (
    <button className="signOutButton" onClick={() => firebase.auth().signOut()}>
      Sign out
    </button>
  ) : (
    <></>
  );
};
