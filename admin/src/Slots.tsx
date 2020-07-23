import React, {
  useMemo,
  useEffect,
  useState,
  useCallback,
  FormEvent,
} from "react";
import firebase from "firebase/app";
import classNames from "classnames";
import { padStart } from "lodash";

import { REGIONS, DATES, HOURS, MINUTES } from "./constants";
import { Navigation } from "./Navigation";
import {
  formatDate,
  formatTime,
  formatTimeFromComponents,
} from "./util/dateUtils";
import { Slot } from "./types";

import "./Slots.scss";

function initSlot(appState: "open" | "closed"): Slot {
  return {
    date: DATES[0],
    time: "11:00",
    region: REGIONS[0].id,
    status: appState === "open" ? "available" : "notAvailable",
  };
}

export const Slots: React.FC = () => {
  let coll = useMemo(() => firebase.firestore().collection("slots"), []);

  let [slots, setSlots] = useState<Slot[]>([]);
  let [newSlot, setNewSlot] = useState<Slot>(initSlot("open"));
  let [newSlotHour, newSlotMinute] = newSlot.time.split(":").map((t) => +t);

  useEffect(() => {
    let unSub = coll
      .orderBy("date")
      .orderBy("time")
      .orderBy("region")
      .onSnapshot((slotsSnapshot) => {
        setSlots(
          slotsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Slot))
        );
      });
    return () => {
      unSub();
    };
  }, [coll]);

  let onAddNewSlot = useCallback(
    (evt: FormEvent) => {
      evt.preventDefault();
      coll.add(newSlot);
    },
    [coll, newSlot]
  );

  let onDeleteSlot = useCallback(
    (slot: Slot) => {
      coll.doc(slot.id).delete();
    },
    [coll]
  );

  return (
    <div className="slots">
      <Navigation currentPage="slots" />
      <table className="slots--list">
        <thead></thead>
        <tbody>
          {slots.map((slot, idx) => (
            <tr key={idx}>
              <td>{formatDate(slot.date)}</td>
              <td>{formatTime(slot.time)}</td>
              <td>{slot.region}</td>
              <td>
                <span className={classNames("slotStatus", slot.status)}>
                  {slot.status}
                </span>
              </td>
              <td>
                <button
                  onClick={() => onDeleteSlot(slot)}
                  disabled={slot.status !== "available"}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form className="slots--newSlot" onSubmit={onAddNewSlot}>
        <h1>Add Slots</h1>
        <div className="slots--field">
          <div className="slots--fieldLabel">Region</div>
          <div className="slots--fieldInput">
            {REGIONS.map((r) => (
              <label key={r.id} className="slots--radioLabel">
                <input
                  type="radio"
                  value={r.id}
                  checked={newSlot.region === r.id}
                  onChange={(evt: React.FormEvent<HTMLInputElement>) =>
                    setNewSlot({ ...newSlot, region: evt.currentTarget.value })
                  }
                />
                {r.id}
              </label>
            ))}
          </div>
        </div>
        <div className="slots--field">
          <div className="slots--fieldLabel">Date</div>
          <div className="slots--fieldInput">
            {DATES.map((d) => (
              <label key={d} className="slots--radioLabel">
                <input
                  type="radio"
                  value={d}
                  checked={newSlot.date === d}
                  onChange={(evt: React.FormEvent<HTMLInputElement>) =>
                    setNewSlot({ ...newSlot, date: evt.currentTarget.value })
                  }
                />
                {formatDate(d)}
              </label>
            ))}
          </div>
        </div>
        <div className="slots--field">
          <label className="slots--fieldLabel">Time</label>
          <div className="slots--fieldInput">
            <select
              value={newSlotHour}
              onChange={(evt) =>
                setNewSlot({
                  ...newSlot,
                  time: formatTimeFromComponents(
                    +evt.target.value,
                    newSlotMinute
                  ),
                })
              }
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {padStart("" + h, 2, "0")}
                </option>
              ))}
            </select>
            :
            <select
              value={newSlotMinute}
              onChange={(evt) =>
                setNewSlot({
                  ...newSlot,
                  time: formatTimeFromComponents(
                    newSlotHour,
                    +evt.target.value
                  ),
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
        <button type="submit" className="slots--action">
          Add
        </button>
      </form>
    </div>
  );
};
