import { LocationPostGISType, LocationType } from "@workquest/database-models/lib/models";

export function transformToGeoPostGIS(location: LocationType): LocationPostGISType {
  const coordinates: [number, number] = [location.longitude, location.latitude];

  return {
    type: "Point",
    coordinates: coordinates,
    crs: { type: "name", properties: { name: "EPSG:4326" } }
  };
}
