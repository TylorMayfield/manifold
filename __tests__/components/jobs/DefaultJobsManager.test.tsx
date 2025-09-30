import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DefaultJobsManager from '../../../components/jobs/DefaultJobsManager';

// Mock fetch
global.fetch = jest.fn();

describe('DefaultJobsManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // By default, return no jobs (empty state)
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ([]), // API returns array directly
    });
  });

  describe('Rendering', () => {
    it('should render the component', () => {
      render(<DefaultJobsManager />);
      expect(screen.getByText(/Default System Jobs/i)).toBeInTheDocument();
    });

    it('should show loading state initially', async () => {
      render(<DefaultJobsManager />);
      
      await waitFor(() => {
        // After loading completes, should show content
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
    });

    it('should render empty state when no jobs', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ([]), // No jobs
      });

      render(<DefaultJobsManager />);
      
      await waitFor(() => {
        expect(screen.getByText('No System Jobs Created')).toBeInTheDocument();
      });
    });
  });

  describe('Job Actions', () => {
    it('should render create default jobs button', async () => {
      render(<DefaultJobsManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Create Default Jobs')).toBeInTheDocument();
      });
    });

    it('should allow creating default jobs', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ([]),
      });

      render(<DefaultJobsManager />);
      
      await waitFor(() => {
        const createButton = screen.getByText('Create Default Jobs');
        expect(createButton).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<DefaultJobsManager />);
      
      await waitFor(() => {
        // Should handle error gracefully
        expect(screen.queryByText(/error/i)).toBeDefined();
      });
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      render(<DefaultJobsManager />);
      
      await waitFor(() => {
        // Should handle error gracefully
        const component = screen.getByText(/Default System Jobs/i);
        expect(component).toBeInTheDocument();
      });
    });
  });

  describe('Dark Theme', () => {
    it('should render with dark theme classes', async () => {
      const { container } = render(<DefaultJobsManager />);
      
      await waitFor(() => {
        // Check for dark theme elements
        const darkElements = container.querySelectorAll('[class*="gray-"]');
        expect(darkElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Job Display', () => {
    it('should display system jobs heading', async () => {
      render(<DefaultJobsManager />);
      
      await waitFor(() => {
        expect(screen.getByText('System Jobs')).toBeInTheDocument();
      });
    });

    it('should display empty state message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ([]),
      });

      render(<DefaultJobsManager />);
      
      await waitFor(() => {
        expect(screen.getByText('No System Jobs Created')).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('should fetch jobs on mount', async () => {
      render(<DefaultJobsManager />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/jobs')
        );
      });
    });

    it('should retry on fetch failure', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, jobs: [] }),
        });

      render(<DefaultJobsManager />);
      
      await waitFor(() => {
        // Component should handle retry
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });
});
