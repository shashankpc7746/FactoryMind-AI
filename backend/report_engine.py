"""
Report Generation Engine
Handles CSV/Excel data analysis and LLM-based report generation.
"""

import os
from pathlib import Path
from typing import Dict, List
import logging
import json

import pandas as pd
import numpy as np
from datetime import datetime

from llm_client import LLMClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ReportEngine:
    """Engine for analyzing operational data and generating reports."""
    
    def __init__(self, data_path: str = "./data/csv"):
        """
        Initialize report engine.
        
        Args:
            data_path: Path to store uploaded data files
        """
        self.data_path = Path(data_path)
        self.data_path.mkdir(parents=True, exist_ok=True)
        
        # Persistent storage for reports metadata
        self.reports_metadata_file = self.data_path / "reports_metadata.json"
        
        self.llm_client = LLMClient()
        self.reports_cache = []  # Store generated reports in memory
        
        # Load existing reports from disk on startup
        self._load_reports_from_disk()
    
    def analyze_data_file(self, file_path: str, filename: str) -> Dict:
        """
        Analyze CSV or Excel file and compute statistics.
        
        Args:
            file_path: Path to data file
            filename: Original filename
            
        Returns:
            Dict with computed analytics
        """
        try:
            logger.info(f"Analyzing data file: {filename}")
            
            # Load data based on file type
            if filename.endswith('.csv'):
                df = pd.read_csv(file_path)
            elif filename.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file_path)
            else:
                raise ValueError(f"Unsupported file type: {filename}")
            
            # Basic statistics
            total_rows = len(df)
            total_columns = len(df.columns)
            
            # Column info
            columns = df.columns.tolist()
            
            # Statistical summary for numeric columns
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            statistics = {}
            
            for col in numeric_cols:
                statistics[col] = {
                    'mean': float(df[col].mean()),
                    'median': float(df[col].median()),
                    'std': float(df[col].std()),
                    'min': float(df[col].min()),
                    'max': float(df[col].max()),
                    'sum': float(df[col].sum())
                }
            
            # Missing values
            missing_values = df.isnull().sum().to_dict()
            missing_values = {k: int(v) for k, v in missing_values.items() if v > 0}
            
            # Anomaly detection (simple outlier detection using IQR method)
            anomalies = self._detect_anomalies(df, numeric_cols)
            
            # Generate chart-ready data for visual analytics
            charts = self._generate_chart_data(df, numeric_cols, columns)
            
            summary = {
                'filename': filename,
                'total_rows': total_rows,
                'total_columns': total_columns,
                'columns': columns,
                'numeric_columns': list(numeric_cols),
                'statistics': statistics,
                'missing_values': missing_values,
                'anomalies': anomalies,
                'charts': charts
            }
            
            logger.info(f"Analysis complete: {total_rows} rows, {total_columns} columns")
            return summary
        
        except Exception as e:
            logger.error(f"Error analyzing data file: {str(e)}")
            raise
    
    def _generate_chart_data(self, df: pd.DataFrame, numeric_cols, all_columns) -> List[Dict]:
        """
        Generate chart-ready data structures for visual analytics.
        
        Args:
            df: DataFrame
            numeric_cols: List of numeric column names
            all_columns: All column names
            
        Returns:
            List of chart descriptor dicts
        """
        charts = []
        
        try:
            # 1. Distribution charts for numeric columns (bar charts) — max 4
            charts.extend(self._generate_distribution_charts(df, numeric_cols))
            
            # 2. Category breakdown charts (pie charts)
            charts.extend(self._generate_category_charts(df, all_columns, numeric_cols))
            
            # 3. Time-series / trend chart (line chart)
            time_chart = self._generate_time_series_chart(df, numeric_cols)
            if time_chart:
                charts.append(time_chart)
            
            # 4. Correlation heatmap (if enough numeric cols)
            corr_chart = self._generate_correlation_chart(df, numeric_cols)
            if corr_chart:
                charts.append(corr_chart)
            
        except Exception as e:
            logger.warning(f"Error generating chart data: {str(e)}")
        
        # Cap at 8 charts max
        return charts[:8]
    
    def _generate_distribution_charts(self, df: pd.DataFrame, numeric_cols) -> List[Dict]:
        """Generate histogram / distribution bar charts for numeric columns."""
        charts = []
        # Pick up to 4 most interesting numeric columns (highest variance)
        cols_with_var = []
        for col in numeric_cols:
            try:
                variance = df[col].var()
                if pd.notna(variance):
                    cols_with_var.append((col, variance))
            except Exception:
                pass
        
        cols_with_var.sort(key=lambda x: x[1], reverse=True)
        selected_cols = [c[0] for c in cols_with_var[:4]]
        
        for col in selected_cols:
            try:
                col_data = df[col].dropna()
                if len(col_data) < 2:
                    continue
                
                # Compute histogram bins
                num_bins = min(10, len(col_data.unique()))
                if num_bins < 2:
                    continue
                
                counts, bin_edges = np.histogram(col_data, bins=num_bins)
                data = []
                for i in range(len(counts)):
                    low = round(float(bin_edges[i]), 2)
                    high = round(float(bin_edges[i + 1]), 2)
                    data.append({
                        "name": f"{low}-{high}",
                        "value": int(counts[i])
                    })
                
                charts.append({
                    "type": "bar",
                    "title": f"{col} Distribution",
                    "data": data,
                    "xKey": "name",
                    "yKey": "value",
                    "color": "#6366f1"
                })
            except Exception as e:
                logger.warning(f"Error generating distribution for {col}: {str(e)}")
        
        return charts
    
    def _generate_category_charts(self, df: pd.DataFrame, all_columns, numeric_cols) -> List[Dict]:
        """Generate charts for categorical columns. Uses pie for few categories, bar for many."""
        charts = []
        categorical_cols = [c for c in all_columns if c not in numeric_cols]
        
        # Define a palette for slices/bars
        chart_colors = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]
        
        for col in categorical_cols[:2]:  # Max 2 category charts
            try:
                num_unique = df[col].nunique()
                # Skip columns with too many unique values (e.g. IDs) or too few
                if num_unique < 2 or num_unique > 50:
                    continue
                
                value_counts = df[col].value_counts()
                
                # Truncate long names helper
                def truncate_name(name, max_len=25):
                    s = str(name)
                    return s[:max_len] + '…' if len(s) > max_len else s
                
                # Decide chart type based on number of categories
                if num_unique <= 6:
                    # Pie chart — few categories
                    top = value_counts.head(6)
                    data = []
                    for i, (name, count) in enumerate(top.items()):
                        data.append({
                            "name": truncate_name(name),
                            "value": int(count),
                            "color": chart_colors[i % len(chart_colors)]
                        })
                    # If there are remaining values, group as "Other"
                    remaining = value_counts.iloc[6:].sum() if len(value_counts) > 6 else 0
                    if remaining > 0:
                        data.append({"name": "Other", "value": int(remaining), "color": "#94a3b8"})
                    
                    charts.append({
                        "type": "pie",
                        "title": f"{col} Breakdown",
                        "data": data
                    })
                else:
                    # Bar chart — many categories, show top 10
                    top = value_counts.head(10)
                    data = []
                    for name, count in top.items():
                        data.append({
                            "name": truncate_name(name, 20),
                            "value": int(count)
                        })
                    
                    charts.append({
                        "type": "bar",
                        "title": f"Top {col} Categories",
                        "data": data,
                        "xKey": "name",
                        "yKey": "value",
                        "color": "#8b5cf6"
                    })
            except Exception as e:
                logger.warning(f"Error generating category chart for {col}: {str(e)}")
        
        return charts
    
    def _generate_time_series_chart(self, df: pd.DataFrame, numeric_cols) -> Dict:
        """Generate line chart if a date/time column exists."""
        try:
            # Try to find a date column
            date_col = None
            for col in df.columns:
                col_lower = col.lower()
                if any(keyword in col_lower for keyword in ['date', 'time', 'timestamp', 'day', 'month', 'year']):
                    try:
                        pd.to_datetime(df[col])
                        date_col = col
                        break
                    except Exception:
                        continue
            
            if not date_col:
                # Try to auto-detect by parsing
                for col in df.columns:
                    if df[col].dtype == 'object':
                        try:
                            pd.to_datetime(df[col])
                            date_col = col
                            break
                        except Exception:
                            continue
            
            if not date_col or len(numeric_cols) == 0:
                return None
            
            # Sort by date and select up to 3 numeric columns for the trend
            df_sorted = df.copy()
            df_sorted[date_col] = pd.to_datetime(df_sorted[date_col])
            df_sorted = df_sorted.sort_values(date_col)
            
            # If too many rows, aggregate by date
            if len(df_sorted) > 50:
                df_sorted = df_sorted.groupby(date_col).mean(numeric_only=True).reset_index()
            
            # Pick up to 3 numeric columns
            trend_cols = list(numeric_cols[:3])
            
            data = []
            for _, row in df_sorted.iterrows():
                point = {"date": str(row[date_col].strftime('%Y-%m-%d') if hasattr(row[date_col], 'strftime') else row[date_col])}
                for tc in trend_cols:
                    val = row.get(tc)
                    point[tc] = round(float(val), 2) if pd.notna(val) else None
                data.append(point)
            
            line_colors = ["#6366f1", "#10b981", "#f59e0b"]
            
            return {
                "type": "line",
                "title": "Trends Over Time",
                "data": data,
                "xKey": "date",
                "lines": [{"key": tc, "color": line_colors[i % len(line_colors)]} for i, tc in enumerate(trend_cols)]
            }
        except Exception as e:
            logger.warning(f"Error generating time-series chart: {str(e)}")
            return None
    
    def _generate_correlation_chart(self, df: pd.DataFrame, numeric_cols) -> Dict:
        """Generate correlation matrix data."""
        try:
            if len(numeric_cols) < 2 or len(numeric_cols) > 15:
                return None
            
            corr_matrix = df[numeric_cols].corr()
            columns = list(numeric_cols)
            
            data = []
            for row_col in columns:
                row_data = {}
                row_data["column"] = row_col
                for col_col in columns:
                    val = corr_matrix.loc[row_col, col_col]
                    row_data[col_col] = round(float(val), 3) if pd.notna(val) else None
                data.append(row_data)
            
            return {
                "type": "heatmap",
                "title": "Correlation Matrix",
                "columns": columns,
                "data": data
            }
        except Exception as e:
            logger.warning(f"Error generating correlation chart: {str(e)}")
            return None
    
    def _detect_anomalies(self, df: pd.DataFrame, numeric_cols) -> Dict:
        """
        Detect anomalies using IQR method.
        
        Args:
            df: DataFrame
            numeric_cols: List of numeric column names
            
        Returns:
            Dict with anomaly information
        """
        try:
            anomaly_count = 0
            anomaly_details = []
            
            for col in numeric_cols:
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                
                outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)]
                
                if len(outliers) > 0:
                    anomaly_count += len(outliers)
                    anomaly_details.append(f"{col}: {len(outliers)} outliers")
            
            return {
                'count': anomaly_count,
                'details': ', '.join(anomaly_details) if anomaly_details else 'No significant anomalies detected'
            }
        
        except Exception as e:
            logger.warning(f"Error detecting anomalies: {str(e)}")
            return {'count': 0, 'details': 'Anomaly detection failed'}
    
    def generate_report(self, file_path: str, filename: str) -> Dict:
        """
        Generate comprehensive operational report from data file.
        
        Args:
            file_path: Path to data file
            filename: Original filename
            
        Returns:
            Structured report dict
        """
        try:
            logger.info(f"Generating report for: {filename}")
            
            # First, analyze the data
            data_summary = self.analyze_data_file(file_path, filename)
            logger.info(f"Data analysis complete for {filename}")
            
            # Generate LLM-based report
            report_content = self.llm_client.generate_report(
                data_summary=data_summary,
                filename=filename
            )
            logger.info(f"LLM report generation complete for {filename}")
            
            # Build complete report structure
            report = {
                'id': datetime.now().strftime('%Y%m%d_%H%M%S'),
                'title': f"Operations Report - {filename.replace('.csv', '').replace('.xlsx', '')}",
                'date': datetime.now().isoformat(),
                'filename': filename,
                'summary': report_content.get('summary', 'Report generated successfully'),
                'metrics': self._format_metrics(data_summary, report_content),
                'observations': report_content.get('observations', []),
                'recommendations': report_content.get('recommendations', []),
                'charts': data_summary.get('charts', []),
                'raw_data_summary': data_summary
            }
            
            # Cache the report
            self.reports_cache.append(report)
            logger.info(f"Report added to cache, total reports: {len(self.reports_cache)}")
            
            # Save to disk for persistence
            self._save_reports_to_disk()
            
            logger.info(f"Report generated successfully: {report['id']}")
            return report
        
        except Exception as e:
            logger.error(f"Error generating report: {str(e)}", exc_info=True)
            raise
    
    def _format_metrics(self, data_summary: Dict, report_content: Dict) -> List[Dict]:
        """
        Format metrics for frontend display.
        
        Args:
            data_summary: Data analytics
            report_content: LLM-generated content
            
        Returns:
            List of metric dicts with label, value, and trend
        """
        metrics = []
        
        # Add key metrics from LLM if available
        if 'key_metrics' in report_content and isinstance(report_content['key_metrics'], list):
            for metric in report_content['key_metrics'][:4]:  # Limit to 4 metrics
                if isinstance(metric, str):
                    parts = metric.split(':')
                    if len(parts) == 2:
                        metrics.append({
                            'label': parts[0].strip(),
                            'value': parts[1].strip(),
                            'trend': 'up'  # Default trend
                        })
        
        # Add data-based metrics if LLM metrics are insufficient
        if len(metrics) < 4:
            metrics.append({
                'label': 'Total Records',
                'value': str(data_summary['total_rows']),
                'trend': 'up'
            })
            metrics.append({
                'label': 'Columns Analyzed',
                'value': str(data_summary['total_columns']),
                'trend': 'neutral'
            })
            metrics.append({
                'label': 'Anomalies Detected',
                'value': str(data_summary['anomalies']['count']),
                'trend': 'down' if data_summary['anomalies']['count'] > 0 else 'up'
            })
            metrics.append({
                'label': 'Data Completeness',
                'value': f"{100 - (sum(data_summary['missing_values'].values()) / (data_summary['total_rows'] * data_summary['total_columns']) * 100):.1f}%",
                'trend': 'up'
            })
        
        return metrics[:4]  # Return max 4 metrics
    
    def get_all_reports(self) -> List[Dict]:
        """
        Get all generated reports.
        
        Returns:
            List of report summaries
        """
        return self.reports_cache
    
    def get_report_by_id(self, report_id: str) -> Dict:
        """
        Get specific report by ID.
        
        Args:
            report_id: Report identifier
            
        Returns:
            Report dict or None
        """
        for report in self.reports_cache:
            if report['id'] == report_id:
                return report
        return None
    
    def delete_report(self, report_id: str):
        """
        Delete a report by ID.
        
        Args:
            report_id: Report identifier
            
        Raises:
            ValueError: If report not found
        """
        # Find report in cache
        report_to_delete = None
        for report in self.reports_cache:
            if report['id'] == report_id:
                report_to_delete = report
                break
        
        if not report_to_delete:
            raise ValueError(f"Report with ID {report_id} not found")
        
        # Remove from cache
        self.reports_cache = [r for r in self.reports_cache if r['id'] != report_id]
        
        # Update metadata file
        self._save_reports_to_disk()
        
        logger.info(f"Deleted report: {report_id}")
    
    def _load_reports_from_disk(self):
        """Load existing reports from disk on startup."""
        try:
            if self.reports_metadata_file.exists():
                with open(self.reports_metadata_file, 'r', encoding='utf-8') as f:
                    self.reports_cache = json.load(f)
                logger.info(f"Loaded {len(self.reports_cache)} reports from disk")
            else:
                logger.info("No existing reports found")
        except Exception as e:
            logger.error(f"Error loading reports from disk: {str(e)}")
            self.reports_cache = []
    
    def _save_reports_to_disk(self):
        """Save current reports to disk for persistence."""
        try:
            with open(self.reports_metadata_file, 'w', encoding='utf-8') as f:
                json.dump(self.reports_cache, f, indent=2, ensure_ascii=False)
            logger.info(f"Saved {len(self.reports_cache)} reports to disk")
        except Exception as e:
            logger.error(f"Error saving reports to disk: {str(e)}")
    
    def clear_all_reports(self):
        """Clear all reports - used by Dangerous Zone in settings."""
        try:
            self.reports_cache = []
            if self.reports_metadata_file.exists():
                self.reports_metadata_file.unlink()
            logger.info("All reports cleared successfully")
        except Exception as e:
            logger.error(f"Error clearing reports: {str(e)}")
            raise
    
    def export_report_to_pdf(self, report_id: str, output_path: str) -> str:
        """
        Export report to PDF format with embedded charts.
        
        Args:
            report_id: Report identifier
            output_path: Path to save PDF
            
        Returns:
            Path to generated PDF
        """
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
            from reportlab.lib import colors
            
            report = self.get_report_by_id(report_id)
            if not report:
                raise ValueError(f"Report {report_id} not found")
            
            # Create PDF
            pdf_path = Path(output_path) / f"report_{report_id}.pdf"
            doc = SimpleDocTemplate(str(pdf_path), pagesize=letter)
            
            # Container for PDF elements
            elements = []
            styles = getSampleStyleSheet()
            
            # Title
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                textColor=colors.HexColor('#1a365d'),
                spaceAfter=30
            )
            elements.append(Paragraph(report['title'], title_style))
            elements.append(Spacer(1, 0.2*inch))
            
            # Date
            elements.append(Paragraph(f"Generated: {report['date'][:10]}", styles['Normal']))
            elements.append(Spacer(1, 0.3*inch))
            
            # Summary
            summary_text = report.get('summary', '')
            if isinstance(summary_text, dict):
                summary_text = summary_text.get('executive_summary', str(summary_text))
            elements.append(Paragraph("<b>Executive Summary</b>", styles['Heading2']))
            elements.append(Paragraph(str(summary_text), styles['Normal']))
            elements.append(Spacer(1, 0.3*inch))
            
            # Metrics Table
            elements.append(Paragraph("<b>Key Metrics</b>", styles['Heading2']))
            metric_data = [['Metric', 'Value']]
            for metric in report.get('metrics', []):
                metric_data.append([metric.get('label', ''), metric.get('value', '')])
            
            metric_table = Table(metric_data, colWidths=[3*inch, 2*inch])
            metric_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a365d')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                ('TOPPADDING', (0, 0), (-1, 0), 10),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f0f4f8')),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#f0f4f8'), colors.white]),
            ]))
            elements.append(metric_table)
            elements.append(Spacer(1, 0.3*inch))
            
            # ---- Visual Analytics Charts ----
            charts = report.get('charts', [])
            if charts:
                elements.append(Paragraph("<b>Visual Analytics</b>", styles['Heading2']))
                elements.append(Spacer(1, 0.15*inch))
                
                chart_images = self._render_charts_to_images(charts, output_path, report_id)
                for img_path, chart_title in chart_images:
                    try:
                        elements.append(Paragraph(f"<i>{chart_title}</i>", styles['Normal']))
                        elements.append(Spacer(1, 0.1*inch))
                        img = RLImage(img_path, width=5.5*inch, height=3*inch)
                        elements.append(img)
                        elements.append(Spacer(1, 0.25*inch))
                    except Exception as e:
                        logger.warning(f"Error embedding chart image: {str(e)}")
            
            # Observations
            observations = report.get('observations', [])
            if observations:
                elements.append(Paragraph("<b>Observations</b>", styles['Heading2']))
                for obs in observations:
                    obs_text = obs if isinstance(obs, str) else obs.get('observation', str(obs))
                    elements.append(Paragraph(f"\u2022 {obs_text}", styles['Normal']))
                elements.append(Spacer(1, 0.3*inch))
            
            # Recommendations
            recommendations = report.get('recommendations', [])
            if recommendations:
                elements.append(Paragraph("<b>Recommendations</b>", styles['Heading2']))
                for rec in recommendations:
                    rec_text = rec if isinstance(rec, str) else rec.get('recommendation', str(rec))
                    elements.append(Paragraph(f"\u2022 {rec_text}", styles['Normal']))
            
            # Build PDF
            doc.build(elements)
            
            # Clean up temporary chart images
            for img_path, _ in chart_images if charts else []:
                try:
                    Path(img_path).unlink(missing_ok=True)
                except Exception:
                    pass
            
            logger.info(f"PDF report generated: {pdf_path}")
            return str(pdf_path)
        
        except ImportError as e:
            logger.warning(f"Missing dependency for PDF export: {str(e)}")
            raise ValueError("PDF export requires reportlab and matplotlib. Install with: pip install reportlab matplotlib")
        except Exception as e:
            logger.error(f"Error exporting report to PDF: {str(e)}", exc_info=True)
            raise
    
    def _render_charts_to_images(self, charts: List[Dict], output_path: str, report_id: str) -> List[tuple]:
        """
        Render chart data to PNG images using matplotlib for PDF embedding.
        
        Returns:
            List of (image_path, chart_title) tuples
        """
        import matplotlib
        matplotlib.use('Agg')  # Non-interactive backend
        import matplotlib.pyplot as plt
        import matplotlib.colors as mcolors
        
        results = []
        
        for i, chart in enumerate(charts):
            try:
                fig, ax = plt.subplots(figsize=(8, 4.5))
                fig.patch.set_facecolor('#fafbfc')
                ax.set_facecolor('#fafbfc')
                chart_title = chart.get('title', f'Chart {i+1}')
                
                if chart['type'] == 'bar':
                    self._render_bar_chart(ax, chart)
                elif chart['type'] == 'line':
                    self._render_line_chart(ax, chart)
                elif chart['type'] == 'pie':
                    self._render_pie_chart(ax, chart)
                elif chart['type'] == 'heatmap':
                    self._render_heatmap_chart(fig, ax, chart)
                else:
                    plt.close(fig)
                    continue
                
                ax.set_title(chart_title, fontsize=12, fontweight='bold', pad=12, color='#1e293b')
                
                img_path = str(Path(output_path) / f"chart_{report_id}_{i}.png")
                fig.savefig(img_path, dpi=150, bbox_inches='tight', facecolor=fig.get_facecolor())
                plt.close(fig)
                
                results.append((img_path, chart_title))
                
            except Exception as e:
                logger.warning(f"Error rendering chart '{chart.get('title', i)}': {str(e)}")
                try:
                    plt.close(fig)
                except:
                    pass
        
        return results
    
    def _render_bar_chart(self, ax, chart: Dict):
        """Render a bar chart onto a matplotlib axes."""
        data = chart.get('data', [])
        names = [d.get('name', '') for d in data]
        values = [d.get('value', 0) for d in data]
        color = chart.get('color', '#6366f1')
        
        bars = ax.bar(range(len(names)), values, color=color, edgecolor='white', linewidth=0.5)
        ax.set_xticks(range(len(names)))
        ax.set_xticklabels(names, rotation=35, ha='right', fontsize=8)
        ax.set_ylabel(chart.get('yKey', 'Value'), fontsize=9)
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.grid(axis='y', alpha=0.3)
    
    def _render_line_chart(self, ax, chart: Dict):
        """Render a line chart onto a matplotlib axes."""
        data = chart.get('data', [])
        lines = chart.get('lines', [])
        x_key = chart.get('xKey', 'date')
        
        x_vals = [d.get(x_key, '') for d in data]
        
        for line_info in lines:
            key = line_info.get('key', '')
            color = line_info.get('color', '#6366f1')
            y_vals = [d.get(key) for d in data]
            ax.plot(range(len(x_vals)), y_vals, marker='o', markersize=3, color=color, linewidth=1.5, label=key)
        
        # Show subset of x labels to avoid crowding
        step = max(1, len(x_vals) // 10)
        ax.set_xticks(range(0, len(x_vals), step))
        ax.set_xticklabels([x_vals[i] for i in range(0, len(x_vals), step)], rotation=30, ha='right', fontsize=8)
        ax.legend(fontsize=8, framealpha=0.8)
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.grid(alpha=0.3)
    
    def _render_pie_chart(self, ax, chart: Dict):
        """Render a pie/donut chart onto a matplotlib axes."""
        data = chart.get('data', [])
        names = [d.get('name', '') for d in data]
        values = [d.get('value', 0) for d in data]
        chart_colors = [d.get('color', '#6366f1') for d in data]
        
        wedges, texts, autotexts = ax.pie(
            values, labels=None, colors=chart_colors,
            autopct='%1.0f%%', pctdistance=0.78,
            wedgeprops=dict(width=0.45, edgecolor='white', linewidth=1.5),
            textprops={'fontsize': 8}
        )
        # Put names in a legend instead of on the chart
        ax.legend(wedges, names, loc='center left', bbox_to_anchor=(1, 0.5), fontsize=7, framealpha=0.8)
        ax.set_aspect('equal')
    
    def _render_heatmap_chart(self, fig, ax, chart: Dict):
        """Render a correlation heatmap onto a matplotlib axes."""
        columns = chart.get('columns', [])
        data = chart.get('data', [])
        
        # Build matrix
        matrix = []
        for row in data:
            row_vals = []
            for col in columns:
                val = row.get(col)
                row_vals.append(val if val is not None else 0)
            matrix.append(row_vals)
        
        matrix_np = np.array(matrix, dtype=float)
        
        im = ax.imshow(matrix_np, cmap='RdYlGn', vmin=-1, vmax=1, aspect='auto')
        
        # Labels
        short_labels = [c[:12] + '…' if len(c) > 12 else c for c in columns]
        ax.set_xticks(range(len(columns)))
        ax.set_xticklabels(short_labels, rotation=40, ha='right', fontsize=7)
        ax.set_yticks(range(len(columns)))
        ax.set_yticklabels(short_labels, fontsize=7)
        
        # Add correlation values as text
        for r in range(len(columns)):
            for c_idx in range(len(columns)):
                val = matrix_np[r, c_idx]
                text_color = 'white' if abs(val) > 0.6 else 'black'
                ax.text(c_idx, r, f'{val:.2f}', ha='center', va='center', fontsize=6, color=text_color)
        
        fig.colorbar(im, ax=ax, shrink=0.8, label='Correlation')
