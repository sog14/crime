import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { MapPin } from 'lucide-react';

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLocation?: [number, number];
}

export function LocationPicker({ onLocationSelect, initialLocation = [28.6139, 77.2090] }: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>(initialLocation);

  function LocationMarker() {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      },
    });

    return position === null ? null : (
      <Marker position={position}></Marker>
    );
  }

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden border border-zinc-200 relative">
      <div className="absolute top-2 right-2 z-[1000] bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-zinc-500 shadow-sm flex items-center gap-1">
        <MapPin size={10} /> Click to pick location
      </div>
      <MapContainer center={position} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationMarker />
      </MapContainer>
    </div>
  );
}
