import React, { useMemo, useEffect, useState, useCallback } from "react";
import firebase from "firebase/app";
import { last, flatMap, isEqual, padStart, fromPairs, sortBy } from "lodash";

import { REGIONS, DATES, HOURS, MINUTES } from "./constants";
import { Navigation } from "./Navigation";
import {
  formatDate,
  formatTime,
  parseDateAndTime,
  formatTimeFromComponents,
} from "./util/dateUtils";

import { Artist, ArtistItinerary, Slot, Gift } from "./types";

import "./Itineraries.scss";

export const Itineraries: React.FC = () => {
  let coll = useMemo(() => firebase.firestore().collection("artists"), []);

  let [artists, setArtists] = useState<Artist[]>([]);
  useEffect(() => {
    let unSub = coll.onSnapshot((artistsSnapshot) => {
      setArtists(
        artistsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Artist))
      );
    });
    return () => {
      unSub();
    };
  }, [coll]);

  let addItinerary = useCallback(
    (artistId: string, newItinerary: ArtistItinerary) => {
      coll.doc(artistId).update({
        itineraries: firebase.firestore.FieldValue.arrayUnion(newItinerary),
      });
    },
    [coll]
  );

  let deleteItinerary = useCallback(
    (artistId: string, itinerary: ArtistItinerary) => {
      firebase.firestore().runTransaction(async (tx) => {
        let artist = (await tx.get(coll.doc(artistId))).data() as Artist;
        artist = {
          ...artist,
          itineraries: artist.itineraries.filter((i) => !isEqual(i, itinerary)),
        };
        await tx.set(coll.doc(artistId), artist);
      });
    },
    [coll]
  );

  return (
    <div className="itineraries">
      <header className="header">
        <Navigation currentPage="itineraries" />
      </header>

      <main className="main">
        {REGIONS.map((r) => (
          <div key={r}>
            <h2>{r}</h2>
            <RegionItineraries
              regionId={r}
              artists={artists}
              onAddItinerary={addItinerary}
              onDeleteItinerary={deleteItinerary}
            />
          </div>
        ))}
      </main>
    </div>
  );
};

interface RegionItinerariesProps {
  regionId: string;
  artists: Artist[];
  onAddItinerary: (artistId: string, newItinerary: ArtistItinerary) => void;
  onDeleteItinerary: (artistId: string, itinerary: ArtistItinerary) => void;
}
const RegionItineraries: React.FC<RegionItinerariesProps> = ({
  regionId,
  artists,
  onAddItinerary,
  onDeleteItinerary,
}) => {
  let regionItineraries = useMemo(
    () =>
      sortBy(
        flatMap(artists, (artist) =>
          artist.itineraries
            .filter((i) => i.region === regionId)
            .map((itinerary) => ({ artist, itinerary }))
        ),
        (i) => i.itinerary.from.date,
        (i) => i.itinerary.from.time,
        (i) => i.artist.name
      ),
    [artists]
  );
  let [detailsExpandedFor, setDetailsExpandedFor] = useState<{
    [artistId: string]: { [it: string]: boolean };
  }>({});

  let toggleDetails = useCallback(
    (artist: Artist, itinerary: ArtistItinerary) => {
      let aKey = artist.id!;
      let itKey = itinerary.from.date + itinerary.from.time;
      setDetailsExpandedFor({
        ...detailsExpandedFor,
        [aKey]: {
          ...(detailsExpandedFor[aKey] || {}),
          [itKey]: !detailsExpandedFor[aKey]?.[itKey],
        },
      });
    },
    [detailsExpandedFor]
  );

  let [newItineraryArtistId, setNewItineraryArtistId] = useState<string>();
  let [newItinerary, setNewItinerary] = useState<ArtistItinerary>({
    region: regionId,
    from: {
      date: DATES[0],
      time: formatTimeFromComponents(HOURS[0], MINUTES[0]),
    },
    to: {
      date: DATES[0],
      time: formatTimeFromComponents(HOURS[0], MINUTES[0]),
    },
    assignments: [],
  });
  let [fromHour, fromMinute] = newItinerary.from.time.split(":").map((t) => +t);
  let [toHour, toMinute] = newItinerary.to.time.split(":").map((t) => +t);
  let isNewItineraryValid =
    !!newItineraryArtistId &&
    isBefore(newItinerary.from, newItinerary.to) &&
    !hasOverlappingItineraries(
      newItinerary,
      artists.find((a) => a.id === newItineraryArtistId)!
    );

  return (
    <div>
      <table>
        <thead></thead>
        <tbody>
          {regionItineraries.map(({ artist, itinerary }, idx) => (
            <React.Fragment key={idx}>
              <tr onClick={() => toggleDetails(artist, itinerary)}>
                <td>{artist.name}</td>
                <td>
                  {formatDate(itinerary.from.date)}{" "}
                  {formatTime(itinerary.from.time)}
                </td>
                <td>
                  {formatDate(itinerary.to.date)}{" "}
                  {formatTime(itinerary.to.time)}
                </td>
                <td>
                  <button
                    onClick={(evt) => (
                      evt.stopPropagation(),
                      onDeleteItinerary(artist.id!, itinerary)
                    )}
                  >
                    Delete
                  </button>
                </td>
              </tr>
              {detailsExpandedFor[artist.id!]?.[
                itinerary.from.date + itinerary.from.time
              ] && (
                <tr>
                  <td></td>
                  <td colSpan={3}>
                    <ItineraryDetails itinerary={itinerary} />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <form
        className="itineraries--newItinerary"
        onSubmit={(evt) => {
          evt.preventDefault();
          onAddItinerary(newItineraryArtistId!, newItinerary);
        }}
      >
        <div className="itineraries--field">
          <div className="itineraries--fieldLabel">Assign artist</div>
          <div className="itineraries--fieldInput">
            <select
              className="itineraries--artistInput"
              value={newItineraryArtistId}
              onChange={(evt) => setNewItineraryArtistId(evt.target.value)}
            >
              <option></option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="itineraries--field">
          <div className="itineraries--fieldLabel">from</div>
          <div className="itineraries--fieldInput">
            <select
              value={newItinerary.from.date}
              onChange={(evt) =>
                setNewItinerary({
                  ...newItinerary,
                  from: { ...newItinerary.from, date: evt.target.value },
                })
              }
            >
              {DATES.map((d) => (
                <option key={d} value={d}>
                  {formatDate(d)}
                </option>
              ))}
            </select>
            <select
              value={fromHour}
              onChange={(evt) =>
                setNewItinerary({
                  ...newItinerary,
                  from: {
                    ...newItinerary.from,
                    time: formatTimeFromComponents(
                      +evt.target.value,
                      fromMinute
                    ),
                  },
                })
              }
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {padStart("" + h, 2, "0")}
                </option>
              ))}
              <option value={last(HOURS)! + 1}>{last(HOURS)! + 1}</option>
            </select>
            :
            <select
              value={fromMinute}
              onChange={(evt) =>
                setNewItinerary({
                  ...newItinerary,
                  from: {
                    ...newItinerary.from,
                    time: formatTimeFromComponents(fromHour, +evt.target.value),
                  },
                })
              }
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  {padStart("" + m, 2, "0")}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="itineraries--field">
          <div className="itineraries--fieldLabel">to</div>
          <div className="itineraries--fieldInput">
            <select
              value={newItinerary.to.date}
              onChange={(evt) =>
                setNewItinerary({
                  ...newItinerary,
                  to: { ...newItinerary.to, date: evt.target.value },
                })
              }
            >
              {DATES.map((d) => (
                <option key={d} value={d}>
                  {formatDate(d)}
                </option>
              ))}
            </select>
            <select
              value={toHour}
              onChange={(evt) =>
                setNewItinerary({
                  ...newItinerary,
                  to: {
                    ...newItinerary.to,
                    time: formatTimeFromComponents(+evt.target.value, toMinute),
                  },
                })
              }
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {padStart("" + h, 2, "0")}
                </option>
              ))}
              <option value={last(HOURS)! + 1}>{last(HOURS)! + 1}</option>
            </select>
            :
            <select
              value={toMinute}
              onChange={(evt) =>
                setNewItinerary({
                  ...newItinerary,
                  to: {
                    ...newItinerary.to,
                    time: formatTimeFromComponents(toHour, +evt.target.value),
                  },
                })
              }
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  {padStart("" + m, 2, "0")}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="itineraries--action"
          disabled={!isNewItineraryValid}
        >
          Assign
        </button>
      </form>
    </div>
  );
};

