import { useCallback, useEffect, useState } from "react";
import {
  getFavoriteVenueIds,
  saveFavoriteVenueIds,
} from "../services/preferences";

export default function useFavoriteVenues() {
  const [favoriteVenueIds, setFavoriteVenueIds] = useState([]);

  useEffect(() => {
    getFavoriteVenueIds().then(setFavoriteVenueIds);
  }, []);

  const toggleFavoriteVenue = useCallback(async (venueId) => {
    setFavoriteVenueIds((current) => {
      const next = current.includes(venueId)
        ? current.filter((id) => id !== venueId)
        : [...current, venueId];
      saveFavoriteVenueIds(next).catch(() => {});
      return next;
    });
  }, []);

  return { favoriteVenueIds, toggleFavoriteVenue };
}
