export class AC {
  private roles;
  private typeName;
  private fields;
  private allows: string[];
  private matrix: boolean[][][];

  constructor(typeName: string, fields: string[]) {
    this.typeName = typeName;
    this.fields = fields;
    this.roles = new Array<string>();
    // start with model operations
    this.allows = ['create', 'read', 'update', 'delete'];
    this.matrix = [];
  }
  /**
   * 
   * @param roleName Add Role into the AC class
   * @param operations the list of operations handed on a type
   * We'll construct the matrix dynamically while parsing the AST
   */
  public addRole(roleName: string, operations: string[]) {
    if(this.roles.includes(roleName)) throw Error('Use set access to change the ')
    this.roles.push(roleName);
  }

  /**
   * 
   * @param role 
   * @param resource 
   * @param allow
   * Given the following
   */
  public isAllowed(role: string, resource: string, allow: string) {}

  /**
   * 
   * @param role 
   * @param resource 
   * @param allow 
   * @param access 
   * Given the following arguments we can add the access for a role if it exists
   */
  public setAccess(role: string, resource: string, allow: string, access: boolean){}

  /**
   * 
   * @returns return the type name the AC is responsible for
   */
  public getTypeName(): string {
    return this.typeName;
  }
}