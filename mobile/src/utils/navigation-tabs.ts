export type RoleNavigationItem = { label:string;path:string;icon:string;group?:string };

const primaryPathsByRole:Record<string,string[]>={
  CLIENT:['/client','/client/pets','/client/appointments','/client/store','/client/profile'],
  ADMIN:['/admin','/admin/clinic','/admin/store','/admin/administration'],
  SUPER_ADMIN:['/admin','/admin/clinic','/admin/store','/admin/administration'],
  VETERINARIAN:['/vet','/vet/agenda','/vet/patients','/vet/clients','/vet/products'],
  GROOMER:['/professional','/professional/agenda','/professional/patients','/professional/services','/account'],
  SECRETARY:['/secretary','/secretary/agenda','/secretary/patients','/secretary/clients','/secretary/reservations'],
};
const profileShortcutPathsByRole:Record<string,string[]>={
  VETERINARIAN:['/vet/profile'],
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
  const profileShortcuts=new Set(role==='CLIENT'?[]:role==='VETERINARIAN'?['/vet/profile']:['/account']);
  return [...new Map(items
    .filter(item=>!primaryPaths.has(item.path)&&!profileShortcuts.has(item.path)&&!(['ADMIN','SUPER_ADMIN'].includes(role)&&item.group))
    .map(item=>[item.path,item])).values()];
}
