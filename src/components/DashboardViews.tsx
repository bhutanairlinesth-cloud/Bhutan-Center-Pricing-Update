/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Plane, Hotel as HotelIcon, Map, CreditCard, 
  Percent, Users, Settings, Plus, Trash2, Edit, Save, 
  RefreshCw, Calculator, Calendar, Globe, FileText, CheckCircle2,
  AlertCircle, Shield, Info, DollarSign, ArrowRight, Sparkles,
  Printer, Phone, Mail, Download, User as UserIcon, Send
} from 'lucide-react';
import { Hotel, TourPackage, GlobalSettings, User, HotelCategory, QuotationRequest, QuotationResult } from '../types';
import { mockDb } from '../db/mockDb';
import { BhutanCenterLogo } from './BhutanCenterLogo';

// --- CUSTOM TOAST NOTIFICATION COMPONENT ---
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };
  return { toasts, showToast, setToasts };
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-xl shadow-lg border flex items-start gap-3 animate-slide-in-right ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
          <div className="flex-1 text-sm font-medium">{toast.message}</div>
          <button
            onClick={() => onClose(toast.id)}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}

// --- TAB 1: EXCHANGE RATE ---
interface ExchangeRateViewProps {
  settings: GlobalSettings;
  onSave: (updated: GlobalSettings) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function ExchangeRateView({ settings, onSave, showToast }: ExchangeRateViewProps) {
  const [rate, setRate] = useState<string>(settings.exchangeRateUSD.toString());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setRate(settings.exchangeRateUSD.toString());
  }, [settings]);

  const handleSave = () => {
    const num = parseFloat(rate);
    if (isNaN(num) || num <= 0) {
      showToast('Please enter a valid USD exchange rate', 'error');
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      onSave({ ...settings, exchangeRateUSD: num });
      setIsSaving(false);
      showToast('USD Exchange Rate saved successfully');
    }, 400);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 premium-shadow p-8 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-50 text-brand-emerald rounded-xl">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold text-gray-900">USD Exchange Rate</h2>
          <p className="text-sm text-gray-500">Configure global conversion rate from USD to Thai Baht (THB).</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            USD Exchange Rate (1 USD = ? THB)
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 font-medium font-mono">฿</span>
            </div>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="block w-full pl-8 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald text-gray-900 font-mono text-lg"
              placeholder="35"
              step="0.01"
              id="exchange-rate-input"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-sm font-medium">THB</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 flex gap-3 text-amber-900 text-sm">
          <Info className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-brand-gold-dark">Formula impact:</span> This rate will directly scale all USD costs (Hotel USD, Tour USD, Visa USD) into Thai Baht before adding margins.
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          id="save-exchange-rate-btn"
          className="w-full flex items-center justify-center gap-2 bg-brand-emerald hover:bg-brand-emerald-light text-white font-medium py-3 px-4 rounded-lg transition duration-250 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Exchange Rate
        </button>
      </div>
    </div>
  );
}

