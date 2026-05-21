import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Wand2, PenTool, Library, GitCompare, Code2, Database, Search, 
  Globe, Lightbulb, Share2, Image as ImageIcon, Video, HelpCircle, 
  ArrowRight, Copy, Check, ChevronRight, BookOpen, Key, Info, Zap
} from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी (Hindi)' },
  { code: 'hin', name: 'Hinglish' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'ja', name: '日本語' }
];

const TOOLS_METADATA = [
  { id: 'chatdata', icon: FileText, title: 'Chat With Data', category: 'Analytics' },
  { id: 'optimizer', icon: Wand2, title: 'Prompt Optimizer', category: 'Engineering' },
  { id: 'aiwriter', icon: PenTool, title: 'AI Writer', category: 'Creative' },
  { id: 'library', icon: Library, title: 'Prompt Library', category: 'Resources' },
  { id: 'compare', icon: GitCompare, title: 'Model Compare', category: 'Engineering' },
  { id: 'codehelper', icon: Code2, title: 'Code Helper', category: 'Engineering' },
  { id: 'datawizard', icon: Database, title: 'Data Wizard', category: 'Analytics' },
  { id: 'seo', icon: Search, title: 'SEO Optimizer', category: 'Marketing' },
  { id: 'search', icon: Globe, title: 'The Spider', category: 'Intelligence' },
  { id: 'inventor', icon: Lightbulb, title: 'The Inventor', category: 'Strategy' },
  { id: 'creator', icon: Share2, title: 'Social Media AI', category: 'Creative' },
  { id: 'imageprompt', icon: ImageIcon, title: 'Image Prompt', category: 'Creative' },
  { id: 'videoprompt', icon: Video, title: 'Video Prompt', category: 'Creative' }
];

