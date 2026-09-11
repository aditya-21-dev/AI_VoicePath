/**
 * VoicePath Mock Data Layer
 * Team: Code Red | Track: Edutech | Year: 2026
 *
 * Rich canonical datasets adhering to the VoicePath NLP profile schema.
 * Features:
 *   1. Primary Canonical Persona: Textile Shop Worker ("Priya Sharma")
 *      Demo Phrase: "I have worked in a textile shop for four years. I operate sewing machines, manage stock and handle customers."
 *   2. Secondary Persona: Data Science & Analytics Specialist ("Alex Rivera")
 *
 * Schema:
 *   Profile.skills[] → { canonical_name, category, raw_phrase, evidence, confidence, inference_type }
 *   inference_type   ∈ ['explicit', 'implicit', 'inferred']
 */

export const DEMO_TEXTILE_TRANSCRIPT =
  'I have worked in a textile shop for four years. I operate sewing machines, manage stock and handle customers.';

// ==============================================================================
// 1. CANONICAL PERSONA: Textile Shop Worker (Priya Sharma)
// ==============================================================================

export const TEXTILE_WORKER_SKILLS = [
  {
    canonical_name: 'Industrial Sewing Machine Operation',
    category: 'Technical & Machine Craft',
    raw_phrase: 'I operate sewing machines',
    evidence: 'Direct statement demonstrating hands-on operation of single-needle, overlock, and stitching machinery in an apparel environment.',
    confidence: 0.98,
    inference_type: 'explicit',
  },
  {
    canonical_name: 'Inventory & Stock Management',
    category: 'Logistics & Store Operations',
    raw_phrase: 'manage stock',
    evidence: 'Explicit responsibility for stock auditing, SKU tracking, fabric bolt storage, shrinkage control, and stock replenishment.',
    confidence: 0.96,
    inference_type: 'explicit',
  },
  {
    canonical_name: 'Customer Relationship & Service',
    category: 'Client Facing & Sales',
    raw_phrase: 'handle customers',
    evidence: 'Direct frontline responsibility for customer consultation, fabric selection assistance, pricing inquiries, and dispute handling.',
    confidence: 0.94,
    inference_type: 'explicit',
  },
  {
    canonical_name: 'Textile Quality Inspection & Fabric Grading',
    category: 'Quality Assurance',
    raw_phrase: 'worked in a textile shop for four years',
    evidence: 'Four-year continuous tenure with apparel textiles implies hands-on capability to detect weaving defects, dye variance, and seam flaws.',
    confidence: 0.88,
    inference_type: 'implicit',
  },
  {
    canonical_name: 'Garment Alteration & Seam Finishing',
    category: 'Apparel Assembly',
    raw_phrase: 'operate sewing machines',
    evidence: 'Sewing machine operation within a retail shop context routinely includes hem adjustments, seam reinforcement, and custom customer fitting.',
    confidence: 0.85,
    inference_type: 'implicit',
  },
  {
    canonical_name: 'Point-of-Sale (POS) & Billing Operations',
    category: 'Retail Systems',
    raw_phrase: 'manage stock and handle customers',
    evidence: 'Frontline customer handling paired with inventory tracking in Indian textile outlets routinely encompasses computerized billing and POS checkout.',
    confidence: 0.82,
    inference_type: 'implicit',
  },
  {
    canonical_name: 'Vendor & Consignment Logistics',
    category: 'Supply Chain Coordination',
    raw_phrase: 'manage stock',
    evidence: 'Managing stock in a 4-year retail tenure indicates receiving deliveries, verifying delivery challans, and liaising with fabric suppliers.',
    confidence: 0.74,
    inference_type: 'inferred',
  },
  {
    canonical_name: 'Shop Floor Supervision & Mentorship',
    category: 'Floor Leadership',
    raw_phrase: 'worked in a textile shop for four years',
    evidence: 'Four years of seniority on the shop floor suggests leadership during peak sales periods and onboarding junior store assistants.',
    confidence: 0.70,
    inference_type: 'inferred',
  },
];

export const TEXTILE_WORKER_PROFILE = {
  user_id: 'usr_textile_001',
  name: 'Priya Sharma',
  domain: 'Textile & Apparel Retail Operations',
  experience_years: 4,
  seniority: 'Experienced Store Associate',
  location: 'Tirupur / Coimbatore, Tamil Nadu, India',
  skills: TEXTILE_WORKER_SKILLS,
  summary:
    'Skilled textile specialist with 4 years of hands-on floor experience in garment construction machinery, stock auditing, and frontline customer engagement. Combines practical sewing craft with strong inventory and retail operations skills.',
  voice_session_id: 'sess_textile_20260911_001',
  analyzed_at: '2026-09-11T14:30:00Z',
  transcript: DEMO_TEXTILE_TRANSCRIPT,
};

export const TEXTILE_WORKER_OPPORTUNITIES = [
  {
    id: 'opp_textile_001',
    title: 'Apparel Quality Assurance (QA) Supervisor',
    company: 'Arvind Fashions Ltd',
    district: 'Chennai / Tiruvallur Industrial Corridor',
    location: 'Tiruvallur / Chennai, TN (On-site)',
    salary_range: 'INR 4.5L - 6.2L / yr',
    match_score: 0.92,
    badges: ['Verified Employer', 'High Demand', 'District Eligible', 'NSQF Level 5'],
    breakdown: {
      skill_similarity: 0.94,
      experience_match: 0.91,
      district_eligibility: 0.96,
    },
    why_matched:
      'Your 4 years of hands-on industrial sewing and fabric inspection directly satisfy Arvind Fashions tier-1 quality benchmark specs.',
    matched_skills: [
      'Industrial Sewing Machine Operation',
      'Textile Quality Inspection & Fabric Grading',
      'Inventory & Stock Management',
      'Customer Relationship & Service',
    ],
    missing_skills: ['AQL 2.5 Sampling Inspection', 'Digital Quality Audit Tools'],
    description:
      'Supervise garment finishing and stitching quality on the sewing line. Inspect seam tolerances against international buyer tech packs and lead the inspection team.',
    posted_days_ago: 1,
  },
  {
    id: 'opp_textile_002',
    title: 'Garment Production Floor Coordinator',
    company: 'Shahi Exports Pvt Ltd',
    district: 'Tirupur / Coimbatore Apparel Cluster',
    location: 'Tirupur, TN (On-site)',
    salary_range: 'INR 4.2L - 5.8L / yr',
    match_score: 0.88,
    badges: ['Immediate Joining', 'Fast Track Interview', 'District Eligible'],
    breakdown: {
      skill_similarity: 0.89,
      experience_match: 0.93,
      district_eligibility: 0.92,
    },
    why_matched:
      'Strong dual proficiency in stock inventory control and shop-floor team guidance satisfies supervisor requirements for garment assembly lines.',
    matched_skills: [
      'Industrial Sewing Machine Operation',
      'Inventory & Stock Management',
      'Shop Floor Supervision & Mentorship',
    ],
    missing_skills: ['5S Lean Manufacturing', 'Line Balancing & SAM Estimation'],
    description:
      'Coordinate stitching line operations, track fabric roll consumption, maintain operator productivity schedules, and expedite daily line output.',
    posted_days_ago: 3,
  },
  {
    id: 'opp_textile_003',
    title: 'Senior Retail Operations & Inventory Lead',
    company: 'Fabindia Overseas',
    district: 'Chennai Metropolitan / Kanchipuram',
    location: 'Chennai, TN (On-site)',
    salary_range: 'INR 3.8L - 5.2L / yr',
    match_score: 0.84,
    badges: ['Verified Employer', 'Retail Excellence', 'District Eligible'],
    breakdown: {
      skill_similarity: 0.86,
      experience_match: 0.88,
      district_eligibility: 0.95,
    },
    why_matched:
      'Demonstrated excellence in customer handling, POS billing, and fabric weave grading matches Fabindia flagship store standards.',
    matched_skills: [
      'Customer Relationship & Service',
      'Inventory & Stock Management',
      'Point-of-Sale (POS) & Billing Operations',
      'Textile Quality Inspection & Fabric Grading',
    ],
    missing_skills: ['Visual Merchandising', 'Omnichannel Returns ERP'],
    description:
      'Lead the ethnic apparel section, manage monthly physical audits, oversee cashiering workflows, and advise premium clients on handcrafted weaves.',
    posted_days_ago: 4,
  },
  {
    id: 'opp_textile_004',
    title: 'Sample Room Finishing Technician',
    company: 'Gokaldas Exports',
    district: 'Bangalore / Hosur Border Corridor',
    location: 'Bangalore, KA',
    salary_range: 'INR 4.0L - 5.5L / yr',
    match_score: 0.81,
    badges: ['Export Unit', 'Skill Certified'],
    breakdown: {
      skill_similarity: 0.84,
      experience_match: 0.85,
      district_eligibility: 0.80,
    },
    why_matched:
      'Machine proficiency and garment alteration experience qualify for sample construction and trial runs.',
    matched_skills: [
      'Industrial Sewing Machine Operation',
      'Garment Alteration & Seam Finishing',
      'Textile Quality Inspection & Fabric Grading',
    ],
    missing_skills: ['Tech Pack Interpretation', 'CAD Pattern Grading'],
    description:
      'Assemble prototype buyer samples, troubleshoot stitch tensions on delicate textiles, and ensure export-ready seam finishes before mass production.',
    posted_days_ago: 6,
  },
];

export const TEXTILE_WORKER_SKILL_GAP = {
  target_role: 'Apparel Quality Assurance (QA) Supervisor',
  current_skills: [
    'Industrial Sewing Machine Operation',
    'Inventory & Stock Management',
    'Customer Relationship & Service',
    'Textile Quality Inspection & Fabric Grading',
    'Garment Alteration & Seam Finishing',
    'Point-of-Sale (POS) & Billing Operations',
  ],
  required_skills: [
    'Industrial Sewing Machine Operation',
    'Textile Quality Inspection & Fabric Grading',
    'Inventory & Stock Management',
    'AQL 2.5 Sampling Inspection',
    'Garment Defect Classification (Critical/Major/Minor)',
    'Digital Quality Audit Tools',
    '5S Lean Manufacturing',
    'Tech Pack Interpretation',
  ],
  gap_skills: [
    {
      skill: 'AQL 2.5 Sampling Inspection',
      priority: 'high',
      estimated_hours: 24,
      reason: 'Global standard for statistical sampling and acceptable quality limits in apparel export inspection.',
    },
    {
      skill: 'Garment Defect Classification',
      priority: 'high',
      estimated_hours: 18,
      reason: 'Formal taxonomy of stitching defects (skip stitch, puckering, needle cutting) and fabric flaws.',
    },
    {
      skill: 'Digital Quality Audit Tools',
      priority: 'medium',
      estimated_hours: 16,
      reason: 'Using tablet-based quality apps for real-time seam inspection logging instead of manual paper tallies.',
    },
    {
      skill: '5S Lean Manufacturing',
      priority: 'medium',
      estimated_hours: 12,
      reason: 'Standard visual organization and safety system for organizing sewing lines and eliminating bottlenecks.',
    },
    {
      skill: 'Tech Pack Interpretation',
      priority: 'low',
      estimated_hours: 20,
      reason: 'Interpreting buyer measurement spec sheets, seam allowances, and bills of materials.',
    },
  ],
  readiness_score: 0.74,
};

export const TEXTILE_WORKER_LEARNING_PATH = {
  target_role: 'Apparel Quality Assurance (QA) Supervisor',
  total_estimated_weeks: 8,
  phases: [
    {
      phase: 1,
      title: 'AQL 2.5 & Statistical Inspection Fundamentals',
      duration_weeks: 2,
      skills: ['AQL 2.5 Sampling Inspection'],
      resources: [
        {
          title: 'Apparel Quality Management & AQL Inspection (NIFT Guidelines)',
          type: 'course',
          url: 'https://swayam.gov.in/apparel-quality-standards',
          free: true,
        },
        {
          title: 'Statistical Quality Control in Garment Manufacturing',
          type: 'documentation',
          url: 'https://textilelearner.net/quality-control-in-garment-industry/',
          free: true,
        },
      ],
    },
    {
      phase: 2,
      title: 'Garment Defect Taxonomy & Seam Analysis',
      duration_weeks: 2,
      skills: ['Garment Defect Classification'],
      resources: [
        {
          title: 'Visual Field Guide to Sewing & Fabric Defects',
          type: 'guide',
          url: 'https://onlineclothingstudy.com/garment-defects-guide/',
          free: true,
        },
        {
          title: 'ASTM D6193 Standard Practice for Stitches and Seams',
          type: 'standard',
          url: 'https://astm.org/standards/d6193',
          free: true,
        },
      ],
    },
    {
      phase: 3,
      title: 'Digital Quality Logging & Floor ERP Systems',
      duration_weeks: 2,
      skills: ['Digital Quality Audit Tools'],
      resources: [
        {
          title: 'Digital Quality Control on Apparel Production Lines',
          type: 'tutorial',
          url: 'https://textiletuts.com/digital-qc-apparel/',
          free: true,
        },
      ],
    },
    {
      phase: 4,
      title: '5S Lean Organization & Tech Pack Execution',
      duration_weeks: 2,
      skills: ['5S Lean Manufacturing', 'Tech Pack Interpretation'],
      resources: [
        {
          title: '5S Visual Workplace for Garment Manufacturing',
          type: 'course',
          url: 'https://www.coursera.org/learn/lean-5s',
          free: true,
        },
        {
          title: 'Reading & Auditing Apparel Tech Packs',
          type: 'tutorial',
          url: 'https://techpacks.co/guide',
          free: true,
        },
      ],
    },
  ],
};

