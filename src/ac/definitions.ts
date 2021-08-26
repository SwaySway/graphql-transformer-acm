import { AccessControl } from 'accesscontrol';

export type RoleMeta = {
  provider: string;
  claimField: string;
  expression: any;
}

export type AuthExpression = {
  // a expression of this in vtl
  expression: string;
  roleNames: Array<string>;
}

export class AuthRole {
  private acl: AccessControl;
  private roleMap: Map<string, RoleMeta>;

  constructor() {
    this.acl = new AccessControl();
    this.roleMap = new Map();
  }
}