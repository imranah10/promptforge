import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { AppContext } from '../context/AppContext.jsx';
import { Search, Star, Download, Copy, Play } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORIES = ['All', 'Writing', 'Marketing', 'Coding', 'Business', 'Education', 'Creative'];

const PROMPTS = [
  // Writing (10)
  { id:'w1', cat:'Writing', title:'Blog Post Intro Hook', desc:'A compelling introduction that hooks readers immediately.', text:'Write a compelling blog post introduction about [TOPIC] that hooks readers in the first 2 sentences, promises a clear benefit, and naturally transitions into the main content. Keep it under 120 words and use a conversational yet authoritative tone.' },
  { id:'w2', cat:'Writing', title:'Email Subject Lines', desc:'5 high-converting email subject line variations.', text:'Generate 5 high-converting email subject lines for a campaign about [TOPIC]. Include one curiosity-driven, one benefit-driven, one urgency-driven, one question-based, and one personalized subject line. Keep each under 60 characters.' },
  { id:'w3', cat:'Writing', title:'YouTube Script Opener', desc:'Engaging YouTube video introduction script.', text:'Write a 30-second YouTube video script opener about [TOPIC]. Include a surprising fact or bold statement to stop the scroll, a quick credibility mention, and a clear promise of what the viewer will learn. End with a soft call-to-action to keep watching.' },
  { id:'w4', cat:'Writing', title:'LinkedIn Thought Leadership', desc:'Professional opinion post for LinkedIn.', text:'Write a LinkedIn thought leadership post about [TOPIC] that shares a contrarian opinion or unique insight. Structure it as: Hook (1 sentence) → Personal experience or observation (2-3 sentences) → Key lesson or takeaway (1 sentence) → Open-ended question to drive engagement (1 sentence).' },
  { id:'w5', cat:'Writing', title:'Product Comparison Article', desc:'Unbiased comparison of two competing products.', text:'Write an unbiased comparison article comparing [PRODUCT A] vs [PRODUCT B]. Include a quick verdict summary, 5 comparison categories with specific details, pros/cons for each, and a final recommendation based on different user needs. Keep it factual and avoid brand bias.' },
  { id:'w6', cat:'Writing', title:'Twitter/X Thread', desc:'Viral Twitter thread on any topic.', text:'Write a 10-tweet Twitter/X thread about [TOPIC]. Each tweet should be under 280 characters. Start with a bold hook tweet, alternate between insights and actionable advice, include one surprising statistic, and end with a strong takeaway plus a call-to-action. Make each tweet self-contained but connected.' },
  { id:'w7', cat:'Writing', title:'Sales Page Headline Stack', desc:'High-converting headline variations for a landing page.', text:'Write 7 different headline variations for a sales page selling [PRODUCT/SERVICE]. Include: 1) Pain-point headline, 2) Benefit headline, 3) How-to headline, 4) Question headline, 5) Testimonial-based headline, 6) Comparison headline, 7) Guarantee-driven headline. Make each compelling and specific.' },
  { id:'w8', cat:'Writing', title:'E-book Chapter Outline', desc:'Detailed chapter-by-chapter outline for an e-book.', text:'Create a detailed chapter-by-chapter outline for an e-book titled "[TITLE]" about [TOPIC]. Include 8-10 chapters. For each chapter, provide: chapter title, 3-5 bullet points of what will be covered, estimated word count, and one key takeaway the reader will gain.' },
  { id:'w9', cat:'Writing', title:'Instagram Carousel Script', desc:'Script for an educational Instagram carousel post.', text:'Write a script for a 10-slide Instagram carousel about [TOPIC]. Each slide should have a short headline (3-6 words) and 1-2 sentences of body text. The first slide is a hook, slides 2-9 are educational content with one idea per slide, and the last slide is a call-to-action. Keep everything concise and visually descriptive.' },
  { id:'w10', cat:'Writing', title:'FAQ Section for Website', desc:'Comprehensive FAQ section for any product or service.', text:'Write a comprehensive FAQ section with 8 questions and answers for a [PRODUCT/SERVICE]. Anticipate real customer objections and concerns. Make answers concise (2-3 sentences each), honest, and conversion-focused. Include one question about pricing, one about time/results, and one about guarantee or refund policy.' },

  // Marketing (10)
  { id:'m1', cat:'Marketing', title:'Google Ads Copy', desc:'High-CTR Google Search ad copy with extensions.', text:'Write Google Search ad copy for [PRODUCT/SERVICE]. Include: 3 headline variations (30 characters each), 2 description lines (90 characters each), 4 sitelink extensions with descriptions, 3 callout extensions, and 1 structured snippet. Focus on CTR and relevance.' },
  { id:'m2', cat:'Marketing', title:'Facebook Ad Creative Brief', desc:'Complete creative brief for a Facebook ad campaign.', text:'Create a Facebook ad creative brief for [PRODUCT/SERVICE] targeting [AUDIENCE]. Include: campaign objective, primary message, 3 headline options, 3 body copy variations (under 125 words each), CTA button text, visual direction, and A/B test strategy. Focus on one specific pain point.' },
  { id:'m3', cat:'Marketing', title:'Influencer Outreach DM', desc:'DM template to pitch influencers for collaboration.', text:'Write a short, friendly Instagram/TikTok influencer outreach DM for [BRAND] to send to [NICHE] influencers with [FOLLOWER COUNT] followers. The message should: compliment their content genuinely, clearly state the collaboration offer, mention the benefit to them, include a soft call-to-action, and stay under 150 words.' },
  { id:'m4', cat:'Marketing', title:'Landing Page CTA Stack', desc:'Multiple call-to-action variations for a landing page.', text:'Write 10 different CTA button text variations for a landing page about [PRODUCT/SERVICE]. Mix direct CTAs ("Buy Now"), benefit-driven CTAs ("Get My Free Guide"), urgency CTAs ("Claim Your Spot — 3 Left"), and curiosity CTAs ("See the Method Inside"). Each should be 2-5 words.' },
  { id:'m5', cat:'Marketing', title:'Retargeting Ad Sequence', desc:'3-ad retargeting sequence for cart abandoners.', text:'Write a 3-ad retargeting sequence for [E-COMMERCE PRODUCT] targeting cart abandoners. Ad 1 (0-24 hours): Gentle reminder, no discount. Ad 2 (24-72 hours): Address objections with social proof. Ad 3 (72-168 hours): Urgency-driven with limited-time 10% discount. Each ad should have headline, body (under 80 words), and CTA.' },
  { id:'m6', cat:'Marketing', title:'SEO Blog Outline', desc:'SEO-optimized blog post outline targeting specific keywords.', text:'Create an SEO-optimized blog post outline for a 2000-word article targeting the keyword "[KEYWORD]". Include: title with keyword, meta description (under 160 characters), H2 headings (8-10 sections), 2-3 H3 subheadings under each H2, internal linking suggestions, and a content upgrade idea. Make it comprehensive enough to rank on page 1.' },
  { id:'m7', cat:'Marketing', title:'Customer Testimonial Request', desc:'Email template to request video testimonials from customers.', text:'Write an email to request a video testimonial from a happy customer who recently bought [PRODUCT/SERVICE]. Keep it warm and appreciative, acknowledge their success, give them 3 specific questions to answer on camera (30-60 seconds total), mention a small incentive, and make it easy to say yes. Under 200 words.' },
  { id:'m8', cat:'Marketing', title:'Product Launch Announcement', desc:'Multi-channel product launch announcement copy.', text:'Write a product launch announcement for [PRODUCT]. Create 3 versions: 1) Short tweet/X post (under 280 chars), 2) Instagram caption with emojis and hashtags (under 150 words), 3) Email announcement (300-400 words) with early-bird offer. All versions should build excitement and drive pre-orders.' },
  { id:'m9', cat:'Marketing', title:'Competitor Analysis Summary', desc:'Quick competitive analysis framework output.', text:'Analyze the marketing strategy of [COMPETITOR BRAND] in the [NICHE] space. Summarize: their positioning, top 3 messaging angles, content strategy, pricing psychology, and 2 weaknesses we can exploit. Keep it actionable and under 400 words.' },
  { id:'m10', cat:'Marketing', title:'Webinar Registration Page', desc:'High-converting webinar landing page copy.', text:'Write landing page copy for a webinar titled "[WEBINAR TITLE]" about [TOPIC]. Include: attention-grabbing headline, 3 bullet-point benefits, speaker bio with credibility, date/time details, scarcity element (seats or time-limited replay), 3 FAQ items, and a strong registration CTA. Keep it persuasive but not hypey.' },

  // Coding (10)
  { id:'c1', cat:'Coding', title:'React Component Generator', desc:'Generate a production-ready React component with props.', text:'Write a production-ready React functional component in TypeScript for: [COMPONENT DESCRIPTION]. Include: proper TypeScript interfaces, JSDoc comments, state management with useState, side effects with useEffect if needed, error handling, loading states, prop validation, and a basic unit test using React Testing Library. Follow modern React best practices.' },
  { id:'c2', cat:'Coding', title:'API Endpoint Design', desc:'REST API endpoint specification with error handling.', text:'Design a REST API endpoint for [FUNCTIONALITY]. Include: HTTP method and route, request body schema with validation rules, response schema (success and error), authentication requirements, rate limiting suggestions, and a Node.js/Express implementation with proper middleware, error handling, and input sanitization.' },
  { id:'c3', cat:'Coding', title:'SQL Query Optimizer', desc:'Optimize a slow SQL query with indexing suggestions.', text:'Given this SQL query and schema: [PASTE QUERY]. Optimize it for performance on a table with [ROW COUNT] rows. Provide: the optimized query with EXPLAIN plan reasoning, indexing recommendations, potential database design improvements, and a caching strategy if applicable. Explain each optimization in plain English.' },
  { id:'c4', cat:'Coding', title:'Python Data Pipeline', desc:'Python ETL script with error handling and logging.', text:'Write a Python ETL script that: extracts data from [SOURCE], transforms it by [TRANSFORMATION RULES], and loads it into [DESTINATION]. Include: type hints, docstrings, error handling with retries, logging, progress tracking for large datasets, and a main() function with CLI argument parsing. Use pandas or standard library as appropriate.' },
  { id:'c5', cat:'Coding', title:'Code Review Checklist', desc:'Comprehensive code review checklist for any language.', text:'Create a comprehensive code review checklist for a [LANGUAGE] pull request. Include categories: Code Quality (naming, complexity, comments), Security (input validation, auth, secrets), Performance (loops, DB queries, memory), Testing (coverage, edge cases), and Maintainability (DRY, SOLID, documentation). Make it a reusable checklist with 20-25 items.' },
  { id:'c6', cat:'Coding', title:'Docker Compose Setup', desc:'Multi-service Docker Compose configuration.', text:'Write a production-ready docker-compose.yml for an app with: [SERVICES]. Include: service definitions with health checks, environment variable management, volume mounts for persistence, network configuration, a reverse proxy (nginx/traefik), and basic monitoring with restart policies. Add comments explaining each section.' },
  { id:'c7', cat:'Coding', title:'Regex Pattern Generator', desc:'Complex regex with explanation and test cases.', text:'Write a regex pattern that matches: [DESCRIBE PATTERN NEEDED]. Provide: the regex string, a plain English explanation of each part, 5 test cases that should match, 3 test cases that should NOT match, and a code snippet showing usage in JavaScript or Python. Make it robust against edge cases.' },
  { id:'c8', cat:'Coding', title:'CI/CD Pipeline Config', desc:'GitHub Actions or GitLab CI configuration.', text:'Write a [GITHUB ACTIONS / GITLAB CI] configuration for a [TECH STACK] project. Include: automated testing on multiple Node/Python versions, linting, security scanning (SAST/dependency check), build step, deployment to [PLATFORM], notification on failure, and caching for faster builds. Use best practices and include comments.' },
  { id:'c9', cat:'Coding', title:'System Design Overview', desc:'High-level system design for a scalable application.', text:'Design a high-level system for [APPLICATION] that needs to handle [TRAFFIC SCALE]. Include: architecture diagram description (in text), database choice with sharding/replication strategy, caching layer, message queue usage, API gateway design, monitoring/logging strategy, and scalability bottlenecks with solutions. Keep it practical, not over-engineered.' },
  { id:'c10', cat:'Coding', title:'Bug Report Template', desc:'Professional bug report template for developers.', text:'Write a comprehensive bug report template for [SOFTWARE]. Include sections: Summary, Environment (OS, browser, version), Steps to Reproduce (numbered), Expected vs Actual Behavior, Screenshots/Logs placeholder, Severity/Priority, and Additional Context. Make it detailed enough that a developer can reproduce the bug without asking follow-up questions.' },

  // Business (10)
  { id:'b1', cat:'Business', title:'Business Plan Executive Summary', desc:'One-page executive summary for investors.', text:'Write a one-page executive summary for a business plan about [BUSINESS IDEA]. Include: problem being solved, solution overview, target market size, revenue model, traction to date, team highlights, funding ask and use of funds, and 3-year financial snapshot. Make it compelling for investors while staying factual.' },
  { id:'b2', cat:'Business', title:'Pitch Deck Script', desc:'Narration script for a 10-slide pitch deck.', text:'Write a pitch deck narration script for a 10-slide investor pitch about [STARTUP]. Slide structure: 1) Hook, 2) Problem, 3) Solution, 4) Product Demo, 5) Market Size, 6) Business Model, 7) Traction, 8) Competition, 9) Team, 10) Ask. Each slide gets 30-45 seconds of narration. Total deck should be 5-7 minutes.' },
  { id:'b3', cat:'Business', title:'Meeting Agenda Template', desc:'Structured agenda for productive team meetings.', text:'Create a structured meeting agenda template for a [MEETING TYPE] with [ATTENDEES]. Include: meeting objective (1 sentence), time allocations per topic (total 30-60 mins), pre-read materials, decision points, action items with owners and deadlines, and a parking lot for off-topic items. Make it actionable and time-boxed.' },
  { id:'b4', cat:'Business', title:'Customer Persona Profile', desc:'Detailed ideal customer persona for marketing.', text:'Create a detailed customer persona for [PRODUCT/SERVICE]. Include: demographic profile (age, job, income, location), psychographics (goals, fears, values), pain points (3 specific), buying triggers, where they research solutions, objections they have, and a day-in-the-life narrative paragraph. Make it feel like a real person with a name.' },
  { id:'b5', cat:'Business', title:'SOP Document', desc:'Standard Operating Procedure for any business process.', text:'Write a Standard Operating Procedure (SOP) for: [BUSINESS PROCESS]. Include: purpose and scope, responsible roles, tools/software needed, step-by-step instructions (numbered), decision trees where applicable, quality checkpoints, common errors and how to avoid them, and a review/update schedule. Make it clear enough for a new hire to follow.' },
  { id:'b6', cat:'Business', title:'SWOT Analysis', desc:'Strategic SWOT analysis for a company or product.', text:'Perform a SWOT analysis for [COMPANY/PRODUCT]. Include 3-4 items per quadrant: Strengths (internal advantages), Weaknesses (internal gaps), Opportunities (external trends to exploit), and Threats (external risks). For each item, add one sentence explaining the impact. End with 2 strategic recommendations based on the analysis.' },
  { id:'b7', cat:'Business', title:'Freelance Proposal', desc:'Winning freelance project proposal template.', text:'Write a freelance project proposal for [SERVICE] for [CLIENT TYPE]. Include: project understanding summary, proposed solution with 3 phases, timeline with milestones, pricing breakdown (fixed or hourly), 2 case studies or relevant experience, terms and conditions, and a strong close with next steps. Keep it professional and persuasive.' },
  { id:'b8', cat:'Business', title:'Investor Update Email', desc:'Monthly investor update template for startups.', text:'Write a monthly investor update email for a startup in the [INDUSTRY] space. Include: key metrics (revenue, users, growth %), wins from last month, challenges faced and how they were addressed, focus for next month, any asks from investors (introductions, advice, etc.), and a gratitude note. Keep it honest, concise, and data-driven.' },
  { id:'b9', cat:'Business', title:'Compensation Benchmark Report', desc:'Salary benchmarking analysis for hiring.', text:'Create a compensation benchmark summary for the [ROLE] position in [LOCATION/REMOTE]. Include: salary range (25th, 50th, 75th percentile), equity/ bonus expectations, benefits that matter most for this role, 3 competitor companies and their known compensation, and recommendations for a competitive offer. Base it on current market trends.' },
  { id:'b10', cat:'Business', title:'Crisis Communication Plan', desc:'Communication strategy for a business crisis scenario.', text:'Write a crisis communication plan for [SCENARIO] affecting [COMPANY]. Include: immediate response timeline (first 1 hour, 24 hours, 1 week), internal communication messaging, external statement draft, social media response strategy, spokesperson talking points, stakeholder notification sequence, and a post-crisis review checklist. Prioritize transparency and empathy.' },

  // Education (10)
  { id:'e1', cat:'Education', title:'Lesson Plan Template', desc:'Complete lesson plan for any subject and grade level.', text:'Create a detailed lesson plan for [SUBJECT] for [GRADE LEVEL]. Include: learning objectives (3, using Bloom\'s taxonomy), materials needed, opening hook activity (10 mins), main instruction with 2 activities (20 mins), group work or discussion (15 mins), assessment method, differentiation strategies for struggling and advanced students, and homework assignment. Total time: 45-60 mins.' },
  { id:'e2', cat:'Education', title:'Study Guide Generator', desc:'Comprehensive study guide with key concepts and practice questions.', text:'Create a study guide for [TOPIC] at [LEVEL]. Include: 5-7 key concepts with definitions, a concept map or relationship diagram (described in text), 10 practice questions (mix of multiple choice, short answer, and application), 2 critical thinking prompts, common misconceptions to avoid, and a 1-page summary cheat sheet. Make it student-friendly.' },
  { id:'e3', cat:'Education', title:'Quiz Question Bank', desc:'20 quiz questions with answers and difficulty ratings.', text:'Write a quiz question bank with 20 questions about [TOPIC]. Include: 8 multiple choice (with 4 options and correct answer), 6 true/false, 4 short answer (with model answers), and 2 essay/discussion prompts. Label each with difficulty (Easy/Medium/Hard) and the learning objective it tests. Include an answer key.' },
  { id:'e4', cat:'Education', title:'Explainer Script', desc:'Simple explanation of a complex topic for beginners.', text:'Write a plain-English explainer about [COMPLEX TOPIC] for someone with no background in the subject. Structure it as: 1) Analogy or relatable comparison, 2) Core concept in 2-3 sentences, 3) Why it matters in real life, 4) One common misconception cleared up, 5) A follow-up resource suggestion. Keep it under 300 words and jargon-free.' },
  { id:'e5', cat:'Education', title:'Course Syllabus', desc:'Professional syllabus for an online or offline course.', text:'Write a course syllabus for "[COURSE NAME]" — a [DURATION] course on [TOPIC]. Include: course description and outcomes, weekly module breakdown (8-12 modules), required materials, assessment breakdown (assignments, quizzes, final project, participation), late policy, academic integrity statement, and instructor contact info. Make it welcoming but professional.' },
  { id:'e6', cat:'Education', title:'Discussion Prompts', desc:'Thought-provoking discussion questions for any topic.', text:'Generate 8 discussion prompts about [TOPIC] for a [AUDIENCE]. Mix formats: 3 open-ended opinion questions, 2 scenario-based "what would you do" prompts, 2 compare/contrast prompts, and 1 ethical dilemma. Each should require critical thinking, not just factual recall. Include facilitation notes for the instructor.' },
  { id:'e7', cat:'Education', title:'Flashcard Deck', desc:'Complete flashcard set with terms and definitions.', text:'Create a flashcard deck of 15 cards about [TOPIC]. Each card should have: a key term or concept on the front, and a concise definition plus one example or application on the back. Organize them by sub-topic. Include 2-3 cards that address common student misconceptions. Format clearly for easy copy-paste into Anki or Quizlet.' },
  { id:'e8', cat:'Education', title:'Research Paper Abstract', desc:'Compelling academic abstract for a research paper.', text:'Write an academic abstract for a research paper titled "[TITLE]" about [TOPIC]. Follow standard structure: Background/Context (2 sentences), Research Question (1 sentence), Methodology (2 sentences), Key Findings (2-3 sentences), and Implications/Conclusion (1-2 sentences). Total: 200-250 words. Use formal academic tone but clear language.' },
  { id:'e9', cat:'Education', title:'Parent Communication Email', desc:'Teacher email to parents about student progress.', text:'Write an email from a teacher to parents about [STUDENT NAME]\'s progress in [SUBJECT]. Include: positive opening about the student\'s strengths, specific area for improvement with 2 concrete examples, 2-3 actionable strategies parents can support at home, an invitation to discuss further, and a warm closing. Keep it constructive and under 250 words.' },
  { id:'e10', cat:'Education', title:'Certification Exam Prep', desc:'Study checklist and prep strategy for professional certification.', text:'Create a certification exam prep plan for [CERTIFICATION NAME]. Include: exam overview (format, duration, passing score), topic breakdown with weight percentages, a 4-week study schedule with daily focus areas, recommended resources (books, videos, practice exams), 10 high-yield topics to master, and test-taking strategies for the exam day. Make it realistic and motivating.' },

  // Creative (10)
  { id:'cr1', cat:'Creative', title:'Short Story Opening', desc:'Captivating first 300 words of a short story.', text:'Write the opening 300 words of a short story about [PREMISE/CHARACTER]. Establish the setting with sensory details, introduce a compelling character with one defining trait, hint at the central conflict, and end the opening with a narrative hook that makes the reader want to continue. Use [TONE] tone and [POV] point of view.' },
  { id:'cr2', cat:'Creative', title:'Character Profile', desc:'Detailed character backstory and personality sheet.', text:'Create a detailed character profile for a [GENRE] story. Include: full name, age, appearance (3 distinguishing features), personality (MBTI-style traits), backstory wound or formative experience, motivation/goal, internal conflict, external conflict, relationship with 2 other characters, and a signature dialogue line that reveals their voice. Make them feel like a real person.' },
  { id:'cr3', cat:'Creative', title:'Worldbuilding Document', desc:'Setting bible for a fictional world.', text:'Write a worldbuilding document for a [GENRE] setting. Include: geography overview, 2 major locations with distinct cultures, political system and current power dynamics, magic/technology rules with 3 limitations, one historical event that shaped the present, and daily life details for an average person. Keep it concise but evocative (under 500 words).' },
  { id:'cr4', cat:'Creative', title:'Plot Outline (3-Act)', desc:'Classic three-act structure story outline.', text:'Create a 3-act plot outline for a [GENRE] story about [PREMISE]. Act 1 (25%): Setup, inciting incident, first threshold. Act 2 (50%): Rising action, midpoint twist, complications, darkest moment. Act 3 (25%): Climax, resolution, thematic statement. Include 3-5 bullet points per act with specific plot beats and character decisions.' },
  { id:'cr5', cat:'Creative', title:'Script Dialogue Scene', desc:'A dramatic dialogue scene between two characters.', text:'Write a 2-person dialogue scene for [GENRE]. Characters: [CHARACTER A] and [CHARACTER B]. Scene context: [CONTEXT]. The conversation should: reveal subtext and hidden agendas, include one dramatic pause or interruption, escalate emotional tension, and end on a cliffhanger or decision moment. Keep stage directions minimal. Total: 400-600 words.' },
  { id:'cr6', cat:'Creative', title:'Poetry Prompt Result', desc:'A structured poem on a given theme.', text:'Write a [SONNET / HAIKU / FREE VERSE / VILLANELLE] about [THEME]. If structured, follow the form rules. Include vivid imagery (at least 3 sensory details), an emotional arc from beginning to end, and a closing line that offers a new perspective or twist. Keep it under 30 lines. Briefly explain 2 poetic devices used.' },
  { id:'cr7', cat:'Creative', title:'Comedy Sketch Script', desc:'Short comedy sketch with setup and punchline.', text:'Write a 2-minute comedy sketch about [PREMISE/TOPIC]. Include: setup (establish the absurd situation), 2-3 characters with distinct comedic voices, running gag or callback, one escalating beat where things get worse/funnier, and a strong punchline ending. Keep it stage-friendly with minimal props needed. Format as a simple script.' },
  { id:'cr8', cat:'Creative', title:'Brand Story Narrative', desc:'Emotional brand origin story for marketing.', text:'Write an emotional brand origin story for [BRAND/FOUNDER]. Include: the founder\'s personal struggle or moment of inspiration, the problem they refused to accept, the sacrifices made to build the solution, one specific customer whose life was changed, and the larger mission that drives the company today. Make it authentic, not manipulative. Under 400 words.' },
  { id:'cr9', cat:'Creative', title:'D&D Campaign Hook', desc:'Adventure hook for a tabletop RPG session.', text:'Write a D&D/RPG campaign hook for a [LEVEL] party. Include: the inciting event that pulls players in, 3 NPCs with distinct personalities (ally, villain, wildcard), 2 possible paths to the objective, a moral dilemma with no perfect solution, environmental hazards, and loot/rewards. Set the tone as [TONE: gritty/epic/humorous]. Make it ready to run.' },
  { id:'cr10', cat:'Creative', title:'Song Lyrics Structure', desc:'Verse-chorus song structure with theme.', text:'Write song lyrics for a [GENRE] song about [THEME]. Structure: Verse 1 (4 lines), Pre-Chorus (2 lines), Chorus (4 lines, hook), Verse 2 (4 lines, develop the story), Bridge (2-4 lines, shift perspective), Final Chorus (4 lines, emotional peak). Include rhyme scheme notes and a brief production note (tempo, instrumentation feel). Make it radio-friendly.' },
];

