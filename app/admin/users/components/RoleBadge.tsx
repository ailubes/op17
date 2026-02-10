import { ROLE_CONFIG, type RoleName } from "@/lib/permissions";

interface RoleBadgeProps {
  role: RoleName | string;
  size?: "sm" | "md";
}

export function RoleBadge({ role, size = "sm" }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role as RoleName] ?? {
    label: role,
    color: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    description: "",
  };

  const sizeClasses = size === "sm"
    ? "text-xs px-2 py-0.5"
    : "text-sm px-3 py-1";

  return (
    <span
      className={`inline-flex items-center rounded border ${config.color} ${sizeClasses} font-medium uppercase tracking-wider`}
      title={config.description}
    >
      {config.label}
    </span>
  );
}

interface RoleSelectProps {
  value: string[];
  onChange: (roles: string[]) => void;
  disabled?: boolean;
}

const AVAILABLE_ROLES: { value: RoleName; label: string; description: string }[] = [
  { value: "ADMIN", label: "Admin", description: "Full access to all features" },
  { value: "MANAGER", label: "Manager", description: "Can manage products, orders, and content" },
  { value: "FULFILLMENT", label: "Fulfillment", description: "Can manage orders and inventory" },
  { value: "SUPPORT", label: "Support", description: "Can view orders and add notes" },
];

export function RoleSelect({ value, onChange, disabled }: RoleSelectProps) {
  const toggleRole = (role: string) => {
    if (value.includes(role)) {
      onChange(value.filter((r) => r !== role));
    } else {
      onChange([...value, role]);
    }
  };

  return (
    <div className="space-y-2">
      {AVAILABLE_ROLES.map((role) => (
        <label
          key={role.value}
          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            value.includes(role.value)
              ? "border-gold bg-gold/5"
              : "border-white/10 bg-slate-800/50 hover:border-white/20"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input
            type="checkbox"
            checked={value.includes(role.value)}
            onChange={() => toggleRole(role.value)}
            disabled={disabled}
            className="mt-1 w-4 h-4 rounded border-white/20 bg-slate-800 text-gold focus:ring-gold focus:ring-offset-0"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{role.label}</span>
              {value.includes(role.value) && (
                <RoleBadge role={role.value} size="sm" />
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1">{role.description}</p>
          </div>
        </label>
      ))}
    </div>
  );
}
