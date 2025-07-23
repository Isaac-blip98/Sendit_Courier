import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GeoService {
  async geocode(address: string): Promise<{ lat: number; lng: number }> {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: address,
          format: 'json',
          limit: 1,
        },
        headers: {
          'User-Agent': 'sendit-courier-app', // Required by Nominatim
        },
      });

      const [result] = response.data;

      if (!result) {
        throw new Error('Address not found');
      }

      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      };
    } catch (error) {
      console.error('Geocoding error:', error.message);
      throw new InternalServerErrorException('Failed to fetch coordinates');
    }
  }
}
