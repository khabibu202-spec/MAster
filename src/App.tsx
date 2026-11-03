import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Shell } from "./components/layout/Shell";
import { ToastProvider } from "./contexts/ToastContext";
import { DataProvider, useData } from "./contexts/DataContext";
import { GoogleDriveProvider } from "./contexts/GoogleDriveContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import Rooms from "./pages/Rooms";
import Maintenance from "./pages/Maintenance";
import Reports from "./pages/Reports";
import Consumables from "./pages/Consumables";
import Borrowing from "./pages/Borrowing";
import Procurement from "./pages/Procurement";
import Mutation from "./pages/Mutation";
import Stocktake from "./pages/Stocktake";
import Depreciation from "./pages/Depreciation";
import Disposal from "./pages/Disposal";
import Settings from "./pages/Settings";
import ConnectedClients from "./pages/ConnectedClients";
import SystemLogs from "./pages/SystemLogs";
import PortalPeminjaman from "./pages/PortalPeminjaman";
import CetakBukti from "./pages/CetakBukti";
import SchoolMap from "./pages/SchoolMap";
import AssetUsageStatus from "./pages/AssetUsageStatus";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/portal-peminjaman" replace />;
  return <>{children}</>;
}

import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/assets" element={<PageTransition><Assets /></PageTransition>} />
        <Route path="/rooms" element={<PageTransition><Rooms /></PageTransition>} />
        <Route path="/school-map" element={<PageTransition><SchoolMap /></PageTransition>} />
        <Route path="/asset-status" element={<PageTransition><AssetUsageStatus /></PageTransition>} />
        <Route path="/consumables" element={<PageTransition><Consumables /></PageTransition>} />
        <Route path="/procurement" element={<PageTransition><Procurement /></PageTransition>} />
        <Route path="/borrowing" element={<PageTransition><Borrowing /></PageTransition>} />
        <Route path="/mutation" element={<PageTransition><Mutation /></PageTransition>} />
        <Route path="/maintenance" element={<PageTransition><Maintenance /></PageTransition>} />
        <Route path="/stocktake" element={<PageTransition><Stocktake /></PageTransition>} />
        <Route path="/depreciation" element={<PageTransition><Depreciation /></PageTransition>} />
        <Route path="/disposal" element={<PageTransition><Disposal /></PageTransition>} />
        <Route path="/active-sessions" element={<PageTransition><ConnectedClients /></PageTransition>} />
        <Route path="/system-logs" element={<PageTransition><SystemLogs /></PageTransition>} />
        <Route path="/reports" element={<PageTransition><Reports /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}

function AppHead() {
  const { schoolProfile } = useData();

  React.useEffect(() => {
    if (schoolProfile.nama) {
      document.title = `SIM Sarpras - ${schoolProfile.nama}`;
    }

    const icon = schoolProfile.logoAplikasi || schoolProfile.logoSekolah || "/icon.svg";
    if (icon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = icon;
    }
  }, [schoolProfile.nama, schoolProfile.logoAplikasi, schoolProfile.logoSekolah]);

  return null;
}

import { PwaMobileInstall } from "./components/PwaMobileInstall";

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <GoogleDriveProvider>
              <AppHead />
              <HashRouter>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/portal-peminjaman" element={<PortalPeminjaman />} />
                  <Route path="/cetak-bukti/:id" element={<CetakBukti />} />
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <Shell>
                          <AnimatedRoutes />
                        </Shell>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
                <PwaMobileInstall />
              </HashRouter>
            </GoogleDriveProvider>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
