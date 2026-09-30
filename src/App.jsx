import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import OverviewView from './components/OverviewView';
import C1_DistributeCreation from './components/capabilities/C1_DistributeCreation';
import C2_ControlPublication from './components/capabilities/C2_ControlPublication';
import C3_ReviewProcess from './components/capabilities/C3_ReviewProcess';
import C4_AIDrafting from './components/capabilities/C4_AIDrafting';
import C5_DataCategories from './components/capabilities/C5_DataCategories';
import C6_Data360Index from './components/capabilities/C6_Data360Index';
import C7_Analytics from './components/capabilities/C7_Analytics';
import C8_Archival from './components/capabilities/C8_Archival';

export default function App() {
  return (
    <Layout>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<OverviewView />} />
          <Route path="/capabilities/distribute" element={<C1_DistributeCreation />} />
          <Route path="/capabilities/publish" element={<C2_ControlPublication />} />
          <Route path="/capabilities/review" element={<C3_ReviewProcess />} />
          <Route path="/capabilities/ai-drafting" element={<C4_AIDrafting />} />
          <Route path="/capabilities/categories" element={<C5_DataCategories />} />
          <Route path="/capabilities/data360" element={<C6_Data360Index />} />
          <Route path="/capabilities/analytics" element={<C7_Analytics />} />
          <Route path="/capabilities/archival" element={<C8_Archival />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </ErrorBoundary>
    </Layout>
  );
}
