import { ObjectTypeDefinitionNode, DirectiveNode, FieldDefinitionNode } from 'graphql';
import { readSchema, getAuthRulesFromDirective, ensureDefaultAuthProviderAssigned } from './utils';
import { ACM } from './ac/acm';
import { ModelACM } from './ac';
import { Access, AccessControl } from 'accesscontrol';

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

async function main() {
  const schema = readSchema('student.graphql');

  // only use first type
  const type = schema.definitions[0] as ObjectTypeDefinitionNode;
  const authDir = type.directives?.find( dir => dir.name.value === 'auth') as DirectiveNode;
  const authRules = getAuthRulesFromDirective(authDir);
  const modelacm = new ModelACM();
  // before evaluating rules since each model will have their own acm we need to ensure if the acm has the rules loaded in
  if(!modelacm.hasFields()) {
    const fields: string[] = type.fields!.reduce( (acc: string[], field: FieldDefinitionNode) => {
      acc.push(field.name.value);
      return acc;
    }, []);
    modelacm.addFields(fields);
  }
  for(const rule of authRules) {

  }

}


( async() => {
  await main().catch( err => console.error(err));
})()