export const TEXTILE_WORKER_WHAT_IF = {
  base_profile: {
    domain: TEXTILE_WORKER_PROFILE.domain,
    experience_years: TEXTILE_WORKER_PROFILE.experience_years,
    skills: TEXTILE_WORKER_SKILLS.map((s) => s.canonical_name),
  },
  scenarios: [
    {
      id: 'wif_textile_001',
      label: 'Add AQL 2.5 Sampling & Inspection',
      added_skills: ['AQL 2.5 Sampling Inspection', 'Garment Defect Classification'],
      projected_match_boost: 0.18,
      new_roles_unlocked: ['Apparel QA Supervisor', 'Senior Floor QA Auditor'],
      salary_impact: '+INR 1.2L - 1.8L avg. increase (+35%)',
    },
    {
      id: 'wif_textile_002',
      label: 'Add CAD Pattern Grading & Tech Packs',
      added_skills: ['Tech Pack Interpretation', 'CAD Pattern Grading'],
      projected_match_boost: 0.22,
      new_roles_unlocked: ['Sample Room Lead', 'Garment Pattern Technician'],
      salary_impact: '+INR 1.8L - 2.5L avg. increase (+48%)',
    },
    {
      id: 'wif_textile_003',
      label: 'Pivot to Retail Store Management & ERP',
      added_skills: ['Visual Merchandising', 'Retail ERP & Tally Prime', 'Team Leadership'],
      projected_match_boost: 0.15,
      new_roles_unlocked: ['Assistant Store Manager', 'Apparel Section Floor Lead'],
      salary_impact: '+INR 1.4L - 2.0L avg. increase (+40%)',
    },
  ],
};

export const TEXTILE_WORKER_VOICE_ANALYSIS = {
  session_id: 'sess_textile_20260911_001',
  transcript: DEMO_TEXTILE_TRANSCRIPT,
  duration_seconds: 18,
  detected_language: 'en-IN',
  profile: TEXTILE_WORKER_PROFILE,
};

// ==============================================================================
// 2. TECH PERSONA: Data Science & Analytics (Alex Rivera)
// ==============================================================================

export const TECH_SKILLS = [
  {
    canonical_name: 'Python',
    category: 'Programming Languages',
    raw_phrase: 'I write Python scripts to automate our data pipelines',
    evidence: 'Speaker directly stated Python usage in a data-engineering context.',
    confidence: 0.97,
    inference_type: 'explicit',
  },
  {
    canonical_name: 'Machine Learning',
    category: 'AI & Data Science',
    raw_phrase: 'built and deployed ML models for customer churn prediction',
    evidence: 'Explicit mention of model building and deployment lifecycle.',
    confidence: 0.94,
    inference_type: 'explicit',
  },
  {
    canonical_name: 'SQL',
    category: 'Database & Warehousing',
    raw_phrase: 'query our Postgres warehouse daily to pull metrics',
    evidence: 'Direct reference to SQL querying against a relational data warehouse.',
    confidence: 0.92,
    inference_type: 'explicit',
  },
  {
    canonical_name: 'Data Visualisation',
    category: 'Analytics & BI',
    raw_phrase: 'I present dashboards to the leadership team every quarter',
    evidence: 'Implied creation of visual reports for stakeholder communication.',
    confidence: 0.78,
    inference_type: 'implicit',
  },
  {
    canonical_name: 'Communication',
    category: 'Professional Skills',
    raw_phrase: 'explain model results to non-technical stakeholders',
    evidence: 'Inferred strong verbal and written communication from cross-functional role.',
    confidence: 0.72,
    inference_type: 'inferred',
  },
  {
    canonical_name: 'Cloud Computing (AWS)',
    category: 'Cloud Infrastructure',
    raw_phrase: 'we use S3 and Lambda for our ETL jobs',
    evidence: 'Named AWS services in active use within a production ETL context.',
    confidence: 0.88,
    inference_type: 'explicit',
  },
  {
    canonical_name: 'Docker',
    category: 'DevOps & Containers',
    raw_phrase: 'containerise everything before shipping to prod',
    evidence: 'Implicit reference to containerisation workflow consistent with Docker usage.',
    confidence: 0.65,
    inference_type: 'inferred',
  },
  {
    canonical_name: 'Project Management',
    category: 'Leadership',
    raw_phrase: 'I lead a team of three analysts',
    evidence: 'Leading a team implies project coordination and people management skills.',
    confidence: 0.60,
    inference_type: 'inferred',
  },
];

