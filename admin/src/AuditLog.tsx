import React, { useMemo, useEffect, useState, ReactSVG } from "react";
import firebase from "firebase/app";

import { Navigation } from "./Navigation";

import "./AuditLog.scss";
import { isObject } from "lodash";

type LogItem = {
  id: string;
  message: string;
  timestamp: number;
  beforeData?: any;
  afterData?: any;
};

export const AuditLog: React.FC = () => {
  let coll = useMemo(() => firebase.firestore().collection("auditlogs"), []);
  let [log, setLog] = useState<LogItem[]>([]);
  let [detailedId, setDetailedId] = useState<string>();

  useEffect(() => {
    let unSub = coll
      .orderBy("timestamp", "desc")
      .onSnapshot((slotsSnapshot) => {
        setLog(
          slotsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as LogItem))
        );
      });
    return () => {
      unSub();
    };
  }, [coll]);

  return (
    <>
      <Navigation currentPage="auditLog" />
      <table className="auditLog">
        <colgroup>
          <col className="timestamp" />
          <col className="details" />
        </colgroup>
        <thead></thead>
        <tbody>
          {log.map((i) => (
            <tr
              key={i.id}
              onClick={() =>
                setDetailedId((d) => (d === i.id ? undefined : i.id))
              }
            >
              <td>{new Date(i.timestamp).toISOString()}</td>
              <td>
                {i.message}
                {detailedId === i.id &&
                  (i.beforeData || i.afterData) &&
                  renderDetails(i.afterData || i.beforeData)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

let renderDetails = (data: any) => {
  if (isObject(data)) {
    return (
      <table className="auditLogDetails">
        <thead></thead>
        <tbody>
          {Object.keys(data).map((k) => (
            <tr key={k}>
              <th>{k}</th>
              <td>{renderDetails((data as any)[k])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  } else {
    return data;
  }
};
