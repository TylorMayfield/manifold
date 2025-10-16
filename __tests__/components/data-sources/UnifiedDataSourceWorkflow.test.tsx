/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UnifiedDataSourceWorkflow } from '../../../components/data-sources/UnifiedDataSourceWorkflow';

// Mock fetch
global.fetch = jest.fn();

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn()
  })
}));

// Mock DataSourceContext
jest.mock('../../../contexts/DataSourceContext', () => ({
  DataSourceProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useDataSource: () => ({
    dataSources: [],
    addDataSource: jest.fn(),
    updateDataSource: jest.fn(),
    removeDataSource: jest.fn(),
    loading: false,
    error: null
  })
}));

describe('UnifiedDataSourceWorkflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render the workflow component', () => {
    render(<UnifiedDataSourceWorkflow />);
    
    expect(screen.getByText('Data Source Setup')).toBeInTheDocument();
  });

  it('should display data source type selection', () => {
    render(<UnifiedDataSourceWorkflow />);
    
    expect(screen.getByText('Select Data Source Type')).toBeInTheDocument();
    
    // Check for common data source types
    expect(screen.getByText('MySQL')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    expect(screen.getByText('SQLite')).toBeInTheDocument();
    expect(screen.getByText('API Endpoint')).toBeInTheDocument();
    expect(screen.getByText('File Upload')).toBeInTheDocument();
  });

  it('should show MySQL configuration when MySQL is selected', async () => {
    render(<UnifiedDataSourceWorkflow />);
    
    const mysqlOption = screen.getByText('MySQL');
    fireEvent.click(mysqlOption);
    
    await waitFor(() => {
      expect(screen.getByText('MySQL Configuration')).toBeInTheDocument();
      expect(screen.getByLabelText('Host')).toBeInTheDocument();
      expect(screen.getByLabelText('Port')).toBeInTheDocument();
      expect(screen.getByLabelText('Database Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });
  });

  it('should show PostgreSQL configuration when PostgreSQL is selected', async () => {
    render(<UnifiedDataSourceWorkflow />);
    
    const postgresOption = screen.getByText('PostgreSQL');
    fireEvent.click(postgresOption);
    
    await waitFor(() => {
      expect(screen.getByText('PostgreSQL Configuration')).toBeInTheDocument();
      expect(screen.getByLabelText('Host')).toBeInTheDocument();
      expect(screen.getByLabelText('Port')).toBeInTheDocument();
      expect(screen.getByLabelText('Database Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });
  });

  it('should show API configuration when API Endpoint is selected', async () => {
    render(<UnifiedDataSourceWorkflow />);
    
    const apiOption = screen.getByText('API Endpoint');
    fireEvent.click(apiOption);
    
    await waitFor(() => {
      expect(screen.getByText('API Configuration')).toBeInTheDocument();
      expect(screen.getByLabelText('API URL')).toBeInTheDocument();
      expect(screen.getByLabelText('Method')).toBeInTheDocument();
      expect(screen.getByLabelText('Authentication Type')).toBeInTheDocument();
    });
  });

  it('should show file upload configuration when File Upload is selected', async () => {
    render(<UnifiedDataSourceWorkflow />);
    
    const fileOption = screen.getByText('File Upload');
    fireEvent.click(fileOption);
    
    await waitFor(() => {
      expect(screen.getByText('File Upload Configuration')).toBeInTheDocument();
      expect(screen.getByLabelText('File Type')).toBeInTheDocument();
      expect(screen.getByText('Choose File')).toBeInTheDocument();
    });
  });

  it('should validate required fields for MySQL configuration', async () => {
    render(<UnifiedDataSourceWorkflow />);
    
    const mysqlOption = screen.getByText('MySQL');
    fireEvent.click(mysqlOption);
    
    await waitFor(() => {
      const testButton = screen.getByText('Test Connection');
      fireEvent.click(testButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Host is required')).toBeInTheDocument();
      expect(screen.getByText('Database name is required')).toBeInTheDocument();
      expect(screen.getByText('Username is required')).toBeInTheDocument();
    });
  });

  it('should test MySQL connection successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Connection successful' })
    });

    render(<UnifiedDataSourceWorkflow />);
    
    const mysqlOption = screen.getByText('MySQL');
    fireEvent.click(mysqlOption);
    
    await waitFor(() => {
      const hostInput = screen.getByLabelText('Host');
      const portInput = screen.getByLabelText('Port');
      const databaseInput = screen.getByLabelText('Database Name');
      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');
      
      fireEvent.change(hostInput, { target: { value: 'localhost' } });
      fireEvent.change(portInput, { target: { value: '3306' } });
      fireEvent.change(databaseInput, { target: { value: 'testdb' } });
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'testpass' } });
      
      const testButton = screen.getByText('Test Connection');
      fireEvent.click(testButton);
    });
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/data-sources/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'mysql',
          host: 'localhost',
          port: 3306,
          database: 'testdb',
          username: 'testuser',
          password: 'testpass'
        })
      });
      expect(screen.getByText('Connection successful')).toBeInTheDocument();
    });
  });

  it('should handle connection test failure', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, message: 'Connection failed' })
    });

    render(<UnifiedDataSourceWorkflow />);
    
    const mysqlOption = screen.getByText('MySQL');
    fireEvent.click(mysqlOption);
    
    await waitFor(() => {
      const hostInput = screen.getByLabelText('Host');
      const databaseInput = screen.getByLabelText('Database Name');
      const usernameInput = screen.getByLabelText('Username');
      
      fireEvent.change(hostInput, { target: { value: 'invalid-host' } });
      fireEvent.change(databaseInput, { target: { value: 'testdb' } });
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      
      const testButton = screen.getByText('Test Connection');
      fireEvent.click(testButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });
  });

  it('should save data source configuration', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Connection successful' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: '1', name: 'MySQL Source' } })
      });

    render(<UnifiedDataSourceWorkflow />);
    
    const mysqlOption = screen.getByText('MySQL');
    fireEvent.click(mysqlOption);
    
    await waitFor(() => {
      const hostInput = screen.getByLabelText('Host');
      const databaseInput = screen.getByLabelText('Database Name');
      const usernameInput = screen.getByLabelText('Username');
      const nameInput = screen.getByLabelText('Data Source Name');
      
      fireEvent.change(hostInput, { target: { value: 'localhost' } });
      fireEvent.change(databaseInput, { target: { value: 'testdb' } });
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(nameInput, { target: { value: 'MySQL Source' } });
      
      const testButton = screen.getByText('Test Connection');
      fireEvent.click(testButton);
    });
    
    await waitFor(() => {
      const saveButton = screen.getByText('Save Data Source');
      fireEvent.click(saveButton);
    });
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/data-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'MySQL Source',
          type: 'mysql',
          host: 'localhost',
          port: 3306,
          database: 'testdb',
          username: 'testuser',
          password: ''
        })
      });
      expect(screen.getByText('Data source saved successfully')).toBeInTheDocument();
    });
  });

  it('should handle save errors', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Connection successful' })
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'Save failed' })
      });

    render(<UnifiedDataSourceWorkflow />);
    
    const mysqlOption = screen.getByText('MySQL');
    fireEvent.click(mysqlOption);
    
    await waitFor(() => {
      const hostInput = screen.getByLabelText('Host');
      const databaseInput = screen.getByLabelText('Database Name');
      const usernameInput = screen.getByLabelText('Username');
      const nameInput = screen.getByLabelText('Data Source Name');
      
      fireEvent.change(hostInput, { target: { value: 'localhost' } });
      fireEvent.change(databaseInput, { target: { value: 'testdb' } });
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(nameInput, { target: { value: 'MySQL Source' } });
      
      const testButton = screen.getByText('Test Connection');
      fireEvent.click(testButton);
    });
    
    await waitFor(() => {
      const saveButton = screen.getByText('Save Data Source');
      fireEvent.click(saveButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });
  });

  it('should show advanced configuration options', async () => {
    render(<UnifiedDataSourceWorkflow />);
    
    const mysqlOption = screen.getByText('MySQL');
    fireEvent.click(mysqlOption);
    
    await waitFor(() => {
      const advancedToggle = screen.getByText('Advanced Configuration');
      fireEvent.click(advancedToggle);
      
      expect(screen.getByLabelText('SSL Mode')).toBeInTheDocument();
      expect(screen.getByLabelText('Connection Timeout')).toBeInTheDocument();
      expect(screen.getByLabelText('Max Connections')).toBeInTheDocument();
    });
  });

  it('should validate API URL format', async () => {
    render(<UnifiedDataSourceWorkflow />);
    
    const apiOption = screen.getByText('API Endpoint');
    fireEvent.click(apiOption);
    
    await waitFor(() => {
      const urlInput = screen.getByLabelText('API URL');
      fireEvent.change(urlInput, { target: { value: 'invalid-url' } });
      
      const testButton = screen.getByText('Test Connection');
      fireEvent.click(testButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Invalid URL format')).toBeInTheDocument();
    });
  });

  it('should handle file upload', async () => {
    const mockFile = new File(['test content'], 'test.csv', { type: 'text/csv' });
    
    render(<UnifiedDataSourceWorkflow />);
    
    const fileOption = screen.getByText('File Upload');
    fireEvent.click(fileOption);
    
    await waitFor(() => {
      const fileInput = screen.getByLabelText('Choose File');
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      expect(screen.getByText('test.csv')).toBeInTheDocument();
      expect(screen.getByText('File selected successfully')).toBeInTheDocument();
    });
  });

  it('should show progress during connection test', async () => {
    (fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true, message: 'Connection successful' })
      }), 100))
    );

    render(<UnifiedDataSourceWorkflow />);
    
    const mysqlOption = screen.getByText('MySQL');
    fireEvent.click(mysqlOption);
    
    await waitFor(() => {
      const hostInput = screen.getByLabelText('Host');
      const databaseInput = screen.getByLabelText('Database Name');
      const usernameInput = screen.getByLabelText('Username');
      
      fireEvent.change(hostInput, { target: { value: 'localhost' } });
      fireEvent.change(databaseInput, { target: { value: 'testdb' } });
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      
      const testButton = screen.getByText('Test Connection');
      fireEvent.click(testButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Testing connection...')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText('Connection successful')).toBeInTheDocument();
    });
  });

  it('should allow canceling the workflow', () => {
    render(<UnifiedDataSourceWorkflow />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(screen.getByText('Are you sure you want to cancel?')).toBeInTheDocument();
    
    const confirmButton = screen.getByText('Yes, Cancel');
    fireEvent.click(confirmButton);
    
    // Should navigate away or reset the workflow
    expect(screen.getByText('Data Source Setup')).toBeInTheDocument();
  });

  it('should show help and documentation links', () => {
    render(<UnifiedDataSourceWorkflow />);
    
    expect(screen.getByText('Need Help?')).toBeInTheDocument();
    expect(screen.getByText('Documentation')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
  });
});