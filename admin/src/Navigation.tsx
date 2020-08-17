import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import classNames from "classnames";
import firebase from "firebase/app";

import { SignOut } from "./SignOut";
import { AppState } from "./types";

import "./Navigation.scss";

interface NavigationProps {
  currentPage:
    | "slots"
    | "gifts"
    | "artists"
    | "itineraries"
    | "admins"
    | "auditLog";
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
    <nav className="navigation">
      <div className="inner">
        <div className="navigation--primary">
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
            Itineraries
          </Link>
          <Link
            to="/admins"
            className={classNames({ isCurrent: currentPage === "admins" })}
          >
            Admins
          </Link>
          <Link
            to="/auditlog"
            className={classNames({ isCurrent: currentPage === "auditLog" })}
          >
            Log
          </Link>
        </div>
        <div className="navigation--secondary">
          <div className="appState">
            Status:
            {appState === "pre" && (
              <div className="appStateToggle">
                <div className="appStateCurrent">Pre-reservations</div>
                <button
                  className="appStateAlt"
                  onClick={() => updateAppState("open")}
                >
                  Open
                </button>
              </div>
            )}
            {appState === "open" && (
              <div className="appStateToggle">
                <div className="appStateCurrent">Open</div>
                <button
                  className="appStateAlt"
                  onClick={() => updateAppState("paused")}
                >
                  Paused
                </button>
                <button
                  className="appStateAlt"
                  onClick={() => updateAppState("post")}
                >
                  Closed
                </button>
                <button
                  className="appStateAlt"
                  onClick={() => updateAppState("pre")}
                >
                  Pre-reservations
                </button>
              </div>
            )}
            {appState === "paused" && (
              <div className="appStateToggle">
                <div className="appStateCurrent">Paused</div>
                <button
                  className="appStateAlt"
                  onClick={() => updateAppState("open")}
                >
                  Open
                </button>
              </div>
            )}
            {appState === "post" && (
              <div className="appStateToggle">
                <div className="appStateCurrent">Closed</div>
                <button
                  className="appStateAlt"
                  onClick={() => updateAppState("open")}
                >
                  Open
                </button>
              </div>
            )}
          </div>
          <SignOut />
        </div>
      </div>
    </nav>
  );
};
