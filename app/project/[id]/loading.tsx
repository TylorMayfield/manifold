"use client";

import StandardLoading from "../../../components/layout/StandardLoading";

export default function ProjectLoading() {
  return (
    <StandardLoading 
      message="Loading Project..." 
      submessage="Please wait while we load your project data"
    />
  );
}