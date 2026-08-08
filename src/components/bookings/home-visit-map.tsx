"use client";

import { useState } from "react";
import { APIProvider, Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useMemo } from "react";

const BOLIVIA_BOUNDS = {
  north: -9.6,
  south: -22.9,
  east: -57.4,
  west: -69.6,
};

function MapViewportSync({ center }: { center: google.maps.LatLngLiteral }) {
  const map = useMap();

  useEffect(() => {
    map?.panTo(center);
  }, [center, map]);

  return null;
}

export function HomeVisitMap({
  apiKey,
  latitude,
  longitude,
  address,
  addressReference,
  searching,
  onAddressChange,
  onAddressReferenceChange,
  onSearch,
  onPositionChange,
}: {
  apiKey: string;
  latitude?: number;
  longitude?: number;
  address: string;
  addressReference: string;
  searching: boolean;
  onAddressChange: (value: string) => void;
  onAddressReferenceChange: (value: string) => void;
  onSearch: () => void;
  onPositionChange: (latitude: number, longitude: number) => void;
}) {
  const [searchText, setSearchText] = useState(address);
  const center = useMemo(
    () => ({
      lat: latitude ?? -16.4897,
      lng: longitude ?? -68.1193,
    }),
    [latitude, longitude],
  );

  return (
    <div className="home-visit-map-panel">
      <div className="home-visit-map-search">
        <label>
          Buscar dirección en Bolivia
          <div className="inline-form-control">
            <input
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value);
                onAddressChange(event.target.value);
              }}
              placeholder="Calle, número y barrio"
              required
            />
            <button
              className="outline-button compact-button"
              disabled={searching || !searchText.trim()}
              onClick={() => onSearch()}
              type="button"
            >
              {searching ? "Buscando…" : "Buscar"}
            </button>
          </div>
        </label>
      </div>
      {!apiKey ? (
        <p className="form-error" role="alert">
          Configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY para mostrar el mapa.
        </p>
      ) : (
        <APIProvider apiKey={apiKey} language="es" region="BO">
          <Map
            className="home-visit-map"
            defaultCenter={center}
            defaultZoom={13}
            gestureHandling="greedy"
            restriction={{
              latLngBounds: BOLIVIA_BOUNDS,
              strictBounds: true,
            }}
            disableDefaultUI={false}
            onClick={(event) => {
              const position = event.detail.latLng;
              if (position) {
                onPositionChange(position.lat, position.lng);
              }
            }}
          >
            <MapViewportSync center={center} />
            <Marker
              position={center}
              draggable
              onDragEnd={(event) => {
                const position = event.latLng;
                if (position) {
                  onPositionChange(position.lat(), position.lng());
                }
              }}
            />
          </Map>
        </APIProvider>
      )}
      <label>
        Referencia del domicilio
        <input
          name="addressReference"
          value={addressReference}
          onChange={(event) => onAddressReferenceChange(event.target.value)}
          placeholder="Ej. Casa de portón negro"
          required
        />
      </label>
      <p className="form-hint">
        Arrastra el mapa con el mouse o mueve el pin para ajustar la ubicación
        exacta. También puedes hacer clic en el mapa para colocar el pin. La
        búsqueda está restringida a Bolivia.
      </p>
    </div>
  );
}
