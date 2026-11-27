import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { HiCheckCircle, HiXCircle } from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import { useGetOrderByCodeQuery } from '../services/ordersApi';
import { generateOrderWhatsAppLink } from '../utils/generateWhatsAppLink';

const OrderConfirmation = () => {
  const [params] = useSearchParams();
  const status = params.get('status') || 'success';
  const codigo = params.get('codigo');
  const isSuccess = status === 'success' || status === 'approved';

  const { data: order, isError } = useGetOrderByCodeQuery(codigo, {
    skip: !codigo || !isSuccess,
  });

  const whatsappUrl = order ? generateOrderWhatsAppLink(order) : '';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!whatsappUrl || !codigo) return;
    const key = `wa_redirect_${codigo}`;
    if (sessionStorage.getItem(key) === '1') return;
    sessionStorage.setItem(key, '1');
    window.location.assign(whatsappUrl);
  }, [whatsappUrl, codigo]);

  const copy = isSuccess
    ? {
        title: 'Pago recibido',
        text: whatsappUrl
          ? 'Te llevamos a WhatsApp con el detalle de la compra para coordinar la entrega.'
          : 'El pago volvió de Mercado Pago. Si no se abre WhatsApp, escribinos con el código del pedido.',
      }
    : status === 'pending'
      ? {
          title: 'Pago pendiente',
          text: 'Cuando Mercado Pago acredite el pago, volvé a esta página para coordinar la entrega por WhatsApp.',
        }
      : {
          title: 'Pago no completado',
          text: 'El pago no se acreditó. Podés intentarlo de nuevo desde el carrito.',
        };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-16">
      <div className="card max-w-md w-full p-10 text-center animate-fade-in">
        {isSuccess ? (
          <HiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        ) : (
          <HiXCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        )}

        <h1 className="font-display text-2xl font-bold mb-2">{copy.title}</h1>
        <p className="text-ink-soft text-sm mb-8">{copy.text}</p>

        {isError && (
          <p className="text-sm text-red-400 mb-6">No pudimos cargar el pedido para armar el mensaje.</p>
        )}

        <div className="flex flex-col gap-3">
          {isSuccess && whatsappUrl && (
            <a
              href={whatsappUrl}
              className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold px-6 py-2.5 rounded-lg"
            >
              <FaWhatsapp size={18} />
              Coordinar entrega por WhatsApp
            </a>
          )}
          <Link to="/insumos" className="btn-secondary">
            {isSuccess ? 'Seguir comprando' : 'Volver a insumos'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
