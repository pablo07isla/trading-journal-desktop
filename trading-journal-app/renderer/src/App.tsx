import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import TradeLog from "@/pages/TradeLog";
import Settings from "@/pages/Settings";
import { TradingAccounts } from "@/pages/TradingAccounts";
import { Strategies } from "@/pages/Strategies";
import Layout from "@/components/layout/Layout";
import "./App.css";

const App: React.FC = () => (
  <HashRouter>
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="trades" element={<TradeLog />} />
        <Route path="accounts" element={<TradingAccounts />} />
        <Route path="strategies" element={<Strategies />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  </HashRouter>
);

export default App;
