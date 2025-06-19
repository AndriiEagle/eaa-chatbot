/**
 * Strict TypeScript types to replace 'any' usage throughout the codebase
 * Professional type definitions for better type safety
 */

// Database related types
export interface DatabaseUser {
  id: string;
  created_at: string;
  updated_at: string;
  email?: string;
  metadata?: UserMetadata;
}

export interface UserMetadata {
  preferences?: UserPreferences;
  settings?: UserSettings;
  profile?: UserProfile;
}

export interface UserPreferences {
  language: 'en' | 'ru' | 'uk';
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
}

export interface UserSettings {
  autoSave: boolean;
  defaultDataset: string;
  maxResults: number;
}

export interface UserProfile {
  displayName?: string;
  role?: UserRole;
  organization?: string;
}

export type UserRole = 'user' | 'admin' | 'moderator' | 'viewer';

// Session management types
export interface SessionMetadata {
  userAgent?: string;
  ipAddress?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  referrer?: string;
  startTime: string;
  lastActivity: string;
}

export interface SessionConfig {
  timeout: number;
  maxMessages: number;
  persistHistory: boolean;
}

// Message types with strict typing
export interface MessageContent {
  text: string;
  type: 'text' | 'markdown' | 'html';
  encoding?: 'utf-8' | 'base64';
}

export interface MessageMetadata {
  sources?: SourceReference[];
  performance?: PerformanceData;
  suggestions?: string[];
  clarificationQuestions?: string[];
  infoTemplates?: string[];
  suggestionsHeader?: string;
  needsClarification?: boolean;
  isMultipart?: boolean;
  parts?: MessagePart[];
  aiModel?: string;
  processingTime?: number;
  tokenCount?: number;
}

export interface MessagePart {
  id: string;
  type: 'answer' | 'source' | 'suggestion' | 'clarification';
  content: string;
  metadata?: Record<string, unknown>;
}

export interface SourceReference {
  id: string;
  title: string;
  relevance: number;
  textPreview?: string;
  url?: string;
  metadata?: SourceMetadata;
}

export interface SourceMetadata {
  path: string;
  title: string;
  date: string;
  tags: string[];
  chunkIndex?: number;
  totalChunks?: number;
  fileType?: string;
  size?: number;
}

export interface PerformanceData {
  embeddingMs: number;
  searchMs: number;
  generateMs: number;
  totalMs: number;
  tokensUsed?: number;
  costEstimate?: number;
  model?: string;
}

// Business analysis types
export interface BusinessEntity {
  type: BusinessType;
  size: BusinessSize;
  location: BusinessLocation;
  digitalPresence: DigitalPresence;
  complianceStatus: ComplianceStatus;
}

export type BusinessType = 
  | 'ecommerce'
  | 'saas'
  | 'healthcare'
  | 'education'
  | 'finance'
  | 'government'
  | 'nonprofit'
  | 'media'
  | 'retail'
  | 'other';

export type BusinessSize = 
  | 'startup'
  | 'small'
  | 'medium'
  | 'large'
  | 'enterprise';

export interface BusinessLocation {
  country: string;
  region?: string;
  city?: string;
  isEU: boolean;
  timezones: string[];
}

export interface DigitalPresence {
  hasWebsite: boolean;
  hasMobileApp: boolean;
  platforms: Platform[];
  monthlyUsers?: number;
  accessibilityFeatures?: AccessibilityFeature[];
}

export type Platform = 'web' | 'ios' | 'android' | 'desktop' | 'other';

export interface AccessibilityFeature {
  type: AccessibilityType;
  implemented: boolean;
  wcagLevel?: 'A' | 'AA' | 'AAA';
  lastAudit?: string;
}

export type AccessibilityType = 
  | 'screen_reader'
  | 'keyboard_navigation'
  | 'color_contrast'
  | 'font_sizing'
  | 'alt_text'
  | 'captions'
  | 'transcripts'
  | 'aria_labels';

export interface ComplianceStatus {
  eaaCompliant: boolean;
  wcagLevel?: 'A' | 'AA' | 'AAA';
  lastAudit?: string;
  auditResults?: AuditResult[];
  gaps?: ComplianceGap[];
}

export interface AuditResult {
  date: string;
  auditor: string;
  score: number;
  findings: AuditFinding[];
  recommendations: string[];
}

export interface AuditFinding {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: AccessibilityType;
  description: string;
  location?: string;
  suggestion?: string;
}

export interface ComplianceGap {
  requirement: string;
  status: 'missing' | 'partial' | 'implemented';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedEffort?: number; // hours
  deadline?: string;
}

// AI Analysis types
export interface AIAnalysisContext {
  userId: string;
  sessionId: string;
  currentQuery: string;
  conversationHistory: ConversationEntry[];
  userProfile: UserAnalysisProfile;
  businessContext: BusinessAnalysisContext;
}

