export type AuthPolicyAction = 'deny' | 'read' | 'write';

export type AuthPolicy = {
  action: AuthPolicyAction;
  target: string; // example: "/acl/*", "/other/*/dinges"
  targetRegex: RegExp;
}

