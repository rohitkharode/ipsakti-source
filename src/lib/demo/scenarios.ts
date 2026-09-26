import type { Claim, Ingredient, Product } from "@/types/domain";

type IngredientSeed = Omit<Ingredient, "id">;
type ClaimSeed = Omit<Claim, "id">;

export interface DemoScenario {
  id: string;
  label: string;
  summary: string;
  product: Omit<Product, "ingredients" | "claims"> & {
    ingredients: IngredientSeed[];
    claims: ClaimSeed[];
  };
}

export const demoScenarios: DemoScenario[] = [
  {
    id: "ashwagandha-extract",
    label: "Ashwagandha water-soluble extract",
    summary:
      "Novel extraction process, cultivated source, wellness claim, India with export consideration.",
    product: {
      name: "Ashwagandha Water-Soluble Extract",
      type: "Standardised herbal extract powder",
      description:
        "A water-soluble Withania somnifera root extract produced with a proprietary low-temperature aqueous extraction process and spray drying. Intended for use in wellness beverages and sachets. Root material is cultivated in Madhya Pradesh.",
      intendedUse:
        "Daily wellness supplementation for stress resilience support",
      targetMarket: "Adults 25-55 purchasing wellness supplements",
      country: "IN",
      ingredients: [
        {
          commonName: "Ashwagandha root extract",
          scientificName: "Withania somnifera",
          quantity: "300 mg per serving",
          plantPart: "Root",
          sourceStatus: "cultivated",
          geographicSource: "Madhya Pradesh, India",
        },
      ],
      claims: [
        {
          type: "Functional",
          text: "Supports the body's response to everyday stress",
        },
        {
          type: "Traditional use",
          text: "Traditionally used as a rasayana in Ayurveda",
        },
      ],
      preparation:
        "Low-temperature aqueous extraction of dried root, membrane concentration, spray drying to a fully water-soluble powder without alcohol or solvent carriers.",
      innovation:
        "Novel extraction process producing complete cold-water solubility; process parameters not previously published by the applicant.",
      markets: ["IN", "EU", "US"],
    },
  },
  {
    id: "classical-formulation",
    label: "Classical Ayurvedic formulation",
    summary:
      "Textbook formulation manufactured to an API monograph, therapeutic positioning.",
    product: {
      name: "Triphala Churna",
      type: "Classical Ayurvedic churna",
      description:
        "Triphala Churna prepared as per the classical formulation described in the Ayurvedic Formulary of India, using equal parts of three dried fruits, milled and sieved.",
      intendedUse: "Traditional digestive and bowel regularity support",
      targetMarket: "Adults using classical Ayurvedic medicines",
      country: "IN",
      ingredients: [
        {
          commonName: "Amalaki",
          scientificName: "Phyllanthus emblica",
          quantity: "1 part",
          plantPart: "Fruit",
          sourceStatus: "cultivated",
        },
        {
          commonName: "Bibhitaki",
          scientificName: "Terminalia bellirica",
          quantity: "1 part",
          plantPart: "Fruit",
          sourceStatus: "wild",
        },
        {
          commonName: "Haritaki",
          scientificName: "Terminalia chebula",
          quantity: "1 part",
          plantPart: "Fruit",
          sourceStatus: "wild",
        },
      ],
      claims: [
        {
          type: "Traditional use",
          text: "Classical Ayurvedic formulation used for digestion and elimination",
        },
      ],
      preparation:
        "Drying, milling and sieving of the three fruits in equal proportion as per the classical text; no extraction or solvent step.",
      innovation:
        "No formulation or process modification; manufactured to the classical reference.",
      traditionalReference: "Ayurvedic Formulary of India, Part I",
      markets: ["IN"],
    },
  },
  {
    id: "aahara-product",
    label: "Ayurveda Aahara food product",
    summary:
      "Ready-to-drink food positioning under the Ayurveda Aahara framework.",
    product: {
      name: "Turmeric Wellness Drink",
      type: "Ready-to-drink beverage",
      description:
        "A shelf-stable turmeric and black pepper beverage sold as a food product, marketed under Ayurveda Aahara positioning with no therapeutic claim.",
      intendedUse: "Everyday nourishing beverage",
      targetMarket: "General adult consumers",
      country: "IN",
      ingredients: [
        {
          commonName: "Turmeric",
          scientificName: "Curcuma longa",
          quantity: "500 mg per 200 ml",
          plantPart: "Rhizome",
          sourceStatus: "cultivated",
        },
        {
          commonName: "Black pepper",
          scientificName: "Piper nigrum",
          quantity: "5 mg per 200 ml",
          plantPart: "Fruit",
          sourceStatus: "cultivated",
        },
      ],
      claims: [
        { type: "Nutrition", text: "Source of plant nutrients" },
        {
          type: "Traditional use",
          text: "Prepared on a traditional haldi-based recipe",
        },
      ],
      preparation:
        "Aqueous infusion, blending, pasteurisation and aseptic filling.",
      innovation: "Standard beverage processing; no novel process claimed.",
      markets: ["IN"],
    },
  },
  {
    id: "novel-process",
    label: "Novel process / modified formulation",
    summary:
      "Supercritical extraction and a modified delivery form; patent and prior-art focus.",
    product: {
      name: "Brahmi Phytosome Capsules",
      type: "Capsule with phospholipid delivery complex",
      description:
        "Bacopa monnieri extract complexed with sunflower phospholipids using supercritical carbon dioxide processing to form a phytosome intended to improve absorption.",
      intendedUse: "Cognitive wellness supplementation",
      targetMarket: "Working adults and students",
      country: "IN",
      ingredients: [
        {
          commonName: "Brahmi extract",
          scientificName: "Bacopa monnieri",
          quantity: "250 mg",
          plantPart: "Whole plant",
          sourceStatus: "cultivated",
          geographicSource: "Kerala, India",
        },
        {
          commonName: "Sunflower phospholipids",
          scientificName: "Helianthus annuus",
          quantity: "250 mg",
        },
      ],
      claims: [
        { type: "Functional", text: "Supports memory and concentration" },
      ],
      preparation:
        "Supercritical CO2 assisted complexation of standardised extract with phospholipids, followed by vacuum drying and encapsulation.",
      innovation:
        "Novel composition and novel process: phytosome complex formed under supercritical conditions, not previously described for this extract by the applicant.",
      markets: ["IN", "US"],
    },
  },
  {
    id: "ambiguous-case",
    label: "Ambiguous product needing expert review",
    summary:
      "Mixed food and therapeutic signals, wild-collected resource, unclear jurisdiction.",
    product: {
      name: "Herbal Immunity Syrup",
      type: "Syrup",
      description:
        "A multi-herb syrup positioned both as a daily food supplement and as a remedy for seasonal illness. Several herbs are wild-collected and the export market is undecided.",
      intendedUse: "Daily use and relief during seasonal illness",
      targetMarket: "Families, all age groups",
      country: "GLOBAL",
      ingredients: [
        {
          commonName: "Giloy",
          scientificName: "Tinospora cordifolia",
          quantity: "200 mg/5 ml",
          plantPart: "Stem",
          sourceStatus: "wild",
          geographicSource: "Not recorded",
        },
        {
          commonName: "Tulsi",
          scientificName: "Ocimum tenuiflorum",
          quantity: "100 mg/5 ml",
          plantPart: "Leaf",
          sourceStatus: "unknown",
        },
      ],
      claims: [
        { type: "Health", text: "Helps treat cough and cold symptoms" },
        { type: "Nutrition", text: "Daily nutritional support" },
      ],
      preparation:
        "Decoction of herbs, concentration with sugar syrup base, bottling.",
      innovation: "Not specified by the applicant.",
      markets: ["IN", "ASEAN", "EU"],
    },
  },
];

export function scenarioToProduct(scenario: DemoScenario): Product {
  return {
    ...scenario.product,
    ingredients: scenario.product.ingredients.map((i) => ({
      ...i,
      id: crypto.randomUUID(),
    })),
    claims: scenario.product.claims.map((c) => ({
      ...c,
      id: crypto.randomUUID(),
    })),
  };
}
