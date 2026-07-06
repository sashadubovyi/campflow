import { Injectable, Logger } from '@nestjs/common';

export interface GeoPlace {
  label: string;
  latitude: number;
  longitude: number;
  address: string;
}

const CATEGORY_MAP: Record<string, string> = {
  cinema: 'amenity=cinema',
  restaurant: 'amenity=restaurant',
  bar: 'amenity=bar',
  cafe: 'amenity=cafe',
  park: 'leisure=park',
  museum: 'tourism=museum',
  hotel: 'tourism=hotel',
  theatre: 'amenity=theatre',
  club: 'amenity=nightclub',
  sport: 'leisure=sports_centre',
};

@Injectable()
export class GeoResolverService {
  private readonly logger = new Logger(GeoResolverService.name);

  async resolve(area: string, category: string, limit = 5): Promise<GeoPlace[]> {
    try {
      const tag = CATEGORY_MAP[category] ?? `amenity=${category}`;
      const query = `${tag} near ${area}`;
      const url = `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&format=json&limit=${limit}&addressdetails=1`;

      const res = await fetch(url, {
        headers: { 'User-Agent': 'andu-app/1.0 (https://andu.app)' },
      });

      if (!res.ok) return [];
      const data = (await res.json()) as Array<{
        display_name?: string;
        name?: string;
        lat: string;
        lon: string;
      }>;

      return data.map((p) => ({
        label: p.display_name?.split(',').slice(0, 2).join(', ') ?? p.name ?? '',
        latitude: parseFloat(p.lat),
        longitude: parseFloat(p.lon),
        address: p.display_name ?? '',
      }));
    } catch (err) {
      this.logger.error(`GeoResolver error: ${(err as Error).message}`);
      return [];
    }
  }
}
