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

async function apiRequest(
  path: string,
  init: RequestInit,
  fallbackError: string,
  timeoutMs: number = 30000
): Promise<Response> {
  let lastError: Error | null = null;

  for (const baseUrl of API_BASE_URLS) {
    const url = `${baseUrl}${path}`;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const response = await fetch(url, {
            ...init,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            return response;
          }

          // Continue trying next base URL for typical wrong-host symptoms.
          if ([404, 405, 502, 503, 504].includes(response.status)) {
            lastError = new Error(await parseErrorMessage(response, fallbackError));
            break;
          }

          throw new Error(await parseErrorMessage(response, fallbackError));
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          lastError = new Error(`Request timeout (${timeoutMs}ms). Endpoint took too long to respond.`);
          break;
        }

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

async function safeParseJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Expected JSON response but got ${contentType || 'text'}. Response: ${text.substring(0, 200)}`);
  }

  const text = await response.text();
  if (!text || text.trim().length === 0) {
    throw new Error('Backend returned empty response body');
  }

  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new Error(`Failed to parse backend response: ${text.substring(0, 300)}`);
  }
}

export interface QueryRequest {
  question: string;
  history?: Array<{ role: string; content: string }>;
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

  try {
    // Use 10-minute timeout for document uploads (model loading takes time)
    const response = await apiRequest('/upload/document', {
      method: 'POST',
      body: formData,
    }, 'Failed to upload document', 600000);

    return await safeParseJson<UploadResponse>(response);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Document upload failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Indexing status for a document being processed in the background
 */
export interface IndexingStatus {
  filename: string;
  status: 'processing' | 'indexed' | 'failed' | 'unknown';
  chunks?: number;
  error?: string;
  started_at?: string;
  finished_at?: string;
}

/**
 * Check the indexing status of a recently uploaded document
 */
export async function checkIndexingStatus(filename: string): Promise<IndexingStatus> {
  const response = await apiRequest(
    `/indexing-status/${encodeURIComponent(filename)}`,
    { method: 'GET' },
    'Failed to check indexing status'
  );
  return safeParseJson<IndexingStatus>(response);
}

/**
 * Poll until a document is indexed (or fails). Resolves with the final status.
 * Polls every 3 seconds with a 5-minute timeout.
 */
export function pollUntilIndexed(
  filename: string,
  onStatusChange?: (status: IndexingStatus) => void,
  intervalMs: number = 3000,
  timeoutMs: number = 300000
): Promise<IndexingStatus> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const poll = async () => {
      try {
        const status = await checkIndexingStatus(filename);
        onStatusChange?.(status);

        if (status.status === 'indexed' || status.status === 'failed') {
          resolve(status);
          return;
        }

        if (Date.now() - startTime > timeoutMs) {
          resolve({ filename, status: 'failed', error: 'Indexing timed out' });
          return;
        }

        setTimeout(poll, intervalMs);
      } catch {
        // Network hiccup — keep trying until timeout
        if (Date.now() - startTime > timeoutMs) {
          reject(new Error('Indexing status check timed out'));
          return;
        }
        setTimeout(poll, intervalMs);
      }
    };

    poll();
  });
}

/**
 * Upload data file (CSV/Excel) for report generation
 */
export async function uploadDataFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    // Use 5-minute timeout for data file uploads
    const response = await apiRequest('/upload/data', {
      method: 'POST',
      body: formData,
    }, 'Failed to upload data file', 300000);

    return await safeParseJson<UploadResponse>(response);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Data file upload failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Query documents using RAG (with optional conversation history for follow-ups)
 */
export async function queryDocuments(
  question: string,
  history?: Array<{ role: string; content: string }>
): Promise<QueryResponse> {
  const body: QueryRequest = { question };
  if (history && history.length > 0) {
    body.history = history;
  }

  const response = await apiRequest('/chat/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }, 'Failed to query documents');

  return safeParseJson<QueryResponse>(response);
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

  return safeParseJson<Report>(response);
}

/**
 * List all uploaded documents
 */
export async function listDocuments(): Promise<{ documents: Document[]; count: number }> {
  const response = await apiRequest('/documents', { method: 'GET' }, 'Failed to fetch documents');

  return safeParseJson<{ documents: Document[]; count: number }>(response);
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

  return safeParseJson<{ status: string; message: string }>(response);
}

/**
 * List all generated reports
 */
export async function listReports(): Promise<{ reports: Report[]; count: number; data?: Report[] }> {
  const response = await apiRequest('/reports', { method: 'GET' }, 'Failed to fetch reports');

  return safeParseJson<{ reports: Report[]; count: number; data?: Report[] }>(response);
}

/**
 * Get specific report by ID
 */
export async function getReport(reportId: string): Promise<Report> {
  const response = await apiRequest(`/reports/${reportId}`, { method: 'GET' }, 'Failed to fetch report');

  return safeParseJson<Report>(response);
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

  return safeParseJson<any>(response);
}

/**
 * Health check
 */
export async function healthCheck() {
  const response = await apiRequest('/health', { method: 'GET' }, 'Health check failed');
  return safeParseJson<any>(response);
}
