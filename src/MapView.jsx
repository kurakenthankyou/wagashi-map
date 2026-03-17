import { GoogleMap, LoadScript, Marker, InfoWindow, DirectionsRenderer } from "@react-google-maps/api";
import { useState, useRef } from "react";

const TOKYO_CENTER = { lat: 35.6812, lng: 139.7671 };

function getContainerStyle(mapHeight, noRadius) {
  return {
    width: "100%",
    height: mapHeight || "400px",
    borderRadius: noRadius ? 0 : "12px",
  };
}

function useGeocode(apiKey) {
  const geocode = async (address) => {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address + " 東京")}&key=${apiKey}&language=ja`
    );
    const data = await res.json();
    if (data.results?.[0]) {
      return data.results[0].geometry.location;
    }
    return null;
  };
  return geocode;
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapView({ shops, onSelectShop, onRouteShopsChange, mapHeight, noRadius, hideRoutePanel }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  const [markers, setMarkers] = useState({});
  const markersRef = useRef({});
  const [selected, setSelected] = useState(null);
  const geocode = useGeocode(apiKey);

  // Route state
  const [routeOpen, setRouteOpen] = useState(false);
  const [origin, setOrigin] = useState(null);
  const [originLabel, setOriginLabel] = useState("");
  const [destination, setDestination] = useState("");
  const [directionsResult, setDirectionsResult] = useState(null);
  const [localRouteShopIds, setLocalRouteShopIds] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [searching, setSearching] = useState(false);

  async function handleMapLoad() {
    const targets = shops.slice(0, 20);
    const results = {};
    for (const shop of targets) {
      if (!markersRef.current[shop.id]) {
        const pos = await geocode(shop.station);
        if (pos) {
          results[shop.id] = {
            lat: pos.lat + (Math.random() - 0.5) * 0.003,
            lng: pos.lng + (Math.random() - 0.5) * 0.003,
          };
        }
      }
    }
    markersRef.current = { ...markersRef.current, ...results };
    setMarkers((prev) => ({ ...prev, ...results }));
  }

  function getCurrentLocation() {
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setOriginLabel("現在地");
        setGettingLocation(false);
      },
      () => {
        alert("位置情報の取得に失敗しました");
        setGettingLocation(false);
      }
    );
  }

  async function geocodeAllShops() {
    const results = {};
    for (const shop of shops) {
      if (!markersRef.current[shop.id]) {
        const pos = await geocode(shop.station);
        if (pos) {
          results[shop.id] = {
            lat: pos.lat + (Math.random() - 0.5) * 0.003,
            lng: pos.lng + (Math.random() - 0.5) * 0.003,
          };
        }
      }
    }
    if (Object.keys(results).length > 0) {
      markersRef.current = { ...markersRef.current, ...results };
      setMarkers((prev) => ({ ...prev, ...results }));
    }
  }

  async function searchRoute() {
    if (!origin || !destination.trim()) {
      alert("現在地と目的地を設定してください");
      return;
    }
    setSearching(true);

    // 未ジオコーディングの店舗を補完
    await geocodeAllShops();

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: new window.google.maps.LatLng(origin.lat, origin.lng),
        destination: destination,
        travelMode: window.google.maps.TravelMode.TRANSIT,
        transitOptions: { departureTime: new Date() },
      },
      (result, status) => {
        if (status !== "OK") {
          // TRANSIT失敗時はDRIVINGでリトライ
          directionsService.route(
            {
              origin: new window.google.maps.LatLng(origin.lat, origin.lng),
              destination: destination,
              travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (r2, s2) => {
              if (s2 === "OK") {
                applyRouteFilter(r2);
              } else {
                alert("ルートが見つかりませんでした");
                setSearching(false);
              }
            }
          );
          return;
        }
        applyRouteFilter(result);
      }
    );
  }

  function applyRouteFilter(result) {
    setDirectionsResult(result);

    // ルート上の全ポイントを収集
    const routePoints = [];
    result.routes[0].legs.forEach((leg) => {
      leg.steps.forEach((step) => {
        step.path.forEach((pt) => routePoints.push(pt));
      });
    });

    // ルートから1.5km以内の店舗を抽出
    const THRESHOLD = 1500;
    const nearbyIds = new Set();
    for (const shop of shops) {
      const pos = markersRef.current[shop.id];
      if (!pos) continue;
      for (const pt of routePoints) {
        if (haversine(pos.lat, pos.lng, pt.lat(), pt.lng()) <= THRESHOLD) {
          nearbyIds.add(shop.id);
          break;
        }
      }
    }

    setLocalRouteShopIds(nearbyIds);
    onRouteShopsChange?.(nearbyIds);
    setSearching(false);
  }

  function clearRoute() {
    setDirectionsResult(null);
    setLocalRouteShopIds(null);
    setOrigin(null);
    setOriginLabel("");
    setDestination("");
    onRouteShopsChange?.(null);
  }

  function toggleRoutePanel() {
    if (routeOpen) clearRoute();
    setRouteOpen((o) => !o);
  }

  const displayShops = localRouteShopIds
    ? shops.filter((s) => localRouteShopIds.has(s.id))
    : shops.slice(0, 20);

  // APIキー未設定時はプレースホルダーを表示
  if (!apiKey) {
    return (
      <div style={{
        width: "100%",
        height: mapHeight || "400px",
        background: "#F3F4F6",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#9CA3AF",
        fontSize: 13,
        gap: 6,
      }}>
        <span style={{ fontSize: 32 }}>🗺️</span>
        <span>Google Maps APIキーを .env に設定してください</span>
        <code style={{ fontSize: 11, background: "#E5E7EB", padding: "2px 8px", borderRadius: 4 }}>
          VITE_GOOGLE_MAPS_KEY=your_key
        </code>
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} language="ja">
      {/* ルート検索パネル */}
      <div style={{ marginBottom: hideRoutePanel ? 0 : 8, display: hideRoutePanel ? "none" : undefined }}>
        <button
          onClick={toggleRoutePanel}
          style={{
            background: routeOpen ? "#FF8C00" : "white",
            color: routeOpen ? "white" : "#FF8C00",
            border: "1px solid #FF8C00",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          🗺️ 途中の手土産を探す
        </button>

        {routeOpen && (
          <div
            style={{
              background: "white",
              border: "0.5px solid #ddd",
              borderRadius: 10,
              padding: "12px 14px",
              marginTop: 8,
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
            }}
          >
            <button
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              style={{
                background: origin ? "#FFF8F0" : "#f5f0ea",
                border: `0.5px solid ${origin ? "#FF8C00" : "#ddd"}`,
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
                color: origin ? "#FF8C00" : "#666",
              }}
            >
              {gettingLocation ? "取得中..." : originLabel ? `📍 ${originLabel}` : "📍 現在地を取得"}
            </button>
            <span style={{ color: "#bbb", fontSize: 16 }}>→</span>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchRoute()}
              placeholder="目的地（例: 新宿駅）"
              style={{
                flex: 1,
                minWidth: 140,
                padding: "6px 10px",
                border: "0.5px solid #ddd",
                borderRadius: 8,
                fontSize: 13,
              }}
            />
            <button
              onClick={searchRoute}
              disabled={searching || !origin || !destination.trim()}
              style={{
                background: "#FF8C00",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "6px 16px",
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
                opacity: !origin || !destination.trim() ? 0.5 : 1,
              }}
            >
              {searching ? "検索中..." : "検索"}
            </button>
            {directionsResult && (
              <>
                <span style={{ fontSize: 13, color: "#888" }}>
                  {localRouteShopIds?.size ?? 0}件の手土産店が見つかりました
                </span>
                <button
                  onClick={clearRoute}
                  style={{
                    background: "none",
                    border: "0.5px solid #ddd",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 13,
                    cursor: "pointer",
                    color: "#888",
                  }}
                >
                  クリア
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <GoogleMap
        mapContainerStyle={getContainerStyle(mapHeight, noRadius)}
        center={TOKYO_CENTER}
        zoom={12}
        onLoad={handleMapLoad}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {directionsResult && (
          <DirectionsRenderer
            directions={directionsResult}
            options={{ suppressMarkers: true }}
          />
        )}

        {displayShops.map((shop) => {
          const pos = markers[shop.id];
          if (!pos) return null;
          return (
            <Marker
              key={shop.id}
              position={pos}
              title={shop.name}
              onClick={() => setSelected(shop.id === selected ? null : shop.id)}
              label={{
                text: shop.emoji || "🍡",
                fontSize: "18px",
              }}
            />
          );
        })}

        {selected && markers[selected] &&
          (() => {
            const shop = shops.find((s) => s.id === selected);
            if (!shop) return null;
            return (
              <InfoWindow
                position={markers[selected]}
                onCloseClick={() => setSelected(null)}
              >
                <div style={{ maxWidth: 220, fontFamily: "sans-serif" }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                    {shop.emoji} {shop.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                    📍 {shop.station} 徒歩{shop.walk_minutes}分
                  </div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
                    {shop.description?.slice(0, 60)}...
                  </div>
                  <button
                    onClick={() => onSelectShop?.(shop)}
                    style={{
                      background: "#FF8C00",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      padding: "5px 12px",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    詳細を見る
                  </button>
                </div>
              </InfoWindow>
            );
          })()}
      </GoogleMap>
    </LoadScript>
  );
}
