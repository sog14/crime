import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLocation?: [number, number];
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

const customPinIcon = typeof window !== 'undefined' ? L.divIcon({
  html: `<div class="w-8 h-8 -ml-4 -mt-8 flex items-center justify-center relative">
           <div class="w-6 h-6 bg-red-650 bg-red-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center relative">
             <div class="w-2.5 h-2.5 bg-white rounded-full"></div>
           </div>
           <div class="w-3 h-3 bg-red-500/50 rounded-full animate-ping absolute bottom-1"></div>
         </div>`,
  className: 'custom-div-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 32]
}) : null;

function MapEventsHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export function LocationPicker({ onLocationSelect, initialLocation = [26.5944, 85.4843] }: LocationPickerProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number }>({
    lat: initialLocation[0],
    lng: initialLocation[1]
  });

  // Sync position with initialLocation changes
  useEffect(() => {
    setPosition({
      lat: initialLocation[0],
      lng: initialLocation[1]
    });
  }, [initialLocation[0], initialLocation[1]]);

  const handleMapClick = (e: any) => {
    const latLng = e.detail?.latLng || e.latLng;
    if (latLng) {
      const lat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
      const lng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;
      setPosition({ lat, lng });
      onLocationSelect(lat, lng);
    }
  };

  if (!hasValidKey) {
    return (
      <div className="h-64 w-full rounded-2xl overflow-hidden border border-zinc-200 relative shadow-inner">
        <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-zinc-900 shadow-lg border border-zinc-100 flex items-center gap-1.5 pointer-events-none">
          <MapPin size={12} className="text-red-650" /> Click Map to Set Place (Google Maps Fallback)
        </div>
        
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={13}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution="&copy; Google Maps"
            url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          />
          <MapEventsHandler onClick={(lat, lng) => {
            setPosition({ lat, lng });
            onLocationSelect(lat, lng);
          }} />
          <Marker position={[position.lat, position.lng]} icon={customPinIcon!} />
        </MapContainer>
      </div>
    );
  }

  return (
    <div className="h-64 w-full rounded-2xl overflow-hidden border border-zinc-200 relative shadow-inner">
      <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-zinc-900 shadow-lg border border-zinc-100 flex items-center gap-1.5 pointer-events-none">
        <MapPin size={12} className="text-red-100 text-red-600" /> Click Map to Set Place
      </div>
      
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={position}
          center={position}
          defaultZoom={13}
          zoom={13}
          onClick={handleMapClick}
          mapId="DEMO_MAP_ID"
          gestureHandling="cooperative"
          disableDefaultUI={true}
          style={{ width: '100%', height: '100%' }}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        >
          <AdvancedMarker position={position}>
            <Pin background="#ef4444" glyphColor="#ffffff" borderColor="#ffffff" />
          </AdvancedMarker>
        </Map>
      </APIProvider>
    </div>
  );
}
