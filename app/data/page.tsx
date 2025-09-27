"use client";

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  Database,
  RefreshCw
} from 'lucide-react';
import CellButton from '../../components/ui/CellButton';
import CellCard from '../../components/ui/CellCard';
import CellInput from '../../components/ui/CellInput';
import { DataBrowserQuery, DataBrowserResult } from '../../types';

interface MockData {
  id: string;
  sourceId: string;
  sourceName: string;
  tableName: string;
  data: any[];
  totalCount: number;
}

const mockDataSources: MockData[] = [
  {
    id: '1',
    sourceId: 'mock_customers',
    sourceName: 'Mock Customer Data',
    tableName: 'customers',
    data: [
      { id: 1, first_name: 'John', last_name: 'Smith', email: 'john@example.com', city: 'New York', country: 'USA' },
      { id: 2, first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@example.com', city: 'London', country: 'UK' },
      { id: 3, first_name: 'Mike', last_name: 'Davis', email: 'mike@example.com', city: 'Toronto', country: 'Canada' },
      { id: 4, first_name: 'Emma', last_name: 'Wilson', email: 'emma@example.com', city: 'Sydney', country: 'Australia' },
      { id: 5, first_name: 'James', last_name: 'Brown', email: 'james@example.com', city: 'Berlin', country: 'Germany' },
    ],
    totalCount: 1000
  },
  {
    id: '2',
    sourceId: 'mock_orders',
    sourceName: 'Mock Order Data',
    tableName: 'orders',
    data: [
      { order_id: 'ORD001', customer_id: 1, product_name: 'Laptop', quantity: 1, price: 999.99, order_date: '2024-01-15', status: 'completed' },
      { order_id: 'ORD002', customer_id: 2, product_name: 'Mouse', quantity: 2, price: 29.99, order_date: '2024-01-16', status: 'pending' },
      { order_id: 'ORD003', customer_id: 1, product_name: 'Keyboard', quantity: 1, price: 79.99, order_date: '2024-01-17', status: 'completed' },
      { order_id: 'ORD004', customer_id: 3, product_name: 'Monitor', quantity: 1, price: 299.99, order_date: '2024-01-18', status: 'shipped' },
      { order_id: 'ORD005', customer_id: 4, product_name: 'Webcam', quantity: 1, price: 89.99, order_date: '2024-01-19', status: 'completed' },
    ],
    totalCount: 2500
  }
];

export default function DataBrowserPage() {
  const [selectedSource, setSelectedSource] = useState<MockData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const filteredData = selectedSource?.data.filter(row => 
    Object.values(row).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  const getColumns = (data: any[]) => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  };

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Header */}
      <header className="cell-nav mb-8">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <CellButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </CellButton>
            <h1 className="text-heading font-bold">Data Browser</h1>
            <span className="text-caption">Explore your imported data</span>
          </div>
          <div className="flex items-center space-x-2">
            {selectedSource && (
              <CellButton variant="secondary" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </CellButton>
            )}
            <CellButton variant="accent" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </CellButton>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Data Sources Sidebar */}
        <div className="lg:col-span-1">
          <CellCard className="p-4">
            <h2 className="text-subheading mb-4">Data Sources</h2>
            
            {mockDataSources.length === 0 ? (
              <div className="text-center py-8">
                <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-caption text-gray-600">No data imported yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {mockDataSources.map((source) => (
                  <div
                    key={source.id}
                    className={`p-3 border-2 border-black cursor-pointer transition-colors ${
                      selectedSource?.id === source.id ? 'bg-accent text-white' : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedSource(source)}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <FileText className="w-4 h-4" />
                      <span className="font-mono font-bold text-sm">{source.sourceName}</span>
                    </div>
                    <div className="text-xs opacity-75">
                      {source.data.length} / {source.totalCount} records loaded
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CellCard>
        </div>

        {/* Data Viewer */}
        <div className="lg:col-span-3">
          {!selectedSource ? (
            <CellCard className="p-12 text-center">
              <Eye className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h2 className="text-heading mb-4">Select a Data Source</h2>
              <p className="text-body text-gray-600">
                Choose a data source from the sidebar to browse its data.
              </p>
            </CellCard>
          ) : (
            <CellCard className="p-6">
              {/* Table Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-subheading font-bold">{selectedSource.sourceName}</h2>
                  <p className="text-caption text-gray-600">
                    Table: {selectedSource.tableName} • {selectedSource.totalCount} total records
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <CellInput
                    placeholder="Search data..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-64"
                  />
                  <CellButton variant="ghost" size="sm">
                    <Filter className="w-4 h-4" />
                  </CellButton>
                </div>
              </div>

              {/* Data Table */}
              {filteredData.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-body text-gray-600">
                    {searchTerm ? 'No results found for your search.' : 'No data available.'}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="overflow-x-auto mb-6">
                    <table className="cell-table w-full">
                      <thead>
                        <tr>
                          {getColumns(paginatedData).map((column) => (
                            <th key={column}>
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.map((row, index) => (
                          <tr key={index}>
                            {getColumns(paginatedData).map((column) => (
                              <td key={column}>
                                {String(row[column] || '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <div className="text-caption">
                        Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredData.length)} of {filteredData.length} results
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <CellButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </CellButton>
                        
                        <span className="font-mono text-sm px-3 py-1 border-2 border-black bg-white">
                          {currentPage} / {totalPages}
                        </span>
                        
                        <CellButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </CellButton>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CellCard>
          )}
        </div>
      </div>
    </div>
  );
}