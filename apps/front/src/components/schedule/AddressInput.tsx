import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { MapPin, Map, X, Search } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { cn } from "@/lib/utils";

const MAPBOX_TOKEN = "pk.eyJ1IjoibWF0ZW8xMjIiLCJhIjoiY21pcTNqYTlmMGMxZTNlcHdhMnhmczFwdiJ9.8C4efXzPA1KALooo2ZmP4w";
const MAPBOX_STYLE = "mapbox://styles/mapbox/streets-v12";

// Default address: El Regalo, Bosa, Bogotá
const DEFAULT_ADDRESS = "Calle 73 Sur #80C-21, El Regalo, Bosa, Bogotá";
const DEFAULT_COORDS: [number, number] = [-74.1901, 4.6201];

interface AddressInputProps {
  value: string;
  onChange: (address: string, coords?: [number, number]) => void;
}

interface Suggestion {
  id: string;
  place_name: string;
  center: [number, number];
}

export default function AddressInput({ value, onChange }: AddressInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [modalAddress, setModalAddress] = useState("");
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const geocodeDebounceRef = useRef<NodeJS.Timeout>();
  const currentCoordsRef = useRef<[number, number] | null>(null);

  // Update dropdown position when showing suggestions
  useEffect(() => {
    if (showSuggestions && inputWrapperRef.current) {
      const rect = inputWrapperRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [showSuggestions, suggestions]);

  // Fetch suggestions from Mapbox Geocoding API
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=co&language=es&types=address,poi`
      );
      const data = await response.json();
      setSuggestions(data.features || []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowSuggestions(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setInputValue(suggestion.place_name);
    onChange(suggestion.place_name, suggestion.center);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Reverse geocode coordinates to address
  const reverseGeocode = async (lng: number, lat: number) => {
    setIsGeocodingLoading(true);
    setGeocodingError(null);
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=es`
      );
      
      if (!response.ok) {
        throw new Error("Error al obtener la dirección");
      }
      
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        // Try to get the most specific address (with street number)
        const addressFeature = data.features.find((f: any) => 
          f.place_type.includes("address")
        ) || data.features[0];
        
        let address = "";
        if (addressFeature.text && addressFeature.address) {
          address = `${addressFeature.text} ${addressFeature.address}`;
        } else if (addressFeature.text) {
          address = addressFeature.text;
        } else {
          address = addressFeature.place_name;
        }
        
        setModalAddress(address);
        currentCoordsRef.current = [lng, lat];
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      setGeocodingError("Error al obtener la dirección. Intenta de nuevo.");
    } finally {
      setIsGeocodingLoading(false);
    }
  };

  // Debounced reverse geocoding on map move
  const handleMapMove = useCallback(() => {
    if (!mapRef.current) return;
    
    const center = mapRef.current.getCenter();
    
    if (geocodeDebounceRef.current) {
      clearTimeout(geocodeDebounceRef.current);
    }
    
    geocodeDebounceRef.current = setTimeout(() => {
      reverseGeocode(center.lng, center.lat);
    }, 500);
  }, []);

  // Handle "Select on map" button click - uses the current input address
  const handleOpenMapModal = async () => {
    setLocationError(null);
    setGeocodingError(null);
    setShowMapModal(true);
    
    // Use the current input address to geocode and set the map center
    if (inputValue && inputValue.length > 3) {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(inputValue)}.json?access_token=${MAPBOX_TOKEN}&country=co&language=es&types=address,poi&limit=1`
        );
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          currentCoordsRef.current = feature.center as [number, number];
          setModalAddress(feature.place_name);
        } else {
          // Fallback to default if geocoding fails
          currentCoordsRef.current = DEFAULT_COORDS;
          setModalAddress(DEFAULT_ADDRESS);
        }
      } catch (error) {
        console.error("Error geocoding input address:", error);
        currentCoordsRef.current = DEFAULT_COORDS;
        setModalAddress(DEFAULT_ADDRESS);
      }
    } else {
      // Use default address if input is empty
      currentCoordsRef.current = DEFAULT_COORDS;
      setModalAddress(DEFAULT_ADDRESS);
    }
  };

  // Initialize map when modal opens
  useEffect(() => {
    if (!showMapModal || !mapContainerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const center = currentCoordsRef.current || DEFAULT_COORDS;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_STYLE,
      center: center,
      zoom: 16,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Handle map move end
    mapRef.current.on("moveend", handleMapMove);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [showMapModal, handleMapMove]);

  // Handle confirm address
  const handleConfirmAddress = () => {
    if (modalAddress && currentCoordsRef.current) {
      setInputValue(modalAddress);
      onChange(modalAddress, currentCoordsRef.current);
    }
    setShowMapModal(false);
    setModalAddress("");
    setGeocodingError(null);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowMapModal(false);
    setModalAddress("");
    setGeocodingError(null);
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputWrapperRef.current && !inputWrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showMapModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMapModal]);

  return (
    <div className="space-y-3">
      {/* Address input with autocomplete */}
      <div className="relative" ref={inputWrapperRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Escribe tu dirección..."
            className="eco-input pl-10 pr-4"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Suggestions dropdown - using portal to overlay everything */}
        {showSuggestions && suggestions.length > 0 && createPortal(
          <div 
            className="fixed bg-white border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto"
            style={{ 
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 9998,
            }}
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-start gap-3 border-b border-border/50 last:border-0"
              >
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground">{suggestion.place_name}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
      </div>

      {/* Location error helper text */}
      {locationError && (
        <p className="text-destructive text-[14px]">{locationError}</p>
      )}

      {/* Map toggle button */}
      <button
        type="button"
        onClick={handleOpenMapModal}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
      >
        <Map className="w-4 h-4" />
        <span className="text-sm font-medium">Seleccionar en el mapa</span>
      </button>

      {/* Map Modal - using portal to render at document body level */}
      {showMapModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.4)", zIndex: 9999 }}
            onClick={handleCloseModal}
          />
          
          {/* Modal Container - using same padding as screens (16px/1rem) */}
          <div 
            className="relative w-full mx-4 bg-card rounded-2xl overflow-hidden shadow-elevated animate-scale-in flex flex-col max-h-[85vh]"
            style={{ zIndex: 10000 }}
          >
            {/* Modal content with 16px padding */}
            <div className="p-4">
              {/* Close button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 z-20 p-1 hover:opacity-70 transition-opacity"
                aria-label="Cerrar"
              >
                <X className="text-foreground" style={{ width: 34, height: 34 }} />
              </button>

              {/* Map container */}
              <div className="relative w-full h-[50vh] rounded-xl overflow-hidden mt-8">
                <div
                  ref={mapContainerRef}
                  className="w-full h-full"
                />
                
                {/* Fixed center pin */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="flex flex-col items-center">
                    <MapPin 
                      className="w-10 h-10 text-primary drop-shadow-lg" 
                      style={{ marginBottom: -6 }}
                    />
                    <div className="w-2 h-2 rounded-full bg-primary/50" />
                  </div>
                </div>
                
                {/* Loading indicator */}
                {isGeocodingLoading && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-full z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <span className="text-xs text-muted-foreground">Buscando dirección...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Address display */}
              <div className="mt-4 space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground min-h-[20px]">
                    {modalAddress || "Mueve el mapa para seleccionar ubicación"}
                  </p>
                </div>
                
                {/* Geocoding error */}
                {geocodingError && (
                  <p className="text-destructive text-[14px]">{geocodingError}</p>
                )}
              </div>

              {/* Confirm button */}
              <button
                onClick={handleConfirmAddress}
                disabled={!modalAddress || isGeocodingLoading}
                className={cn(
                  "w-full mt-4 py-4 rounded-2xl font-semibold transition-all duration-200",
                  modalAddress && !isGeocodingLoading
                    ? "eco-button-primary"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                Confirmar dirección
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
