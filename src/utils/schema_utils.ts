import fs from 'fs-extra';
import path from 'path';
import { AuthRule } from './auth-rule';
import { parse, DocumentNode, DirectiveNode, ArgumentNode, valueFromASTUntyped } from 'graphql';

export function readSchema(schemaFileName: string): DocumentNode {
  const schemaFilePath = path.join(__dirname,'..', 'schemas', schemaFileName);
  const schemaFileExists = fs.existsSync(schemaFilePath);
  if (!schemaFileExists) {
    throw new Error(`Could not find schema at ${schemaFilePath}`);
  }
  return parse(fs.readFileSync(schemaFilePath).toString());
}

export function getAuthRulesFromDirective(directive: DirectiveNode) {
  const get = (s: string) => (arg: ArgumentNode) => arg.name.value === s;
  const getArg = (arg: string, dflt?: any) => {
    const argument = directive.arguments?.find(get(arg));
    return argument ? valueFromASTUntyped(argument.value) : dflt;
  };

  // Get and validate the auth rules.
  const authRules = getArg('rules', []) as AuthRule[];

  // All the IAM auth rules that are added using @auth directive need IAM policy to be generated. AuthRules added for AdminUI don't
  return authRules.map(rule => (rule.provider === 'iam' ? { ...rule, generateIAMPolicy: true } : rule));
}

export function ensureDefaultAuthProviderAssigned(rules: AuthRule[]) {
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
  }
}