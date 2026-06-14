import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, LocateFixed } from "lucide-react";

type Props = {
  onChange: (loc: { lat: number; lng: number; address?: string }) => void;
};

export function LocationPicker({ onChange }: Props) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !mapEl.current) return;
      LRef.current = L;
      // Default: Nairobi
      const start: [number, number] = [-1.286389, 36.817223];
      const map = L.map(mapEl.current).setView(start, 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      const marker = L.marker(start, { draggable: true, icon }).addTo(map);
      markerRef.current = marker;
      mapRef.current = map;

      const update = (latlng: { lat: number; lng: number }) => {
        setCoords(latlng);
        onChange({ lat: latlng.lat, lng: latlng.lng });
      };
      marker.on("dragend", () => update(marker.getLatLng()));
      map.on("click", (e: any) => {
        marker.setLatLng(e.latlng);
        update(e.latlng);
      });
      setTimeout(() => map.invalidateSize(), 100);
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [onChange]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(ll);
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([ll.lat, ll.lng], 15);
          markerRef.current.setLatLng([ll.lat, ll.lng]);
        }
        onChange(ll);
      },
      () => setLoading(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium flex items-center gap-1"><MapPin className="h-4 w-4" /> Delivery Location</div>
        <Button type="button" size="sm" variant="outline" onClick={useMyLocation} disabled={loading}>
          <LocateFixed className="h-4 w-4" /> {loading ? "Locating…" : "Use my location"}
        </Button>
      </div>
      <div ref={mapEl} className="h-64 w-full rounded-md border" />
      {coords && (
        <p className="text-xs text-muted-foreground">
          Pinned: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} — drag the pin or click the map to adjust.
        </p>
      )}
    </div>
  );
}