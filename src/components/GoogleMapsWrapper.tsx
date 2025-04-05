"use client";

import { LoadScript } from "@react-google-maps/api";

export default function GoogleMapsWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LoadScript googleMapsApiKey="AIzaSyC0sj2Vp1TDlgxwjZW_ga6IGUalupE4-Iw">
      {children}
    </LoadScript>
  );
}