export interface ConversationEntry {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: ConversationMetadata;
}

export interface ConversationMetadata {
  sentiment?: SentimentScore;
  topics?: string[];
  intent?: UserIntent;
  confidence?: number;
}

export interface SentimentScore {
  overall: number; // -1 to 1
  emotions: EmotionScores;
  confidence: number;
}

export interface EmotionScores {
  positive: number;
  negative: number;
  neutral: number;
  frustrated: number;
  excited: number;
  confused: number;
}

export type UserIntent = 
  | 'information_seeking'
  | 'problem_solving'
  | 'compliance_check'
  | 'implementation_help'
  | 'cost_estimation'
  | 'general_inquiry';

export interface UserAnalysisProfile {
  experienceLevel: ExperienceLevel;
  role: ProfessionalRole;
  communicationStyle: CommunicationStyle;
  learningPreference: LearningPreference;
  technicalSkill: TechnicalSkillLevel;
}

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type ProfessionalRole = 'developer' | 'designer' | 'manager' | 'compliance_officer' | 'business_owner' | 'other';
export type CommunicationStyle = 'formal' | 'casual' | 'technical' | 'business_focused';
export type LearningPreference = 'visual' | 'textual' | 'hands_on' | 'conceptual';
export type TechnicalSkillLevel = 'non_technical' | 'basic' | 'intermediate' | 'advanced' | 'expert';

export interface BusinessAnalysisContext {
  entity: BusinessEntity;
  maturityLevel: BusinessMaturityLevel;
  urgencyLevel: UrgencyLevel;
  constraints: BusinessConstraint[];
  goals: BusinessGoal[];
}

export type BusinessMaturityLevel = 'startup' | 'growing' | 'established' | 'enterprise';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface BusinessConstraint {
  type: ConstraintType;
  description: string;
  impact: ImpactLevel;
  timeline?: string;
}

export type ConstraintType = 'budget' | 'timeline' | 'resources' | 'technical' | 'regulatory';
export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';

export interface BusinessGoal {
  type: GoalType;
  description: string;
  priority: PriorityLevel;
  deadline?: string;
  success_criteria?: string[];
}

export type GoalType = 'compliance' | 'user_experience' | 'cost_reduction' | 'risk_mitigation' | 'competitive_advantage';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

// Voice processing types
export interface VoiceProcessingConfig {
  language: SupportedLanguage;
  model: VoiceModel;
  quality: QualityLevel;
  enableRealtime: boolean;
  noiseReduction: boolean;
  speakerDetection: boolean;
}

export type SupportedLanguage = 'en' | 'ru' | 'uk' | 'auto';
export type VoiceModel = 'whisper-1' | 'whisper-turbo';
export type QualityLevel = 'fast' | 'balanced' | 'high_quality';

export interface VoiceProcessingResult {
  transcript: string;
  confidence: number;
  language: DetectedLanguage;
  duration: number;
  segments?: TranscriptSegment[];
  metadata: VoiceProcessingMetadata;
}

export interface DetectedLanguage {
  code: string;
  name: string;
  confidence: number;
}

export interface TranscriptSegment {
  id: number;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
  speaker?: SpeakerInfo;
}

export interface SpeakerInfo {
  id: string;
  confidence: number;
  characteristics?: SpeakerCharacteristics;
}

export interface SpeakerCharacteristics {
  gender?: 'male' | 'female' | 'unknown';
  ageRange?: string;
  accent?: string;
}

export interface VoiceProcessingMetadata {
  originalDuration: number;
  processingTime: number;
  chunksProcessed: number;
  qualityScore: number;
  noiseLevel: number;
  model: string;
  language: string;
}

// Error types
export interface ApplicationError {
  code: string;
  message: string;
  details?: ErrorDetails;
  timestamp: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
}

export interface ErrorDetails {
  cause?: string;
  context?: Record<string, unknown>;
  suggestions?: string[];
  documentation?: string;
}

// API Response types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApplicationError;
  metadata?: APIMetadata;
}

export interface APIMetadata {
  timestamp: string;
  requestId: string;
  version: string;
  rateLimit?: RateLimitInfo;
  performance?: PerformanceData;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: string;
}

// Utility types for strict object handling
export type StrictRecord<K extends string | number | symbol, V> = Record<K, V>;
export type NonEmptyArray<T> = [T, ...T[]];
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Type guards for runtime type checking
export const isString = (value: unknown): value is string => typeof value === 'string';
export const isNumber = (value: unknown): value is number => typeof value === 'number' && !isNaN(value);
export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
export const isObject = (value: unknown): value is Record<string, unknown> => 
  typeof value === 'object' && value !== null && !Array.isArray(value);
export const isArray = <T>(value: unknown): value is T[] => Array.isArray(value);
export const isNonEmptyString = (value: unknown): value is string => 
  isString(value) && value.trim().length > 0; 