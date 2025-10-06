"use client";

import StandardLoading from "../components/layout/StandardLoading";

export default function Loading() {
  return (
    <StandardLoading 
      message="Loading Manifold..." 
      submessage="Please wait while we load your data"
    />
  );
}
