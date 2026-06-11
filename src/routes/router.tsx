import React, { Suspense } from "react";
import { Route, Routes } from "react-router";
import { authRoutes, publicRoutes } from "./router.link";
import Feature from "./feature";
import AuthFeature from "./authFeature";

// Premium Centered Loader Component
const PageLoader: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      zIndex: 9999,
      flexDirection: 'column',
      fontFamily: 'sans-serif'
    }}>
      <div className="custom-loader" style={{
        width: '50px',
        height: '50px',
        border: '5px solid #f3f3f3',
        borderTop: '5px solid #e41f07', // Noris primary red color
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <p style={{ marginTop: '15px', color: '#555', fontSize: '14px', fontWeight: 500 }}>Loading Page...</p>
    </div>
  );
};

const ALLRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Feature />}>
          {publicRoutes.map((route, idx) => (
            <Route path={route.path} element={route.element} key={idx} />
          ))}
        </Route>
        <Route element={<AuthFeature />}>
          {authRoutes.map((route, idx) => (
            <Route path={route.path} element={route.element} key={idx} />
          ))}
        </Route>
      </Routes>
    </Suspense>
  );
};

export default ALLRoutes;
