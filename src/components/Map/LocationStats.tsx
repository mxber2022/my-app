"use client";

import React from 'react';
import { AlertTriangle, Users, Heart, DollarSign } from 'lucide-react';

interface LocationStatsProps {
  markers: Array<{
    lat: number;
    lng: number;
    emergencyInfo?: {
      peopleAffected: string;
      type: string;
      severity: string;
    };
  }>;
}

interface StateStats {
  [key: string]: {
    totalPeople: number;
    emergencies: number;
    types: { [key: string]: number };
    severities: { [key: string]: number };
  };
}

const LocationStats: React.FC<LocationStatsProps> = ({ markers }) => {
  const [stats, setStats] = React.useState<StateStats>({});
  const [loading, setLoading] = React.useState(true);
  const [donatingState, setDonatingState] = React.useState<string | null>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = React.useState(false);

  React.useEffect(() => {
    // Check if Google Maps is loaded
    const checkGoogleMaps = () => {
      if (typeof window !== 'undefined' && window.google && window.google.maps) {
        setGoogleMapsLoaded(true);
      } else {
        // If not loaded, check again in 100ms
        setTimeout(checkGoogleMaps, 100);
      }
    };

    checkGoogleMaps();
  }, []);

  React.useEffect(() => {
    const fetchLocationData = async () => {
      if (!googleMapsLoaded) return;

      try {
        const geocoder = new window.google.maps.Geocoder();
        const stateStats: StateStats = {};

        for (const marker of markers) {
          if (!marker.emergencyInfo) continue;

          const result = await new Promise((resolve) => {
            geocoder.geocode(
              { location: { lat: marker.lat, lng: marker.lng } },
              (results, status) => {
                if (status === 'OK' && results?.[0]) {
                  resolve(results[0]);
                } else {
                  resolve(null);
                }
              }
            );
          });

          if (!result) continue;

          const addressComponents = (result as google.maps.GeocoderResult).address_components;
          const state = addressComponents?.find(
            (component) => component.types.includes('administrative_area_level_1')
          )?.long_name || 'Unknown';

          if (!stateStats[state]) {
            stateStats[state] = {
              totalPeople: 0,
              emergencies: 0,
              types: {},
              severities: {},
            };
          }

          const peopleAffected = parseInt(marker.emergencyInfo.peopleAffected) || 1;
          stateStats[state].totalPeople += peopleAffected;
          stateStats[state].emergencies += 1;
          
          stateStats[state].types[marker.emergencyInfo.type] = 
            (stateStats[state].types[marker.emergencyInfo.type] || 0) + 1;
          
          stateStats[state].severities[marker.emergencyInfo.severity] = 
            (stateStats[state].severities[marker.emergencyInfo.severity] || 0) + 1;
        }

        setStats(stateStats);
      } catch (error) {
        console.error('Error fetching location data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (markers.length > 0 && googleMapsLoaded) {
      fetchLocationData();
    } else if (!markers.length) {
      setLoading(false);
    }
  }, [markers, googleMapsLoaded]);

  const handleGlobalDonate = () => {
    alert("Thank you for your willingness to help! Global donation feature coming soon.");
  };

  const handleStateDonate = (state: string) => {
    setDonatingState(state);
    alert(`Thank you for your willingness to help ${state}! State-specific donation feature coming soon.`);
    setDonatingState(null);
  };

  const getTotalAffectedPeople = () => {
    return Object.values(stats).reduce((total, state) => total + state.totalPeople, 0);
  };

  const getTotalEmergencies = () => {
    return Object.values(stats).reduce((total, state) => total + state.emergencies, 0);
  };

  if (loading || !googleMapsLoaded) {
    return (
      <div className="bg-card rounded-xl p-4 border animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
          <div className="h-4 bg-muted rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  const sortedStates = Object.entries(stats).sort(([, a], [, b]) => b.totalPeople - a.totalPeople);
  const totalAffected = getTotalAffectedPeople();
  const totalEmergencies = getTotalEmergencies();

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border p-6">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-bold">Global Emergency Statistics</h2>
            <p className="text-muted-foreground">Current situation across all regions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-lg font-semibold mb-1">
                <Users className="w-5 h-5 text-destructive" />
                {totalAffected.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">People Affected</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-lg font-semibold mb-1">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                {totalEmergencies.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Active Emergencies</p>
            </div>
          </div>

          <button
            onClick={handleGlobalDonate}
            className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors py-3 px-6 rounded-xl flex items-center justify-center gap-2 font-medium"
          >
            <Heart className="w-5 h-5" />
            Donate to All Affected People
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border divide-y">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-destructive" />
            <h3 className="font-display text-lg font-bold">Affected Population by State</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Real-time statistics of emergency situations and affected individuals across states
          </p>
        </div>

        <div className="divide-y">
          {sortedStates.map(([state, data]) => (
            <div key={state} className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-lg">{state}</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <span>{data.emergencies} emergencies</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{data.totalPeople} people affected</span>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-1">Emergency Types:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(data.types).map(([type, count]) => (
                          <span key={type} className="text-xs bg-muted px-2 py-1 rounded-full">
                            {type}: {count}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-1">Severity Levels:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(data.severities).map(([severity, count]) => (
                          <span 
                            key={severity}
                            className={`text-xs px-2 py-1 rounded-full ${
                              severity === 'critical' ? 'bg-red-100 text-red-700' :
                              severity === 'high' ? 'bg-orange-100 text-orange-700' :
                              severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}
                          >
                            {severity}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleStateDonate(state)}
                  disabled={donatingState === state}
                  className="w-full md:w-auto bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                >
                  {donatingState === state ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <DollarSign className="w-5 h-5" />
                      Donate to {state}
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}

          {sortedStates.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              No emergency locations reported yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationStats;