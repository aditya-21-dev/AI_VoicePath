/**
 * VoicePath Mock Data
 * Matches the canonical profile schema used by the backend NLP pipeline.
 *
 * Schema reference:
 *   Profile.skills[] → { canonical_name, raw_phrase, evidence, confidence, inference_type }
 *   inference_type ∈ ['explicit', 'implicit', 'inferred']
 */

// ─── Skills ────────────────────────────────────────────────────────────────────

export const MOCK_SKILLS = [
  {
    canonical_name: 'Python',
    raw_phrase: 'I write Python scripts to automate our data pipelines',
    evidence: 'Speaker directly stated Python usage in a data-engineering context.',
    confidence: 0.97,
    inference_type: 'explicit',
  },
  {
    canonical_name: 'Machine Learning',
    raw_phrase: 'built and deployed ML models for customer churn prediction',
    evidence: 'Explicit mention of model building and deployment lifecycle.',
    confidence: 0.94,
    inference_type: 'explicit',
  },
  {
    canonical_name: 'SQL',
    raw_phrase: 'query our Postgres warehouse daily to pull metrics',
    evidence: 'Direct reference to SQL querying against a relational data warehouse.',
    confidence: 0.92,
    inference_type: 'explicit',
  },
  {
    canonical_name: 'Data Visualisation',
    raw_phrase: 'I present dashboards to the leadership team every quarter',
    evidence: 'Implied creation of visual reports for stakeholder communication.',
    confidence: 0.78,
    inference_type: 'implicit',
  },
  {
    canonical_name: 'Communication',
    raw_phrase: 'explain model results to non-technical stakeholders',
    evidence: 'Inferred strong verbal and written communication from cross-functional role.',
    confidence: 0.72,
    inference_type: 'inferred',
  },
  {
    canonical_name: 'Cloud Computing (AWS)',
    raw_phrase: 'we use S3 and Lambda for our ETL jobs',
    evidence: 'Named AWS services in active use within a production ETL context.',
    confidence: 0.88,
    inference_type: 'explicit',
  },
  {
    canonical_name: 'Docker',
    raw_phrase: 'containerise everything before shipping to prod',
    evidence: 'Implicit reference to containerisation workflow consistent with Docker usage.',
    confidence: 0.65,
    inference_type: 'inferred',
  },
  {
    canonical_name: 'Project Management',
    raw_phrase: 'I lead a team of three analysts',
    evidence: 'Leading a team implies project coordination and people management skills.',
    confidence: 0.60,
    inference_type: 'inferred',
  },
];

// ─── Profile ───────────────────────────────────────────────────────────────────

export const MOCK_PROFILE = {
  user_id: 'usr_demo_001',
  name: 'Alex Rivera',
  domain: 'Data Science & Analytics',
  experience_years: 6,
  seniority: 'Mid-Senior',
  skills: MOCK_SKILLS,
  summary:
    'Experienced data professional with a strong Python and ML foundation, comfortable working across the full analytics stack from warehousing to executive dashboards.',
  voice_session_id: 'sess_20260911_001',
  analyzed_at: '2026-09-11T12:00:00Z',
};

// ─── Opportunities ─────────────────────────────────────────────────────────────

export const MOCK_OPPORTUNITIES = [
  {
    id: 'opp_001',
    title: 'Senior Data Scientist',
    company: 'Nexus Analytics',
    location: 'Bangalore, IN (Hybrid)',
    salary_range: 'INR 28L - 38L',
    match_score: 0.91,
    matched_skills: ['Python', 'Machine Learning', 'SQL', 'Cloud Computing (AWS)'],
    missing_skills: ['Spark', 'MLflow'],
    description:
      'Lead the modelling team building real-time recommendation engines at scale using AWS and Python.',
    posted_days_ago: 2,
  },
  {
    id: 'opp_002',
    title: 'ML Engineer',
    company: 'Kryptonite AI',
    location: 'Remote (India)',
    salary_range: 'INR 32L - 45L',
    match_score: 0.85,
    matched_skills: ['Python', 'Machine Learning', 'Docker', 'Cloud Computing (AWS)'],
    missing_skills: ['Kubernetes', 'Terraform'],
    description:
      'Design, train and ship production ML systems end-to-end on a modern MLOps stack.',
    posted_days_ago: 5,
  },
  {
    id: 'opp_003',
    title: 'Data Analytics Lead',
    company: 'FinVerse Corp',
    location: 'Mumbai, IN',
    salary_range: 'INR 22L - 30L',
    match_score: 0.79,
    matched_skills: ['SQL', 'Data Visualisation', 'Communication', 'Project Management'],
    missing_skills: ['dbt', 'Looker'],
    description:
      'Own the analytics function for our fintech platform and translate data into business strategy.',
    posted_days_ago: 8,
  },
];

