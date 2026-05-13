import { useEffect, useRef, useState } from "react";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import type { Business } from "@/data/businesses";
import { MapPin, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MapViewProps {
  businesses: Business[];
  center?: { lat: number; lng: number };
  zoom?: number;
}

export default function MapView({ businesses, center, zoom = 11 }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const navigate = useNavigate();
  const { maps, loading, error, available } = useGoogleMaps();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Calcular centro automático baseado nos negócios
  const autoCenter = (): { lat: number; lng: number } => {
    if (center) return center;
    if (businesses.length === 0) return { lat: 45.5017, lng: -73.5673 }; // Montreal
    const avgLat = businesses.reduce((s, b) => s + b.address.lat, 0) / businesses.length;
    const avgLng = businesses.reduce((s, b) => s + b.address.lng, 0) / businesses.length;
    return { lat: avgLat, lng: avgLng };
  };

  useEffect(() => {
    if (!maps || !mapRef.current || mapInstanceRef.current) return;

    const loc = autoCenter();
    mapInstanceRef.current = new maps.Map(mapRef.current, {
      center: loc,
      zoom,
      mapId: "caramelinho_map",
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      zoomControl: true,
    });

    return () => {
      mapInstanceRef.current = null;
    };
  }, [maps]);

  // Atualizar markers quando businesses mudar
  useEffect(() => {
    if (!maps || !mapInstanceRef.current) return;

    // Limpar markers antigos
    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current = [];

    if (!maps.marker?.AdvancedMarkerElement) {
      // Fallback para markers tradicionais se AdvancedMarkerElement não existir
      businesses.forEach((biz) => {
        if (!biz.address.lat || !biz.address.lng) return;
        const marker = new maps.Marker({
          position: { lat: biz.address.lat, lng: biz.address.lng },
          map: mapInstanceRef.current!,
          title: biz.name,
          animation: google.maps.Animation.DROP,
        });
        marker.addListener("click", () => {
          navigate(buildMarkerUrl(biz));
        });
        markersRef.current.push(marker as any);
      });

      // Ajustar bounds
      if (businesses.length > 0) {
        const bounds = new maps.LatLngBounds();
        businesses.forEach((biz) => {
          if (biz.address.lat && biz.address.lng) {
            bounds.extend({ lat: biz.address.lat, lng: biz.address.lng });
          }
        });
        mapInstanceRef.current.fitBounds(bounds, 50);
      }
      return;
    }

    // Usar AdvancedMarkerElement (mais moderno)
    businesses.forEach((biz) => {
      if (!biz.address.lat || !biz.address.lng) return;

      const pinElement = document.createElement("div");
      pinElement.className =
        "cursor-pointer transition-transform hover:scale-110";
      pinElement.innerHTML = `
        <div style="
          background: ${
            selectedId === biz.id
              ? "linear-gradient(135deg, #f59e0b, #d97706)"
              : "linear-gradient(135deg, #f97316, #ea580c)"
          };
          color: white;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          gap: 4px;
          border: 2px solid white;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/></svg>
          ${biz.name.length > 18 ? biz.name.slice(0, 16) + "…" : biz.name}
        </div>
      `;

      const marker = new maps.marker.AdvancedMarkerElement({
        position: { lat: biz.address.lat, lng: biz.address.lng },
        map: mapInstanceRef.current!,
        content: pinElement,
        title: biz.name,
      });

      marker.addListener("click", () => {
        setSelectedId(biz.id);
        navigate(buildMarkerUrl(biz));
      });

      markersRef.current.push(marker);
    });

    // Ajustar zoom para mostrar todos
    if (businesses.length > 0) {
      const bounds = new maps.LatLngBounds();
      businesses.forEach((biz) => {
        if (biz.address.lat && biz.address.lng) {
          bounds.extend({ lat: biz.address.lat, lng: biz.address.lng });
        }
      });
      mapInstanceRef.current.fitBounds(bounds, 50);
    }
  }, [maps, businesses, selectedId]);

  if (!available) {
    return (
      <div className="w-full h-full min-h-[400px] rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center p-8">
        <div className="text-center">
          <MapPin className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Mapa indisponível</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Configure a chave da API Google Maps nas variáveis de ambiente para ativar o mapa.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full min-h-[400px] rounded-xl bg-secondary/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando mapa…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full min-h-[400px] rounded-xl bg-destructive/5 border border-destructive/20 flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-destructive/60 mx-auto mb-3" />
          <p className="text-destructive font-medium">Erro ao carregar mapa</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full min-h-[400px] rounded-xl overflow-hidden" />;
}

function buildMarkerUrl(biz: Business): string {
  return `/${biz.address.countryCode}/${biz.address.stateCode}/${biz.address.city.toLowerCase()}/${biz.slug}`;
}
