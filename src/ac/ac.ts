import assert from 'assert';

type ACMConfig = { typeName: string, resources: string[] };
export class ACM {
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
