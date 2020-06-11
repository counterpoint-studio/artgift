import React, { ReactElement, useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  RouteProps,
} from "react-router-dom";
import firebase from "firebase/app";
import "firebase/auth";

import "./App.scss";
import { Slots } from "./Slots";
import { SignIn } from "./SignIn";
import { SignOut } from "./SignOut";

firebase.initializeApp({
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
});

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/signin">
          <SignIn />
        </Route>
        <PrivateRoute exact={true} path="/">
          <Slots />
        </PrivateRoute>
      </Switch>
      <SignOut />
    </Router>
  );
}

function PrivateRoute({ children, ...rest }: RouteProps) {
  let [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    let unSub = firebase
      .auth()
      .onAuthStateChanged((user) => setIsSignedIn(!!user));
    return () => {
      unSub();
    };
  }, []);
  return (
    <Route
      {...rest}
      render={({ location }) =>
        isSignedIn === null ? (
          <></>
        ) : isSignedIn ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: "/signin",
              state: { from: location },
            }}
          />
        )
      }
    />
  );
}

export default App;
