import { ObjectTypeDefinitionNode, DirectiveNode, FieldDefinitionNode } from 'graphql';
import { readSchema, getAuthRulesFromDirective, ensureDefaultAuthProviderAssigned } from './utils'
import { GraphQLAC } from './ac';
import { AccessControl } from 'accesscontrol';

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
  const type = schema.definitions[0] as ObjectTypeDefinitionNode;
  // obj auth
  const authDir = type.directives?.find( dir => dir.name.value === 'auth') as DirectiveNode;
  const authRules = getAuthRulesFromDirective(authDir);
  const gqlAC = new GraphQLAC();
  gqlAC.addObjectRules(type.name.value, authRules);
}

async function backup_main() {
  // roles
  const studentID = 'userPools:owner:studentID';
  const userPoolAdmin = 'userPools:staticGroup:admin';
  const userPoolStudent = 'userPools:staticGroup:student';
  const roles = [studentID, userPoolAdmin, userPoolStudent];

  // below is the grant list that gets created when evaluating obj rules
  // roles can be added afterwards as well
  let grantList = [
    // admin group rule
    { role: userPoolAdmin, resource: 'student', action: 'create:any', attributes: ['*'] },
    { role: userPoolAdmin, resource: 'student', action: 'read:any', attributes: ['*'] },
    { role: userPoolAdmin, resource: 'student', action: 'update:any', attributes: ['*'] },
    { role: userPoolAdmin, resource: 'student', action: 'delete:any', attributes: ['*'] },
    // student group rule
    // { role: userPoolStudent, resource: 'student', action: 'read:any', attributes: ['*'] },
];
  const ac = new AccessControl(grantList);

  ac.grant(userPoolStudent).resource('student').create().read().update().delete();

  console.log(JSON.stringify(ac.getGrants(), null, 2));

  // now we evaluate the field rules
  // studentID owner rule
  // run on email field rule
  ac.grant(studentID)
  .updateOwn('student')
  .attributes('email')
  // run on ssn field rule
  ac.grant(studentID)
  .readOwn('student')
  .attributes(['ssn'])
  // while evaulating the ssn field rule we also see that there is a deny rule
  // if the role existed prior then we need to grab the prev attributes and revoke them
  let role_attr = ac.can(userPoolStudent).read('student').attributes;
  // ac.can(userPoolStudent).read('student').filter()
  // now we add the new attributes (a.k.a fields) that we want to update the role with
  ac.grant(userPoolStudent).read('student', [...role_attr, '!ssn']);

  // generate update rules
  // for (const role of roles) {

  // }
}


( async() => {
  await main().catch( err => console.error(err));
})()