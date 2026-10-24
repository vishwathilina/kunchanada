export type StoryPhoto = {
  src: string;
  alt: string;
  /** Focal point for object-position, e.g. "center 30%". */
  focus?: string;
};

export const PHOTOS = {
  rescueDog: {
    src: "/images/rescue-dog.jpg",
    alt: "A small rescued dog wrapped in a blanket, held by a responder",
    focus: "center 40%",
  },
  elephantRescue: {
    src: "/images/elephant-rescue.jpg",
    alt: "Rescuers working to free an elephant from a muddy ditch",
    focus: "center 45%",
  },
  elephantCalf: {
    src: "/images/elephant-calf.jpg",
    alt: "Keepers walking an elephant calf through a green enclosure",
    focus: "center 40%",
  },
  wildcatKitten: {
    src: "/images/wildcat-kitten.jpg",
    alt: "A tiny wildcat kitten resting in gloved hands",
    focus: "center 40%",
  },
  falconClinic: {
    src: "/images/falcon-clinic.jpeg",
    alt: "A falcon with a wrapped wing resting on a clinic pad",
    focus: "center 45%",
  },
  raccoonCare: {
    src: "/images/raccoon-care.jpeg",
    alt: "A raccoon kit held during a veterinary exam",
    focus: "center 30%",
  },
  calfCheckup: {
    src: "/images/calf-checkup.png",
    alt: "A veterinarian listening to a calf's heart while a farmer steadies it",
    focus: "center 45%",
  },
  bearClinic: {
    src: "/images/bear-clinic.webp",
    alt: "Wildlife staff examining a bear cub on a clinic table",
    focus: "center 55%",
  },
  poodleCast: {
    src: "/images/poodle-cast.webp",
    alt: "A dog with a bandaged paw lying on a veterinary table",
    focus: "center 40%",
  },
  cheetahField: {
    src: "/images/cheetah-field.webp",
    alt: "Field vets treating a cheetah beside a response vehicle",
    focus: "center 25%",
  },
  volunteerDog: {
    src: "/images/volunteer-dog.webp",
    alt: "A volunteer kneeling with a rescued dog, holding its face",
    focus: "center 40%",
  },
  hugDog: {
    src: "/images/hug-dog.avif",
    alt: "A person hugging a rescued dog outdoors",
    focus: "center 40%",
  },
} satisfies Record<string, StoryPhoto>;
