"use client";

import React from "react";
import { Circle, Wifi, WifiOff } from "lucide-react";
import { useNetworkStatus, NetworkQuality } from "@/lib/useNetworkStatus";

interface RealTimeStatusIndicatorProps {
  callStatus?: string;
  isCalling?: boolean;
}

export default function RealTimeStatusIndicator({ callStatus, isCalling }: RealTimeStatusIndicatorProps) {
  const { quality, online } = useNetworkStatus();

  const getColor = () => {
    if (!online) return "text-red-500 bg-red-100";
    switch (quality) {
      case NetworkQuality.EXCELLENT:
        return "text-green-600 bg-green-100";
      case NetworkQuality.GOOD:
        return "text-blue-600 bg-blue-100";
      case NetworkQuality.FAIR:
        return "text-yellow-600 bg-yellow-100";
      case NetworkQuality.POOR:
        return "text-orange-600 bg-orange-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${getColor()} border border-white`}> 
        {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
      </div>
      <div className="text-left">
        <div className="text-xs font-semibold text-gray-800">{isCalling ? (callStatus || 'Calling') : 'Idle'}</div>
        <div className="text-[11px] text-gray-500">{online ? quality.toString().toLowerCase() : 'offline'}</div>
      </div>
    </div>
  );
}
