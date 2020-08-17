import React, { useMemo, useEffect, useState, useCallback } from "react";
import firebase from "firebase/app";
import { groupBy, fromPairs, flatMap, pick, add } from "lodash";
import classNames from "classnames";
import { ExportToCsv } from "export-to-csv";

import { Navigation } from "./Navigation";
import { Gift, Slot, Artist } from "./types";
import {
  formatDate,
  formatTime,
  formatDateFromComponents,
  formatTimeFromComponents,
} from "./util/dateUtils";
import { locateAddress, getRegionGeoJSON } from "./util/mapboxUtils";

import { MAIN_APP_HOST } from "./constants";

import "./Gifts.scss";

export const Gifts: React.FC = () => {
  let giftColl = useMemo(() => firebase.firestore().collection("gifts"), []);
  let slotColl = useMemo(() => firebase.firestore().collection("slots"), []);
  let artistColl = useMemo(
    () => firebase.firestore().collection("artists"),
    []
  );
  let csvExporter = useMemo(
    () => new ExportToCsv({ title: `Art Gifts`, useKeysAsHeaders: true }),
    []
  );

  let [gifts, setGifts] = useState<Gift[]>([]);
  let [slots, setSlots] = useState<Slot[]>([]);
  let [artistAssignments, setArtistAssignments] = useState<{
    [giftId: string]: string;
  }>({});

  let [showingDetails, setShowingDetails] = useState<{
    [giftId: string]: boolean;
  }>({});

  useEffect(() => {
    let unSub = giftColl
      .where("status", "in", ["pending", "confirmed", "rejected", "cancelled"])
      .orderBy("reservedAt.seconds", "desc")
      .onSnapshot((giftsSnapshot) => {
        setGifts(
          giftsSnapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Gift))
        );
      });
    return () => {
      unSub();
    };
  }, [giftColl]);
  useEffect(() => {
    let unSub = slotColl.onSnapshot((slotsSnapshot) => {
      setSlots(
        slotsSnapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Slot))
      );
    });
    return () => {
      unSub();
    };
  }, [slotColl]);
  useEffect(() => {
    let unSub = artistColl.orderBy("name").onSnapshot((artistsSnapshot) => {
      let artists = artistsSnapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Artist)
      );
      setArtistAssignments(
        fromPairs(
          flatMap(artists, (artist) =>
            flatMap(artist.itineraries, (it) =>
              it.assignments.map((a) => [a.giftId, artist.name])
            )
          )
        )
      );
    });
    return () => {
      unSub();
    };
  }, [artistColl]);

  let getTableData = useCallback(() => {
    if (gifts.length === 0 || slots.length === 0) return [];
    let slotsById = groupBy(slots, (s) => s.id);
    return gifts.map((gift) => ({
      gift,
      slot: slotsById[gift.slotId!]?.[0] as Slot,
      assignedArtist: artistAssignments[gift.id],
    }));
  }, [gifts, slots, artistAssignments]);

  let onToggleDetails = useCallback((gift: Gift) => {
    setShowingDetails((d) => ({ ...d, [gift.id!]: !d[gift.id!] }));
  }, []);

  let onUpdateGiftStatus = useCallback(
    (
      gift: Gift,
      toStatus: "confirmed" | "rejected",
      event: React.MouseEvent
    ) => {
      if (
        window.confirm(
          toStatus === "confirmed"
            ? "Are you sure you want to confirm this gift, and send the gift giver a confirmation message?"
            : "Are you sure you want to reject this gift, and send the gift giver a rejection message?"
        )
      ) {
        giftColl.doc(gift.id).set({ status: toStatus }, { merge: true });
      }
      event.stopPropagation();
    },
    [giftColl]
  );

  let onUpdateGiftDetails = useCallback(
    (updatedGift: Gift) => {
      giftColl
        .doc(updatedGift.id)
        .set(
          pick(
            updatedGift,
            "fromName",
            "fromEmail",
            "fromPhoneNumber",
            "toName",
            "toLanguage",
            "toAddress",
            "toLocation",
            "toSignificance",
            "fromMessage",
            "fromPhotographyPermissionGiven"
          ),
          { merge: true }
        );
    },
    [giftColl]
  );

  let onDeleteGift = useCallback(
    (gift: Gift) => {
      if (
        window.confirm(
          "Are you sure you want to delete this gift? This action is permanent and the gift giver will NOT be notified"
        )
      ) {
        giftColl.doc(gift.id).delete();
      }
    },
    [giftColl]
  );

  let onExportCSV = useCallback(() => {
    csvExporter.generateCsv(
      getTableData().map(({ gift, slot, assignedArtist }) => ({
        giftId: gift.id,
        slotId: slot.id,
        date: slot && formatDate(slot.date),
        time: slot && formatTime(slot.time),
        region: slot?.region,
        toName: gift.toName,
        toAddress: gift.toAddress,
        toLanguage: gift.toLanguage,
        reason: gift.toSignificance,
        fromName: gift.fromName,
        fromEmail: gift.fromEmail,
        fromPhoneNumber: gift.fromPhoneNumber,
        message: gift.fromMessage,
        photographyPermission: gift.fromPhotographyPermissionGiven || false,
        status: gift.status,
        assignedArtist: assignedArtist || "",
        cancellationReason: gift.cancellationReason || "",
      }))
    );
  }, [getTableData, csvExporter]);

  let tableData = getTableData();
  return (
    <div className="gifts">
      <header className="header">
        <Navigation currentPage="gifts" />
      </header>

      <main className="main">
        <h2>Summary</h2>
        <GiftsSummary data={tableData} />
        <h2>All Gifts</h2>
        <table className="gifts--list">
          <thead></thead>
          <tbody>
            {tableData.map(({ gift, slot, assignedArtist }) => (
              <React.Fragment key={gift.id}>
                <tr onClick={() => onToggleDetails(gift)}>
                  <td>{slot && formatDate(slot.date)}</td>
                  <td>{slot && formatTime(slot.time)}</td>
                  <td>{slot?.region}</td>
                  <td>{gift.toAddress}</td>
                  <td>{gift.fromEmail}</td>
                  <td>
                    <span
                      className={classNames(
                        "giftStatus",
                        gift.status || "pending"
                      )}
                    >
                      {gift.status || "pending"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={classNames(
                        "giftArtistStatus",
                        assignedArtist ? "assigned" : "unassigned"
                      )}
                    >
                      {gift.status === "confirmed"
                        ? assignedArtist || "no artist"
                        : ""}
                    </span>
                  </td>
                  <td>
                    {gift.status !== "confirmed" &&
                      gift.status !== "rejected" &&
                      gift.status !== "cancelled" && (
                        <button
                          onClick={(evt) =>
                            onUpdateGiftStatus(gift, "confirmed", evt)
                          }
                        >
                          Confirm
                        </button>
                      )}
                    {gift.status !== "rejected" &&
                      gift.status !== "cancelled" && (
                        <button
                          onClick={(evt) =>
                            onUpdateGiftStatus(gift, "rejected", evt)
                          }
                        >
                          Reject
                        </button>
                      )}
                  </td>
                  <td>
                    <button onClick={() => onDeleteGift(gift)}>Delete</button>
                  </td>
                </tr>
                {showingDetails[gift.id] && (
                  <tr>
                    <td></td>
                    <td></td>
                    <td colSpan={4}>
                      <GiftDetails
                        gift={gift}
                        onUpdateGift={onUpdateGiftDetails}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <button onClick={onExportCSV}>Export as CSV</button>
      </main>
    </div>
  );
};

interface GiftDetailsProps {
  gift: Gift;
  onUpdateGift: (newGift: Gift) => void;
}
const GiftDetails: React.FC<GiftDetailsProps> = ({ gift, onUpdateGift }) => {
  let [editingGift, setEditingGift] = useState<Gift>();
  let [addressValidationStatus, setAddressValidationStatus] = useState<
    "ok" | "validating" | "notFound" | "notInRegion"
  >("ok");
  let regions = useMemo(() => getRegionGeoJSON(), []);

  let edit = () => {
    setEditingGift(gift);
  };
  let update = () => {
    onUpdateGift(editingGift!);
    setEditingGift(undefined);
  };
  let cancelEdit = () => {
    setEditingGift(undefined);
  };

  useEffect(() => {
    if (!editingGift) return;
    let stillInEffect = true;
    setAddressValidationStatus("validating");
    if (editingGift.toAddress.trim().length === 0) {
      setAddressValidationStatus("notFound");
    } else {
      locateAddress(editingGift.toAddress, regions).then((loc) => {
        if (loc && loc.region === gift.toLocation?.region) {
          setEditingGift((e) => ({ ...e!, toLocation: loc }));
          setAddressValidationStatus("ok");
        } else if (loc && loc.region) {
          setAddressValidationStatus("notInRegion");
        } else {
          setAddressValidationStatus("notFound");
        }
      });
    }
    return () => {
      stillInEffect = false;
    };
  }, [gift?.toLocation?.region, editingGift?.toAddress, regions]);

  return (
    <table>
      <thead></thead>
      <tbody>
        <tr>
          <td>Created at:</td>
          <td>{gift.reservedAt && formatTimestamp(gift.reservedAt.seconds)}</td>
        </tr>
        <tr>
          <td>From:</td>
          <td>
            {editingGift ? (
              <input
                type="text"
                value={editingGift.fromName}
                onChange={(e) =>
                  setEditingGift({ ...editingGift!, fromName: e.target.value })
                }
              />
            ) : (
              gift.fromName
            )}
          </td>
        </tr>
        <tr>
          <td>Email:</td>
          <td>
            {editingGift ? (
              <input
                type="email"
                value={editingGift.fromEmail}
                onChange={(e) =>
                  setEditingGift({ ...editingGift!, fromEmail: e.target.value })
                }
              />
            ) : (
              gift.fromEmail
            )}
          </td>
        </tr>
        <tr>
          <td>Phone number:</td>
          <td>
            {" "}
            {editingGift ? (
              <input
                type="tel"
                value={editingGift.fromPhoneNumber}
                onChange={(e) =>
                  setEditingGift({
                    ...editingGift!,
                    fromPhoneNumber: e.target.value,
                  })
                }
              />
            ) : (
              gift.fromPhoneNumber
            )}
          </td>
        </tr>
        <tr>
          <td>To:</td>
          <td>
            {editingGift ? (
              <input
                type="text"
                value={editingGift.toName}
                onChange={(e) =>
                  setEditingGift({
                    ...editingGift!,
                    toName: e.target.value,
                  })
                }
              />
            ) : (
              gift.toName
            )}
          </td>
        </tr>
        <tr>
          <td>Language:</td>
          <td>
            {editingGift ? (
              <select
                value={editingGift.toLanguage}
                onChange={(e) =>
                  setEditingGift({
                    ...editingGift!,
                    toLanguage: e.target.value,
                  })
                }
              >
                <option value="fi">Finnish</option>
                <option value="en">English</option>
              </select>
            ) : (
              gift.toLanguage
            )}
          </td>
        </tr>
        <tr>
          <td>Location:</td>
          <td>
            {editingGift ? (
              <>
                <input
                  type="text"
                  value={editingGift.toAddress}
                  onChange={(e) =>
                    setEditingGift({
                      ...editingGift!,
                      toAddress: e.target.value,
                    })
                  }
                />
                {addressValidationStatus === "notFound" && (
                  <div className="giftDetails--validationError">
                    Address not found
                  </div>
                )}
                {addressValidationStatus === "notInRegion" && (
                  <div className="giftDetails--validationError">
                    Address not in same region as original
                  </div>
                )}
              </>
            ) : (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${gift.toLocation?.point[1]},${gift.toLocation?.point[0]}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {gift.toAddress}
              </a>
            )}
          </td>
        </tr>
        <tr>
          <td>Reason:</td>
          <td>
            {editingGift ? (
              <textarea
                value={editingGift.toSignificance}
                onChange={(e) =>
                  setEditingGift({
                    ...editingGift!,
                    toSignificance: e.target.value,
                  })
                }
              />
            ) : (
              gift.toSignificance
            )}
          </td>
        </tr>
        <tr>
          <td>Notes:</td>
          <td>
            {editingGift ? (
              <textarea
                value={editingGift.fromMessage}
                onChange={(e) =>
                  setEditingGift({
                    ...editingGift!,
                    fromMessage: e.target.value,
                  })
                }
              />
            ) : (
              gift.fromMessage
            )}
          </td>
        </tr>
        <tr>
          <td>Permission to photograph:</td>
          <td>
            {editingGift ? (
              <input
                type="checkbox"
                checked={editingGift.fromPhotographyPermissionGiven}
                onChange={(e) =>
                  setEditingGift({
                    ...editingGift!,
                    fromPhotographyPermissionGiven: e.target.checked,
                  })
                }
              />
            ) : gift.fromPhotographyPermissionGiven ? (
              "yes"
            ) : (
              "no"
            )}
          </td>
        </tr>
        <tr>
          <td>App link:</td>
          <td>
            <a
              href={`${MAIN_APP_HOST}/gift?id=${gift.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {`${MAIN_APP_HOST}/gift?id=${gift.id}`}
            </a>
          </td>
        </tr>
        {gift.status === "cancelled" && (
          <tr>
            <td>Cancellation reason:</td>
            <td>{gift.cancellationReason}</td>
          </tr>
        )}
        <tr>
          <td colSpan={2}>
            {editingGift ? (
              <>
                <button onClick={cancelEdit}>Cancel</button>{" "}
                <button
                  onClick={update}
                  disabled={addressValidationStatus !== "ok"}
                >
                  Update
                </button>
              </>
            ) : (
              <button onClick={edit}>Edit gift</button>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

interface GiftsSummaryProps {
  data: { gift: Gift; slot: Slot; assignedArtist: string }[];
}
const GiftsSummary: React.FC<GiftsSummaryProps> = ({ data }) => {
  let byRegion = groupBy(data, (d) => d.slot.region);
  let allByStatus = groupBy(data, (r) => r.gift.status);
  return (
    <table className="giftsSummary">
      <thead>
        <tr>
          <th>Region</th>
          <th>Confirmed</th>
          <th>Pending</th>
          <th>Rejected</th>
          <th>Cancelled</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody></tbody>
      {Object.keys(byRegion).map((r) => {
        let byStatus = groupBy(byRegion[r], (r) => r.gift.status);
        return (
          <tr key={r}>
            <td>{r}</td>
            <td>{(byStatus["confirmed"] || []).length}</td>
            <td>{(byStatus["pending"] || []).length}</td>
            <td>{(byStatus["rejected"] || []).length}</td>
            <td>{(byStatus["cancelled"] || []).length}</td>
            <td>{byRegion[r].length}</td>
          </tr>
        );
      })}
      <tr>
        <td>All regions</td>
        <td>{(allByStatus["confirmed"] || []).length}</td>
        <td>{(allByStatus["pending"] || []).length}</td>
        <td>{(allByStatus["rejected"] || []).length}</td>
        <td>{(allByStatus["cancelled"] || []).length}</td>
        <td>{data.length}</td>
      </tr>
    </table>
  );
};

function formatTimestamp(seconds: number) {
  let date = new Date(seconds * 1000);
  return `${formatDateFromComponents(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  )} ${formatTimeFromComponents(date.getHours(), date.getMinutes())}`;
}
