export const INTRO_DIALOGUES = {
  professor: {
    welcome: [
      "Bienvenue dans le monde des Créatures !",
      "Je suis le Professeur Chen.",
      "Ce monde est peuplé de créatures extraordinaires...",
      "...que nous appelons simplement des Créatures !",
      "Certains les élèvent comme des compagnons...",
      "D'autres les utilisent pour des combats amicaux.",
      "Moi, je les étudie depuis des années.",
      "Et toi ? Quel est ton nom ?",
    ],
    afterName: (name: string) => [
      `Donc tu t'appelles ${name} ?`,
      "Quel beau nom !",
      `${name}, ta propre aventure va bientôt commencer !`,
      "Une aventure remplie de rêves et de découvertes t'attend !",
      "Allons-y !",
    ],
  },
  mom: {
    wakeUp: [
      "Ah, tu es enfin réveillé(e) !",
      "Le Professeur Chen t'attend au laboratoire.",
      "Il a quelque chose d'important pour toi !",
      "Dépêche-toi d'y aller !",
    ],
    beforeLeaving: [
      "N'oublie pas de te préparer pour ton voyage !",
      "Bonne chance, mon enfant !",
    ],
  },
  signs: {
    town: "Bienvenue à Bourg-Palette !",
    home: "Maison de {playerName}",
    lab: "Laboratoire du Professeur Chen",
    route: "Route 1 - Vers le nord",
  },
  pc: {
    noCreatures: "Tu n'as pas encore de Créatures à stocker.",
  },
  routeBlocked: [
    "Attention !",
    "Les hautes herbes sont dangereuses sans Créature !",
    "Va d'abord voir le Professeur Chen au laboratoire.",
  ],
  starterChoice: {
    intro: [
      "Ah, te voilà enfin !",
      "Je t'attendais avec impatience.",
      "Comme tu le sais, je suis un chercheur en Créatures.",
      "Mais je suis aussi un peu trop vieux pour partir à l'aventure...",
      "C'est pourquoi j'ai besoin de jeunes comme toi !",
      "Voici trois Créatures très rares.",
      "Choisis celle qui deviendra ton partenaire !",
    ],
    selectPrompt: "Laquelle choisis-tu ?",
    descriptions: {
      flamling: [
        "Flamling, la Créature Flamme.",
        "Type Feu.",
        "Une flamme brûle sur sa queue depuis sa naissance.",
        "Il est ardent et courageux !",
      ],
      aqualing: [
        "Aqualing, la Créature Goutte.",
        "Type Eau.",
        "Il peut projeter de l'eau à haute pression.",
        "Il est calme et réfléchi !",
      ],
      leafling: [
        "Leafling, la Créature Graine.",
        "Type Plante.",
        "La graine sur son dos lui fournit de l'énergie.",
        "Il est doux et persévérant !",
      ],
    },
    confirm: (name: string) => `Tu veux choisir ${name} ?`,
    afterChoice: (name: string) => [
      `Excellent choix !`,
      `${name} semble déjà t'apprécier !`,
      "Prends bien soin de cette Créature.",
      "Vous allez vivre de grandes aventures ensemble !",
      "Maintenant, va explorer le monde !",
      "Et n'oublie pas de capturer d'autres Créatures !",
    ],
  },
  confirmMenu: {
    yes: "OUI",
    no: "NON",
  },
};

export type DialogueKey = keyof typeof INTRO_DIALOGUES;
