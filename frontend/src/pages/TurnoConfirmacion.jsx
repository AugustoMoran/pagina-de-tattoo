import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SEO from '../components/common/SEO';

const TurnoConfirmacion = () => {
  const [params] = useSearchParams();
  const status = params.get('status') || 'pending';

  const copy = {
    success: {
      title: 'Seña recibida',
      text: 'Tu pago llegó. El estudio va a confirmar el turno y te contacta por WhatsApp.',
    },
    pending: {
      title: 'Pago pendiente',
      text: 'Cuando se acredite la seña, el admin revisa y confirma tu turno.',
    },
    failure: {
      title: 'Pago no completado',
      text: 'Podés intentar de nuevo o coordinar la seña por WhatsApp.',
    },
  }[status] || {
    title: 'Turno registrado',
    text: 'Revisá tu WhatsApp o mail para seguir la coordinación.',
  };

  return (
    <div className="page-wrap py-20 max-w-lg mx-auto text-center">
      <SEO title={`${copy.title} | MDFK Tattoo`} />
      <p className="section-kicker mb-2">Turnos</p>
      <h1 className="section-title mb-3">{copy.title}</h1>
      <p className="text-ink-soft text-sm mb-8">{copy.text}</p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link to="/turnos" className="btn-primary">Volver a turnos</Link>
        <Link to="/" className="btn-secondary">Inicio</Link>
      </div>
    </div>
  );
};

export default TurnoConfirmacion;