const COMMUNITY_PROMPTS = [
  { id:'co1', author:'AlexDev', title:'Debugging Rubber Duck', desc:'Explain your bug to an imaginary rubber duck to find the solution.', text:'I have a bug in my code. Here is the code and what I expected vs what happened: [DESCRIBE BUG]. Please act as a patient rubber duck debugger — ask me one clarifying question at a time until we isolate the root cause. Do not solve it immediately. Help me think through it step by step.' },
  { id:'co2', author:'SaraWrites', title:'Writer\'s Block Breaker', desc:'A creative exercise to overcome writer\'s block.', text:'I am stuck writing about [TOPIC]. Give me 5 completely different angles to approach this piece — one emotional, one data-driven, one personal story, one contrarian, and one futuristic/speculative. For each angle, write just one compelling opening sentence. No full paragraphs needed.' },
  { id:'co3', author:'MarkBiz', title:'Investor Cold Email', desc:'Cold email template to reach angel investors.', text:'Write a cold email to an angel investor introducing [STARTUP]. The email must: reference one specific thing about their portfolio, clearly state the problem and traction in 2 sentences, include one impressive metric, ask for a 15-minute call (not funding directly), and have a P.S. line that adds credibility. Keep it under 150 words.' },
  { id:'co4', author:'PriyaTeach', title:'Explain Like I\'m 5', desc:'Simplify any complex concept for a 5-year-old.', text:'Explain [COMPLEX CONCEPT] to me like I am 5 years old. Use only analogies from everyday life (toys, food, playgrounds, animals). No jargon. Include one "wait, but why?" follow-up answer that a curious child would actually ask. Make it fun and accurate.' },
  { id:'co5', author:'JordanSEO', title:'Content Gap Analysis', desc:'Find content opportunities competitors are missing.', text:'Analyze the content strategy of [COMPETITOR WEBSITE] in the [NICHE] space. Identify 5 content gaps — topics they haven\'t covered deeply that their audience is searching for. For each gap, suggest: the target keyword, content format (blog, video, tool), estimated search volume level, and why it would rank well. Prioritize low-competition, high-intent keywords.' },
];

