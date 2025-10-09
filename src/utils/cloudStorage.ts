import { supabase } from "@/integrations/supabase/client";

export interface CloudStorageConfig {
  provider: 'dropbox' | 'drive' | 'supabase';
  accessToken?: string;
}

export class CloudStorage {
  private config: CloudStorageConfig;

  constructor(config: CloudStorageConfig) {
    this.config = config;
  }

  async uploadFile(filename: string, content: string): Promise<{ success: boolean; error?: string; url?: string }> {
    try {
      switch (this.config.provider) {
        case 'dropbox':
          return await this.uploadToDropbox(filename, content);
        case 'drive':
          return await this.uploadToGoogleDrive(filename, content);
        case 'supabase':
          return await this.uploadToSupabase(filename, content);
        default:
          return { success: false, error: 'Unknown provider' };
      }
    } catch (error) {
      console.error('Upload error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }

  private async uploadToDropbox(filename: string, content: string) {
    if (!this.config.accessToken) {
      return { success: false, error: 'Dropbox access token required' };
    }

    const { data, error } = await supabase.functions.invoke('dropbox-upload', {
      body: {
        accessToken: this.config.accessToken,
        filename,
        content
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, url: data.file?.path_display };
  }

  private async uploadToGoogleDrive(filename: string, content: string) {
    if (!this.config.accessToken) {
      return { success: false, error: 'Google Drive access token required' };
    }

    const { data, error } = await supabase.functions.invoke('google-drive-upload', {
      body: {
        accessToken: this.config.accessToken,
        filename,
        content,
        mimeType: 'application/json'
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, url: `https://drive.google.com/file/d/${data.file?.id}/view` };
  }

  private async uploadToSupabase(filename: string, content: string) {
    const bucket = 'gedcom-files';
    const userId = (await supabase.auth.getUser()).data.user?.id;

    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    const filePath = `${userId}/${filename}`;
    const blob = new Blob([content], { type: 'application/json' });

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, { upsert: true });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return { success: true, url: data.publicUrl };
  }

  static async initDropboxAuth(): Promise<string> {
    // Get Dropbox app key from edge function
    const { data, error } = await supabase.functions.invoke('get-dropbox-config');
    
    if (error || !data?.appKey) {
      throw new Error('Dropbox configuration not available');
    }
    
    const clientId = data.appKey;
    const redirectUri = `${window.location.origin}/auth/dropbox/callback`;
    const state = Math.random().toString(36).substring(7);
    
    localStorage.setItem('dropbox_oauth_state', state);
    
    return `https://www.dropbox.com/oauth2/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  }

  static async initGoogleDriveAuth(): Promise<string> {
    // Get Google Drive client ID from edge function
    const { data, error } = await supabase.functions.invoke('get-google-config');
    
    if (error || !data?.clientId) {
      throw new Error('Google Drive configuration not available');
    }
    
    const clientId = data.clientId;
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = 'https://www.googleapis.com/auth/drive.file';
    const state = Math.random().toString(36).substring(7);
    
    localStorage.setItem('google_oauth_state', state);
    
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}&state=${state}`;
  }

  static parseOAuthCallback(hash: string): { accessToken: string; provider: 'dropbox' | 'drive' } | null {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const state = params.get('state');

    if (!accessToken) return null;

    // Verify state and determine provider
    const dropboxState = localStorage.getItem('dropbox_oauth_state');
    const googleState = localStorage.getItem('google_oauth_state');

    if (state === dropboxState) {
      localStorage.removeItem('dropbox_oauth_state');
      return { accessToken, provider: 'dropbox' };
    } else if (state === googleState) {
      localStorage.removeItem('google_oauth_state');
      return { accessToken, provider: 'drive' };
    }

    return null;
  }
}
