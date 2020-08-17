import React, { useMemo, useEffect, useState, ReactSVG } from "react";
import firebase from "firebase/app";

import { Navigation } from "./Navigation";

type AdminUser = {
  email: string;
};

export const Admins: React.FC = () => {
  let coll = useMemo(() => firebase.firestore().collection("admins"), []);
  let [admins, setAdmins] = useState<AdminUser[]>([]);
  let [newAdminEmail, setNewAdminEmail] = useState("");

  useEffect(() => {
    let unSub = coll.onSnapshot((slotsSnapshot) => {
      setAdmins(slotsSnapshot.docs.map((d) => d.data() as AdminUser));
    });
    return () => {
      unSub();
    };
  }, [coll]);

  let removeAdmin = (user: AdminUser) => {
    coll.doc(user.email).delete();
  };

  let addAdmin = (evt: React.FormEvent) => {
    coll.doc(newAdminEmail).set({ email: newAdminEmail });
    setNewAdminEmail("");
    evt.preventDefault();
  };

  return (
    <>
      <header className="header">
        <Navigation currentPage="admins" />
      </header>
      <main className="main">
        <h2>Admins</h2>
        <p>
          Users with these email addresses will be able to access this admin
          interface.
        </p>
        <table>
          <thead></thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.email}>
                <td>{a.email}</td>
                <td>
                  <button onClick={() => removeAdmin(a)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form onSubmit={addAdmin}>
          <input
            type="email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            placeholder="Email address"
          />
          <button type="submit" disabled={newAdminEmail.trim().length === 0}>
            Add admin
          </button>
        </form>
      </main>
    </>
  );
};
