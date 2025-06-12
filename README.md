# Automated Content Creation & Upload System

![Next.js](https://img.shields.io/badge/Next.js-13+-black?style=flat&logo=next.js)
![Python](https://img.shields.io/badge/Python-3.x-blue?style=flat&logo=python)
![Llama](https://img.shields.io/badge/LLM-Meta_Llama-FFD700?style=flat)
![Flux](https://img.shields.io/badge/Image_Gen-Flux-9D5CFF?style=flat)
![MoviePy](https://img.shields.io/badge/Video-MoviePy-00B4D8?style=flat)
![YouTube API](https://img.shields.io/badge/API-YouTube-FF0000?style=flat&logo=youtube)

An automated pipeline for content creation and social media upload, built with Next.js App Router and Python video processing.

## ✨ Features

- **Automated Workflow**: Triggered via GitHub workflow calling the `/uploadVideo` API endpoint
- **AI-Powered Content Generation**:
  - Web content scraping
  - Content enhancement using Meta Llama LLM
  - Title, description, and image prompt generation
  - AI image creation using Flux model
- **Video Production**:
  - Python-based video generation with MoviePy
  - Combines generated content, images, and music
  - Creates polished video output with transitions/effects
- **Direct Social Media Upload**:
  - YouTube integration via Google API
  - Fully automated OAuth2 flow using refresh tokens

## 🛠️ Technical Stack

- **Frontend/API**: Next.js (App Router)
- **Video Processing**: Python with MoviePy
- **AI Models**:
  - Meta Llama (Content generation)
  - Flux (Image generation)
- **APIs**:
  - Google Client ID/Secret for authentication
  - YouTube Data API v3
- **Automation**:
  - GitHub Actions workflow trigger
  - One-time refresh token for persistent access

## 🔄 Workflow Process

1. **Trigger**: GitHub workflow calls `/uploadVideo` API endpoint
2. **Content Gathering**:
   - Collects raw content from web sources
3. **Content Enhancement**:
   - Processes content through Meta Llama
   - Generates SEO-optimized title, description
   - Creates image generation prompts
4. **Media Creation**:
   - Generates images using Flux model
   - Python script processes assets with MoviePy:
     - Combines images, text, and audio
     - Applies transitions and effects
     - Renders final video
5. **Upload**:
   - Authenticates using Google OAuth2
   - Uploads video to YouTube automatically

