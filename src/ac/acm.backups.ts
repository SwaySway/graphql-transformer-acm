import assert from 'assert';
import { AuthRule, ModelOperation } from '../utils/auth-rule';


type ACMConfig = { typeName: string, resources: string[] };
class ACM1 {
  private roles;
  private typeName;
  private resources;
  private operations: string[];
  private matrix: boolean[][][];

  constructor(config: ACMConfig) {
    this.typeName = config!.typeName;
    this.resources = config!.resources;
    this.operations = ['create', 'read', 'update', 'delete'];
    this.roles = new Array<string>();
    this.matrix = [];
  }
  /**
   * 
   * @param roleName Add Role into the AC class
   * @param operations the list of operations handed on a type
   * We'll construct the matrix dynamically while parsing the AST
   */
  public addRole(roleName: string, operations: string[], resource?: string) {
    if(this.roles.includes(roleName)) throw Error('Role already exists in the ACM.');
    const allowedVector = this.getResourceOperationMatrix(operations, resource);
    this.roles.push(roleName);
    this.matrix.push(allowedVector);
    assert(this.roles.length === this.matrix.length, 'Roles are not aligned with Roles added in Matrix');
  }

  /**
   * 
   * @param role 
   * @param resource 
   * @param allow
   * Given the following
   */
  public isAllowed(role: string, resource: string, operation: string) {
    this.validate(role, resource, operation);
  }


  public setAccess(role: string, resource: string, operations: string[]) {
    if (!this.roles.includes(role)) throw Error(`Role: ${role} does not exist in ACM use addRole instead`);
    if (!this.resources.includes(resource)) throw Error(`Resource: ${resource} is not configued in the ACM`);
    const roleIndex = this.roles.indexOf(role);
    const resourceIndex = this.resources.indexOf(resource);
    const operationList = this.getOperationList(operations);
    this.matrix[roleIndex][resourceIndex] = operationList;
  }

  /**
   * Given a resource this will deny access for all roles on a given resource
   * @param resource
   */
  public resetAccessForResource(resource: string) {
    if (!this.resources.includes(resource)) throw Error(`Resource: ${resource} is not configued in the ACM`); 
    const resourceIndex = this.resources.indexOf(resource);
    for(let i=0; i < this.roles.length; i++) {
      this.matrix[i][resourceIndex] = new Array(this.operations.length).fill(false);
    }
  }

  /**
   * 
   * @returns return the type name the AC is responsible for
   */
  public getTypeName(): string {
    return this.typeName;
  }

  public hasRole(roleName: string): boolean {
    return this.roles.includes(roleName);
  }

  public rolesPerOperation(operation: string) {
    if (!this.operations.includes(operation)) throw Error(`Operation: ${operation} is not configured in ACM.`);
    for(let x = 0; x < this.roles.length; x++) {
      // this.resources.reduce( (prev, resource, index) => {  })
    }
  }

  public printTable() {
    for(let i=0; i < this.matrix.length; i++) {
      console.log(this.roles[i]);
      const tableObj: any = {};
      for(let y=0; y < this.matrix[i].length; y++) {
        tableObj[this.resources[y]] = this.matrix[i][y].reduce( (prev: any, resource: boolean, index: number) => {
          prev[this.operations[index]] = resource;
          return prev;
        }, {});
      }
      console.table(tableObj); 
    }
  }
  /**
   * HELPER FUNCTIONS
   */

  private validate(roleName: string, resource: string, operation: string) {
    if (!this.roles.includes(roleName)) throw Error(`Role: ${roleName} does not exist in ACM use addRole instead`);
    if (!this.resources.includes(resource)) throw Error(`Resource: ${resource} is not configued in the ACM`); 
    if (!this.operations.includes(operation)) throw Error(`Operation: ${operation} is not configured in ACM.`);
  }

  /**
   * 
   * if singular resource is specified the operations are only applied on the resource
   * a denied array for every other resource is returned in the matrix
   * @param operations 
   * @param resource 
   * @returns a 2d matrix containg the access for each resource
   */
  private getResourceOperationMatrix(operations: string[], resource?: string): boolean[][] {
    let fieldAllowVector: boolean[][] = [];
    let operationList: boolean[] = this.getOperationList(operations);
    for(let i = 0; i < this.resources.length; i++) {
      if (resource) {
        if(this.resources.indexOf(resource) === i) {
          fieldAllowVector.push(operationList);
        } else {
          fieldAllowVector.push(new Array(this.resources.length).fill(false));
        }
      } else {
        fieldAllowVector.push(operationList);
      }
    }
    return fieldAllowVector;
  }

  private getOperationList(operations: string[]): boolean[] {
    let operationList: boolean[] = [];
    for(let operation of this.operations) {
      operationList.push(operations.includes(operation) ? true : false);
    }
    return operationList;
  }
}

class ACM2 {
  private roles;
  private resources;
  private allows;
  private matrix;

  constructor(roles: string[], resources: string[], allows: string[], matrix: boolean[][][] ) {
      if (!(matrix.length === roles.length)) throw new Error('matrix.length should equal to resources.length');
      matrix.forEach(row => {
          if (!(row.length === resources.length)) throw new Error('length of each row should equal to roles.length');
          row.forEach(element => {
              if (!(element.length === allows.length)) throw new Error('length of each element should equal to allows.lenth');
          });
      });
      this.roles = roles;
      this.resources = resources;
      this.allows = allows;
      this.matrix = matrix;
  }

  private validate(role: string, resource: string, allow: string) {
    if (!this.roles.includes(role)) throw new Error('Provided role is not found in the roles array');
    if (!this.resources.includes(resource)) throw new Error('Provided resource is not found in the resources array');
    if (!this.allows.includes(allow)) throw new Error('Provided allow is not found in the allows array');
  }

  public isAllowed(role: string, resource: string, allow: string): boolean {
      this.validate(role, resource, allow);
      const roleIndex = this.roles.indexOf(role);
      const resourceIndex = this.resources.indexOf(resource);
      const allowIndex = this.allows.indexOf(allow);
      return this.matrix[roleIndex][resourceIndex][allowIndex];
  }

  public setAccess(role: string, resource: string, allow: string, access: boolean) {
    this.validate(role, resource, allow);
    const roleIndex = this.roles.indexOf(role);
    const resourceIndex = this.resources.indexOf(resource);
    const allowIndex = this.allows.indexOf(allow);
    this.matrix[roleIndex][resourceIndex][allowIndex] = access;
  }
}

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
class ACM3 {
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