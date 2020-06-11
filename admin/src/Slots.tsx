import React, {
  useMemo,
  useEffect,
  useState,
  useCallback,
  FormEvent,
} from "react";
import firebase from "firebase/app";
import { REGIONS, DATES, HOURS, MINUTES } from "./constants";

type Slot = {
  id?: string;
  date: string;
  time: string;
  region: string;
};
const INIT_SLOT: Slot = {
  date: DATES[0],
  time: "11:00",
  region: REGIONS[0],
};

export const Slots: React.FC = () => {
  let coll = useMemo(() => firebase.firestore().collection("slots"), []);

  let [slots, setSlots] = useState<Slot[]>([]);
  let [newSlot, setNewSlot] = useState<Slot>(INIT_SLOT);
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
      <h1>Slots</h1>
      <div className="slots--list">
        <h2>Slots</h2>
        <ul>
          {slots.map((slot, idx) => (
            <li key={idx}>
              {slot.date} {slot.time} {slot.region}
              <button onClick={() => onDeleteSlot(slot)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
      <form className="slots--newSlot" onSubmit={onAddNewSlot}>
        <h2>Add a slot</h2>
        <div className="slots--field">
          <div className="slots--fieldLabel">Region</div>
          <div className="slots--fieldInput">
            {REGIONS.map((r) => (
              <label key={r}>
                <input
                  type="radio"
                  value={r}
                  checked={newSlot.region === r}
                  onChange={(evt: React.FormEvent<HTMLInputElement>) =>
                    setNewSlot({ ...newSlot, region: evt.currentTarget.value })
                  }
                />
                {r}
              </label>
            ))}
          </div>
        </div>
        <div className="slots--field">
          <label className="slots--fieldLabel">Date</label>
          <div className="slots--fieldInput">
            {DATES.map((d) => (
              <label key={d}>
                <input
                  type="radio"
                  value={d}
                  checked={newSlot.date === d}
                  onChange={(evt: React.FormEvent<HTMLInputElement>) =>
                    setNewSlot({ ...newSlot, date: evt.currentTarget.value })
                  }
                />
                {d}
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
                  time: `${evt.target.value}:${newSlotMinute}`,
                })
              }
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            :
            <select
              value={newSlotMinute}
              onChange={(evt) =>
                setNewSlot({
                  ...newSlot,
                  time: `${newSlotHour}:${evt.target.value}`,
                })
              }
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  {m}
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