const PromptLibrary = ({ onNavigate }) => {
  const { showToast } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pf-fav-prompts') || '[]'); } catch { return []; }
  });
  const [showFavOnly, setShowFavOnly] = useState(false);

  useEffect(() => {
    localStorage.setItem('pf-fav-prompts', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFav = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const usePrompt = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Prompt copied to clipboard!');
    // Redirect to AI Writer
    onNavigate('aiwriter');
  };

  const filtered = useMemo(() => {
    let list = showFavOnly ? PROMPTS.filter(p => favorites.includes(p.id)) : PROMPTS;
    if (activeCat !== 'All') list = list.filter(p => p.cat === activeCat);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(s) || p.desc.toLowerCase().includes(s) || p.text.toLowerCase().includes(s) || p.cat.toLowerCase().includes(s));
    }
    return list;
  }, [activeCat, search, favorites, showFavOnly]);

  return (
    <div className="page active">
      <div className="section-header">
        <h2 className="section-title">📚 Prompt Library</h2>
        <div className="section-sub">60+ battle-tested prompts. One click to copy and use in AI Writer or AI Chat.</div>
      </div>

      {/* Search & filters */}
      <div className="tool-card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrapper" style={{ flex: 1, position: 'relative', minWidth: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input
              className="form-input"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search prompts by keyword, title, or category..."
              style={{ width: '100%', paddingLeft: '36px' }}
            />
          </div>
          <button
            className={`btn btn-sm ${showFavOnly ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setShowFavOnly(v => !v)}
            style={{ whiteSpace: 'nowrap' }}
          >
            <Star size={14} fill={showFavOnly ? "currentColor" : "none"} /> {showFavOnly ? 'Favorites' : 'Favorites'}
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              className={`cat-pill ${activeCat === c ? 'active' : ''}`}
              onClick={() => setActiveCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '16px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
        {filtered.length} prompt{filtered.length !== 1 ? 's' : ''} found {showFavOnly ? '(favorites only)' : ''}
      </div>

      <div className="prompts-grid">
        {filtered.map(p => (
          <motion.div key={p.id} className="prompt-card glass-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="prompt-header">
              <div>
                <div className="prompt-title">{p.title}</div>
                <div className="prompt-desc">{p.desc}</div>
              </div>
              <span className="prompt-badge">{p.cat}</span>
            </div>
            <div className="prompt-text">
              {p.text}
            </div>
            <div className="prompt-actions">
              <button className="btn btn-sm btn-primary" onClick={() => usePrompt(p.text)} style={{ flex: 1 }}>
                <Copy size={14} /> Copy & Use
              </button>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => toggleFav(p.id)}
                title={favorites.includes(p.id) ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star size={16} fill={favorites.includes(p.id) ? "var(--gold)" : "none"} color={favorites.includes(p.id) ? "var(--gold)" : "var(--text3)"} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="tool-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
          <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text2)', marginBottom: '8px' }}>No prompts match your search.</div>
          <div style={{ fontSize: '13px' }}>Try a different keyword or category.</div>
        </div>
      )}

      {/* Community Prompts */}
      <div className="section-header" style={{ marginTop: '40px' }}>
        <h2 className="section-title">🌟 Community Prompts</h2>
        <div className="section-sub">Top-rated prompts shared by the community.</div>
      </div>

      <div className="prompts-grid">
        {COMMUNITY_PROMPTS.map(p => (
          <motion.div key={p.id} className="prompt-card glass-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="prompt-header">
              <div>
                <div className="prompt-title">{p.title}</div>
                <div className="prompt-desc">{p.desc}</div>
              </div>
              <span className="prompt-badge" style={{ background: 'var(--card2)', color: 'var(--text2)' }}>by {p.author}</span>
            </div>
            <div className="prompt-text">
              {p.text}
            </div>
            <div className="prompt-actions">
              <button className="btn btn-sm btn-outline" onClick={() => usePrompt(p.text)} style={{ flex: 1 }}>
                <Copy size={14} /> Copy & Use
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <style jsx>{`
        .cat-pill {
          background: var(--bg3); border: 1px solid var(--border);
          color: var(--text3); font-size: 11px; font-weight: 600; padding: 6px 14px;
          border-radius: 20px; cursor: pointer; transition: all 0.2s;
        }
        .cat-pill:hover { background: rgba(124,92,252,0.1); color: var(--text); border-color: var(--border); }
        .cat-pill.active { background: var(--accent); color: #fff; border-color: var(--accent); box-shadow: 0 0 12px var(--glow); }
        
        .prompts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
        .prompt-card { padding: 16px; display: flex; flex-direction: column; gap: 12px; transition: transform 0.2s; }
        .prompt-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124,92,252,0.1); }
        .prompt-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .prompt-title { font-size: 14px; font-weight: 700; color: var(--text); line-height: 1.3; margin-bottom: 4px; }
        .prompt-desc { font-size: 12px; color: var(--text3); line-height: 1.4; }
        .prompt-badge { font-size: 10px; font-weight: 700; color: var(--accent3); background: rgba(56,189,248,0.1); padding: 4px 8px; border-radius: 6px; white-space: nowrap; }
        
        .prompt-text {
          font-size: 12px; color: var(--text2); line-height: 1.5;
          max-height: 100px; overflow-y: auto; padding: 10px;
          background: var(--bg3); border-radius: 8px; border: 1px solid var(--border2);
          font-family: var(--font-body);
        }
        .prompt-actions { display: flex; gap: 8px; margin-top: auto; }
      `}</style>
    </div>
  );
};

export default PromptLibrary;
