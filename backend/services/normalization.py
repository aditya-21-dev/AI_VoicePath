"""Canonical skill normalization rules for VoicePath.

Maps raw transcript phrases and variations to canonical skill names.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from backend.schemas.profile import Skill


@dataclass(frozen=True)
class SkillRule:
    canonical_name: str
    patterns: tuple[str, ...]


SKILL_RULES: tuple[SkillRule, ...] = (
    # Vocational & Operations
    SkillRule("Inventory Management", (
        r"\b(?:manage|managed|managing)\s+(?:the\s+)?stock\b",
        r"\bstock\s+management\b",
        r"\b(?:handle|handling)\s+inventory\b",
        r"\binventory\s+(?:handling|management)\b",
        r"\bstock\s+manage\b",
        r"\bkeep\s+track\s+of\s+materials\s+coming\s+in\s+and\s+going\s+out\b",
    )),
    SkillRule("Customer Handling", (
        r"\b(?:handle|handled|handling|talk(?:ing)?\s+with)\s+(?:the\s+)?customers?\b",
        r"\bcustomers?[^\s]*\s+handle\b",
        r"\bcustomer\s+service\b",
        r"\bcustomer\s+relationship\b",
    )),
    SkillRule("Quality Control", (
        r"\bquality\s+control\b",
        r"\bquality\s+inspection\b",
        r"\bfabric\s+grading\b",
    )),
    SkillRule("Retail", (
        r"\bretail(?:\s+operations)?\b",
        r"\bstore\s+operations\b",
    )),
    SkillRule("Sales", (
        r"\bsales\b",
    )),

    # Frameworks with "JS" suffix (evaluated before plain JS)
    SkillRule("React", (
        r"\breact(?:\.js|js|\s+js)?\b",
    )),
    SkillRule("Node.js", (
        r"\bnode(?:\.js|js|\s+js)?\b",
    )),

    # Programming Languages
    SkillRule("Python", (
        r"\bpython(?:\s+programming)?\b",
        r"\bcoding\s+in\s+python\b",
    )),
    SkillRule("Java", (
        r"\bjava\b(?!\s*script)",
        r"\bjava\s+programming\b",
        r"\bcoding\s+in\s+java\b",
    )),
    SkillRule("JavaScript", (
        r"\bjavascript\b",
        r"\bvanilla\s+js\b",
        r"(?<!react\s)(?<!node\s)(?<!vue\s)\bjs\b",
    )),
    SkillRule("TypeScript", (
        r"\btypescript\b",
        r"\bts\b",
    )),
    SkillRule("C++", (
        r"\bc\+\+\b",
        r"\bcpp\b",
    )),
    SkillRule("C", (
        r"\bc\s+language\b",
        r"\bprogramming\s+in\s+c\b",
        r"\bc\s+programming\b",
    )),

    # Web Development
    SkillRule("HTML", (
        r"\bhtml(?:5)?\b",
    )),
    SkillRule("CSS", (
        r"\bcss(?:3)?\b",
    )),
    SkillRule("REST API", (
        r"\brest(?:\s+api|ful\s+api)?\b",
        r"\bapi\s+development\b",
        r"\bapis\b",
    )),
    SkillRule("Web Development", (
        r"\bweb(?:site)?\s+(?:application\s+)?develop(?:ment)?\b",
        r"\bwebsite\b",
        r"\bweb\s+application\b",
    )),
    SkillRule("Frontend Development", (
        r"\bfrontend(?:\s+development)?\b",
        r"\bfront[\s-]end(?:\s+development)?\b",
    )),
    SkillRule("Backend Development", (
        r"\bbackend(?:\s+development)?\b",
        r"\bback[\s-]end(?:\s+development)?\b",
    )),
    SkillRule("Full Stack Development", (
        r"\bfull[\s-]stack(?:\s+development)?\b",
    )),

    # Database
    SkillRule("SQL", (
        r"\bsql\b",
        r"\bstructured\s+query\s+language\b",
    )),
    SkillRule("MySQL", (
        r"\bmysql\b",
    )),
    SkillRule("PostgreSQL", (
        r"\bpostgres(?:ql)?\b",
    )),
    SkillRule("MongoDB", (
        r"\bmongo(?:db)?\b",
    )),
    SkillRule("Database Management", (
        r"\bdatabase\s+(?:manage|management|handling)\b",
        r"\bmanage\s+(?:a\s+)?database\b",
    )),

    # Data / Analytics
    SkillRule("Pandas", (
        r"\bpandas\b",
    )),
    SkillRule("NumPy", (
        r"\bnumpy\b",
    )),
    SkillRule("Data Analysis", (
        r"\bdata\s+analysis\b",
        r"\bdata\s+analy[sz](?:e|ed|ing)\b",
        r"\banalyse\s+data\b",
        r"\banalyze\s+data\b",
    )),
    SkillRule("Data Visualization", (
        r"\bdata\s+visuali[sz]ation\b",
    )),
    SkillRule("Microsoft Excel", (
        r"\b(?:microsoft\s+)?excel\b",
    )),
    SkillRule("Power BI", (
        r"\bpower\s*bi\b",
    )),
    SkillRule("Tableau", (
        r"\btableau\b",
    )),

    # Machine Learning / AI
    SkillRule("Machine Learning", (
        r"\bmachine\s+learning\b",
        r"\bml\s+models?\b",
    )),
    SkillRule("Deep Learning", (
        r"\bdeep\s+learning\b",
    )),
    SkillRule("Scikit-learn", (
        r"\bscikit[\s-]learn\b",
        r"\bsklearn\b",
    )),
    SkillRule("TensorFlow", (
        r"\btensorflow\b",
    )),
    SkillRule("PyTorch", (
        r"\bpytorch\b",
    )),
    SkillRule("NLP", (
        r"\bnlp\b",
        r"\bnatural\s+language\s+processing\b",
    )),
    SkillRule("Computer Vision", (
        r"\bcomputer\s+vision\b",
    )),
    SkillRule("Generative AI", (
        r"\bgenerative\s+ai\b",
        r"\bgenai\b",
    )),

    # Cloud & DevOps
    SkillRule("Cloud Computing", (
        r"\bcloud\s+(?:computing|infrastructure|deployment)\b",
    )),
    SkillRule("AWS", (
        r"\baws\b",
        r"\bamazon\s+web\s+services\b",
    )),
    SkillRule("Azure", (
        r"\bazure\b",
    )),
    SkillRule("Google Cloud", (
        r"\bgoogle\s+cloud\b",
        r"\bgcp\b",
    )),
    SkillRule("Docker", (
        r"\bdocker\b",
    )),
    SkillRule("Kubernetes", (
        r"\bkubernetes\b",
        r"\bk8s\b",
    )),
    SkillRule("Linux", (
        r"\blinux\b",
    )),
    SkillRule("Git", (
        r"\bgit\b",
        r"\bgithub\b",
    )),
    SkillRule("CI/CD", (
        r"\bci[\s/-]?cd\b",
    )),

    # Software Engineering Foundations
    SkillRule("OOP", (
        r"\boop\b",
        r"\bobject[\s-]oriented(?:\s+programming)?\b",
    )),
    SkillRule("Data Structures", (
        r"\bdata\s+structures?\b",
    )),
    SkillRule("Algorithms", (
        r"\balgorithms?\b",
    )),
    SkillRule("Software Development", (
        r"\bsoftware\s+develop(?:ment|er)?\b",
    )),

    # Cybersecurity & Networking
    SkillRule("Cybersecurity", (
        r"\bcyber\s*security\b",
    )),
    SkillRule("Network Security", (
        r"\bnetwork\s+security\b",
    )),
    SkillRule("Ethical Hacking", (
        r"\bethical\s+hacking\b",
    )),
    SkillRule("Computer Networks", (
        r"\bcomputer\s+networks?\b",
        r"\bnetworking\b",
    )),

    # Mobile
    SkillRule("Android", (
        r"\bandroid(?:\s+development)?\b",
    )),
    SkillRule("Kotlin", (
        r"\bkotlin\b",
    )),
    SkillRule("Flutter", (
        r"\bflutter\b",
    )),
    SkillRule("Dart", (
        r"\bdart\b",
    )),
    SkillRule("Mobile App Development", (
        r"\bmobile\s+(?:app\s+)?develop(?:ment)?\b",
    )),

    # UI/UX
    SkillRule("UI/UX Design", (
        r"\bui[\s/-]?ux(?:\s+design)?\b",
        r"\buser\s+interface\b",
    )),
    SkillRule("Figma", (
        r"\bfigma\b",
    )),

    # Soft / General Skills
    SkillRule("Communication", (
        r"\bcommunication\s+skills?\b",
    )),
    SkillRule("Problem Solving", (
        r"\bproblem\s+solving\b",
    )),
    SkillRule("Teamwork", (
        r"\bteamwork\b",
        r"\bteam\s+collaboration\b",
    )),
)


def normalize_skill(raw_phrase: str) -> str | None:
    """Return a canonical name only for a supported equivalent phrase."""
    for rule in SKILL_RULES:
        if any(re.search(pattern, raw_phrase, re.IGNORECASE) for pattern in rule.patterns):
            return rule.canonical_name
    return None


def normalize_skills(skills: list[Skill]) -> list[Skill]:
    """Normalize known phrases and remove only exact duplicate evidence."""
    result: list[Skill] = []
    seen: set[tuple[str, str]] = set()
    for skill in skills:
        canonical = normalize_skill(skill.raw_phrase) or skill.canonical_name.strip()
        key = (canonical.casefold(), skill.evidence.casefold())
        if key not in seen:
            seen.add(key)
            result.append(skill.model_copy(update={"canonical_name": canonical}))
    return result
