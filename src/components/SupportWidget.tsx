import React, { useEffect } from 'react';

declare global {
  interface Window {
    $crisp: any;
    CRISP_WEBSITE_ID: string;
  }
}

const SupportWidget: React.FC = () => {
  useEffect(() => {
    // Only load if ID is present
    const crispId = import.meta.env.VITE_CRISP_WEBSITE_ID;
    if (!crispId) return;

    window.$crisp = [];
    window.CRISP_WEBSITE_ID = crispId;

    (function () {
      const d = document;
      const s = d.createElement('script');
      s.src = 'https://client.crisp.chat/l.js';
      s.async = true;
      d.getElementsByTagName('head')[0].appendChild(s);
    })();
  }, []);

  return null; // Renderless component
};

export default SupportWidget;
