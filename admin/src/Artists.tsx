import React, {
  useMemo,
  useEffect,
  useState,
  useCallback,
  FormEvent,
} from "react";
import firebase from "firebase/app";

import { Navigation } from "./Navigation";
import { Artist } from "./types";

import "./Artists.scss";
import { MAIN_APP_HOST } from "./constants";

const INIT_ARTIST: Artist = {
  name: "",
  phoneNumber: "",
  email: "",
  itineraries: [],
};

export const Artists: React.FC = () => {
  let coll = useMemo(() => firebase.firestore().collection("artists"), []);

  let [artists, setArtists] = useState<Artist[]>([]);
  let [editingArtist, setEditingArtist] = useState<Artist>(INIT_ARTIST);

  useEffect(() => {
    let unSub = coll.orderBy("name").onSnapshot((artistsSnapshot) => {
      setArtists(
        artistsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Artist))
      );
    });
    return () => {
      unSub();
    };
  }, [coll]);

  let onSaveArtist = useCallback(
    (evt: FormEvent) => {
      evt.preventDefault();
      if (editingArtist.id) {
        coll.doc(editingArtist.id).set(editingArtist, { merge: true });
      } else {
        coll.add(editingArtist);
      }
      setEditingArtist(INIT_ARTIST);
    },
    [coll, editingArtist]
  );

  let onTriggerInvitation = useCallback(
    (artist: Artist) => {
      coll
        .doc(artist.id)
        .set({ invitationTrigger: Date.now() }, { merge: true });
    },
    [coll]
  );

  let getTriggerInvitationTime = useCallback((time: number) => {
    let date = new Date(time);
    return `${date.getDate()}.${date.getMonth()}.${date.getFullYear()}`;
  }, []);

  let onDeleteArtist = useCallback(
    (artist: Artist) => {
      if (window.confirm(`Are you sure you want to delete ${artist.name}?`)) {
        coll.doc(artist.id).delete();
      }
    },
    [coll]
  );

  return (
    <div className="artists">
      <header className="header">
        <Navigation currentPage="artists" />
      </header>

      <main className="main">
        <h2>All Artists</h2>
        <table className="artists--list">
          <thead></thead>
          <tbody>
            {artists.map((artist, idx) => (
              <tr key={idx}>
                <td>{artist.name}</td>
                <td>
                  {artist.phoneNumber} {artist.email}
                </td>
                <td>
                  {artist.invitationTrigger
                    ? `Invitation sent ${getTriggerInvitationTime(
                        artist.invitationTrigger
                      )}`
                    : "No invitation sent"}
                  <button
                    onClick={() => onTriggerInvitation(artist)}
                    disabled={!artist.email && !artist.phoneNumber}
                    title={
                      !artist.email && !artist.phoneNumber
                        ? "Add an email address and/or phone number first"
                        : ""
                    }
                  >
                    Send
                  </button>
                </td>
                <td>
                  <a
                    href={`${MAIN_APP_HOST}/artist?id=${artist.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Artist page link
                  </a>
                </td>
                <td>
                  <button onClick={() => setEditingArtist(artist)}>Edit</button>
                  <button onClick={() => onDeleteArtist(artist)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form className="artists--editArtist" onSubmit={onSaveArtist}>
          <h2>{editingArtist.id ? "Edit" : "Add"} Artist</h2>
          <div className="artists--field">
            <div className="artists--fieldLabel">Name</div>
            <div className="artists--fieldInput">
              <input
                type="text"
                value={editingArtist.name}
                onChange={(e) =>
                  setEditingArtist({ ...editingArtist, name: e.target.value })
                }
              />
            </div>
          </div>
          <div className="artists--field">
            <div className="artists--fieldLabel">Phone number</div>
            <div className="artists--fieldInput">
              <input
                type="tel"
                value={editingArtist.phoneNumber}
                onChange={(e) =>
                  setEditingArtist({
                    ...editingArtist,
                    phoneNumber: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="artists--field">
            <div className="artists--fieldLabel">Email</div>
            <div className="artists--fieldInput">
              <input
                type="email"
                value={editingArtist.email}
                onChange={(e) =>
                  setEditingArtist({ ...editingArtist, email: e.target.value })
                }
              />
            </div>
          </div>
          <button type="submit" className="artists--action">
            {editingArtist.id ? "Update" : "Add"}
          </button>
          {editingArtist.id && (
            <button
              className="artists--action"
              onClick={() => setEditingArtist(INIT_ARTIST)}
            >
              Cancel
            </button>
          )}
        </form>
      </main>
    </div>
  );
};
