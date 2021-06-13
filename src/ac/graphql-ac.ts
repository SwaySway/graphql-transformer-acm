import { AccessControl } from 'accesscontrol';
import { AuthRule } from '../utils/auth-rule';
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
export class GraphQLAC {
  private ac: AccessControl;
  private roles: Array<string>;

  constructor() {
    this.ac = new AccessControl();
    this.roles = new Array<string>();
  }

  public addObjectRules(typeName: string, rules: AuthRule[]) {
    for (const rule of rules) {
      // splitting the groups into their own respective roles
      if(rule.groups) {
        rule.groups.forEach( group => {
          const roleName = `${rule.provider}:staticGroup:${group}`;
          this.roles.push(roleName);
          this.addRoleToAC(roleName, typeName, rule);
        });
      } else {
        const roleName = this.getIdentity(rule);
        this.addRoleToAC(roleName, typeName, rule);
      }
    }
  }

  private getIdentity(rule: AuthRule): string {
    switch(rule.provider) {
      case 'apiKey':
        return 'apiKey:public';
      case 'iam':
        return `iam:${rule.allow}`;
      case 'oidc':
      case 'userPools': {
        if(rule.allow === 'groups')return `${rule.provider}:dynamicGroup:${rule.groupsField}`;
        if(rule.allow === 'owner') return `${rule.provider}:${rule.ownerField}`; 
      }
      default:
        throw new Error(`Could not get the Identity from: ${rule}`);
    }
  }

  private addRoleToAC(roleName: string, typeName: string, rule: AuthRule) {
    if(!rule.operations) {
      this.ac.grant(roleName)
        .resource(typeName)
        .create()
        .read()
        .update()
        .delete();
    } else {
      for (const operation in rule.operations) {
        this.ac.grant({
          role: roleName,
          resource: typeName,
          action: operation,
          attributes: ['*']
        });
      }
    }
  }
}