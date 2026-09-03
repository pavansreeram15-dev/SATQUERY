import React, { useState } from 'react';
import { WMSTileLayer } from 'react-leaflet';
import { useMapContext } from '../../context/MapContext';
import { usePersona } from '../../context/PersonaContext';
import { BHUVAN_LAYERS_CONFIG } from '../../config/mapConfig';

export const BhuvanLayer: React.FC = () => {
  const { layers } = useMapContext();
  const { persona } = usePersona();

  if (!layers) return null;

  // Determine which Bhuvan layers are active
  const activeBhuvanConfigs = BHUVAN_LAYERS_CONFIG.filter((cfg) => {
    if (!cfg.allowedPersonas.includes(persona)) return false;
    if (cfg.id === 'bhuvanLulc' && layers.bhuvanLulc) return true;
    if (cfg.id === 'bhuvanFlood' && layers.bhuvanFlood) return true;
    if (cfg.id === 'bhuvanWasteland' && layers.bhuvanWasteland) return true;
    if (cfg.id === 'bhuvanGeomorph' && layers.bhuvanGeomorph) return true;
    return false;
  });

  if (activeBhuvanConfigs.length === 0) return null;

  return (
    <>
      {activeBhuvanConfigs.map((cfg) => (
        <WMSTileLayer
          key={cfg.id}
          url={cfg.serviceUrl}
          attribution={cfg.attribution || 'ISRO Bhuvan'}
          params={{
            layers: cfg.layerName,
            format: 'image/png',
            transparent: true,
            version: '1.3.0',
          }}
        />
      ))}
    </>
  );
};
