// Este archivo se encarga de lo siguiente: Contexto compartido de React; conserva estado y acciones que usan varias pantallas.

import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import type { DeliveryQuote } from '../types/client';
// Tipo CheckoutAddress: define la forma o las opciones válidas de los datos usados por este módulo.
export type CheckoutAddress={recipientName:string;phone:string;street:string;streetNumber:string;unit:string;city:string;province:string;postalCode:string;reference:string};
// Tipo CheckoutState: define la forma o las opciones válidas de los datos usados por este módulo.
type CheckoutState={fulfillment:'pickup'|'delivery'|null;address:CheckoutAddress;addressId:string|null;setAddressId:(value:string|null)=>void;quote:DeliveryQuote|null;quotedSubtotalCents:number|null;setFulfillment:(value:'pickup'|'delivery'|null)=>void;setAddress:(value:CheckoutAddress)=>void;setQuote:(value:DeliveryQuote|null,subtotalCents?:number)=>void;reset:()=>void};
// Configuración emptyAddress: reúne valores o reglas que consume el resto del módulo.
const emptyAddress:CheckoutAddress={recipientName:'',phone:'',street:'',streetNumber:'',unit:'',city:'',province:'',postalCode:'',reference:''};
// Dato Context: conserva un valor calculado o de configuración usado por este módulo.
const Context=createContext<CheckoutState|null>(null);
// Función StoreCheckoutProvider: concentra la lógica dentro de este módulo.
export function StoreCheckoutProvider({children}:PropsWithChildren){const [fulfillment,setFulfillment]=useState<CheckoutState['fulfillment']>(null);const [address,setAddress]=useState(emptyAddress);const [addressId,setAddressId]=useState<string|null>(null);const [quote,setQuoteState]=useState<DeliveryQuote|null>(null);const [quotedSubtotalCents,setQuotedSubtotalCents]=useState<number|null>(null);const setQuote=useCallback((next:DeliveryQuote|null,subtotalCents?:number)=>{setQuoteState(next);setQuotedSubtotalCents(next?subtotalCents??null:null);},[]);const reset=useCallback(()=>{setFulfillment(null);setAddress(emptyAddress);setAddressId(null);setQuote(null);},[setQuote]);const value=useMemo(()=>({fulfillment,address,addressId,setAddressId,quote,quotedSubtotalCents,setFulfillment,setAddress,setQuote,reset}),[fulfillment,address,addressId,quote,quotedSubtotalCents,setQuote,reset]);return <Context.Provider value={value}>{children}</Context.Provider>;}
// Función useStoreCheckout: concentra la lógica dentro de este módulo.
export function useStoreCheckout(){const value=useContext(Context);if(!value)throw new Error('StoreCheckoutProvider no está disponible.');return value;}
