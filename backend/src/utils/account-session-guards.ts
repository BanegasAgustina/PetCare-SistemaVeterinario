/** Keep login errors indistinguishable for missing, inactive, or password-mismatched accounts. */
export function isLoginAllowed(input:{userExists:boolean;isActive:boolean;passwordMatches:boolean}):boolean {
  return input.userExists&&input.isActive&&input.passwordMatches;
}

/** Access tokens become unusable after account deactivation or session-version rotation. */
export function isAccessSessionCurrent(input:{isActive:boolean;userSessionVersion:number;tokenSessionVersion:number}):boolean {
  return input.isActive&&input.userSessionVersion===input.tokenSessionVersion;
}
