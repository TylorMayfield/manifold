"use client";

import React, { useState } from "react";
import {
  Search,
  Star,
  Database,
  Globe,
  FileText,
  Code,
  Users,
  TrendingUp,
  Check,
  X,
} from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import {
  DATA_SOURCE_TEMPLATES,
  DataSourceTemplate,
  getTemplatesByCategory,
  getPopularTemplates,
  searchTemplates,
} from "../../lib/templates/dataSourceTemplates";

interface DataSourceTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: DataSourceTemplate) => void;
}

export default function DataSourceTemplateSelector({
  isOpen,
  onClose,
  onSelectTemplate,
}: DataSourceTemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] =
    useState<DataSourceTemplate | null>(null);

  const categories = [
    {
      id: "all",
      name: "All Templates",
      icon: <Database className="h-4 w-4" />,
    },
    { id: "popular", name: "Popular", icon: <Star className="h-4 w-4" /> },
    {
      id: "database",
      name: "Database",
      icon: <Database className="h-4 w-4" />,
    },
    { id: "api", name: "API", icon: <Globe className="h-4 w-4" /> },
    { id: "file", name: "File", icon: <FileText className="h-4 w-4" /> },
    { id: "cloud", name: "Cloud", icon: <TrendingUp className="h-4 w-4" /> },
  ];

  const getTemplates = () => {
    let templates = DATA_SOURCE_TEMPLATES;

    if (selectedCategory === "popular") {
      templates = getPopularTemplates();
    } else if (selectedCategory !== "all") {
      templates = getTemplatesByCategory(selectedCategory);
    }

    if (searchQuery.trim()) {
      templates = searchTemplates(searchQuery);
    }

    return templates;
  };

  const getTemplateIcon = (template: DataSourceTemplate) => {
    switch (template.icon) {
      case "database":
        return <Database className="h-5 w-5" />;
      case "globe":
        return <Globe className="h-5 w-5" />;
      case "file-text":
        return <FileText className="h-5 w-5" />;
      case "code":
        return <Code className="h-5 w-5" />;
      case "users":
        return <Users className="h-5 w-5" />;
      case "trending-up":
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Database className="h-5 w-5" />;
    }
  };

  const handleSelectTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      onClose();
    }
  };

  const filteredTemplates = getTemplates();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title=""
      showCloseButton={false}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Choose a Template</h2>
          <p className="text-gray-600 mt-1">
            Select a template to quickly set up your data source
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              {category.icon}
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedTemplate?.id === template.id
                ? "border-blue-400 bg-blue-400/10"
                : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
            }`}
            onClick={() => setSelectedTemplate(template)}
          >
            <div className="flex items-start space-x-3">
              <div
                className={`p-2 rounded-lg ${
                  selectedTemplate?.id === template.id
                    ? "bg-blue-400/20"
                    : "bg-white/10"
                }`}
              >
                <div
                  className={
                    selectedTemplate?.id === template.id
                      ? "text-blue-500"
                      : "text-gray-400"
                  }
                >
                  {getTemplateIcon(template)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {template.name}
                </h3>
                  {template.popular && (
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  )}
                </div>

                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {template.description}
                </p>

                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-gray-100 text-xs text-gray-600 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-xs text-gray-600 rounded">
                      +{template.tags.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {selectedTemplate?.id === template.id && (
                <div className="flex-shrink-0">
                  <Check className="h-5 w-5 text-blue-400" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-700 mb-2">No templates found</div>
          <div className="text-gray-600 text-sm">
            Try adjusting your search or category filter
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white/10">
        <Button onClick={onClose} variant="outline">
          Cancel
        </Button>
        <Button onClick={handleSelectTemplate} disabled={!selectedTemplate}>
          Use Template
        </Button>
      </div>
    </Modal>
  );
}
