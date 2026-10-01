import React from 'react';
import { ParsedRoute, buildPath } from './routes';
import { UnifiedDashboard } from './components/UnifiedDashboard';
import { AgentRateSheetRoute, FrontOffice } from './components/FrontOffice';
import { CustomerTrackingWorkspace } from './components/CustomerTracking';
import { Admin } from './components/Admin';
import { MarketingOverviewPage } from './modules/marketing/MarketingPages';
import { QuotationListPage } from './modules/quotations/QuotationListPage';
import { QuotationDetailPage } from './modules/quotations/QuotationDetailPage';
import { BookingListPage } from './modules/bookings/BookingListPage';
import { InvoiceListPage } from './modules/invoices/InvoiceListPage';
import { InvoiceDetailPage } from './modules/invoices/InvoiceDetailPage';
import { PaymentListPage } from './modules/payments/PaymentListPage';
import { PaymentDetailPage } from './modules/payments/PaymentDetailPage';
import { AgentsPage } from './modules/master/AgentsPage';
import { DocumentNumbersPage } from './modules/master/DocumentNumbersPage';
import {
  CreateSystemUserInput, CustomerTracking, GlobalSettings, Hotel, PaymentInvoice, PaymentTransaction, QuotationRecord, TourPackage, User,
} from './types';

export interface AppWorkspaceProps {
  route: ParsedRoute;
  navigate: (path: string) => void;
  currentUser: User;
  settings: GlobalSettings;
  hotels: Hotel[];
  packages: TourPackage[];
  users: User[];
  trackings: CustomerTracking[];
  invoices: PaymentInvoice[];
  payments: PaymentTransaction[];
  quotations: QuotationRecord[];
  databaseMode: 'supabase' | 'local';
  onLogout: () => void;
  onRefresh: () => Promise<void>;
  onSaveSettings: (v: GlobalSettings) => Promise<void>;
  onUploadLogo: (file: File) => Promise<string>;
  onResetLogo: () => Promise<void>;
  onSaveHotel: (v: Hotel) => Promise<void>;
  onDeleteHotel: (id: string) => Promise<void>;
  onSavePackage: (v: TourPackage) => Promise<void>;
  onDeletePackage: (id: string) => Promise<void>;
  onCreateUser: (v: CreateSystemUserInput) => Promise<User>;
  onSaveUser: (v: User) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onSaveTracking: (v: CustomerTracking) => Promise<void>;
  onDeleteTracking: (id: string) => Promise<void>;
  onSaveQuotation: (v: QuotationRecord) => Promise<void>;
  onDeleteQuotation: (id: string) => Promise<void>;
  onSaveInvoice: (v: PaymentInvoice) => Promise<void>;
  onDeleteInvoice: (id: string) => Promise<void>;
  onSavePayment: (v: PaymentTransaction) => Promise<void>;
  onDeletePayment: (id: string) => Promise<void>;
  onUploadPaymentSlip: (trackingId: string, paymentId: string, file: File) => Promise<{ path: string; fileName: string; mimeType: string; size: number }>;
  onGetPaymentSlipUrl: (path: string) => Promise<string>;
  onDeletePaymentSlip: (path: string) => Promise<void>;
}

function masterPageFromModule(module: ParsedRoute['module']) {
  if (module === 'packages') return 'packages' as const;
  if (module === 'pricing-settings') return 'settings' as const;
  if (module === 'company') return 'company' as const;
  if (module === 'users') return 'users' as const;
  return 'settings' as const;
}

