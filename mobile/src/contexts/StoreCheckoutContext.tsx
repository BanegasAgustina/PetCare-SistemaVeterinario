/**
 * ARCHIVO: StoreCheckoutContext.tsx
 * UBICACIÓN: mobile/src/contexts/StoreCheckoutContext.tsx
 * FUNCIÓN: Proveedor de estado compartido.
 * RESPONSABILIDAD: Proveedor de estado compartido dentro de PetCare; agrupa las declaraciones de StoreCheckoutContext.
 * CONEXIONES: Importa: mobile/src/types/client.ts Se utiliza desde: mobile/src/app/client/(tabs)/_layout.tsx, mobile/src/app/client/(tabs)/store/cart.tsx, mobile/src/app/client/(tabs)/store/checkout.tsx
 * FUNCIONAMIENTO: Mantiene estado compartido y lo expone a los componentes descendientes mediante Context.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import type { DeliveryQuote } from '../types/client';
/** Campos de dirección de entrega que se conservan mientras avanza checkout. */
export type CheckoutAddress={recipientName:string;phone:string;street:string;streetNumber:string;unit:string;city:string;province:string;postalCode:string;reference:string};
/** Estado temporal compartido entre carrito y checkout, incluida la cotización asociada al subtotal. */
type CheckoutState={fulfillment:'pickup'|'delivery'|null;address:CheckoutAddress;addressId:string|null;setAddressId:(value:string|null)=>void;quote:DeliveryQuote|null;quotedSubtotalCents:number|null;setFulfillment:(value:'pickup'|'delivery'|null)=>void;setAddress:(value:CheckoutAddress)=>void;setQuote:(value:DeliveryQuote|null,subtotalCents?:number)=>void;reset:()=>void};
// Configuración emptyAddress: reúne valores o reglas que consume el resto del módulo.
const emptyAddress:CheckoutAddress={recipientName:'',phone:'',street:'',streetNumber:'',unit:'',city:'',province:'',postalCode:'',reference:''};
// Contexto interno; useStoreCheckout expone el acceso con chequeo de provider.
const Context=createContext<CheckoutState|null>(null);
/** Mantiene selección de retiro/entrega, dirección y cotización durante carrito/checkout; reset limpia el flujo local. */
export function StoreCheckoutProvider({children}:PropsWithChildren){const [fulfillment,setFulfillment]=useState<CheckoutState['fulfillment']>(null);const [address,setAddress]=useState(emptyAddress);const [addressId,setAddressId]=useState<string|null>(null);const [quote,setQuoteState]=useState<DeliveryQuote|null>(null);const [quotedSubtotalCents,setQuotedSubtotalCents]=useState<number|null>(null);const setQuote=useCallback((next:DeliveryQuote|null,subtotalCents?:number)=>{setQuoteState(next);setQuotedSubtotalCents(next?subtotalCents??null:null);},[]);const reset=useCallback(()=>{setFulfillment(null);setAddress(emptyAddress);setAddressId(null);setQuote(null);},[setQuote]);const value=useMemo(()=>({fulfillment,address,addressId,setAddressId,quote,quotedSubtotalCents,setFulfillment,setAddress,setQuote,reset}),[fulfillment,address,addressId,quote,quotedSubtotalCents,setQuote,reset]);return <Context.Provider value={value}>{children}</Context.Provider>;}
/** Consume el estado de checkout compartido y falla si la pantalla está fuera del provider. */
export function useStoreCheckout(){const value=useContext(Context);if(!value)throw new Error('StoreCheckoutProvider no está disponible.');return value;}
