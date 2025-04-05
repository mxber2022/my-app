"use client";

import React, { useState, useEffect } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  LoadScript
} from "@react-google-maps/api";
import axios from "axios";
import { 
  Loader2, 
  MapPin, 
  Navigation, 
  MessageSquare, 
  X, 
  AlertTriangle,
  Heart,
  MessagesSquare,
  AlertCircle,
  Phone,
  Users,
  Info,
  AlertOctagon,
  Map as MapIcon,
  BarChart
} from "lucide-react";
import PushChat from "../PushChat/PushChat";
import { useMap } from "./MapContext";
import { Toaster } from "sonner";
import { EmergencyForm, EmergencyInfo } from "./EmergencyForm";
import LocationStats from "./LocationStats";
import { useSession } from "next-auth/react";


interface MarkerData {
  walletAddress: string;
  lat: number;
  lng: number;
  emergencyInfo?: EmergencyInfo;
}

const mapContainerStyle = {
  height: "65vh",
  width: "100%",
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194,
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: true,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
};
import { PayBlock } from "../Pay";

const Map: React.FC = () => {
    const { 
        isLoading, 
        setIsLoading, 
        showError, 
        showSuccess,
        locations: markers,
        addLocation 
      } = useMap();
  const [activeTab, setActiveTab] = useState<'map' | 'stats'>('map');
  //const { isLoading, setIsLoading, showError, showSuccess } = useMap();
  //const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [markerPlaced, setMarkerPlaced] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [showGlobalChat, setShowGlobalChat] = useState<boolean>(false);
  const [showEmergencyForm, setShowEmergencyForm] = useState<boolean>(false);
  const [pendingLocation, setPendingLocation] = useState<{lat: number, lng: number} | null>(null);
  

  const { data: session } = useSession();
  // Temporary wallet address for demo
  const walletAddress = session?.user?.name
  const address = walletAddress; 
  console.log("walletAddress: ", address);

//   const fetchLocations = async () => {
//     setIsLoading(true);
//     try {
//       const response = await axios.get<MarkerData[]>(
//         "https://emergencybackend-g9scdbasl-mxber2022s-projects.vercel.app/api/locations"
//       );
//       setMarkers(response.data);
//     } catch (error) {
//       showError("Failed to fetch locations. Please try again later.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchLocations();
//   }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          setCenter({ lat, lng });
          setPendingLocation({ lat, lng });
          setShowEmergencyForm(true);
          showSuccess("Location found successfully!");
          setIsLoading(false);
        },
        (error) => {
          showError("Error fetching location. Please try again.");
          setIsLoading(false);
        }
      );
    } else {
      showError("Geolocation is not supported by this browser.");
    }
  };

  const saveEmergencyLocation = async (emergencyInfo: EmergencyInfo) => {
    if (!address) {
      showError("Please connect your wallet first!");
      return;
    }

    if (!pendingLocation) {
      showError("Location is not available.");
      return;
    }

    setIsLoading(true);
    const newMarker: MarkerData = {
      walletAddress: address,
      lat: pendingLocation.lat,
      lng: pendingLocation.lng,
      emergencyInfo
    };

    try {
    //   await axios.post(
    //     "https://emergencybackend-g9scdbasl-mxber2022s-projects.vercel.app/api/locations",
    //     newMarker
    //   );
      addLocation(newMarker);
      setMarkerPlaced(true);
      setMarkerPlaced(true);
      setShowEmergencyForm(false);
      setPendingLocation(null);
      showSuccess("Emergency location published successfully!");
    } catch (error) {
      showError("Failed to save location. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onMapClick = async (event: google.maps.MapMouseEvent) => {
    if (!address) {
      showError("Please connect your wallet first!");
      return;
    }

    if (markerPlaced) {
      showError("A marker has already been placed!");
      return;
    }

    const lat = event.latLng?.lat();
    const lng = event.latLng?.lng();

    if (lat === undefined || lng === undefined) {
      return;
    }

    setPendingLocation({ lat, lng });
    setShowEmergencyForm(true);
  };

  const handleDonate = () => {
    showSuccess("Thank you for your willingness to donate! This feature is coming soon.");
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-500 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return <AlertOctagon className="w-4 h-4" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <AlertCircle className="w-4 h-4" />;
      case 'low':
        return <Info className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="w-full">
        <div className="w-full md:w-auto grid grid-cols-2 gap-1 p-1 bg-muted/50 rounded-lg">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'map'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            Emergency Map
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'stats'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <BarChart className="w-4 h-4" />
            Statistics
          </button>
        </div>

        <div className="mt-4">
          {activeTab === 'map' && (
            <div className="space-y-4">
              <div className="bg-card rounded-2xl shadow-lg overflow-hidden border">
                <div className="relative">
                  {/* <LoadScript googleMapsApiKey="AIzaSyC0sj2Vp1TDlgxwjZW_ga6IGUalupE4-Iw"> */}
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={center}
                    zoom={12}
                    onClick={onMapClick}
                    options={mapOptions}
                  >
                    {markers.map((marker, index) => (
                      <Marker
                        key={index}
                        position={{ lat: marker.lat, lng: marker.lng }}
                        onClick={() => setSelectedMarker(marker)}
                        icon={{
                          url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ef4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'%3E%3C/path%3E%3Ccircle cx='12' cy='10' r='3'%3E%3C/circle%3E%3C/svg%3E",
                          scaledSize: new google.maps.Size(32, 32),
                        }}
                      />
                    ))}

                    {selectedMarker && (
                      <InfoWindow
                        position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                        onCloseClick={() => setSelectedMarker(null)}
                      >
                        <div className="p-4 min-w-[320px] max-w-md">
                        {selectedMarker.emergencyInfo && (
                      <div className="mb-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">Type:</span>
                          <span className="text-sm">{selectedMarker.emergencyInfo.type}</span>
                        </div>
                        <div>
                          <span className="font-medium text-sm">Description:</span>
                          <p className="text-sm mt-1">{selectedMarker.emergencyInfo.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">Severity:</span>
                          <span className={`text-sm ${getSeverityColor(selectedMarker.emergencyInfo.severity)}`}>
                            {selectedMarker.emergencyInfo.severity.charAt(0).toUpperCase() + selectedMarker.emergencyInfo.severity.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">People Affected:</span>
                          <span className="text-sm">{selectedMarker.emergencyInfo.peopleAffected}</span>
                        </div>
                        <div>
                          <span className="font-medium text-sm">Contact:</span>
                          <p className="text-sm mt-1">{selectedMarker.emergencyInfo.contactInfo}</p>
                        </div>
                      </div>
                    )}

                    <p className="text-xs md:text-sm mb-3 md:mb-4 font-mono bg-muted px-2 py-1 rounded">
                      {selectedMarker.walletAddress.slice(0, 6)}...
                      {selectedMarker.walletAddress.slice(-4)}
                    </p>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowChat(true)}
                        className="bg-primary text-primary-foreground w-full px-3 py-2 md:px-4 md:py-2 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Start Chat
                      </button>
                      {/* <button
                        onClick={handleDonate}
                        className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground w-full px-3 py-2 md:px-4 md:py-2 rounded-md transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                      >
                        <Heart className="w-4 h-4" />
                        Donate

                      </button> */}

<PayBlock toAddress={selectedMarker.walletAddress} />
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          {/* </LoadScript> */}
        </div>
      </div>

              <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 p-4 md:p-6 bg-card rounded-2xl shadow-sm border">
                <button
                  onClick={getUserLocation}
                  disabled={isLoading}
                  className="w-full md:w-auto bg-primary text-primary-foreground px-4 py-2.5 md:px-6 md:py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm md:text-base font-medium"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                  Get My Location
                </button>

                {/* {markerPlaced && (
                  <button
                    onClick={() => setMarkerPlaced(false)}
                    disabled={isLoading}
                    className="w-full md:w-auto bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground px-4 py-2.5 md:px-6 md:py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm md:text-base font-medium"
                  >
                    <X className="w-4 h-4" />
                    Remove Marker
                  </button>
                )} */}

                <button
                  onClick={() => setShowGlobalChat(true)}
                  className="w-full md:w-auto bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-4 py-2.5 md:px-6 md:py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm md:text-base font-medium"
                >
                  <MessagesSquare className="w-4 h-4" />
                  Global Chat
                </button>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <LocationStats markers={markers} />
          )}
        </div>
      </div>

      {showEmergencyForm && (
        <EmergencyForm
          onSubmit={saveEmergencyLocation}
          onClose={() => {
            setShowEmergencyForm(false);
            setPendingLocation(null);
          }}
          isLoading={isLoading}
        />
      )}

      {(showChat && selectedMarker) && (
        <PushChat 
          selectedAddress={selectedMarker.walletAddress} 
          onClose={() => setShowChat(false)}
        />
      )}

      {showGlobalChat && (
        <PushChat 
          selectedAddress="Global Chat"
          onClose={() => setShowGlobalChat(false)}
        />
      )}
      
      <Toaster position="bottom-right" />
    </div>
  );
};

export default Map;
