export const DEFAULT_OWNER_FIELD = 'owner';
export const DEFAULT_GROUPS_FIELD = 'groups';
export const DEFAULT_IDENTITY_CLAIM = 'cognito:username';
export const DEFAULT_GROUP_CLAIM = 'cognito:groups';
export const ON_CREATE_FIELD = 'onCreate';
export const ON_UPDATE_FIELD = 'onUpdate';
export const ON_DELETE_FIELD = 'onDelete';
export const AUTH_NON_MODEL_TYPES = 'authNonModelTypes';
export const MODEL_OPERATIONS: ModelOperation[] = ['create', 'read', 'update', 'delete'];

export type AuthStrategy = 'owner' | 'groups' | 'public' | 'private';
export type AuthProvider = 'apiKey' | 'iam' | 'oidc' | 'userPools' | null;
export type ModelQuery = 'get' | 'list';
export type ModelMutation = 'create' | 'update' | 'delete';
export type ModelOperation = 'create' | 'update' | 'delete' | 'read';
export interface AuthRule {
  allow: AuthStrategy;
  provider?: AuthProvider;
  ownerField?: string;
  identityField?: string;
  identityClaim?: string;
  groupsField?: string;
  groupClaim?: string;
  groups?: string[];
  operations?: ModelOperation[];
  queries?: ModelQuery[];
  mutations?: ModelMutation[];
  // Used only for IAM provider to decide if an IAM policy needs to be generated. IAM auth with AdminUI does not need IAM policies
  generateIAMPolicy?: boolean;
}
