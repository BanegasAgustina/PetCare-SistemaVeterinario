export type RoleNavigationItem = { label:string;path:string;icon:string;group?:string };

const primaryPathsByRole:Record<string,string[]>={
  CLIENT:['/client','/client/pets','/client/appointments','/client/store','/client/profile'],
  ADMIN:['/admin','/admin/clinic','/admin/store','/admin/administration'],
  SUPER_ADMIN:['/admin','/admin/clinic','/admin/store','/admin/administration'],
  VETERINARIAN:['/vet','/vet/agenda','/vet/patients','/vet/products'],
  GROOMER:['/professional','/professional/agenda','/professional/patients','/professional/services'],
  SECRETARY:['/secretary','/secretary/agenda','/secretary/patients','/secretary/reservations','/account'],
};
const profileShortcutPathsByRole:Record<string,string[]>={
  VETERINARIAN:['/account','/client/profile'],
  SECRETARY:['/account'],
  ADMIN:['/account'],
  SUPER_ADMIN:['/account'],
};

/** Selects the role's main destinations, keeping every remaining permitted route available for Home. */
export function selectPrimaryNavigation<T extends RoleNavigationItem>(role:string,items:T[],limit=5):T[]{
  const unique=[...new Map(items.map(item=>[item.path,item])).values()];
  const preferred=primaryPathsByRole[role]??['/workspace'];
  const profileShortcuts=new Set(profileShortcutPathsByRole[role]??(role==='CLIENT'?[]:['/account']));
  const prioritized=preferred.flatMap(path=>unique.filter(item=>item.path===path));
  const remaining=unique.filter(item=>!preferred.includes(item.path)&&!profileShortcuts.has(item.path));
  return [...prioritized,...remaining].slice(0,limit);
}

/** Keeps secondary role-enabled destinations for the reusable Home quick-access section. */
export function selectSecondaryNavigation<T extends RoleNavigationItem>(role:string,items:T[],primaryItems:RoleNavigationItem[]):T[]{
  const primaryPaths=new Set(primaryItems.map(item=>item.path));
  const profileShortcuts=new Set(role==='CLIENT'?[]:role==='VETERINARIAN'?['/account','/client/profile']:['/account']);
  return [...new Map(items
    .filter(item=>!primaryPaths.has(item.path)&&!profileShortcuts.has(item.path)&&!(['ADMIN','SUPER_ADMIN'].includes(role)&&item.group))
    .map(item=>[item.path,item])).values()];
}

/** Resolves detail and secondary screens to the closest permitted primary destination. */
export function activePrimaryNavigationPath<T extends RoleNavigationItem>(role:string,pathname:string,items:T[]):string|null{
  const homePath:Record<string,string>={CLIENT:'/client',ADMIN:'/admin',SUPER_ADMIN:'/admin',VETERINARIAN:'/vet',GROOMER:'/professional',SECRETARY:'/secretary'};
  const match=items
    .filter(item=>pathname===item.path||(item.path!==homePath[role]&&pathname.startsWith(`${item.path}/`)))
    .sort((a,b)=>b.path.length-a.path.length)[0];
  if(match)return match.path;

  const aliases:Record<string,Record<string,string>>={
    CLIENT:{
      '/client/orders':'/client/profile','/client/notifications':'/client/profile',
      '/client/medical-history':'/client/pets','/client/vaccines':'/client/pets',
      '/client/prescriptions':'/client/pets','/client/recommendations':'/client/pets',
      '/client/reservation':'/client/appointments','/client/payment-intents':'/client/store',
    },
    VETERINARIAN:{'/vet/appointment':'/vet/agenda','/vet/patient':'/vet/patients','/vet/client':'/vet/clients','/vet/record':'/vet/patients'},
    GROOMER:{'/professional/appointment':'/professional/agenda','/professional/patient':'/professional/patients'},
    SECRETARY:{'/secretary/appointment':'/secretary/agenda','/secretary/patient':'/secretary/patients','/secretary/client':'/secretary/clients','/secretary/reservation':'/secretary/reservations','/account':'/account'},
  };
  let destination=Object.entries(aliases[role]??{})
    .filter(([prefix])=>pathname===prefix||pathname.startsWith(`${prefix}/`))
    .sort(([a],[b])=>b.length-a.length)[0]?.[1];
  if(!destination&&['ADMIN','SUPER_ADMIN'].includes(role)){
    const clinicRoute=/^\/admin\/(?:clinic|patient|patients|appointment|agenda|availability|professionals|veterinarians|specialties)(?:\/|$)/.test(pathname)
      ||pathname==='/admin/catalog/services';
    const storeRoute=/^\/admin\/(?:store|products|reservations|reservation|store-orders|store-banners)(?:\/|$)/.test(pathname)
      ||/^\/admin\/catalog\/(?:products|categories|promotions)(?:\/|$)/.test(pathname);
    destination=clinicRoute?'/admin/clinic':storeRoute?'/admin/store':'/admin/administration';
  }
  return destination&&items.some(item=>item.path===destination)?destination:null;
}
