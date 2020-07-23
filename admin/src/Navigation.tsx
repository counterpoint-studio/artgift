import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import classNames from "classnames";
import firebase from "firebase/app";

import "./Navigation.scss";

interface NavigationProps {
  currentPage: "slots" | "gifts" | "artists" | "itineraries" | "admins";
}
export const Navigation: React.FC<NavigationProps> = ({ currentPage }) => {
  let [appState, setAppState] = useState<"open" | "closed">();
  let appStateDoc = useMemo(
    () => firebase.firestore().collection("appstates").doc("singleton"),
    []
  );
  useEffect(() => {
    appStateDoc.onSnapshot((snap) =>
      setAppState(snap.exists ? snap.data()!.state : "closed")
    );
  }, [appStateDoc]);

  let openApp = () => {
    appStateDoc.set({ state: "open" });
  };

  let closeApp = () => {
    appStateDoc.set({ state: "closed" });
  };

  return (
    <h1 className="navigation">
      <Link
        to="/slots"
        className={classNames({ isCurrent: currentPage === "slots" })}
      >
        Slots
      </Link>
      <Link
        to="/gifts"
        className={classNames({ isCurrent: currentPage === "gifts" })}
      >
        Gifts
      </Link>
      <Link
        to="/artists"
        className={classNames({ isCurrent: currentPage === "artists" })}
      >
        Artists
      </Link>
      <Link
        to="/itineraries"
        className={classNames({ isCurrent: currentPage === "itineraries" })}
      >
        itineraries
      </Link>
      <Link
        to="/admins"
        className={classNames({ isCurrent: currentPage === "admins" })}
      >
        admins
      </Link>
      <div className="appState">
        Reservations are {appState}
        {appState === "open" && <button onClick={closeApp}>Close</button>}
        {appState === "closed" && <button onClick={openApp}>Open</button>}
      </div>
    </h1>
  );
};
