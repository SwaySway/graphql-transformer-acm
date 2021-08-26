import { ObjectTypeDefinitionNode, DirectiveNode, FieldDefinitionNode } from 'graphql';
import { readSchema, getAuthRulesFromDirective, MODEL_OPERATIONS } from './utils';
import { AccessControlMatrix } from './ac'
import { ModelOperation, DEFAULT_GROUPS_FIELD, DEFAULT_OWNER_FIELD, AuthRule } from './utils/auth-rule';

/*
-----prev design------
object
└── identityProvider (cognito/oidc/iam/apikey)
    └── identityStrategy (owner/staticGroup/dynamicGroup/public/private)
         └── entity (owner name, and group name)
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
/**
 * Ensure the following defaults
 * - provider
 * - iam policy generation
 */
 const ensureAuthRuleDefaults = (rules: AuthRule[]) => {
  // We assign the default provider if an override is not present make further handling easier.
  for (const rule of rules) {
    if (!rule.provider) {
      switch (rule.allow) {
        case 'owner':
        case 'groups':
          rule.provider = 'userPools';
          break;
        case 'private':
          rule.provider = 'userPools';
          break;
        case 'public':
          rule.provider = 'apiKey';
          break;
        default:
          rule.provider = null;
          break;
      }
    }
    if (rule.provider === 'iam') {
      rule.generateIAMPolicy = true;
    }
  }
};

function convertModelRulesToRoles(acm: AccessControlMatrix, authRules: AuthRule[], field?: string) {
  for (let rule of authRules) {
    let operations: ModelOperation[] = rule.operations || MODEL_OPERATIONS;
    if (rule.groups && !rule.groupsField) {
      rule.groups.forEach(group => {
        let roleName = `${rule.provider}:staticGroup:${group}`;
        acm.setRole({ role: roleName, resource: field, operations });
      });
    } else {
      let roleName: string;
      switch (rule.provider) {
        case 'apiKey':
          roleName = 'apiKey:public';
          break;
        case 'iam':
          roleName = `iam:${rule.allow}`;
          break;
        case 'oidc':
        case 'userPools':
          if (rule.allow === 'groups') {
            let groupsField = rule.groupsField || DEFAULT_GROUPS_FIELD;
            roleName = `${rule.provider}:dynamicGroup:${groupsField}`;
          } else if (rule.allow === 'owner') {
            let ownerField = rule.ownerField || DEFAULT_OWNER_FIELD;
            roleName = `${rule.provider}:owner:${ownerField}`;
          } else if(rule.allow === 'private') {
            roleName = `${rule.provider}:${rule.allow}`;
          } else {
            throw new Error(`Could not create a role from ${JSON.stringify(rule)}`);
          }
          break;
        default:
          throw new Error(`Could not create a role from ${JSON.stringify(rule)}`);
      }
      acm.setRole({ role: roleName, resource: field, operations });
    }
  }
}

async function main() {
  const schema = readSchema('student.graphql');
  // only use first type
  // collect object rules
  const type = schema.definitions[0] as ObjectTypeDefinitionNode;
  const authDir = type.directives?.find( dir => dir.name.value === 'auth') as DirectiveNode;
  const authRules = getAuthRulesFromDirective(authDir);
  ensureAuthRuleDefaults(authRules);
  // before evaluating rules since each model will have their own acm we need to ensure if the acm has the rules loaded in
  const fields: string[] = type.fields!.reduce( (acc: string[], field: FieldDefinitionNode) => {
    acc.push(field.name.value);
    return acc;
  }, []);
  const acm = new AccessControlMatrix({ operations: MODEL_OPERATIONS, resources: fields });
  convertModelRulesToRoles(acm, authRules);
  // run through fields
  for (let fieldNode of type.fields!) {
    let fieldAuthDir = fieldNode.directives?.find( dir => dir.name.value === 'auth') as DirectiveNode;
    if(fieldAuthDir) {
      acm.resetAccessForResource(fieldNode.name.value);
      let fieldAuthRules = getAuthRulesFromDirective(fieldAuthDir);
      ensureAuthRuleDefaults(fieldAuthRules);
      convertModelRulesToRoles(acm, fieldAuthRules, fieldNode.name.value);
    }
  }
  const truthTable = acm.getAcmPerRole();
  for (let [role, acm] of truthTable) {
    console.group(role)
    console.table(acm);
    console.groupEnd();
  }
}


( async() => {
  await main().catch( err => console.error(err));
})()