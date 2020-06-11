import React from "react";
import FirebaseAuth from "react-firebaseui/FirebaseAuth";
import firebase from "firebase/app";

const uiConfig = {
  signInFlow: "popup",
  signInSuccessUrl: "/",
  signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
};

export const SignIn: React.FC = () => {
  return (
    <div className="signIn">
      <FirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()} />
    </div>
  );
};
