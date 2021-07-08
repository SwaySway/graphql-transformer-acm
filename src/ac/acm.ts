export class ACM {
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