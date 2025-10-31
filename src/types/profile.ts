export interface Profile {
  name: string;
  bio: string;
  imageUrl?: string;
  githubUrl?: string;
  email?: string;
}

export interface ProfileUpdateRequest {
  name: string;
  bio: string;
  imageUrl?: string;
  githubUrl?: string;
  email?: string;
}
