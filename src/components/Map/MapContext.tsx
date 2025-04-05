"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface Location {
  walletAddress: string;
  lat: number;
  lng: number;
  emergencyInfo?: EmergencyInfo;
}

interface EmergencyInfo {
  type: string;
  description: string;
  severity: string;
  peopleAffected: string;
  contactInfo: string;
}

interface MapContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  locations: Location[];
  addLocation: (location: Location) => Promise<void>;
  clearLocations: () => Promise<void>;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('locations')
        .select('*');

      if (error) {
        throw error;
      }

      if (data) {
        //@ts-ignore
        const formattedLocations = data.map(location => ({
          walletAddress: location.wallet_address,
          lat: location.lat,
          lng: location.lng,
          emergencyInfo: location.emergency_info
        }));
        setLocations(formattedLocations);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      showError('Failed to fetch locations');
    } finally {
      setIsLoading(false);
    }
  };

  const showError = (message: string) => {
    toast.error(message);
  };

  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const addLocation = async (location: Location) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('locations')
        .insert([{
          wallet_address: location.walletAddress,
          lat: location.lat,
          lng: location.lng,
          emergency_info: location.emergencyInfo
        }]);

      if (error) {
        throw error;
      }

      setLocations(prev => [...prev, location]);
      showSuccess('Location added successfully');
    } catch (error) {
      console.error('Error adding location:', error);
      showError('Failed to add location');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearLocations = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('wallet_address', 'your_wallet_address'); // Only delete own locations

      if (error) {
        throw error;
      }

      setLocations([]);
      showSuccess('Locations cleared successfully');
    } catch (error) {
      console.error('Error clearing locations:', error);
      showError('Failed to clear locations');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MapContext.Provider value={{ 
      isLoading, 
      setIsLoading, 
      showError, 
      showSuccess,
      locations,
      addLocation,
      clearLocations
    }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
}