import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  RouteProps,
} from "react-router-dom";
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";

import { Slots } from "./Slots";
import { SignIn } from "./SignIn";
import { SignOut } from "./SignOut";

import "./App.scss";
import { Gifts } from "./Gifts";
import { Artists } from "./Artists";
import { Itineraries } from "./Itineraries";
import { Admins } from "./Admins";

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
        <PrivateRoute exact path="/slots">
          <Slots />
        </PrivateRoute>
        <PrivateRoute exact path="/gifts">
          <Gifts />
        </PrivateRoute>
        <PrivateRoute exact path="/artists">
          <Artists />
        </PrivateRoute>
        <PrivateRoute exact path="/itineraries">
          <Itineraries />
        </PrivateRoute>
        <PrivateRoute exact path="/admins">
          <Admins />
        </PrivateRoute>
        <Route exact path="/">
          <Redirect to="/slots" />
        </Route>
      </Switch>
    </Router>
  );
}

function PrivateRoute({ children, ...rest }: RouteProps) {
  let [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    let unSub = firebase.auth().onAuthStateChanged((user) => {
      if (user && user.email) {
        firebase
          .firestore()
          .collection("admins")
          .doc(user.email)
          .get()
          .then(() => setIsSignedIn(true))
          .catch(() => setIsSignedIn(false)); // User can't read the admins coll if they're not an admin; will throw
      } else {
        setIsSignedIn(false);
      }
    });
    return () => {
      unSub();
    };
  }, []);
  return (
    <div className="wrapper">
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
    </div>
  );
}

export default App;
