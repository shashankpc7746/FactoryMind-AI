import { useState, useRef, useEffect } from 'react';
import { Upload, FileSpreadsheet, Download, Eye, TrendingUp, AlertCircle, CheckCircle2, Trash2, BarChart3 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner';
import * as api from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

interface ChartDescriptor {
  type: 'bar' | 'line' | 'pie' | 'heatmap';
  title: string;
  data: any[];
  xKey?: string;
  yKey?: string;
  color?: string;
  lines?: Array<{ key: string; color: string }>;
  columns?: string[];
}

interface Report {
  id: string;
  title: string;
  date: string;
  summary: string | { executive_summary?: string };
  metrics: Array<{ label: string; value: string; trend?: 'up' | 'down' | 'neutral' }>;
  observations: Array<string | { observation?: string }>;
  recommendations: Array<string | { recommendation?: string }>;
  charts?: ChartDescriptor[];
}

// ============================================================================
// Chart sub-components
// ============================================================================

function ReportBarChart({ chart }: { chart: ChartDescriptor }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chart.data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey={chart.xKey || 'name'}
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={{ stroke: 'hsl(var(--border))' }}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={50}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: 'hsl(var(--border))' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Bar
          dataKey={chart.yKey || 'value'}
          fill={chart.color || '#6366f1'}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ReportLineChart({ chart }: { chart: ChartDescriptor }) {
  const lines = chart.lines || [];
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chart.data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey={chart.xKey || 'date'}
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={{ stroke: 'hsl(var(--border))' }}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: 'hsl(var(--border))' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '11px' }} />
        {lines.map((line, idx) => (
          <Line
            key={idx}
            type="monotone"
            dataKey={line.key}
            stroke={line.color}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function ReportPieChart({ chart }: { chart: ChartDescriptor }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chart.data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
          style={{ fontSize: '11px' }}
        >
          {chart.data.map((entry: any, idx: number) => (
            <Cell key={idx} fill={entry.color || '#6366f1'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '11px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function CorrelationHeatmap({ chart }: { chart: ChartDescriptor }) {
  const columns = chart.columns || [];
  const data = chart.data || [];

  const getColor = (val: number | null) => {
    if (val === null || val === undefined) return 'transparent';
    // -1 (red) -> 0 (neutral) -> +1 (green)
    const abs = Math.abs(val);
    if (val > 0) {
      return `rgba(16, 185, 129, ${abs * 0.7 + 0.1})`;  // green
    } else {
      return `rgba(239, 68, 68, ${abs * 0.7 + 0.1})`;   // red
    }
  };

  // Abbreviate long column names
  const abbrev = (name: string) => {
    if (name.length <= 12) return name;
    return name.slice(0, 10) + '…';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px] sm:text-xs border-collapse">
        <thead>
          <tr>
            <th className="p-1.5 text-left font-medium text-muted-foreground border border-border bg-muted/30"></th>
            {columns.map((col) => (
              <th
                key={col}
                className="p-1.5 font-medium text-muted-foreground border border-border bg-muted/30 text-center"
                title={col}
              >
                {abbrev(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, rIdx: number) => (
            <tr key={rIdx}>
              <td className="p-1.5 font-medium text-muted-foreground border border-border bg-muted/30 whitespace-nowrap" title={row.column}>
                {abbrev(row.column)}
              </td>
              {columns.map((col) => {
                const val = row[col];
                return (
                  <td
                    key={col}
                    className="p-1.5 text-center border border-border font-mono"
                    style={{ backgroundColor: getColor(val) }}
                    title={`${row.column} × ${col}: ${val}`}
                  >
                    {val !== null && val !== undefined ? val.toFixed(2) : '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartCard({ chart }: { chart: ChartDescriptor }) {
  return (
    <Card className="p-3 sm:p-4">
      <h4 className="text-xs sm:text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
        <BarChart3 className="w-3.5 h-3.5" />
        {chart.title}
      </h4>
      {chart.type === 'bar' && <ReportBarChart chart={chart} />}
      {chart.type === 'line' && <ReportLineChart chart={chart} />}
      {chart.type === 'pie' && <ReportPieChart chart={chart} />}
      {chart.type === 'heatmap' && <CorrelationHeatmap chart={chart} />}
    </Card>
  );
}

// ============================================================================
// Main component
// ============================================================================

export function ReportGenerator() {
  const [reports, setReports] = useState<Report[]>([]);

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing reports on mount
  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await api.listReports();
      // Handle both direct array and nested structure
      const reportsList = response.reports || response.data || response || [];
      const reportsArray = Array.isArray(reportsList) ? reportsList : [];
      
      // Sort by date (most recent first) and limit to 10
      const sortedReports = reportsArray
        .sort((a, b) => {
          const dateA = new Date(a.date || 0).getTime();
          const dateB = new Date(b.date || 0).getTime();
          return dateB - dateA; // Descending order (recent first)
        })
        .slice(0, 10); // Limit to 10 reports
      
      setReports(sortedReports);
    } catch (error) {
      console.error('Error loading reports:', error);
      setReports([]);
      // Don't show error toast on initial load
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 5, 90));
      }, 200);

      // Generate report via backend
      const report = await api.generateReport(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      setReports((prev) => [report, ...prev]);
      toast.success('Report generated successfully');
      
      // Auto-open the new report
      setTimeout(() => setSelectedReport(report), 500);

    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = async (report: Report) => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf' });
      const blob = await api.downloadReportPDF(report.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF downloaded successfully', { id: 'pdf' });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'pdf' });
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }
    
    try {
      await api.deleteReport(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      toast.success('Report deleted successfully');
      
      // Close dialog if the deleted report was open
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error(`Failed to delete report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const hasCharts = (report: Report) => {
    return report.charts && Array.isArray(report.charts) && report.charts.length > 0;
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Upload Card */}
      <Card className="border-2 border-dashed border-border">
        <div className="p-6 sm:p-8 lg:p-12 text-center">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-accent/20 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
            </div>
          </div>
          
          <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">Upload Data File</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 px-2">
            Upload CSV or Excel files to generate automated reports with visual analytics
          </p>
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-accent hover:bg-accent/90 text-sm"
            size="sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            Select Data File
          </Button>

          {uploading && (
            <div className="mt-4 max-w-md mx-auto px-4">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Generating report... {uploadProgress}%
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            aria-label="Upload data file for report generation"
          />
        </div>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        <h3 className="text-base sm:text-lg font-semibold">Generated Reports</h3>
        
        {reports.map((report) => {
          // Safety check for required fields
          if (!report || !report.id) return null;
          
          // Parse summary safely
          const summaryText = typeof report.summary === 'string' 
            ? report.summary 
            : (report.summary?.executive_summary || 'No summary available');
          
          // Ensure metrics is an array
          const metrics = Array.isArray(report.metrics) ? report.metrics : [];
          
          return (
          <Card key={report.id} className="hover:shadow-lg transition-shadow">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm sm:text-base lg:text-lg mb-1">{report.title || 'Untitled Report'}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Generated on {report.date ? new Date(report.date).toLocaleDateString() : 'Unknown date'}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {hasCharts(report) && (
                    <Badge variant="secondary" className="text-[10px] sm:text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20">
                      <BarChart3 className="w-3 h-3 mr-1" />
                      {report.charts!.length} Charts
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">
                    <FileSpreadsheet className="w-3 h-3 mr-1" />
                    Report
                  </Badge>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">{summaryText}</p>

              {/* Quick Metrics */}
              {metrics.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
                {metrics.slice(0, 4).map((metric, idx) => (
                  <div key={idx} className="p-2 sm:p-3 rounded-lg bg-muted">
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 truncate">{metric.label}</p>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <p className="text-sm sm:text-base lg:text-lg font-semibold truncate">{metric.value}</p>
                      {metric.trend === 'up' && (
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                      )}
                      {metric.trend === 'down' && (
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 rotate-180 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="default"
                  onClick={() => setSelectedReport(report)}
                  className="text-xs sm:text-sm w-full sm:w-auto"
                  size="sm"
                >
                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                  View Full Report
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownload(report)}
                  className="text-xs sm:text-sm w-full sm:w-auto"
                  size="sm"
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(report.id)}
                  className="text-xs sm:text-sm w-full sm:w-auto"
                  size="sm"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        )})}


        {reports.length === 0 && (
          <Card className="p-12">
            <div className="text-center text-muted-foreground">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No reports generated yet</p>
              <p className="text-sm mt-1">Upload a data file to generate your first report</p>
            </div>
          </Card>
        )}
      </div>

      {/* Full Report View Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{selectedReport?.title || 'Report'}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {selectedReport?.summary 
                ? (typeof selectedReport.summary === 'string' 
                    ? selectedReport.summary 
                    : selectedReport.summary?.executive_summary || 'No summary available')
                : 'No summary available'}
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 sm:space-y-6 mt-4">
              {/* Key Metrics */}
              {selectedReport.metrics && Array.isArray(selectedReport.metrics) && selectedReport.metrics.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Key Metrics
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {selectedReport.metrics.map((metric, idx) => (
                    <Card key={idx} className="p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2 truncate">{metric.label}</p>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{metric.value}</p>
                        {metric.trend === 'up' && (
                          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                        )}
                        {metric.trend === 'down' && (
                          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 rotate-180 flex-shrink-0" />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
              )}

              {/* ====== Visual Analytics Section ====== */}
              {hasCharts(selectedReport) && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Visual Analytics
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {selectedReport.charts!.map((chart, idx) => (
                    <ChartCard key={idx} chart={chart} />
                  ))}
                </div>
              </div>
              )}

              {/* Observations */}
              {selectedReport.observations && Array.isArray(selectedReport.observations) && selectedReport.observations.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Observations
                </h3>
                <ul className="space-y-2">
                  {selectedReport.observations.map((obs, idx) => {
                    const obsText = typeof obs === 'string' ? obs : (obs?.observation || JSON.stringify(obs));
                    return (
                    <li key={idx} className="flex gap-2 sm:gap-3">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm text-muted-foreground">{obsText}</span>
                    </li>
                  )})}
                </ul>
              </div>
              )}

              {/* Recommendations */}
              {selectedReport.recommendations && Array.isArray(selectedReport.recommendations) && selectedReport.recommendations.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {selectedReport.recommendations.map((rec, idx) => {
                    const recText = typeof rec === 'string' ? rec : (rec?.recommendation || JSON.stringify(rec));
                    return (
                    <li key={idx} className="flex gap-2 sm:gap-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] sm:text-xs font-semibold text-primary">{idx + 1}</span>
                      </div>
                      <span className="text-xs sm:text-sm text-muted-foreground">{recText}</span>
                    </li>
                  )})}
                </ul>
              </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-border">
                <Button
                  className="flex-1 text-xs sm:text-sm"
                  size="sm"
                  onClick={() => handleDownload(selectedReport)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedReport(null)}
                  className="text-xs sm:text-sm"
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}