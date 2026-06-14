import { useEffect, useMemo, useState } from "react";
import NewPropertyCard from "../../../user-pages/searchpage/NewPropertyCard.jsx";
import NearbyMapCard from "./NearbyMapCard.jsx";
import { setLastSearchProperties } from "../../lib/api.js";
import { registerSearchPropertyCodes } from "../../lib/chatActions.js";
import "../../../user-pages/searchpage/NewPropertyCard.css";
import "../../../user-pages/NewSearchProperty.css";

export default function PropertyResults({ data }) {
  const [viewMode, setViewMode] = useState("card");
  const itemsKey = (data.items || []).map((p) => p._id || p.id).join("|");
  const items = useMemo(() => data.items || [], [itemsKey]);

  useEffect(() => {
    setLastSearchProperties(items);
    registerSearchPropertyCodes(items);
  }, [itemsKey, items]);

  const count = items.length;
  const withCoords = items.filter((p) => p.latitude && p.longitude);

  return (
    <div className="cb-property-results">
      <div className="cb-property-results-toolbar">
        <div className="cb-property-results-meta">
          {data.intro && <p className="cb-md cb-msg-text cb-property-results-intro">{data.intro}</p>}
          <span className="cb-property-results-count">
            <strong>{count}</strong> {count === 1 ? "property" : "properties"}
          </span>
        </div>
        <div className="nsp-view-toggles cb-view-toggles">
          <button
            type="button"
            className={`nsp-view-toggle ${viewMode === "card" ? "nsp-view-toggle--active" : ""}`}
            onClick={() => setViewMode("card")}
            title="Card view"
          >
            <i className="fa-solid fa-th-large" />
          </button>
          <button
            type="button"
            className={`nsp-view-toggle ${viewMode === "list" ? "nsp-view-toggle--active" : ""}`}
            onClick={() => setViewMode("list")}
            title="List view"
          >
            <i className="fa-solid fa-list" />
          </button>
          {withCoords.length > 0 && (
            <button
              type="button"
              className={`nsp-view-toggle ${viewMode === "map" ? "nsp-view-toggle--active" : ""}`}
              onClick={() => setViewMode("map")}
              title="Map view"
            >
              <i className="fa-solid fa-map" /> Map
            </button>
          )}
        </div>
      </div>

      {viewMode === "map" && withCoords.length > 0 ? (
        <NearbyMapCard
          data={{
            title: data.mapTitle || `Properties Map (${withCoords.length})`,
            properties: withCoords,
            showUserMarker: false,
            showCircle: false,
          }}
        />
      ) : (
        <div className={viewMode === "list" ? "nsp-list-layout cb-nsp-list" : "nsp-grid cb-nsp-grid"}>
          {items.map((p, i) => (
            <NewPropertyCard key={p._id || p.id || i} property={p} viewMode={viewMode === "list" ? "list" : "card"} chatMode={true} />
          ))}
        </div>
      )}

      {data.totalCount && count < data.totalCount && (
        <div className="cb-results-info">Showing {count} of {data.totalCount} results</div>
      )}
    </div>
  );
}