export const TECH_PROFILE = {
  user_id: 'usr_tech_001',
  name: 'Alex Rivera',
  domain: 'Data Science & Analytics',
  experience_years: 6,
  seniority: 'Mid-Senior',
  skills: TECH_SKILLS,
  summary:
    'Experienced data professional with a strong Python and ML foundation, comfortable working across the full analytics stack from warehousing to executive dashboards.',
  voice_session_id: 'sess_tech_20260911_002',
  analyzed_at: '2026-09-11T12:00:00Z',
  transcript:
    'I write Python scripts to automate our data pipelines and I have built and deployed ML models for customer churn prediction. We query our Postgres warehouse daily to pull metrics and I present dashboards to the leadership team every quarter. I also explain model results to non-technical stakeholders and we use S3 and Lambda for our ETL jobs. We containerise everything before shipping to prod and I lead a team of three analysts.',
};

export const TECH_OPPORTUNITIES = [
  {
    id: 'opp_tech_001',
    title: 'Senior Data Scientist',
    company: 'Nexus Analytics',
    location: 'Bangalore, IN (Hybrid)',
    salary_range: 'INR 28L - 38L / yr',
    match_score: 0.91,
    matched_skills: ['Python', 'Machine Learning', 'SQL', 'Cloud Computing (AWS)'],
    missing_skills: ['Spark', 'MLflow'],
    description:
      'Lead the modelling team building real-time recommendation engines at scale using AWS and Python.',
    posted_days_ago: 2,
  },
  {
    id: 'opp_tech_002',
    title: 'ML Engineer',
    company: 'Kryptonite AI',
    location: 'Remote (India)',
    salary_range: 'INR 32L - 45L / yr',
    match_score: 0.85,
    matched_skills: ['Python', 'Machine Learning', 'Docker', 'Cloud Computing (AWS)'],
    missing_skills: ['Kubernetes', 'Terraform'],
    description:
      'Design, train and ship production ML systems end-to-end on a modern MLOps stack.',
    posted_days_ago: 5,
  },
  {
    id: 'opp_tech_003',
    title: 'Data Analytics Lead',
    company: 'FinVerse Corp',
    location: 'Mumbai, IN',
    salary_range: 'INR 22L - 30L / yr',
    match_score: 0.79,
    matched_skills: ['SQL', 'Data Visualisation', 'Communication', 'Project Management'],
    missing_skills: ['dbt', 'Looker'],
    description:
      'Own the analytics function for our fintech platform and translate data into business strategy.',
    posted_days_ago: 8,
  },
];

export const TECH_SKILL_GAP = {
  target_role: 'Senior ML Engineer',
  current_skills: ['Python', 'Machine Learning', 'SQL', 'Cloud Computing (AWS)', 'Docker'],
  required_skills: [
    'Python',
    'Machine Learning',
    'Cloud Computing (AWS)',
    'Docker',
    'Kubernetes',
    'MLflow',
    'Spark',
    'Terraform',
  ],
  gap_skills: [
    {
      skill: 'Kubernetes',
      priority: 'high',
      estimated_hours: 40,
      reason: 'Required for orchestrating containerised ML workloads at scale.',
    },
    {
      skill: 'MLflow',
      priority: 'high',
      estimated_hours: 20,
      reason: 'Standard experiment-tracking and model-registry tool in modern MLOps.',
    },
    {
      skill: 'Spark',
      priority: 'medium',
      estimated_hours: 60,
      reason: 'Needed for distributed data processing pipelines on large datasets.',
    },
    {
      skill: 'Terraform',
      priority: 'low',
      estimated_hours: 30,
      reason: 'Infrastructure-as-code for provisioning cloud resources reproducibly.',
    },
  ],
  readiness_score: 0.62,
};

