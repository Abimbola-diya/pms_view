'use client';

import React from 'react';
import MapViewRealistic from './MapViewRealistic';
import { Node, Flow } from '@/types';

interface MapViewProps {
  nodes: Node[];
  flows: Flow[];
}

export default function MapView({ nodes, flows }: MapViewProps) {
  return <MapViewRealistic nodes={nodes} flows={flows} />;
}
