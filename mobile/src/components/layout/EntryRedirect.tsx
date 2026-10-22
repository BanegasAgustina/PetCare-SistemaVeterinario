import type { ComponentType } from 'react';
import type { AuthUser } from '../../types/auth';
import { roleHome } from '../../utils/role-home';

export function EntryRedirect({user,RedirectComponent}:{user:AuthUser|null;RedirectComponent:ComponentType<{href:string}>}) {
  return <RedirectComponent href={roleHome(user)} />;
}
