import { GoogleMap, LoadScript, Marker, InfoWindow, Circle } from "@react-google-maps/api";
import { useState, useRef, useEffect, useCallback } from "react";

const TOKYO_CENTER = { lat: 35.6812, lng: 139.7671 };

const STATION_COORDS = {
  "新宿":   { lat: 35.6896, lng: 139.7006 },
  "新宿駅": { lat: 35.6896, lng: 139.7006 },
  "渋谷":   { lat: 35.6580, lng: 139.7016 },
  "渋谷駅": { lat: 35.6580, lng: 139.7016 },
  "池袋":   { lat: 35.7295, lng: 139.7109 },
  "池袋駅": { lat: 35.7295, lng: 139.7109 },
  "銀座":   { lat: 35.6717, lng: 139.7650 },
  "銀座駅": { lat: 35.6717, lng: 139.7650 },
  "浅草":   { lat: 35.7147, lng: 139.7966 },
  "浅草駅": { lat: 35.7147, lng: 139.7966 },
  "東京":   { lat: 35.6812, lng: 139.7671 },
  "東京駅": { lat: 35.6812, lng: 139.7671 },
  "上野":   { lat: 35.7141, lng: 139.7774 },
  "上野駅": { lat: 35.7141, lng: 139.7774 },
  "原宿":   { lat: 35.6702, lng: 139.7027 },
  "原宿駅": { lat: 35.6702, lng: 139.7027 },
  "恵比寿": { lat: 35.6469, lng: 139.7101 },
  "恵比寿駅": { lat: 35.6469, lng: 139.7101 },
  "表参道": { lat: 35.6651, lng: 139.7126 },
  "表参道駅": { lat: 35.6651, lng: 139.7126 },
  "六本木": { lat: 35.6628, lng: 139.7314 },
  "六本木駅": { lat: 35.6628, lng: 139.7314 },
  "秋葉原": { lat: 35.7022, lng: 139.7742 },
  "秋葉原駅": { lat: 35.7022, lng: 139.7742 },
  "品川":   { lat: 35.6284, lng: 139.7387 },
  "品川駅": { lat: 35.6284, lng: 139.7387 },
  "横浜":   { lat: 35.4658, lng: 139.6225 },
  "横浜駅": { lat: 35.4658, lng: 139.6225 },
  "鎌倉":   { lat: 35.3194, lng: 139.5467 },
  "鎌倉駅": { lat: 35.3194, lng: 139.5467 },
};

function getContainerStyle(mapHeight, noRadius) {
  return {
    width: "100%",
    height: mapHeight || "400px",
    borderRadius: noRadius ? 0 : "12px",
  };
}


export default function MapView({ shops, onSelectShop, mapHeight, noRadius, selectedStation }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  const mapRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  // Build shop position map: use shop.lat/lng directly, fallback to station coords
  const shopPositions = {};
  for (const shop of shops) {
    if (shop.lat && shop.lng) {
      shopPositions[shop.id] = { lat: shop.lat, lng: shop.lng };
    } else {
      const stCoords = STATION_COORDS[shop.station] || STATION_COORDS[shop.station?.replace(/駅$/, "") + "駅"];
      if (stCoords) {
        // 店舗IDに基づく決定的なオフセット（ピンが重ならないよう約200m以内に散布）
        const seed = String(shop.id).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        shopPositions[shop.id] = {
          lat: stCoords.lat + ((seed % 60) - 30) * 0.00007,
          lng: stCoords.lng + (((seed * 7) % 60) - 30) * 0.00007,
        };
      }
    }
  }

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    // Get current location for blue dot
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  // Pan map when selectedStation changes
  useEffect(() => {
    if (!mapRef.current) return;
    if (!selectedStation || selectedStation === "all") return;
    const coords = STATION_COORDS[selectedStation];
    if (coords) {
      mapRef.current.panTo(coords);
      mapRef.current.setZoom(15);
    }
  }, [selectedStation]);


  const displayShops = shops.slice(0, 50);

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
      <GoogleMap
        mapContainerStyle={getContainerStyle(mapHeight, noRadius)}
        center={TOKYO_CENTER}
        zoom={12}
        onLoad={onMapLoad}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        }}
      >
        {/* 現在地の青いドット */}
        {currentLocation && (
          <>
            <Circle
              center={currentLocation}
              radius={80}
              options={{
                fillColor: "#4285F4",
                fillOpacity: 0.25,
                strokeColor: "#4285F4",
                strokeOpacity: 0.6,
                strokeWeight: 1,
              }}
            />
            <Marker
              position={currentLocation}
              icon={{
                path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                scale: 8,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 2,
              }}
            />
          </>
        )}

        {/* お店のピン */}
        {displayShops.map((shop) => {
          const pos = shopPositions[shop.id];
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

        {selected && shopPositions[selected] &&
          (() => {
            const shop = shops.find((s) => s.id === selected);
            if (!shop) return null;
            return (
              <InfoWindow
                position={shopPositions[selected]}
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