// --- TAB 2: FLIGHT SETTINGS ---
interface FlightSettingsViewProps {
  settings: GlobalSettings;
  onSave: (updated: GlobalSettings) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function FlightSettingsView({ settings, onSave, showToast }: FlightSettingsViewProps) {
  const [ticketPrice, setTicketPrice] = useState<string>(settings.ticketPriceTHB.toString());
  const [airportTax, setAirportTax] = useState<string>(settings.airportTaxTHB.toString());
  const [agentTicketDiscount, setAgentTicketDiscount] = useState<string>((settings.agentTicketDiscountPercent ?? 3).toString());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTicketPrice(settings.ticketPriceTHB.toString());
    setAirportTax(settings.airportTaxTHB.toString());
    setAgentTicketDiscount((settings.agentTicketDiscountPercent ?? 3).toString());
  }, [settings]);

  const handleSave = () => {
    const ticket = parseFloat(ticketPrice);
    const tax = parseFloat(airportTax);
    const discount = parseFloat(agentTicketDiscount);
    if (isNaN(ticket) || ticket < 0 || isNaN(tax) || tax < 0 || isNaN(discount) || discount < 0 || discount > 100) {
      showToast('Please enter valid positive values for flight parameters. Discount must be between 0 and 100.', 'error');
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      onSave({
        ...settings,
        ticketPriceTHB: ticket,
        airportTaxTHB: tax,
        agentTicketDiscountPercent: discount
      });
      setIsSaving(false);
      showToast('Flight Settings saved successfully');
    }, 400);
  };

  const calculatedAgentPrice = !isNaN(parseFloat(ticketPrice)) && !isNaN(parseFloat(agentTicketDiscount))
    ? parseFloat(ticketPrice) * (1 - parseFloat(agentTicketDiscount) / 100)
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 premium-shadow p-8 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-50 text-brand-emerald rounded-xl">
          <Plane className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold text-gray-900">Flight Settings</h2>
          <p className="text-sm text-gray-500">Configure default flight costs per person in Thai Baht (THB).</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Air Ticket Price (THB per person)
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 font-mono">฿</span>
            </div>
            <input
              type="number"
              value={ticketPrice}
              onChange={(e) => setTicketPrice(e.target.value)}
              className="block w-full pl-8 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald text-gray-900 font-mono"
              placeholder="26,000"
              id="ticket-price-input"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-sm">THB</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agent Flight Ticket Discount (%)
          </label>
          <div className="relative rounded-lg shadow-sm mb-1">
            <input
              type="number"
              step="0.1"
              value={agentTicketDiscount}
              onChange={(e) => setAgentTicketDiscount(e.target.value)}
              className="block w-full px-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald text-gray-900 font-mono"
              placeholder="3"
              id="agent-ticket-discount-input"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-sm">%</span>
            </div>
          </div>
          {calculatedAgentPrice > 0 && (
            <p className="text-xs text-brand-emerald mt-1 font-sans">
              ราคาหลังหักส่วนลดสำหรับ Agent: <span className="font-bold font-mono">฿{calculatedAgentPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> THB (ลดลงจาก ฿{parseFloat(ticketPrice).toLocaleString()} THB)
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Airport Tax (THB per person)
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 font-mono">฿</span>
            </div>
            <input
              type="number"
              value={airportTax}
              onChange={(e) => setAirportTax(e.target.value)}
              className="block w-full pl-8 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald text-gray-900 font-mono"
              placeholder="6,500"
              id="airport-tax-input"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-sm">THB</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          id="save-flight-settings-btn"
          className="w-full flex items-center justify-center gap-2 bg-brand-emerald hover:bg-brand-emerald-light text-white font-medium py-3 px-4 rounded-lg transition duration-250 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Flight Settings
        </button>
      </div>
    </div>
  );
}

// --- TAB 3: HOTEL MANAGEMENT ---
interface HotelManagementViewProps {
  hotels: Hotel[];
  onAdd: (hotel: Hotel) => void;
  onUpdate: (hotel: Hotel) => void;
  onDelete: (id: string) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function HotelManagementView({ hotels, onAdd, onUpdate, onDelete, showToast }: HotelManagementViewProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<HotelCategory>('3 Stars');
  const [pax1USD, setPax1USD] = useState('');
  const [pax2USD, setPax2USD] = useState('');
  const [pax3PlusUSD, setPax3PlusUSD] = useState('');

  // Handle opening dialog for Add
  const handleOpenAdd = () => {
    setEditingHotel(null);
    setName('');
    setCategory('3 Stars');
    setPax1USD('250');
    setPax2USD('200');
    setPax3PlusUSD('180');
    setIsDialogOpen(true);
  };

  // Handle opening dialog for Edit
  const handleOpenEdit = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setName(hotel.name);
    setCategory(hotel.category);
    setPax1USD(hotel.rates.pax1USD.toString());
    setPax2USD(hotel.rates.pax2USD.toString());
    setPax3PlusUSD(hotel.rates.pax3PlusUSD.toString());
    setIsDialogOpen(true);
  };

  // Fast autofill depending on category to save time
  const handleCategoryChange = (cat: HotelCategory) => {
    setCategory(cat);
    if (cat === '3 Stars') {
      setPax1USD('250');
      setPax2USD('200');
      setPax3PlusUSD('180');
    } else if (cat === '4 Stars') {
      setPax1USD('300');
      setPax2USD('240');
      setPax3PlusUSD('220');
    } else {
      setPax1USD('450');
      setPax2USD('380');
      setPax3PlusUSD('350');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Hotel Name is required', 'error');
      return;
    }
    const p1 = parseFloat(pax1USD);
    const p2 = parseFloat(pax2USD);
    const p3 = parseFloat(pax3PlusUSD);

    if (isNaN(p1) || p1 < 0 || isNaN(p2) || p2 < 0 || isNaN(p3) || p3 < 0) {
      showToast('All rates must be valid positive numbers', 'error');
      return;
    }

    const payload: Hotel = {
      id: editingHotel ? editingHotel.id : 'htl_' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      category,
      rates: {
        pax1USD: p1,
        pax2USD: p2,
        pax3PlusUSD: p3
      }
    };

    if (editingHotel) {
      onUpdate(payload);
      showToast(`Hotel "${name}" updated successfully`);
    } else {
      onAdd(payload);
      showToast(`Hotel "${name}" created successfully`);
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 premium-shadow">
        <div>
          <h2 className="text-xl font-display font-semibold text-gray-900">Hotel Management</h2>
          <p className="text-sm text-gray-500">Configure unlimited hotels and specific pricing tiers per category.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          id="add-hotel-btn"
          className="flex items-center gap-2 bg-brand-emerald hover:bg-brand-emerald-light text-white font-medium py-2.5 px-4 rounded-xl transition duration-250 cursor-pointer text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add New Hotel
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 premium-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider font-display">
                <th className="py-4 px-6">Hotel Name</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">1 Pax (USD/Night)</th>
                <th className="py-4 px-6">2 Pax (USD/Night)</th>
                <th className="py-4 px-6">3+ Pax (USD/Night)</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {hotels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No hotels defined. Click "Add New Hotel" to get started.
                  </td>
                </tr>
              ) : (
                hotels.map((hotel) => (
                  <tr key={hotel.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-4 px-6 font-medium text-gray-950 font-display">{hotel.name}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold font-display ${
                        hotel.category === '5 Stars' 
                          ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                          : hotel.category === '4 Stars'
                          ? 'bg-emerald-50 text-brand-emerald border border-emerald-100'
                          : 'bg-slate-50 text-slate-600 border border-slate-100'
                      }`}>
                        {hotel.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono font-medium text-gray-900">${hotel.rates.pax1USD}</td>
                    <td className="py-4 px-6 font-mono font-medium text-gray-900">${hotel.rates.pax2USD}</td>
                    <td className="py-4 px-6 font-mono font-medium text-gray-900">${hotel.rates.pax3PlusUSD}</td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(hotel)}
                        className="p-1.5 hover:bg-slate-100 text-gray-500 hover:text-brand-emerald rounded-lg transition"
                        title="Edit Hotel"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete hotel "${hotel.name}"?`)) {
                            onDelete(hotel.id);
                            showToast(`Deleted hotel "${hotel.name}"`);
                          }
                        }}
                        className="p-1.5 hover:bg-rose-50 text-gray-500 hover:text-rose-600 rounded-lg transition"
                        title="Delete Hotel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIALOG BACKDROP & MODAL */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-lg w-full overflow-hidden animate-scale-up">
            <div className="p-6 bg-brand-emerald text-white flex justify-between items-center">
              <h3 className="font-display font-semibold text-lg">
                {editingHotel ? 'Edit Hotel Properties' : 'Add New Hotel'}
              </h3>
              <button onClick={() => setIsDialogOpen(false)} className="text-white hover:text-brand-gold text-2xl leading-none">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Hotel Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald text-sm"
                  placeholder="e.g. Druk Hotel Thimphu"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Hotel Category</label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value as HotelCategory)}
                    className="block w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald text-sm"
                  >
                    <option value="3 Stars">3 Stars</option>
                    <option value="4 Stars">4 Stars</option>
                    <option value="5 Stars">5 Stars</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Currency</label>
                  <input
                    type="text"
                    value="USD ($)"
                    disabled
                    className="block w-full px-3 py-2 border border-gray-100 bg-gray-50 rounded-lg text-sm text-gray-400 cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mt-2">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Price Per Night (USD)</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-600 font-medium">1 Passenger</span>
                    <div className="relative rounded-lg shadow-sm w-1/2">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                        <span className="text-gray-400 text-xs font-mono">$</span>
                      </div>
                      <input
                        type="number"
                        value={pax1USD}
                        onChange={(e) => setPax1USD(e.target.value)}
                        className="block w-full pl-6 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-emerald text-right font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-600 font-medium">2 Passengers</span>
                    <div className="relative rounded-lg shadow-sm w-1/2">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                        <span className="text-gray-400 text-xs font-mono">$</span>
                      </div>
                      <input
                        type="number"
                        value={pax2USD}
                        onChange={(e) => setPax2USD(e.target.value)}
                        className="block w-full pl-6 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-emerald text-right font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-600 font-medium">3+ Passengers</span>
                    <div className="relative rounded-lg shadow-sm w-1/2">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                        <span className="text-gray-400 text-xs font-mono">$</span>
                      </div>
                      <input
                        type="number"
                        value={pax3PlusUSD}
                        onChange={(e) => setPax3PlusUSD(e.target.value)}
                        className="block w-full pl-6 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-emerald text-right font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-emerald hover:bg-brand-emerald-light text-white rounded-lg text-sm font-medium transition cursor-pointer"
                >
                  {editingHotel ? 'Update Hotel' : 'Create Hotel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- TAB 4: TOUR PACKAGE ---
interface TourPackageViewProps {
  packages: TourPackage[];
  onAdd: (pkg: TourPackage) => void;
  onUpdate: (pkg: TourPackage) => void;
  onDelete: (id: string) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function TourPackageView({ packages, onAdd, onUpdate, onDelete, showToast }: TourPackageViewProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<TourPackage | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [nights, setNights] = useState('3');
  
  // 3-Star Hotel Tiers
  const [star3Pax1, setStar3Pax1] = useState('250');
  const [star3Pax2, setStar3Pax2] = useState('200');
  const [star3Pax3, setStar3Pax3] = useState('180');

  // 4-Star Hotel Tiers
  const [star4Pax1, setStar4Pax1] = useState('300');
  const [star4Pax2, setStar4Pax2] = useState('240');
  const [star4Pax3, setStar4Pax3] = useState('220');

  const handleOpenAdd = () => {
    setEditingPkg(null);
    setName('');
    setNights('3');
    setStar3Pax1('250');
    setStar3Pax2('200');
    setStar3Pax3('180');
    setStar4Pax1('300');
    setStar4Pax2('240');
    setStar4Pax3('220');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (pkg: TourPackage) => {
    setEditingPkg(pkg);
    setName(pkg.name);
    setNights(pkg.nights.toString());
    setStar3Pax1((pkg.hotelRates?.star3?.pax1USD ?? pkg.rates.pax1USD).toString());
    setStar3Pax2((pkg.hotelRates?.star3?.pax2USD ?? pkg.rates.pax2USD).toString());
    setStar3Pax3((pkg.hotelRates?.star3?.pax3PlusUSD ?? pkg.rates.pax3PlusUSD).toString());
    setStar4Pax1((pkg.hotelRates?.star4?.pax1USD ?? (pkg.rates.pax1USD + 50)).toString());
    setStar4Pax2((pkg.hotelRates?.star4?.pax2USD ?? (pkg.rates.pax2USD + 40)).toString());
    setStar4Pax3((pkg.hotelRates?.star4?.pax3PlusUSD ?? (pkg.rates.pax3PlusUSD + 40)).toString());
    setIsDialogOpen(true);
  };

  const handleNightsChange = (val: string) => {
    setNights(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Package Name is required', 'error');
      return;
    }
    const n = parseInt(nights);
    const s3p1 = parseFloat(star3Pax1);
    const s3p2 = parseFloat(star3Pax2);
    const s3p3 = parseFloat(star3Pax3);
    const s4p1 = parseFloat(star4Pax1);
    const s4p2 = parseFloat(star4Pax2);
    const s4p3 = parseFloat(star4Pax3);

    if (
      isNaN(n) || n <= 0 ||
      isNaN(s3p1) || s3p1 < 0 || isNaN(s3p2) || s3p2 < 0 || isNaN(s3p3) || s3p3 < 0 ||
      isNaN(s4p1) || s4p1 < 0 || isNaN(s4p2) || s4p2 < 0 || isNaN(s4p3) || s4p3 < 0
    ) {
      showToast('Please verify all values are valid positive numbers', 'error');
      return;
    }

    const payload: TourPackage = {
      id: editingPkg ? editingPkg.id : 'pkg_' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      nights: n,
      rates: {
        pax1USD: s3p1,
        pax2USD: s3p2,
        pax3PlusUSD: s3p3
      },
      hotelRates: {
        star3: {
          pax1USD: s3p1,
          pax2USD: s3p2,
          pax3PlusUSD: s3p3
        },
        star4: {
          pax1USD: s4p1,
          pax2USD: s4p2,
          pax3PlusUSD: s4p3
        },
        star5: {
          pax1USD: 500,
          pax2USD: 420,
          pax3PlusUSD: 380
        }
      }
    };

    if (editingPkg) {
      onUpdate(payload);
      showToast(`Package "${name}" updated successfully`);
    } else {
      onAdd(payload);
      showToast(`Package "${name}" created successfully`);
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 premium-shadow">
        <div>
          <h2 className="text-xl font-display font-semibold text-gray-900">จัดการโปรแกรมการเดินทาง (Manage Travel Packages)</h2>
          <p className="text-sm text-gray-500">คุณสามารถเพิ่ม แก้ไข ลบ หรือแก้ไขชื่อโปรแกรมการเดินทางและจำนวนคืนเดินทางเพื่อใช้ในการคำนวณราคาได้ที่นี่</p>
        </div>
        <button
          onClick={handleOpenAdd}
          id="add-package-btn"
          className="flex items-center gap-2 bg-brand-emerald hover:bg-brand-emerald-light text-white font-medium py-2.5 px-4 rounded-xl transition duration-250 cursor-pointer text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          เพิ่มโปรแกรมใหม่ (Add Tour Package)
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 text-xs text-amber-800 space-y-1">
        <span className="font-bold text-amber-900 block">💡 ข้อแนะนำสำหรับผู้ดูแลระบบ (Administrator Tip):</span>
        <p>1. <strong>แก้ไขชื่อและราคาแพ็กเกจ:</strong> กดปุ่มแก้ไขรูปดินสอ (<Edit className="w-3.5 h-3.5 inline text-amber-700" />) ด้านขวา เพื่อเปลี่ยนชื่อทัวร์ จำนวนคืนเดินทาง หรือคีย์ราคาขายส่งต่อคืนสำหรับโรงแรมระดับ 3 ดาว และ 4 ดาวได้พร้อมกันอย่างสะดวกรวดเร็ว!</p>
        <p>2. <strong>การลิงก์คำนวณราคา:</strong> ระบบคำนวณราคาจะดึงจำนวนคืนและราคาทัวร์รายคืนของโรงแรมระดับดาวที่คุณเลือกจากหน้าจอนี้ ไปใช้ในการคำนวณสรุปราคาให้โดยอัตโนมัติ ไม่ต้องกรอกซ้ำซ้อน</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 premium-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider font-display">
                <th className="py-4 px-6">ชื่อโปรแกรมเดินทาง (Travel Program / Package Name)</th>
                <th className="py-4 px-6">จำนวนคืน (Nights)</th>
                <th className="py-4 px-6">1 ท่าน (USD/คืน)</th>
                <th className="py-4 px-6">2 ท่าน (USD/คืน)</th>
                <th className="py-4 px-6">3+ ท่าน (USD/คืน)</th>
                <th className="py-4 px-6 text-right">จัดการ (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {packages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    ไม่มีโปรแกรมเดินทางในระบบ กดปุ่ม "เพิ่มโปรแกรมใหม่" ด้านบนเพื่อเริ่มต้น
                  </td>
                </tr>
              ) : (
                packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-4 px-6 font-medium text-gray-950 font-display">
                      <div className="flex items-center gap-2">
                        <span className="text-base">✈️</span>
                        <div>
                          <span className="font-bold text-gray-900 block">{pkg.name}</span>
                          <span className="text-[11px] text-gray-400 block font-normal font-mono">ID: {pkg.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 font-display">
                        {pkg.nights} คืน ({pkg.nights + 1} วัน {pkg.nights} คืน)
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.5 rounded font-sans shrink-0">⭐️3 Stars</span>
                          <span className="font-mono font-medium text-gray-900">${pkg.hotelRates?.star3?.pax1USD ?? pkg.rates.pax1USD}/nt</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded font-sans shrink-0">⭐️4 Stars</span>
                          <span className="font-mono font-medium text-gray-900">${pkg.hotelRates?.star4?.pax1USD ?? (pkg.rates.pax1USD + 50)}/nt</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.5 rounded font-sans shrink-0">⭐️3 Stars</span>
                          <span className="font-mono font-medium text-gray-900">${pkg.hotelRates?.star3?.pax2USD ?? pkg.rates.pax2USD}/nt</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded font-sans shrink-0">⭐️4 Stars</span>
                          <span className="font-mono font-medium text-gray-900">${pkg.hotelRates?.star4?.pax2USD ?? (pkg.rates.pax2USD + 40)}/nt</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.5 rounded font-sans shrink-0">⭐️3 Stars</span>
                          <span className="font-mono font-medium text-gray-900">${pkg.hotelRates?.star3?.pax3PlusUSD ?? pkg.rates.pax3PlusUSD}/nt</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded font-sans shrink-0">⭐️4 Stars</span>
                          <span className="font-mono font-medium text-gray-900">${pkg.hotelRates?.star4?.pax3PlusUSD ?? (pkg.rates.pax3PlusUSD + 40)}/nt</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(pkg)}
                        className="p-2 hover:bg-emerald-50 text-gray-500 hover:text-brand-emerald rounded-lg transition inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        title="แก้ไขโปรแกรม"
                      >
                        <Edit className="w-4 h-4" />
                        แก้ไข (Edit)
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบโปรแกรมเดินทาง "${pkg.name}"?`)) {
                            onDelete(pkg.id);
                            showToast(`ลบโปรแกรม "${pkg.name}" สำเร็จ`);
                          }
                        }}
                        className="p-2 hover:bg-rose-50 text-gray-500 hover:text-rose-600 rounded-lg transition inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        title="ลบโปรแกรม"
                      >
                        <Trash2 className="w-4 h-4" />
                        ลบ (Delete)
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIALOG */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-xl w-full overflow-hidden animate-scale-up my-8 max-h-[95vh] flex flex-col">
            <div className="p-6 bg-brand-emerald text-white flex justify-between items-center shrink-0">
              <h3 className="font-display font-semibold text-lg">
                {editingPkg ? 'แก้ไขโปรแกรมทัวร์ (Edit Tour Package)' : 'เพิ่มโปรแกรมทัวร์ (Create Tour Package)'}
              </h3>
              <button onClick={() => setIsDialogOpen(false)} className="text-white hover:text-brand-gold text-2xl leading-none cursor-pointer">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">ชื่อโปรแกรมเดินทาง (Package Name)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald text-sm"
                  placeholder="เช่น 5 Days 4 Nights Classic Tour"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">จำนวนคืน (Number of Nights)</label>
                  <input
                    type="number"
                    value={nights}
                    onChange={(e) => handleNightsChange(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald text-sm font-mono"
                    placeholder="เช่น 3"
                    min="1"
                    required
                  />
                  <p className="text-[11px] text-gray-400 mt-1">ระบบจะคูณราคาต่อคืนด้วยจำนวนคืนนี้</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">สกุลเงินค่านั่ง (Currency)</label>
                  <input
                    type="text"
                    value="USD ($) / ต่อคนต่อคืน"
                    disabled
                    className="block w-full px-3 py-2 border border-gray-100 bg-gray-50 rounded-lg text-sm text-gray-400 cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              {/* TIER 3 STARS */}
              <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/50 space-y-3">
                <span className="text-xs font-bold text-amber-800 block mb-1">⭐️⭐️⭐️ โรงแรมระดับ 3 ดาว (3-Star Hotel Tiers / Night)</span>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">1 ท่าน (1 Pax)</label>
                    <div className="relative rounded-lg shadow-xs">
                      <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400 text-xs font-mono">$</span>
                      <input
                        type="number"
                        value={star3Pax1}
                        onChange={(e) => setStar3Pax1(e.target.value)}
                        className="block w-full pl-5 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-emerald text-right font-mono bg-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">2 ท่าน (2 Pax)</label>
                    <div className="relative rounded-lg shadow-xs">
                      <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400 text-xs font-mono">$</span>
                      <input
                        type="number"
                        value={star3Pax2}
                        onChange={(e) => setStar3Pax2(e.target.value)}
                        className="block w-full pl-5 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-emerald text-right font-mono bg-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">3 ท่านขึ้นไป (3+ Pax)</label>
                    <div className="relative rounded-lg shadow-xs">
                      <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400 text-xs font-mono">$</span>
                      <input
                        type="number"
                        value={star3Pax3}
                        onChange={(e) => setStar3Pax3(e.target.value)}
                        className="block w-full pl-5 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-emerald text-right font-mono bg-white"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* TIER 4 STARS */}
              <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200/50 space-y-3">
                <span className="text-xs font-bold text-emerald-800 block mb-1">⭐️⭐️⭐️⭐️ โรงแรมระดับ 4 ดาว (4-Star Hotel Tiers / Night)</span>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">1 ท่าน (1 Pax)</label>
                    <div className="relative rounded-lg shadow-xs">
                      <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400 text-xs font-mono">$</span>
                      <input
                        type="number"
                        value={star4Pax1}
                        onChange={(e) => setStar4Pax1(e.target.value)}
                        className="block w-full pl-5 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-emerald text-right font-mono bg-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">2 ท่าน (2 Pax)</label>
                    <div className="relative rounded-lg shadow-xs">
                      <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400 text-xs font-mono">$</span>
                      <input
                        type="number"
                        value={star4Pax2}
                        onChange={(e) => setStar4Pax2(e.target.value)}
                        className="block w-full pl-5 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-emerald text-right font-mono bg-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">3 ท่านขึ้นไป (3+ Pax)</label>
                    <div className="relative rounded-lg shadow-xs">
                      <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400 text-xs font-mono">$</span>
                      <input
                        type="number"
                        value={star4Pax3}
                        onChange={(e) => setStar4Pax3(e.target.value)}
                        className="block w-full pl-5 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-emerald text-right font-mono bg-white"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  ยกเลิก (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-emerald hover:bg-brand-emerald-light text-white rounded-lg text-sm font-medium transition cursor-pointer"
                >
                  บันทึกข้อมูล (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- TAB 5: VISA SETTINGS ---
interface VisaSettingsViewProps {
  settings: GlobalSettings;
  onSave: (updated: GlobalSettings) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function VisaSettingsView({ settings, onSave, showToast }: VisaSettingsViewProps) {
  const [visaFee, setVisaFee] = useState<string>(settings.visaFeeUSD.toString());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setVisaFee(settings.visaFeeUSD.toString());
  }, [settings]);

  const handleSave = () => {
    const num = parseFloat(visaFee);
    if (isNaN(num) || num < 0) {
      showToast('Please enter a valid positive Visa fee in USD', 'error');
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      onSave({ ...settings, visaFeeUSD: num });
      setIsSaving(false);
      showToast('Visa settings saved successfully');
    }, 400);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 premium-shadow p-8 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-50 text-brand-emerald rounded-xl">
          <CreditCard className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold text-gray-900">Visa Settings</h2>
          <p className="text-sm text-gray-500">Configure default Visa application fee in USD ($).</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Visa Fee per person (USD)
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 font-mono">$</span>
            </div>
            <input
              type="number"
              value={visaFee}
              onChange={(e) => setVisaFee(e.target.value)}
              className="block w-full pl-8 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald text-gray-900 font-mono text-lg"
              placeholder="40"
              id="visa-fee-input"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-sm font-medium">USD</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex gap-3 text-emerald-950 text-sm">
          <Globe className="w-5 h-5 text-brand-emerald shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-brand-emerald">Visa calculation method:</span> The Visa USD fee is multiplied by the USD exchange rate to calculate the exact visa cost in Thai Baht (THB) per person.
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          id="save-visa-settings-btn"
          className="w-full flex items-center justify-center gap-2 bg-brand-emerald hover:bg-brand-emerald-light text-white font-medium py-3 px-4 rounded-lg transition duration-250 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Visa Fee
        </button>
      </div>
    </div>
  );
}

// --- TAB 6: MARGIN SETTINGS ---
interface MarginSettingsViewProps {
  settings: GlobalSettings;
  onSave: (updated: GlobalSettings) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function MarginSettingsView({ settings, onSave, showToast }: MarginSettingsViewProps) {
  const [margin, setMargin] = useState<string>(settings.marginTHB.toString());
  const [agentMargin, setAgentMargin] = useState<string>((settings.agentMarginTHB ?? 3000).toString());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMargin(settings.marginTHB.toString());
    setAgentMargin((settings.agentMarginTHB ?? 3000).toString());
  }, [settings]);

  const handleSave = () => {
    const num = parseFloat(margin);
    const agentNum = parseFloat(agentMargin);
    if (isNaN(num) || num < 0 || isNaN(agentNum) || agentNum < 0) {
      showToast('Please enter a valid positive Margin in THB for both Standard and Agent fields', 'error');
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      onSave({
        ...settings,
        marginTHB: num,
        agentMarginTHB: agentNum
      });
      setIsSaving(false);
      showToast('Margin settings saved successfully');
    }, 400);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 premium-shadow p-8 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-50 text-brand-emerald rounded-xl">
          <Percent className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold text-gray-900">Margin Settings</h2>
          <p className="text-sm text-gray-500">Configure global margin added to total cost in Thai Baht (THB).</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Standard Target Profit Margin (THB per quotation)
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 font-mono">฿</span>
            </div>
            <input
              type="number"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              className="block w-full pl-8 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald text-gray-900 font-mono text-lg"
              placeholder="5,000"
              id="margin-input"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-sm font-medium">THB</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agent Target Profit Margin (THB per quotation)
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 font-mono">฿</span>
            </div>
            <input
              type="number"
              value={agentMargin}
              onChange={(e) => setAgentMargin(e.target.value)}
              className="block w-full pl-8 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald text-gray-900 font-mono text-lg"
              placeholder="3,000"
              id="agent-margin-input"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-sm font-medium">THB</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 flex gap-3 text-amber-950 text-xs">
          <Info className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-brand-gold-dark">Round Up Rule Engine:</div>
            <p className="text-gray-600 leading-relaxed">
              Selling Price is automatically calculated as <code className="bg-white px-1 py-0.5 rounded border text-rose-700 font-mono">Total Cost + Margin</code> and then rounded <strong>UP</strong> to the nearest <strong>500 THB</strong>.
            </p>
            <p className="text-gray-600">
              For example, if Total Cost + Margin is 62,120 THB, the quotation price rounds up to 62,500 THB, increasing the net profit.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          id="save-margin-settings-btn"
          className="w-full flex items-center justify-center gap-2 bg-brand-emerald hover:bg-brand-emerald-light text-white font-medium py-3 px-4 rounded-lg transition duration-250 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Margin Settings
        </button>
      </div>
    </div>
  );
}

// --- TAB 7: USERS MANAGEMENT ---
interface UsersManagementViewProps {
  users: User[];
  onAdd: (user: User) => void;
  onUpdate: (user: User) => void;
  onDelete: (id: string) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function UsersManagementView({ users, onAdd, onUpdate, onDelete, showToast }: UsersManagementViewProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'sales'>('sales');

  // Edit user state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'sales'>('sales');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('Please fill out all fields', 'error');
      return;
    }
    if (!email.includes('@')) {
      showToast('Please provide a valid email address', 'error');
      return;
    }

    const payload: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      email: email.trim(),
      role,
      createdAt: new Date().toISOString()
    };

    onAdd(payload);
    showToast(`User "${name}" created successfully`);
    setIsDialogOpen(false);
    setName('');
    setEmail('');
    setRole('sales');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editName.trim() || !editEmail.trim()) {
      showToast('Please fill out all fields', 'error');
      return;
    }
    if (!editEmail.includes('@')) {
      showToast('Please provide a valid email address', 'error');
      return;
    }

    const payload: User = {
      ...editingUser,
      name: editName.trim(),
      email: editEmail.trim(),
      role: editRole
    };

    onUpdate(payload);
    showToast(`User "${editName}" updated successfully`);
    setEditingUser(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 premium-shadow">
        <div>
          <h2 className="text-xl font-display font-semibold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-500">Manage user accounts and allocate roles (Admin or Sales) to control edit permissions.</p>
        </div>
        <button
          onClick={() => setIsDialogOpen(true)}
          id="add-user-btn"
          className="flex items-center gap-2 bg-brand-emerald hover:bg-brand-emerald-light text-white font-medium py-2.5 px-4 rounded-xl transition duration-250 cursor-pointer text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 premium-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider font-display">
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Email Address</th>
                <th className="py-4 px-6">System Role</th>
                <th className="py-4 px-6">Creation Date</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition">
                  <td className="py-4 px-6 font-medium text-gray-950 font-display flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-emerald-50 text-brand-emerald flex items-center justify-center font-bold text-xs uppercase">
                      {u.name.substring(0, 2)}
                    </span>
                    {u.name}
                  </td>
                  <td className="py-4 px-6 font-mono text-gray-600">{u.email}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                      u.role === 'admin'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      <Shield className="w-3 h-3" />
                      {u.role}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-500 font-mono">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setEditName(u.name);
                        setEditEmail(u.email);
                        setEditRole(u.role);
                      }}
                      className="p-1.5 hover:bg-emerald-50 text-gray-500 hover:text-brand-emerald rounded-lg transition mr-1.5 inline-flex items-center"
                      title="Edit User"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {u.email === 'BhutanairlinesTH@gmail.com' ? (
                      <span className="text-xs text-gray-400 italic font-medium pr-2">System Primary Admin</span>
                    ) : (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete user "${u.name}"?`)) {
                            onDelete(u.id);
                            showToast(`Deleted user "${u.name}"`);
                          }
                        }}
                        className="p-1.5 hover:bg-rose-50 text-gray-500 hover:text-rose-600 rounded-lg transition inline-flex items-center"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-md w-full overflow-hidden animate-scale-up">
            <div className="p-6 bg-brand-emerald text-white flex justify-between items-center">
              <h3 className="font-display font-semibold text-lg">Add New User</h3>
              <button onClick={() => setIsDialogOpen(false)} className="text-white hover:text-brand-gold text-2xl leading-none">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">User Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald text-sm"
                  placeholder="e.g. Karma Dorji"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald text-sm font-mono"
                  placeholder="e.g. karma@bhutancenter.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Authorization Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'sales')}
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald text-sm"
                >
                  <option value="sales">Sales (Calculate Quotations Only)</option>
                  <option value="admin">Admin (Manage Pricing Data + Settings)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-emerald hover:bg-brand-emerald-light text-white rounded-lg text-sm font-medium transition cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-md w-full overflow-hidden animate-scale-up">
            <div className="p-6 bg-brand-gold-dark text-white flex justify-between items-center">
              <h3 className="font-display font-semibold text-lg">Edit User Settings</h3>
              <button onClick={() => setEditingUser(null)} className="text-white hover:text-brand-emerald text-2xl leading-none">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">User Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald text-sm"
                  placeholder="e.g. Karma Dorji"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald text-sm font-mono"
                  placeholder="e.g. karma@bhutancenter.com"
                  required
                  disabled={editingUser.email === 'BhutanairlinesTH@gmail.com'}
                />
                {editingUser.email === 'BhutanairlinesTH@gmail.com' && (
                  <p className="text-[10px] text-gray-400 mt-1">The primary system admin email address is locked.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Authorization Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'admin' | 'sales')}
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald text-sm"
                  disabled={editingUser.email === 'BhutanairlinesTH@gmail.com'}
                >
                  <option value="sales">Sales (Calculate Quotations Only)</option>
                  <option value="admin">Admin (Manage Pricing Data + Settings)</option>
                </select>
                {editingUser.email === 'BhutanairlinesTH@gmail.com' && (
                  <p className="text-[10px] text-gray-400 mt-1">Primary admin role cannot be downgraded.</p>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-emerald hover:bg-brand-emerald-light text-white rounded-lg text-sm font-medium transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- TAB 8: DATABASE SCHEMA VIEW (THEMING SATISFACTION FOR "DESIGN PROPER TABLES") ---
export function DatabaseSchemaView() {
  const schemaDefinition = [
    {
      tableName: 'Users',
      type: 'Firestore Document Collection',
      description: 'Stores authorized user profiles, system permissions and emails.',
      fields: [
        { name: 'id', type: 'String (Primary Key)', desc: 'Unique record identifier' },
        { name: 'name', type: 'String', desc: 'Display name of user' },
        { name: 'email', type: 'String (Unique)', desc: 'Sign-in credential (verified email)' },
        { name: 'role', type: 'Enum ("admin" | "sales")', desc: 'System capability permissions' },
        { name: 'createdAt', type: 'Timestamp', desc: 'Automatic system registration stamp' }
      ]
    },
    {
      tableName: 'Hotels',
      type: 'Firestore Document Collection',
      description: 'Holds hotel entities and nested rate structures matching categories.',
      fields: [
        { name: 'id', type: 'String (Primary Key)', desc: 'Unique record identifier' },
        { name: 'name', type: 'String', desc: 'Name of the hotel property in Bhutan' },
        { name: 'category', type: 'Enum ("3 Stars" | "4 Stars" | "5 Stars")', desc: 'Star rating bracket' },
        { name: 'rates.pax1USD', type: 'Double', desc: 'Nightly room cost in USD for 1 passenger' },
        { name: 'rates.pax2USD', type: 'Double', desc: 'Nightly room cost in USD for 2 passengers' },
        { name: 'rates.pax3PlusUSD', type: 'Double', desc: 'Nightly room cost in USD for 3 or more passengers' }
      ]
    },
    {
      tableName: 'Packages',
      type: 'Firestore Document Collection',
      description: 'Maintains tour packages and localized tier-based cost values.',
      fields: [
        { name: 'id', type: 'String (Primary Key)', desc: 'Unique record identifier' },
        { name: 'name', type: 'String', desc: 'Public marketing name of the itinerary' },
        { name: 'nights', type: 'Integer', desc: 'Active travel night count (influences hotel calc)' },
        { name: 'rates.pax1USD', type: 'Double', desc: 'Tour operations cost in USD for 1 passenger' },
        { name: 'rates.pax2USD', type: 'Double', desc: 'Tour operations cost in USD for 2 passengers' },
        { name: 'rates.pax3PlusUSD', type: 'Double', desc: 'Tour operations cost in USD for 3 or more passengers' }
      ]
    },
    {
      tableName: 'GlobalSettings',
      type: 'Firestore Document Single Config',
      description: 'Holds standard operating metrics, airport fees, conversion metrics and margins.',
      fields: [
        { name: 'exchangeRateUSD', type: 'Double', desc: 'USD to THB conversion multiplier (Default: 35)' },
        { name: 'ticketPriceTHB', type: 'Double', desc: 'Flight ticket rate per individual (Default: 26,000 THB)' },
        { name: 'airportTaxTHB', type: 'Double', desc: 'Flight tax per individual (Default: 6,500 THB)' },
        { name: 'visaFeeUSD', type: 'Double', desc: 'Visa application expense (Default: 40 USD)' },
        { name: 'marginTHB', type: 'Double', desc: 'Standard target mark-up in THB (Default: 5,000 THB)' }
      ]
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 premium-shadow">
        <h2 className="text-xl font-display font-semibold text-gray-900">Database Schema Design</h2>
        <p className="text-sm text-gray-500">
          This system uses a structured document-based database configuration. It maps directly to SQL relational designs for 
          <code className="bg-slate-50 border px-1 py-0.5 rounded text-xs font-mono mx-1">Users</code>, 
          <code className="bg-slate-50 border px-1 py-0.5 rounded text-xs font-mono mx-1">Hotels</code>, 
          <code className="bg-slate-50 border px-1 py-0.5 rounded text-xs font-mono mx-1">Packages</code>, and 
          <code className="bg-slate-50 border px-1 py-0.5 rounded text-xs font-mono mx-1">Settings</code>.
        </p>
      </div>

      <div className="space-y-6">
        {schemaDefinition.map((table, index) => (
          <div key={index} className="bg-white rounded-2xl border border-gray-100 premium-shadow overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-brand-emerald to-brand-emerald-light text-white flex justify-between items-center">
              <div>
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-gold" />
                  Table: {table.tableName}
                </h3>
                <p className="text-xs text-emerald-100/90 mt-1">{table.description}</p>
              </div>
              <span className="text-xs bg-white/10 px-2.5 py-1 rounded-full font-mono font-medium">
                {table.type}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-gray-500 font-semibold border-b border-gray-100 text-xs font-display">
                    <th className="py-3 px-5">Field Name</th>
                    <th className="py-3 px-5">Data Type</th>
                    <th className="py-3 px-5">Constraint / Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-sans">
                  {table.fields.map((field, fIdx) => (
                    <tr key={fIdx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-5 font-mono text-xs font-semibold text-brand-emerald">{field.name}</td>
                      <td className="py-3 px-5"><span className="bg-blue-50 text-blue-800 text-[11px] font-mono px-2 py-0.5 rounded">{field.type}</span></td>
                      <td className="py-3 px-5 text-gray-500 text-xs">{field.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- TAB 9: THE CORE PRICING CALCULATION ENGINE AND SALES CARD ---
interface SalesQuotationViewProps {
  settings: GlobalSettings;
  hotels: Hotel[];
  packages: TourPackage[];
  currentUser: User | null;
}

export function SalesQuotationView({ settings, hotels, packages, currentUser }: SalesQuotationViewProps) {
  // Quotation form states
  const [selectedPkgId, setSelectedPkgId] = useState('');
  const [passengerCount, setPassengerCount] = useState<number>(2);
  const [travelDate, setTravelDate] = useState('');
  const [nationality, setNationality] = useState('');
  const [businessUpgradeCount, setBusinessUpgradeCount] = useState<number>(0);
  const [selectedHotelCategory, setSelectedHotelCategory] = useState<HotelCategory>('3 Stars');
  const [isRequestOnly, setIsRequestOnly] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const [customNights, setCustomNights] = useState<number>(7);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [requestNotes, setRequestNotes] = useState('');

  // Auto-clamp business upgrade count when passenger count changes
  useEffect(() => {
    if (businessUpgradeCount > passengerCount) {
      setBusinessUpgradeCount(passengerCount);
    }
  }, [passengerCount, businessUpgradeCount]);

  // Auto-reset request only / submission states when switching back to standard
  useEffect(() => {
    if (selectedPkgId !== 'request_more' && selectedHotelCategory !== '5 Stars') {
      setIsRequestOnly(false);
      setRequestSubmitted(false);
    } else {
      setIsRequestOnly(true);
    }
  }, [selectedPkgId, selectedHotelCategory]);

  // Results state
  const [result, setResult] = useState<QuotationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Customer details and PDF generation states
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [quotationRef, setQuotationRef] = useState('');
  const [quotationDate, setQuotationDate] = useState('');

  const getTravelDateRangeString = () => {
    if (!travelDate) return '';
    const activePkg = packages.find(p => p.id === selectedPkgId);
    const nights = activePkg?.nights || 0;
    
    const startDate = new Date(travelDate);
    const endDate = new Date(travelDate);
    endDate.setDate(startDate.getDate() + nights);

    const startDay = startDate.getDate();
    const startMonth = startDate.toLocaleDateString('th-TH', { month: 'long' });
    const startYear = startDate.toLocaleDateString('th-TH', { year: 'numeric' });

    const endDay = endDate.getDate();
    const endMonth = endDate.toLocaleDateString('th-TH', { month: 'long' });
    const endYear = endDate.toLocaleDateString('th-TH', { year: 'numeric' });

    if (startYear === endYear) {
      if (startMonth === endMonth) {
        return `${startDay} - ${endDay} ${startMonth} ${startYear}`;
      } else {
        return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`;
      }
    } else {
      return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
    }
  };

  // Initialize with sensible defaults once lists load
  useEffect(() => {
    if (packages.length > 0 && !selectedPkgId) {
      setSelectedPkgId(packages[0].id);
    }
  }, [packages]);

  // Run calculation
  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkgId) return;

    setIsCalculating(true);
    
    // Simulate real database-backed pricing engine logic with standard timer
    setTimeout(() => {
      // If it is request-only, set states and stop standard calculation
      if (selectedPkgId === 'request_more' || selectedHotelCategory === '5 Stars') {
        setIsRequestOnly(true);
        setResult(null);
        setIsCalculating(false);
        return;
      }

      const activePkg = packages.find(p => p.id === selectedPkgId);

      if (!activePkg) {
        setIsCalculating(false);
        return;
      }

      const usdRate = settings.exchangeRateUSD;

      // New Hotel Pricing Rules:
      // โรงแรม 3 ดาว:
      // - เดินทาง 1 ท่าน ราคาต่อคืน 250 USD
      // - เดินทาง 2 ท่าน ราคาต่อคืน 200 USD
      // - เดินทาง 3 ท่านขึ้นไป ราคาต่อคืน 180 USD
      // โรงแรม 4 ดาว:
      // - เดินทาง 1 ท่าน ราคาต่อคืน 300 USD
      // - เดินทาง 2 ท่าน ราคาต่อคืน 240 USD
      // - เดินทาง 3 ท่านขึ้นไป ราคาต่อคืน 220 USD
      let usdRatePerNight = 0;
      if (selectedHotelCategory === '3 Stars') {
        const pkgRate = activePkg.hotelRates?.star3 ?? activePkg.rates;
        if (passengerCount === 1) {
          usdRatePerNight = pkgRate?.pax1USD ?? settings.hotel3StarPax1USD ?? 250;
        } else if (passengerCount === 2) {
          usdRatePerNight = pkgRate?.pax2USD ?? settings.hotel3StarPax2USD ?? 200;
        } else {
          usdRatePerNight = pkgRate?.pax3PlusUSD ?? settings.hotel3StarPax3PlusUSD ?? 180;
        }
      } else if (selectedHotelCategory === '4 Stars') {
        const pkgRate = activePkg.hotelRates?.star4;
        if (passengerCount === 1) {
          usdRatePerNight = pkgRate?.pax1USD ?? settings.hotel4StarPax1USD ?? 300;
        } else if (passengerCount === 2) {
          usdRatePerNight = pkgRate?.pax2USD ?? settings.hotel4StarPax2USD ?? 240;
        } else {
          usdRatePerNight = pkgRate?.pax3PlusUSD ?? settings.hotel4StarPax3PlusUSD ?? 220;
        }
      }

      const nights = activePkg.nights;
      const tourUSDTotal = usdRatePerNight * nights;

      // 1. Hotel & Tour package Cost in THB = USD per night * nights * exchange rate
      const tourCostTHB = tourUSDTotal * usdRate;

      // 2. Visa per person = Visa Fee USD * USD Rate
      const visaCostUSD = settings.visaFeeUSD;
      const visaCostTHB = visaCostUSD * usdRate;

      // 3. Air Ticket with 10% Discount if passenger count >= 10
      // If agent is selected, apply the configured Agent Ticket Discount Percent first
      const hasTicketDiscount = passengerCount >= 10;
      const baseTicketPrice = isAgent
        ? settings.ticketPriceTHB * (1 - ((settings.agentTicketDiscountPercent ?? 3) / 100))
        : settings.ticketPriceTHB;
      const ticketCostTHB = hasTicketDiscount ? baseTicketPrice * 0.9 : baseTicketPrice;
      const taxCostTHB = settings.airportTaxTHB;

      // 4. Total Cost per person = Ticket + Airport Tax + Hotel/Tour Cost + Visa
      const baseTotalCostTHB = ticketCostTHB + taxCostTHB + tourCostTHB + visaCostTHB;

      // 5. Selling Price per person = Total Cost per person + Margin
      // If agent is selected, use agentMarginTHB instead of marginTHB
      const appliedMargin = isAgent ? (settings.agentMarginTHB ?? 3000) : settings.marginTHB;
      const baseSellingPrice = baseTotalCostTHB + appliedMargin;

      // 6. Selling Price rounded UP to nearest 500 THB
      const roundedBaseSellingPrice = Math.ceil(baseSellingPrice / 500) * 500;

      // 7. Net profit per person = Rounded Selling Price - Total Cost
      const baseProfit = roundedBaseSellingPrice - baseTotalCostTHB;

      setResult({
        airTicketCost: ticketCostTHB,
        airportTax: taxCostTHB,
        hotelCostUSD: usdRatePerNight,
        hotelCostTHB: usdRatePerNight * nights * usdRate,
        tourCostUSD: tourUSDTotal,
        tourCostTHB,
        visaCostUSD: visaCostUSD,
        visaCostTHB,
        totalCostTHB: baseTotalCostTHB,
        marginTHB: appliedMargin,
        sellingPriceTHB: roundedBaseSellingPrice,
        profitTHB: baseProfit,
        isBusinessUpgrade: businessUpgradeCount > 0,
        businessUpgradeCount,
        businessUpgradeCostTHB: 15000,
        hotelCategory: selectedHotelCategory,
        hasTicketDiscount,
        isAgent
      });

      setIsCalculating(false);
      setIsRequestOnly(false);
    }, 450);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(num);
  };

  const formatUSD = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  };

  const formatThaiBaht = (amount: number): string => {
    const numbers = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    const positions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
    let str = Math.floor(amount).toString();
    let bahtText = '';
    const length = str.length;
    for (let i = 0; i < length; i++) {
      let n = parseInt(str[i]);
      if (n !== 0) {
        let pos = length - 1 - i;
        if (pos > 5) {
          pos = pos % 6;
        }
        if (pos === 1 && n === 1) {
          bahtText += 'สิบ';
        } else if (pos === 1 && n === 2) {
          bahtText += 'ยี่สิบ';
        } else if (pos === 0 && n === 1 && i > 0 && str[i - 1] !== '0') {
          bahtText += 'เอ็ด';
        } else {
          bahtText += numbers[n] + positions[pos];
        }
        if (length - 1 - i === 6) {
          bahtText += 'ล้าน';
        }
      }
    }
    return bahtText ? bahtText + 'บาทถ้วน' : 'ศูนย์บาทถ้วน';
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT: CALCULATOR CARD */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 premium-shadow overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-brand-emerald to-brand-emerald-light text-white flex justify-between items-center">
          <div>
            <h2 className="font-display font-bold text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-brand-gold" />
              Quotation Generator
            </h2>
            <p className="text-xs text-emerald-100 mt-1">Bhutan Center real-time dynamic pricing engine.</p>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-gold text-brand-emerald">
            {currentUser?.role === 'admin' ? 'Admin Mode' : 'Sales Agent'}
          </span>
        </div>

        <form onSubmit={handleCalculate} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">โปรแกรมการเดินทาง (Travel Program / Package)</label>
            <select
              value={selectedPkgId}
              onChange={(e) => setSelectedPkgId(e.target.value)}
              className="block w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald text-sm text-gray-900 font-display font-medium"
              required
            >
              <option value="" disabled>-- เลือกโปรแกรมเดินทาง (Select Itinerary) --</option>
              {packages.map(p => (
                <option key={p.id} value={p.id}>
                  ✈️ {p.name}
                </option>
              ))}
              <option value="request_more">✨ Custom Package</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">จำนวนผู้เดินทาง (Passenger Count)</label>
            <select
              value={passengerCount}
              onChange={(e) => setPassengerCount(parseInt(e.target.value))}
              className="block w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald text-sm text-gray-900 font-medium"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <option key={n} value={n}>
                  {n === 10 ? "10 ท่านขึ้นไป (ส่วนลดตั๋วเครื่องบิน 10%)" : `${n} ท่าน`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">ระดับโรงแรม (Hotel Rating Category)</label>
            <select
              value={selectedHotelCategory}
              onChange={(e) => setSelectedHotelCategory(e.target.value as HotelCategory)}
              className="block w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald text-sm text-gray-900 font-display font-medium"
              required
            >
              <option value="3 Stars">⭐️⭐️⭐️ โรงแรมระดับ 3 ดาว (3 Stars)</option>
              <option value="4 Stars">⭐️⭐️⭐️⭐️ โรงแรมระดับ 4 ดาว (4 Stars)</option>
              <option value="5 Stars">⭐️⭐️⭐️⭐️⭐️ โรงแรมระดับ 5 ดาว (5 Stars - ต้องส่งคำขอพิเศษ / Request Only)</option>
            </select>
          </div>



          {/* BUSINESS CLASS UPGRADE OPTION */}
          <div className="bg-gradient-to-r from-amber-500/5 to-brand-gold/5 border border-brand-gold/20 rounded-xl p-4 mt-2 hover:border-brand-gold/40 transition duration-200">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 font-display font-bold text-gray-900 text-xs">
                  <Plane className="w-4 h-4 text-brand-gold-dark shrink-0 rotate-45" />
                  อัพเกรดเป็นชั้นธุรกิจ (Business Class Upgrade) เพิ่ม +15,000 THB / ท่าน
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center bg-gray-50/50 p-1 rounded-lg border border-gray-100">
                <span className="text-[10px] font-bold text-gray-500 pl-1">จำนวน:</span>
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 shadow-2xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setBusinessUpgradeCount(prev => Math.max(0, prev - 1))}
                    disabled={businessUpgradeCount <= 0}
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-50 border border-transparent hover:border-gray-100 text-gray-600 disabled:opacity-30 disabled:pointer-events-none cursor-pointer font-bold text-sm transition"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-mono font-bold text-gray-800 text-xs">
                    {businessUpgradeCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBusinessUpgradeCount(prev => Math.min(passengerCount, prev + 1))}
                    disabled={businessUpgradeCount >= passengerCount}
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-50 border border-transparent hover:border-gray-100 text-gray-600 disabled:opacity-30 disabled:pointer-events-none cursor-pointer font-bold text-sm transition"
                  >
                    +
                  </button>
                </div>
                <span className="text-[10px] text-gray-400 pr-1">/ {passengerCount} ท่าน</span>
              </div>
            </div>
          </div>

          {/* AGENT PRICING OPTION */}
          <div className="bg-gradient-to-r from-brand-emerald/5 to-emerald-500/5 border border-brand-emerald/20 rounded-xl p-4 mt-2 hover:border-brand-emerald/40 transition duration-200">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="agent-pricing-toggle"
                  checked={isAgent}
                  onChange={(e) => setIsAgent(e.target.checked)}
                  className="w-4.5 h-4.5 rounded text-brand-emerald focus:ring-brand-emerald/30 border-gray-300 cursor-pointer accent-brand-emerald"
                />
                <label htmlFor="agent-pricing-toggle" className="font-display font-bold text-gray-900 text-xs cursor-pointer select-none">
                  ราคาพิเศษสำหรับ Agent (Agent Partner Pricing)
                </label>
              </div>
              <div className="flex items-center gap-1.5 self-start sm:self-center">
                <span className="text-[10px] font-bold text-brand-emerald bg-emerald-100/60 border border-brand-emerald/10 px-2 py-0.5 rounded-full font-mono">
                  ตั๋วลด -{(settings.agentTicketDiscountPercent ?? 3)}%
                </span>
                <span className="text-[10px] font-bold text-brand-emerald bg-emerald-100/60 border border-brand-emerald/10 px-2 py-0.5 rounded-full font-mono">
                  Margin {settings.agentMarginTHB?.toLocaleString() ?? '3,000'} THB
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isCalculating || !selectedPkgId}
            id="calculate-quotation-btn"
            className="w-full flex items-center justify-center gap-2 bg-brand-emerald hover:bg-brand-emerald-light text-white font-semibold py-3 px-4 rounded-xl transition duration-250 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed mt-4 shadow-sm"
          >
            {isCalculating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Recalculating Rates...
              </>
            ) : (
              <>
                <Calculator className="w-5 h-5 text-brand-gold" />
                Generate Quotation
              </>
            )}
          </button>
        </form>
      </div>

      {/* RIGHT: RESULTS DISPLAY */}
      <div className="lg:col-span-7 space-y-6">
        {isRequestOnly ? (
          <div className="bg-white rounded-2xl border border-amber-250 premium-shadow-lg p-8 space-y-6 animate-fade-in">
            <div className="flex items-center gap-4 border-b border-amber-150 pb-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-brand-gold animate-bounce" />
              </div>
              <div>
                <h3 className="text-base font-display font-bold text-gray-900">
                  {selectedHotelCategory === '5 Stars' ? "⭐️ ส่งคำขอราคาพิเศษโรงแรม 5 ดาว (5-Star Special Request)" : "✈️ ส่งคำขอวันเดินทางพิเศษ (Custom Program Request)"}
                </h3>
                <p className="text-xs text-amber-700 font-medium">
                  เนื่องจาก{selectedHotelCategory === '5 Stars' ? " โรงแรม 5 ดาวเป็นโรงแรมระดับลักชัวรี" : " ท่านเลือกขอวันเดินทางนอกเหนือจากโปรแกรมมาตรฐาน"} ระบบไม่สามารถคำนวณราคาแบบสำเร็จรูปได้ กรุณาส่งรีเควส
                </p>
              </div>
            </div>

            {requestSubmitted ? (
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-6 text-center space-y-4 animate-scale-up">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-brand-emerald" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-emerald-900">ส่งข้อมูลคำขอพิเศษสำเร็จแล้ว!</h4>
                  <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
                    ส่งความต้องการไปยังผู้ดูแลระบบภูฏานแอร์ไลน์เรียบร้อยแล้ว เจ้าหน้าที่จะจัดทำราคาสุทธิและติดต่อกลับท่านโดยเร็วที่สุด
                  </p>
                </div>
                <div className="bg-white border border-emerald-200/50 rounded-lg p-3 text-left font-mono text-[10px] space-y-1 inline-block">
                  <p className="text-gray-500">ประเภทรีเควส: <span className="text-gray-900 font-bold">{selectedHotelCategory === '5 Stars' ? "โรงแรม 5 ดาว" : `เดินทางเพิ่มเติม ${customNights} คืน`}</span></p>
                  <p className="text-gray-500">จำนวนผู้เดินทาง: <span className="text-gray-900 font-bold">{passengerCount} ท่าน</span></p>
                  {requestNotes && <p className="text-gray-500">บันทึกเพิ่มเติม: <span className="text-gray-900 font-bold">{requestNotes}</span></p>}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedPkgId === 'request_more' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">ระบุจำนวนคืนที่ต้องการ (Requested Nights)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={6}
                        max={30}
                        value={customNights}
                        onChange={(e) => setCustomNights(parseInt(e.target.value) || 6)}
                        className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-emerald text-xs text-gray-900 font-mono font-bold"
                      />
                      <span className="text-xs text-gray-500 font-medium">คืน (Nights) - เท่ากับเดินทาง {customNights + 1} วัน {customNights} คืน</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">ข้อมูลความต้องการเพิ่มเติม (Special Request Notes) *</label>
                  <textarea
                    rows={3}
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
                    placeholder="เช่น ต้องการพักโรงแรม Taj Tashi Thimphu / ขอห้องพักวิวภูเขา / ขออาหารมังสวิรัติทุกมื้อ"
                    className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald text-xs text-gray-800 font-sans"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!requestNotes.trim()) {
                      alert("กรุณาระบุรายละเอียดคำขอพิเศษ");
                      return;
                    }
                    setRequestSubmitted(true);
                  }}
                  className="w-full bg-brand-gold hover:bg-brand-gold-light text-brand-emerald font-bold py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm text-sm"
                >
                  <Send className="w-4 h-4 text-brand-emerald" />
                  ส่งราคารีเควสไปยังเจ้าหน้าที่ (Submit Request)
                </button>
              </div>
            )}
          </div>
        ) : !result ? (
          <div className="bg-emerald-50/40 border border-dashed border-emerald-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[450px]">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-brand-emerald flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-brand-gold animate-pulse" />
            </div>
            <h3 className="text-lg font-display font-semibold text-gray-900 mb-2">Ready for Calculation</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              เลือกโปรแกรมเดินทาง จำนวนผู้เดินทาง และระดับโรงแรม เพื่อให้ระบบคำนวณราคาสุทธิแบบยืดหยุ่นโดยอัตโนมัติ
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* ACTION CARD FOR CREATING OFFICIAL QUOTATION */}
            <div className="bg-gradient-to-r from-brand-gold/10 to-amber-500/10 border border-brand-gold/30 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 premium-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-emerald shrink-0">
                  <FileText className="w-5 h-5 text-brand-gold-dark" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-gray-900 text-sm">ต้องการสร้างใบเสนอราคาสำหรับลูกค้า?</h4>
                  <p className="text-xs text-gray-500">กรอกข้อมูลผู้ติดต่อเพื่อจัดทำเอกสารใบเสนอราคาอย่างเป็นทางการ (PDF)</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCustomerName('');
                  setCustomerPhone('');
                  setCustomerEmail('');
                  setTravelDate('');
                  setIsCustomerModalOpen(true);
                }}
                className="w-full sm:w-auto bg-brand-emerald hover:bg-brand-emerald-light text-white font-semibold px-5 py-2.5 rounded-xl transition duration-200 text-sm flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-sm"
              >
                สร้างใบเสนอราคา <ArrowRight className="w-4 h-4 text-brand-gold animate-bounce-x" />
              </button>
            </div>

            {/* LARGE SELLING PRICE CARD */}
            <div className="bg-gradient-to-br from-brand-emerald to-emerald-950 text-white rounded-2xl premium-shadow-lg p-6 relative overflow-hidden border border-brand-emerald">
              {/* Golden circular glow styling */}
              <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-brand-gold/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                <div>
                  <span className="text-xs uppercase font-bold tracking-widest text-brand-gold-light block">Standard Price (Per Person / ต่อท่าน)</span>
                  <div className="flex flex-wrap items-center gap-2.5 mt-1">
                    <h3 className="text-4xl font-display font-bold text-white tracking-tight" id="selling-price-display">
                      {formatCurrency(result.sellingPriceTHB)}
                    </h3>
                    <span className="bg-emerald-800 text-emerald-100 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                      Economy Class / ชั้นประหยัด
                    </span>
                  </div>
                  
                  {result.isBusinessUpgrade && (
                    <div className="mt-3 flex items-center gap-2 bg-brand-gold/10 text-brand-gold border border-brand-gold/20 px-3 py-1.5 rounded-xl text-xs w-fit">
                      <Plane className="w-3.5 h-3.5 rotate-45 shrink-0" />
                      <span>อัพเกรดชั้นธุรกิจ <strong>{result.businessUpgradeCount} ท่าน</strong> (เพิ่มท่านละ +{formatCurrency(15000)})</span>
                    </div>
                  )}
                </div>
                
                <div className="text-left md:text-right flex flex-col md:items-end justify-between self-stretch">
                  <div className="bg-brand-gold/10 text-brand-gold-light border border-brand-gold/30 px-3 py-1 rounded-xl text-xs font-mono font-bold w-fit">
                    ROUNDED UP TO 500
                  </div>
                  
                  <div className="mt-4 md:mt-0">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-300 block">Total Group Price / ยอดรวมทั้งกรุ๊ป</span>
                    <p className="text-2xl font-display font-extrabold text-brand-gold mt-0.5">
                      {formatCurrency((result.sellingPriceTHB * passengerCount) + (15000 * (result.businessUpgradeCount || 0)))}
                    </p>
                    <span className="text-[10px] text-emerald-200 block">({passengerCount} ท่าน: ประหยัด {passengerCount - (result.businessUpgradeCount || 0)} ท่าน | ธุรกิจ {result.businessUpgradeCount || 0} ท่าน)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-emerald-800/60 pt-4 text-xs font-medium text-emerald-100">
                <div>
                  <p>Basis: <span className="text-white font-bold">โรงแรมระดับ {result.hotelCategory} ({result.hotelCostUSD} USD/คืน)</span></p>
                  <p className="mt-1">Nights: <span className="text-white font-bold">
                    {packages.find(p => p.id === selectedPkgId)?.nights} คืน / {packages.find(p => p.id === selectedPkgId) ? packages.find(p => p.id === selectedPkgId)!.nights + 1 : 0} วัน
                  </span></p>
                </div>
                <div className="text-right">
                  <p className="mt-1">ตั๋วเครื่องบิน: <span className="text-white font-bold">{result.hasTicketDiscount ? "ส่วนลดพิเศษ 10% 🎉" : "ราคาปกติ"}</span></p>
                </div>
              </div>
            </div>

            {/* EXPENSE SUMMARY CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-100 premium-shadow">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block flex items-center gap-1">
                  Flight Ticket
                  {result.hasTicketDiscount && <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1 rounded font-bold">-10%</span>}
                </span>
                <span className="text-sm font-semibold text-gray-900 block mt-1">{formatCurrency(result.airTicketCost)}</span>
                <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">Per Person</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 premium-shadow">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Airport Tax</span>
                <span className="text-sm font-semibold text-gray-900 block mt-1">{formatCurrency(result.airportTax)}</span>
                <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">Per Person</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 premium-shadow">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Hotel & Tour Cost</span>
                <span className="text-sm font-semibold text-gray-900 block mt-1">{formatCurrency(result.tourCostTHB)}</span>
                <span className="text-[10px] text-brand-emerald font-mono mt-0.5 block">{formatUSD(result.tourCostUSD)} / Person</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 premium-shadow">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Visa Fee</span>
                <span className="text-sm font-semibold text-gray-900 block mt-1">{formatCurrency(result.visaCostTHB)}</span>
                <span className="text-[10px] text-brand-emerald font-mono mt-0.5 block">{formatUSD(result.visaCostUSD)} / Person</span>
              </div>
            </div>

            {/* DETAILED COST SHEET */}
            <div className="bg-white rounded-2xl border border-gray-100 premium-shadow overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-gray-100 font-display font-semibold text-sm text-gray-700 flex justify-between items-center">
                <span>Detailed Pricing Sheet per Person (THB)</span>
                <span className="text-xs font-normal text-gray-400">1 USD = {settings.exchangeRateUSD} THB</span>
              </div>
              
              <div className="p-6 space-y-3 text-sm">
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">
                    Air Ticket (สายการบินภูฏานแอร์ไลน์ ชั้นประหยัด)
                    {result.hasTicketDiscount && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ml-1.5">ลด 10% สำหรับกรุ๊ป 10 ท่านขึ้นไป</span>}
                  </span>
                  <span className="font-mono text-gray-900">{formatCurrency(result.airTicketCost)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">Airport Tax (THB {settings.airportTaxTHB.toLocaleString()} per Person)</span>
                  <span className="font-mono text-gray-900">{formatCurrency(result.airportTax)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">ค่าทริปโรงแรมระดับ {result.hotelCategory} (USD {result.hotelCostUSD}/คืน x {packages.find(p => p.id === selectedPkgId)?.nights} คืน)</span>
                  <span className="font-mono text-gray-900">{formatCurrency(result.tourCostTHB)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">Bhutan Government Entry Visa Fee (USD {result.visaCostUSD} per Person)</span>
                  <span className="font-mono text-gray-900">{formatCurrency(result.visaCostTHB)}</span>
                </div>

                <div className="flex justify-between py-3 border-t border-gray-100 font-semibold text-gray-900 mt-4">
                  <span>Gross Operating Travel Cost (per Person)</span>
                  <span className="font-mono text-brand-emerald">{formatCurrency(result.totalCostTHB)}</span>
                </div>

                <div className="flex justify-between py-2 border-t border-dashed border-gray-100 text-xs text-gray-600 mt-1">
                  <span>{result.isAgent ? "Agent Partner Profit Margin (per Person)" : "Base System Mark-up Margin (per Person)"}</span>
                  <span className="font-mono">{formatCurrency(result.marginTHB)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-dashed border-gray-100 text-xs text-gray-600">
                  <span>Additional Round-Up Surplus Profit (per Person)</span>
                  <span className="font-mono text-emerald-600">+{formatCurrency(result.sellingPriceTHB - result.totalCostTHB - result.marginTHB)}</span>
                </div>

                <div className="flex justify-between py-4 border-t border-gray-100 font-bold text-gray-950 mt-2 bg-emerald-50/40 p-3 rounded-xl">
                  <span className="text-brand-emerald flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-gold" />
                    Net Profit Margin Achieved (per Person)
                  </span>
                  <span className="font-mono text-brand-emerald text-lg" id="profit-margin-display">
                    {formatCurrency(result.profitTHB)}
                  </span>
                </div>

                {/* GROUP SUMMARY CARD AT BOTTOM */}
                <div className="mt-6 pt-5 border-t-2 border-gray-100">
                  <h4 className="font-display font-bold text-gray-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand-gold" />
                    Group Booking Totals & Breakdown (สรุปยอดรวมทั้งกรุ๊ป)
                  </h4>
                  <div className="bg-slate-50 border border-gray-200/60 rounded-xl p-4 space-y-2.5 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>Standard Economy Ticket ({passengerCount - (result.businessUpgradeCount || 0)} ท่าน)</span>
                      <span className="font-mono font-semibold text-gray-900">
                        {passengerCount - (result.businessUpgradeCount || 0)} x {formatCurrency(result.sellingPriceTHB)} = {formatCurrency(result.sellingPriceTHB * (passengerCount - (result.businessUpgradeCount || 0)))}
                      </span>
                    </div>
                    
                    {result.isBusinessUpgrade && (
                      <div className="flex justify-between text-amber-700 font-medium">
                        <span className="flex items-center gap-1">
                          <Plane className="w-3.5 h-3.5 rotate-45 text-brand-gold-dark shrink-0" />
                          Business Class Upgrade ({result.businessUpgradeCount} ท่าน)
                        </span>
                        <span className="font-mono font-semibold">
                          {result.businessUpgradeCount} x {formatCurrency(result.sellingPriceTHB + 15000)} = {formatCurrency((result.sellingPriceTHB + 15000) * (result.businessUpgradeCount || 0))}
                        </span>
                      </div>
                    )}
                    
                    <div className="border-t border-gray-200/80 my-2" />
                    
                    <div className="flex justify-between text-gray-900 font-bold text-sm">
                      <span>Total Invoice Selling Price (ยอดเสนอราคาขายสุทธิ)</span>
                      <span className="font-mono text-brand-emerald">
                        {formatCurrency((result.sellingPriceTHB * passengerCount) + (15000 * (result.businessUpgradeCount || 0)))}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-gray-500 font-medium text-[11px]">
                      <span>Total Group Cost (ต้นทุนสุทธิทั้งกรุ๊ป)</span>
                      <span className="font-mono">
                        {formatCurrency((result.totalCostTHB * passengerCount) + (15000 * (result.businessUpgradeCount || 0)))}
                      </span>
                    </div>

                    <div className="flex justify-between text-brand-emerald font-bold text-[11px] bg-brand-emerald/5 p-2 rounded-lg border border-brand-emerald/10">
                      <span className="flex items-center gap-1">🏆 Total Group Net Profit (กำไรสุทธิรวมทั้งกรุ๊ป)</span>
                      <span className="font-mono">
                        {formatCurrency(result.profitTHB * passengerCount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* CUSTOMER DETAILS MODAL */}
    {isCustomerModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in no-print">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
          <div className="p-6 bg-gradient-to-r from-brand-emerald to-brand-emerald-light text-white">
            <h3 className="text-lg font-display font-bold flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-brand-gold" />
              ข้อมูลลูกค้าสำหรับใบเสนอราคา
            </h3>
            <p className="text-xs text-emerald-100 mt-1">กรอกข้อมูลผู้ติดต่อเพื่อจัดทำเอกสารใบเสนอราคาอย่างเป็นทางการ</p>
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!customerName.trim() || !customerPhone.trim() || !travelDate) return;
            
            // Generate reference number
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const randomNum = Math.floor(100 + Math.random() * 900);
            const refNo = `BT-${dateStr}-${randomNum}`;
            
            setQuotationRef(refNo);
            setQuotationDate(new Date().toLocaleDateString('th-TH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }));
            
            setIsCustomerModalOpen(false);
            setIsPdfPreviewOpen(true);
          }} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">ชื่อลูกค้า (Customer Name) *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="เช่น คุณสมศักดิ์ รักดี"
                  className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">เบอร์โทรศัพท์ (Telephone) *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="เช่น 081-234-5678"
                  className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">วันเดินทาง (Travel Date) *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">อีเมล (Email Address)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="เช่น customer@example.com"
                  className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald"
                />
              </div>
            </div>

            <div className="flex gap-3 border-t border-gray-100 pt-4 mt-6">
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="w-1/2 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold py-2.5 px-4 rounded-xl text-sm transition duration-200 cursor-pointer text-center"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="w-1/2 bg-brand-emerald hover:bg-brand-emerald-light text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition duration-200 cursor-pointer shadow-sm text-center"
              >
                ตกลงและออกเอกสาร
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* PDF PREVIEW MODAL */}
    {isPdfPreviewOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in no-print">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-scale-up">
          {/* Modal Actions Header */}
          <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-gold" />
              <span className="font-display font-semibold text-sm">ใบเสนอราคาอย่างเป็นทางการ (Official Quotation Preview)</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="bg-brand-gold hover:bg-brand-gold-light text-brand-emerald font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition duration-200 cursor-pointer animate-pulse"
              >
                <Printer className="w-4 h-4" />
                พิมพ์ / บันทึกเป็น PDF
              </button>
              <button
                onClick={() => setIsPdfPreviewOpen(false)}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-xl text-xs transition duration-200 cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>

          {/* Scrollable Document Container */}
          <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center">
            {/* The Actual Printable Document A4 Frame */}
            <div 
              id="printable-quotation" 
              className="bg-white text-gray-900 p-12 w-[210mm] min-h-[297mm] shadow-lg border border-gray-200 relative font-sans text-xs leading-relaxed"
            >
              {/* Print layout inject style helper */}
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #printable-quotation, #printable-quotation * {
                    visibility: visible;
                  }
                  #printable-quotation {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 210mm;
                    height: 297mm;
                    box-shadow: none !important;
                    border: none !important;
                    padding: 10mm !important;
                    margin: 0 !important;
                    background: white !important;
                    color: black !important;
                  }
                }
              `}} />

              {/* Header Section */}
              <div className="flex justify-between items-start border-b-2 border-brand-emerald pb-6 mb-6">
                <div className="flex gap-4">
                  <BhutanCenterLogo size="md" className="self-start" />
                  <div>
                    <h1 className="text-base font-bold text-brand-emerald font-display">ภูฏานเซ็นเตอร์ (Bhutan Center)</h1>
                    <p className="text-[10px] font-bold text-brand-gold-dark font-display -mt-0.5">Bhutan Center affiliated with OMG Experience</p>
                    <div className="mt-2 text-[10px] text-gray-500 space-y-0.5">
                      <p>10/12-13 ถนนคอนแวนต์ แขวงสีลม เขตบางรัก กรุงเทพมหานคร 10500</p>
                      <p>Tel : 02-630-4500 | Email: info@omgexp.com</p>
                      <p>เลขประจำตัวผู้เสียภาษีอากร 0105556088127 สำนักงานใหญ่</p>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <h2 className="text-2xl font-bold font-display text-brand-emerald tracking-wide">ใบเสนอราคา</h2>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest -mt-0.5">Quotation</h3>
                  
                  <div className="mt-4 grid grid-cols-2 gap-x-2 text-[10px] text-right">
                    <span className="text-gray-400">เลขที่ใบเสนอราคา / No:</span>
                    <span className="font-mono font-semibold text-gray-900">{quotationRef}</span>
                    <span className="text-gray-400">วันที่ออกเอกสาร / Date:</span>
                    <span className="font-semibold text-gray-900">{quotationDate}</span>
                    <span className="text-gray-400">ผู้จัดเตรียม / Agent:</span>
                    <span className="font-semibold text-gray-900">{currentUser?.name || 'Bhutan Center Rep'}</span>
                  </div>
                </div>
              </div>

              {/* Client / Customer Info Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                  <h4 className="text-[10px] uppercase font-bold text-brand-emerald-light tracking-wide mb-1">ข้อมูลผู้รับบริการ / Client Info</h4>
                  <p className="text-sm font-semibold text-gray-900">{customerName}</p>
                  <p className="text-gray-600">เบอร์โทรศัพท์: <span className="font-mono text-gray-900">{customerPhone}</span></p>
                  {customerEmail && <p className="text-gray-600">อีเมล: <span className="font-mono text-gray-900">{customerEmail}</span></p>}
                </div>
                <div className="space-y-1 text-right border-l border-gray-200/60 pl-4">
                  <h4 className="text-[10px] uppercase font-bold text-brand-emerald-light tracking-wide mb-1">รายละเอียดทริป / Travel Details</h4>
                  <p className="text-gray-700">แพ็กเกจทัวร์: <span className="font-semibold text-gray-900">{packages.find(p => p.id === selectedPkgId)?.name}</span></p>
                  <p className="text-gray-700">จำนวนคืนทริป: <span className="font-semibold text-gray-900">{packages.find(p => p.id === selectedPkgId)?.nights} คืน ({packages.find(p => p.id === selectedPkgId) ? packages.find(p => p.id === selectedPkgId)!.nights + 1 : 0} วัน)</span></p>
                  <p className="text-gray-700">จำนวนผู้เดินทาง: <span className="font-bold text-gray-900">{passengerCount} ท่าน (Pax)</span></p>
                  {travelDate && (
                    <p className="text-gray-700">
                      วันเดินทาง: <span className="font-bold text-brand-emerald">{getTravelDateRangeString()}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Tour Package Itemized Details Table */}
              <table className="w-full text-left border-collapse border border-gray-200 mb-6 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-brand-emerald text-white text-[10px] uppercase font-bold tracking-wider font-display">
                    <th className="py-3 px-4 border border-brand-emerald w-10 text-center">ลำดับ<br/>(No.)</th>
                    <th className="py-3 px-4 border border-brand-emerald">รายการบริการการเดินทาง<br/>(Travel Service Description)</th>
                    <th className="py-3 px-4 border border-brand-emerald w-28 text-center">จำนวนผู้เดินทาง<br/>(Qty)</th>
                    <th className="py-3 px-4 border border-brand-emerald w-32 text-right">ราคาต่อท่าน<br/>(Price / Pax)</th>
                    <th className="py-3 px-4 border border-brand-emerald w-36 text-right">ยอดรวม (THB)<br/>(Total)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-4 px-4 border border-gray-200 text-center font-mono">1</td>
                    <td className="py-4 px-4 border border-gray-200">
                      <p className="font-bold text-brand-emerald text-sm mb-2">{packages.find(p => p.id === selectedPkgId)?.name} ({packages.find(p => p.id === selectedPkgId)?.nights} คืน / {packages.find(p => p.id === selectedPkgId) ? packages.find(p => p.id === selectedPkgId)!.nights + 1 : 0} วัน)</p>
                      <p className="text-[10px] font-bold text-gray-700 mb-1">ราคารวม (Inclusions):</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0.5 text-gray-500 text-[10px] leading-normal font-sans">
                        <p>1. ตั๋วเครื่องบิน ไป-กลับ Bhutan Airlines (ชั้นประหยัด) {result.hasTicketDiscount && <span className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.2 rounded text-[9px]">(ส่วนลดกลุ่ม 10%)</span>}</p>
                        <p>2. ที่พักโรงแรมมาตรฐานระดับ <span className="font-semibold text-brand-emerald">{result.hotelCategory === '3 Stars' ? '3 ดาว' : '4 ดาว'}</span></p>
                        <p>3. มื้ออาหารทุกมื้อ (เช้า/เย็นที่โรงแรม, กลางวันร้านท้องถิ่น)</p>
                        <p>4. ไกด์ท้องถิ่นสื่อสารภาษาอังกฤษ ร่วมเดินทางตลอดทริป</p>
                        <p>5. ค่าภาษีพัฒนาประเทศยั่งยืนของรัฐบาลภูฏาน (SDF)</p>
                        <p>6. ค่าธรรมเนียมเข้าชมสถานที่และอุทยานตามโปรแกรม</p>
                        <p>7. ค่าธรรมเนียมการยื่นขอวีซ่า (Visa) ประเทศภูฏาน</p>
                        <p>8. รถรับส่งและนำเที่ยวส่วนตัวตลอดรายการท่องเที่ยว</p>
                        <p>9. โปรแกรมการเดินทางและสถานที่ท่องเที่ยวที่ระบุ</p>
                        <p>10. บริการรับ-ส่ง สะดวกสบาย ณ สนามบินพาโร</p>
                        <p>11. ประกันภัยการเดินทางต่างประเทศแบบระบุวันเดินทาง</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 border border-gray-200 text-center font-mono font-semibold">{passengerCount} ท่าน</td>
                    <td className="py-4 px-4 border border-gray-200 text-right font-mono font-semibold text-gray-900">
                      {formatCurrency(result.sellingPriceTHB)}
                    </td>
                    <td className="py-4 px-4 border border-gray-200 text-right font-mono font-bold text-brand-emerald">
                      {formatCurrency(result.sellingPriceTHB * passengerCount)}
                    </td>
                  </tr>
 
                  {result.isBusinessUpgrade && (
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-4 px-4 border border-gray-200 text-center font-mono">2</td>
                      <td className="py-4 px-4 border border-gray-200">
                        <p className="font-bold text-brand-emerald text-sm">บริการอัพเกรดชั้นโดยสารชั้นธุรกิจ (Bhutan Airlines Business Class Upgrade)</p>
                        <ul className="mt-1.5 space-y-1 text-gray-500 text-[10px] pl-4 list-disc">
                          <li>อัพเกรดระดับที่นั่งชั้นธุรกิจ (Sky Class) เที่ยวบินไป-กลับ กรุงเทพฯ-พาโร-กรุงเทพฯ</li>
                          <li>การบริการอาหารชั้นเยี่ยม เครื่องดื่มพรีเมียม สิทธิ์ขึ้นเครื่องก่อน และน้ำหนักสัมภาระเพิ่มเป็นพิเศษ</li>
                        </ul>
                      </td>
                      <td className="py-4 px-4 border border-gray-200 text-center font-mono font-semibold">{result.businessUpgradeCount} ท่าน</td>
                      <td className="py-4 px-4 border border-gray-200 text-right font-mono font-semibold text-gray-900">
                        {formatCurrency(15000)}
                      </td>
                      <td className="py-4 px-4 border border-gray-200 text-right font-mono font-bold text-brand-emerald">
                        {formatCurrency(15000 * (result.businessUpgradeCount || 0))}
                      </td>
                    </tr>
                  )}
                  
                  {/* Empty spacers */}
                  <tr className="h-28 text-slate-300">
                    <td className="border border-gray-200"></td>
                    <td className="border border-gray-200"></td>
                    <td className="border border-gray-200"></td>
                    <td className="border border-gray-200"></td>
                    <td className="border border-gray-200"></td>
                  </tr>
                </tbody>
              </table>
 
              {/* Calculation and Total section */}
              <div className="grid grid-cols-12 gap-4 mb-8">
                {/* Thai Baht text representation */}
                <div className="col-span-7 bg-slate-50 p-4 rounded-xl border border-gray-100 flex items-center justify-center text-center">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">จำนวนเงินตัวอักษร / Thai Baht Written</p>
                    <p className="text-xs font-bold text-brand-emerald mt-1 bg-white border border-gray-200/60 px-4 py-2 rounded-lg inline-block">
                      ({formatThaiBaht((result.sellingPriceTHB * passengerCount) + (15000 * (result.businessUpgradeCount || 0)))})
                    </p>
                  </div>
                </div>
 
                {/* Summary Totals */}
                <div className="col-span-5 space-y-1.5 text-right font-medium">
                  <div className="flex justify-between text-gray-500 py-1">
                    <span>ราคาแพ็กเกจเฉลี่ยต่อท่าน / Base Rate:</span>
                    <span className="font-mono text-gray-900 font-semibold">{formatCurrency(result.sellingPriceTHB)}</span>
                  </div>
                  {result.isBusinessUpgrade && (
                    <div className="flex justify-between text-amber-700 py-1">
                      <span>อัพเกรดชั้นธุรกิจ ({result.businessUpgradeCount} ท่าน):</span>
                      <span className="font-mono font-semibold">+{formatCurrency(15000 * (result.businessUpgradeCount || 0))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-500 py-1">
                    <span>จำนวนผู้เดินทาง / Total Passengers:</span>
                    <span className="font-mono text-gray-900 font-semibold">× {passengerCount} ท่าน</span>
                  </div>
                  <div className="flex justify-between border-t border-brand-emerald pt-3 font-bold text-brand-emerald text-sm bg-emerald-50/40 p-3 rounded-xl mt-2">
                    <span>ยอดสุทธิทั้งสิ้น / Net Total:</span>
                    <span className="font-mono text-lg text-brand-emerald" id="pdf-total-display">
                      {formatCurrency((result.sellingPriceTHB * passengerCount) + (15000 * (result.businessUpgradeCount || 0)))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions / Guarantee */}
              <div className="border-t border-gray-200 pt-6 grid grid-cols-2 gap-8 text-[10px] text-gray-500">
                <div>
                  <h5 className="font-bold text-gray-700 uppercase tracking-wide mb-2">เงื่อนไขการจองและการรับประกัน / Terms & Conditions</h5>
                  <ul className="space-y-1 pl-4 list-decimal">
                    <li>ราคานี้รวมค่าใช้จ่ายจำเป็นทั้งหมดสำหรับการเดินทางเข้าภูฏานครบวงจรแล้ว</li>
                    <li>เอกสารใบเสนอราคานี้มีระยะเวลาสอดคล้องกับมาตรฐานความพร้อมของเที่ยวบินและห้องพัก</li>
                    <li>ผู้เดินทางจำเป็นต้องส่งหนังสือเดินทางพร้อมรูปถ่ายเพื่อยื่นขอวีซ่าล่วงหน้าอย่างน้อย 14 วัน</li>
                    <li>ค่าบริการทัวร์อาจมีการปรับเปลี่ยนเล็กน้อยตามมาตรฐานประกาศระดับชาติของประเทศภูฏาน</li>
                  </ul>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="flex flex-col justify-between h-24 border border-dashed border-gray-200 rounded-xl p-2 bg-slate-50/30">
                    <span className="text-[9px] uppercase font-bold text-gray-400">ลงชื่อ ผู้ขอรับบริการ / Client</span>
                    <div className="border-b border-gray-300 w-3/4 mx-auto pb-1 font-semibold text-gray-800 font-display">
                      {customerName}
                    </div>
                    <span className="text-[9px] text-gray-400">วันที่ / Date: .........................</span>
                  </div>
                  <div className="flex flex-col justify-between h-24 border border-dashed border-brand-gold/30 rounded-xl p-2 bg-slate-50/30">
                    <span className="text-[9px] uppercase font-bold text-brand-emerald">ผู้เสนอราคา / Agent Authorization</span>
                    <div className="border-b border-brand-gold/40 w-3/4 mx-auto pb-1 font-semibold text-brand-emerald font-display">
                      {currentUser?.name || 'Bhutan Center Rep'}
                    </div>
                    <span className="text-[9px] text-brand-emerald">Bhutan Center Representative</span>
                  </div>
                </div>
              </div>

              {/* Golden/Emerald footer badge */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-[9px] text-gray-300 font-mono">
                Thank you for choosing Bhutan Center. Let us guide your spiritual path to the Kingdom of Happiness.
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  );
}

// --- TAB: MAIN DASHBOARD SUMMARY TAB FOR ADMIN ---
interface AdminDashboardOverviewProps {
  hotels: Hotel[];
  packages: TourPackage[];
  settings: GlobalSettings;
  users: User[];
  setActiveTab: (tab: string) => void;
}

export function AdminDashboardOverview({ hotels, packages, settings, users, setActiveTab }: AdminDashboardOverviewProps) {
  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-brand-emerald via-emerald-900 to-brand-emerald-light p-8 rounded-3xl border border-brand-emerald text-white premium-shadow relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-brand-gold/15 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-xl space-y-3">
          <span className="text-xs uppercase tracking-widest text-brand-gold font-bold">Bhutan Center SaaS Control Panel</span>
          <h2 className="text-3xl font-display font-semibold text-white tracking-tight">System Pricing Hub</h2>
          <p className="text-emerald-100/90 text-sm leading-relaxed font-sans">
            Welcome to the centralized pricing and margins administration system. Adjust exchange rates, edit flight ticket costs, and verify real-time margins here.
          </p>
        </div>
      </div>

      {/* QUICK STATUS METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 premium-shadow flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">USD Conversion Rate</span>
            <span className="text-2xl font-mono font-semibold text-gray-900 block">฿{settings.exchangeRateUSD} THB</span>
          </div>
          <div className="p-3.5 bg-amber-50 text-brand-gold rounded-2xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 premium-shadow flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Active Packages</span>
            <span className="text-2xl font-display font-bold text-gray-900 block">{packages.length} Itineraries</span>
          </div>
          <div className="p-3.5 bg-emerald-50 text-brand-emerald rounded-2xl">
            <Map className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 premium-shadow flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Staff Users</span>
            <span className="text-2xl font-display font-bold text-gray-900 block">{users.length} Accounts</span>
          </div>
          <div className="p-3.5 bg-emerald-50 text-brand-emerald rounded-2xl">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* CORE CONFIGURATION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* TRAVEL AND AIRPORT MATRIX */}
        <div className="bg-white rounded-2xl border border-gray-100 premium-shadow p-6">
          <h3 className="font-display font-semibold text-lg text-gray-950 mb-4 flex items-center gap-2">
            <Plane className="w-5 h-5 text-brand-gold" />
            Flight & Operating Expenses
          </h3>
          <div className="divide-y divide-gray-100 text-sm space-y-4">
            <div className="flex justify-between py-2 items-center">
              <div>
                <p className="font-medium text-gray-900">Air Ticket Price</p>
                <p className="text-xs text-gray-500">Per individual passenger</p>
              </div>
              <span className="font-mono font-semibold text-gray-950 bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl">
                ฿{settings.ticketPriceTHB.toLocaleString()} THB
              </span>
            </div>
            <div className="flex justify-between py-2 items-center pt-4">
              <div>
                <p className="font-medium text-gray-900">Airport Tax Fee</p>
                <p className="text-xs text-gray-500">Added flight taxes per passenger</p>
              </div>
              <span className="font-mono font-semibold text-gray-950 bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl">
                ฿{settings.airportTaxTHB.toLocaleString()} THB
              </span>
            </div>
            <div className="flex justify-between py-2 items-center pt-4">
              <div>
                <p className="font-medium text-gray-900">Visa Application Fee</p>
                <p className="text-xs text-gray-500">Bhutanese visa processing USD</p>
              </div>
              <span className="font-mono font-semibold text-gray-950 bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl">
                ${settings.visaFeeUSD} USD
              </span>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={() => setActiveTab('flight')}
              className="w-full flex items-center justify-center gap-1.5 border border-brand-emerald text-brand-emerald hover:bg-brand-emerald hover:text-white font-medium py-2.5 px-4 rounded-xl text-sm transition cursor-pointer"
            >
              Modify Operations Fees
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SYSTEM RECONCILIATION SETTINGS */}
        <div className="bg-white rounded-2xl border border-gray-100 premium-shadow p-6">
          <h3 className="font-display font-semibold text-lg text-gray-950 mb-4 flex items-center gap-2">
            <Percent className="w-5 h-5 text-brand-gold" />
            Profit Margin Control
          </h3>
          <div className="space-y-4">
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
              <span className="text-xs text-brand-emerald font-semibold uppercase tracking-wider block">Standard Mark-up Margin</span>
              <span className="text-2xl font-mono font-bold text-emerald-950 block mt-1">฿{settings.marginTHB.toLocaleString()} THB</span>
              <p className="text-xs text-gray-500 mt-1">Flat margin added directly onto cost calculations before the rounding operation.</p>
            </div>

            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 text-xs text-amber-950">
              <span className="font-semibold text-brand-gold-dark block mb-1">Selling Price Rule Engine:</span>
              Automatically round final Selling Price UP to the nearest 500 THB. This guarantees consistent, clean figures for invoicing and protects profit ratios.
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={() => setActiveTab('margin')}
              className="w-full flex items-center justify-center gap-1.5 border border-brand-emerald text-brand-emerald hover:bg-brand-emerald hover:text-white font-medium py-2.5 px-4 rounded-xl text-sm transition cursor-pointer"
            >
              Configure Target Margin
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sparkle element just for visual flourish
