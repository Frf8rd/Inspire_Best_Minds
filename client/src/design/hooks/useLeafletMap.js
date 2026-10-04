import { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function useLeafletMap(elementRef, center, zoom) {
  const mapRef = useRef(null);

  useEffect(() => {
    const map = L.map(elementRef.current).setView(center, zoom);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'OpenStreetMap contributors',
    }).addTo(map);
    mapRef.current = map;

    return () => map.remove();
  }, [center, elementRef, zoom]);

  return mapRef;
}