// Content in different languages
const TRANSLATIONS = {
  en: {
    sidebarTitle: 'PromptForge Guides',
    langSelectLabel: 'Choose Language:',
    quickSetup: 'Setup in 1 Minute (BYOK)',
    quickSetupDesc: 'PromptForge runs 100% inside your browser. No monthly subscriptions, no middleman markup! Just bring your OpenAI, Anthropic, or Google keys to the API Keys tab and keep 100% of your data private.',
    copySuccess: 'Copied example prompt to clipboard!',
    stepLabel: 'How to use in 3 easy steps:',
    exampleLabel: 'Click to copy test example:',
    viewInteractive: 'Try Interactive Workspace',
    tools: {
      chatdata: {
        intro: 'A secure, browser-based database analyst. Upload PDFs, sheets, or photos to analyze, create charts, or check data patterns instantly.',
        steps: [
          'Upload your CSV, Excel, or PDF document in the dashboard.',
          'Type a simple query like "Find trends in sales" or "Scan this invoice image".',
          'Inspect the real-time Recharts dashboards (Bar/Line) or interactive Knowledge Mesh node graph.'
        ],
        chip: 'Analyze sales data, highlight five key anomalies, and generate a dynamic bar chart comparing quarterly revenue.',
        features: 'Tesseract OCR, IndexedDB persistence, client-side PDF scraper (50 pages), automated trendlines.'
      },
      optimizer: {
        intro: 'Transforms weak, conversational instructions into highly structured, context-rich elite prompts using the CREATE framework.',
        steps: [
          'Paste a simple, weak prompt (e.g. "write an email").',
          'Drag the "Forge Intensity" slider to adjust details (1-100 scale).',
          'Click Forge to see AI weaknesses, strength score gauge, and run the built-in Sandbox model tester.'
        ],
        chip: 'Generate a highly detailed prompt structure using the CREATE framework to draft professional cold sales emails with explicit success criteria.',
        features: 'Forge Intensity gauges, AI-driven weaknesses audit panel, sandbox model tester, iterative expert-angle refinements.'
      },
      aiwriter: {
        intro: 'Next-generation copywriting companion that creates, refines, and translates content into 16 languages with advanced tone analysis.',
        steps: [
          'Choose your Content Type (from 20 options) and desired Tone (10 options).',
          'Generate your output, then click "Humanizer" to strip typical AI clichés and phrasing.',
          'Generate A/B Variants to test different angles, or run the linguistic Tone Analyzer JSON parser.'
        ],
        chip: 'Write a persuasive luxury product description for an eco-friendly smart water bottle targeting wellness enthusiasts in Spanish.',
        features: 'Linguistic Tone Analyzer JSON parser, Content Humanizer engine, A/B Variants side-by-side parser, 20 content categories.'
      },
      library: {
        intro: 'A central repository of battle-tested prompt templates across writing, marketing, business, education, coding, and creative.',
        steps: [
          'Browse categories using filters or search for specific keywords.',
          'Click the heart icon to save favorite prompts to your local storage.',
          'Click "Deploy" to copy the prompt and instantly populate it into the AI Writer for immediate generation.'
        ],
        chip: 'Browse the Marketing prompts to find and deploy the ultimate "LSI Keyword Cluster Architect" template.',
        features: '60+ template presets, Favorites system in localStorage, one-click Deploy redirection.'
      },
      compare: {
        intro: 'Side-by-side comparative playground to evaluate answers from two AI models concurrently and find the perfect match.',
        steps: [
          'Type your prompt in the arena text area.',
          'Select Model A (e.g., Llama 3.3) and Model B (e.g., GPT-4o-mini).',
          'Execute concurrent calls using Promise.allSettled and read the autonomous AI Judge verdict.'
        ],
        chip: 'Compare how GPT-4o and Claude 3.5 evaluate logical reasoning problems about scheduling constraints.',
        features: 'Promise.allSettled concurrent execution, independent Judge evaluation verdict, full OpenRouter catalog support.'
      },
      codehelper: {
        intro: 'Senior-level coding companion that writes, refines, documents, and performs comprehensive static security checks.',
        steps: [
          'Select your task (e.g. debug, write tests, optimize) and specify your language.',
          'Paste code changes or describe commits to generate Conventional Git Commit logs.',
          'Paste a code block into the Security Audit panel to get vulnerability maps, exact lines, and drop-in safe replacements.'
        ],
        chip: 'Find vulnerabilities in a basic Express.js login handler with SQL injection risk, and output the exact drop-in secure code.',
        features: 'Conventional Git Commit msg generator, Security Audit panel, 10 tasks across 18 languages.'
      },
      datawizard: {
        intro: 'An elite development center for SQL queries, formulas, regular expressions, visual plots, and complex data pipelines.',
        steps: [
          'Choose your target engine (SQL, Excel, Pandas, Regex, MongoDB, DAX).',
          'Input your database schemas or sample data rows in the advanced parameter fields.',
          'Set your optimization tier (Readable to Enterprise) and inspect the performance efficiency score audit.'
        ],
        chip: 'Generate a PostgreSQL query with recursive CTE to calculate employee hierarchy, optimized for performance and heavily commented.',
        features: '4 optimization tiers, JSON performance/security audit, schema and sample data parsing, pipeline progress tracker.'
      },
      seo: {
        intro: 'All-in-one SEO dashboard to dominate search engines. Simulates SERP clicks, scores drafts, and generates metadata.',
        steps: [
          'Type a seed keyword to get intent volume and Low-Competition semantic LSIs.',
          'Simulate Google search CTR snippet lookups based on title pixel widths.',
          'Paste your article draft to generate circular ScoreRings (Density, Readability, Semantics, Structure).'
        ],
        chip: 'Analyze the seed keyword "best zero backend SaaS strategies" and generate Article structured Schema JSON-LD metadata.',
        features: 'SERP visual CTR pixel-meter simulator, Topic Hub-and-Spoke cluster maps, 5-point Content Scorer circles.'
      },
      search: {
        intro: 'Real-time deep web intelligence crawler powered by Jina AI. Scrapes urls or queries and generates analytical dossiers.',
        steps: [
          'Input a URL (like "https://news.ycombinator.com") or search query (like "AI trends 2026").',
          'Watch the animated Radar Ping progress indicator as crawlers deploy and scrapers fetch content.',
          'Explore structured dossiers (Entity Map, Compare & Contrast) and run follow-up Q&A sandboxed terminal.'
        ],
        chip: 'Scrape "AI tech industry breakthroughs 2026", summarize timeline analysis, and trace direct entity mappings.',
        features: 'Jina AI direct API scraping, single/double pass crawls, Radar crawler animation, 6 dossier formats.'
      },
      inventor: {
        intro: 'Real-time debate simulation featuring specialized AI persona cards to brainstorm, critique, and synthesize startup concepts.',
        steps: [
          'Enter a business concept or ambitious goal.',
          'Watch 4 specialized personas (Visionary, Hacker, Analyst, Critic) argue in live debate panels.',
          'Examine the Master Blueprint synthesis containing timelines, tech stacks, and monetization roadmaps.'
        ],
        chip: 'Critique and build a decentralized serverless peer-to-peer code distribution hub utilizing WebRTC.',
        features: '4-Persona Debate bubbles, real-time status tracker, Synthesis Agent 30-60-90 day master roadmap.'
      },
      creator: {
        intro: 'The ultimate social media growth studio to generate viral content calendars and copy for 8 platforms.',
        steps: [
          'Select your target social network and customize parameters (Duration, Format, Tone, Goal).',
          'Use the Hook Generator to output 5 attention-grabbing scroll-stopping hooks.',
          'Deploy hooks directly into the 7-day visual calendar dashboard.'
        ],
        chip: 'Generate a 7-day TikTok visual content calendar for a serverless software engineer focused on side hustle ideas.',
        features: '8 platforms, 5 Psychology Hooks (Pain Point, curiosity), 7-Day calendar visual JSON parser.'
      },
      imageprompt: {
        intro: 'Optimizes raw text into detailed visual blueprints for Midjourney, DALL-E, or Flux, and renders art instantly.',
        steps: [
          'Type a simple scene concept (e.g. "cat in neon rain").',
          'Choose Art Style (9 presets), Aspect Ratio (6 options), and Lighting/Mood drops.',
          'Generate detailed prompt structures and render high-resolution images via basic/premium API keys.'
        ],
        chip: 'A hyper-detailed photorealistic portrait of an old cyberpunk watchmaker in neon golden hour lighting, cinematic focus.',
        features: 'Midjourney weightings, Flux/DALL-E 3 direct browser canvas render, high-res image download.'
      },
      videoprompt: {
        intro: 'Cinematography expert that outputs precise physics, camera motion, and sound specs for Sora, Runway, and Kling.',
        steps: [
          'Describe a scene or kinetic video vision.',
          'Select duration (up to 60s), atmosphere mood, and select from 8 cinematic Camera motion presets.',
          'Copy the double-engineered video prompt alongside dedicated sound design specs.'
        ],
        chip: 'Sora video prompt for a drone shot zooming out of a medieval fortress perched on a misty floating rock, dramatic orchestral sound.',
        features: '8 cinematic camera motion presets, sound engineering notes, camera specs output.'
      }
    }
  },
  hi: {
    sidebarTitle: 'PromptForge गाइड्स',
    langSelectLabel: 'भाषा चुनें:',
    quickSetup: '1 मिनट में सेटअप (BYOK)',
    quickSetupDesc: 'PromptForge 100% आपके ब्राउज़र में काम करता है। कोई मासिक शुल्क नहीं, कोई कमीशन नहीं! बस API Keys टैब में अपनी OpenAI, Claude या Google कीज़ डालें और अपने डेटा को पूरी तरह सुरक्षित रखें।',
    copySuccess: 'परीक्षण प्रॉम्प्ट कॉपी हो गया!',
    stepLabel: 'इस्तेमाल करने के 3 आसान कदम:',
    exampleLabel: 'परीक्षण उदाहरण कॉपी करने के लिए क्लिक करें:',
    viewInteractive: 'टूल खोलें',
    tools: {
      chatdata: {
        intro: 'एक सुरक्षित ब्राउज़र-आधारित डेटा विश्लेषक। PDF, स्प्रेडशीट या फ़ोटो अपलोड करें, डेटा का विश्लेषण करें, चार्ट्स बनाएं या तुरंत विसंगतियों की जाँच करें।',
        steps: [
          'डैशबोर्ड में अपनी CSV, Excel या PDF फ़ाइल अपलोड करें।',
          'सरल प्रश्न पूछें जैसे "Sales में क्या ट्रेंड है?" या "इस बिल का बिलिंग डेटा निकालें"।',
          'रीचार्ट्स डैशबोर्ड्स (Bar/Line चार्ट) या नॉलेज मेश नेटवर्क ग्राफ़ का उपयोग करें।'
        ],
        chip: 'सेल डेटा का विश्लेषण करें, 5 मुख्य गलतियां हाइलाइट करें, और तिमाही राजस्व की तुलना के लिए एक डायनामिक बार चार्ट बनाएं।',
        features: 'Tesseract OCR स्कैनर, IndexedDB स्टोरेज, इन-ब्राउज़र PDF पार्सर, ऑटो ट्रेंडलाइन जनरेटर।'
      },
      optimizer: {
        intro: 'CREATE प्रॉम्प्ट फ्रेमवर्क की मदद से साधारण निर्देशों को प्रोफेशनल, अत्यंत सटीक और मजबूत प्रॉम्प्ट्स में बदलें।',
        steps: [
          'एक साधारण प्रॉम्प्ट डालें (जैसे "एक ईमेल लिखो")।',
          'बारिकियों को सेट करने के लिए "Forge Intensity" स्लाइडर को 1-100 पर सेट करें।',
          'AI द्वारा बताई गई प्रॉम्प्ट की कमजोरियां, स्कोर और सैंडबॉक्स प्रॉम्प्ट टेस्टर पैनल देखें।'
        ],
        chip: 'पेशेवर कोल्ड सेल्स ईमेल लिखने के लिए CREATE फ्रेमवर्क का उपयोग करके एक विस्तृत प्रॉम्प्ट बनाएं जिसमें स्पष्ट सफलता मापदंड शामिल हों।',
        features: 'इंटेंसिटी रेगुलेटर, AI वीकनेस चेकर, सैंडबॉक्स प्रॉम्प्ट रनर, एक्सपर्ट-एंगल लूप्स।'
      },
      aiwriter: {
        intro: 'एक बेहतरीन कंटेंट क्रिएटर टूल जो 20 तरह के कंटेंट को 10 अलग-अलग टोन में लिखता है और AI टोन को पूरी तरह इंसानी बना देता है।',
        steps: [
          'अपने कंटेंट का प्रकार (20 विकल्प) और पसंदीदा टोन (10 विकल्प) चुनें।',
          'कंटेंट जनरेट करें और "Humanizer" बटन दबाएं ताकि AI के घिसे-पिटे शब्द हट जाएं।',
          'अलग-अलग एंगल टेस्ट करने के लिए A/B वेरिएंट्स बनाएं या Tone Analyzer का उपयोग करें।'
        ],
        chip: 'स्वास्थ्य के प्रति उत्साही लोगों के लिए स्पेनिश भाषा में एक ईको-फ्रेंडली स्मार्ट पानी की बोतल का आकर्षक लक्ज़री उत्पाद विवरण लिखें।',
        features: 'भाषाई टोन विश्लेषक JSON, कंटेंट ह्यूमनाइज़र, A/B वेरिएंट तुलना, 20 कंटेंट श्रेणियां।'
      },
      library: {
        intro: 'मार्केटिंग, कोडिंग, राइटिंग, बिजनेस और एजुकेशन श्रेणियों में 60 से अधिक बेहतरीन प्रॉम्प्ट्स का विशाल संग्रह।',
        steps: [
          'फिल्टर या कीवर्ड्स की मदद से प्रॉम्प्ट्स को सर्च करें।',
          'अपने पसंदीदा प्रॉम्प्ट्स को लोकल स्टोरेज में सेव करने के लिए दिल (Heart) के आइकन पर क्लिक करें।',
          'प्रॉम्प्ट को कॉपी करने और उसे तुरंत AI Writer में डालने के लिए "Deploy" पर क्लिक करें।'
        ],
        chip: 'प्रॉम्प्ट लाइब्रेरी में जाकर "LSI कीवर्ड क्लस्टर आर्किटेक्ट" का उपयोग करें।',
        features: '60+ प्रॉम्प्ट प्रीसेट्स, Favorites लोकल स्टोरेज, डायरेक्ट डिप्लॉय रीडायरेक्शन।'
      },
      compare: {
        intro: 'एक साथ दो अलग-अलग AI मॉडल्स के उत्तरों की आमने-सामने तुलना करें और सर्वश्रेष्ठ मॉडल का चुनाव करें।',
        steps: [
          'अपना प्रॉम्प्ट इनपुट एरिया में लिखें।',
          'मॉडल A (जैसे Llama 3.3) और मॉडल B (जैसे GPT-4o) को चुनें।',
          'दोनों से एक साथ उत्तर पाने के लिए जेनरेट करें और AI जज का अंतिम फैसला पढ़ें।'
        ],
        chip: 'तुलना करें कि जटिल शेड्यूलिंग समस्याओं को सुलझाने में GPT-4o और Claude 3.5 में से कौन सा मॉडल बेहतर है।',
        features: 'समानांतर कॉल्स (Promise.allSettled), स्वतंत्र AI जज डिसीजन, पूरा ओपनराउटर सपोर्ट।'
      },
      codehelper: {
        intro: 'एक सीनियर डेवलपर टूल जो 18 प्रोग्रामिंग भाषाओं में कोड लिखता है, बग्स ढूँढता है और सुरक्षा ऑडिट करता है।',
        steps: [
          'अपना काम (debug, optimize, explain) और अपनी प्रोग्रामिंग भाषा चुनें।',
          'कोड बदलाव डालें और एकदम सही Conventional Commit मेसेज जनरेट करें।',
          'Security Audit पैनल में कोड पेस्ट करके कमजोरियाँ और सुरक्षित रिप्लेसमेंट कोड देखें।'
        ],
        chip: 'एक एक्सप्रेस लॉगिन हैंडलर में कमजोरियाँ ढूंढें जिसमें SQL इंजेक्शन का खतरा है, और सुरक्षित ड्रॉप-इन कोड दिखाएं।',
        features: 'कन्वेंशनल कमिट बिल्डर, सिक्योरिटी ऑडिट JSON, 18 भाषाएं और 10 मुख्य कोडिंग काम।'
      },
      datawizard: {
        intro: 'SQL क्वेरी, एक्सेल फ़ॉर्मूले, पांडा स्क्रिप्ट, रेगुलर एक्सप्रेशंस और डेटा विज़ुअलाइज़ेशन फ़ाइलों के लिए सबसे उन्नत डेटा स्टूडियो।',
        steps: [
          'अपना इंजन चुनें (SQL, Excel, Pandas, Regex, MongoDB)।',
          'एडवांस्ड पैरामीटर टैब में अपना डेटा स्कीमा या सैंपल डेटा पेस्ट करें।',
          'ऑप्टिमाइज़ेशन मोड (Readable से Enterprise) सेट करें और दक्षता स्कोर ऑडिट रिपोर्ट देखें।'
        ],
        chip: 'कर्मचारियों की पदानुक्रम सूची की गणना के लिए एक PostgreSQL recursive CTE क्वेरी बनाएं जो पूरी तरह से ऑप्टिमाइज़्ड हो।',
        features: '4 ऑप्टिमाइज़ेशन मोड, JSON परफॉरमेंस/सिक्योरिटी ऑडिट, स्कीमा पार्सिंग, प्रोग्रेस ट्रैकर।'
      },
      seo: {
        intro: 'सर्च इंजन रैंकिंग में शीर्ष पर पहुँचने के लिए कीवर्ड वॉल्यूम, SERP क्लिक और स्कीमा बनाने का ऑल-इन-वन कंट्रोल रूम।',
        steps: [
          'बीज कीवर्ड (Seed Keyword) डालें और कम कंपटीशन वाले LSI कीवर्ड्स की लिस्ट पाएं।',
          'टाइटल और डिस्क्रिप्शन की पिक्सेल चौड़ाई के आधार पर Google SERP पर क्लिक-थ्रू-रेट का सिमुलेशन देखें।',
          'डबल-चेक करने के लिए अपना कंटेंट पेस्ट करें और circular ScoreRings में अंक देखें।'
        ],
        chip: 'बीज कीवर्ड "best zero backend SaaS strategies" का विश्लेषण करें और स्कीमा JSON-LD जेनरेट करें।',
        features: 'पिक्सेल-मीटर SERP सिम्युलेटर, हब-एंड-स्पोक क्लस्टर मैप, 5-पॉइंट कंटेंट स्कोरर रिंग्स।'
      },
      search: {
        intro: 'Jina AI द्वारा संचालित इंटरनेट सर्च इंजन जो डायरेक्ट URL या कीवर्ड्स को रीयल-टाइम में क्रॉल और स्क्रैप करके विश्लेषण तैयार करता है।',
        steps: [
          'कोई भी वेबसाइट URL (जैसे "https://github.com") या कीवर्ड्स डालें।',
          'एनिमेटेड रडार स्क्रीन पर लाइव क्रॉलिंग की प्रगति देखें।',
          'इंटेलीजेंस डोजियर रिपोर्ट पढ़ें और फॉलो-अप सैंडबॉक्स टर्मिनल में अतिरिक्त सवाल पूछें।'
        ],
        chip: '"AI tech industry breakthroughs 2026" को स्क्रैप करें और टाइमलाइन एनालिसिस की रिपोर्ट बनाएं।',
        features: 'Jina AI API इंटीग्रेशन, सिंगल/डबल पास स्क्रैपिंग, रडार पिंग स्क्रीन, 6 डोजियर रिपोर्ट।'
      },
      inventor: {
        intro: 'चार विशेषज्ञ AI दिमागों (Visionary, Hacker, Analyst, Critic) के बीच लाइव स्टार्टअप विचारों का रीयल-टाइम डिबेट सिमुलेटर।',
        steps: [
          'अपना नया बिजनेस विचार या महत्वकांक्षी लक्ष्य टाइप करें।',
          'चारों AI विशेषज्ञों को लाइव डिबेट बॉक्स में आपस में बहस करते हुए देखें।',
          'अंतिम Master Blueprint देखें जिसमें कोडिंग आर्किटेक्चर और कमाई का रोडमैप शामिल है।'
        ],
        chip: 'WebRTC तकनीक का उपयोग करके एक विकेन्द्रीकृत सर्वरलेस पीयर-टू-पीयर कोड डिस्ट्रीब्यूशन हब का विचार और रोडमैप तैयार करें।',
        features: '4-पर्सना डिबेट बॉक्सेस, लाइव स्टेटस इंडिकेटर, Synthesis Agent 30-60-90 डेज टाइमलाइन।'
      },
      creator: {
        intro: '8 सोशल मीडिया प्लेटफॉर्म्स के लिए वायरल होने वाला वीडियो कंटेंट, पोस्ट्स और 7-दिन का शेड्यूलिंग कैलेंडर बनाने का टूल।',
        steps: [
          'सोशल नेटवर्क चुनें और कंटेंट की अवधि, टोन और टारगेट गोल सेट करें।',
          'Hook Generator दबाकर 5 ध्यान आकर्षित करने वाले वायरल हुक्स बनाएं।',
          'हुक्स को सीधा 7-दिवसीय विजुअल कंटेंट कैलेंडर कार्ड्स में डिप्लॉय करें।'
        ],
        chip: 'एक सर्वरलेस कोडिंग चैनल के लिए 7-दिन का टिकटॉक विज़ुअलाइज़्ड कंटेंट कैलेंडर बनाएं।',
        features: '8 प्लेटफॉर्म्स, 5 साइकोलॉजिकल हुक्स (Curiosity, Pain Point), 7-दिवसीय विजुअल JSON पार्सर।'
      },
      imageprompt: {
        intro: 'Midjourney, Stable Diffusion या DALL-E के लिए प्रॉम्प्ट इंजीनियरिंग करें और FLUX/DALL-E 3 के ज़रिए तुरंत इमेज बनाएं।',
        steps: [
          'एक साधारण सीन लिखें (जैसे "neon city rain")।',
          'कला शैली (9 प्रीसेट्स), अनुपात (6 आकार) और मूड चुनें।',
          'मजबूत प्रॉम्प्ट्स जनरेट करें और API कीज़ के साथ सीधे स्क्रीन पर इमेज बनाकर डाउनलोड करें।'
        ],
        chip: 'नियॉन गोल्डन ऑवर लाइटिंग में एक बूढ़े साइबरपंक घड़ीसाज़ का हाइपर-डिटेल्ड फोटो-रियलिस्टिक पोर्ट्रेट, सिनेमैटिक फोकस।',
        features: 'Midjourney/Flux प्रॉम्प्ट आर्किटेक्ट, डायरेक्ट ब्राउज़र इमेज रेंडरर, हाई-रेज डाउनलोड बटन।'
      },
      videoprompt: {
        intro: 'Sora, Kling, Runway Gen-3 के लिए सटीक कैमरा फिजिक्स, साउंड डिज़ाइन स्पेसिफिकेशन्स और सिनेमैटोग्राफी प्रॉम्प्ट्स।',
        steps: [
          'अपने वीडियो का सीन या कॉन्सेप्ट टाइप करें।',
          'वीडियो की अवधि, लाइटिंग मूड और 8 सिनेमैटिक कैमरा मोशन प्रीसेट्स में से चुनाव करें।',
          'सिनमैटोग्राफिक प्रॉम्प्ट और विस्तृत साउंड/म्यूजिक डिज़ाइन नोट्स कॉपी करें।'
        ],
        chip: 'एक मध्यकालीन किला जो धुंधली तैरती चट्टान पर स्थित है, उससे ड्रोन कैमरे के धीरे-धीरे बाहर निकलने का Sora वीडियो प्रॉम्प्ट।',
        features: '8 सिनेमैटिक कैमरा प्रीसेट्स, साउंड इंजीनियरिंग गाइड्स, टेक्निकल कैमरा स्पेसिफिकेशन्स।'
      }
    }
  },
  hin: {
    sidebarTitle: 'PromptForge Guides',
    langSelectLabel: 'Language Select Karo:',
    quickSetup: '1 Minute Setup (BYOK)',
    quickSetupDesc: 'PromptForge 100% aapke browser ke andar chalta hai. Koi monthly fees nahi, koi middleman commissions nahi! Bas API Keys tab me jaakar apni OpenAI, Claude ya Google keys paste karo aur 100% data private rakho.',
    copySuccess: 'Test Example clipboard pe copy ho gaya!',
    stepLabel: 'Kaise use kare (3 easy steps):',
    exampleLabel: 'Test karne ke liye example click karke copy kare:',
    viewInteractive: 'Tool Launch Karo',
    tools: {
      chatdata: {
        intro: 'Ek dum secure browser-based data analyst. PDFs, Excel sheets, ya photo upload karo aur analyze, chart generator, ya data check karo instant Bina Server load ke.',
        steps: [
          'Dashboard me apni CSV, Excel, ya PDF file upload karo.',
          'Puchho simple query jaise "Sales ka trend batao" ya "Is receipt ka details scan karo".',
          'Real-time Recharts charts (Bar/Line) aur interactive Knowledge Mesh graph check karo.'
        ],
        chip: 'Analyze sales data, highlight 5 key anomalies, aur ek dynamic bar chart create karo comparing quarterly revenue.',
        features: 'Tesseract OCR image reader, IndexedDB database storage, client-side PDF indexer (50 pages max), automatic trendlines.'
      },
      optimizer: {
        intro: 'Aapke basic aur weak prompts ko CREATE framework ke logic se ek dum elite aur high-context expert prompts me convert karega.',
        steps: [
          'Koi bhi simple prompt type karo (e.g. "write a blog").',
          'Forge Intensity slider ko drag karke parameters set karo (1-100 level).',
          'AI-driven score gauge, weaknesses analysis, aur dynamic Sandbox model tester run karo.'
        ],
        chip: 'Generate a highly detailed prompt structure using the CREATE framework to draft professional cold sales emails with explicit success criteria.',
        features: 'Forge Intensity sliders, AI circular Score Gauge, weaknesses checks, Sandbox prompt model run.'
      },
      aiwriter: {
        intro: 'Aapka supreme copywriter companion jo 20 types ke content likh sakta hai 10 tones me, aur isme AI clichés hatane wala Humanizer bhi hai.',
        steps: [
          'Content Type (20 options) aur output Tone (10 options) select karo.',
          'Content generator ke baad "Humanizer" click karo taaki pure AI jargon clean ho jaye.',
          'Double check karne ke liye A/B variants run karo ya detailed JSON Tone Analyzer check karo.'
        ],
        chip: 'Write a persuasive luxury product description for an eco-friendly smart water bottle targeting wellness enthusiasts in Spanish.',
        features: 'JSON Tone Analyzer, Humanizer engine, A/B Variants parser, 20 content dropdown options.'
      },
      library: {
        intro: '60 se zyada battle-tested prompts ka bank jo Writing, Marketing, Coding, Business, and Education me divided hai.',
        steps: [
          'Filters ya keywords se specific prompt category search karo.',
          'Dil (Heart) click karke prompts favorites list me direct add karo.',
          'Deploy button dabaakar direct prompt ko AI Writer screen me copy and load karo.'
        ],
        chip: 'Browse the Marketing prompts to find and deploy the ultimate "LSI Keyword Cluster Architect" template.',
        features: '60+ pre-engineered templates, localStorage favorite persistence, one-click Deploy logic.'
      },
      compare: {
        intro: 'Dual-arena comparison tool jaha aap ek prompt ko 2 alag LLM models me concurrently run karke unka winner judge kar sakte ho.',
        steps: [
          'Prompt box me query type karo.',
          'Model A aur Model B select karo dropdown list se.',
          'Run parallel calls (Promise.allSettled) aur autonomous AI Judge ka ultimate Verdict read karo.'
        ],
        chip: 'Compare how GPT-4o and Claude 3.5 evaluate logical reasoning problems about scheduling constraints.',
        features: 'Promise.allSettled multi-calling, automated Verdict judge parser, full local/remote model list.'
      },
      codehelper: {
        intro: 'Aapka personal Senior Software Engineer jo clean coding, debugging, git commit generation, aur strict security reviews handle karega.',
        steps: [
          'Select karo co-developer task (debug, optimize, tests) aur programming language.',
          'Git diff check logic ke sath clear Conventional Git Commit outputs generated karo.',
          'Security Audit tab me code paste karo exact security metrics level, line locations, aur drop-in secure fixes pane ke liye.'
        ],
        chip: 'Find vulnerabilities in a basic Express.js login handler with SQL injection risk, and output the exact drop-in secure code.',
        features: 'Conventional Commit option, line-by-line Security Audit panel, 10 tasks across 18 coding languages.'
      },
      datawizard: {
        intro: 'SQL Queries, complex Excel formulas, Pandas, Regex patterns, aur visual Plotly generators ke liye sabse hardcore engine.',
        steps: [
          'Database query type (SQL, MongoDB, Sheets, Regex) choose karo.',
          'Schemas ya key datasets parameters insert karo parameters fields me.',
          'Readable se Enterprise modes slider set karo aur comprehensive performance/security audit details examine karo.'
        ],
        chip: 'Generate a PostgreSQL query with recursive CTE to calculate employee hierarchy, optimized for performance and heavily commented.',
        features: '4 optimization profiles, schema & sample data inputs, JSON efficiency reports, progress pipeline animation.'
      },
      seo: {
        intro: 'Dominating search engines room. CTR estimate karo, schema metadata builder karo, aur circular metrics check karo.',
        steps: [
          'Keyword search karke Low-Competition related queries & semantic LSIs check karo.',
          'Title tag aur description Google visual simulation me test karo CTR pikkels width check karne ke liye.',
          'Draft page content paste karo 5 circular ScoreRings results analysis pane ke liye.'
        ],
        chip: 'Analyze the seed keyword "best zero backend SaaS strategies" and generate Article structured Schema JSON-LD metadata.',
        features: 'Google search CTR visual simulator, Hub-and-Spoke cluster layouts, content audit ScoreRings.'
      },
      search: {
        intro: 'Super web crawler scraper tool powered by Jina AI. Search keywords ya direct URL scrape karke deep dossier data compile karega.',
        steps: [
          'Target URL ya complex search topic search query area me fill karo.',
          'Live radar pings scan dashboard pe status crawl check karo.',
          'Scraped insights, Entity Maps read karo aur Sandbox terminal follow-up Q&A run karo.'
        ],
        chip: 'Scrape "AI tech industry breakthroughs 2026", summarize timeline analysis, and trace direct entity mappings.',
        features: 'Jina AI scrapers integration, single/deep multi-pass crawls, Radar crawler animation, 6 dossiers.'
      },
      inventor: {
        intro: 'Startups thoughts generator debate platform jisme 4 specialist Personas real-time me aapas me deep discussion run karte hain.',
        steps: [
          'Concept business idea box me type karo.',
          'Specialist cards (Visionary, Hacker, Analyst, Critic) ki live simulation fight watch karo screen par.',
          'Synthesis Agent ka comprehensive Master 30-60-90 day timeline timeline download karo.'
        ],
        chip: 'Critique and build a decentralized serverless peer-to-peer code distribution hub utilizing WebRTC.',
        features: '4 specialist Persona bubbles, Real-time debate loops, Synthesis Agent master roadmaps.'
      },
      creator: {
        intro: 'Viral engagement grow karne ke liye best social assistant. Scroll-stopper hooks templates aur visual content calendar builder.',
        steps: [
          'Network category aur post format configuration specify karo.',
          'Hook Generator dabbao 5 psychology hooks (Pain Point, Curiosity Gap) generate karne ke liye.',
          'Dynamic visual 7-day calendar dashboard check karo visual calendar structure pane ke liye.'
        ],
        chip: 'Generate a 7-day TikTok visual content calendar for a serverless software engineer focused on side hustle ideas.',
        features: '8 channels, 5 psychology hooks classes, visual 7-Day calendar JSON parser.'
      },
      imageprompt: {
        intro: 'Midjourney structures generate karo, aur standard FLUX or DALL-E renderers use karke browser me photo render click high-res download karo.',
        steps: [
          'Scene prompt description type karo.',
          'Choose karo Art style presets (9 presets) aur Aspect Ratio controls.',
          'Direct prompt structures details generate karo, check direct browser canvas and download image.'
        ],
        chip: 'A hyper-detailed photorealistic portrait of an old cyberpunk watchmaker in neon golden hour lighting, cinematic focus.',
        features: 'Midjourney weight tags, Flux & DALL-E 3 direct browser canvas, high-res instant downloads.'
      },
      videoprompt: {
        intro: 'Video models (Sora, Kling, Runway) ke liye epic camera logic description presets, cinematography sound parameters generator.',
        steps: [
          'Direct video visual idea write down karo.',
          'Video durations options aur lighting choose karo.',
          'Choose camera motions (8 motion paths) aur dual sound specification text generation check copy karo.'
        ],
        chip: 'Sora video prompt for a drone shot zooming out of a medieval fortress perched on a misty floating rock, dramatic orchestral sound.',
        features: '8 camera presets paths, cinematic atmospheres, sound specifications engineering notes.'
      }
    }
  },
  es: {
    sidebarTitle: 'Guías PromptForge',
    langSelectLabel: 'Seleccionar idioma:',
    quickSetup: 'Configuración en 1 Minuto (BYOK)',
    quickSetupDesc: 'PromptForge se ejecuta 100% en tu navegador. ¡Sin suscripciones mensuales, sin intermediarios! Simplemente ingresa tus claves de OpenAI, Claude o Google en la pestaña API Keys y mantén tus datos 100% privados.',
    copySuccess: '¡Ejemplo copiado al portapapeles!',
    stepLabel: 'Cómo usar en 3 sencillos pasos:',
    exampleLabel: 'Haz clic para copiar el ejemplo de prueba:',
    viewInteractive: 'Abrir Herramienta',
    tools: {
      chatdata: {
        intro: 'Un analista de datos seguro en tu navegador. Sube archivos PDF, Excel o imágenes para analizarlos, crear gráficos o detectar patrones al instante.',
        steps: [
          'Sube tu archivo CSV, Excel o PDF en el panel principal.',
          'Escribe una consulta simple como "Encontrar tendencias de ventas" o "Escanear esta factura".',
          'Explora los gráficos de Recharts en tiempo real o el mapa interactivo Knowledge Mesh.'
        ],
        chip: 'Analice los datos de ventas, resalte cinco anomalías clave y genere un gráfico de barras dinámico comparando los ingresos trimestrales.',
        features: 'OCR Tesseract, base de datos IndexedDB, lector PDF de 50 páginas, detección de tendencias.'
      },
      optimizer: {
        intro: 'Transforma instrucciones simples y débiles en prompts élite altamente estructurados y con contexto rico usando el marco CREATE.',
        steps: [
          'Pega una instrucción básica (por ejemplo: "escribe un correo").',
          'Ajusta la intensidad de forja con el control deslizante (escala 1-100).',
          'Haz clic en Forge para ver la puntuación de fuerza circular, auditoría de debilidades y el probador de prompts Sandbox.'
        ],
        chip: 'Genere una estructura de prompt muy detallada utilizando el marco CREATE para redactar correos electrónicos de ventas profesionales.',
        features: 'Regulador Forge Intensity, circular Score Gauge, probador de prompts Sandbox.'
      },
      aiwriter: {
        intro: 'Redactor de contenidos avanzado que genera 20 tipos de textos en 10 tonos y humaniza los escritos eliminando clichés de IA.',
        steps: [
          'Selecciona tu Tipo de Contenido (20 opciones) y el Tono deseado (10 opciones).',
          'Haz clic en "Humanizer" para que el texto suene 100% humano y natural.',
          'Genera variantes A/B para probar diferentes enfoques o usa el analizador lingüístico JSON.'
        ],
        chip: 'Escriba una descripción persuasiva de un producto de lujo para una botella de agua inteligente y ecológica dirigida a entusiastas del bienestar en español.',
        features: 'Analizador de tono JSON, Humanizador lingüístico, variantes A/B, 20 categorías.'
      },
      library: {
        intro: 'Un catálogo centralizado de más de 60 plantillas de prompts optimizadas para marketing, escritura, desarrollo, negocios y educación.',
        steps: [
          'Explora las plantillas usando los filtros o realiza búsquedas por palabra clave.',
          'Guarda tus favoritos en el almacenamiento local usando el icono del corazón.',
          'Haz clic en "Deploy" para copiar y cargar el prompt automáticamente en el AI Writer.'
        ],
        chip: 'Busque en los prompts de marketing para encontrar y desplegar la plantilla definitiva "LSI Keyword Cluster Architect".',
        features: 'Más de 60 plantillas, favoritos en almacenamiento local, redirección Deploy rápida.'
      },
      compare: {
        intro: 'Compara respuestas de dos modelos de IA cara a cara de forma simultánea para descubrir cuál ofrece el mejor resultado.',
        steps: [
          'Escribe tu pregunta en el cuadro de texto.',
          'Selecciona los dos modelos que deseas comparar (A y B).',
          'Ejecuta llamadas simultáneas con Promise.allSettled y lee el veredicto del juez IA independiente.'
        ],
        chip: 'Compare cómo GPT-4o y Claude 3.5 evalúan problemas de razonamiento lógico sobre restricciones de programación.',
        features: 'Llamadas simultáneas, veredicto independiente Judge IA, catálogo OpenRouter completo.'
      },
      codehelper: {
        intro: 'Tu compañero desarrollador senior que escribe código en 18 lenguajes, crea commits convencionales y realiza auditorías de seguridad.',
        steps: [
          'Elige la tarea de desarrollo (depurar, escribir pruebas) y el lenguaje.',
          'Pega tus cambios de código para generar mensajes de Git Commit bajo el estándar convencional.',
          'Usa el panel de Auditoría de Seguridad para detectar vulnerabilidades exactas y ver drop-in de reemplazo seguro.'
        ],
        chip: 'Encuentre vulnerabilidades en un manejador de inicio de sesión básico de Express.js con riesgo de inyección SQL y muestre el código seguro.',
        features: 'Generador Git Commit, panel de Auditoría de Seguridad JSON, 10 tareas de código.'
      },
      datawizard: {
        intro: 'Estudio de desarrollo de datos de nivel élite para generar consultas SQL, fórmulas de Excel, scripts de Pandas, Regex y pipelines de MongoDB.',
        steps: [
          'Elige el tipo de motor de datos (SQL, MongoDB, Excel, Pandas, Regex).',
          'Inserta el esquema de tu base de datos o datos de prueba.',
          'Configura el nivel de optimización (Readable a Enterprise) y analiza la puntuación de eficiencia.'
        ],
        chip: 'Genere una consulta PostgreSQL con CTE recursiva para calcular la jerarquía de empleados, optimizada para rendimiento.',
        features: '4 niveles de optimización, informe de eficiencia JSON, carga de esquemas y datos.'
      },
      seo: {
        intro: 'Controla el SEO de tus proyectos. Simula clics en el buscador de Google, puntúa borradores y genera esquemas JSON-LD.',
        steps: [
          'Busca palabras clave y obtén sugerencias LSI de baja competencia.',
          'Simula el CTR visual y píxeles de títulos en el simulador de Google SERP.',
          'Pega tu borrador para analizar la densidad y cobertura en los ScoreRings dinámicos.'
        ],
        chip: 'Analice la palabra clave semilla "best zero backend SaaS strategies" y genere metadatos Schema JSON-LD del artículo.',
        features: 'Simulador SERP visual CTR píxeles, mapas Topic Clusters, anillos de puntuación ScoreRings.'
      },
      search: {
        intro: 'Rastreador inteligente en tiempo real impulsado por Jina AI. Escanea URLs o consultas web y genera informes dossier.',
        steps: [
          'Introduce la URL de un sitio web o un término de búsqueda.',
          'Observa el indicador de radar animado mientras los rastreadores extraen los datos.',
          'Explora los informes temáticos y haz preguntas de seguimiento en la terminal Sandbox.'
        ],
        chip: 'Extraiga "AI tech industry breakthroughs 2026", resuma el análisis de la línea de tiempo y trace mapas de entidades.',
        features: 'API Jina AI directa, rastreo simple/doble, indicador radar, terminal Sandbox Q&A.'
      },
      inventor: {
        intro: 'Simulador de debate de ideas de negocio en tiempo real. 4 expertos de IA discuten y sintetizan planes maestros de startups.',
        steps: [
          'Escribe tu idea de negocio o concepto de startup.',
          'Observa cómo debaten en vivo el Visionario, el Hacker, el Analista y el Crítico.',
          'Descarga el Plan Maestro sintetizado con la arquitectura técnica y el plan de monetización.'
        ],
        chip: 'Critique y construya un centro de distribución de código descentralizado peer-to-peer sin servidor utilizando WebRTC.',
        features: 'Debate interactivo de 4 personas, agente Synthesis, hoja de ruta 30-60-90 días.'
      },
      creator: {
        intro: 'Estudio definitivo para creadores de contenido. Genera calendarios virales y ganchos psicólogicos para 8 redes sociales.',
        steps: [
          'Elige la red social y configura tono, duración y objetivos.',
          'Genera 5 ganchos virales diseñados con psicología de scroll-stopping.',
          'Despliega los contenidos directamente en el calendario visual de 7 días.'
        ],
        chip: 'Genere un calendario de contenido visual de TikTok de 7 días para un ingeniero de software sin servidor centrado en ideas de proyectos paralelos.',
        features: 'Soporte para 8 redes sociales, 5 tipos de ganchos de parada, calendario visual JSON.'
      },
      imageprompt: {
        intro: 'Crea prompts visuales avanzados para Midjourney o DALL-E, y renderiza obras de arte instantáneamente desde tu navegador.',
        steps: [
          'Escribe una descripción básica de la escena que imaginas.',
          'Selecciona la relación de aspecto, estilo de arte (9 opciones) y ambiente/iluminación.',
          'Genera prompts detallados y obtén imágenes de alta resolución en el lienzo digital.'
        ],
        chip: 'Un retrato fotorrealista hiperdetallado de un viejo relojero cyberpunk con iluminación de hora dorada de neón, enfoque cinematográfico.',
        features: 'Soporte Midjourney tags, render digital Flux & DALL-E 3, descarga instantánea.'
      },
      videoprompt: {
        intro: 'Director de cine digital. Genera prompts detallados para Sora, Runway y Kling con presets de movimiento de cámara.',
        steps: [
          'Escribe el concepto visual o escena de tu video.',
          'Define la duración, ambiente y uno de los 8 presets de movimiento de cámara cinematográfico.',
          'Copia el prompt optimizado junto con especificaciones técnicas de sonido.'
        ],
        chip: 'Prompt de video Sora para una toma de dron que se aleja de una fortaleza medieval situada en una roca flotante brumosa.',
        features: '8 presets de movimiento de cámara cinematográficos, notas de sonido y música.'
      }
    }
  },
  fr: {
    sidebarTitle: 'Guides PromptForge',
    langSelectLabel: 'Choisir la langue :',
    quickSetup: 'Configuration en 1 Minute (BYOK)',
    quickSetupDesc: 'PromptForge s\'exécute à 100% dans votre navigateur. Pas d\'abonnements mensuels, pas d\'intermédiaires ! Saisissez simplement vos clés OpenAI, Anthropic ou Google dans l\'onglet API Keys pour garder vos données privées.',
    copySuccess: 'Exemple copié dans le presse-papiers !',
    stepLabel: 'Comment utiliser en 3 étapes simples :',
    exampleLabel: 'Cliquez pour copier l\'exemple de test :',
    viewInteractive: 'Lancer l\'outil',
    tools: {
      chatdata: {
        intro: 'Analyste de données sécurisé dans le navigateur. Téléchargez des PDF, des feuilles de calcul ou des images pour analyser, créer des graphiques et vérifier les anomalies.',
        steps: [
          'Téléchargez votre document CSV, Excel ou PDF dans le tableau de bord.',
          'Posez des questions simples comme "Trouver les tendances des ventes" ou "Scanner cette facture".',
          'Explorez les graphiques de Recharts en temps réel ou le graphe interactif Knowledge Mesh.'
        ],
        chip: 'Analysez les données de vente, mettez en évidence 5 anomalies et générez un graphique à barres dynamique pour comparer les revenus.',
        features: 'OCR Tesseract, base IndexedDB, lecteur PDF client (50 pages), détection automatique des tendances.'
      },
      optimizer: {
        intro: 'Transforme des consignes basiques et imprécises en prompts d\'élite hautement structurés à l\'aide du framework CREATE.',
        steps: [
          'Collez une instruction simple (ex: "écrire un e-mail").',
          'Ajustez la jauge "Forge Intensity" (échelle 1-100) pour définir les détails.',
          'Cliquez sur Forge pour voir le score, les faiblesses détectées et le testeur de prompt Sandbox.'
        ],
        chip: 'Générez une structure de prompt détaillée avec le framework CREATE pour rédiger des e-mails professionnels.',
        features: 'Régulateur d\'intensité, Score Gauge circulaire, testeur de prompt Sandbox, angles d\'expertise.'
      },
      aiwriter: {
        intro: 'Compagnon de rédaction de nouvelle génération qui crée, affine et humanise le contenu dans 16 langues en supprimant les expressions clichés d\'IA.',
        steps: [
          'Sélectionnez votre Type de Contenu (20 options) et le Ton désiré (10 options).',
          'Générez votre contenu, puis cliquez sur "Humanizer" pour un rendu naturel et fluide.',
          'Générez des variantes A/B pour tester d\'autres approches ou lancez l\'analyseur de ton JSON.'
        ],
        chip: 'Rédigez une description persuasive de produit de luxe pour une gourde intelligente écologique ciblant les adeptes du bien-être en espagnol.',
        features: 'Analyseur de ton JSON, Humaniseur de texte IA, variantes A/B, 20 catégories.'
      },
      library: {
        intro: 'Un catalogue centralisé de plus de 60 modèles de prompts optimisés pour le marketing, la rédaction, le code, les affaires et l\'éducation.',
        steps: [
          'Explorez les modèles à l\'aide des filtres ou faites des recherches par mots-clés.',
          'Sauvegardez vos favoris dans le stockage local grâce à l\'icône cœur.',
          'Cliquez sur "Deploy" pour copier et charger automatiquement le prompt dans l\'AI Writer.'
        ],
        chip: 'Recherchez les prompts marketing pour trouver et déployer le modèle ultime "LSI Keyword Cluster Architect".',
        features: 'Plus de 60 modèles, favoris stockés localement, intégration rapide Deploy.'
      },
      compare: {
        intro: 'Comparez instantanément les réponses de deux modèles d\'IA côte à côte pour trouver celle qui correspond le mieux à vos exigences.',
        steps: [
          'Saisissez votre question dans la zone de texte.',
          'Sélectionnez les deux modèles d\'IA à comparer (A et B).',
          'Lancez l\'exécution parallèle via Promise.allSettled et lisez la décision du juge IA indépendant.'
        ],
        chip: 'Comparez la façon dont GPT-4o et Claude 3.5 évaluent les problèmes de raisonnement logique sur les contraintes de calendrier.',
        features: 'Appels parallèles, évaluation automatique du juge IA, catalogue complet OpenRouter.'
      },
      codehelper: {
        intro: 'Votre compagnon développeur senior qui code dans 18 langages, crée des commits conventionnels et effectue des audits de sécurité.',
        steps: [
          'Sélectionnez votre tâche de développement (déboguer, optimiser, tester) et le langage.',
          'Collez vos modifications de code pour générer des messages de Git Commit conventionnels.',
          'Utilisez le panneau d\'Audit de Sécurité pour lister les vulnérabilités et voir les solutions sécurisées.'
        ],
        chip: 'Trouvez les failles de sécurité d\'un script Express.js avec des risques d\'injection SQL et affichez le code corrigé.',
        features: 'Générateur de commit, audit de sécurité JSON, 10 tâches et 18 langages de programmation.'
      },
      datawizard: {
        intro: 'Studio de développement de données élite pour requêtes SQL, formules Excel, scripts Pandas, Regex et pipelines MongoDB.',
        steps: [
          'Sélectionnez le type de moteur de données (SQL, Excel, Pandas, Regex, MongoDB).',
          'Saisissez le schéma de votre base de données ou un jeu d\'essai.',
          'Définissez le niveau d\'optimisation (Readable à Enterprise) et vérifiez le score d\'efficacité.'
        ],
        chip: 'Générez une requête PostgreSQL avec CTE récursive pour calculer la hiérarchie des employés.',
        features: '4 modes d\'optimisation, rapport d\'efficacité JSON, intégration schéma/données.'
      },
      seo: {
        intro: 'Tableau de bord SEO complet pour dominer les moteurs de recherche. Simule le CTR, note les brouillons et génère des schémas.',
        steps: [
          'Recherchez un mot-clé pour obtenir son intention et des variantes LSI à faible concurrence.',
          'Simulez l\'affichage et les píxels des titres sur le moteur de recherche Google.',
          'Collez votre texte pour analyser sa qualité dans les ScoreRings interactifs.'
        ],
        chip: 'Analysez le mot-clé "best zero backend SaaS strategies" et générez les métadonnées Schema JSON-LD de l\'article.',
        features: 'Simulateur Google SERP, Topic Clusters maps, graphiques de score ScoreRings.'
      },
      search: {
        intro: 'Moteur de recherche intelligent en temps réel propulsé par Jina AI. Scanne des URLs ou mots-clés et génère des dossiers.',
        steps: [
          'Entrez l\'URL d\'un site web ou un mot-clé de recherche.',
          'Regardez l\'indicateur radar animé s\'activer pendant l\'extraction des données.',
          'Explorez les dossiers analytiques et posez des questions dans le terminal Sandbox.'
        ],
        chip: 'Extraire "AI tech industry breakthroughs 2026", résumer l\'analyse de la chronologie et tracer les entités.',
        features: 'Scraping direct Jina AI, crawls simple/double, radar ping interactif, terminal Sandbox.'
      },
      inventor: {
        intro: 'Simulateur de débat de startup en temps réel. 4 experts IA discutent et conçoivent vos plans d\'affaires.',
        steps: [
          'Saisissez votre concept d\'entreprise ou votre projet de startup.',
          'Regardez débattre en direct le Visionnaire, le Hacker, l\'Analyste et le Critique.',
          'Obtenez le Plan Directeur final avec la stack technique et le plan de rentabilité.'
        ],
        chip: 'Critiquer et concevoir un hub décentralisé de distribution de code peer-to-peer sans serveur avec WebRTC.',
        features: 'Débat interactif à 4 personnes, agent Synthesis, roadmap 30-60-90 jours.'
      },
      creator: {
        intro: 'Studio ultime de croissance sur les réseaux sociaux. Génère des calendriers viraux et des hooks pour 8 plateformes.',
        steps: [
          'Sélectionnez le réseau social et configurez le format, la durée et l\'objectif.',
          'Générez 5 ganchos accrocheurs conçus avec de la psychologie comportementale.',
          'Déployez les idées de posts directement dans le calendrier visuel de 7 jours.'
        ],
        chip: 'Générez un calendrier de contenu visuel TikTok de 7 jours pour un ingénieur logiciel sans serveur.',
        features: 'Support pour 8 plateformes, 5 types de hooks accrocheurs, calendrier visuel JSON.'
      },
      imageprompt: {
        intro: 'Générez des prompts visuels pour Midjourney ou DALL-E, et affichez les images instantanément dans le navigateur.',
        steps: [
          'Décrivez une scène simple (ex: "un chat sous la pluie de néons").',
          'Sélectionnez les dimensions, le style (9 choix) et l\'ambiance lumineuse.',
          'Générez les prompts détaillés et affichez les images haute résolution pour les télécharger.'
        ],
        chip: 'Portrait fotorréaliste ultra-détaillé d\'un vieil horloger cyberpunk sous une lumière néon à l\'heure dorée.',
        features: 'Tags Midjourney optimisés, rendu Flux et DALL-E 3 direct, téléchargement HD.'
      },
      videoprompt: {
        intro: 'Générateur de prompts vidéo professionnels pour Sora, Runway et Kling avec presets de mouvements de caméra.',
        steps: [
          'Décrivez le concept ou la scène de votre vidéo.',
          'Définissez la durée, l\'ambiance et l\'un des 8 presets de mouvement de caméra.',
          'Copiez le prompt et les instructions audio et de bruitage.'
        ],
        chip: 'Prompt vidéo Sora d\'une prise de vue drone s\'éloignant d\'une forteresse médiévale perchée sur un rocher flottant brumeux.',
        features: '8 presets de mouvements de caméra de cinéma, notes audio et effets sonores.'
      }
    }
  },
  ja: {
    sidebarTitle: 'PromptForge ガイド',
    langSelectLabel: '言語を選択:',
    quickSetup: '1分間でセットアップ (BYOK)',
    quickSetupDesc: 'PromptForgeは100%お使いのブラウザ上で動作します。月額料金不要、仲介手数料ゼロ！API Keysタブでお持ちのOpenAI、Claude、またはGoogleのキーを入力するだけで、プライバシーを100%保護してご利用いただけます。',
    copySuccess: 'テスト用プロンプトをクリップボードにコピーしました！',
    stepLabel: '使い方は簡単な3ステップ:',
    exampleLabel: 'クリックしてテスト例をコピー:',
    viewInteractive: 'ツールを開く',
    tools: {
      chatdata: {
        intro: '安全なブラウザベースのデータアナリスト。PDF、スプレッドシート、または画像をアップロードして、データの分析、グラフ化、異常値チェックを即座に実行できます。',
        steps: [
          'ダッシュボードにCSV、Excel、またはPDFドキュメントをアップロードします。',
          '「売上トレンドを見つけて」や「この請求書をスキャンして」といったシンプルな質問を入力します。',
          'リアルタイムのRechartsダッシュボード（棒/折れ線グラフ）やインタラクティブな知識メッシュグラフを確認します。'
        ],
        chip: '売上データを分析し、5つの主な異常値を強調表示し、四半期ごとの収益を比較するダイナミックな棒グラフを生成します。',
        features: 'Tesseract OCRスキャナー、IndexedDBデータ保存、ブラウザ用PDFリーダー（最大50ページ）、自動トレンドライン。'
      },
      optimizer: {
        intro: 'CREATEプロンプトフレームワークを使用して、シンプルで曖昧な指示を高度に構造化されたエリートプロンプトへ最適化します。',
        steps: [
          '単純なプロンプトを入力します（例: 「メールを書いて」）。',
          '「Forge Intensity」スライダーを調整して詳細度を設定します（1-100レベル）。',
          '「Forge」をクリックして、AI分析による弱点チェック、強度スコア、およびサンドボックスプロンプトテスターを確認します。'
        ],
        chip: '明確な成功基準を含めたプロフェッショナルなコールドセールスメールを作成するために、CREATEフレームワークを使用して非常に詳細なプロンプトを作成します。',
        features: '強度調整スライダー、AI弱点チェックパネル、サンドボックスプロンプトランナー、専門的アングル調整。'
      },
      aiwriter: {
        intro: '20種類のコンテンツを10種類のトーンで作成し、AIの不自然な表現を取り除いて100%人間らしい文章に仕上げる高度なライティングツール。',
        steps: [
          'コンテンツタイプ（20択）と希望するトーン（10択）を選択します。',
          'コンテンツを生成後、「Humanizer」をクリックしてAI特有の定型表現や言葉遣いを削除します。',
          '別のアングルをテストするためにA/Bバリアントを生成するか、Tone Analyzerでトーンを詳細分析します。'
        ],
        chip: '健康に関心のある人々をターゲットにした、スペイン語での環境に優しいスマート水筒の魅力的な高級製品説明を書いてください。',
        features: '言語トーン分析JSON、人間化（Humanizer）エンジン、A/Bバリアント並列比較、20コンテンツカテゴリ。'
      },
      library: {
        intro: 'ライティング、マーケティング、ビジネス、教育、コーディングなど、各分野で実証済みの60個以上の高度なプロンプトを集約したプロンプト集。',
        steps: [
          'フィルターや検索ワードを使用して、特定のプロンプトカテゴリを探します。',
          'ハートのアイコンをクリックして、お気に入りのプロンプトをブラウザのローカルストレージに保存します。',
          '「Deploy」をクリックすると、プロンプトがコピーされ、AI Writer画面に即座に読み込まれます。'
        ],
        chip: 'プロンプトライブラリから「LSIキーワードクラスター構築」を選択して適用します。',
        features: '60個以上の厳選テンプレート、ローカルストレージお気に入り保存、ダイレクト適用読み込み。'
      },
      compare: {
        intro: '1つのプロンプトに対して2つの異なるAIモデルの回答を同時に取得し、どちらの品質が優れているか直接比較評価します。',
        steps: [
          'テキストエリアにプロンプトを入力します。',
          '比較したいモデルA（例: Llama 3.3）とモデルB（例: GPT-4o）を選択します。',
          'Promise.allSettledで並列呼び出しを実行し、独立したAI判定モデル（Judge）の最終的な勝者評価を読みます。'
        ],
        chip: 'スケジュール制限に関する論理的推論問題の評価において、GPT-4oとClaude 3.5がどのように回答するか比較します。',
        features: '並列呼び出し（Promise.allSettled）、独立AIジャッジによる勝者判定、多様なOpenRouterモデル対応。'
      },
      codehelper: {
        intro: '18のプログラミング言語に対応し、コードのデバッグ、最適化、Conventional Commitメッセージの作成、セキュリティ分析を行います。',
        steps: [
          '開発タスク（デバッグ、最適化、テスト作成）とプログラミング言語を選択します。',
          'コードの差分や説明を入力し、Conventional Commitメッセージのオプションを取得します。',
          'Security Auditパネルにコードを貼り付け、脆弱性レベル、行数、安全な置き換えコードを確認します。'
        ],
        chip: 'SQLインジェクションのリスクがある基本的なExpress.jsログインハンドラーの脆弱性を検出し、安全な代替コードを出力します。',
        features: 'コミットメッセージジェネレーター、脆弱性分析JSONパネル、18言語および10種類の開発タスク。'
      },
      datawizard: {
        intro: 'SQLクエリ、Excelの複雑な数式、Pandas、Regexパターン、およびMongoDBなどの各種データベーススクリプトを生成する高度なデータ開発ツール。',
        steps: [
          '生成するデータエンジン（SQL、MongoDB、Excel、Pandas、Regex）を選択します。',
          'アドバンスドタブで、データベースのスキーマ構造またはサンプルデータを入力します。',
          '最適化レベル（ReadableからEnterprise）を設定し、生成コードのパフォーマンス効率スコアを確認します。'
        ],
        chip: '従業員の階層構造を計算するために、再帰CTEを使用したPostgreSQLクエリを生成します（パフォーマンス最適化版）。',
        features: '4つの最適化プロファイル、効率/安全分析JSON、スキーマ入力フォーム、進行状況トラッカー。'
      },
      seo: {
        intro: '検索順位で上位を獲得するためのオールインワンSEOダッシュボード。LSIキーワード分析、SERPクリック測定、スキーマ生成を実行。',
        steps: [
          '対象キーワードを入力して、競合の少ないLSIキーワードやキーワードのインテントを取得します。',
          'タイトルと説明のピクセル幅に基づいて、Google SERPシミュレーターでCTR（クリック率）の見え方を確認します。'
        ],
        chip: '対象キーワード「best zero backend SaaS strategies」を分析し、記事用のArticle構造化データ（JSON-LD）を生成します。',
        features: 'Google SERPピクセルシミュレーター、ハブ＆スポークトピッククラスターマップ、5つ星コンテンツスコアリング。'
      },
      search: {
        intro: 'Jina AIを搭載したリアルタイムの検索・スクレイピング・解析ダッシュボード。URLまたはキーワードから詳細レポートを作成します。',
        steps: [
          'ターゲットURLまたは検索キーワードを入力します。',
          'エニマティックなレーダー画面でライブのデータ取得の進行状況を確認します。',
          '生成されたタイムライン分析やエンティティマップを読み、Sandbox端末で追加の質問をします。'
        ],
        chip: '「AI tech industry breakthroughs 2026」をクロールし、年表分析レポートを作成します。',
        features: 'Jina AI API接続、シングル/ディープマルチパスクロール、レーダー進行状況画面、6種類のレポート。'
      },
      inventor: {
        intro: '4人の専門家AI（Visionary, Hacker, Analyst, Critic）を召喚し、あなたのビジネスアイデアを多角的に批評しタイムラインを合成するシミュレーター。',
        steps: [
          'ビジネスアイデアまたはビジネスゴールを入力します。',
          '4つの専門家カードがライブの議論パネルで対立討論を行う様子を見守ります。',
          '最終的に合成された、技術仕様と収益ロードマップを含む30-60-90日タイムラインを確認します。'
        ],
        chip: 'WebRTC技術を使用した、サーバーレスかつ分散型のピアツーピアコード配信プラットフォームの設計とアイデアを検証します。',
        features: '4名による対話シミュレーター、討論状況インジケーター、ロードマップ自動合成。'
      },
      creator: {
        intro: 'Instagram Reels、LinkedIn、TikTok、Twitterなど8つのSNS向けに、スクロールを止めるフックや7日間のコンテンツカレンダーを生成。',
        steps: [
          '投稿するSNSを選択し、期間、形式、トーン、およびプロモ目標を設定します。',
          'Hook Generatorを使用して、スクロールを止めさせる5つの心理的フックを作成します。',
          'カレンダーに投稿案をロードし、7日間の視覚的投稿プランを検討します。'
        ],
        chip: '個人開発やサーバーレス開発者を対象とした、TikTok向けの7日間の動画投稿カレンダーを自動作成します。',
        features: '8種類のソーシャルメディア対応、5つのスクロール停止フック、7日間ビジュアルプランナー。'
      },
      imageprompt: {
        intro: 'MidjourneyやStable Diffusion用のプロンプトを最適化し、FLUX/DALL-E 3のキー接続でその場で画像を作成・保存できます。',
        steps: [
          '作成したい画像の説明を入力します（例: 「猫とネオンの雨」）。',
          'アートスタイル（9 presets）と縦横比（6アスペクト）を選択します。',
          '最適化されたプロンプトを作成し、画像化してダウンロード保存します。'
        ],
        chip: 'ネオンとゴールデンアワーの照明に照らされた、サイバーパンクの老時計職人の非常に詳細なポートレート画像、映画的フォーカス。',
        features: 'Midjourney重み付け最適化、FluxおよびDALL-E 3ブラウザレンダリング、HD保存。'
      },
      videoprompt: {
        intro: 'SoraやRunway、KlingビデオAI向けに、物理演算、カメラワーク、サウンド設計指定を含めた高精度のプロンプトを作成します。',
        steps: [
          '動画のコンセプトまたはアクションを書き込みます。',
          '動画の長さ、雰囲気、および8種類のシネマティックカメラモーションを選択します。',
          '生成された映像指示テキストおよび音響設計用メモをコピーします。'
        ],
        chip: '霧の中に浮かぶ岩山の上にそびえ立つ中世の城から、ドローンカメラがゆっくりとズームアウトするSora動画用プロンプト。',
        features: '8シネマティックカメラプリセット、音響設計指定、撮影カメラテクニカル出力。'
      }
    }
  }
};

