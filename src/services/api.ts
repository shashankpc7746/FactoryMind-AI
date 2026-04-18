/**
 * API Service Layer
 * Handles all backend communication for FactoryMind AI
 */

function normalizeBaseUrl(url: string) {
  return url.replace(/\/$/, '');
}

function uniqueUrls(urls: string[]) {
  return Array.from(new Set(urls.map(normalizeBaseUrl).filter(Boolean)));
}

function resolveApiBaseUrls() {
  const candidates: string[] = [];
  const configured = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (configured) {
    candidates.push(configured);
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname, origin } = window.location;

    // Local development fallback.
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      candidates.push('http://localhost:8000');
      return uniqueUrls(candidates);
    }

    // Render convention fallback: <frontend>.onrender.com -> <frontend>-backend.onrender.com
    if (hostname.endsWith('.onrender.com')) {
      const serviceName = hostname.replace('.onrender.com', '');
      if (serviceName.endsWith('-backend')) {
        candidates.push(origin);
      } else {
        candidates.push(`${protocol}//${serviceName}-backend.onrender.com`);
      }

      // Explicit service fallback for this deployment.
      candidates.push('https://factorymind-ai-backend.onrender.com');
    }

    // Same-origin fallback for reverse proxy style deployments.
    candidates.push(origin);
  }

  candidates.push('http://localhost:8000');
  return uniqueUrls(candidates);
}

export const API_BASE_URLS = resolveApiBaseUrls();
export const API_BASE_URL = API_BASE_URLS[0];

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiRequest(path: string, init: RequestInit, fallbackError: string): Promise<Response> {
  let lastError: Error | null = null;

  for (const baseUrl of API_BASE_URLS) {
    const url = `${baseUrl}${path}`;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch(url, init);
        if (response.ok) {
          return response;
        }

        // Continue trying next base URL for typical wrong-host symptoms.
        if ([404, 405, 502, 503, 504].includes(response.status)) {
          lastError = new Error(await parseErrorMessage(response, fallbackError));
          break;
        }

        throw new Error(await parseErrorMessage(response, fallbackError));
      } catch (error) {
        const shouldRetry = isNetworkError(error) && attempt === 0;
        if (shouldRetry) {
          await wait(1200);
          continue;
        }

        if (isNetworkError(error)) {
          lastError = new Error(`Unable to connect to API at ${baseUrl}`);
          break;
        }

        throw error;
      }
    }
  }

  if (lastError) {
    throw new Error(`${lastError.message}. Tried: ${API_BASE_URLS.join(', ')}`);
  }

  throw new Error(`${fallbackError}. No API base URL candidates available.`);
}

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const error = await response.json();
      return error.detail || error.message || fallback;
    }

    const text = await response.text();
    return text || fallback;
  } catch {
    return fallback;
  }
}

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
  summary: string | { executive_summary?: string };
  metrics: Array<{
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
  }>;
  observations: Array<string | { observation?: string }>;
  recommendations: Array<string | { recommendation?: string }>;
  charts?: Array<{
    type: 'bar' | 'line' | 'pie' | 'heatmap';
    title: string;
    data: any[];
    xKey?: string;
    yKey?: string;
    color?: string;
    lines?: Array<{ key: string; color: string }>;
    columns?: string[];
  }>;
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

  const response = await apiRequest('/upload/document', {
    method: 'POST',
    body: formData,
  }, 'Failed to upload document');

  return response.json();
}

/**
 * Upload data file (CSV/Excel) for report generation
 */
export async function uploadDataFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiRequest('/upload/data', {
    method: 'POST',
    body: formData,
  }, 'Failed to upload data file');

  return response.json();
}

/**
 * Query documents using RAG
 */
export async function queryDocuments(question: string): Promise<QueryResponse> {
  const response = await apiRequest('/chat/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  }, 'Failed to query documents');

  return response.json();
}

/**
 * Generate report from uploaded data file
 */
export async function generateReport(file: File): Promise<Report> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiRequest('/report/generate', {
    method: 'POST',
    body: formData,
  }, 'Failed to generate report');

  return response.json();
}

/**
 * List all uploaded documents
 */
export async function listDocuments(): Promise<{ documents: Document[]; count: number }> {
  const response = await apiRequest('/documents', { method: 'GET' }, 'Failed to fetch documents');

  return response.json();
}

/**
 * Delete a document
 */
export async function deleteDocument(filename: string): Promise<void> {
  await apiRequest(`/documents/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
  }, 'Failed to delete document');
}

/**
 * Clear all stored data (documents, reports, vector store)
 */
export async function clearAllData(): Promise<{ status: string; message: string }> {
  const response = await apiRequest('/clear-all-data', {
    method: 'DELETE',
  }, 'Failed to clear all data');

  return response.json();
}

/**
 * List all generated reports
 */
export async function listReports(): Promise<{ reports: Report[]; count: number; data?: Report[] }> {
  const response = await apiRequest('/reports', { method: 'GET' }, 'Failed to fetch reports');

  return response.json();
}

/**
 * Get specific report by ID
 */
export async function getReport(reportId: string): Promise<Report> {
  const response = await apiRequest(`/reports/${reportId}`, { method: 'GET' }, 'Failed to fetch report');

  return response.json();
}

/**
 * Download report as PDF
 */
export async function downloadReportPDF(reportId: string): Promise<Blob> {
  const response = await apiRequest(`/reports/${reportId}/download`, { method: 'GET' }, 'Failed to download report PDF');

  return response.blob();
}

/**
 * Delete a report
 */
export async function deleteReport(reportId: string): Promise<void> {
  await apiRequest(`/reports/${reportId}`, {
    method: 'DELETE',
  }, 'Failed to delete report');
}

/**
 * Get history (documents and reports)
 */
export async function getHistory() {
  const response = await apiRequest('/history', { method: 'GET' }, 'Failed to fetch history');

  return response.json();
}

/**
 * Health check
 */
export async function healthCheck() {
  const response = await apiRequest('/health', { method: 'GET' }, 'Health check failed');
  return response.json();
}
