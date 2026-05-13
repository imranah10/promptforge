import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { Copy, Zap, Loader2, Database, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { downloadText } from '../utils/helpers';

const DataWizard = () => {
  const { activeModel, apiKey, providerKeys, customModels, showToast, saveToVault } = useContext(AppContext);
  
  const [taskType, setTaskType] = useState('Excel / Google Sheets Formula');
  const [description, setDescription] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleGenerate = async () => {
    if (!description.trim()) { showToast('Please describe your data problem', 'warn'); return; }
    setLoading(true);
    setResult('');
    
    const system = `You are an Elite Principal Data Engineer, Regex Master, and Database Architect. You provide 100% accurate, highly optimized, and production-ready code/formulas.
CRITICAL RULES:
1. ZERO SYNTAX ERRORS: If writing Regex, ensure strict standard compatibility (PCRE/Python/Java). Do not use invalid syntax like '(?i!(...))'.
2. CASE SENSITIVITY: If handling case-insensitivity in Regex with lookaheads, use inline modifiers like '(?i:word)' properly without breaking global case flags.
3. NEGATIVE LOOKAHEADS: Always place Negative Lookaheads at the start of Regex for optimal performance.
4. REGEX TRAPS: Be extremely careful with '\\W' (it excludes underscores). Use '[^\\w\\s]|_' for special characters if underscores are allowed. Avoid using '.' for length matching.
5. DAX & BI TRAPS: NEVER use EARLIER or FILTER on an entire Fact table; use VALUES() or proper dimension filtering. Always use time-intelligence functions (DATEADD, SAMEPERIODLASTYEAR) instead of hardcoding TODAY(). Always use DIVIDE() instead of '/' to handle division-by-zero.
6. PYTHON VISUALIZATION TRAPS: In Matplotlib, NEVER 'double plot' to highlight a bar; pass a list of colors instead. Always combine legends when using twin axes using get_legend_handles_labels(). Differentiate strictly between axhline (horizontal) and axvline (vertical). Use alpha transparency to prevent visual overlap.
7. PANDAS & DATAFRAME TRAPS: When removing outliers on categorical data, ALWAYS compute mean/std per category using groupby, never globally. Use transform('median') instead of slow lambdas for million-row datasets. Always convert strings to datetime before extracting 'Months' for pivot tables, and use fill_value=0 in pivot_table.
8. EXCEL & SHEETS TRAPS: NEVER use manual addition (like '+2') to shift dates when weekends or holidays are involved. Always nest WORKDAY() or WORKDAY.INTL() functions to ensure subsequent dates still validate against the holiday array.
9. EDGE CASES: Mentally verify edge cases (NULLs in SQL, boundaries in Regex, holiday overlaps in Excel) BEFORE outputting.
10. FORMAT: Provide the exact code in a markdown block, followed by a concise, professional breakdown.`;
    
    let userPrompt = `Task Type: ${taskType}\n\nProblem Description: ${description}\n\n`;
    userPrompt += `Analyze this requirement carefully. Validate edge cases (e.g., regex traps, DAX performance, Pandas logic, Excel holiday overlap). Then provide the exact ${taskType} needed.`;

    try {
      const res = await callAI(system, userPrompt, null, activeModel, apiKey, providerKeys, customModels);
      setResult(res);
      saveToVault('Data Wizard', `Type: ${taskType}\nProblem: ${description}`, res);
    } catch (e) {
      setResult('❌ Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    showToast('✓ Copied to clipboard');
  };

  const handleDownload = () => {
    downloadText(result, 'PromptForge_Data_Solution.txt');
    showToast('✓ Download started');
  };

  return (
    <div className="page active">
      <div className="section-header">
        <h2 className="section-title">📊 Data Wizard</h2>
        <div className="section-sub">Instantly generate complex SQL Queries, Excel Formulas, Regex, and Pandas scripts.</div>
      </div>
      
      <div className="tool-card">
        <div className="form-group">
          <label className="form-label">What do you need?</label>
          <select className="form-select" value={taskType} onChange={e => setTaskType(e.target.value)}>
            <option>Excel / Google Sheets Formula</option>
            <option>SQL Query</option>
            <option>Regular Expression (Regex)</option>
            <option>Python (Pandas / NumPy) Script</option>
            <option>Data Visualization Code (Matplotlib/D3)</option>
            <option>DAX Formula (PowerBI)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Describe your problem or data structure</label>
          <textarea 
            className="form-textarea" 
            rows="5" 
            placeholder="e.g. I have a table 'users' and 'orders'. I need a query to find the top 5 users who spent the most money in the last 30 days..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          ></textarea>
        </div>

        <button className="btn-generate" onClick={handleGenerate} disabled={loading}>
          {loading ? <><Loader2 className="animate-spin" /> Analyzing...</> : <><Database /> Generate Solution</>}
        </button>

        {loading && (
          <div className="output-box">
             <div className="loading-shimmer" style={{ width: '90%' }}></div>
             <div className="loading-shimmer" style={{ width: '70%' }}></div>
          </div>
        )}

        {result && !loading && (
          <motion.div 
            className="output-box"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="output-header">
              <span className="output-label">✓ Solution Generated</span>
              <div className="output-actions">
                <button className="btn-copy" onClick={handleDownload}><Download size={14} /> Download</button>
                <button className="btn-copy" onClick={handleCopy}><Copy size={14} /> Copy</button>
              </div>
            </div>
            <div className="output-content" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}><ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown></div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DataWizard;
