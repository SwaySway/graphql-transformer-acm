import { AuthRule, ModelOperation } from '../utils/auth-rule';
/*
-----prev design------
object
└── identityProvider (cognito/oidc/iam/apikey)
    └── identityStrategy (owner/staticGroup/dynamicGroup/public/private)
         └── entity (owner or group name)
             └── allowedOperations (create/read/update/delete)
                  ├── claim (where to search in the identity token)
                  └── fields (list of fields that are only allowed of given operation)
----------------------
-----new design-------
A role is defined by the following
provider (userPools/oidc/iam/apikey)
    └── identityStrategy (owner/staticGroup/dynamicGroup/public/private)
         └── entity (owner name, and group name)
The role list is then added into a acl
  where the resource is the type and the attributes are the fields of the type
*/

export const MODEL_OPERATIONS: ModelOperation[] = ['create', 'read', 'update', 'delete'];
export class GraphQLACM {
  private roleMap: Map<string, any>;
  private roles: Array<string>;
  private fields: Array<string>;

  constructor() {
    this.roleMap = new Map<string, any>();
    this.roles = new Array<string>();
    this.fields = new Array<string>();
  }

  public hasFields(): boolean {
    return this.fields.length > 0;
  }

  public addFields(fields: Array<string>) {
    this.fields = fields;
  }

  /*
  ----params----
  2. fields: [] -> if on obj include all fields
  3. rules [] -> rules applied to the following fields
  ----cases-----
  1. add rules for the first time
  2. add rules when being executed on the field

   */
  public addRules(rules: AuthRule[], field?: string) {
    if(field && !this.hasFields()) throw Error('No fields added in acm - Add fields before adding field rules');
    for (const rule of rules) {
      // splitting the groups into their own respective roles
      if(rule.groups) {
        rule.groups.forEach( group => {
          const roleName = `${rule.provider}:staticGroup:${group}`;
          this.roleMap.set(roleName, {
            provider: rule.provider,
            claim: rule.groupClaim,
            value: rule.groups
          })
        });
      } else {
        const roleName = this.getIdentity(rule);
      }
    }
  }

  public addFieldRules(rules: AuthRule[]) {
    // add fields rules which includes the field and parent name
    for (const rule of rules) {
      if(rule.groups) {
        rule.groups.forEach( group => {
          const roleName = `${rule.provider}:staticGroup:${group}`;
        });
      } else {
        const roleName = this.getIdentity(rule);
      }
    }
  }

  private getIdentity(rule: AuthRule): string | void {
    switch(rule.provider) {
      case 'apiKey':
        this.roleMap.set(
          'apiKey:public',
          { provider: rule.provider }
        );
        break;
      case 'iam':
        this.roleMap.set(`iam:${rule.allow}`, {
          provider: rule.provider,
          claim: (rule.allow === 'private' ? 'authenticated' : 'unauthenticated' )
        })
        break;
      case 'oidc':
      case 'userPools': {
        if(rule.allow === 'groups')return `${rule.provider}:dynamicGroup:${rule.groupsField}`;
        if(rule.allow === 'owner') return `${rule.provider}:${rule.ownerField}`; 
      }
      default:
        throw new Error(`Could not get the Identity from: ${rule}`);
    }
  }

  
}