"use client";

import React, { useState, useEffect } from "react";
import { Order, OrderStatus } from "@/types";
import { subscribeOrders, updateOrderStatus } from "@/services/orderService";
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  Truck, 
  XCircle, 
  Search, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Loader2,
  Eye,
  ChevronDown,
  X
} from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("Hepsi");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeOrders((data) => {
      setOrders(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const statusOptions: { value: OrderStatus; label: string; style: string }[] = [
    { value: "pending", label: "Bekliyor", style: "bg-brass-500/10 text-brass-400 border-brass-500/20" },
    { value: "processing", label: "Hazırlanıyor", style: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    { value: "shipped", label: "Kargolandı", style: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    { value: "delivered", label: "Teslim Edildi", style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    { value: "cancelled", label: "İptal Edildi", style: "bg-red-500/10 text-red-400 border-red-500/20" },
  ];

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerInfo.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerInfo.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.id && order.id.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      selectedStatusFilter === "Hepsi" || order.status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 text-panel-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-panel-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Sipariş Yönetimi</h1>
          <p className="text-panel-400 text-sm mt-1">
            Müşteriler tarafından verilen siparişleri görüntüleyin, statülerini güncelleyin ve adres bilgilerini inceleyin.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-panel-900 border border-panel-800 p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-panel-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Müşteri adı, telefon veya sipariş no ara..."
            className="w-full pl-9 pr-4 py-2 bg-panel-950 border border-panel-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-brass-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-panel-400 font-medium">Statü Filtresi:</span>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 bg-panel-950 border border-panel-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-brass-500"
          >
            <option value="Hepsi">Hepsi</option>
            <option value="pending">Bekliyor</option>
            <option value="processing">Hazırlanıyor</option>
            <option value="shipped">Kargolandı</option>
            <option value="delivered">Teslim Edildi</option>
            <option value="cancelled">İptal Edildi</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-panel-900 border border-panel-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-panel-400 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brass-500" />
            <p className="text-sm font-medium">Siparişler Yükleniyor...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-panel-400 flex flex-col items-center gap-2">
            <ShoppingBag className="w-10 h-10 text-panel-600 mb-1" />
            <p className="text-base font-semibold text-panel-300">Sipariş Bulunmuyor</p>
            <p className="text-xs text-panel-500">Müşterileriniz sipariş oluşturduğunda burada listelenecektir.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-panel-300">
              <thead className="bg-panel-950/60 border-b border-panel-800 text-xs font-semibold text-panel-400 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Sipariş ID & Tarih</th>
                  <th className="py-4 px-6">Müşteri Bilgisi</th>
                  <th className="py-4 px-6">Ürün Sayısı</th>
                  <th className="py-4 px-6">Tutar</th>
                  <th className="py-4 px-6">Durum (Statü)</th>
                  <th className="py-4 px-6 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-800">
                {filteredOrders.map((order) => {
                  const currentStatusConfig = statusOptions.find((s) => s.value === order.status) || statusOptions[0];
                  return (
                    <tr key={order.id} className="hover:bg-panel-800/40 transition">
                      <td className="py-4 px-6">
                        <span className="font-mono text-xs text-brass-400 font-bold block">{order.id}</span>
                        <span className="text-[11px] text-panel-500">
                          {new Date(order.createdAt).toLocaleString("tr-TR")}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <p className="font-semibold text-panel-100 text-sm">{order.customerInfo.fullName}</p>
                        <p className="text-xs text-panel-400">{order.customerInfo.phone}</p>
                      </td>

                      <td className="py-4 px-6 font-medium text-panel-200">
                        {order.items.reduce((acc, item) => acc + item.quantity, 0)} Ürün
                      </td>

                      <td className="py-4 px-6 font-extrabold text-emerald-400">
                        ₺{order.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-4 px-6">
                        <select
                          value={order.status}
                          onChange={(e) => order.id && handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none bg-panel-950 cursor-pointer ${currentStatusConfig.style}`}
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedOrderDetails(order)}
                          className="px-3 py-1.5 bg-panel-800 hover:bg-panel-700 text-panel-200 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detay
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-panel-900 border border-panel-800 rounded-2xl shadow-2xl text-panel-100 p-6 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-panel-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Sipariş Detayı - <span className="font-mono text-brass-400">{selectedOrderDetails.id}</span>
              </h2>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1.5 text-panel-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-panel-950 p-4 rounded-xl border border-panel-800">
              <div>
                <span className="text-brass-500 font-bold uppercase tracking-wider block mb-1">Müşteri Bilgileri</span>
                <p className="font-semibold text-white">{selectedOrderDetails.customerInfo.fullName}</p>
                <p className="text-panel-400">{selectedOrderDetails.customerInfo.phone}</p>
                <p className="text-panel-400">{selectedOrderDetails.customerInfo.email}</p>
              </div>

              <div>
                <span className="text-brass-500 font-bold uppercase tracking-wider block mb-1">Teslimat Adresi</span>
                <p className="text-panel-300">{selectedOrderDetails.customerInfo.address}</p>
                <p className="text-panel-400">
                  {selectedOrderDetails.customerInfo.district} / {selectedOrderDetails.customerInfo.city}
                </p>
                {selectedOrderDetails.customerInfo.notes && (
                  <p className="text-brass-400/90 italic mt-1">Not: "{selectedOrderDetails.customerInfo.notes}"</p>
                )}
              </div>
            </div>

            {/* Item List */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-panel-400">Sipariş Edilen Ürünler</span>
              <div className="divide-y divide-panel-800 border border-panel-800 rounded-xl overflow-hidden bg-panel-950">
                {selectedOrderDetails.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {item.image && <img src={item.image} alt={item.title} className="w-10 h-10 rounded-lg object-cover" />}
                      <div>
                        <p className="font-semibold text-panel-100">{item.title}</p>
                        {item.ringSize && (
                          <span className="text-[10px] text-brass-400 font-mono">Parmak Ölçüsü: {item.ringSize} No</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-panel-400">{item.quantity} Adet</p>
                      <p className="font-bold text-emerald-400">₺{(item.price * item.quantity).toLocaleString("tr-TR")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center border-t border-panel-800 pt-4 text-sm font-bold">
              <span>Toplam Sipariş Tutarı</span>
              <span className="text-emerald-400 text-lg">
                ₺{selectedOrderDetails.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