export const TECH_LEARNING_PATH = {
  target_role: 'Senior ML Engineer',
  total_estimated_weeks: 16,
  phases: [
    {
      phase: 1,
      title: 'MLOps Fundamentals',
      duration_weeks: 3,
      skills: ['MLflow'],
      resources: [
        {
          title: 'MLflow Quickstart',
          type: 'documentation',
          url: 'https://mlflow.org/docs/latest/getting-started/',
          free: true,
        },
      ],
    },
    {
      phase: 2,
      title: 'Container Orchestration',
      duration_weeks: 6,
      skills: ['Kubernetes'],
      resources: [
        {
          title: 'Official Kubernetes Docs',
          type: 'documentation',
          url: 'https://kubernetes.io/docs/home/',
          free: true,
        },
      ],
    },
  ],
};

export const TECH_WHAT_IF = {
  base_profile: {
    domain: TECH_PROFILE.domain,
    experience_years: TECH_PROFILE.experience_years,
    skills: TECH_SKILLS.map((s) => s.canonical_name),
  },
  scenarios: [
    {
      id: 'wif_tech_001',
      label: 'Add Kubernetes',
      added_skills: ['Kubernetes'],
      projected_match_boost: 0.12,
      new_roles_unlocked: ['ML Platform Engineer', 'DevML Engineer'],
      salary_impact: '+INR 4L-6L avg. increase',
    },
    {
      id: 'wif_tech_002',
      label: 'Add Spark + MLflow',
      added_skills: ['Spark', 'MLflow'],
      projected_match_boost: 0.18,
      new_roles_unlocked: ['Senior ML Engineer', 'Data Platform Lead'],
      salary_impact: '+INR 6L-10L avg. increase',
    },
  ],
};

export const TECH_VOICE_ANALYSIS = {
  session_id: 'sess_tech_20260911_002',
  transcript: TECH_PROFILE.transcript,
  duration_seconds: 47,
  detected_language: 'en-IN',
  profile: TECH_PROFILE,
};

// ==============================================================================
// 3. PERSONA REGISTRY
// ==============================================================================

export const DEMO_PERSONAS = {
  textile: {
    id: 'textile',
    name: 'Priya Sharma (Textile Worker)',
    profile: TEXTILE_WORKER_PROFILE,
    skills: TEXTILE_WORKER_SKILLS,
    opportunities: TEXTILE_WORKER_OPPORTUNITIES,
    skillGap: TEXTILE_WORKER_SKILL_GAP,
    learningPath: TEXTILE_WORKER_LEARNING_PATH,
    whatIf: TEXTILE_WORKER_WHAT_IF,
    voiceAnalysis: TEXTILE_WORKER_VOICE_ANALYSIS,
    demoPhrase: DEMO_TEXTILE_TRANSCRIPT,
  },
  tech: {
    id: 'tech',
    name: 'Alex Rivera (Data Professional)',
    profile: TECH_PROFILE,
    skills: TECH_SKILLS,
    opportunities: TECH_OPPORTUNITIES,
    skillGap: TECH_SKILL_GAP,
    learningPath: TECH_LEARNING_PATH,
    whatIf: TECH_WHAT_IF,
    voiceAnalysis: TECH_VOICE_ANALYSIS,
    demoPhrase: TECH_PROFILE.transcript,
  },
};

// ==============================================================================
// 4. CANONICAL DEFAULT EXPORTS (Default to the Textile Shop Worker Demo Persona)
// ==============================================================================

export const MOCK_SKILLS = TEXTILE_WORKER_SKILLS;
export const MOCK_PROFILE = TEXTILE_WORKER_PROFILE;
export const MOCK_OPPORTUNITIES = TEXTILE_WORKER_OPPORTUNITIES;
export const MOCK_SKILL_GAP = TEXTILE_WORKER_SKILL_GAP;
export const MOCK_LEARNING_PATH = TEXTILE_WORKER_LEARNING_PATH;
export const MOCK_WHAT_IF = TEXTILE_WORKER_WHAT_IF;
export const MOCK_VOICE_ANALYSIS = TEXTILE_WORKER_VOICE_ANALYSIS;
