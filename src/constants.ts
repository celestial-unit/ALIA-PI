import { Language, UserRole } from "./types";

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: "FR", label: "Français" },
  { code: "EN", label: "English" },
  { code: "AR", label: "العربية" },
  { code: "ES", label: "Español" },
];

export const HEALTHCARE_PROFILES = [
  { id: "gp", label: "Médecin Généraliste", specialty: "Général" },
  { id: "pediatrician", label: "Pédiatre", specialty: "Pédiatrie" },
  { id: "dermatologist", label: "Dermatologue", specialty: "Dermatologie" },
  { id: "pharmacist", label: "Pharmacien", specialty: "Pharmacie" },
];

export const ROLES: { id: UserRole; label: string }[] = [
  { id: "HEALTHCARE_PROFESSIONAL", label: "Professionnel de Santé" },
  { id: "VISITOR", label: "Visiteur Médical (Formation)" },
  { id: "INSTITUTIONAL_PARTNER", label: "Partenaire Institutionnel" },
];

export const SCENARIOS = [
  { id: "routine", title: "Visite de routine", description: "Présentation standard du produit avec questions habituelles.", timeLimitMinutes: 10 },
  { id: "objection", title: "Gestion des objections", description: "Le médecin est sceptique sur les nouveaux bénéfices cliniques.", timeLimitMinutes: 15 },
  { id: "new_launch", title: "Lancement de produit", description: "Premier contact pour présenter une nouvelle indication.", timeLimitMinutes: 12 },
];

export const TAVUS_REPLICAS = [
  { id: "r7955ba90b", label: "Dr. Marc (Default)", description: "Avatar vidéo réaliste V2" },
  { id: "r6094ba90b", label: "Dr. Sarah (Pro)", description: "Avatar vidéo studio V2" },
];
