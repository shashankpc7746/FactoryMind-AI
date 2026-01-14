/**
 * API Service Layer
 * Handles all backend communication for FactoryMind AI
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface QueryRequest {
  question: string;
}

export interface QueryResponse {
  answer: string;
  citations: string[];
  chunks_retrieved: number;
}

export interface UploadResponse {
  status: string;
  filename: string;
  message: string;
  details?: {
    chunks?: number;
    pages?: number;
  };
}

export interface Report {
  id: string;
  title: string;
  date: string;
  summary: string;
  metrics: Array<{
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
  }>;
  observations: string[];
  recommendations: string[];
}

export interface Document {
  filename: string;
  size: string;
  upload_date: number;
  path: string;
}

/**
 * Upload PDF document for RAG indexing
 */
export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload/document`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload document');
  }

  return response.json();
}

/**
 * Upload data file (CSV/Excel) for report generation
 */
export async function uploadDataFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload/data`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload data file');
  }

  return response.json();
}

/**
 * Query documents using RAG
 */
export async function queryDocuments(question: string): Promise<QueryResponse> {
  const response = await fetch(`${API_BASE_URL}/chat/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to query documents');
  }

  return response.json();
}

/**
 * Generate report from uploaded data file
 */
export async function generateReport(file: File): Promise<Report> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/report/generate`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate report');
  }

  return response.json();
}

/**
 * List all uploaded documents
 */
export async function listDocuments(): Promise<{ documents: Document[]; count: number }> {
  const response = await fetch(`${API_BASE_URL}/documents`);

  if (!response.ok) {
    throw new Error('Failed to fetch documents');
  }

  return response.json();
}

/**
 * Delete a document
 */
export async function deleteDocument(filename: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/documents/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete document');
  }
}

/**
 * List all generated reports
 */
export async function listReports(): Promise<{ reports: Report[]; count: number }> {
  const response = await fetch(`${API_BASE_URL}/reports`);

  if (!response.ok) {
    throw new Error('Failed to fetch reports');
  }

  return response.json();
}

/**
 * Get specific report by ID
 */
export async function getReport(reportId: string): Promise<Report> {
  const response = await fetch(`${API_BASE_URL}/reports/${reportId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch report');
  }

  return response.json();
}

/**
 * Download report as PDF
 */
export async function downloadReportPDF(reportId: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/reports/${reportId}/download`);

  if (!response.ok) {
    throw new Error('Failed to download report PDF');
  }

  return response.blob();
}

/**
 * Get history (documents and reports)
 */
export async function getHistory() {
  const response = await fetch(`${API_BASE_URL}/history`);

  if (!response.ok) {
    throw new Error('Failed to fetch history');
  }

  return response.json();
}

/**
 * Health check
 */
export async function healthCheck() {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}
