import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import classNames from "classnames";
import firebase from "firebase/app";

import "./Navigation.scss";
import { AppState } from "./types";

interface NavigationProps {
  currentPage: "slots" | "gifts" | "artists" | "itineraries" | "admins";
}
export const Navigation: React.FC<NavigationProps> = ({ currentPage }) => {
  let [appState, setAppState] = useState<AppState>();
  let appStateDoc = useMemo(
    () => firebase.firestore().collection("appstates").doc("singleton"),
    []
  );
  useEffect(() => {
    appStateDoc.onSnapshot((snap) =>
      setAppState(snap.exists ? snap.data()!.state : "closed")
    );
  }, [appStateDoc]);

  let updateAppState = (state: AppState) => {
    appStateDoc.set({ state });
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
        {appState === "pre" && (
          <>
            Pre-reservations{" "}
            <button onClick={() => updateAppState("open")}>&rarr;Open</button>
          </>
        )}
        {appState === "open" && (
          <>
            Open{" "}
            <button onClick={() => updateAppState("paused")}>
              &rarr;Paused
            </button>
            <button onClick={() => updateAppState("post")}>&rarr;Closed</button>
            <button onClick={() => updateAppState("pre")}>
              &rarr;Pre-reservations
            </button>
          </>
        )}
        {appState === "paused" && (
          <>
            Paused{" "}
            <button onClick={() => updateAppState("open")}>&rarr;Open</button>
          </>
        )}
        {appState === "post" && (
          <>
            Closed{" "}
            <button onClick={() => updateAppState("open")}>&rarr;Open</button>
          </>
        )}
      </div>
    </h1>
  );
};