export function AppWorkspace(props: AppWorkspaceProps) {
  const { route, navigate } = props;
  const q = props.quotations.find((x) => x.id === route.id);

  if (route.module === 'dashboard') {
    return (
      <UnifiedDashboard
        currentUser={props.currentUser}
        trackings={props.trackings}
        quotations={props.quotations}
        onOpenPricing={() => navigate(buildPath('quotations', 'new'))}
        onOpenTracking={() => navigate(buildPath('bookings'))}
        onOpenGrowth={() => navigate('/admin/marketing')}
        onOpenAdmin={() => navigate(buildPath('pricing-settings'))}
        onLogout={props.onLogout}
      />
    );
  }

  if (route.module === 'quotations') {
    if (route.id === 'agent-rate-sheet') {
      return (
        <AgentRateSheetRoute
          settings={props.settings}
          packages={props.packages}
          onBack={() => navigate(buildPath('quotations'))}
        />
      );
    }
    if (route.id === 'new') {
      return (
        <FrontOffice
          embedded
          settings={props.settings}
          packages={props.packages}
          currentUser={props.currentUser}
          onSaveQuotation={props.onSaveQuotation}
          onSaved={(id) => navigate(buildPath('quotations', id))}
          onOpenDashboard={() => navigate(buildPath('quotations'))}
          onOpenTracking={() => navigate(buildPath('bookings'))}
          onOpenAdmin={() => navigate(buildPath('pricing-settings'))}
          onLogout={props.onLogout}
        />
      );
    }
    if (route.id && route.action === 'edit' && q) {
      return (
        <FrontOffice
          embedded
          initialQuotation={q}
          settings={props.settings}
          packages={props.packages}
          currentUser={props.currentUser}
          onSaveQuotation={props.onSaveQuotation}
          onSaved={(id) => navigate(buildPath('quotations', id))}
          onOpenDashboard={() => navigate(buildPath('quotations', q.id))}
          onOpenTracking={() => navigate(buildPath('bookings'))}
          onOpenAdmin={() => navigate(buildPath('pricing-settings'))}
          onLogout={props.onLogout}
        />
      );
    }
    if (route.id && q) {
      return (
        <QuotationDetailPage
          quotation={q}
          onBack={() => navigate(buildPath('quotations'))}
          onEditPricing={() => navigate(buildPath('quotations', q.id, 'edit'))}
          onConvert={() => navigate(buildPath('bookings', q.convertedTrackingId || 'new'))}
        />
      );
    }
    return (
      <QuotationListPage
        quotations={props.quotations}
        onOpen={(id) => navigate(buildPath('quotations', id))}
        onCreate={() => navigate(buildPath('quotations', 'new'))}
        onOpenAgentRateSheet={() => navigate(buildPath('quotations', 'agent-rate-sheet'))}
      />
    );
  }

  if (route.module === 'bookings') {
    if (route.id === 'new') {
      return (
        <CustomerTrackingWorkspace
          embeddedMode="detail"
          detailId="new"
          settings={props.settings}
          packages={props.packages}
          users={props.users}
          currentUser={props.currentUser}
          trackings={props.trackings}
          invoices={props.invoices}
          payments={props.payments}
          quotations={props.quotations}
          onSaveQuotation={props.onSaveQuotation}
          onDeleteQuotation={props.onDeleteQuotation}
          onBack={() => navigate(buildPath('bookings'))}
          onOpenAdmin={() => navigate(buildPath('pricing-settings'))}
          onLogout={props.onLogout}
          onSaveTracking={props.onSaveTracking}
          onDeleteTracking={props.onDeleteTracking}
          onSaveInvoice={props.onSaveInvoice}
          onDeleteInvoice={props.onDeleteInvoice}
          onSavePayment={props.onSavePayment}
          onDeletePayment={props.onDeletePayment}
          onUploadPaymentSlip={props.onUploadPaymentSlip}
          onGetPaymentSlipUrl={props.onGetPaymentSlipUrl}
          onDeletePaymentSlip={props.onDeletePaymentSlip}
          onOpenInvoiceDoc={(id) => navigate(buildPath('invoices', id))}
          onOpenPaymentDoc={(id) => navigate(buildPath('payments', id))}
        />
      );
    }
    if (route.id) {
      return (
        <CustomerTrackingWorkspace
          embeddedMode="detail"
          detailId={route.id}
          settings={props.settings}
          packages={props.packages}
          users={props.users}
          currentUser={props.currentUser}
          trackings={props.trackings}
          invoices={props.invoices}
          payments={props.payments}
          quotations={props.quotations}
          onSaveQuotation={props.onSaveQuotation}
          onDeleteQuotation={props.onDeleteQuotation}
          onBack={() => navigate(buildPath('bookings'))}
          onOpenAdmin={() => navigate(buildPath('pricing-settings'))}
          onLogout={props.onLogout}
          onSaveTracking={props.onSaveTracking}
          onDeleteTracking={async (id) => { await props.onDeleteTracking(id); navigate(buildPath('bookings')); }}
          onSaveInvoice={props.onSaveInvoice}
          onDeleteInvoice={props.onDeleteInvoice}
          onSavePayment={props.onSavePayment}
          onDeletePayment={props.onDeletePayment}
          onUploadPaymentSlip={props.onUploadPaymentSlip}
          onGetPaymentSlipUrl={props.onGetPaymentSlipUrl}
          onDeletePaymentSlip={props.onDeletePaymentSlip}
          onOpenInvoiceDoc={(id) => navigate(buildPath('invoices', id))}
          onOpenPaymentDoc={(id) => navigate(buildPath('payments', id))}
        />
      );
    }
    return (
      <BookingListPage
        trackings={props.trackings}
        onOpen={(id) => navigate(buildPath('bookings', id))}
        onCreate={() => navigate(buildPath('bookings', 'new'))}
      />
    );
  }

  if (route.module === 'invoices') {
    const inv = props.invoices.find((x) => x.id === route.id);
    const invTracking = inv ? props.trackings.find((t) => t.id === inv.trackingId) : undefined;
    if (route.id && inv && invTracking) {
      return (
        <InvoiceDetailPage
          invoice={inv}
          tracking={invTracking}
          settings={props.settings}
          invoices={props.invoices}
          payments={props.payments}
          onBack={() => navigate(buildPath('invoices'))}
          onOpenBooking={(id) => navigate(buildPath('bookings', id))}
          onOpenPayment={(id) => navigate(buildPath('payments', id))}
          onOpenLinkedInvoice={(id) => navigate(buildPath('invoices', id))}
          onSaveTracking={props.onSaveTracking}
          onSaveInvoice={props.onSaveInvoice}
          onSavePayment={props.onSavePayment}
          onUploadPaymentSlip={props.onUploadPaymentSlip}
        />
      );
    }
    return (
      <InvoiceListPage
        invoices={props.invoices}
        trackings={props.trackings}
        onOpenInvoice={(id) => navigate(buildPath('invoices', id))}
        onOpenBooking={(id) => navigate(buildPath('bookings', id))}
      />
    );
  }

  if (route.module === 'payments') {
    const pay = props.payments.find((x) => x.id === route.id);
    const payTracking = pay ? props.trackings.find((t) => t.id === pay.trackingId) : undefined;
    if (route.id && pay && payTracking) {
      return (
        <PaymentDetailPage
          payment={pay}
          tracking={payTracking}
          invoices={props.invoices}
          onBack={() => navigate(buildPath('payments'))}
          onOpenBooking={(id) => navigate(buildPath('bookings', id))}
          onOpenInvoice={(id) => navigate(buildPath('invoices', id))}
          onGetPaymentSlipUrl={props.onGetPaymentSlipUrl}
        />
      );
    }
    return (
      <PaymentListPage
        payments={props.payments}
        trackings={props.trackings}
        invoices={props.invoices}
        onOpenPayment={(id) => navigate(buildPath('payments', id))}
        onOpenBooking={(id) => navigate(buildPath('bookings', id))}
        onOpenInvoice={(id) => navigate(buildPath('invoices', id))}
      />
    );
  }

  if (route.module === 'reports') {
    return (
      <Admin
        embedded
        masterPage="dashboard"
        settings={props.settings}
        hotels={props.hotels}
        packages={props.packages}
        users={props.users}
        trackings={props.trackings}
        invoices={props.invoices}
        payments={props.payments}
        currentUser={props.currentUser}
        mode={props.databaseMode}
        onBack={() => navigate('/admin')}
        onOpenTracking={() => navigate(buildPath('bookings'))}
        onLogout={props.onLogout}
        onRefresh={props.onRefresh}
        onSaveSettings={props.onSaveSettings}
        onUploadLogo={props.onUploadLogo}
        onResetLogo={props.onResetLogo}
        onSaveHotel={props.onSaveHotel}
        onDeleteHotel={props.onDeleteHotel}
        onSavePackage={props.onSavePackage}
        onDeletePackage={props.onDeletePackage}
        onCreateUser={props.onCreateUser}
        onSaveUser={props.onSaveUser}
        onDeleteUser={props.onDeleteUser}
      />
    );
  }

  if (route.module === 'agents') return <AgentsPage detailId={route.id} onNavigate={navigate} />;
  if (route.module === 'document-numbers') return <DocumentNumbersPage />;

  if (['packages', 'pricing-settings', 'company', 'users'].includes(route.module)) {
    return (
      <Admin
        embedded
        masterPage={masterPageFromModule(route.module)}
        settings={props.settings}
        hotels={props.hotels}
        packages={props.packages}
        users={props.users}
        trackings={props.trackings}
        invoices={props.invoices}
        payments={props.payments}
        currentUser={props.currentUser}
        mode={props.databaseMode}
        onBack={() => navigate('/admin')}
        onOpenTracking={() => navigate(buildPath('bookings'))}
        onLogout={props.onLogout}
        onRefresh={props.onRefresh}
        onSaveSettings={props.onSaveSettings}
        onUploadLogo={props.onUploadLogo}
        onResetLogo={props.onResetLogo}
        onSaveHotel={props.onSaveHotel}
        onDeleteHotel={props.onDeleteHotel}
        onSavePackage={props.onSavePackage}
        onDeletePackage={props.onDeletePackage}
        onCreateUser={props.onCreateUser}
        onSaveUser={props.onSaveUser}
        onDeleteUser={props.onDeleteUser}
        detailId={route.id}
        onNavigate={navigate}
      />
    );
  }

  if (route.module === 'marketing') {
    return (
      <MarketingOverviewPage
        currentUser={props.currentUser}
        packages={props.packages}
        trackings={props.trackings}
        quotations={props.quotations}
        onBack={() => navigate('/admin')}
        onLogout={props.onLogout}
      />
    );
  }

  return null;
}
