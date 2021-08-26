const updateOperation = (ctx: any, fields: any) => {
  let authCondition = false;

  // only two auth conditions here
  // check if they are admin
  if('admin' in ctx.identity.claims.get("cognito:groups")) {
    authCondition = false;
  }

  // check if the owner rule is valid
  if('studentID' in ctx.identity.claims.get('cognito:username') && !fields.includes('ssn')) {
    authCondition = false;
  }

  if(!authCondition) {
    throw Error('Not Authorized');
  }
}

const updateStudent = (ctx: any, fields: any) => {
  let [studentIDOwner, ProfessorGroup, adminGroup] = [false, false, false];
  
  // check if the owner rule is valid
  if('studentID' in ctx.identity.claims.get("cognito:username")) {
    studentIDOwner = true;
  }

  // check if user in the Professor group
  if('Professor' in ctx.identity.claims.get("cognito:groups")) {
    ProfessorGroup = true;
  }

  // check if user in admin group
  if('admin' in ctx.identity.claims.get("cognito:groups")) {
    adminGroup = true;
  }

  // add the evaluated expression string here
  if( !(studentIDOwner && ( ProfessorGroup || adminGroup )) ) {
    throw Error('Not Authorized');
  }
};

export async function acmSample() {}

export async function aclSample() {
  // roles
  const ownerStudentID = 'userPools:owner:studentID';
  const userPoolAdmin = 'userPools:staticGroup:admin';
  const userPoolStudent = 'userPools:staticGroup:student';
  const modelName = 'Student';
  const roles = [ownerStudentID, userPoolAdmin, userPoolStudent];

  // below is the grant list that gets created when evaluating obj rules
  // roles can be added afterwards as well
  let grantList = [
    // admin group rule
    { role: userPoolAdmin, resource: modelName, action: 'create:any', attributes: ['*'] },
    { role: userPoolAdmin, resource: modelName, action: 'read:any', attributes: ['*'] },
    { role: userPoolAdmin, resource: modelName, action: 'update:any', attributes: ['*'] },
    { role: userPoolAdmin, resource: modelName, action: 'delete:any', attributes: ['*'] },
    { role: userPoolStudent, resource: modelName, action: 'read:any', attributes: ['*', '!ssn']},
    // student group rule
    // { role: ownerStudentID, resource: modelName, action: 'update:any', attributes: ['email'] },
    // { role: ownerStudentID, resource: modelName, action: 'read:any', attributes: ['ssn'] },
];
  // const ac = new AccessControl(grantList);

  // now we evaluate the field rules
  // studentID owner rule
  // run on email field rule
  // ac.grant(ownerStudentID).update('student', ['email']);
  // // run on ssn field rule
  // ac.grant(ownerStudentID).read('student', ['ssn']);

  // const result = ac.can(ownerStudentID).update('student');
  // console.log(result);
  // while evaulating the ssn field rule we also see that there is a deny rule
  // if the role existed prior then we need to grab the prev attributes and revoke them
  // grab all roles that use student and revoke access on the field email 
  // const grants = ac.getGrants();
  // console.log(JSON.stringify(grants, null , 2));
  return;
  // const foundRoles = [];
  // for (const grant of Object.keys(grants)) {
  //   if('student' in grants[grants]) {
  //     foundRoles.push(grant);
  //   }
  // }
  // ac.grant({
  //   role: foundRoles,
  //   resource: modelName,
  //   action: 'create',
  //   attributes: ['!email']
  // })
  // ac.can(userPoolStudent).read('student').filter()
  // now we add the new attributes (a.k.a fields) that we want to update the role with
  // ac.grant(userPoolStudent).read('student', [...role_attr, '!ssn']);

  // generate update rules
  // for (const role of roles) {

  // }
}