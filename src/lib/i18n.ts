import type { LanguageCode } from "@/types/domain";

/**
 * Interface translations for English, Hindi and Marathi.
 * Identifiers (case ids, source ids, sections, scientific names, versions, URLs)
 * are never translated — they are rendered from data, not from this dictionary.
 */
export const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "mr", label: "मराठी" },
];

const dictionary = {
  en: {
    "brand.tagline": "Evidence Intelligence",
    "nav.overview": "Overview",
    "nav.new": "New Analysis",
    "nav.cases": "Cases",
    "nav.evidence": "Evidence",
    "nav.checklists": "Checklists",
    "nav.sources": "Sources",
    "nav.settings": "Settings",
    "nav.help": "Help",
    "shell.workspace": "Workspace",
    "shell.language": "Interface language",
    "shell.openNav": "Open navigation",
    "shell.closeNav": "Close navigation",
    "shell.status": "Systems operational",
    "shell.statusDetail": "Sources last checked today",
    "shell.profileRole": "Research workspace",
    "title.overview": "Overview",
    "title.new": "New Analysis",
    "title.result": "Analysis Result",
    "title.checklist": "Action Checklist",
    "title.evidenceDetail": "Evidence Detail",
    "settings.heading": "Interface and review",
    "settings.languageHint":
      "Identifiers, scientific names, sections, and URLs remain unchanged.",
    "settings.uncertainty": "Show uncertainty labels",
    "settings.uncertaintyHint":
      "Always show evidence gaps and human-review guidance.",
    "settings.save": "Save preferences",
    "settings.saved": "Preferences saved",
    "settings.reasoning":
      "Assessments are reasoned in English and returned in your selected language. Official sources are always shown in their original language.",
  },
  hi: {
    "brand.tagline": "साक्ष्य इंटेलिजेंस",
    "nav.overview": "अवलोकन",
    "nav.new": "नया विश्लेषण",
    "nav.cases": "प्रकरण",
    "nav.evidence": "साक्ष्य",
    "nav.checklists": "कार्य सूची",
    "nav.sources": "स्रोत",
    "nav.settings": "सेटिंग्स",
    "nav.help": "सहायता",
    "shell.workspace": "कार्यक्षेत्र",
    "shell.language": "इंटरफ़ेस भाषा",
    "shell.openNav": "नेविगेशन खोलें",
    "shell.closeNav": "नेविगेशन बंद करें",
    "shell.status": "प्रणाली सक्रिय",
    "shell.statusDetail": "स्रोत आज जाँचे गए",
    "shell.profileRole": "अनुसंधान कार्यक्षेत्र",
    "title.overview": "अवलोकन",
    "title.new": "नया विश्लेषण",
    "title.result": "विश्लेषण परिणाम",
    "title.checklist": "कार्य सूची",
    "title.evidenceDetail": "साक्ष्य विवरण",
    "settings.heading": "इंटरफ़ेस और समीक्षा",
    "settings.languageHint":
      "पहचानकर्ता, वैज्ञानिक नाम, अनुभाग और URL अपरिवर्तित रहते हैं।",
    "settings.uncertainty": "अनिश्चितता लेबल दिखाएँ",
    "settings.uncertaintyHint":
      "साक्ष्य की कमी और विशेषज्ञ समीक्षा मार्गदर्शन हमेशा दिखाएँ।",
    "settings.save": "प्राथमिकताएँ सहेजें",
    "settings.saved": "प्राथमिकताएँ सहेजी गईं",
    "settings.reasoning":
      "आकलन अंग्रेज़ी में किया जाता है और आपकी चुनी भाषा में लौटाया जाता है। आधिकारिक स्रोत हमेशा मूल भाषा में दिखाए जाते हैं।",
  },
  mr: {
    "brand.tagline": "पुरावा इंटेलिजन्स",
    "nav.overview": "आढावा",
    "nav.new": "नवीन विश्लेषण",
    "nav.cases": "प्रकरणे",
    "nav.evidence": "पुरावे",
    "nav.checklists": "कृती यादी",
    "nav.sources": "स्रोत",
    "nav.settings": "सेटिंग्ज",
    "nav.help": "मदत",
    "shell.workspace": "कार्यक्षेत्र",
    "shell.language": "इंटरफेस भाषा",
    "shell.openNav": "नेव्हिगेशन उघडा",
    "shell.closeNav": "नेव्हिगेशन बंद करा",
    "shell.status": "प्रणाली कार्यरत आहे",
    "shell.statusDetail": "स्रोत आज तपासले",
    "shell.profileRole": "संशोधन कार्यक्षेत्र",
    "title.overview": "आढावा",
    "title.new": "नवीन विश्लेषण",
    "title.result": "विश्लेषण निकाल",
    "title.checklist": "कृती यादी",
    "title.evidenceDetail": "पुरावा तपशील",
    "settings.heading": "इंटरफेस आणि पुनरावलोकन",
    "settings.languageHint":
      "ओळखक्रमांक, शास्त्रीय नावे, कलमे आणि URL जसेच्या तसे राहतात.",
    "settings.uncertainty": "अनिश्चितता लेबल दाखवा",
    "settings.uncertaintyHint":
      "पुराव्यातील त्रुटी आणि तज्ज्ञ पुनरावलोकन मार्गदर्शन नेहमी दाखवा.",
    "settings.save": "प्राधान्ये जतन करा",
    "settings.saved": "प्राधान्ये जतन झाली",
    "settings.reasoning":
      "मूल्यांकन इंग्रजीत केले जाते आणि तुमच्या भाषेत परत दिले जाते. अधिकृत स्रोत नेहमी मूळ भाषेत दाखवले जातात.",
  },
} as const;

export type TranslationKey = keyof (typeof dictionary)["en"];

export function translateKey(
  language: LanguageCode,
  key: TranslationKey,
): string {
  return dictionary[language]?.[key] ?? dictionary.en[key];
}
