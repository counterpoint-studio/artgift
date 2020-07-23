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
import { parseDateAndTime } from "./util/dateUtils";

const INIT_ARTIST: Artist = {
  name: "",
  phoneNumber: "",
  email: "",
  itineraries: [],
};

export const Artists: React.FC = () => {
  let coll = useMemo(() => firebase.firestore().collection("artists"), []);

  let [artists, setArtists] = useState<Artist[]>([]);
  let [newArtist, setNewArtist] = useState<Artist>(INIT_ARTIST);

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

  let onAddNewArtist = useCallback(
    (evt: FormEvent) => {
      evt.preventDefault();
      coll.add(newArtist);
      setNewArtist(INIT_ARTIST);
    },
    [coll, newArtist]
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
      <Navigation currentPage="artists" />
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
                <button onClick={() => onTriggerInvitation(artist)}>
                  Send
                </button>
              </td>
              <td>
                <a
                  href={`${MAIN_APP_HOST}/artist?id=${artist.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {`${MAIN_APP_HOST}/artist?id=${artist.id}`}
                </a>
              </td>
              <td>
                <button onClick={() => onDeleteArtist(artist)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form className="slots--newSlot" onSubmit={onAddNewArtist}>
        <h1>Add Artist</h1>
        <div className="artists--field">
          <div className="artists--fieldLabel">Name</div>
          <div className="artists--fieldInput">
            <input
              type="text"
              value={newArtist.name}
              onChange={(e) =>
                setNewArtist({ ...newArtist, name: e.target.value })
              }
            />
          </div>
        </div>
        <div className="artists--field">
          <div className="artists--fieldLabel">Phone number</div>
          <div className="artists--fieldInput">
            <input
              type="tel"
              value={newArtist.phoneNumber}
              onChange={(e) =>
                setNewArtist({ ...newArtist, phoneNumber: e.target.value })
              }
            />
          </div>
        </div>
        <div className="artists--field">
          <div className="artists--fieldLabel">Email</div>
          <div className="artists--fieldInput">
            <input
              type="email"
              value={newArtist.email}
              onChange={(e) =>
                setNewArtist({ ...newArtist, email: e.target.value })
              }
            />
          </div>
        </div>
        <button type="submit" className="artists--action">
          Add
        </button>
      </form>
    </div>
  );
};
