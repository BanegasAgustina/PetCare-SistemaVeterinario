import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe,it } from 'node:test';
import { createElement, type ReactNode } from 'react';
import type { AuthUser } from '../src/types/auth';
import { roleHome,canEnterClientRoot,canEnterWorkspace } from '../src/utils/role-home';
import { EntryRedirect } from '../src/components/layout/EntryRedirect';

const {renderToStaticMarkup}=createRequire(__filename)('react-dom/server') as {renderToStaticMarkup:(element:ReactNode)=>string};

const user=(role:string):AuthUser=>({id:'7',firstName:'Ana',lastName:'Test',email:'ana@example.test',phone:null,role});

describe('authenticated entry route',()=>{
  it('sends CLIENT to the route permitted for CLIENT instead of the custom-role workspace',()=>{
    assert.equal(roleHome(user('CLIENT')),'/client');
    assert.equal(canEnterClientRoot(user('CLIENT')),true);
    assert.equal(canEnterWorkspace(user('CLIENT')),false);
  });
  it('keeps built-in workspaces and sends custom roles to their workspace',()=>{
    assert.equal(roleHome(user('VETERINARIAN')),'/vet');
    assert.equal(roleHome(user('GROOMER')),'/professional');
    assert.equal(roleHome(user('DEPOT_MANAGER')),'/workspace');
    assert.equal(canEnterWorkspace(user('DEPOT_MANAGER')),true);
  });
  it('mounts the entry redirect with a Router mock and produces one reachable CLIENT target',()=>{
    const RouterRedirectMock=({href}:{href:string})=>createElement('output',{'data-href':href});
    const markup=renderToStaticMarkup(createElement(EntryRedirect,{user:user('CLIENT'),RedirectComponent:RouterRedirectMock}));
    assert.equal(markup,'<output data-href="/client"></output>');
  });
  it('sends a signed-out user to login',()=>{
    assert.equal(roleHome(null),'/login');
  });
});
