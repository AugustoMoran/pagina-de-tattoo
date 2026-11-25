import React from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useGetAllOrdersQuery } from '../../services/ordersApi';
import { useGetProductsQuery } from '../../services/productsApi';
import { useGetAllAppointmentsQuery } from '../../services/studioApi';
import { formatCurrency } from '../../utils/formatCurrency';
import { HiOutlineShoppingBag, HiOutlineCube, HiOutlineCurrencyDollar, HiOutlineClipboardList, HiOutlineCalendar } from 'react-icons/hi';
import { useGetStorageUsageQuery } from '../../services/cartApi';

const StatCard = ({ icon: Icon, label, value, to }) => (
  <Link to={to || '#'} className="card p-5 flex items-center gap-4 hover:border-primary-400/40 transition-colors">
    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary-400/15 text-primary-400">
      <Icon size={22} />
    </div>
    <div>
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  </Link>
);

const Dashboard = () => {
  const { data: ordersData } = useGetAllOrdersQuery({ page: 1, limit: 5 });
  const { data: productsData } = useGetProductsQuery({ limit: 1 });
  const { data: apptsData } = useGetAllAppointmentsQuery({ page: 1, limit: 5, estado: 'solicitado' });
  const { data: storage } = useGetStorageUsageQuery();

  const totalRevenue = ordersData?.orders
    ?.filter((o) => o.estadoPago === 'aprobado')
    .reduce((s, o) => s + o.total, 0) || 0;

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        <StatCard icon={HiOutlineCalendar} label="Turnos pendientes" value={apptsData?.total ?? '—'} to="/admin/turnos" />
        <StatCard icon={HiOutlineClipboardList} label="Pedidos" value={ordersData?.total ?? '—'} to="/admin/ordenes" />
        <StatCard icon={HiOutlineCurrencyDollar} label="Ingresos aprobados" value={formatCurrency(totalRevenue)} to="/admin/ordenes" />
        <StatCard icon={HiOutlineCube} label="Insumos" value={productsData?.total ?? '—'} to="/admin/productos" />
        <StatCard
          icon={HiOutlineShoppingBag}
          label="Almacenamiento"
          value={storage?.available !== false ? `${storage?.percentage ?? '—'}%` : '—'}
          to="/admin/cloudinary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="px-5 py-4 border-b border-surface-border flex justify-between items-center">
            <h2 className="font-semibold">Turnos solicitados</h2>
            <Link to="/admin/turnos" className="text-xs text-primary-400">Ver todos</Link>
          </div>
          <div className="divide-y divide-surface-border">
            {(apptsData?.appointments || []).slice(0, 5).map((a) => (
              <div key={a._id} className="px-5 py-3 text-sm flex justify-between gap-2">
                <div>
                  <p className="font-medium">{a.nombreCliente}</p>
                  <p className="text-xs text-ink-soft">{a.artista?.nombre} · {a.codigo}</p>
                </div>
                <p className="text-xs text-ink-soft whitespace-nowrap">
                  {new Date(a.fechaHora).toLocaleString('es-AR')}
                </p>
              </div>
            ))}
            {!apptsData?.appointments?.length && (
              <p className="px-5 py-6 text-sm text-ink-soft">Sin turnos pendientes</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="px-5 py-4 border-b border-surface-border flex justify-between items-center">
            <h2 className="font-semibold">Pedidos recientes</h2>
            <Link to="/admin/ordenes" className="text-xs text-primary-400">Ver todos</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-ink-soft">
                  <th className="px-5 py-3 font-medium">Código</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {(ordersData?.orders || []).map((o) => (
                  <tr key={o._id} className="border-b border-surface-border/50">
                    <td className="px-5 py-3 font-mono text-xs">{o.codigo}</td>
                    <td className="px-5 py-3">{formatCurrency(o.total)}</td>
                    <td className="px-5 py-3 text-ink-soft">{o.estadoPago}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
