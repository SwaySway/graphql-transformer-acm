import { ObjectTypeDefinitionNode, DirectiveNode, FieldDefinitionNode } from 'graphql';
import { readSchema, getAuthRulesFromDirective, ensureDefaultAuthProviderAssigned } from './utils';
import { ACM } from './ac'

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
  // before evaluating rules since each model will have their own acm we need to ensure if the acm has the rules loaded in
  const fields: string[] = type.fields!.reduce( (acc: string[], field: FieldDefinitionNode) => {
    acc.push(field.name.value);
    return acc;
  }, []);
  const acm = new ACM({typeName: 'student', resources: fields });
  // add admin role
  acm.addRole('userPools:staticGroup:admin',  ['create', 'read', 'update', 'delete']);
  acm.addRole('userPools:staticGroup:student', ['read']);
  acm.resetAccessForResource('email');
  acm.addRole('userPools:owner:studentID', ['update'], 'email');
  acm.resetAccessForResource('ssn');
  acm.setAccess('userPools:owner:studentID', 'ssn', 'read', true);
  acm.printTable();


  
}


( async() => {
  await main().catch( err => console.error(err));
})()