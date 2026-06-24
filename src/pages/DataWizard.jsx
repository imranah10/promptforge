import React, { useState, useContext, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { callAI } from '../utils/ai';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ── Lightweight syntax highlighter (no extra deps) ────────────────────────────
const highlightCode = (code, lang) => {
  const escape = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  let html = escape(code);
  const rules = {
    sql:    [[/\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP BY|ORDER BY|HAVING|INSERT|UPDATE|DELETE|CREATE|TABLE|AS|AND|OR|NOT|NULL|INTO|VALUES|WITH|UNION|LIMIT|DISTINCT|CASE|WHEN|THEN|ELSE|END)\b/gi, '#c084fc'], [/--.*$/gm, '#64748b'], [/'[^']*'/g, '#34d399'], [/\b\d+\b/g, '#fb923c']],
    python: [[/\b(def|class|import|from|return|if|elif|else|for|while|try|except|finally|with|as|pass|break|continue|lambda|yield|None|True|False|self)\b/g, '#c084fc'], [/#.*$/gm, '#64748b'], [/(["'])(?:(?!\1).)*\1/g, '#34d399'], [/\b\d+\b/g, '#fb923c']],
    excel:  [[/\b([A-Z]+)\(/g, '#c084fc'], [/"[^"]*"/g, '#34d399'], [/\b[A-Z]+\d+\b/g, '#60a5fa']],
    javascript: [[/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|new)\b/g, '#c084fc'], [/\/\/.*$/gm, '#64748b'], [/(["'`])(?:(?!\1).)*\1/g, '#34d399']],
    default:[[/\b(true|false|null)\b/gi, '#fb923c']],
  };
  const set = rules[lang?.toLowerCase()] || rules.default;
  set.forEach(([re, color]) => { html = html.replace(re, m => `<span style="color:${color}">${m}</span>`); });
  return html;
};

// Safely render any value AI might return (string, number, or accidentally an object)
const safeCell = (v) => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') {
    // AI sometimes wraps a value like {value: 50000} or {amount: 50000, currency: "INR"}
    const vals = Object.values(v);
    if (vals.length === 1) return String(vals[0]);
    return vals.map(x => String(x)).join(' ');
  }
  return String(v);
};

const CodeBlock = ({ className, children }) => {
  const lang = (className || '').replace('language-', '');
  const code = String(children).replace(/\n$/, '');
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(()=>setCopied(false), 1500); };
  return (
    <div style={{ position:'relative', margin:'12px 0', borderRadius:10, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 12px', background:'rgba(255,255,255,0.04)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px' }}>{lang || 'code'}</span>
        <button onClick={copy} style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:6, fontSize:10, fontWeight:700, background: copied?'rgba(74,222,128,0.15)':'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color: copied?'#4ade80':'#94a3b8', cursor:'pointer' }}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{ margin:0, padding:'14px 16px', overflowX:'auto', background:'#0a0a0f', fontSize:12.5, lineHeight:1.6, fontFamily:"'DM Mono',monospace" }}>
        <code dangerouslySetInnerHTML={{ __html: highlightCode(code, lang) }} />
      </pre>
    </div>
  );
};
import {
  Database, FileText, Code, Binary, BarChart3, Workflow,
  Loader2, Download, Copy, RefreshCw, CheckCircle2,
  AlertTriangle, Brain, Sparkles, ChevronDown, ChevronUp,
  Cpu, GitBranch, Layers, Terminal, ArrowRight
} from 'lucide-react';

// ── EVERY TYPE HAS ITS OWN CONFIG ─────────────────────────────────────────────
const TYPES = [
  {
    id: 'SQL Query',
    icon: <Database size={14} />, color: '#38bdf8',
    desc: 'PostgreSQL · MySQL · BigQuery · Snowflake',
    schemaLabel: 'Table Schema',
    schemaPlaceholder: 'users(id INT, name VARCHAR, created_at TIMESTAMP)\norders(id INT, user_id INT, amount DECIMAL, status VARCHAR)',
    sampleLabel: 'Sample Rows (optional)',
    samplePlaceholder: 'id | name  | amount | status\n1  | Alice | 500    | paid\n2  | Bob   | 250    | pending',
    requirementPlaceholder: 'e.g. "Top 10 customers by revenue in Q4 2024, grouped by region, with month-over-month growth %"',
    buildSystem: (opt, explain) => `You are an EXPERT SQL ARCHITECT with 20+ years experience in PostgreSQL, MySQL, BigQuery, and Snowflake.

OPTIMIZATION MODE: ${opt.toUpperCase()}
${opt === 'enterprise'    ? '- Write production SQL with CTEs, proper indexing hints, error handling comments, and full documentation.' : ''}
${opt === 'speed'         ? '- Optimize for raw execution speed. Use indexes, avoid full table scans, minimize joins.' : ''}
${opt === 'readability'   ? '- Write clean, well-commented SQL. Use CTEs instead of subqueries. Every clause on its own line.' : ''}
${opt === 'balanced'      ? '- Balance performance and readability. Use CTEs where helpful, add key comments.' : ''}

YOUR RESPONSE MUST INCLUDE:
1. PRIMARY SQL — production-ready query in a \`\`\`sql code block
   - Use proper JOINs (never cartesian)
   - Parameterized where applicable
   - Include comments explaining complex parts
   - Add INDEX HINT comments where beneficial
2. ${explain ? 'LINE-BY-LINE EXPLANATION of every clause and why it was written that way.' : 'Performance notes: execution plan hints, which indexes to create, estimated complexity.'}
3. === VARIANT 2 === then an ALTERNATIVE approach (e.g. window function vs GROUP BY, CTE vs subquery, different dialect)
4. JSON audit at the end:
\`\`\`json
{"complexity":"O(n log n)","security":"Parameterized, no SQL injection risk","scalability":"Handles 10M+ rows with proper indexing","performance":"Uses index seek, avoids full scan","efficiency":95,"warnings":["Add composite index on (user_id, created_at)"],"optimizations":["Use EXPLAIN ANALYZE to profile","Consider materialized view for repeated aggregations"]}
\`\`\``,
  },
  {
    id: 'Excel / Google Sheets Formula',
    icon: <FileText size={14} />, color: '#34d399',
    desc: 'XLOOKUP · Array · Pivot · Conditional',
    schemaLabel: 'Sheet / Column Structure',
    schemaPlaceholder: 'Sheet: Sales\nCol A: Date, Col B: Revenue, Col C: Region, Col D: Product, Col E: Qty',
    sampleLabel: 'Sample Data Rows',
    samplePlaceholder: 'A2: 2024-01-15, B2: 5000, C2: North, D2: Widget A, E2: 10\nA3: 2024-01-16, B3: 3200, C3: South, D3: Widget B, E3: 5',
    requirementPlaceholder: 'e.g. "Running total of revenue only for North region where amount > 1000, reset each month"',
    buildSystem: (opt, explain) => `You are an EXPERT SPREADSHEET ENGINEER specializing in Excel and Google Sheets formulas.

OPTIMIZATION MODE: ${opt.toUpperCase()}
${opt === 'enterprise'    ? '- Write robust formulas with IFERROR wrappers, named ranges, and full compatibility notes.' : ''}
${opt === 'speed'         ? '- Prefer non-volatile functions. Avoid INDIRECT/OFFSET where possible. Use structured references.' : ''}
${opt === 'readability'   ? '- Break complex formulas into helper columns. Add cell comments explaining each part.' : ''}
${opt === 'balanced'      ? '- Use modern functions (XLOOKUP, LET, BYROW) with fallback for older Excel versions.' : ''}

YOUR RESPONSE MUST INCLUDE:
1. PRIMARY FORMULA — in a \`\`\`excel code block
   - Specify: Excel 365 / Excel 2019 / Google Sheets compatibility
   - Show exactly which cell to put it in (e.g. "Enter in F2, drag down")
   - Use LET() to name intermediate calculations for clarity
2. ${explain ? 'STEP-BY-STEP breakdown of every function nested inside the formula and what it returns.' : 'Notes on volatility, recalculation performance, and array spill behavior.'}
3. === VARIANT 2 === then an ALTERNATIVE formula (e.g. SUMIFS vs XLOOKUP approach, array formula vs helper column)
4. JSON audit:
\`\`\`json
{"complexity":"Non-volatile, O(n)","security":"No external references","scalability":"Works up to 1M rows","performance":"Avoid in large ranges without structured tables","efficiency":92,"warnings":["INDIRECT is volatile — avoid in large sheets"],"optimizations":["Convert range to Table for structured references","Use XLOOKUP instead of VLOOKUP for 2x speed"]}
\`\`\``,
  },
  {
    id: 'Python (Pandas / NumPy)',
    icon: <Binary size={14} />, color: '#f472b6',
    desc: 'DataFrames · ETL · ML pipelines',
    schemaLabel: 'DataFrame / CSV Structure',
    schemaPlaceholder: 'Columns: customer_id(int), order_date(datetime), product(str), quantity(int), price(float), region(str)',
    sampleLabel: 'Sample CSV / Data Preview',
    samplePlaceholder: 'customer_id,order_date,product,quantity,price,region\n1001,2024-01-15,Widget A,3,299.99,North\n1002,2024-01-16,Widget B,1,149.00,South',
    requirementPlaceholder: 'e.g. "Read CSV, remove duplicates, fill missing values with column mean, group by region, export cleaned data"',
    buildSystem: (opt, explain) => `You are an EXPERT PYTHON DATA ENGINEER specializing in Pandas, NumPy, and ETL pipelines.

OPTIMIZATION MODE: ${opt.toUpperCase()}
${opt === 'enterprise'    ? '- Write production Python: type hints, docstrings, logging, try/except with specific exceptions, argparse for CLI args.' : ''}
${opt === 'speed'         ? '- Vectorize everything. Use .values over iterrows. Prefer numpy operations. Use categorical dtypes. Add chunking for large files.' : ''}
${opt === 'readability'   ? '- Use method chaining with line breaks. Add comments above every logical block. Use descriptive variable names.' : ''}
${opt === 'balanced'      ? '- Clean, Pythonic code with type hints on functions and inline comments for non-obvious operations.' : ''}

YOUR RESPONSE MUST INCLUDE:
1. PRIMARY SCRIPT — in a \`\`\`python code block
   - Import statements at top
   - Function-based structure (not just a script)
   - Handle FileNotFoundError, encoding issues
   - Print progress/summary at end
2. ${explain ? 'LINE-BY-LINE EXPLANATION: what each pandas method does, what it returns, and why that approach was chosen.' : 'Performance notes: memory usage, time complexity, when to use chunking, dtype optimizations.'}
3. === VARIANT 2 === then ALTERNATIVE approach (e.g. Polars instead of Pandas, SQL-style with pandasql, or numpy-only approach)
4. JSON audit:
\`\`\`json
{"complexity":"O(n log n) for sort operations","security":"No eval/exec, no shell injection","scalability":"Add chunksize=10000 for files >1GB","performance":"Use categorical for low-cardinality string columns","efficiency":94,"warnings":["iterrows() is 100x slower than vectorized ops"],"optimizations":["Use pd.read_csv(dtype={}) to save memory","Consider Polars for 10x+ speedup on large datasets"]}
\`\`\``,
  },
  {
    id: 'Regular Expression',
    icon: <Code size={14} />, color: '#fbbf24',
    desc: 'Pattern matching · Validation · Extraction',
    schemaLabel: 'Language & Use Case',
    schemaPlaceholder: 'Language: JavaScript / Python / Java / PHP / Go\nUse case: validation / extraction / replacement / splitting',
    sampleLabel: 'Sample Text to Match Against',
    samplePlaceholder: 'Paste real example text here:\n"Call us at +91-9876543210 or email support@company.com — visit https://example.com"',
    requirementPlaceholder: 'e.g. "Extract all Indian mobile numbers (10 digits, starting with 6-9) — ignore numbers with country code"',
    buildSystem: (opt, explain) => `You are an EXPERT REGEX ENGINEER with deep knowledge of regex engines across all languages.

OPTIMIZATION MODE: ${opt.toUpperCase()}
${opt === 'enterprise'    ? '- Write named capture groups, add comments using verbose mode (?x), handle edge cases and Unicode.' : ''}
${opt === 'speed'         ? '- Optimize for performance: avoid catastrophic backtracking, use possessive quantifiers or atomic groups where supported.' : ''}
${opt === 'readability'   ? '- Use verbose mode with inline comments. Break into named groups. Explain each part.' : ''}
${opt === 'balanced'      ? '- Clean regex with named groups where helpful, and brief inline comments.' : ''}

YOUR RESPONSE MUST INCLUDE:
1. PRIMARY REGEX — in a code block with language-specific usage example (not just the pattern)
   - Show: pattern definition, flags used, and complete code to use it (match/extract/replace)
   - Test against the sample text provided
   - Show what each captured group returns
2. ${explain ? 'CHARACTER-BY-CHARACTER breakdown: explain every token, quantifier, anchor, and group.' : 'Edge cases it handles, what it intentionally rejects, and known limitations.'}
3. === VARIANT 2 === then ALTERNATIVE pattern (e.g. more strict vs more permissive, different approach to same problem)
4. JSON audit:
\`\`\`json
{"complexity":"Linear O(n)","security":"No ReDoS vulnerability","scalability":"Safe for large text inputs","performance":"No catastrophic backtracking","efficiency":96,"warnings":["Test with Unicode input if international data expected"],"optimizations":["Compile pattern once outside loops","Use re.finditer() instead of re.findall() for memory efficiency"]}
\`\`\``,
  },
  {
    id: 'Data Visualization (Matplotlib/Plotly)',
    icon: <BarChart3 size={14} />, color: '#a78bfa',
    desc: 'Charts · Dashboards · Interactive viz',
    schemaLabel: 'Data Structure for Chart',
    schemaPlaceholder: 'DataFrame columns: month(str), revenue(float), customers(int), region(str)\nChart type preference: line / bar / scatter / heatmap / dashboard',
    sampleLabel: 'Sample Data (CSV format)',
    samplePlaceholder: 'month,revenue,customers,region\nJan,45000,120,North\nFeb,52000,145,North\nMar,38000,98,South',
    requirementPlaceholder: 'e.g. "Multi-line chart: revenue per region over 12 months, with peak month annotated, dark theme"',
    buildSystem: (opt, explain) => `You are an EXPERT DATA VISUALIZATION ENGINEER specializing in Matplotlib, Seaborn, and Plotly.

OPTIMIZATION MODE: ${opt.toUpperCase()}
${opt === 'enterprise'    ? '- Write reusable chart functions with full parameters, savefig with 300 DPI, proper figure sizing for reports.' : ''}
${opt === 'speed'         ? '- Use Plotly Express (fastest to code). Minimize render time. Use WebGL for scatter plots with 10k+ points.' : ''}
${opt === 'readability'   ? '- Use Seaborn for statistical plots. Add descriptive titles, axis labels, legend, and data source annotation.' : ''}
${opt === 'balanced'      ? '- Plotly for interactive, Matplotlib for static. Clean styling with proper colors and annotations.' : ''}

YOUR RESPONSE MUST INCLUDE:
1. PRIMARY VISUALIZATION CODE — in a \`\`\`python code block
   - Complete runnable code including sample data creation
   - Proper labels, title, legend, color scheme
   - Show how to save as PNG/HTML
2. ${explain ? 'LINE-BY-LINE: explain every plotting call, what parameter does what, and why each design choice was made.' : 'Design notes: color choices, chart type rationale, accessibility considerations.'}
3. === VARIANT 2 === then ALTERNATIVE (e.g. Plotly interactive vs Matplotlib static, different chart type for same data)
4. JSON audit:
\`\`\`json
{"complexity":"O(n) render time","security":"No external data calls","scalability":"Use WebGL renderer for 100k+ points","performance":"Avoid re-rendering on every data point","efficiency":91,"warnings":["plt.show() blocks execution in scripts — use savefig instead"],"optimizations":["Use fig.update_layout(template='plotly_dark') for dark theme","Use px.line() over go.Figure() for 3x less code"]}
\`\`\``,
  },
  {
    id: 'DAX / Power BI',
    icon: <Workflow size={14} />, color: '#fb923c',
    desc: 'Measures · KPIs · Time intelligence',
    schemaLabel: 'Power BI Table Structure',
    schemaPlaceholder: 'Tables:\n- Sales(Date, Amount, ProductID, CustomerID)\n- Products(ID, Name, Category, Cost)\n- Calendar(Date, Month, Quarter, Year)\n- Customers(ID, Name, Region)',
    sampleLabel: 'Sample Data / Relationships',
    samplePlaceholder: 'Sales[Date] -> Calendar[Date] (many-to-one)\nSales[ProductID] -> Products[ID] (many-to-one)\nTarget: Monthly revenue KPI with YoY comparison',
    requirementPlaceholder: 'e.g. "Year-over-year revenue growth % with month-to-date running total and same period last year comparison"',
    buildSystem: (opt, explain) => `You are an EXPERT DAX DEVELOPER and Power BI architect with deep knowledge of time intelligence and data modeling.

OPTIMIZATION MODE: ${opt.toUpperCase()}
${opt === 'enterprise'    ? '- Write measures with CALCULATE pattern, proper filter context, VAR for readability, and full comments.' : ''}
${opt === 'speed'         ? '- Optimize for VertiPaq engine: avoid row context iteration, use SUMX only when necessary, prefer column operations.' : ''}
${opt === 'readability'   ? '- Use VAR/RETURN pattern for all measures. Name intermediate variables descriptively. Add comments.' : ''}
${opt === 'balanced'      ? '- Clean DAX with VAR/RETURN, key comments, and proper CALCULATE filter patterns.' : ''}

YOUR RESPONSE MUST INCLUDE:
1. PRIMARY DAX MEASURE — in a \`\`\`dax code block
   - Use VAR/RETURN pattern
   - Correct CALCULATE with explicit filter context
   - Time intelligence functions (DATEADD, SAMEPERIODLASTYEAR etc.) where needed
   - Formatting as [Measure Name] := formula
2. ${explain ? 'CLAUSE-BY-CLAUSE explanation: filter context vs row context, what each CALCULATE argument does, evaluation order.' : 'Performance notes: VertiPaq storage, when to use SUMX vs SUM, DirectQuery considerations.'}
3. === VARIANT 2 === then ALTERNATIVE approach (e.g. different time intelligence function, implicit vs explicit measures)
4. JSON audit:
\`\`\`json
{"complexity":"Filter context evaluation","security":"No dynamic SQL, safe for RLS","scalability":"VertiPaq optimized for 100M+ rows","performance":"Avoid nested CALCULATE for better engine optimization","efficiency":93,"warnings":["EARLIER() is deprecated — use VAR instead","Avoid bi-directional relationships — they cause filter ambiguity"],"optimizations":["Use DIVIDE() instead of / to handle divide-by-zero","Add USERELATIONSHIP for inactive relationships"]}
\`\`\``,
  },
  {
    id: 'R Script (dplyr/ggplot2)',
    icon: <GitBranch size={14} />, color: '#e879f9',
    desc: 'Statistical analysis · ggplot viz',
    schemaLabel: 'Data Frame Structure',
    schemaPlaceholder: 'Columns: id(int), group(factor), value(numeric), date(Date), category(chr), region(chr)',
    sampleLabel: 'Sample CSV Data',
    samplePlaceholder: 'id,group,value,date,category\n1,A,23.5,2024-01-01,Type1\n2,B,45.2,2024-01-02,Type2\n3,A,31.8,2024-01-03,Type1',
    requirementPlaceholder: 'e.g. "Box plot comparing value distributions across groups with ANOVA significance test and ggplot2 dark theme"',
    buildSystem: (opt, explain) => `You are an EXPERT R PROGRAMMER specializing in tidyverse, dplyr, ggplot2, and statistical analysis.

OPTIMIZATION MODE: ${opt.toUpperCase()}
${opt === 'enterprise'    ? '- Write functions with roxygen2 documentation, tryCatch error handling, and proper package imports with library().' : ''}
${opt === 'speed'         ? '- Use data.table instead of dplyr for large datasets. Vectorize with apply family. Avoid loops.' : ''}
${opt === 'readability'   ? '- Use pipe operator |> for chaining. Descriptive variable names. Comment every dplyr verb.' : ''}
${opt === 'balanced'      ? '- Tidyverse style with pipes, clean ggplot2 with theme_minimal(), key comments on statistical choices.' : ''}

YOUR RESPONSE MUST INCLUDE:
1. PRIMARY R SCRIPT — in a \`\`\`r code block
   - library() calls at top
   - Data loading and validation
   - Analysis pipeline with pipes
   - ggplot2 visualization with proper labels/theme
2. ${explain ? 'LINE-BY-LINE: explain each dplyr verb, what it does to the data frame, and the statistical rationale.' : 'Statistical notes: assumptions of the test used, when results are valid, how to interpret output.'}
3. === VARIANT 2 === then ALTERNATIVE (e.g. data.table vs dplyr, base R vs tidyverse, different statistical test)
4. JSON audit:
\`\`\`json
{"complexity":"O(n log n) for sort/group operations","security":"No system() calls, no eval()","scalability":"Use data.table for datasets > 1M rows","performance":"Vectorized operations, no for loops","efficiency":90,"warnings":["Avoid attach() — use explicit df$ references","factor levels must be set correctly before modeling"],"optimizations":["Use fread() from data.table instead of read.csv for 10x speed","Consider parallel processing with future_map() for large datasets"]}
\`\`\``,
  },
  {
    id: 'Shell / AWK / Sed Pipeline',
    icon: <Terminal size={14} />, color: '#34d399',
    desc: 'Unix pipelines · Log processing · ETL',
    schemaLabel: 'File Format & Location',
    schemaPlaceholder: 'File: /var/log/nginx/access.log\nFormat: Apache Combined Log Format\nOS: Ubuntu 22.04 / macOS / Alpine',
    sampleLabel: 'Sample Log / File Lines',
    samplePlaceholder: '192.168.1.1 - - [15/Jan/2024:10:22:33 +0000] "GET /api/users HTTP/1.1" 200 1234\n192.168.1.2 - - [15/Jan/2024:10:22:34 +0000] "POST /api/login HTTP/1.1" 500 567',
    requirementPlaceholder: 'e.g. "Extract all HTTP 500 errors, count by hour, sort descending, output as CSV"',
    buildSystem: (opt, explain) => `You are an EXPERT UNIX/LINUX SHELL ENGINEER specializing in bash, AWK, sed, and log processing pipelines.

OPTIMIZATION MODE: ${opt.toUpperCase()}
${opt === 'enterprise'    ? '- Write with set -euo pipefail, error handling, usage() function, and logging to stderr.' : ''}
${opt === 'speed'         ? '- Use mawk instead of gawk for speed. Minimize subprocess calls. Use built-in shell ops over external commands.' : ''}
${opt === 'readability'   ? '- Add comments above every pipe stage. Use multi-line pipes with \\ continuation. Name awk variables.' : ''}
${opt === 'balanced'      ? '- Clean pipeline with comments on non-obvious parts. POSIX-compatible where possible.' : ''}

YOUR RESPONSE MUST INCLUDE:
1. PRIMARY PIPELINE — in a \`\`\`bash code block
   - One-liner pipeline AND a script version
   - Comments explaining each pipe stage
   - Handle edge cases (empty file, no matches)
   - Show sample output
2. ${explain ? 'STAGE-BY-STAGE breakdown: what each command does, what its input/output is, and which flags mean what.' : 'Portability notes: which parts are GNU-specific vs POSIX, macOS compatibility notes.'}
3. === VARIANT 2 === then ALTERNATIVE (e.g. pure AWK vs sed+grep pipeline, Python one-liner alternative)
4. JSON audit:
\`\`\`json
{"complexity":"O(n) single pass","security":"Quote all variables, avoid eval, use -- for filenames","scalability":"Process multi-GB logs with streaming (no load into memory)","performance":"Single-pass AWK beats grep|awk pipeline","efficiency":97,"warnings":["Always quote $variables to prevent word splitting","Use [[ ]] instead of [ ] in bash for safer conditionals"],"optimizations":["Use awk instead of grep|cut|sed chain for 5x speed","Add LC_ALL=C for 2x faster text processing"]}
\`\`\``,
  },
  {
    id: 'JSON / GraphQL Query',
    icon: <Layers size={14} />, color: '#38bdf8',
    desc: 'API queries · Transformations · Schema',
    schemaLabel: 'GraphQL Schema / API Structure',
    schemaPlaceholder: 'type User {\n  id: ID!\n  name: String!\n  email: String!\n  orders: [Order!]!\n}\ntype Order {\n  id: ID!\n  total: Float!\n  status: String!\n  createdAt: String!\n}',
    sampleLabel: 'Sample JSON Response / Variables',
    samplePlaceholder: '{\n  "users": [\n    {\n      "id": "1",\n      "name": "Alice",\n      "orders": [{"id": "101", "total": 500, "status": "paid"}]\n    }\n  ]\n}',
    requirementPlaceholder: 'e.g. "Query users with their last 5 orders, filter by active status, include pagination, use fragments"',
    buildSystem: (opt, explain) => `You are an EXPERT GRAPHQL ARCHITECT and JSON transformation engineer.

OPTIMIZATION MODE: ${opt.toUpperCase()}
${opt === 'enterprise'    ? '- Write queries with fragments for reuse, proper error handling, pagination with cursor-based approach, and persisted query format.' : ''}
${opt === 'speed'         ? '- Minimize fields requested (no over-fetching). Use DataLoader pattern hints. Avoid N+1 query patterns.' : ''}
${opt === 'readability'   ? '- Use named queries/mutations. Add inline comments. Use fragments for repeated field sets.' : ''}
${opt === 'balanced'      ? '- Named query with fragments, proper variables, and pagination.' : ''}

YOUR RESPONSE MUST INCLUDE:
1. PRIMARY QUERY — in a \`\`\`graphql code block
   - Named query/mutation
   - Variables as separate \`\`\`json block
   - Fragments for repeated fields
   - Show how to execute (fetch/Apollo/urql example)
2. ${explain ? 'FIELD-BY-FIELD: explain resolver behavior, what each selection set returns, and N+1 risks.' : 'Performance notes: which fields are expensive resolvers, caching strategy, subscription vs polling.'}
3. === VARIANT 2 === then ALTERNATIVE (e.g. REST endpoint equivalent, jq transformation for JSON, different pagination approach)
4. JSON audit:
\`\`\`json
{"complexity":"Depends on resolver depth","security":"Use persisted queries in production, validate depth/complexity","scalability":"Add query complexity limits to prevent DoS","performance":"Use DataLoader to batch N+1 queries","efficiency":89,"warnings":["Deep nested queries can cause N+1 — check resolver implementation","Avoid requesting __typename unless needed"],"optimizations":["Use @defer for non-critical fields","Add @skip/@include directives for conditional fields"]}
\`\`\``,
  },
  {
    id: 'MongoDB / NoSQL Query',
    icon: <Brain size={14} />, color: '#f87171',
    desc: 'Aggregation pipelines · Atlas Search',
    schemaLabel: 'Collection Structure',
    schemaPlaceholder: 'Collection: orders\nFields: _id(ObjectId), customer_id(str), items(array of {product, qty, price}), total(number), status(str), region(str), created_at(Date)',
    sampleLabel: 'Sample Document',
    samplePlaceholder: '{\n  "_id": "64abc123",\n  "customer_id": "user_001",\n  "items": [\n    {"product": "Widget A", "qty": 2, "price": 299}\n  ],\n  "total": 598,\n  "status": "delivered",\n  "region": "North",\n  "created_at": ISODate("2024-01-15")\n}',
    requirementPlaceholder: 'e.g. "Aggregation pipeline: top 10 customers by total spend in last 90 days, grouped by region, with order count"',
    buildSystem: (opt, explain) => `You are an EXPERT MONGODB ARCHITECT specializing in aggregation pipelines, indexing, and Atlas Search.

OPTIMIZATION MODE: ${opt.toUpperCase()}
${opt === 'enterprise'    ? '- Write with proper index hints, explain plan comments, session/transaction wrapper, and Mongoose schema if applicable.' : ''}
${opt === 'speed'         ? '- Put $match and $limit as early as possible. Use covered queries. Avoid $lookup on unindexed fields.' : ''}
${opt === 'readability'   ? '- Break pipeline into stages with comments. Use $set with descriptive names. Avoid cryptic $expr.' : ''}
${opt === 'balanced'      ? '- Clean pipeline with stage comments, proper index usage, and $project to limit data transfer.' : ''}

YOUR RESPONSE MUST INCLUDE:
1. PRIMARY QUERY — in a \`\`\`javascript code block
   - Complete db.collection.aggregate([...]) or find() call
   - Indexes to create as db.collection.createIndex({...})
   - Comments on each pipeline stage
   - Show both shell syntax and Node.js/Mongoose version
2. ${explain ? 'STAGE-BY-STAGE: explain what each aggregation operator does, what documents look like before/after each stage.' : 'Index strategy: which fields to index, compound index order (ESR rule), partial index opportunities.'}
3. === VARIANT 2 === then ALTERNATIVE (e.g. $facet for multiple aggregations, Atlas Search instead of $match, different grouping approach)
4. JSON audit:
\`\`\`json
{"complexity":"O(n) with proper indexes","security":"Use $match with validated input, never interpolate user strings","scalability":"Add allowDiskUse:true for large aggregations","performance":"$match+$limit early reduces documents through pipeline","efficiency":92,"warnings":["$lookup without index on foreign field causes collection scan","$unwind on large arrays can cause memory issues"],"optimizations":["Create compound index following ESR rule (Equality, Sort, Range)","Use $merge instead of application-side upsert for bulk writes"]}
\`\`\``,
  },
];

const OPT_MODES = [
  { id: 'speed',       label: '⚡ Speed',      desc: 'Fastest execution' },
  { id: 'balanced',    label: '⚖️ Balanced',   desc: 'Speed + readability' },
  { id: 'readability', label: '📖 Readable',   desc: 'Max clarity' },
  { id: 'enterprise',  label: '🏢 Enterprise', desc: 'Production-grade' },
];

const PIPE_LABELS = [
  'Parsing intent & schema',
  'Generating primary artifact',
  'Generating optimized variant',
  'Security & efficiency audit',
  'Final verification',
];

export default function DataWizard() {
  const { activeModel, apiKey, providerKeys, customModels, showToast, saveToVault } = useContext(AppContext);

  const [query,       setQuery]       = useState('');
  const [schema,      setSchema]      = useState('');
  const [sampleData,  setSampleData]  = useState('');
  const [type,        setType]        = useState('SQL Query');
  const [optMode,     setOptMode]     = useState('balanced');
  const [explainMode, setExplainMode] = useState(false);
  const [reverseMode, setReverseMode] = useState(false);
  const [existingCode, setExistingCode] = useState('');
  const [showAdv,     setShowAdv]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [pipeSteps,   setPipeSteps]   = useState([]);
  const [variants,    setVariants]    = useState([]);
  const [activeVar,   setActiveVar]   = useState(0);
  const [audit,       setAudit]       = useState(null);
  const [history,     setHistory]     = useState([]);
  const [showHist,    setShowHist]    = useState(false);
  const [gridData,    setGridData]    = useState(null);   // {headers:[], rows:[[]]}
  const [gridResults,  setGridResults] = useState(null);   // computed output cells
  const [gridLoading,  setGridLoading] = useState(false);
  const [showGrid,     setShowGrid]    = useState(false);
  const cancelRef = useRef(false);

  const currentType = TYPES.find(t => t.id === type) || TYPES[0];

  const setStep = (i, status) =>
    setPipeSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status } : s));

  // GENERATE LIVE GRID: AI builds a small sample table + applies the formula
  // to each row, so the user sees real computed results, not just formula text.
  const generateLiveGrid = async (formulaCode) => {
    setGridLoading(true);
    try {
      const gridSystem = "You output ONLY valid JSON, nothing else. No markdown fences, no explanation text.";
      const gridPrompt =
        "Given this " + type + ":\n" + formulaCode.slice(0, 2000) + "\n\n" +
        (schema.trim() ? "Schema/columns: " + schema + "\n\n" : "") +
        (sampleData.trim() ? "Sample data given: " + sampleData.slice(0, 500) + "\n\n" : "") +
        "Create a SMALL realistic sample table (5-8 rows) that this formula/query would run against, " +
        "then compute what the RESULT would be for each row (or the aggregate result if it's an aggregate query). " +
        "Output ONLY this JSON structure:\n" +
        "{\n" +
        '  "headers": ["col1","col2","col3"],\n' +
        '  "rows": [["val1","val2","val3"], ["val1b","val2b","val3b"]],\n' +
        '  "resultColumn": "Result",\n' +
        '  "results": ["computed1","computed2"]\n' +
        "}\n" +
        "Rules: headers/rows = the INPUT sample data (realistic values matching the schema/context). " +
        "results = what this formula/query produces for each corresponding row, OR if it is a single aggregate " +
        "value (like SUM/COUNT), put just ONE value in the results array and it will be shown as a total. " +
        "Keep it small and readable — 5-8 rows max, 3-5 columns max. " +
        "CRITICAL: every value in headers, rows, and results must be a plain string or number — " +
        "NEVER an object or nested structure. If a value has a unit (like currency), include it directly " +
        "in the string, e.g. \"50000\" not {\"amount\":50000,\"currency\":\"INR\"}.";

      const gridRes = await callAI(gridSystem, gridPrompt, null, activeModel, apiKey, providerKeys, customModels);
      const jsonMatch = gridRes.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.headers?.length && parsed.rows?.length) {
          setGridData({ headers: parsed.headers, rows: parsed.rows });
          setGridResults({ column: parsed.resultColumn || 'Result', values: parsed.results || [] });
          setShowGrid(true);
        }
      }
    } catch (e) {
      console.error('Live grid generation failed', e);
      setGridData(null);
      setGridResults(null);
      // Non-critical — formula text result is unaffected
    } finally {
      setGridLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (reverseMode && !existingCode.trim()) { showToast('Paste the code/formula to explain', 'error'); return; }
    if (!reverseMode && !query.trim()) { showToast('Enter a requirement first', 'error'); return; }
    cancelRef.current = false;
    setLoading(true);
    setVariants([]);
    setAudit(null);
    setGridData(null);
    setGridResults(null);
    setPipeSteps(PIPE_LABELS.map(label => ({ label, status: 'pending' })));

    try {
      setStep(0, 'running'); await new Promise(r => setTimeout(r, 250)); setStep(0, 'done');
      setStep(1, 'running');

      let system, user;
      if (reverseMode) {
        // ── EXPLAIN MODE: user pastes existing code, AI explains it ──
        system = `You are an expert ${currentType.id} reviewer and teacher. The user will paste existing code/formula. Your job:
1. Explain EXACTLY what it does, line by line or part by part
2. Identify any bugs, inefficiencies, or risks
3. Suggest an improved version if relevant
4. Rate complexity, security, and performance

Format your response with a \`\`\`${currentType.id.includes('SQL') ? 'sql' : currentType.id.includes('Python') ? 'python' : currentType.id.includes('Excel') ? 'excel' : 'text'} code block showing the original code annotated with comments, followed by a clear explanation section, then === VARIANT 2 === with an improved version if applicable, then a JSON audit block:
\`\`\`json
{"complexity":"...","security":"...","scalability":"...","performance":"...","efficiency":85,"warnings":["..."],"optimizations":["..."]}
\`\`\``;
        user = `EXPLAIN THIS ${currentType.id}:\n\n${existingCode}${schema.trim() ? '\n\nCONTEXT/SCHEMA:\n' + schema : ''}`;
      } else {
        // ── GENERATE MODE: build from requirement ──
        system = currentType.buildSystem(optMode, explainMode);
        const schemaCtx = schema.trim()     ? `\n\nSCHEMA / STRUCTURE:\n${schema}`   : '';
        const sampleCtx = sampleData.trim() ? `\n\nSAMPLE DATA:\n${sampleData}`      : '';
        user = `REQUIREMENT: ${query}${schemaCtx}${sampleCtx}`;
      }

      const res = await callAI(system, user, null, activeModel, apiKey, providerKeys, customModels);
      if (cancelRef.current) return;
      setStep(1, 'done');

      setStep(2, 'running');
      const parts     = res.split(/===\s*VARIANT\s*2\s*===/i);
      const primary   = parts[0].trim();
      const variant2  = parts[1] ? parts[1].trim() : null;

      const cleanPrimary  = primary.replace(/```json[\s\S]*?```/g, '').trim();
      const cleanVariant2 = variant2 ? variant2.replace(/```json[\s\S]*?```/g, '').trim() : null;

      const parsedVariants = [{ content: cleanPrimary, label: optMode }];
      if (cleanVariant2) parsedVariants.push({ content: cleanVariant2, label: 'Alternative' });
      setVariants(parsedVariants);
      setActiveVar(0);
      setStep(2, 'done');

      setStep(3, 'running');
      const auditMatch = res.match(/```json\s*([\s\S]*?)```/);
      if (auditMatch) { try { setAudit(JSON.parse(auditMatch[1])); } catch (_) {} }
      setStep(3, 'done');

      setStep(4, 'running');
      await new Promise(r => setTimeout(r, 200));
      setStep(4, 'done');
 
      setHistory(prev => [{ id: Date.now(), type, query: query.slice(0, 60), content: cleanPrimary, audit, fullQuery: query }, ...prev].slice(0, 20));
      saveToVault?.('DataWizard', query, cleanPrimary);
      showToast('Artifact synthesized!');

      // LIVE GRID: only for tabular formula types, and only in generate mode
      const gridEligible = ['SQL Query', 'Excel / Google Sheets Formula', 'Python / Pandas Script'].includes(type);
      if (gridEligible && !reverseMode) {
        generateLiveGrid(cleanPrimary);
      } else {
        setGridData(null);
        setGridResults(null);
      }
    } catch (e) {
      setPipeSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'error' } : s));
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const activeContent = variants[activeVar]?.content || '';

  const handleDownload = () => {
    const extMap = { 'SQL Query':'sql','Python (Pandas / NumPy)':'py','R Script (dplyr/ggplot2)':'r','Shell / AWK / Sed Pipeline':'sh','JSON / GraphQL Query':'graphql','MongoDB / NoSQL Query':'js','Regular Expression':'txt','DAX / Power BI':'dax','Excel / Google Sheets Formula':'txt','Data Visualization (Matplotlib/Plotly)':'py' };
    const ext = extMap[type] || 'txt';
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([activeContent], { type: 'text/plain' })), download: `promptforge_${type.split(' ')[0].toLowerCase()}.${ext}` });
    a.click(); URL.revokeObjectURL(a.href);
    showToast('Downloaded!');
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'var(--bg)', padding:'40px', boxSizing:'border-box' }}>

      {/* ── HEADER ── */}
      <div style={{ borderLeft:'4px solid var(--accent)', paddingLeft:'20px', marginBottom:'40px' }}>
        <div style={{ fontSize:'10px', fontWeight:900, color:'var(--accent)', letterSpacing:'4px', display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
          <Cpu size={11}/> APEX DATA ARCHITECT v3.0
        </div>
        <h2 style={{ fontSize:'38px', fontWeight:900, color:'var(--text)', letterSpacing:'-2px', margin:0 }}>
          Data <span style={{ color:'var(--accent)' }}>Wizard</span>
        </h2>
        <p style={{ color:'var(--text3)', fontSize:'14px', marginTop:'6px' }}>
          Production-grade data artifacts · Multi-variant output · Security audit trail
        </p>
      </div>

      <div className="dw-main-grid">

        {/* ── LEFT ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

          {/* Type grid */}
          <div>
            <div style={sLabel}>SELECT ARTIFACT TYPE</div>
            <div style={{ display:'grid', gridTemplate:'auto/1fr 1fr', gap:'8px' }}>
              {TYPES.map(t => (
                <div key={t.id}
                  onClick={() => { setType(t.id); setSchema(''); setSampleData(''); setQuery(''); }}
                  style={{ ...typeCard, borderColor: type===t.id ? t.color : 'rgba(255,255,255,0.06)', background: type===t.id ? `${t.color}12` : 'rgba(255,255,255,0.02)', cursor:'pointer' }}>
                  <span style={{ color:t.color, flexShrink:0 }}>{t.icon}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'12px', fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.id}</div>
                    <div style={{ fontSize:'10px', color:'#555', marginTop:'2px' }}>{t.desc}</div>
                  </div>
                  {type===t.id && <CheckCircle2 size={13} style={{ color:t.color, flexShrink:0 }}/>}
                </div>
              ))}
            </div>
          </div>

          {/* Optimization mode */}
          <div>
            <div style={sLabel}>OPTIMIZATION MODE</div>
            <div className="dw-opt-grid">
              {OPT_MODES.map(m => (
                <button key={m.id} onClick={() => setOptMode(m.id)}
                  style={{ ...optBtn, borderColor: optMode===m.id?'var(--accent)':'rgba(255,255,255,0.06)', background: optMode===m.id?'rgba(124,92,252,0.12)':'rgba(255,255,255,0.02)' }}>
                  <span style={{ fontSize:'12px', fontWeight:700, color:'#fff' }}>{m.label}</span>
                  <span style={{ fontSize:'9px', color:'#555', textAlign:'center' }}>{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced toggle */}
          <button onClick={() => setShowAdv(!showAdv)} style={advToggle}>
            <span>Advanced Configuration (schema, sample data)</span>
            {showAdv ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
          </button>

          <AnimatePresence>
            {showAdv && (
              <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                style={{ overflow:'hidden', display:'flex', flexDirection:'column', gap:'10px' }}>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#555', letterSpacing:'1px' }}>{currentType.schemaLabel}</label>
                <textarea rows={3} placeholder={currentType.schemaPlaceholder} value={schema} onChange={e=>setSchema(e.target.value)} style={advInput}/>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#555', letterSpacing:'1px' }}>{currentType.sampleLabel}</label>
                <textarea rows={3} placeholder={currentType.samplePlaceholder} value={sampleData} onChange={e=>setSampleData(e.target.value)} style={advInput}/>
                <label style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', color:'#888', cursor:'pointer' }}>
                  <input type="checkbox" checked={explainMode} onChange={e=>setExplainMode(e.target.checked)} style={{ accentColor:'var(--accent)' }}/>
                  Include line-by-line explanation
                </label>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mode toggle: Generate vs Explain */}
          <div style={{ display:'flex', gap:'8px', marginBottom:'4px' }}>
            <button onClick={() => setReverseMode(false)} style={{
              flex:1, padding:'10px 14px', borderRadius:'10px', fontSize:'12px', fontWeight:700, cursor:'pointer',
              background: !reverseMode ? 'rgba(124,92,252,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1.5px solid ${!reverseMode ? 'var(--accent)' : 'rgba(255,255,255,0.08)'}`,
              color: !reverseMode ? 'var(--accent)' : '#777',
            }}>
              ⚡ Generate New
            </button>
            <button onClick={() => setReverseMode(true)} style={{
              flex:1, padding:'10px 14px', borderRadius:'10px', fontSize:'12px', fontWeight:700, cursor:'pointer',
              background: reverseMode ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1.5px solid ${reverseMode ? '#60a5fa' : 'rgba(255,255,255,0.08)'}`,
              color: reverseMode ? '#60a5fa' : '#777',
            }}>
              🔍 Explain Existing
            </button>
          </div>

          {reverseMode ? (
            /* ── REVERSE MODE: paste existing code, get explanation ── */
            <div>
              <div style={sLabel}>PASTE EXISTING {currentType.id.toUpperCase()}</div>
              <textarea rows={6} placeholder={`Paste your existing ${currentType.id} here — AI will explain what it does, find bugs, and suggest improvements...`}
                value={existingCode} onChange={e=>setExistingCode(e.target.value)}
                style={{ ...advInput, minHeight:'150px', fontSize:'13px', fontFamily:"'DM Mono',monospace" }}/>
              <div style={{ fontSize:'11px', color:'#666', marginTop:'6px', display:'flex', alignItems:'center', gap:'5px' }}>
                <Sparkles size={11}/> AI will explain line-by-line, find issues, and suggest a better version
              </div>
            </div>
          ) : (
            /* ── Requirement input — placeholder changes per type ── */
            <div>
              <div style={sLabel}>DESCRIBE YOUR REQUIREMENT</div>
              <textarea rows={5} placeholder={currentType.requirementPlaceholder} value={query} onChange={e=>setQuery(e.target.value)}
                style={{ ...advInput, minHeight:'120px', fontSize:'14px' }}/>
            </div>
          )}

          <button onClick={handleGenerate} disabled={loading} style={{ ...genBtn, opacity:loading?0.6:1, background: reverseMode ? '#60a5fa' : 'var(--accent)' }}>
            {loading
              ? <><Loader2 size={17} style={{ animation:'spin 1s linear infinite' }}/> {reverseMode ? 'Analyzing...' : 'Synthesizing...'}</>
              : reverseMode
                ? <><Sparkles size={17}/> Explain This {currentType.id}</>
                : <><Sparkles size={17}/> Generate Production Artifact</>}
          </button>

          {/* History */}
          {history.length > 0 && (
            <>
              <button onClick={() => setShowHist(!showHist)} style={advToggle}>
                <span>Recent ({history.length})</span>
                {showHist ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
              </button>
              <AnimatePresence>
                {showHist && (
                  <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                    style={{ overflow:'hidden', display:'flex', flexDirection:'column', gap:'6px' }}>
                    {history.map(h => (
                      <div key={h.id}
                        onClick={() => {
                          setQuery(h.fullQuery || h.query.replace(/&quot;/g, '"'));
                          setType(h.type);
                          setVariants([{ content:h.content, label:h.type }]);
                          setAudit(h.audit);
                          setActiveVar(0);
                          setShowHist(false);
                        }}
                        style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'10px', cursor:'pointer' }}>
                        <span style={{ fontSize:'10px', fontWeight:800, color:'var(--accent)', background:'rgba(124,92,252,0.1)', padding:'2px 8px', borderRadius:'6px', flexShrink:0 }}>{h.type.split(' ')[0]}</span>
                        <span style={{ fontSize:'12px', color:'var(--text2)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.query.replace(/&quot;/g, '"')}</span>
                        <ArrowRight size={12} style={{ color:'var(--text3)', flexShrink:0 }}/>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* ── RIGHT ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

          {/* Pipeline tracker */}
          {pipeSteps.length > 0 && (
            <div style={{ background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'16px', padding:'20px' }}>
              <div style={sLabel}>SYNTHESIS PIPELINE</div>
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                {pipeSteps.map((s, i) => (
                  <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'5px', flex:1, minWidth:'80px' }}>
                    <div style={{ width:'28px', height:'28px', borderRadius:'50%', border:`2px solid ${s.status==='done'?'#34d399':s.status==='running'?'var(--accent)':s.status==='error'?'#f87171':'rgba(255,255,255,0.1)'}`, background:s.status==='done'?'rgba(52,211,153,0.1)':s.status==='running'?'rgba(124,92,252,0.2)':'#0a0a14', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {s.status==='done'    && <CheckCircle2 size={13} color="#34d399"/>}
                      {s.status==='running' && <Loader2 size={13} color="var(--accent)" style={{ animation:'spin 1s linear infinite' }}/>}
                      {s.status==='error'   && <AlertTriangle size={13} color="#f87171"/>}
                      {s.status==='pending' && <span style={{ fontSize:'10px', color:'#555', fontWeight:900 }}>{i+1}</span>}
                    </div>
                    <span style={{ fontSize:'9px', color:'#444', textAlign:'center', lineHeight:1.3, maxWidth:'80px' }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result panel */}
          <AnimatePresence>
            {(variants.length > 0 || loading) && (
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                style={{ background:'var(--card)', border:'2px solid var(--accent)', borderRadius:'22px', overflow:'hidden', boxShadow:'0 20px 60px rgba(124,92,252,0.1)' }}>

                <div style={{ background:'rgba(124,92,252,0.08)', padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'8px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'11px', fontWeight:900, color:'#fff', letterSpacing:'1px' }}>
                    <span style={{ width:'7px', height:'7px', background:'#34d399', borderRadius:'50%', boxShadow:'0 0 8px #34d399', animation:'pulse 2s infinite' }}/>
                    {loading ? 'SYNTHESIZING...' : `${type.split(' ')[0].toUpperCase()}_ARTIFACT`}
                  </div>
                  <div style={{ display:'flex', gap:'6px' }}>
                    {activeContent && <>
                      <button onClick={() => { navigator.clipboard.writeText(activeContent); showToast('Copied!'); }} style={ribBtn}><Copy size={12}/> Copy</button>
                      <button onClick={handleDownload} style={ribBtn}><Download size={12}/> Save</button>
                      <button onClick={handleGenerate} style={ribBtn}><RefreshCw size={12}/> Regen</button>
                    </>}
                  </div>
                </div>

                {variants.length > 1 && (
                  <div style={{ display:'flex', gap:'2px', padding:'6px 10px', background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    {variants.map((v, i) => (
                      <button key={i} onClick={() => setActiveVar(i)}
                        style={{ flex:1, padding:'7px', background:activeVar===i?'var(--accent)':'transparent', border:'none', borderRadius:'8px', color:activeVar===i?'#fff':'#555', fontSize:'11px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', transition:'0.2s' }}>
                        Variant {i+1} <span style={{ fontSize:'9px', opacity:0.7, background:'rgba(255,255,255,0.1)', padding:'1px 6px', borderRadius:'4px' }}>{v.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ padding:'24px', fontSize:'14px', lineHeight:'1.8', color:'var(--text)', maxHeight:'550px', overflowY:'auto' }}>
                  {loading && !activeContent ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                      {[80,65,90,55,75].map((w,i)=>(
                        <div key={i} style={{ height:'13px', background:'rgba(124,92,252,0.08)', borderRadius:'6px', width:`${w}%`, animation:'shimmer 1.5s infinite', animationDelay:`${i*0.1}s` }}/>
                      ))}
                    </div>
                  ) : (
                    <div className="dw-md-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                        code({ node, inline, className, children, ...props }) {
                          if (inline) return <code style={{ background:'rgba(255,255,255,0.08)', padding:'2px 6px', borderRadius:4, fontSize:'0.9em' }} {...props}>{children}</code>;
                          return <CodeBlock className={className}>{children}</CodeBlock>;
                        }
                      }}>{activeContent}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* ── LIVE RESULTS GRID: shows the formula actually computing on sample data ── */}
                {(gridLoading || gridData) && (
                  <div style={{ margin:'0 16px 16px', border:'1px solid rgba(74,222,128,0.2)', borderRadius:'14px', overflow:'hidden', background:'rgba(74,222,128,0.03)' }}>
                    <div onClick={() => setShowGrid(p => !p)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', cursor:'pointer', borderBottom: showGrid ? '1px solid rgba(74,222,128,0.15)' : 'none' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:11, fontWeight:900, color:'#4ade80', letterSpacing:'1px', textTransform:'uppercase' }}>
                          {gridLoading ? '⏳ Running on sample data...' : '▶ Live Result — Try It On Real Data'}
                        </span>
                      </div>
                      <span style={{ fontSize:11, color:'#4ade80' }}>{showGrid ? '▲' : '▼'}</span>
                    </div>

                    {gridLoading && (
                      <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:8 }}>
                        {[90,75,85].map((w,i)=>(
                          <div key={i} style={{ height:'12px', background:'rgba(74,222,128,0.08)', borderRadius:6, width:`${w}%`, animation:'shimmer 1.5s infinite', animationDelay:`${i*0.1}s` }}/>
                        ))}
                      </div>
                    )}

                    {showGrid && gridData && !gridLoading && (
                      <div style={{ overflowX:'auto', padding:'4px 16px 16px' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                          <thead>
                            <tr>
                              {gridData.headers.map((h, i) => (
                                <th key={i} style={{ textAlign:'left', padding:'8px 10px', color:'rgba(255,255,255,0.5)', fontWeight:700, fontSize:10, textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid rgba(255,255,255,0.1)' }}>{h}</th>
                              ))}
                              {gridResults?.values?.length > 1 && (
                                <th style={{ textAlign:'left', padding:'8px 10px', color:'#4ade80', fontWeight:800, fontSize:10, textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid rgba(74,222,128,0.3)', background:'rgba(74,222,128,0.06)' }}>{gridResults.column}</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {gridData.rows.map((row, ri) => (
                              <tr key={ri} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                                {row.map((cell, ci) => (
                                  <td key={ci} style={{ padding:'8px 10px', color:'rgba(255,255,255,0.8)', fontFamily:'monospace' }}>{safeCell(cell)}</td>
                                ))}
                                {gridResults?.values?.length > 1 && (
                                  <td style={{ padding:'8px 10px', color:'#4ade80', fontWeight:700, fontFamily:'monospace', background:'rgba(74,222,128,0.04)' }}>{safeCell(gridResults.values[ri])}</td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {gridResults?.values?.length === 1 && (
                          <div style={{ marginTop:12, padding:'12px 16px', borderRadius:10, background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.25)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{gridResults.column}</span>
                            <span style={{ fontSize:18, fontWeight:900, color:'#4ade80', fontFamily:'monospace' }}>{safeCell(gridResults.values[0])}</span>
                          </div>
                        )}

                        <div style={{ marginTop:10, fontSize:10, color:'rgba(255,255,255,0.3)' }}>
                          Sample data generated by AI to demonstrate the formula. Run this same logic on your real data in your own database/spreadsheet.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {audit && (
                  <div style={{ margin:'0 16px 16px', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', overflow:'hidden' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                      {[['Complexity',audit.complexity],['Security',audit.security],['Scalability',audit.scalability],['Performance',audit.performance||'Optimized']].map(([label,val])=>(
                        <div key={label} style={{ padding:'12px', borderRight:'1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ fontSize:'9px', fontWeight:900, color:'#444', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:'5px' }}>{label}</div>
                          <div style={{ fontSize:'12px', fontWeight:700, color:'var(--accent)' }}>{val}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding:'12px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', fontWeight:700, color:'#555', marginBottom:'6px' }}>
                        <span>Efficiency Score</span>
                        <span style={{ color:audit.efficiency>=90?'#34d399':audit.efficiency>=70?'#fbbf24':'#f87171' }}>{audit.efficiency}%</span>
                      </div>
                      <div style={{ height:'5px', background:'rgba(255,255,255,0.04)', borderRadius:'3px', overflow:'hidden' }}>
                        <motion.div initial={{ width:0 }} animate={{ width:`${audit.efficiency}%` }} transition={{ duration:1.2 }}
                          style={{ height:'100%', background:'linear-gradient(90deg,var(--accent),#34d399)', borderRadius:'3px' }}/>
                      </div>
                    </div>
                    {audit.warnings?.length>0 && audit.warnings.map((w,i)=>(
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:'7px', fontSize:'11px', color:'#fbbf24', background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.1)', padding:'7px 12px', margin:'0 12px 6px', borderRadius:'8px' }}>
                        <AlertTriangle size={11}/> {w}
                      </div>
                    ))}
                    {audit.optimizations?.length>0 && (
                      <div style={{ padding:'12px' }}>
                        <div style={{ fontSize:'9px', fontWeight:900, color:'#333', letterSpacing:'2px', marginBottom:'7px' }}>OPTIMIZATION SUGGESTIONS</div>
                        {audit.optimizations.map((o,i)=>(
                          <div key={i} style={{ display:'flex', alignItems:'center', gap:'7px', fontSize:'11px', color:'#34d399', paddingBottom:'5px', borderBottom:'1px solid rgba(255,255,255,0.03)', marginBottom:'5px' }}>
                            <CheckCircle2 size={11}/> {o}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {variants.length===0 && !loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'70px 30px', textAlign:'center', border:'1px dashed rgba(255,255,255,0.07)', borderRadius:'22px' }}>
              <Brain size={48} style={{ color:'#1a1a2e', marginBottom:'16px' }}/>
              <p style={{ color:'#444', fontSize:'14px', lineHeight:1.7, maxWidth:'360px' }}>
                Configure your artifact type, describe the requirement, and generate production-grade code with full audit trails.
              </p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'7px', marginTop:'20px', justifyContent:'center' }}>
                {['Multi-variant output','Security audit','Efficiency scoring','Schema-aware generation'].map(f=>(
                  <div key={f} style={{ background:'rgba(124,92,252,0.06)', border:'1px solid rgba(124,92,252,0.14)', color:'#555', padding:'4px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:600, display:'flex', alignItems:'center', gap:'5px' }}>
                    <CheckCircle2 size={9}/> {f}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes shimmer { 0%{opacity:.04} 50%{opacity:.12} 100%{opacity:.04} }
        .dw-md-body h1,.dw-md-body h2,.dw-md-body h3{color:#fff;font-weight:800;margin:18px 0 8px;letter-spacing:-.5px}
        .dw-md-body h2{border-bottom:1px solid rgba(124,92,252,.15);padding-bottom:8px}
        .dw-md-body h3{color:var(--accent);font-size:1em}
        .dw-md-body p{margin-bottom:10px;color:#bbb}
        .dw-md-body strong{color:#fff;font-weight:800}
        .dw-md-body a{color:var(--accent)}
        .dw-md-body pre{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:14px;overflow-x:auto;margin:10px 0}
        .dw-md-body code{font-family:'DM Mono',monospace;color:#a78bfa;font-size:13px}
        .dw-md-body pre code{color:#e2e8f0}
        .dw-md-body table{width:100%;border-collapse:collapse;margin:14px 0;font-size:13px}
        .dw-md-body th{background:rgba(124,92,252,.1);color:var(--accent);padding:8px 12px;font-size:10px;letter-spacing:1px;text-align:left;border:1px solid rgba(255,255,255,.05)}
        .dw-md-body td{padding:7px 12px;border:1px solid rgba(255,255,255,.04);color:#ccc}
        .dw-md-body ul,.dw-md-body ol{padding-left:20px;margin-bottom:10px}
        .dw-md-body li{margin-bottom:5px;color:#bbb}
      `}</style>
    </div>
  );
}

const sLabel    = { fontSize:'10px', fontWeight:900, color:'#444', letterSpacing:'3px', marginBottom:'12px', paddingBottom:'8px', borderBottom:'1px solid rgba(255,255,255,.04)' };
const typeCard  = { display:'flex', alignItems:'center', gap:'10px', padding:'12px 14px', border:'1px solid', borderRadius:'12px', transition:'all .2s' };
const optBtn    = { display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', padding:'10px 6px', border:'1px solid', borderRadius:'12px', cursor:'pointer', transition:'all .2s' };
const advToggle = { background:'transparent', border:'1px dashed rgba(255,255,255,.1)', color:'#555', padding:'9px 14px', borderRadius:'10px', cursor:'pointer', fontSize:'12px', display:'flex', justifyContent:'space-between', alignItems:'center', transition:'.2s', width:'100%' };
const advInput  = { background:'rgba(0,0,0,.5)', border:'1px solid rgba(255,255,255,.1)', color:'#fff', padding:'12px 14px', borderRadius:'12px', fontSize:'13px', resize:'none', outline:'none', fontFamily:'inherit', width:'100%', boxSizing:'border-box' };
const genBtn    = { width:'100%', padding:'16px', background:'var(--accent)', border:'none', borderRadius:'14px', color:'#fff', fontSize:'15px', fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'9px', boxShadow:'0 10px 30px rgba(124,92,252,.3)' };
const ribBtn    = { background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', color:'#aaa', padding:'6px 12px', borderRadius:'9px', fontSize:'11px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', fontWeight:600 };