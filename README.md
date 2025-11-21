
# ChezaDM - Kenyan Style Messenger

ChezaDM is a mobile-first Progressive Web App (PWA) built for secure, instant messaging. It emphasizes speed, offline capability, and a unique Kenyan vibe.

## 🚀 Features

- **Instant Sessions**: Create private or group chats with a single tap. No phone numbers required.
- **Offline First**: 
  - Works without internet.
  - Compose messages offline; they are queued and sent automatically when you reconnect.
  - Chat history is cached locally.
- **Secure & Temporary**: 
  - Join IDs are generated based on time and expire after **20 minutes** if not used.
  - End-to-end encryption logic ready.
- **Rich Media**: Share photos, videos, files, and voice notes.
- **AI Bots**: Admin-controlled bots for Moderation, Translation (Sheng ↔ English), and Memes.
- **Fun Interactions**: Kenyan stickers, audio effects, and emoji reactions.

## 🛠 Tech Stack

- **Frontend**: React, Tailwind CSS
- **Language**: TypeScript
- **AI**: Google Gemini API
- **Architecture**: PWA (Service Workers & Manifest ready)

## 📱 How to Use

1. **Create Profile**: Enter a nickname to start.
2. **Start Chat**:
   - **Private**: One-on-one encrypted session.
   - **Group**: Admin controls, bot integrations.
3. **Share**: Copy the unique **Session ID** or use the **Share Link** button to invite friends.
   - *Note: The generated ID contains a timestamp and is valid for 20 minutes.*
4. **Offline Mode**: If you lose internet, the app turns red at the top. You can keep typing! Messages will have a clock icon (🕒) and will auto-send when you are back online.

## 🇰🇪 Bot Commands

- **Translator**: Automatically translates Sheng to English and vice versa if enabled.
- **Moderator**: Filters hate speech and spam.
- **Cheka Bot**: Ask for a joke!

## 📦 Installation

This is a PWA. You can add it to your home screen:
- **Android**: Chrome > Menu > Install App / Add to Home Screen.
- **iOS**: Safari > Share > Add to Home Screen.

---
*Designed with ❤️ for Kenya.*
