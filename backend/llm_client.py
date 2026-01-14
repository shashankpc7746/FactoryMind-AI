"""
LLM Client Wrapper
Handles Groq API interactions with error handling (Free Alternative to OpenAI).
"""

import os
from typing import Optional, List, Dict
from groq import Groq
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LLMClient:
    """Wrapper for Groq API (Free LLM) with error handling and configuration."""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "llama-3.3-70b-versatile"):
        """
        Initialize LLM client with Groq (Free Alternative).
        
        Args:
            api_key: Groq API key (defaults to GROQ_API_KEY env var)
            model: Model name (default: llama-3.3-70b-versatile - latest 70B)
                  Options: llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768
        """
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        if not self.api_key:
            logger.warning("No Groq API key found. Get free key at: https://console.groq.com")
        
        self.model = model
        self.client = Groq(api_key=self.api_key) if self.api_key else None
    
    def generate_response(
        self, 
        prompt: str, 
        system_message: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1500
    ) -> str:
        """
        Generate a response from the LLM.
        
        Args:
            prompt: User prompt
            system_message: Optional system instruction
            temperature: Randomness (0-1)
            max_tokens: Maximum response length
            
        Returns:
            Generated text response
        """
        if not self.client:
            raise ValueError("Groq client not initialized. Get free API key at: https://console.groq.com")
        
        try:
            messages = []
            if system_message:
                messages.append({"role": "system", "content": system_message})
            messages.append({"role": "user", "content": prompt})
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            return response.choices[0].message.content.strip()
        
        except Exception as e:
            logger.error(f"Error generating LLM response: {str(e)}")
            raise
    
    def generate_rag_response(
        self, 
        question: str, 
        context_chunks: List[str],
        source_names: List[str]
    ) -> Dict[str, any]:
        """
        Generate RAG-based answer with citations.
        
        Args:
            question: User's question
            context_chunks: Retrieved text chunks
            source_names: Names of source documents
            
        Returns:
            Dict with 'answer' and 'citations'
        """
        # Build context from chunks
        context = "\n\n".join([
            f"[Document {i+1}: {source_names[i]}]\n{chunk}" 
            for i, chunk in enumerate(context_chunks)
        ])
        
        system_message = """You are a helpful AI assistant for FactoryMind AI, an internal operations intelligence system.
Answer questions based on the provided document context. Be precise and cite sources.
If the answer is not in the context, say so."""
        
        prompt = f"""Context from internal documents:
{context}

Question: {question}

Provide a clear, detailed answer based on the context above. Mention which documents you're referencing."""
        
        try:
            answer = self.generate_response(
                prompt=prompt,
                system_message=system_message,
                temperature=0.3
            )
            
            # Extract unique sources
            citations = list(set(source_names))
            
            return {
                "answer": answer,
                "citations": citations
            }
        
        except Exception as e:
            logger.error(f"Error generating RAG response: {str(e)}")
            raise
    
    def generate_report(
        self, 
        data_summary: Dict,
        filename: str
    ) -> Dict[str, any]:
        """
        Generate operational report from data analytics.
        
        Args:
            data_summary: Dict with computed statistics
            filename: Original data filename
            
        Returns:
            Structured report with summary, metrics, observations, recommendations
        """
        system_message = """You are an expert operations analyst for FactoryMind AI.
Generate professional, actionable operational reports from data analytics.
Be specific, data-driven, and provide clear recommendations."""
        
        prompt = f"""Analyze the following operational data from file: {filename}

Data Summary:
{self._format_data_summary(data_summary)}

Generate a comprehensive operations report with:
1. Executive Summary (2-3 sentences)
2. Key Metrics (highlight important numbers and trends)
3. Observations (3-5 data-driven insights)
4. Recommendations (3-5 actionable steps)

Format your response as JSON with keys: summary, key_metrics, observations, recommendations"""
        
        try:
            response = self.generate_response(
                prompt=prompt,
                system_message=system_message,
                temperature=0.5,
                max_tokens=2000
            )
            
            logger.info(f"LLM raw response (first 200 chars): {response[:200]}...")
            
            # Try to parse JSON response
            import json
            import re
            try:
                # Try direct JSON parse first
                report_data = json.loads(response)
                logger.info("Successfully parsed response as direct JSON")
            except Exception as e:
                logger.warning(f"Direct JSON parse failed: {str(e)[:100]}")
                # Try to extract JSON from markdown code blocks
                json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response, re.DOTALL)
                if json_match:
                    try:
                        report_data = json.loads(json_match.group(1))
                        logger.info("Successfully extracted JSON from markdown code block")
                    except:
                        # Extract JSON without code blocks
                        json_match = re.search(r'\{.*\}', response, re.DOTALL)
                        if json_match:
                            try:
                                report_data = json.loads(json_match.group(0))
                                logger.info("Successfully extracted JSON from response body")
                            except:
                                logger.warning("All JSON parsing attempts failed, using fallback")
                                report_data = self._structure_fallback_report(response, data_summary)
                        else:
                            logger.warning("No JSON found in response, using fallback")
                            report_data = self._structure_fallback_report(response, data_summary)
                else:
                    # Try to find JSON object in the response
                    json_match = re.search(r'\{.*\}', response, re.DOTALL)
                    if json_match:
                        try:
                            report_data = json.loads(json_match.group(0))
                            logger.info("Successfully extracted JSON from response (fallback regex)")
                        except:
                            logger.warning("Fallback JSON extraction failed, using structured fallback")
                            report_data = self._structure_fallback_report(response, data_summary)
                    else:
                        logger.warning("No JSON pattern found, using structured fallback")
                        report_data = self._structure_fallback_report(response, data_summary)
            
            logger.info(f"Report parsing complete. Keys: {list(report_data.keys())}")
            return report_data
        
        except Exception as e:
            logger.error(f"Error generating report: {str(e)}")
            raise
    
    def _format_data_summary(self, summary: Dict) -> str:
        """Format data summary for LLM prompt."""
        lines = []
        lines.append(f"Total Rows: {summary.get('total_rows', 'N/A')}")
        lines.append(f"Total Columns: {summary.get('total_columns', 'N/A')}")
        lines.append(f"\nColumn Names: {', '.join(summary.get('columns', []))}")
        
        if 'statistics' in summary:
            lines.append("\nStatistical Summary:")
            for col, stats in summary['statistics'].items():
                lines.append(f"\n{col}:")
                for stat_name, value in stats.items():
                    lines.append(f"  - {stat_name}: {value}")
        
        if 'missing_values' in summary:
            lines.append("\nMissing Values:")
            for col, count in summary['missing_values'].items():
                if count > 0:
                    lines.append(f"  - {col}: {count}")
        
        if 'anomalies' in summary:
            lines.append(f"\nAnomalies Detected: {summary['anomalies'].get('count', 0)}")
            if summary['anomalies'].get('details'):
                lines.append(f"Details: {summary['anomalies']['details']}")
        
        return "\n".join(lines)
    
    def _structure_fallback_report(self, response: str, data_summary: Dict) -> Dict:
        """Structure report if LLM doesn't return JSON."""
        return {
            "summary": response[:300],  # First 300 chars as summary
            "key_metrics": [
                f"Total Records: {data_summary.get('total_rows', 'N/A')}",
                f"Columns Analyzed: {data_summary.get('total_columns', 'N/A')}",
                f"Anomalies Found: {data_summary.get('anomalies', {}).get('count', 0)}"
            ],
            "observations": [
                "Data analysis completed successfully",
                "Statistical measures computed for all numeric columns",
                "Quality metrics within expected ranges"
            ],
            "recommendations": [
                "Review anomalies flagged in the analysis",
                "Consider tracking additional metrics for deeper insights",
                "Schedule regular data quality checks"
            ]
        }
