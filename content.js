// Text content: daily ideas, examples, terms and privacy.

const IDEAS = [
  "An elderly fisherman mending nets on a wooden boat at sunrise, calm sea, golden light",
  "A busy street market in Lagos at midday, colorful fabrics, vendors and shoppers, candid moment",
  "A steaming cup of coffee on a wooden table beside a rainy window, cozy morning mood",
  "A young woman reading a book in a sunlit library, dust floating in the light",
  "A street musician playing guitar in a train station while commuters pass by",
  "A mountain village at dawn with mist in the valley and smoke rising from the rooftops",
  "A chef plating a colorful dish in a busy restaurant kitchen, steam rising",
  "Children playing football on a dusty field at sunset, joyful and energetic",
  "A vintage car parked on a quiet cobblestone street in the evening, warm streetlights",
  "A farmer holding freshly harvested tomatoes in a green field, morning light",
  "A cozy bookshop interior with tall shelves and a cat sleeping on the counter",
  "A cyclist crossing a bridge in the fog at early morning",
  "A rooftop view of a modern city at blue hour with glowing windows",
  "A baker pulling fresh bread from a wood oven in a small village bakery",
  "A red umbrella on a rainy city street, reflections on the wet pavement",
  "A traveler with a backpack looking over a desert canyon at golden hour",
  "A grandmother laughing while cooking with her grandchildren in a bright kitchen",
  "A calm lake with a wooden dock and a canoe at sunrise, soft mist",
  "A tailor measuring fabric in a small workshop full of colorful cloth",
  "A lighthouse on a rocky coast under a dramatic stormy sky",
  "A student studying late at night with a desk lamp and city lights behind the window",
  "A fresh fruit stall at a morning market, mangoes, pineapples and oranges in neat piles",
  "A runner on an empty beach at dawn, wet sand reflecting the sky",
  "A potter shaping clay on a wheel, hands covered in wet clay, warm studio light",
  "A snowy cabin in a pine forest with warm light in the windows",
  "A group of friends laughing around a table at an outdoor cafe in the evening",
  "A close up of a honeybee on a sunflower, sharp detail, soft background",
  "A busy train platform at rush hour with motion blur and one person standing still",
  "A wooden table with fresh herbs, olive oil and bread, natural window light",
  "A tall ship sailing at sunset with orange clouds and calm water",
];

const EXAMPLES = [
  "A woman in her 30s laughing at a market in Lagos, afternoon light",
  "A steaming bowl of jollof rice on a wooden table, natural window light",
  "An old man playing chess in a park, soft morning light",
  "A modern living room with a large window and green plants",
  "A football stadium at night under bright floodlights, crowd cheering",
  "A fresh loaf of bread on a kitchen counter, warm light",
];

function ideaOfTheDay() {
  const dayNumber = Math.floor(Date.now() / 86400000);
  return IDEAS[dayNumber % IDEAS.length];
}

function termsText(support) {
  return (
    "Terms of use\n\n" +
    "1. This bot creates AI images from text you send. Results can be wrong or unexpected.\n" +
    "2. Do not request sexual content, content involving minors, extreme violence, hateful content, or anything illegal. " +
    "Users who break these rules may be blocked.\n" +
    "3. You are responsible for how you use the images. Do not present AI images as real photos to mislead people.\n" +
    "   Only edit photos you have the right to use. Do not use edits to deceive, harass or harm anyone, or to make sexual or abusive images of real people.\n" +
    "4. Free images are limited per day. Bought credits do not expire. For a payment problem or a refund request, contact " +
    support +
    ".\n" +
    "5. The service is provided as is and may change or stop at any time."
  );
}

function privacyText(support) {
  return (
    "Privacy\n\n" +
    "What we store: your Telegram user ID, how many images you made, your credits, referrals, your settings, and payment records for Telegram Stars purchases.\n\n" +
    "What we send to other services: your text description goes to the image and text services that create, translate or improve your image (Pollinations, and Hugging Face or Google if enabled). Do not put private information in your descriptions.\n\n" +
    "Photos you send for editing: the photo is downloaded to our server, sent to the editing service that does the edit (Google, Pollinations or Hugging Face, depending on setup) and then discarded. We do not keep your photos. For some editing services the photo is available through a private random link for a few minutes while the edit runs.\n\n" +
    "Reports: if you tap Report under an image, we keep the description and review the image.\n\n" +
    "We do not store the images we generate. Telegram keeps your chat history.\n\n" +
    "To ask for your data to be deleted, contact " +
    support +
    "."
  );
}

module.exports = { IDEAS, EXAMPLES, ideaOfTheDay, termsText, privacyText };
