export type RoleNavigationItem = { label:string;path:string;icon:string;group?:string };

/** The caller supplies only authorized destinations; the first destination is the panel home. */
export function selectPrimaryNavigation<T extends RoleNavigationItem>(_role:string,items:T[],limit=5):T[]{
  const unique=[...new Map(items.map(item=>[item.path,item])).values()];
  const preferredPaths=unique.some(item=>item.path==='/vet')
    ? ['/vet','/vet/agenda','/vet/patients','/vet/products']
    : unique.some(item=>item.path==='/professional')
      ? ['/professional','/professional/patients','/professional/agenda']
      : unique.some(item=>item.path==='/client')
        ? ['/client','/client/pets','/client/appointments','/client/store','/client/profile']
        : null;
  if(preferredPaths)return preferredPaths.flatMap(path=>unique.filter(item=>item.path===path));
  const profiles=new Set(['/account','/client/profile']);
  return unique.filter(item=>!profiles.has(item.path)).slice(0,limit);
}

/** Secondary destinations stay available from the home panel and never become bottom tabs. */
export function selectSecondaryNavigation<T extends RoleNavigationItem>(_role:string,items:T[],primaryItems:RoleNavigationItem[]):T[]{
  const primaryPaths=new Set(primaryItems.map(item=>item.path));
  return [...new Map(items.filter(item=>!primaryPaths.has(item.path)&&item.path!=='/account'&&item.path!=='/client/profile'&&!item.group).map(item=>[item.path,item])).values()];
}

/** Professional home shortcuts are limited to enabled personal pets/appointments and veterinary clients. */
export function selectProfessionalQuickAccess<T extends RoleNavigationItem>(homePath:string,items:T[],primaryItems:RoleNavigationItem[]):T[]{
  const allowedPaths=new Set(['/client/pets','/client/appointments','/client/appointments/request',...(homePath==='/vet'?['/vet/clients']:[])]);
  const primaryPaths=new Set(primaryItems.map(item=>item.path));
  return [...new Map(items.filter(item=>allowedPaths.has(item.path)&&!primaryPaths.has(item.path)).map(item=>[item.path,item])).values()];
}

/** Match deep links to the nearest authorized primary section without classifying the role. */
export function activePrimaryNavigationPath<T extends RoleNavigationItem>(_role:string,pathname:string,items:T[]):string|null{
  const homePaths=new Set(['/client','/vet','/professional','/admin','/workspace']);
  const exact=items.filter(item=>pathname===item.path||(!homePaths.has(item.path)&&pathname.startsWith(`${item.path}/`))).sort((a,b)=>b.path.length-a.path.length)[0];
  if(exact)return exact.path;
  const aliases:Record<string,string>={
    '/client/orders':'/client/profile','/client/notifications':'/client/profile','/notifications':'/workspace',
    '/client/medical-history':'/client/pets','/client/vaccines':'/client/pets','/client/prescriptions':'/client/pets','/client/recommendations':'/client/pets','/client/payment-intents':'/client/store',
    '/vet/appointment':'/vet/agenda','/vet/patient':'/vet/patients','/vet/client':'/vet/clients','/vet/record':'/vet/patients',
    '/professional/appointment':'/professional/agenda','/professional/patient':'/professional/patients',
  };
  const alias=Object.entries(aliases).filter(([prefix])=>pathname===prefix||pathname.startsWith(`${prefix}/`)).sort(([a],[b])=>b.length-a.length)[0]?.[1];
  if(alias&&items.some(item=>item.path===alias))return alias;
  if(pathname.startsWith('/admin/')){
    const section=/^\/admin\/(?:clinic|patient|patients|appointment|agenda|availability|professionals|veterinarians|specialties)(?:\/|$)/.test(pathname)||pathname==='/admin/catalog/services'?'/admin/clinic'
      :/^\/admin\/(?:store|products|store-orders|store-banners)(?:\/|$)/.test(pathname)||/^\/admin\/catalog\/(?:products|categories|promotions)(?:\/|$)/.test(pathname)?'/admin/store':'/admin/administration';
    if(items.some(item=>item.path===section))return section;
  }
  for(const prefix of ['/client','/vet','/professional','/admin','/workspace'])if(pathname===prefix||pathname.startsWith(`${prefix}/`)){if(items.some(item=>item.path===prefix))return prefix;}
  return null;
}
