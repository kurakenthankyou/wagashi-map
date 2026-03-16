import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { useState } from "react";

const TOKYO_CENTER = { lat: 35.6812, lng: 139.7671 };

const containerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "12px",
};

// 駅名から緯度経度を取得するためのジオコーディング
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

export default function MapView({ shops, onSelectShop }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  const [markers, setMarkers] = useState({});
  const [selected, setSelected] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const geocode = useGeocode(apiKey);

  async function handleMapLoad() {
    setMapLoaded(true);
    // 表示中の店舗の座標を取得（最大20件）
    const targets = shops.slice(0, 20);
    const results = {};
    for (const shop of targets) {
      if (!markers[shop.id]) {
        const pos = await geocode(shop.station);
        if (pos) {
          // 同じ駅に複数店舗がある場合は少しずらす
          results[shop.id] = {
            lat: pos.lat + (Math.random() - 0.5) * 0.003,
            lng: pos.lng + (Math.random() - 0.5) * 0.003,
          };
        }
      }
    }
    setMarkers(prev => ({ ...prev, ...results }));
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} language="ja">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={TOKYO_CENTER}
        zoom={12}
        onLoad={handleMapLoad}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {shops.slice(0, 20).map((shop) => {
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

        {selected && markers[selected] && (() => {
          const shop = shops.find(s => s.id === selected);
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
                    background: "#c2536a",
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