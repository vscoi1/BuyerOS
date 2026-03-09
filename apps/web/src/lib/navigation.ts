import {
  Activity,
  Building2,
  Calculator,
  ClipboardList,
  Gauge,
  House,
  RadioTower,
  SearchCheck,
  UserRound,
} from "lucide-react";

export const dashboardNav = [
  { href: "/overview", label: "Overview", icon: Gauge },
  { href: "/clients", label: "Clients", icon: UserRound },
  { href: "/properties", label: "Properties", icon: House },
  { href: "/off-market", label: "Off-Market", icon: Building2 },
  { href: "/whisper", label: "Whisper Network", icon: RadioTower },
  { href: "/intelligence", label: "Intelligence", icon: SearchCheck },
  { href: "/analysis", label: "Analysis", icon: Calculator },
  { href: "/compliance", label: "Compliance", icon: ClipboardList },
  { href: "/activity", label: "Activity", icon: Activity },
];