// ─── Skill Gap ─────────────────────────────────────────────────────────────────

export const MOCK_SKILL_GAP = {
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

// ─── Learning Path ─────────────────────────────────────────────────────────────

export const MOCK_LEARNING_PATH = {
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
        {
          title: "Practical MLOps (O'Reilly)",
          type: 'book',
          url: 'https://oreilly.com/library/view/practical-mlops/9781098103002/',
          free: false,
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
          title: 'Kubernetes for Absolute Beginners - KodeKloud',
          type: 'course',
          url: 'https://kodekloud.com/courses/kubernetes-for-the-absolute-beginners-hands-on/',
          free: false,
        },
        {
          title: 'Official Kubernetes Docs',
          type: 'documentation',
          url: 'https://kubernetes.io/docs/home/',
          free: true,
        },
      ],
    },
    {
      phase: 3,
      title: 'Distributed Data Processing',
      duration_weeks: 5,
      skills: ['Spark'],
      resources: [
        {
          title: "Learning Spark, 2nd Ed. (O'Reilly)",
          type: 'book',
          url: 'https://oreilly.com/library/view/learning-spark-2nd/9781492050032/',
          free: false,
        },
        {
          title: 'Apache Spark Docs',
          type: 'documentation',
          url: 'https://spark.apache.org/docs/latest/',
          free: true,
        },
      ],
    },
    {
      phase: 4,
      title: 'Infrastructure as Code',
      duration_weeks: 2,
      skills: ['Terraform'],
      resources: [
        {
          title: 'HashiCorp Terraform Tutorial',
          type: 'tutorial',
          url: 'https://developer.hashicorp.com/terraform/tutorials',
          free: true,
        },
      ],
    },
  ],
};

// ─── What-If Scenarios ─────────────────────────────────────────────────────────

export const MOCK_WHAT_IF = {
  base_profile: {
    domain: MOCK_PROFILE.domain,
    experience_years: MOCK_PROFILE.experience_years,
    skills: MOCK_SKILLS.map((s) => s.canonical_name),
  },
  scenarios: [
    {
      id: 'wif_001',
      label: 'Add Kubernetes',
      added_skills: ['Kubernetes'],
      projected_match_boost: 0.12,
      new_roles_unlocked: ['ML Platform Engineer', 'DevML Engineer'],
      salary_impact: '+INR 4L-6L avg. increase',
    },
    {
      id: 'wif_002',
      label: 'Add Spark + MLflow',
      added_skills: ['Spark', 'MLflow'],
      projected_match_boost: 0.18,
      new_roles_unlocked: ['Senior ML Engineer', 'Data Platform Lead'],
      salary_impact: '+INR 6L-10L avg. increase',
    },
    {
      id: 'wif_003',
      label: 'Pivot to Data Engineering',
      added_skills: ['Spark', 'Terraform', 'dbt', 'Airflow'],
      projected_match_boost: 0.09,
      new_roles_unlocked: ['Senior Data Engineer', 'Analytics Engineer'],
      salary_impact: '+INR 3L-5L avg. increase',
    },
  ],
};

// ─── Voice Analysis Result ─────────────────────────────────────────────────────

export const MOCK_VOICE_ANALYSIS = {
  session_id: 'sess_20260911_001',
  transcript:
    'I write Python scripts to automate our data pipelines and I have built and deployed ML models ' +
    'for customer churn prediction. We query our Postgres warehouse daily to pull metrics and I ' +
    'present dashboards to the leadership team every quarter. I also explain model results to ' +
    'non-technical stakeholders and we use S3 and Lambda for our ETL jobs. We containerise ' +
    'everything before shipping to prod and I lead a team of three analysts.',
  duration_seconds: 47,
  detected_language: 'en-IN',
  profile: MOCK_PROFILE,
};
