"use client";

import React from "react";
import { useRouter } from "next/navigation";
import UnifiedDataSourceWorkflow from "../../components/data-sources/UnifiedDataSourceWorkflow";

export default function AddDataSourcePage() {
  const router = useRouter();

  const handleComplete = (dataSource: any) => {
    // Navigate back to home page after creating data source
    router.push("/");
  };

  const handleCancel = () => {
    router.push("/");
  };

  return (
    <UnifiedDataSourceWorkflow
      projectId="default"
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
}
