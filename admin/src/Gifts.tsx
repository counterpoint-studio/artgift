import React, { useMemo, useEffect, useState, useCallback } from "react";
import firebase from "firebase/app";
import { Navigation } from "./Navigation";

export type Gift = {
  id?: string;
  slotId?: string;
  toName: string;
  toAddress: string;
  toLocation?: GiftLocation;
  toLanguage: string;
  toSignificance: string;
  fromName: string;
  fromPhoneNumber: string;
  fromEmail: string;
  fromMessage: string;
};
export type GiftLocation = {
  region: string;
  point: [number, number];
};

export const Gifts: React.FC = () => {
  let coll = useMemo(() => firebase.firestore().collection("gifts"), []);

  let [gifts, setGifts] = useState<Gift[]>([]);

  useEffect(() => {
    let unSub = coll.onSnapshot((giftsSnapshot) => {
      setGifts(
        giftsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Gift))
      );
    });
    return () => {
      unSub();
    };
  }, [coll]);

  let onDeleteGift = useCallback(
    (gift: Gift) => {
      coll.doc(gift.id).delete();
    },
    [coll]
  );

  return (
    <div className="slots">
      <Navigation currentPage="gifts" />
      <div className="slots--list">
        <ul>
          {gifts.map((gift, idx) => (
            <li key={idx}>
              {JSON.stringify(gift)}
              <button onClick={() => onDeleteGift(gift)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
