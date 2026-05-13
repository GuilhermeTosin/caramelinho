import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { isMapsApiAvailable, loadGoogleMapsApi } from "@/lib/google-maps";

export interface AddressResult {
  formattedAddress: string;
  lat: number;
  lng: number;
  street: string;
  city: string;
  state: string;
  stateCode: string;
  country: string;
  countryCode: string;
  postalCode: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onPlaceSelected: (place: AddressResult) => void;
  placeholder?: string;
  disabled?: boolean;
}

/** Mapa de nomes de estados brasileiros (longos) para siglas */
const BR_STATE_NAMES: Record<string, string> = {
  "acre": "ac",
  "alagoas": "al",
  "amapá": "ap",
  "amazonas": "am",
  "bahia": "ba",
  "ceará": "ce",
  "distrito federal": "df",
  "espírito santo": "es",
  "goiás": "go",
  "maranhão": "ma",
  "mato grosso": "mt",
  "mato grosso do sul": "ms",
  "minas gerais": "mg",
  "pará": "pa",
  "paraíba": "pb",
  "paraná": "pr",
  "pernambuco": "pe",
  "piauí": "pi",
  "rio de janeiro": "rj",
  "rio grande do norte": "rn",
  "rio grande do sul": "rs",
  "rondônia": "ro",
  "roraima": "rr",
  "santa catarina": "sc",
  "são paulo": "sp",
  "sergipe": "se",
  "tocantins": "to",
};

/** Tenta extrair sigla de estado (província) de um componente do Google Places.
 * Recebe um array de address_components e retorna { stateCode, state }
 */
function extractState(
  components: google.maps.GeocoderAddressComponent[],
): { stateCode: string; state: string } {
  for (const comp of components) {
    if (
      comp.types.includes("administrative_area_level_1") ||
      comp.types.includes("administrative_area_level_2")
    ) {
      const name = comp.short_name || comp.long_name;
      const long = comp.long_name?.toLowerCase() || "";
      // Se short_name tem 2 letras, provavelmente é sigla
      if (name?.length === 2) {
        return { stateCode: name.toLowerCase(), state: comp.long_name || name };
      }
      // Tenta lookup no mapa de estados brasileiros
      if (BR_STATE_NAMES[long]) {
        return { stateCode: BR_STATE_NAMES[long], state: comp.long_name || name! };
      }
      // Fallback: retorna short_name como code, mas limita a 3 chars
      return {
        stateCode: (name || long).slice(0, 3).toLowerCase(),
        state: comp.long_name || name || "",
      };
    }
  }
  return { stateCode: "", state: "" };
}

/** Extrai país do address_components */
function extractCountry(
  components: google.maps.GeocoderAddressComponent[],
): { countryCode: string; country: string } {
  for (const comp of components) {
    if (comp.types.includes("country")) {
      return {
        countryCode: (comp.short_name || "").toLowerCase(),
        country: comp.long_name || "",
      };
    }
  }
  return { countryCode: "", country: "" };
}

/** Extrai cidade */
function extractCity(
  components: google.maps.GeocoderAddressComponent[],
): string {
  for (const comp of components) {
    if (
      comp.types.includes("locality") ||
      comp.types.includes("sublocality") ||
      comp.types.includes("administrative_area_level_2") ||
      comp.types.includes("postal_town")
    ) {
      return comp.long_name || "";
    }
  }
  return "";
}

/** Extrai CEP / postal code */
function extractPostalCode(
  components: google.maps.GeocoderAddressComponent[],
): string {
  for (const comp of components) {
    if (comp.types.includes("postal_code")) {
      return comp.long_name || "";
    }
  }
  return "";
}

/** Extrai nome da rua + número */
function extractStreet(
  components: google.maps.GeocoderAddressComponent[],
): string {
  const route = components.find((c) => c.types.includes("route"));
  const streetNumber = components.find((c) => c.types.includes("street_number"));
  const parts: string[] = [];
  if (route) parts.push(route.long_name || "");
  if (streetNumber) parts.push(streetNumber.long_name || "");
  return parts.join(", ") || "";
}

/** Converte resultado do Google Place em AddressResult */
function placeToAddressResult(
  place: google.maps.places.PlaceResult,
): AddressResult {
  const components = place.address_components || [];
  const { stateCode, state } = extractState(components);
  const { countryCode, country } = extractCountry(components);

  return {
    formattedAddress: place.formatted_address || "",
    lat: place.geometry?.location?.lat() || 0,
    lng: place.geometry?.location?.lng() || 0,
    street: extractStreet(components),
    city: extractCity(components),
    state,
    stateCode,
    country,
    countryCode,
    postalCode: extractPostalCode(components),
  };
}

export default function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelected,
  placeholder = "Digite o endereço do seu negócio…",
  disabled = false,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const apiAvailable = isMapsApiAvailable();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!apiAvailable) return;

    loadGoogleMapsApi()
      .then(() => setReady(true))
      .catch(() => setReady(false));
  }, [apiAvailable]);

  useEffect(() => {
    if (!ready || !inputRef.current || autocompleteRef.current) return;

    autocompleteRef.current =
      new google.maps.places.Autocomplete(inputRef.current, {
        types: ["address"],
        componentRestrictions: undefined, // sem restrição de país
        fields: [
          "address_components",
          "formatted_address",
          "geometry",
          "name",
        ],
      });

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();
      if (!place || !place.geometry) return;

      const result = placeToAddressResult(place);
      onChange(result.formattedAddress);
      onPlaceSelected(result);
    });
  }, [ready]);

  if (!apiAvailable) {
    return (
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled
          className="pl-10"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Configure a chave Google Maps para ativar o autocomplete de endereço.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {!ready ? (
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled
            className="pl-10"
          />
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="pl-10 google-places-input"
          />
        </div>
      )}
    </div>
  );
}
