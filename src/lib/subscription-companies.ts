export interface SubscriptionCompany {
  name: string
  logo: string
  category: string
  defaultAmount?: number
  defaultCurrency?: string
  defaultFrequency: "weekly" | "monthly" | "yearly"
}

export const SUBSCRIPTION_COMPANIES: SubscriptionCompany[] = [
  // Streaming
  { name: "Netflix", logo: "https://logo.clearbit.com/netflix.com", category: "Entertainment", defaultAmount: 15.99, defaultFrequency: "monthly" },
  { name: "Spotify", logo: "https://logo.clearbit.com/spotify.com", category: "Entertainment", defaultAmount: 10.99, defaultFrequency: "monthly" },
  { name: "YouTube Premium", logo: "https://logo.clearbit.com/youtube.com", category: "Entertainment", defaultAmount: 13.99, defaultFrequency: "monthly" },
  { name: "Disney+", logo: "https://logo.clearbit.com/disneyplus.com", category: "Entertainment", defaultAmount: 13.99, defaultFrequency: "monthly" },
  { name: "Apple TV+", logo: "https://logo.clearbit.com/apple.com", category: "Entertainment", defaultAmount: 9.99, defaultFrequency: "monthly" },
  { name: "Amazon Prime", logo: "https://logo.clearbit.com/amazon.com", category: "Shopping", defaultAmount: 14.99, defaultFrequency: "monthly" },
  { name: "HBO Max", logo: "https://logo.clearbit.com/hbomax.com", category: "Entertainment", defaultAmount: 15.99, defaultFrequency: "monthly" },
  { name: "Hulu", logo: "https://logo.clearbit.com/hulu.com", category: "Entertainment", defaultAmount: 7.99, defaultFrequency: "monthly" },
  { name: "Crunchyroll", logo: "https://logo.clearbit.com/crunchyroll.com", category: "Entertainment", defaultAmount: 7.99, defaultFrequency: "monthly" },
  { name: "Shahid VIP", logo: "https://logo.clearbit.com/shahid.mbc.net", category: "Entertainment", defaultFrequency: "monthly" },

  // Music
  { name: "Apple Music", logo: "https://logo.clearbit.com/apple.com", category: "Entertainment", defaultAmount: 10.99, defaultFrequency: "monthly" },
  { name: "Anghami", logo: "https://logo.clearbit.com/anghami.com", category: "Entertainment", defaultFrequency: "monthly" },

  // Gaming
  { name: "Xbox Game Pass", logo: "https://logo.clearbit.com/xbox.com", category: "Entertainment", defaultAmount: 16.99, defaultFrequency: "monthly" },
  { name: "PlayStation Plus", logo: "https://logo.clearbit.com/playstation.com", category: "Entertainment", defaultAmount: 13.99, defaultFrequency: "monthly" },
  { name: "Nintendo Switch Online", logo: "https://logo.clearbit.com/nintendo.com", category: "Entertainment", defaultAmount: 3.99, defaultFrequency: "monthly" },
  { name: "Steam", logo: "https://logo.clearbit.com/store.steampowered.com", category: "Entertainment", defaultFrequency: "monthly" },

  // Cloud & Storage
  { name: "iCloud+", logo: "https://logo.clearbit.com/apple.com", category: "Utilities", defaultAmount: 2.99, defaultFrequency: "monthly" },
  { name: "Google One", logo: "https://logo.clearbit.com/google.com", category: "Utilities", defaultAmount: 2.99, defaultFrequency: "monthly" },
  { name: "Dropbox", logo: "https://logo.clearbit.com/dropbox.com", category: "Utilities", defaultAmount: 11.99, defaultFrequency: "monthly" },

  // Productivity
  { name: "Microsoft 365", logo: "https://logo.clearbit.com/microsoft.com", category: "Education", defaultAmount: 9.99, defaultFrequency: "monthly" },
  { name: "Notion", logo: "https://logo.clearbit.com/notion.so", category: "Education", defaultAmount: 10, defaultFrequency: "monthly" },
  { name: "ChatGPT Plus", logo: "https://logo.clearbit.com/openai.com", category: "Education", defaultAmount: 20, defaultFrequency: "monthly" },
  { name: "Claude Pro", logo: "https://logo.clearbit.com/anthropic.com", category: "Education", defaultAmount: 20, defaultFrequency: "monthly" },
  { name: "Adobe Creative Cloud", logo: "https://logo.clearbit.com/adobe.com", category: "Education", defaultAmount: 54.99, defaultFrequency: "monthly" },

  // Fitness & Health
  { name: "Gym Membership", logo: "", category: "Health", defaultFrequency: "monthly" },
  { name: "Strava", logo: "https://logo.clearbit.com/strava.com", category: "Health", defaultAmount: 11.99, defaultFrequency: "monthly" },

  // Telecom
  { name: "STC", logo: "https://logo.clearbit.com/stc.com.sa", category: "Utilities", defaultFrequency: "monthly" },
  { name: "Mobily", logo: "https://logo.clearbit.com/mobily.com.sa", category: "Utilities", defaultFrequency: "monthly" },
  { name: "Zain", logo: "https://logo.clearbit.com/zain.com", category: "Utilities", defaultFrequency: "monthly" },

  // Food Delivery
  { name: "Jahez", logo: "https://logo.clearbit.com/jahez.net", category: "Food & Dining", defaultFrequency: "monthly" },
  { name: "HungerStation", logo: "https://logo.clearbit.com/hungerstation.com", category: "Food & Dining", defaultFrequency: "monthly" },

  // Insurance
  { name: "Car Insurance", logo: "", category: "Insurance", defaultFrequency: "yearly" },
  { name: "Health Insurance", logo: "", category: "Insurance", defaultFrequency: "yearly" },

  // Housing
  { name: "Rent", logo: "", category: "Housing", defaultFrequency: "monthly" },
  { name: "Electricity", logo: "", category: "Utilities", defaultFrequency: "monthly" },
  { name: "Water", logo: "", category: "Utilities", defaultFrequency: "monthly" },
  { name: "Internet", logo: "", category: "Utilities", defaultFrequency: "monthly" },
]
