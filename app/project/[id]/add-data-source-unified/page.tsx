"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import UnifiedDataSourceWorkflow from "../../../../components/data-sources/UnifiedDataSourceWorkflow";
import { DataProvider } from "../../../../types";

export default function AddDataSourceUnifiedPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const handleComplete = (dataSource: DataProvider) => {
    // Navigate back to data sources page
    router.push(`/project/${projectId}/data-sources`);
  };

  const handleCancel = () => {
    router.push(`/project/${projectId}/data-sources`);
  };

  return (
    <UnifiedDataSourceWorkflow
      projectId={projectId}
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
}
