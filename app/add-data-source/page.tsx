"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Database } from "lucide-react";
import PageLayout from "../../components/layout/PageLayout";
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
    <PageLayout
      title="Add Data Source"
      subtitle="Create a new data source"
      icon={Database}
      showNavigation={true}
      showBackButton={true}
      backButtonText="Back to Dashboard"
      backButtonHref="/"
    >
      <UnifiedDataSourceWorkflow
        projectId="default"
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </PageLayout>
  );
}
