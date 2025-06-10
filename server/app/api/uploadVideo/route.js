import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { readFileSync } from 'fs';
import makeSendVideo from '@/utility/genVideo';

const OAUTH_CONFIG = {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback',
    SCOPES: [
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.force-ssl'
    ]
  };


class YouTubeOAuth {
    constructor() {
      this.oauth2Client = new google.auth.OAuth2(
        OAUTH_CONFIG.CLIENT_ID,
        OAUTH_CONFIG.CLIENT_SECRET,
        OAUTH_CONFIG.REDIRECT_URI
      );
    }
    async refreshTokens() {
      try {
        this.oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        this.oauth2Client.setCredentials(credentials);
        console.log('✅ Tokens refreshed successfully');
        return credentials;
      } catch (error) {
        console.error('❌ Token refresh failed:', error.message);
        throw error;
      }
    }
  
    getAuthClient() {
      return this.oauth2Client;
    }
  }

async function uploadVideoToYouTube(videoMP4, metadata) {
    const youtubeAuth = new YouTubeOAuth();
    try {
        console.log('🔄 Refreshing expired tokens...');
        let tokens = await youtubeAuth.refreshTokens();
        const youtube = google.youtube({
        version: 'v3',
        auth: youtubeAuth.getAuthClient()
        });

          const { 
            title, 
            description, 
            tags, 
            privacy, 
            category, 
            channelId 
          } = metadata;
          
            console.log(`📤 Starting upload...`);
        
          const uploadParams = {
            part: 'snippet,status',
            requestBody: {
              snippet: {
                title: title,
                description: description,
                categoryId: category,
                tags: tags
              },
              status: {
                privacyStatus: privacy,
                selfDeclaredMadeForKids: false
              }
            },
            media: {
              body: Readable.from(videoMP4)
            }
          };
        
          console.log(`📊 Uploading MP4 video...`);
        
          const uploadResult = await youtube.videos.insert(uploadParams);
        
          const videoId = uploadResult.data.id;
          console.log(`🎉 Upload successful! Video ID: ${videoId}`);
        
          return {
            success: true,
            videoId,
            videoUrl: `https://youtube.com/watch?v=${videoId}`,
            shortUrl: `https://youtu.be/${videoId}`,
            title,
            privacy,
            uploadTime: new Date().toISOString()
          };
        } catch (error) {
            console.error('❌ Upload failed:', error.message);
            if (error.message.includes('invalid_grant') || error.message.includes('Token has been expired')) {
              throw new Error('Authentication tokens expired. Please re-authenticate manually.');
            }
            throw error;
          }
        }
        




export async function POST(req) {
    const authHeader = req.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
    
  try {
    const { success, video: videoMP4, title, description } = await makeSendVideo();

    if (!success || !videoMP4) {
      return new Response(JSON.stringify({ error: 'Failed to get video stream' }), { status: 400 });
    }

    const metadata = {
      title: title || `Mind-Blowing Update in AI, Quantum & Tech`,
      description: description || 'Discover the latest in AI, Machine Learning, Quantum Computing, and breakthrough tech—simplified! Stay ahead with cutting-edge science and innovation.',
      tags: [ 
        'Shorts', 'DidYouKnow', 'MindBlown',
        'AIRevolution', 'ArtificialIntelligence', 
        'QuantumComputing', 'QuantumTech', 
        'Science', 'ScienceDaily',
        'Facts', 'TechAndScience',
        'Latest', 'FutureTech', 'Breakthroughs', 'TechUpdate', 
      'InfographicShorts'],

      privacy: 'Public', 
      category: '28',
      channelId: process.env.YOUTUBE_CHANNEL_ID || null
    };

    const result = await uploadVideoToYouTube(videoMP4, metadata);
    return NextResponse.json({ success: true, message: `Action executed.` });
  } catch (err) {
    console.error('❌ Error processing action:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
