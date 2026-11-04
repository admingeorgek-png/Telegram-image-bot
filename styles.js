// Style presets. "art" styles are not photos, so the realism boost and negative prompt are skipped.
const STYLES = {
  portrait: {
    label: "Portrait photo",
    suffix:
      "professional portrait photograph, 85mm lens, shallow depth of field, soft natural window light, realistic skin texture",
    art: false,
  },
  street: {
    label: "Street photo",
    suffix: "candid street photography, 35mm lens, natural daylight, documentary style, authentic atmosphere",
    art: false,
  },
  product: {
    label: "Product shot",
    suffix: "professional product photography, clean studio lighting, soft shadows, sharp focus, high detail",
    art: false,
  },
  food: {
    label: "Food photo",
    suffix: "professional food photography, natural window light, shallow depth of field, appetizing, high detail",
    art: false,
  },
  landscape: {
    label: "Landscape",
    suffix: "landscape photography, golden hour light, wide angle lens, rich natural colors, sharp detail",
    art: false,
  },
  anime: {
    label: "Anime",
    suffix: "anime style illustration, detailed, vibrant colors, clean line art",
    art: true,
  },
  logo: {
    label: "Logo",
    suffix: "minimalist vector logo design, flat colors, clean simple shapes, white background",
    art: true,
  },
  art: {
    label: "Digital art",
    suffix: "detailed digital painting, rich colors, dramatic lighting, concept art",
    art: true,
  },
};

module.exports = { STYLES };
