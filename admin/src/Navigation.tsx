import React from "react";
import { Link } from "react-router-dom";
import classNames from "classnames";

import "./Navigation.scss";

interface NavigationProps {
  currentPage: "slots" | "gifts" | "artists" | "itineraries";
}
export const Navigation: React.FC<NavigationProps> = ({ currentPage }) => (
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
  </h1>
);