function isBefore(
  lhs: { date: string; time: string },
  rhs: { date: string; time: string }
) {
  let lDate = parseDateAndTime(lhs.date, lhs.time);
  let rDate = parseDateAndTime(rhs.date, rhs.time);
  return lDate.getTime() < rDate.getTime();
}

function hasOverlappingItineraries(
  newItinerary: ArtistItinerary,
  artist: Artist
) {
  let newFrom = parseDateAndTime(
    newItinerary.from.date,
    newItinerary.from.time
  );
  let newTo = parseDateAndTime(newItinerary.to.date, newItinerary.to.time);
  return !!artist.itineraries.find((itinerary) => {
    let from = parseDateAndTime(itinerary.from.date, itinerary.from.time);
    let to = parseDateAndTime(itinerary.to.date, itinerary.to.time);
    return newFrom.getTime() < to.getTime() && from.getTime() < newTo.getTime();
  });
}

interface ItineraryDetailsProps {
  itinerary: ArtistItinerary;
}
let ItineraryDetails: React.FC<ItineraryDetailsProps> = ({ itinerary }) => {
  let slotsColl = useMemo(() => firebase.firestore().collection("slots"), []);
  let giftsColl = useMemo(() => firebase.firestore().collection("gifts"), []);

  let [slots, setSlots] = useState<{ [slotId: string]: Slot }>({});
  let [gifts, setGifts] = useState<{ [giftId: string]: Gift }>({});

  useEffect(() => {
    if (itinerary.assignments.length === 0) return;
    let unSubSlots = slotsColl
      .where(
        firebase.firestore.FieldPath.documentId(),
        "in",
        itinerary.assignments.map((a) => a.slotId)
      )
      .onSnapshot((slotsSnapshot) => {
        setSlots(
          fromPairs(slotsSnapshot.docs.map((d) => [d.id, d.data() as Slot]))
        );
      });
    let unSubGifts = giftsColl
      .where(
        firebase.firestore.FieldPath.documentId(),
        "in",
        itinerary.assignments.map((a) => a.giftId)
      )
      .onSnapshot((giftsSnapshot) => {
        setGifts(
          fromPairs(giftsSnapshot.docs.map((d) => [d.id, d.data() as Gift]))
        );
      });
    return () => {
      unSubSlots();
      unSubGifts();
    };
  }, [itinerary]);

  return (
    <table className="itineraries--details">
      <thead></thead>
      <tbody>
        {itinerary.assignments.map((a) => (
          <tr key={a.slotId}>
            <td>{slots[a.slotId] && formatTime(slots[a.slotId].time)}</td>
            <td>{gifts[a.giftId]?.toAddress}</td>
            <td>
              {gifts[a.giftId]?.fromName} &lt;{gifts[a.giftId]?.fromEmail}&gt; /{" "}
              {gifts[a.giftId]?.fromPhoneNumber}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
