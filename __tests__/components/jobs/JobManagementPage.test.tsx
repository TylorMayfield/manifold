/**
 * Job Management Page Unit Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import JobManagementPage from '../../../components/jobs/JobManagementPage';

// Mock fetch
global.fetch = jest.fn();

describe('JobManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for API calls
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/pipelines')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 'pipeline-1', name: 'Test Pipeline 1' },
            { id: 'pipeline-2', name: 'Test Pipeline 2' }
          ]
        });
      }
      if (url.includes('/api/data-sources')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 'ds-1', name: 'MySQL DB', type: 'mysql' },
            { id: 'ds-2', name: 'CSV File', type: 'csv' }
          ]
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ jobs: [] })
      });
    });
  });

  describe('Job Creation Form', () => {
    it('should show pipeline dropdown when pipeline type is selected', async () => {
      const { container } = render(<JobManagementPage />);
      
      // Open create job modal
      const createButton = screen.getAllByText(/Schedule New Job/i)[0];
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/Pipeline Execution/i)).toBeInTheDocument();
      });

      // Pipeline type should be default
      const typeSelect = screen.getByLabelText(/Job Type/i) as HTMLSelectElement;
      expect(typeSelect.value).toBe('pipeline');

      // Should show pipeline dropdown
      await waitFor(() => {
        const pipelineDropdown = container.querySelector('select[value]') as HTMLSelectElement;
        expect(pipelineDropdown).toBeInTheDocument();
      });
    });

    it('should load available pipelines in dropdown', async () => {
      render(<JobManagementPage />);
      
      const createButton = screen.getAllByText(/Schedule New Job/i)[0];
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/pipelines');
      });

      // Wait for pipelines to load
      await waitFor(() => {
        expect(screen.getByText('Test Pipeline 1')).toBeInTheDocument();
        expect(screen.getByText('Test Pipeline 2')).toBeInTheDocument();
      });
    });

    it('should show data source dropdown when data_sync type is selected', async () => {
      render(<JobManagementPage />);
      
      const createButton = screen.getAllByText(/Schedule New Job/i)[0];
      fireEvent.click(createButton);

      await waitFor(() => {
        const typeSelect = screen.getByLabelText(/Job Type/i);
        fireEvent.change(typeSelect, { target: { value: 'data_sync' } });
      });

      await waitFor(() => {
        expect(screen.getByText(/Data Source/i)).toBeInTheDocument();
        expect(screen.getByText('MySQL DB (mysql)')).toBeInTheDocument();
        expect(screen.getByText('CSV File (csv)')).toBeInTheDocument();
      });
    });

    it('should show script editor when custom_script type is selected', async () => {
      render(<JobManagementPage />);
      
      const createButton = screen.getAllByText(/Schedule New Job/i)[0];
      fireEvent.click(createButton);

      await waitFor(() => {
        const typeSelect = screen.getByLabelText(/Job Type/i);
        fireEvent.change(typeSelect, { target: { value: 'custom_script' } });
      });

      await waitFor(() => {
        expect(screen.getByText(/Script Code/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Enter JavaScript code/i)).toBeInTheDocument();
      });
    });

    it('should show API fields when api_poll type is selected', async () => {
      render(<JobManagementPage />);
      
      const createButton = screen.getAllByText(/Schedule New Job/i)[0];
      fireEvent.click(createButton);

      await waitFor(() => {
        const typeSelect = screen.getByLabelText(/Job Type/i);
        fireEvent.change(typeSelect, { target: { value: 'api_poll' } });
      });

      await waitFor(() => {
        expect(screen.getByText(/API URL/i)).toBeInTheDocument();
        expect(screen.getByText(/HTTP Method/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/https:\/\/api\.example\.com/i)).toBeInTheDocument();
      });
    });

    it('should show workflow ID field when workflow type is selected', async () => {
      render(<JobManagementPage />);
      
      const createButton = screen.getAllByText(/Schedule New Job/i)[0];
      fireEvent.click(createButton);

      await waitFor(() => {
        const typeSelect = screen.getByLabelText(/Job Type/i);
        fireEvent.change(typeSelect, { target: { value: 'workflow' } });
      });

      await waitFor(() => {
        expect(screen.getByText(/Workflow ID/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Enter workflow ID/i)).toBeInTheDocument();
      });
    });

    it('should require pipeline selection for pipeline jobs', async () => {
      render(<JobManagementPage />);
      
      const createButton = screen.getAllByText(/Schedule New Job/i)[0];
      fireEvent.click(createButton);

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/Enter job name/i);
        fireEvent.change(nameInput, { target: { value: 'Test Job' } });
      });

      // Try to submit without selecting pipeline
      const submitButton = screen.getByText(/Create Job/i);
      fireEvent.click(submitButton);

      // Form should not submit (HTML5 validation should catch it)
      // The required attribute on the select should prevent submission
      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalledWith(
          expect.stringContaining('/api/jobs'),
          expect.objectContaining({ method: 'POST' })
        );
      });
    });
  });

  describe('Job Form Validation', () => {
    it('should include selected pipeline ID in job creation', async () => {
      (global.fetch as jest.Mock).mockImplementation((url, options) => {
        if (url.includes('/api/jobs') && options?.method === 'POST') {
          const body = JSON.parse(options.body);
          expect(body).toHaveProperty('pipelineId');
          expect(body.pipelineId).toBe('pipeline-1');
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: 'new-job', ...body })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ([])
        });
      });

      render(<JobManagementPage />);
      
      const createButton = screen.getAllByText(/Schedule New Job/i)[0];
      fireEvent.click(createButton);

      await waitFor(async () => {
        const nameInput = screen.getByPlaceholderText(/Enter job name/i);
        fireEvent.change(nameInput, { target: { value: 'Test Pipeline Job' } });

        // Wait for pipelines to load and select one
        await waitFor(() => {
          const pipelineSelect = screen.getAllByRole('combobox').find(
            select => select.getAttribute('name') === 'pipelineId' ||
                     (select as HTMLSelectElement).options[1]?.text?.includes('Test Pipeline')
          );
          if (pipelineSelect) {
            fireEvent.change(pipelineSelect, { target: { value: 'pipeline-1' } });
          }
        });

        const submitButton = screen.getByText(/Create Job/i);
        fireEvent.click(submitButton);
      });
    });
  });
});

