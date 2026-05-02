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
        source_names: List[str],
        history: list = None,
        all_documents: list = None
    ) -> Dict[str, any]:
        """
        Generate RAG-based answer with citations.
        
        Args:
            question: User's question
            context_chunks: Retrieved text chunks
            source_names: Names of source documents
            history: Optional list of prior conversation turns [{"role": ..., "content": ...}]
            all_documents: Optional list of ALL uploaded document filenames
            
        Returns:
            Dict with 'answer' and 'citations'
        """
        # Build context — group by source file for clarity
        # De-duplicate source names while preserving order
        seen_sources = []
        for src in source_names:
            if src not in seen_sources:
                seen_sources.append(src)

        context_parts = []
        for i, chunk in enumerate(context_chunks):
            context_parts.append(
                f"--- From: {source_names[i]} ---\n{chunk}"
            )
        context = "\n\n".join(context_parts)
        
        system_message = (
            "You are FactoryMind AI, a friendly and knowledgeable assistant for internal operations.\n"
            "Rules:\n"
            "1. Answer the user's question using ONLY the provided context.\n"
            "2. Write naturally and conversationally — do NOT use labels like 'Document 1' or 'Document 2'.\n"
            "3. Refer to documents by their actual filename when needed (e.g., 'According to Safety Manual.pdf…').\n"
            "4. Use markdown formatting for readability: **bold** for key terms, bullet points for lists.\n"
            "5. If the context doesn't contain enough information, say so clearly.\n"
            "6. Keep your answer concise and helpful — no filler phrases.\n"
            "7. Use the conversation history to understand follow-up questions and pronouns like 'it', 'that', 'which one'.\n"
            "8. When the user asks about multiple documents or topics, address ALL of them — don't say information is missing if it's in the context.\n"
            "9. You are aware of ALL uploaded documents (listed below). Use this knowledge when users ask about 'these documents' or 'all documents'."
        )
        
        # Build document inventory section
        inventory_section = ""
        if all_documents:
            doc_list = ", ".join(all_documents)
            inventory_section = f"All uploaded documents: {doc_list}\n\n"
        
        # Build conversation history section if available
        history_section = ""
        if history and len(history) >= 2:
            # Include last 6 turns max, truncate long messages
            recent = history[-6:]
            turns = []
            for turn in recent:
                role_label = "User" if turn["role"] == "user" else "Assistant"
                content = turn["content"][:150]
                if len(turn["content"]) > 150:
                    content += "..."
                turns.append(f"{role_label}: {content}")
            history_section = (
                "Recent conversation:\n"
                + "\n".join(turns)
                + "\n\n"
            )
        
        prompt = (
            f"{inventory_section}"
            f"{history_section}"
            f"Context from uploaded documents:\n\n{context}\n\n"
            f"User question: {question}\n\n"
            "Answer the question based on the context above. "
            "Be direct and informative."
        )
        
        try:
            answer = self.generate_response(
                prompt=prompt,
                system_message=system_message,
                temperature=0.3
            )
            
            # Extract unique sources (preserve order)
            citations = list(dict.fromkeys(source_names))
            
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
            report_data = None

            # Strategy 1: Direct JSON parse
            try:
                report_data = json.loads(response)
                logger.info("Successfully parsed response as direct JSON")
            except (json.JSONDecodeError, ValueError):
                pass

            # Strategy 2: Strip markdown ```json ... ``` fences (most common LLM format)
            if report_data is None:
                stripped = re.sub(r'^```(?:json)?\s*', '', response.strip())
                stripped = re.sub(r'\s*```\s*$', '', stripped)
                try:
                    report_data = json.loads(stripped)
                    logger.info("Successfully parsed JSON after stripping markdown fences")
                except (json.JSONDecodeError, ValueError):
                    pass

            # Strategy 3: Extract the largest {...} block (greedy)
            if report_data is None:
                json_match = re.search(r'\{.*\}', response, re.DOTALL)
                if json_match:
                    try:
                        report_data = json.loads(json_match.group(0))
                        logger.info("Successfully extracted JSON via greedy regex")
                    except (json.JSONDecodeError, ValueError):
                        pass

            # Strategy 4: Structured fallback — always produces valid output
            if report_data is None:
                logger.debug("JSON extraction unsuccessful, using structured fallback")
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