const Docs = () => {
  const { showToast } = useContext(AppContext);
  const navigate = useNavigate();
  const [lang, setLang] = useState('en');
  const [activeTool, setActiveTool] = useState('chatdata');
  const [copied, setCopied] = useState(false);

  const t = TRANSLATIONS[lang];
  const activeToolMeta = TOOLS_METADATA.find(m => m.id === activeTool) || TOOLS_METADATA[0];
  const toolData = t.tools[activeTool];

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast(t.copySuccess, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const ToolIcon = activeToolMeta.icon;

  return (
    <div className="tool-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', minHeight: '90vh' }}>
      {/* HEADER SECTION WITH LANGUAGE SWITCHER */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)', fontWeight: 800, fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
            <BookOpen size={18} /> Documentation Hub
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, background: 'linear-gradient(to right, #fff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
            {t.sidebarTitle}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text3)' }}>{t.langSelectLabel}</label>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                style={{
                  background: lang === l.code ? 'var(--accent)' : 'transparent',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {l.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }} className="docs-grid-responsive">
        
        {/* SIDEBAR NAVIGATION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text3)', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '0 8px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              13 Core Workbench Tools
            </div>
            
            <div style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px', paddingRight: '4px', marginTop: '8px' }}>
              {TOOLS_METADATA.map((m) => {
                const isSelected = activeTool === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveTool(m.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: isSelected ? 'rgba(124,92,252,0.3)' : 'transparent',
                      background: isSelected ? 'linear-gradient(135deg, rgba(124,92,252,0.2), rgba(56,189,248,0.1))' : 'transparent',
                      color: isSelected ? 'var(--accent2)' : 'var(--text2)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        e.currentTarget.style.color = '#fff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text2)';
                      }
                    }}
                  >
                    <Icon size={16} style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* QUICK BYOK SETTINGS */}
          <div className="glass-card" style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(167,139,250,0.05), transparent)', border: '1px solid rgba(167,139,250,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent2)', fontWeight: 800, fontSize: '12px', marginBottom: '8px' }}>
              <Key size={14} /> {t.quickSetup}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text3)', lineHeight: 1.5, margin: 0 }}>
              {t.quickSetupDesc}
            </p>
          </div>
        </div>

        {/* DETAILED WALKTHROUGH MAIN CONTENT */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTool}-${lang}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="glass-card"
            style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}
          >
            {/* Tool Title & Category */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent), var(--accent3))', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 0 20px var(--glow)' }}>
                  <ToolIcon size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent2)', letterSpacing: '2px', textTransform: 'uppercase' }}>
                    {activeToolMeta.category}
                  </div>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: '4px 0 0' }}>{activeToolMeta.title}</h2>
                </div>
              </div>
              
              <button 
                onClick={() => navigate(`/dashboard/${activeTool}`)}
                className="lp-btn lp-btn-primary" 
                style={{ padding: '8px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {t.viewInteractive} <ArrowRight size={14} />
              </button>
            </div>

            {/* Intro text */}
            <div style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '16px 20px', borderRadius: '12px', borderLeft: '3px solid var(--accent)' }}>
              <Info size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
              <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                {toolData.intro}
              </p>
            </div>

            {/* Step Walkthrough */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>{t.stepLabel}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {toolData.steps.map((step, index) => (
                  <div key={index} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(124,92,252,0.1)', border: '1px solid var(--accent)', color: 'var(--accent2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                      0{index + 1}
                    </div>
                    <div style={{ fontSize: '13.5px', color: 'var(--text2)', lineHeight: 1.6, paddingTop: '2px' }}>
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Click-to-Test Chip */}
            <div style={{ marginTop: '10px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>{t.exampleLabel}</h4>
              <div 
                onClick={() => handleCopy(toolData.chip)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  gap: '12px', 
                  background: 'rgba(0,0,0,0.5)', 
                  border: '1px solid rgba(255,255,255,0.06)', 
                  borderRadius: '12px', 
                  padding: '14px 20px', 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.background = 'rgba(0,0,0,0.5)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Zap size={16} style={{ color: 'var(--accent2)', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontFamily: 'monospace', lineHeight: 1.5 }}>
                    "{toolData.chip}"
                  </span>
                </div>
                <div style={{ color: copied ? 'var(--green)' : 'var(--text3)', flexShrink: 0 }}>
                  {copied ? <Check size={18} /> : <Copy size={16} />}
                </div>
              </div>
            </div>

            {/* Technical Specifications */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px 20px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text3)', fontWeight: 600 }}>Engine Specifications:</span>
              <span style={{ color: 'var(--accent2)', fontWeight: 700 }}>{toolData.features}</span>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>

      <style jsx="true">{`
        @media (max-width: 900px) {
          .docs-grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Docs;
