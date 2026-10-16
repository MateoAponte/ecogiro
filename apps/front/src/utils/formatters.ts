import { format } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Format ISO date to Spanish format: "Domingo 7 diciembre - 14:00"
 */
export function formatDateToSpanish(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const dayName = format(date, "EEEE", { locale: es });
    const dayNumber = format(date, "d", { locale: es });
    const monthName = format(date, "MMMM", { locale: es });
    const time = format(date, "HH:mm", { locale: es });
    
    // Capitalize first letter of day
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    
    return `${capitalizedDay} ${dayNumber} ${monthName} - ${time}`;
  } catch {
    return isoDate;
  }
}

/**
 * Reverse geocode lat/lng to address using Mapbox API
 * Falls back to coordinate string if geocoding fails
 */
export async function reverseGeocode(lat: string, lng: string): Promise<string> {
  try {
    // Parse the coordinates - handle the unusual format from API
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return "Ubicación no disponible";
    }

    // Use Mapbox Geocoding API (free tier)
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbHpwN3l3Z2kwMDJqMmlzNmZtcjV0cDV5In0.xQkXgaKLQhJ2LqHLn9xZ5g&language=es`
    );

    if (!response.ok) {
      throw new Error("Geocoding failed");
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name || "Ubicación no disponible";
    }
    
    return "Ubicación no disponible";
  } catch {
    // Fallback to showing coordinates
    return `Lat: ${lat}, Lng: ${lng}`;
  }
}
