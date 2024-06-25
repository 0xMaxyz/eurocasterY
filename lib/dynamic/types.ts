type FarcasterVerifiedCredential = {
  fid: number;
  address: string;
  lowerAddress: string;
  oauthMetadata: {
    fid: number;
    profile: {
      bio: { text: string };
    };
    power_badge: boolean;
    display_name: string;
    verifications: string[];
    follower_count: number;
    custody_address: string;
    active_status: string;
    verified_addresses: {
      sol_addresses: string[];
      eth_addresses: string[];
    };
    pfp_url: string;
    following_count: number;
    object: string;
    username: string;
  };
  format: string;
  bio: string;
  oauthDisplayName: string;
  oauthAccountPhotos: string[];
  oauthUsername: string;
  oauthAccountId: string;
  id: string;
  publicIdentifier: string;
  oauthProvider: string;
};

type TwitterVerifiedCredential = {
  oauthUsername: string;
  oauthAccountId: string;
  oauthMetadata: {
    public_metrics: {
      tweet_count: number;
      like_count: number;
      following_count: number;
      listed_count: number;
      followers_count: number;
    };
    name: string;
    description: string;
    profile_image_url: string;
    id: string;
    username: string;
  };
  format: string;
  oauthDisplayName: string;
  id: string;
  oauthAccountPhotos: string[];
  publicIdentifier: string;
  oauthEmails: string[];
  oauthProvider: string;
};

type WalletVerifiedCredential = {
  chain: string;
  address: string;
  nameService: object;
  walletName: string;
  format: string;
  id: string;
  publicIdentifier: string;
  lastSelectedAt: string;
  walletProvider: string;
};

type SmartWalletVerifiedCredential = WalletVerifiedCredential;

type WebhookPayload<T> = {
  eventId: string;
  webhookId: string;
  environmentId: string;
  data: {
    missingFields: string[];
    lastVerifiedCredentialId: string;
    metadata: object;
    projectEnvironmentId: string;
    mfaBackupCodeAcknowledgement: string | null;
    newUser: boolean;
    lastVisit: string;
    verifiedCredentials: T[];
    id: string;
    sessionId: string;
    firstVisit: string;
  };
  environmentName: string;
  messageId: string;
  eventName: string;
  userId: string;
  timestamp: string;
};

type FarcasterPayload = WebhookPayload<FarcasterVerifiedCredential>;
type TwitterPayload = WebhookPayload<TwitterVerifiedCredential>;
type WalletPayload = WebhookPayload<WalletVerifiedCredential>;
type SmartWalletPayload = WebhookPayload<SmartWalletVerifiedCredential>;
